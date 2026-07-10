import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  marketErasSchema,
  productionScenarioInventorySchema,
} from '../src/schema';
import { validateContentCatalog } from '../src/catalogValidation';
import { loadAllScenarioFiles } from '../src/loadScenarios';
import type {
  DailyChallengePool,
  ProductionScenarioInventoryEntry,
  Scenario,
} from '../src/types';

function loadValidScenarios(): Scenario[] {
  return loadAllScenarioFiles().flatMap((file) =>
    file.result.success ? [file.result.scenario] : [],
  );
}

function makePools(scenarioIds: string[]): DailyChallengePool[] {
  const difficulties = [
    'easy',
    'medium',
    'hard',
    'easy',
    'medium',
    'hard',
    'easy',
    'medium',
    'hard',
    'medium',
  ] as const;

  return Array.from({ length: 10 }, (_, poolIndex) => ({
    id: `daily_pool_${String(poolIndex + 1).padStart(3, '0')}`,
    name: `MVP Daily Pool ${String(poolIndex + 1).padStart(3, '0')}`,
    startingBankroll: 10000,
    scenarios: scenarioIds.map((scenarioId, index) => ({
      scenarioId,
      difficulty: difficulties[index],
    })),
  }));
}

function makeProductionScenarios(): Scenario[] {
  const scenarios = loadValidScenarios();
  if (scenarios.length === 0) {
    throw new Error('Expected at least one valid scenario fixture');
  }

  const generated = [...scenarios];
  while (generated.length < 40) {
    const index = generated.length;
    generated.push({
      ...scenarios[index % scenarios.length],
      id: `scenario_generated_${String(index).padStart(3, '0')}`,
    });
  }

  return generated.slice(0, 40);
}

function makeInventory(
  scenarios: Scenario[],
): ProductionScenarioInventoryEntry[] {
  return scenarios.slice(0, 40).map((scenario, index) => ({
    scenarioId: scenario.id,
    recognitionBucket:
      index < 24 ? 'famous' : index < 36 ? 'moderate' : 'obscure',
  }));
}

function loadEraData(): unknown {
  return JSON.parse(
    readFileSync(resolve(__dirname, '../data/market-eras.json'), 'utf8'),
  ) as unknown;
}

describe('content catalog validation', () => {
  it('validates the ten market-era seeds', () => {
    const result = marketErasSchema.safeParse(loadEraData());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(10);
      expect(new Set(result.data.map((era) => era.id)).size).toBe(10);
    }
  });

  it('accepts ten mixed pools with valid references and outcome variety', () => {
    const scenarios = makeProductionScenarios();
    const negative = scenarios.filter(
      (scenario) => scenario.marketData.actualReturnPercent < 0,
    );
    const positive = scenarios.filter(
      (scenario) => scenario.marketData.actualReturnPercent > 0,
    );
    const selected = [...negative.slice(0, 2), ...positive.slice(0, 8)];
    expect(selected).toHaveLength(10);

    const result = validateContentCatalog(
      makePools(selected.map((scenario) => scenario.id)),
      loadEraData(),
      makeInventory(scenarios),
      scenarios,
    );
    expect(result.success).toBe(true);
  });

  it('rejects duplicate scenario references', () => {
    const scenarios = makeProductionScenarios();
    const selected = scenarios.slice(0, 10).map((scenario) => scenario.id);
    const pools = makePools(selected);
    pools[0].scenarios[1].scenarioId = pools[0].scenarios[0].scenarioId;

    const result = validateContentCatalog(
      pools,
      loadEraData(),
      makeInventory(scenarios),
      scenarios,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.message.includes('repeat'))).toBe(
        true,
      );
    }
  });

  it('rejects unknown scenario references', () => {
    const scenarios = makeProductionScenarios();
    const selected = scenarios.slice(0, 10).map((scenario) => scenario.id);
    const pools = makePools(selected);
    pools[1].scenarios[0].scenarioId = 'scenario_missing_2000_2001';

    const result = validateContentCatalog(
      pools,
      loadEraData(),
      makeInventory(scenarios),
      scenarios,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.message.includes('Unknown'))).toBe(
        true,
      );
    }
  });

  it('rejects pool scenarios outside the production inventory', () => {
    const productionScenarios = makeProductionScenarios();
    const prototypeScenario: Scenario = {
      ...productionScenarios[0],
      id: 'scenario_prototype_not_in_inventory',
    };
    const scenarios = [...productionScenarios, prototypeScenario];
    const inventory = makeInventory(productionScenarios);
    const pools = makePools(
      productionScenarios.slice(0, 10).map((scenario) => scenario.id),
    );
    pools[0].scenarios[0].scenarioId = prototypeScenario.id;

    const result = validateContentCatalog(
      pools,
      loadEraData(),
      inventory,
      scenarios,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (error) =>
            error.path === 'dailyChallengePools.0.scenarios.0.scenarioId' &&
            error.message.includes('not in the production inventory'),
        ),
      ).toBe(true);
    }
  });

  it('accepts the exact D034 production inventory mix', () => {
    const scenarios = makeProductionScenarios();
    const selected = scenarios.slice(0, 10);
    const result = validateContentCatalog(
      makePools(selected.map((scenario) => scenario.id)),
      loadEraData(),
      makeInventory(scenarios),
      scenarios,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.catalog.productionScenarioInventory).toHaveLength(40);
    }
  });

  it('rejects a production inventory with the wrong recognition mix', () => {
    const scenarios = makeProductionScenarios();
    const inventory = makeInventory(scenarios);
    inventory[0].recognitionBucket = 'moderate';

    const result = productionScenarioInventorySchema.safeParse(inventory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('exactly 24 famous'),
        ),
      ).toBe(true);
    }
  });

  it('rejects duplicate production inventory scenario references', () => {
    const scenarios = makeProductionScenarios();
    const inventory = makeInventory(scenarios);
    inventory[39].scenarioId = inventory[0].scenarioId;

    const result = productionScenarioInventorySchema.safeParse(inventory);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('must be unique'),
        ),
      ).toBe(true);
    }
  });

  it('rejects unknown production inventory scenario references', () => {
    const scenarios = makeProductionScenarios();
    const inventory = makeInventory(scenarios);
    inventory[0].scenarioId = 'scenario_missing_2000_2001';

    const selected = scenarios.slice(0, 10);
    const result = validateContentCatalog(
      makePools(selected.map((scenario) => scenario.id)),
      loadEraData(),
      inventory,
      scenarios,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (error) =>
            error.path === 'productionScenarioInventory.0.scenarioId' &&
            error.message.includes('Unknown'),
        ),
      ).toBe(true);
    }
  });
});
