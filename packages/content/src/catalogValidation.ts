import {
  dailyChallengePoolsSchema,
  marketErasSchema,
  productionScenarioInventorySchema,
} from './schema';
import type {
  DailyChallengePool,
  MarketEra,
  ProductionScenarioInventoryEntry,
  Scenario,
  ValidationIssue,
} from './types';

export type ContentCatalog = {
  dailyChallengePools: DailyChallengePool[];
  marketEras: MarketEra[];
  productionScenarioInventory: ProductionScenarioInventoryEntry[];
};

export type ContentCatalogValidationResult =
  | { success: true; catalog: ContentCatalog }
  | { success: false; errors: ValidationIssue[] };

function parseIssues(
  prefix: string,
  issues: { path: (string | number)[]; message: string }[],
): ValidationIssue[] {
  return issues.map((issue) => ({
    path: [prefix, ...issue.path].join('.'),
    message: issue.message,
  }));
}

/** Validate catalog seed files and all scenario references against scenario seeds. */
export function validateContentCatalog(
  dailyChallengePoolsInput: unknown,
  marketErasInput: unknown,
  productionScenarioInventoryInput: unknown,
  scenarios: Scenario[],
): ContentCatalogValidationResult {
  const poolsResult = dailyChallengePoolsSchema.safeParse(
    dailyChallengePoolsInput,
  );
  const erasResult = marketErasSchema.safeParse(marketErasInput);
  const inventoryResult = productionScenarioInventorySchema.safeParse(
    productionScenarioInventoryInput,
  );
  const errors: ValidationIssue[] = [];

  if (!poolsResult.success) {
    errors.push(
      ...parseIssues('dailyChallengePools', poolsResult.error.issues),
    );
  }
  if (!erasResult.success) {
    errors.push(...parseIssues('marketEras', erasResult.error.issues));
  }
  if (!inventoryResult.success) {
    errors.push(
      ...parseIssues(
        'productionScenarioInventory',
        inventoryResult.error.issues,
      ),
    );
  }

  const scenarioById = new Map(
    scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const productionScenarioIds = inventoryResult.success
    ? new Set(inventoryResult.data.map((entry) => entry.scenarioId))
    : null;

  if (inventoryResult.success) {
    inventoryResult.data.forEach((entry, index) => {
      if (!scenarioById.has(entry.scenarioId)) {
        errors.push({
          path: `productionScenarioInventory.${index}.scenarioId`,
          message: `Unknown scenario ID "${entry.scenarioId}"`,
        });
      }
    });
  }

  if (poolsResult.success) {
    poolsResult.data.forEach((pool, poolIndex) => {
      const companies = new Set<string>();
      const sectors = new Set<string>();
      let hasPositiveOutcome = false;
      let hasNegativeOutcome = false;

      pool.scenarios.forEach((entry, entryIndex) => {
        const path = `dailyChallengePools.${poolIndex}.scenarios.${entryIndex}`;
        const scenario = scenarioById.get(entry.scenarioId);
        if (!scenario) {
          errors.push({
            path: `${path}.scenarioId`,
            message: `Unknown scenario ID "${entry.scenarioId}"`,
          });
          return;
        }
        if (
          productionScenarioIds &&
          !productionScenarioIds.has(entry.scenarioId)
        ) {
          errors.push({
            path: `${path}.scenarioId`,
            message: `Scenario ID "${entry.scenarioId}" is not in the production inventory`,
          });
        }

        const normalizedCompany = scenario.company.name.trim().toLowerCase();
        if (companies.has(normalizedCompany)) {
          errors.push({
            path: `${path}.scenarioId`,
            message: `Pool repeats company "${scenario.company.name}"`,
          });
        }
        companies.add(normalizedCompany);
        sectors.add(scenario.company.sector);
        hasPositiveOutcome ||= scenario.marketData.actualReturnPercent > 0;
        hasNegativeOutcome ||= scenario.marketData.actualReturnPercent < 0;

        if (!scenario.scenario.difficultySupported.includes(entry.difficulty)) {
          errors.push({
            path: `${path}.difficulty`,
            message: `Scenario does not support difficulty "${entry.difficulty}"`,
          });
        }
      });

      if (sectors.size < 2) {
        errors.push({
          path: `dailyChallengePools.${poolIndex}.scenarios`,
          message: 'Pool must include scenarios from at least two sectors',
        });
      }
      if (!hasPositiveOutcome || !hasNegativeOutcome) {
        errors.push({
          path: `dailyChallengePools.${poolIndex}.scenarios`,
          message: 'Pool must include both positive and negative outcomes',
        });
      }
    });
  }

  if (
    !poolsResult.success ||
    !erasResult.success ||
    !inventoryResult.success ||
    errors.length > 0
  ) {
    return { success: false, errors };
  }

  return {
    success: true,
    catalog: {
      dailyChallengePools: poolsResult.data,
      marketEras: erasResult.data,
      productionScenarioInventory: inventoryResult.data,
    },
  };
}
