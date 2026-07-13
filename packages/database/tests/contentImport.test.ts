import { describe, expect, it } from 'vitest';
import type { Scenario } from '@signal-or-noise/content';
import {
  getDefaultContentImportSource,
  prepareContentImport,
} from '../src/contentImport';
import { ContentImportValidationError } from '../src/errors';
import { submitRoundDecisionSchema } from '../src/contracts';

describe('content import preparation', () => {
  it('validates all production content before database work', () => {
    const prepared = prepareContentImport(getDefaultContentImportSource());
    expect(prepared.scenarios).toHaveLength(40);
    expect(prepared.scenarios.every((scenario) => scenario.review.smartPass)).toBe(true);
    expect(prepared.scenarios.filter((scenario) => scenario.review.smartPass?.eligible)).toHaveLength(8);
    expect(prepared.scenarios.flatMap((scenario) => Object.keys(scenario.hiddenCard))).toHaveLength(120);
    expect(prepared.catalog.marketEras).toHaveLength(10);
    expect(prepared.catalog.dailyChallengePools).toHaveLength(10);
    expect(prepared.catalog.dailyChallengePools.flatMap((pool) => pool.scenarios)).toHaveLength(100);
  });

  it('rejects an invalid scenario before an importer can open a transaction', () => {
    const source = getDefaultContentImportSource();
    const first = source.scenarios[0] as Scenario;
    const invalid: Scenario = {
      ...first,
      company: { ...first.company, name: '' },
    };
    expect(() => prepareContentImport({
      ...source,
      scenarios: [invalid, ...source.scenarios.slice(1)],
    })).toThrow(ContentImportValidationError);
  });

  it('rejects scenario era IDs that cannot be normalized into the era catalog', () => {
    const source = getDefaultContentImportSource();
    const first = source.scenarios[0] as Scenario;
    const invalid: Scenario = {
      ...first,
      scenario: { ...first.scenario, eraId: 'unknown_market_era' },
    };
    expect(() => prepareContentImport({
      ...source,
      scenarios: [invalid, ...source.scenarios.slice(1)],
    })).toThrow('has no catalog mapping');
  });
});

describe('round submission contract', () => {
  const valid = {
    owner: { kind: 'guest' as const, guestSessionId: '57bf5ba7-68b4-4782-85df-f9e33cbe9cc2' },
    runId: 'run_1',
    roundIndex: 0,
    action: 'long' as const,
    confidence: 'medium' as const,
  };

  it('rejects client-calculated score and outcome fields', () => {
    expect(submitRoundDecisionSchema.safeParse({
      ...valid,
      currentBankroll: 999999,
      actualReturnPercent: 20,
      signalScore: 500,
      smartPassEligible: true,
    }).success).toBe(false);
  });

  it('enforces confidence semantics for pass and directional calls', () => {
    expect(submitRoundDecisionSchema.safeParse({
      ...valid,
      action: 'pass',
      confidence: 'all_in',
    }).success).toBe(false);
    expect(submitRoundDecisionSchema.safeParse({
      ...valid,
      confidence: undefined,
    }).success).toBe(false);
  });
});
