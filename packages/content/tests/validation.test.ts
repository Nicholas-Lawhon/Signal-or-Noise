import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GATE2_MODEL, GATE2_PROMPT_VERSION } from '../src/gate2/config';
import { evaluateScenarioGate2 } from '../src/gate2/evaluate';
import { hashScenarioVariant } from '../src/gate2/payload';
import {
  validateScenario,
  validateScenarioOrThrow,
  DIRECTIONAL_SENTIMENT_TERMS,
} from '../src/validation';
import type { Gate2Guess, Gate2VariantResult, Scenario } from '../src/types';

function loadActiveNetflix(): Scenario {
  const path = resolve(
    __dirname,
    '../scenarios/archived/scenario_netflix_2012_2017.json',
  );
  return JSON.parse(readFileSync(path, 'utf8')) as Scenario;
}

function cloneScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}

describe('validateScenario', () => {
  it('passes a valid sample active scenario', () => {
    // Structural fixture load: H023 stored Gate 2 medium/hard fail thresholds;
    // skipGate2 keeps this a schema/business-rule check (validate/gate2 check still enforce Gate 2).
    const result = validateScenario(loadActiveNetflix(), { skipGate2: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.scenario.id).toBe('scenario_netflix_2012_2017');
      expect(result.scenario.hiddenCard.easy.setupHints).toHaveLength(1);
      expect(result.scenario.hiddenCard.hard.setupHints).toHaveLength(0);
    }
  });

  it('requires reviewed Smart Pass metadata and keeps the explanation reveal-safe', () => {
    const missing = cloneScenario(loadActiveNetflix());
    missing.status = 'active';
    delete missing.review.smartPass;
    const missingResult = validateScenario(missing, { skipGate2: true });
    expect(missingResult.success).toBe(false);
    if (!missingResult.success) {
      expect(missingResult.errors.some((error) => error.path === 'review.smartPass')).toBe(true);
    }

    const leaking = cloneScenario(loadActiveNetflix());
    leaking.status = 'active';
    leaking.review.smartPass = {
      eligible: true,
      explanation: `Mixed evidence remains around ${leaking.company.name}; either case could win.`,
    };
    const leakingResult = validateScenario(leaking, { skipGate2: true });
    expect(leakingResult.success).toBe(false);
    if (!leakingResult.success) {
      expect(
        leakingResult.errors.some((error) => error.path === 'review.smartPass.explanation'),
      ).toBe(true);
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

  it('fails impossible calendar dates', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.scenario.decisionDate = '2020-02-30';
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path.includes('decisionDate') &&
            e.message.toLowerCase().includes('calendar'),
        ),
      ).toBe(true);
    }
  });

  it('fails when actualReturnPercent mismatches start/end prices', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    // Expected return ~11.356; force a large mismatch within decimal guard
    scenario.marketData.actualReturnPercent = 5.0;
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'marketData.actualReturnPercent' &&
            e.message.toLowerCase().includes('differs'),
        ),
      ).toBe(true);
    }
  });

  it('fails when lookback last and outcome first prices are discontinuous', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.marketData.lookbackPrices = [5.5, 6.8, 9.2, 14.5, 25.1, 42.7, 30.9, 50];
    scenario.marketData.outcomePrices = [10.3, 13.2, 25.4, 48.8, 62.5, 98.1, 110.4, 127.5];
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'marketData.lookbackPrices' &&
            e.message.toLowerCase().includes('outcome'),
        ),
      ).toBe(true);
    }
  });

  it('fails active Hard likely guesses with a generic placeholder', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    scenario.review.hardLikelyGuesses = [
      'Netflix',
      'Hulu',
      'Spotify',
      'semiconductor peers',
    ];
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path.startsWith('review.hardLikelyGuesses') &&
            e.message.toLowerCase().includes('named company'),
        ),
      ).toBe(true);
    }
  });

  it('fails active when likely-guess count is below the difficulty floor', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    scenario.review.hardLikelyGuesses = ['Netflix', 'Hulu'];
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'review.hardLikelyGuesses' &&
            e.message.toLowerCase().includes('at least 4'),
        ),
      ).toBe(true);
    }
  });

  it('draft with placeholder likely guesses remains non-blocking', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'draft';
    scenario.review.hardLikelyGuesses = ['semiconductor peers'];
    scenario.review.easyLikelyGuesses = [];
    scenario.review.mediumLikelyGuesses = [];
    const result = validateScenario(scenario);
    expect(result.success).toBe(true);
  });

  it('produces warnings for directional-sentiment terms without failing', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.hiddenCard.easy.longCase =
      'If customers accept the newer model, growth looks unstoppable and the case is obvious.';
    // Structural fixture: skip stored Gate 2 failures from H023 on active Netflix.
    const result = validateScenario(scenario, { skipGate2: true });
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
    const valid = validateScenarioOrThrow(loadActiveNetflix(), {
      skipGate2: true,
    });
    expect(valid.id).toBe('scenario_netflix_2012_2017');

    const bad = cloneScenario(loadActiveNetflix());
    bad.marketData.actualReturnPercent = 1135.6;
    expect(() => validateScenarioOrThrow(bad)).toThrow(/validation failed/i);
  });
});

