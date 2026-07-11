import type { Prisma, PrismaClient } from '@prisma/client';
import {
  DRAFT_BUDGET,
  DRAFT_POOL_SIZE,
  computeDraftResult,
  findDraftWindows,
  portfolioFinalValue,
} from '@signal-or-noise/game-engine';
import type { DraftWindow } from '@signal-or-noise/game-engine';
import {
  createPortfolioDraftSchema,
  getCurrentPortfolioDraftSchema,
  getPortfolioDraftSchema,
  submitDraftSelectionSchema,
} from './contracts';
import type {
  CompletedDraftPayload,
  CurrentDraftPayload,
  DraftCardPayload,
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

type DraftRecord = {
  id: string;
  userId: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  isOfficial: boolean;
  windowStart: Date;
  windowEnd: Date;
  scenarioIds: unknown;
  selectedScenarioIds: unknown;
  budget: Prisma.Decimal | number;
  finalValue: Prisma.Decimal | number | null;
  optimalScenarioIds: unknown;
  optimalValue: Prisma.Decimal | number | null;
  guestSession: { clientSessionId: string } | null;
};

const DRAFT_SELECT = {
  id: true,
  userId: true,
  status: true,
  isOfficial: true,
  windowStart: true,
  windowEnd: true,
  scenarioIds: true,
  selectedScenarioIds: true,
  budget: true,
  finalValue: true,
  optimalScenarioIds: true,
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

/** Pre-decision-safe label: years only, no outcome-period dates. */
function windowLabel(windowStart: Date, windowEnd: Date): string {
  const startYear = windowStart.toISOString().slice(0, 4);
  const endYear = windowEnd.toISOString().slice(0, 4);
  return startYear === endYear ? startYear : `${startYear}–${endYear}`;
}

export class PortfolioDraftService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly random: () => number = Math.random,
  ) {}

  /**
   * Starts a new draft: picks one compatible historical window (D052) from
   * the active catalog, snapshots six distinct hidden companies at Medium,
   * and abandons any prior unfinished draft for the same owner.
   */
  async createDraft(input: unknown): Promise<CurrentDraftPayload> {
    const parsed = parseInput(() => createPortfolioDraftSchema.parse(input));
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

        const pool = await this.pickDraftPool(tx);
        const draft = await tx.portfolioDraft.create({
          data: {
            ...owner,
            windowStart: new Date(`${pool.windowStart}T00:00:00.000Z`),
            windowEnd: new Date(`${pool.windowEnd}T00:00:00.000Z`),
            scenarioIds: pool.scenarioIds,
            budget: DRAFT_BUDGET,
          },
          select: { id: true },
        });
        return draft.id;
      }, { isolationLevel: 'Serializable' }),
      'Draft creation conflicted — try again',
    );
    const payload = await this.getDraft({ owner: parsed.owner, draftId });
    if (payload.status !== 'in_progress') {
      throw new DatabaseDomainError('INVALID_STATE', 'Draft is not in progress');
    }
    return payload;
  }

  /**
   * Chooses one compatible window, then six scenarios with distinct hidden
   * companies inside it. Windows that cannot field six distinct companies
   * are skipped.
   */
  private async pickDraftPool(tx: TransactionClient): Promise<{
    scenarioIds: string[];
    windowStart: string;
    windowEnd: string;
  }> {
    const candidates = await tx.scenario.findMany({
      where: { status: 'active', variants: { some: { difficulty: 'medium' } } },
      select: { id: true, decisionDate: true, endDate: true, companyName: true },
    });
    const companyByScenario = new Map(candidates.map((c) => [c.id, c.companyName]));
    const windows = findDraftWindows(candidates.map((c) => ({
      scenarioId: c.id,
      decisionDate: c.decisionDate.toISOString().slice(0, 10),
      endDate: c.endDate.toISOString().slice(0, 10),
    })));

    for (const window of shuffled(windows, this.random)) {
      const picks = this.pickDistinctCompanies(window, companyByScenario);
      if (!picks) continue;
      const chosen = candidates.filter((c) => picks.includes(c.id));
      return {
        scenarioIds: picks,
        windowStart: chosen.reduce(
          (max, c) => {
            const date = c.decisionDate.toISOString().slice(0, 10);
            return date > max ? date : max;
          },
          chosen[0].decisionDate.toISOString().slice(0, 10),
        ),
        windowEnd: chosen.reduce(
          (min, c) => {
            const date = c.endDate.toISOString().slice(0, 10);
            return date < min ? date : min;
          },
          chosen[0].endDate.toISOString().slice(0, 10),
        ),
      };
    }
    throw new DatabaseDomainError(
      'INVALID_STATE',
      'Not enough compatible scenarios for a Portfolio Draft',
    );
  }

  private pickDistinctCompanies(
    window: DraftWindow,
    companyByScenario: Map<string, string>,
  ): string[] | null {
    const picks: string[] = [];
    const seenCompanies = new Set<string>();
    for (const scenarioId of shuffled(window.scenarioIds, this.random)) {
      const company = companyByScenario.get(scenarioId);
      if (!company || seenCompanies.has(company)) continue;
      seenCompanies.add(company);
      picks.push(scenarioId);
      if (picks.length === DRAFT_POOL_SIZE) return picks;
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

  async getDraft(input: unknown): Promise<CurrentDraftPayload | CompletedDraftPayload> {
    const parsed = parseInput(() => getPortfolioDraftSchema.parse(input));
    const draft = await this.prisma.portfolioDraft.findUnique({
      where: { id: parsed.draftId },
      select: DRAFT_SELECT,
    });
    if (!draft) throw new DatabaseDomainError('NOT_FOUND', 'Draft not found');
    assertDraftOwner(draft, parsed.owner);
    if (draft.status === 'abandoned') {
      throw new DatabaseDomainError('INVALID_STATE', 'Draft was abandoned');
    }
    return draft.status === 'in_progress'
      ? this.buildCurrentDraftPayload(draft)
      : this.buildCompletedDraftPayload(draft);
  }

  /**
   * Records the one immutable selection and computes results server-side.
   * The guarded updateMany means exactly one submission wins any race; every
   * other attempt sees CONFLICT and can reload the completed reveal.
   */
  async submitSelections(input: unknown): Promise<CompletedDraftPayload> {
    const parsed = parseInput(() => submitDraftSelectionSchema.parse(input));
    await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const draft = await tx.portfolioDraft.findUnique({
          where: { id: parsed.draftId },
          select: DRAFT_SELECT,
        });
        if (!draft) throw new DatabaseDomainError('NOT_FOUND', 'Draft not found');
        assertDraftOwner(draft, parsed.owner);
        if (draft.status !== 'in_progress') {
          throw new DatabaseDomainError('CONFLICT', 'Draft picks were already locked');
        }
        const scenarioIds = parseIdList(draft.scenarioIds, DRAFT_POOL_SIZE, 'Draft');
        const selectedIds = parsed.slots.map((slot) => scenarioIds[slot]);
        const scenarios = await tx.scenario.findMany({
          where: { id: { in: scenarioIds } },
          select: { id: true, actualReturnPercent: true },
        });
        if (scenarios.length !== DRAFT_POOL_SIZE) {
          throw new DatabaseDomainError('INVALID_STATE', 'Draft scenarios are missing');
        }
        const result = computeDraftResult(
          scenarios.map((s) => ({
            scenarioId: s.id,
            actualReturnPercent: number(s.actualReturnPercent),
          })),
          selectedIds,
        );
        const locked = await tx.portfolioDraft.updateMany({
          where: { id: draft.id, status: 'in_progress' },
          data: {
            status: 'completed',
            selectedScenarioIds: result.selectedScenarioIds,
            finalValue: result.finalValue,
            optimalScenarioIds: result.optimalScenarioIds,
            optimalValue: result.optimalValue,
            completedAt: new Date(),
          },
        });
        if (locked.count !== 1) {
          throw new DatabaseDomainError('CONFLICT', 'Draft picks were already locked');
        }
      }, { isolationLevel: 'Serializable' }),
      'Draft picks were already locked',
    );
    const payload = await this.getDraft({ owner: parsed.owner, draftId: parsed.draftId });
    if (payload.status !== 'completed') {
      throw new DatabaseDomainError('INVALID_STATE', 'Draft did not complete');
    }
    return payload;
  }

  /**
   * Pre-selection payload. Cards are keyed by slot index only: no scenario
   * id, company, ticker, return, reveal text, or outcome chart may appear
   * before the selection locks.
   */
  private async buildCurrentDraftPayload(draft: DraftRecord): Promise<CurrentDraftPayload> {
    const scenarioIds = parseIdList(draft.scenarioIds, DRAFT_POOL_SIZE, 'Draft');
    const scenarios = await this.prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
      select: {
        id: true,
        title: true,
        decisionDateLabel: true,
        holdingPeriodLabel: true,
        variants: {
          where: { difficulty: 'medium' },
          select: {
            companyDescription: true,
            macroContext: true,
            situation: true,
            longCase: true,
            shortCase: true,
            setupHints: true,
          },
        },
        marketPoints: {
          where: { phase: 'pre_decision' },
          orderBy: { ordinal: 'asc' },
          select: { pointDate: true, price: true },
        },
      },
    });
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    const cards: DraftCardPayload[] = scenarioIds.map((scenarioId, slot) => {
      const scenario = byId.get(scenarioId);
      const variant = scenario?.variants[0];
      if (!scenario || !variant) {
        throw new DatabaseDomainError('INVALID_STATE', 'Draft scenario content is missing');
      }
      return {
        slot,
        title: scenario.title,
        decisionDateLabel: scenario.decisionDateLabel,
        holdingPeriodLabel: scenario.holdingPeriodLabel,
        ...variant,
        lookbackChart: scenario.marketPoints.map((point) => ({
          date: point.pointDate.toISOString().slice(0, 10),
          price: number(point.price),
        })),
      };
    });
    return {
      id: draft.id,
      status: 'in_progress',
      isOfficial: draft.isOfficial,
      budget: number(draft.budget),
      windowLabel: windowLabel(draft.windowStart, draft.windowEnd),
      cards,
    };
  }

  private async buildCompletedDraftPayload(draft: DraftRecord): Promise<CompletedDraftPayload> {
    const scenarioIds = parseIdList(draft.scenarioIds, DRAFT_POOL_SIZE, 'Draft');
    const selectedIds = parseIdList(draft.selectedScenarioIds, 3, 'Draft selection');
    const optimalIds = parseIdList(draft.optimalScenarioIds, 3, 'Draft optimal');
    const scenarios = await this.prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
      select: {
        id: true,
        title: true,
        companyName: true,
        ticker: true,
        actualReturnPercent: true,
      },
    });
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    const budget = number(draft.budget);
    const companies = scenarioIds.map((scenarioId, slot) => {
      const scenario = byId.get(scenarioId);
      if (!scenario) {
        throw new DatabaseDomainError('INVALID_STATE', 'Draft scenario content is missing');
      }
      const selected = selectedIds.includes(scenarioId);
      const actualReturnPercent = number(scenario.actualReturnPercent);
      return {
        slot,
        title: scenario.title,
        companyName: scenario.companyName,
        ticker: scenario.ticker,
        actualReturnPercent,
        selected,
        optimal: optimalIds.includes(scenarioId),
        sliceValue: selected
          ? portfolioFinalValue([actualReturnPercent], budget / selectedIds.length)
          : null,
      };
    });
    const finalValue = number(draft.finalValue ?? 0);
    const optimalValue = number(draft.optimalValue ?? 0);
    return {
      id: draft.id,
      status: 'completed',
      isOfficial: draft.isOfficial,
      budget,
      windowLabel: windowLabel(draft.windowStart, draft.windowEnd),
      finalValue,
      optimalValue,
      gapFromOptimal: optimalValue - finalValue,
      companies,
    };
  }
}
