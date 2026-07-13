import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import {
  DRAFT_BUDGET,
  computeDraftResult,
  equalWeightAllocations,
  findDraftWindows,
  getDraftFormatConfig,
  portfolioFinalValue,
} from '@signal-or-noise/game-engine';
import type { DraftFormat, DraftPoolEntry, DraftWindow } from '@signal-or-noise/game-engine';
import {
  createPortfolioDraftSchema,
  getCurrentPortfolioDraftSchema,
  getDraftHistorySchema,
  getPortfolioDraftSchema,
  submitDraftSelectionSchema,
} from './contracts';
import type {
  CompletedDraftPayload,
  CurrentDraftPayload,
  DraftCardPayload,
  DraftEraPayload,
  RunOwner,
} from './contracts';
import { DatabaseDomainError } from './errors';
import {
  decimalToNumber as number,
  ownerWhere,
  parseInput,
  resolveOwner,
  shuffled,
  withSerializableRetry,
} from './serviceUtils';
import type { TransactionClient } from './serviceUtils';
import { captureDraftSnapshot, parseDraftSnapshot } from './draftSnapshot';

type DraftFormatValue = 'classic' | 'quick' | 'era';

export type DraftLeaderboardMetric = {
  finalValue: number;
  gapFromOptimal: number;
  completedAt: Date;
};

/** D055 best-result ordering: value, gap, then earliest completion. */
export function isBetterDraftLeaderboardResult(
  candidate: DraftLeaderboardMetric,
  current: DraftLeaderboardMetric | null,
): boolean {
  if (!current) return true;
  return candidate.finalValue > current.finalValue + 1e-9
    || (Math.abs(candidate.finalValue - current.finalValue) <= 1e-9
      && (candidate.gapFromOptimal < current.gapFromOptimal - 1e-9
        || (Math.abs(candidate.gapFromOptimal - current.gapFromOptimal) <= 1e-9
          && candidate.completedAt.getTime() < current.completedAt.getTime())));
}

type DraftRecord = {
  id: string;
  userId: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  isOfficial: boolean;
  format: DraftFormatValue;
  eraId: string | null;
  windowStart: Date;
  windowEnd: Date;
  scenarioIds: unknown;
  scenarioSnapshot: unknown;
  selectedScenarioIds: unknown;
  allocations: unknown;
  budget: Prisma.Decimal | number;
  finalValue: Prisma.Decimal | number | null;
  optimalScenarioIds: unknown;
  optimalAllocations: unknown;
  optimalValue: Prisma.Decimal | number | null;
  guestSession: { clientSessionId: string } | null;
};

const DRAFT_SELECT = {
  id: true,
  userId: true,
  status: true,
  isOfficial: true,
  format: true,
  eraId: true,
  windowStart: true,
  windowEnd: true,
  scenarioIds: true,
  scenarioSnapshot: true,
  selectedScenarioIds: true,
  allocations: true,
  budget: true,
  finalValue: true,
  optimalScenarioIds: true,
  optimalAllocations: true,
  optimalValue: true,
  guestSession: { select: { clientSessionId: true } },
} as const;

function assertDraftOwner(draft: DraftRecord, owner: RunOwner): void {
  const owns = owner.kind === 'user'
    ? draft.userId === owner.userId
    : draft.guestSession?.clientSessionId === owner.guestSessionId;
  if (!owns) throw new DatabaseDomainError('FORBIDDEN', 'Draft does not belong to this owner');
}

function parseIdList(value: unknown, expected: number, label: string): string[] {
  if (
    !Array.isArray(value)
    || value.length !== expected
    || value.some((entry) => typeof entry !== 'string' || entry.length === 0)
  ) {
    throw new DatabaseDomainError('INVALID_STATE', `${label} snapshot is invalid`);
  }
  return value as string[];
}

function parseAllocationList(value: unknown, expected: number, label: string): number[] | null {
  if (value === null || value === undefined) return null;
  if (
    !Array.isArray(value)
    || value.length !== expected
    || value.some((entry) => typeof entry !== 'number' || !Number.isInteger(entry))
  ) {
    throw new DatabaseDomainError('INVALID_STATE', `${label} allocations are invalid`);
  }
  return value as number[];
}

/** Pre-decision-safe label: years only, no outcome-period dates. */
function windowLabel(windowStart: Date, windowEnd: Date): string {
  const startYear = windowStart.toISOString().slice(0, 4);
  const endYear = windowEnd.toISOString().slice(0, 4);
  return startYear === endYear ? startYear : `${startYear}–${endYear}`;
}

function asDraftFormat(value: DraftFormatValue): DraftFormat {
  return value;
}

function allocationValue(budget: number, allocationPercent: number, actualReturnPercent: number): number {
  return Math.max(0, budget * allocationPercent / 100 * (1 + actualReturnPercent));
}