function gate2Guess(
  company: string,
  confidence: number,
  pointingFact = 'card fact',
): Gate2Guess {
  return { company, confidence, pointingFact };
}

function makePassingEasyGate2(scenario: Scenario): Gate2VariantResult {
  return {
    payloadHash: hashScenarioVariant(scenario, 'easy'),
    model: GATE2_MODEL,
    promptVersion: GATE2_PROMPT_VERSION,
    testedAt: '2026-07-09T00:00:00.000Z',
    guesses: [
      gate2Guess('Netflix', 28),
      gate2Guess('Hulu', 22),
      gate2Guess('Spotify', 18),
      gate2Guess('Disney', 12),
      gate2Guess('Amazon', 10),
    ],
    direction: { call: 'toss_up', confidence: 40, cue: 'balanced' },
  };
}

describe('validateScenario Gate 2 stored results (H021)', () => {
  it('active missing Gate 2 still passes in H021', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    delete scenario.review.gate2;
    const result = validateScenario(scenario);
    expect(result.success).toBe(true);
  });

  it('draft missing Gate 2 still passes', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'draft';
    delete scenario.review.gate2;
    const result = validateScenario(scenario);
    expect(result.success).toBe(true);
  });

  it('fails active validation when stored payload hash is stale', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    scenario.review.gate2 = {
      easy: {
        ...makePassingEasyGate2(scenario),
        payloadHash: 'sha256:not-the-real-hash',
      },
    };
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path === 'review.gate2.easy.payloadHash' &&
            e.message.toLowerCase().includes('stale'),
        ),
      ).toBe(true);
    }
  });

  it('fails active validation when stored model or prompt version is wrong', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    scenario.review.gate2 = {
      easy: {
        ...makePassingEasyGate2(scenario),
        model: 'not-the-pinned-model',
        promptVersion: 'old.prompt',
      },
    };
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some((e) => e.path === 'review.gate2.easy.model'),
      ).toBe(true);
      expect(
        result.errors.some(
          (e) => e.path === 'review.gate2.easy.promptVersion',
        ),
      ).toBe(true);
    }
  });

  it('fails active validation when stored Gate 2 identity thresholds fail', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    // Easy fail: correct company absent
    scenario.review.gate2 = {
      easy: {
        payloadHash: hashScenarioVariant(scenario, 'easy'),
        model: GATE2_MODEL,
        promptVersion: GATE2_PROMPT_VERSION,
        testedAt: '2026-07-09T00:00:00.000Z',
        guesses: [
          gate2Guess('Hulu', 30),
          gate2Guess('Spotify', 20),
          gate2Guess('Disney', 15),
          gate2Guess('Amazon', 12),
          gate2Guess('Roku', 5),
        ],
        direction: { call: 'toss_up', confidence: 40, cue: 'balanced' },
      },
    };
    const result = validateScenario(scenario);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (e) =>
            e.path.startsWith('review.gate2.easy') &&
            e.message.toLowerCase().includes('absent'),
        ),
      ).toBe(true);
    }
  });

  it('accepts a valid stored Gate 2 result shape on active', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    scenario.review.gate2 = {
      easy: makePassingEasyGate2(scenario),
    };
    const result = validateScenario(scenario);
    expect(result.success).toBe(true);
  });

  it('skipGate2 loads bad stored results so check can report structured errors (H022)', () => {
    const scenario = cloneScenario(loadActiveNetflix());
    scenario.status = 'active';
    scenario.review.gate2 = {
      easy: {
        ...makePassingEasyGate2(scenario),
        payloadHash: 'sha256:stalehash0000000000000000000000000000000000000000000000000000',
        model: 'wrong-model',
        promptVersion: 'wrong.prompt',
      },
    };

    // Full validate fails (business rule still enforced)
    const full = validateScenario(scenario);
    expect(full.success).toBe(false);

    // gate2 check load path: skip Gate 2 so non-Gate-2 rules still apply
    const forCheck = validateScenario(scenario, { skipGate2: true });
    expect(forCheck.success).toBe(true);
    if (!forCheck.success) return;

    // Structured findings mirror what check prints as ERROR lines
    const findings = evaluateScenarioGate2(forCheck.scenario);
    const errors = findings.filter((f) => f.severity === 'error');
    expect(errors.some((f) => f.path.endsWith('.payloadHash'))).toBe(true);
    expect(errors.some((f) => f.path.endsWith('.model'))).toBe(true);
    expect(errors.some((f) => f.path.endsWith('.promptVersion'))).toBe(true);
  });
});
