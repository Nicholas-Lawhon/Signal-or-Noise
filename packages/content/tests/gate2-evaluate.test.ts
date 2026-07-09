import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GATE2_MODEL, GATE2_PROMPT_VERSION } from '../src/gate2/config';
import {
  evaluateGate2Variant,
  isCorrectCompanyGuess,
  normalizeIdentity,
} from '../src/gate2/evaluate';
import { hashScenarioVariant } from '../src/gate2/payload';
import type { Gate2Guess, Gate2VariantResult, Scenario } from '../src/types';

function loadActiveNetflix(): Scenario {
  const path = resolve(
    __dirname,
    '../scenarios/active/scenario_netflix_2012_2017.json',
  );
  return JSON.parse(readFileSync(path, 'utf8')) as Scenario;
}

function guess(
  company: string,
  confidence: number,
  pointingFact = 'card fact',
): Gate2Guess {
  return { company, confidence, pointingFact };
}

function makeStored(
  scenario: Scenario,
  difficulty: 'easy' | 'medium' | 'hard',
  guesses: Gate2Guess[],
  direction: Gate2VariantResult['direction'] = {
    call: 'toss_up',
    confidence: 40,
    cue: 'balanced tension',
  },
): Gate2VariantResult {
  return {
    payloadHash: hashScenarioVariant(scenario, difficulty),
    model: GATE2_MODEL,
    promptVersion: GATE2_PROMPT_VERSION,
    testedAt: '2026-07-09T00:00:00.000Z',
    guesses,
    direction,
  };
}

describe('normalizeIdentity / isCorrectCompanyGuess', () => {
  it('matches name, ticker, and accepted names after alphanumeric normalize', () => {
    const scenario = loadActiveNetflix();
    expect(normalizeIdentity('Net-flix!')).toBe('netflix');
    expect(isCorrectCompanyGuess('Netflix', scenario)).toBe(true);
    expect(isCorrectCompanyGuess('NFLX', scenario)).toBe(true);
    expect(isCorrectCompanyGuess('netflix', scenario)).toBe(true);
    expect(isCorrectCompanyGuess('Hulu', scenario)).toBe(false);
  });
});

describe('evaluateGate2Variant identity thresholds', () => {
  it('Easy: pass when correct is rank 1–3', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'easy', [
      guess('Netflix', 30),
      guess('Hulu', 20),
      guess('Spotify', 15),
      guess('Disney', 10),
      guess('Amazon', 5),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'easy',
      stored,
      scenario,
    });
    expect(findings.filter((f) => f.severity === 'error')).toHaveLength(0);
  });

  it('Easy: warn when correct is rank 4–5', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'easy', [
      guess('Hulu', 30),
      guess('Spotify', 20),
      guess('Disney', 15),
      guess('Netflix', 12),
      guess('Amazon', 5),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'easy',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) => f.severity === 'warning' && f.message.includes('rank 4'),
      ),
    ).toBe(true);
    expect(findings.filter((f) => f.severity === 'error')).toHaveLength(0);
  });

  it('Easy: fail when correct is absent from top 5', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'easy', [
      guess('Hulu', 30),
      guess('Spotify', 20),
      guess('Disney', 15),
      guess('Amazon', 12),
      guess('Roku', 5),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'easy',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) => f.severity === 'error' && f.message.toLowerCase().includes('absent'),
      ),
    ).toBe(true);
  });

  it('Medium: fail when correct is #1 with confidence >= 40', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'medium', [
      guess('Netflix', 45),
      guess('Hulu', 35),
      guess('Spotify', 10),
      guess('Disney', 5),
      guess('Amazon', 5),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'medium',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) =>
          f.severity === 'error' &&
          f.message.includes('#1') &&
          f.message.includes('45'),
      ),
    ).toBe(true);
  });

  it('Medium: fail when correct leads #2 by >= 15 points', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'medium', [
      guess('Netflix', 35),
      guess('Hulu', 15),
      guess('Spotify', 10),
      guess('Disney', 5),
      guess('Amazon', 5),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'medium',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) => f.severity === 'error' && f.message.includes('leads #2'),
      ),
    ).toBe(true);
  });

  it('Hard: fail when correct appears in top 5 with confidence >= 15', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'hard', [
      guess('Hulu', 25),
      guess('Spotify', 20),
      guess('Disney', 15),
      guess('Amazon', 12),
      guess('Netflix', 15),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'hard',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) => f.severity === 'error' && f.message.includes('Hard Gate 2'),
      ),
    ).toBe(true);
  });

  it('Hard: pass when correct is absent from top 5', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'hard', [
      guess('Hulu', 20),
      guess('Spotify', 15),
      guess('Disney', 12),
      guess('Amazon', 10),
      guess('Roku', 8),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'hard',
      stored,
      scenario,
    });
    expect(
      findings.filter(
        (f) => f.severity === 'error' && f.message.includes('Hard Gate 2'),
      ),
    ).toHaveLength(0);
  });
});

