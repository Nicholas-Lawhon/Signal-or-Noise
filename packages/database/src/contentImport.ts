import type { Prisma, PrismaClient } from '@prisma/client';
import {
  ACTIVE_SCENARIOS,
  validateContentCatalog,
  validateScenario,
} from '@signal-or-noise/content';
import type {
  ContentCatalog,
  DailyChallengePool,
  MarketEra,
  ProductionScenarioInventoryEntry,
  Scenario,
} from '@signal-or-noise/content';
import dailyChallengePools from '../../content/data/daily-challenge-pools.json';
import marketEras from '../../content/data/market-eras.json';
import productionScenarioInventory from '../../content/data/production-scenario-inventory.json';
import { ContentImportValidationError } from './errors';

export type ContentImportSource = {
  scenarios: readonly unknown[];
  dailyChallengePools: unknown;
  marketEras: unknown;
  productionScenarioInventory: unknown;
};

export type PreparedContentImport = {
  scenarios: Scenario[];
  catalog: ContentCatalog;
};

export type ContentImportResult = {
  scenarios: number;
  variants: number;
  sources: number;
  marketPoints: number;
  eras: number;
  contentPacks: number;
  dailyChallengePools: number;
  dailyChallengePoolEntries: number;
};

/**
 * Phase 4 scenario seeds retain narrower authoring-era IDs. Normalize those
 * labels into the approved ten-era catalog without changing the JSON source.
 */
const SCENARIO_ERA_ALIASES: Readonly<Record<string, string>> = {
  late_cycle_expansion: 'post_financial_crisis_recovery',
  late_cycle_uncertainty: 'post_financial_crisis_recovery',
  pandemic_era: 'pandemic_winners_losers',
  pandemic_recovery: 'pandemic_crash_recovery',
  rate_hike_era: 'rate_hike_inflation_era',
  rate_reset: 'rate_hike_inflation_era',
  reopening_era: 'pandemic_winners_losers',
  supply_chain_disruption: 'pandemic_winners_losers',
};

function normalizedEraId(eraId: string): string {
  return SCENARIO_ERA_ALIASES[eraId] ?? eraId;
}

export function getDefaultContentImportSource(): ContentImportSource {
  return {
    scenarios: ACTIVE_SCENARIOS,
    dailyChallengePools,
    marketEras,
    productionScenarioInventory,
  };
}

