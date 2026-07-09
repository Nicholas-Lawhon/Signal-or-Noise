import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  validateScenario,
  validateScenarioOrThrow,
  DIRECTIONAL_SENTIMENT_TERMS,
} from '../src/validation';
import type { Scenario } from '../src/types';

function loadActiveNetflix(): Scenario {
  const path = resolve(
    __dirname,
    '../scenarios/active/scenario_netflix_2012_2017.json',
  );
  return JSON.parse(readFileSync(path, 'utf8')) as Scenario;
}

function cloneScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}

describe('validateScenario', () => {
  it('passes a valid sample active scenario', () => {
    const result = validateScenario(loadActiveNetflix());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.scenario.id).toBe('scenario_netflix_2012_2017');
      expect(result.scenario.hiddenCard.easy.setupHints).toHaveLength(1);
      expect(result.scenario.hiddenCard.hard.setupHints).toHaveLength(0);
    }
  });

  it('fails when a hidden field contains the company name', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.medium.situation =
      'Will Netflix rebuild the customer base before spending pressure rises?';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path.includes('situation') &&
            e.message.toLowerCase().includes('company name'),
        ),
      ).toBe(true);
    }
  });

  it('fails when a hidden field contains the ticker', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.easy.longCase =
      'NFLX-style recurring revenue can scale if households adopt the model.';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some((e) => e.message.toLowerCase().includes('ticker')),
      ).toBe(true);
    }
  });

  it('fails when a hidden field contains an identityBannedTerms term', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.hard.shortCase =
      'Qwikster-style missteps can keep churn elevated for years.';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some((e) =>
          e.message.toLowerCase().includes('identity-banned'),
        ),
      ).toBe(true);
    }
  });

  it('fails Easy with 0 setup hints', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.easy.setupHints = [];
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'hiddenCard.easy.setupHints' &&
            e.message.includes('exactly 1'),
        ),
      ).toBe(true);
    }
  });

  it('fails Hard with 1 setup hint', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.hard.setupHints = [
      'An extra setup detail that Hard must not have.',
    ];
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'hiddenCard.hard.setupHints' &&
            e.message.includes('exactly 0'),
        ),
      ).toBe(true);
    }
  });

  it('fails Medium with 2 setup hints', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.medium.setupHints = [
      'First medium setup hint.',
      'Second medium setup hint overflow.',
    ];
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'hiddenCard.medium.setupHints' &&
            e.message.includes('0 or 1'),
        ),
      ).toBe(true);
    }
  });

  it('fails when era contains the company name', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.scenario.era = 'The Netflix streaming expansion era';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'scenario.era' &&
            e.message.toLowerCase().includes('company name'),
        ),
      ).toBe(true);
    }
  });

  it('fails when decisionDateLabel contains the ticker', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.scenario.decisionDateLabel = 'NFLX decision window 2012';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'scenario.decisionDateLabel' &&
            e.message.toLowerCase().includes('ticker'),
        ),
      ).toBe(true);
    }
  });

  it('fails active with empty identityBannedTerms; draft is exempt', () => {
    const active = cloneScenario(loadActiveNetflix());
    active.status = 'active';
    active.company.identityBannedTerms = [];
    const activeResult = validateScenario(active);
    expect(activeResult.success).toBe(false);
    if (!activeResult.success) {
      expect(
        activeResult.errors.some(
          (e) =>
            e.path === 'company.identityBannedTerms' &&
            e.message.toLowerCase().includes('identity-banned'),
        ),
      ).toBe(true);
    }

    const draft = cloneScenario(loadActiveNetflix());
    draft.status = 'draft';
    draft.company.identityBannedTerms = [];
    const draftResult = validateScenario(draft);
    expect(draftResult.success).toBe(true);
  });

  it('fails actualReturnPercent that looks like a whole percent (1135.6)', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.marketData.actualReturnPercent = 1135.6;
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) => e.path === 'marketData.actualReturnPercent',
        ),
      ).toBe(true);
    }
  });

  it('fails invalid date windows', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    // Outcome chart starts before decision date
    scenario.marketData.outcomeChartStartDate = '2011-01-01';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) => e.path === 'marketData.outcomeChartStartDate',
        ),
      ).toBe(true);
    }
  });

  it('produces warnings for directional-sentiment terms without failing', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.easy.longCase =
      'If customers accept the newer model, growth looks unstoppable and the case is obvious.';
    const result = validateScenario(scenario);
    expect(result.success).toBe(true);
    if (result.success) {
      const messages = result.warnings.map((w) => w.message.toLowerCase());
      expect(
        messages.some(
          (m) =>
            m.includes('unstoppable') ||
            m.includes('obvious') ||
            DIRECTIONAL_SENTIMENT_TERMS.some((t) => m.includes(t)),
        ),
      ).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });

  it('validateScenarioOrThrow returns scenario or throws', () => {
    const valid = validateScenarioOrThrow(loadActiveNetflix());
    expect(valid.id).toBe('scenario_netflix_2012_2017');

    const bad = cloneScenario(loadActiveNetflix());
    bad.marketData.actualReturnPercent = 1135.6;
    expect(() => validateScenarioOrThrow(bad)).toThrow(/validation failed/i);
  });
});