describe('evaluateGate2Variant warnings', () => {
  it('uses under-2-only automated plausible-count warnings for Medium and Hard', () => {
    const scenario = loadActiveNetflix();
    const countWarnings = (difficulty: 'medium' | 'hard', guesses: Gate2Guess[]) =>
      evaluateGate2Variant({
        difficulty,
        stored: makeStored(scenario, difficulty, guesses),
        scenario,
      }).filter((finding) => finding.message.includes('plausible guess'));

    expect(
      countWarnings('medium', [
        guess('Hulu', 20), guess('Spotify', 18), guess('Disney', 15),
        guess('Amazon', 12), guess('Roku', 10),
      ]),
    ).toHaveLength(0);
    expect(
      countWarnings('hard', [
        guess('Hulu', 20), guess('Spotify', 15), guess('Disney', 12),
        guess('Amazon', 8), guess('Roku', 5),
      ]),
    ).toHaveLength(0);
    expect(
      countWarnings('hard', [
        guess('Hulu', 20), guess('Spotify', 15), guess('Disney', 8),
        guess('Amazon', 5), guess('Roku', 4),
      ]),
    ).toHaveLength(0);
    expect(
      countWarnings('medium', [
        guess('Hulu', 20), guess('Spotify', 8), guess('Disney', 5),
        guess('Amazon', 4), guess('Roku', 3),
      ]),
    ).toHaveLength(1);
    expect(
      countWarnings('hard', [
        guess('Hulu', 20), guess('Spotify', 8), guess('Disney', 5),
        guess('Amazon', 4), guess('Roku', 3),
      ]),
    ).toHaveLength(1);
  });

  it('warns when model top-5 has zero overlap with curator likely guesses', () => {
    const scenario = loadActiveNetflix();
    // Netflix hardLikelyGuesses are named companies; use unrelated names
    const stored = makeStored(scenario, 'hard', [
      guess('Totally Unrelated Co', 12),
      guess('Another Random Inc', 11),
      guess('Third Place Firm', 10),
      guess('Fourth Guess Ltd', 10),
      guess('Fifth Guess PLC', 10),
    ]);
    const findings = evaluateGate2Variant({
      difficulty: 'hard',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) =>
          f.severity === 'warning' &&
          f.message.toLowerCase().includes('zero overlap'),
      ),
    ).toBe(true);
  });

  it('direction findings are warnings only (never errors)', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(
      scenario,
      'medium',
      [
        guess('Hulu', 20),
        guess('Spotify', 18),
        guess('Disney', 15),
        guess('Amazon', 12),
        guess('Roku', 10),
      ],
      { call: 'long', confidence: 70, cue: 'growth language' },
    );
    const findings = evaluateGate2Variant({
      difficulty: 'medium',
      stored,
      scenario,
    });
    const direction = findings.filter((f) => f.path.endsWith('.direction'));
    expect(direction.length).toBeGreaterThan(0);
    expect(direction.every((f) => f.severity === 'warning')).toBe(true);
    expect(direction.every((f) => f.severity !== 'error')).toBe(true);
  });

  it('errors on stale payload hash and wrong model/prompt pins', () => {
    const scenario = loadActiveNetflix();
    const stored = makeStored(scenario, 'easy', [
      guess('Netflix', 30),
      guess('Hulu', 20),
      guess('Spotify', 15),
      guess('Disney', 10),
      guess('Amazon', 5),
    ]);
    stored.payloadHash = 'sha256:deadbeef';
    stored.model = 'wrong-model';
    stored.promptVersion = 'wrong.prompt';

    const findings = evaluateGate2Variant({
      difficulty: 'easy',
      stored,
      scenario,
    });
    expect(
      findings.some(
        (f) => f.severity === 'error' && f.path.endsWith('.payloadHash'),
      ),
    ).toBe(true);
    expect(
      findings.some((f) => f.severity === 'error' && f.path.endsWith('.model')),
    ).toBe(true);
    expect(
      findings.some(
        (f) => f.severity === 'error' && f.path.endsWith('.promptVersion'),
      ),
    ).toBe(true);
  });
});