export class PortfolioDraftService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly random: () => number = Math.random,
  ) {}

  async listEras(): Promise<DraftEraPayload[]> {
    const eras = await this.prisma.era.findMany({
      where: { scenarios: { some: { status: 'active', variants: { some: { difficulty: 'medium' } } } } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
    const eligible: DraftEraPayload[] = [];
    for (const era of eras) {
      try {
        await this.pickDraftPool(this.prisma, 'era', era.id);
        eligible.push(era);
      } catch (error) {
        if (!(error instanceof DatabaseDomainError) || error.code !== 'INVALID_STATE') throw error;
      }
    }
    return eligible;
  }

  /** Starts a new immutable solo Draft snapshot. */
  async createDraft(input: unknown): Promise<CurrentDraftPayload> {
    const parsed = parseInput(() => createPortfolioDraftSchema.parse(input));
    const format: DraftFormatValue = parsed.format ?? 'classic';
    const draftId = await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const owner = await resolveOwner(tx, parsed.owner);
        await tx.portfolioDraft.updateMany({
          where: {
            ...(owner.userId !== null
              ? { userId: owner.userId }
              : { guestSessionId: owner.guestSessionId }),
            status: 'in_progress',
          },
          data: { status: 'abandoned' },
        });
        const pool = await this.pickDraftPool(tx, format, parsed.eraId);
        const scenarioSnapshot = await captureDraftSnapshot(tx, pool.scenarioIds);
        const draft = await tx.portfolioDraft.create({
          data: {
            ...owner,
            format,
            eraId: parsed.eraId ?? null,
            windowStart: new Date(`${pool.windowStart}T00:00:00.000Z`),
            windowEnd: new Date(`${pool.windowEnd}T00:00:00.000Z`),
            scenarioIds: pool.scenarioIds,
            scenarioSnapshot,
            budget: DRAFT_BUDGET,
          },
          select: { id: true },
        });
        return draft.id;
      }, { isolationLevel: 'Serializable' }),
      'Draft creation conflicted – try again',
    );
    const payload = await this.getDraft({ owner: parsed.owner, draftId });
    if (payload.status !== 'in_progress') throw new DatabaseDomainError('INVALID_STATE', 'Draft is not in progress');
    return payload;
  }

  private async pickDraftPool(
    tx: TransactionClient,
    format: DraftFormatValue,
    eraId?: string,
  ): Promise<{ scenarioIds: string[]; windowStart: string; windowEnd: string }> {
    const config = getDraftFormatConfig(asDraftFormat(format));
    const candidates = await tx.scenario.findMany({
      where: {
        status: 'active',
        variants: { some: { difficulty: 'medium' } },
        ...(format === 'era' ? { eraId } : {}),
      },
      select: { id: true, decisionDate: true, endDate: true, companyName: true },
    });
    const companyByScenario = new Map(candidates.map((candidate) => [candidate.id, candidate.companyName]));
    const windows = findDraftWindows(candidates.map((candidate) => ({
      scenarioId: candidate.id,
      decisionDate: candidate.decisionDate.toISOString().slice(0, 10),
      endDate: candidate.endDate.toISOString().slice(0, 10),
    })), config.poolSize);
    for (const window of shuffled(windows, this.random)) {
      const picks = this.pickDistinctCompanies(window, companyByScenario, config.poolSize);
      if (!picks) continue;
      const chosen = candidates.filter((candidate) => picks.includes(candidate.id));
      return {
        scenarioIds: picks,
        windowStart: chosen.reduce((max, candidate) => {
          const date = candidate.decisionDate.toISOString().slice(0, 10);
          return date > max ? date : max;
        }, chosen[0].decisionDate.toISOString().slice(0, 10)),
        windowEnd: chosen.reduce((min, candidate) => {
          const date = candidate.endDate.toISOString().slice(0, 10);
          return date < min ? date : min;
        }, chosen[0].endDate.toISOString().slice(0, 10)),
      };
    }
    throw new DatabaseDomainError('INVALID_STATE', `Not enough compatible scenarios for a ${format} Draft`);
  }

  private pickDistinctCompanies(
    window: DraftWindow,
    companyByScenario: Map<string, string>,
    count: number,
  ): string[] | null {
    const picks: string[] = [];
    const seenCompanies = new Set<string>();
    for (const scenarioId of shuffled(window.scenarioIds, this.random)) {
      const company = companyByScenario.get(scenarioId);
      if (!company || seenCompanies.has(company)) continue;
      seenCompanies.add(company);
      picks.push(scenarioId);
      if (picks.length === count) return picks;
    }
    return null;
  }

  async getCurrentDraft(input: unknown): Promise<CurrentDraftPayload | null> {
    const parsed = parseInput(() => getCurrentPortfolioDraftSchema.parse(input));
    const draft = await this.prisma.portfolioDraft.findFirst({
      where: { ...ownerWhere(parsed.owner), status: 'in_progress' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!draft) return null;
    const payload = await this.getDraft({ owner: parsed.owner, draftId: draft.id });
    return payload.status === 'in_progress' ? payload : null;
  }

  async listHistory(input: unknown): Promise<Array<{
    id: string;
    format: DraftFormatValue;
    finalValue: number;
    gapFromOptimal: number;
    completedAt: string;
  }>> {
    const parsed = parseInput(() => getDraftHistorySchema.parse(input));
    const drafts = await this.prisma.portfolioDraft.findMany({
      where: { userId: parsed.userId, isOfficial: true, status: 'completed', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: parsed.limit,
      select: { id: true, format: true, finalValue: true, optimalValue: true, completedAt: true },
    });
    return drafts.map((draft) => ({
      id: draft.id,
      format: draft.format,
      finalValue: number(draft.finalValue ?? 0),
      gapFromOptimal: number(draft.optimalValue ?? 0) - number(draft.finalValue ?? 0),
      completedAt: draft.completedAt!.toISOString(),
    }));
  }

  async getDraft(input: unknown): Promise<CurrentDraftPayload | CompletedDraftPayload> {
    const parsed = parseInput(() => getPortfolioDraftSchema.parse(input));
    const draft = await this.prisma.portfolioDraft.findUnique({ where: { id: parsed.draftId }, select: DRAFT_SELECT });
    if (!draft) throw new DatabaseDomainError('NOT_FOUND', 'Draft not found');
    assertDraftOwner(draft, parsed.owner);
    if (draft.status === 'abandoned') throw new DatabaseDomainError('INVALID_STATE', 'Draft was abandoned');
    return draft.status === 'in_progress'
      ? this.buildCurrentDraftPayload(draft)
      : this.buildCompletedDraftPayload(draft);
  }

  /** Locks one selection and calculates all scores inside one serializable transaction. */
  async submitSelections(input: unknown): Promise<CompletedDraftPayload> {
    const parsed = parseInput(() => submitDraftSelectionSchema.parse(input));
    await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const draft = await tx.portfolioDraft.findUnique({ where: { id: parsed.draftId }, select: DRAFT_SELECT });
        if (!draft) throw new DatabaseDomainError('NOT_FOUND', 'Draft not found');
        assertDraftOwner(draft, parsed.owner);
        if (draft.status !== 'in_progress') throw new DatabaseDomainError('CONFLICT', 'Draft picks were already locked');
        const config = getDraftFormatConfig(asDraftFormat(draft.format));
        const scenarioIds = parseIdList(draft.scenarioIds, config.poolSize, 'Draft');
        if (parsed.slots.length !== config.picks) {
          throw new DatabaseDomainError('INVALID_INPUT', `Choose exactly ${config.picks} companies`);
        }
        const selectedIds = parsed.slots.map((slot) => scenarioIds[slot]);
        const snapshot = parseDraftSnapshot(draft.scenarioSnapshot, config.poolSize);
        const pool: DraftPoolEntry[] = snapshot.map((scenario) => ({ scenarioId: scenario.scenarioId, actualReturnPercent: scenario.actualReturnPercent }));
        const result = computeDraftResult(pool, selectedIds, {
          allocations: parsed.allocations,
          format: asDraftFormat(draft.format),
        });
        const completedAt = new Date();
        const locked = await tx.portfolioDraft.updateMany({
          where: { id: draft.id, status: 'in_progress' },
          data: {
            status: 'completed',
            selectedScenarioIds: result.selectedScenarioIds,
            allocations: result.selectedAllocations,
            finalValue: result.finalValue,
            optimalScenarioIds: result.optimalScenarioIds,
            optimalAllocations: result.optimalAllocations,
            optimalValue: result.optimalValue,
            completedAt,
          },
        });
        if (locked.count !== 1) throw new DatabaseDomainError('CONFLICT', 'Draft picks were already locked');
        if (draft.isOfficial && draft.userId) {
          await this.updateSoloLeaderboard(tx, {
            userId: draft.userId,
            draftId: draft.id,
            format: asDraftFormat(draft.format),
            finalValue: result.finalValue,
            gapFromOptimal: result.gapFromOptimal,
            completedAt,
          });
        }
      }, { isolationLevel: 'Serializable' }),
      'Draft picks were already locked',
    );
    const payload = await this.getDraft({ owner: parsed.owner, draftId: parsed.draftId });
    if (payload.status !== 'completed') throw new DatabaseDomainError('INVALID_STATE', 'Draft did not complete');
    return payload;
  }

  private async updateSoloLeaderboard(
    tx: TransactionClient,
    input: { userId: string; draftId: string; format: DraftFormat; finalValue: number; gapFromOptimal: number; completedAt: Date },
  ): Promise<void> {
    const current = await tx.draftLeaderboardEntry.findUnique({
      where: { userId_format: { userId: input.userId, format: input.format } },
    });
    const better = isBetterDraftLeaderboardResult(input, current ? {
      finalValue: number(current.finalValue),
      gapFromOptimal: number(current.gapFromOptimal),
      completedAt: current.completedAt,
    } : null);
    if (!better) return;
    if (current) {
      await tx.draftLeaderboardEntry.update({
        where: { id: current.id },
        data: {
          draftId: input.draftId,
          finalValue: input.finalValue,
          gapFromOptimal: input.gapFromOptimal,
          completedAt: input.completedAt,
        },
      });
    } else {
      await tx.draftLeaderboardEntry.create({
        data: {
          userId: input.userId,
          draftId: input.draftId,
          format: input.format,
          finalValue: input.finalValue,
          gapFromOptimal: input.gapFromOptimal,
          completedAt: input.completedAt,
        },
      });
    }
  }

  private async buildCurrentDraftPayload(draft: DraftRecord): Promise<CurrentDraftPayload> {
    const config = getDraftFormatConfig(asDraftFormat(draft.format));
    const scenarioIds = parseIdList(draft.scenarioIds, config.poolSize, 'Draft');
    const snapshot = parseDraftSnapshot(draft.scenarioSnapshot, config.poolSize);
    const cards: DraftCardPayload[] = snapshot.map((scenario, slot) => {
      return {
        slot,
        title: scenario.title,
        decisionDateLabel: scenario.decisionDateLabel,
        holdingPeriodLabel: scenario.holdingPeriodLabel,
        companyDescription: scenario.companyDescription, macroContext: scenario.macroContext,
        situation: scenario.situation, longCase: scenario.longCase, shortCase: scenario.shortCase,
        setupHints: scenario.setupHints, lookbackChart: scenario.lookbackChart,
      };
    });
    return {
      id: draft.id,
      status: 'in_progress',
      isOfficial: draft.isOfficial,
      format: draft.format,
      eraId: draft.eraId,
      budget: number(draft.budget),
      windowLabel: windowLabel(draft.windowStart, draft.windowEnd),
      cards,
    };
  }

  private async buildCompletedDraftPayload(draft: DraftRecord): Promise<CompletedDraftPayload> {
    const config = getDraftFormatConfig(asDraftFormat(draft.format));
    const scenarioIds = parseIdList(draft.scenarioIds, config.poolSize, 'Draft');
    const selectedIds = parseIdList(draft.selectedScenarioIds, config.picks, 'Draft selection');
    const optimalIds = parseIdList(draft.optimalScenarioIds, config.picks, 'Draft optimal');
    const allocations = parseAllocationList(draft.allocations, config.picks, 'Draft');
    const optimalAllocations = parseAllocationList(draft.optimalAllocations, config.picks, 'Draft optimal');
    const snapshot = parseDraftSnapshot(draft.scenarioSnapshot, config.poolSize);
    const byId = new Map(snapshot.map((scenario) => [scenario.scenarioId, scenario]));
    const budget = number(draft.budget);
    const companies = scenarioIds.map((scenarioId, slot) => {
      const scenario = byId.get(scenarioId);
      if (!scenario) throw new DatabaseDomainError('INVALID_STATE', 'Draft scenario content is missing');
      const selected = selectedIds.includes(scenarioId);
      const actualReturnPercent = number(scenario.actualReturnPercent);
      const selectedIndex = selectedIds.indexOf(scenarioId);
      const optimalIndex = optimalIds.indexOf(scenarioId);
      const allocationPercent = selected && allocations ? allocations[selectedIndex] : null;
      return {
        slot,
        title: scenario.title,
        companyName: scenario.companyName,
        ticker: scenario.ticker,
        actualReturnPercent,
        selected,
        optimal: optimalIndex >= 0,
        allocationPercent,
        allocatedValue: allocationPercent === null
          ? (selected ? portfolioFinalValue([actualReturnPercent], budget / selectedIds.length) : null)
          : allocationValue(budget, allocationPercent, actualReturnPercent),
        ...(optimalIndex >= 0 && optimalAllocations
          ? { optimalAllocationPercent: optimalAllocations[optimalIndex] }
          : {}),
      };
    });
    const finalValue = number(draft.finalValue ?? 0);
    const optimalValue = number(draft.optimalValue ?? 0);
    return {
      id: draft.id,
      status: 'completed',
      isOfficial: draft.isOfficial,
      format: draft.format,
      eraId: draft.eraId,
      budget,
      windowLabel: windowLabel(draft.windowStart, draft.windowEnd),
      finalValue,
      optimalValue,
      gapFromOptimal: optimalValue - finalValue,
      companies,
    };
  }
}