export function prepareContentImport(source: ContentImportSource): PreparedContentImport {
  const issues: string[] = [];
  const scenarios: Scenario[] = [];

  source.scenarios.forEach((input, index) => {
    const result = validateScenario(input);
    if (!result.success) {
      issues.push(
        ...result.errors.map(
          (issue) => `scenarios.${index}.${issue.path}: ${issue.message}`,
        ),
      );
      return;
    }
    if (result.scenario.status !== 'active') {
      issues.push(`scenarios.${index}.status: Only active production scenarios may be imported`);
    }
    scenarios.push(result.scenario);
  });

  const duplicateIds = scenarios
    .map((scenario) => scenario.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    issues.push(`scenarios: Duplicate scenario IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  }

  const catalogResult = validateContentCatalog(
    source.dailyChallengePools,
    source.marketEras,
    source.productionScenarioInventory,
    scenarios,
  );
  if (!catalogResult.success) {
    issues.push(...catalogResult.errors.map((issue) => `${issue.path}: ${issue.message}`));
  }

  if (catalogResult.success) {
    const importedIds = new Set(scenarios.map((scenario) => scenario.id));
    const inventoryIds = new Set(
      catalogResult.catalog.productionScenarioInventory.map((entry) => entry.scenarioId),
    );
    if (
      importedIds.size !== inventoryIds.size ||
      [...importedIds].some((id) => !inventoryIds.has(id))
    ) {
      issues.push('scenarios: Imported scenarios must exactly match the production inventory');
    }

    const catalogEraIds = new Set(catalogResult.catalog.marketEras.map((era) => era.id));
    scenarios.forEach((scenario, index) => {
      const eraId = normalizedEraId(scenario.scenario.eraId);
      if (!catalogEraIds.has(eraId)) {
        issues.push(
          `scenarios.${index}.scenario.eraId: Era ID "${scenario.scenario.eraId}" has no catalog mapping`,
        );
      }
    });
  }

  if (issues.length > 0 || !catalogResult.success) {
    throw new ContentImportValidationError(issues);
  }

  return { scenarios, catalog: catalogResult.catalog };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function interpolateDates(startValue: string, endValue: string, count: number): Date[] {
  const start = Date.parse(`${startValue}T00:00:00.000Z`);
  const end = Date.parse(`${endValue}T00:00:00.000Z`);
  if (count === 1) return [new Date(start)];
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return new Date(start + Math.round((end - start) * ratio));
  });
}

function titleFromId(id: string): string {
  return id
    .split('_')
    .map((part) => part.toUpperCase() === 'MVP' ? part.toUpperCase() : `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function recognitionByScenario(
  inventory: readonly ProductionScenarioInventoryEntry[],
): Map<string, ProductionScenarioInventoryEntry['recognitionBucket']> {
  return new Map(inventory.map((entry) => [entry.scenarioId, entry.recognitionBucket]));
}

function collectContentPackIds(scenarios: readonly Scenario[]): string[] {
  return [...new Set(scenarios.flatMap((scenario) => scenario.scenario.contentPackIds))].sort();
}

function marketPointRows(scenarios: readonly Scenario[]) {
  return scenarios.flatMap((scenario) => {
    const lookbackDates = interpolateDates(
      scenario.marketData.preDecisionChartStartDate,
      scenario.marketData.preDecisionChartEndDate,
      scenario.marketData.lookbackPrices.length,
    );
    const outcomeDates = interpolateDates(
      scenario.marketData.outcomeChartStartDate,
      scenario.marketData.outcomeChartEndDate,
      scenario.marketData.outcomePrices.length,
    );
    return [
      ...scenario.marketData.lookbackPrices.map((price, ordinal) => ({
        id: `${scenario.id}:pre_decision:${ordinal}`,
        scenarioId: scenario.id,
        phase: 'pre_decision' as const,
        pointDate: lookbackDates[ordinal],
        price,
        ordinal,
      })),
      ...scenario.marketData.outcomePrices.map((price, ordinal) => ({
        id: `${scenario.id}:outcome:${ordinal}`,
        scenarioId: scenario.id,
        phase: 'outcome' as const,
        pointDate: outcomeDates[ordinal],
        price,
        ordinal,
      })),
    ];
  });
}

function poolEntryRows(pools: readonly DailyChallengePool[]) {
  return pools.flatMap((pool) =>
    pool.scenarios.map((entry, ordinal) => ({
      poolId: pool.id,
      scenarioId: entry.scenarioId,
      ordinal,
      difficulty: entry.difficulty,
    })),
  );
}

function sourceRows(scenarios: readonly Scenario[]) {
  return scenarios.flatMap((scenario) =>
    scenario.sources.map((source, index) => ({
      id: `${scenario.id}:source:${index}`,
      scenarioId: scenario.id,
      label: source.label,
      url: source.url,
      notes: source.notes ?? null,
    })),
  );
}

export async function importProductionContent(
  prisma: PrismaClient,
  source: ContentImportSource = getDefaultContentImportSource(),
): Promise<ContentImportResult> {
  // This must finish before the transaction so malformed input cannot mutate storage.
  const prepared = prepareContentImport(source);
  const { scenarios, catalog } = prepared;
  const scenarioIds = scenarios.map((scenario) => scenario.id);
  const eraIds = catalog.marketEras.map((era) => era.id);
  const poolIds = catalog.dailyChallengePools.map((pool) => pool.id);
  const contentPackIds = collectContentPackIds(scenarios);
  const recognition = recognitionByScenario(catalog.productionScenarioInventory);
  const points = marketPointRows(scenarios);
  const sources = sourceRows(scenarios);
  const poolEntries = poolEntryRows(catalog.dailyChallengePools);

  return prisma.$transaction(async (tx) => {
    for (const era of catalog.marketEras as MarketEra[]) {
      await tx.era.upsert({
        where: { id: era.id },
        create: era,
        update: { name: era.name, description: era.description },
      });
    }

    for (const id of contentPackIds) {
      await tx.contentPack.upsert({
        where: { id },
        create: { id, name: titleFromId(id), status: 'active', isPaid: false },
        update: { name: titleFromId(id), status: 'active', isPaid: false },
      });
    }

    for (const scenario of scenarios) {
      const common = {
        status: scenario.status,
        title: scenario.scenario.title,
        decisionDate: new Date(`${scenario.scenario.decisionDate}T00:00:00.000Z`),
        endDate: new Date(`${scenario.scenario.endDate}T00:00:00.000Z`),
        decisionDateLabel: scenario.scenario.decisionDateLabel,
        outcomeLabel: scenario.scenario.outcomeLabel,
        holdingPeriodLabel: scenario.scenario.holdingPeriodLabel,
        recognitionBucket: recognition.get(scenario.id)!,
        companyName: scenario.company.name,
        ticker: scenario.company.ticker,
        exchange: scenario.company.exchange,
        sector: scenario.company.sector,
        industry: scenario.company.industry,
        country: scenario.company.country,
        acceptedNames: scenario.company.acceptedNames,
        identityBannedTerms: scenario.company.identityBannedTerms,
        revealShortText: scenario.reveal.shortText,
        revealFunFact: scenario.reveal.funFact,
        revealWhyItMoved: scenario.reveal.whyItMoved,
        startingPrice: scenario.marketData.startingPrice,
        endingPrice: scenario.marketData.endingPrice,
        actualReturnPercent: scenario.marketData.actualReturnPercent,
        splitAdjustedPrices: scenario.marketData.usesSplitAdjustedPrices,
        totalReturn: scenario.marketData.usesTotalReturn,
        reviewGeneratedByAi: scenario.review.generatedByAi,
        humanReviewed: scenario.review.humanReviewed,
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: scenario.review.reviewNotes,
        factBank: toJson(scenario.review.factBank),
        likelyGuesses: toJson({
          easy: scenario.review.easyLikelyGuesses,
          medium: scenario.review.mediumLikelyGuesses,
          hard: scenario.review.hardLikelyGuesses,
        }),
      };
      await tx.scenario.upsert({
        where: { id: scenario.id },
        create: {
          id: scenario.id,
          ...common,
          era: { connect: { id: normalizedEraId(scenario.scenario.eraId) } },
        },
        update: {
          ...common,
          era: { connect: { id: normalizedEraId(scenario.scenario.eraId) } },
        },
      });
    }

    await tx.scenarioVariant.deleteMany({ where: { scenarioId: { in: scenarioIds } } });
    await tx.scenarioVariant.createMany({
      data: scenarios.flatMap((scenario) =>
        (['easy', 'medium', 'hard'] as const).map((difficulty) => ({
          id: `${scenario.id}:${difficulty}`,
          scenarioId: scenario.id,
          difficulty,
          ...scenario.hiddenCard[difficulty],
        })),
      ),
    });

    await tx.scenarioSource.deleteMany({ where: { scenarioId: { in: scenarioIds } } });
    await tx.scenarioSource.createMany({ data: sources });

    await tx.marketPoint.deleteMany({ where: { scenarioId: { in: scenarioIds } } });
    await tx.marketPoint.createMany({ data: points });

    await tx.scenarioContentPack.deleteMany({ where: { scenarioId: { in: scenarioIds } } });
    await tx.scenarioContentPack.createMany({
      data: scenarios.flatMap((scenario) =>
        scenario.scenario.contentPackIds.map((contentPackId) => ({
          scenarioId: scenario.id,
          contentPackId,
        })),
      ),
    });

    for (const pool of catalog.dailyChallengePools) {
      await tx.dailyChallengePool.upsert({
        where: { id: pool.id },
        create: {
          id: pool.id,
          name: pool.name,
          startingBankroll: pool.startingBankroll,
        },
        update: {
          name: pool.name,
          startingBankroll: pool.startingBankroll,
        },
      });
    }
    await tx.dailyChallengePoolEntry.deleteMany({ where: { poolId: { in: poolIds } } });
    await tx.dailyChallengePoolEntry.createMany({ data: poolEntries });

    const [scenarioCount, variantCount, sourceCount, marketPointCount, eraCount,
      contentPackCount, poolCount, poolEntryCount] = await Promise.all([
      tx.scenario.count({ where: { id: { in: scenarioIds } } }),
      tx.scenarioVariant.count({ where: { scenarioId: { in: scenarioIds } } }),
      tx.scenarioSource.count({ where: { scenarioId: { in: scenarioIds } } }),
      tx.marketPoint.count({ where: { scenarioId: { in: scenarioIds } } }),
      tx.era.count({ where: { id: { in: eraIds } } }),
      tx.contentPack.count({ where: { id: { in: contentPackIds } } }),
      tx.dailyChallengePool.count({ where: { id: { in: poolIds } } }),
      tx.dailyChallengePoolEntry.count({ where: { poolId: { in: poolIds } } }),
    ]);

    return {
      scenarios: scenarioCount,
      variants: variantCount,
      sources: sourceCount,
      marketPoints: marketPointCount,
      eras: eraCount,
      contentPacks: contentPackCount,
      dailyChallengePools: poolCount,
      dailyChallengePoolEntries: poolEntryCount,
    };
  }, { timeout: 60_000 });
}
