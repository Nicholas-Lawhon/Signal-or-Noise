import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { applyBlindGate2Results } from '../src/gate2/apply';
import {
  GATE2_DEFAULT_MODEL,
  GATE2_PROMPT_VERSION,
} from '../src/gate2/config';
import { hashScenarioVariant } from '../src/gate2/payload';
import type { ExportMappingFile } from '../src/gate2/run';
import type { Scenario } from '../src/types';

const SOURCE_SCENARIO = resolve(
  __dirname,
  '../scenarios/archived/scenario_netflix_2012_2017.json',
);

function guesses(label: string) {
  return Array.from({ length: 5 }, (_, index) => ({
    company: `${label} Company ${index + 1}`,
    confidence: 30 - index,
    pointingFact: `${label} fact ${index + 1}`,
  }));
}

describe('applyBlindGate2Results', () => {
  let root: string;
  let scenariosRoot: string;
  let scenarioPath: string;
  let resultsPath: string;
  let mappingPath: string;
  let scenario: Scenario;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'signal-gate2-apply-'));
    scenariosRoot = join(root, 'scenarios');
    const draftRoot = join(scenariosRoot, 'draft');
    mkdirSync(draftRoot, { recursive: true });
    scenarioPath = join(draftRoot, 'scenario.json');
    copyFileSync(SOURCE_SCENARIO, scenarioPath);
    scenario = JSON.parse(readFileSync(scenarioPath, 'utf8')) as Scenario;
    scenario.status = 'draft';
    delete scenario.review.gate2;
    writeFileSync(scenarioPath, `${JSON.stringify(scenario, null, 2)}\n`);
    resultsPath = join(root, 'results.json');
    mappingPath = join(root, 'mapping.json');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function writeFixture(options?: {
    staleHash?: boolean;
    omitMediumResult?: boolean;
    model?: string;
    duplicateGuess?: boolean;
    unsortedGuesses?: boolean;
  }): void {
    const mapping: ExportMappingFile = {
      exportedAt: '2026-07-10T00:00:00.000Z',
      entries: [
        {
          judgeId: 'blind_0001',
          scenarioId: scenario.id,
          difficulty: 'easy',
          payloadHash: options?.staleHash
            ? `sha256:${'0'.repeat(64)}`
            : hashScenarioVariant(scenario, 'easy'),
        },
        {
          judgeId: 'blind_0002',
          scenarioId: scenario.id,
          difficulty: 'medium',
          payloadHash: hashScenarioVariant(scenario, 'medium'),
        },
      ],
    };
    const entries = [
      {
        judgeId: 'blind_0002',
        guesses: guesses('medium'),
        direction: {
          call: 'toss_up',
          confidence: 40,
          cue: 'medium cue',
        },
      },
      {
        judgeId: 'blind_0001',
        guesses: guesses('easy'),
        direction: { call: 'long', confidence: 55, cue: 'easy cue' },
      },
    ];
    if (options?.omitMediumResult) entries.shift();
    if (options?.duplicateGuess) {
      entries[0]!.guesses[4]!.company = entries[0]!.guesses[0]!.company.toUpperCase();
    }
    if (options?.unsortedGuesses) {
      entries[0]!.guesses[4]!.confidence = 31;
    }

    writeFileSync(mappingPath, JSON.stringify(mapping));
    writeFileSync(
      resultsPath,
      JSON.stringify({
        model: options?.model ?? GATE2_DEFAULT_MODEL,
        promptVersion: GATE2_PROMPT_VERSION,
        testedAt: '2026-07-10T01:00:00.000Z',
        entries,
      }),
    );
  }

  it('joins opaque IDs through the private mapping and updates only Gate 2 review data', () => {
    writeFixture();
    const before = JSON.parse(readFileSync(scenarioPath, 'utf8')) as Scenario;

    const report = applyBlindGate2Results({
      resultsPath,
      mappingPath,
      scenariosRoot,
    });
    const after = JSON.parse(readFileSync(scenarioPath, 'utf8')) as Scenario;

    expect(report).toEqual({ appliedVariants: 2, updatedFiles: 1 });
    expect(after.review.gate2?.easy?.direction.cue).toBe('easy cue');
    expect(after.review.gate2?.medium?.direction.cue).toBe('medium cue');
    expect({ ...after, review: { ...after.review, gate2: undefined } }).toEqual({
      ...before,
      review: { ...before.review, gate2: undefined },
    });
  });

  it('rejects incomplete judge-ID coverage before writing', () => {
    writeFixture({ omitMediumResult: true });
    const before = readFileSync(scenarioPath, 'utf8');

    expect(() =>
      applyBlindGate2Results({ resultsPath, mappingPath, scenariosRoot }),
    ).toThrow(/coverage mismatch/i);
    expect(readFileSync(scenarioPath, 'utf8')).toBe(before);
  });

  it('rejects a stale private-mapping hash before writing', () => {
    writeFixture({ staleHash: true });
    const before = readFileSync(scenarioPath, 'utf8');

    expect(() =>
      applyBlindGate2Results({ resultsPath, mappingPath, scenariosRoot }),
    ).toThrow(/stale mapping hash/i);
    expect(readFileSync(scenarioPath, 'utf8')).toBe(before);
  });

  it('rejects an unapproved model before writing', () => {
    writeFixture({ model: 'unapproved-judge' });
    const before = readFileSync(scenarioPath, 'utf8');

    expect(() =>
      applyBlindGate2Results({ resultsPath, mappingPath, scenariosRoot }),
    ).toThrow(/unapproved gate 2 model/i);
    expect(readFileSync(scenarioPath, 'utf8')).toBe(before);
  });

  it('rejects duplicate company guesses before writing', () => {
    writeFixture({ duplicateGuess: true });
    const before = readFileSync(scenarioPath, 'utf8');

    expect(() =>
      applyBlindGate2Results({ resultsPath, mappingPath, scenariosRoot }),
    ).toThrow(/company guesses must be distinct/i);
    expect(readFileSync(scenarioPath, 'utf8')).toBe(before);
  });

  it('rejects guesses outside descending confidence order before writing', () => {
    writeFixture({ unsortedGuesses: true });
    const before = readFileSync(scenarioPath, 'utf8');

    expect(() =>
      applyBlindGate2Results({ resultsPath, mappingPath, scenariosRoot }),
    ).toThrow(/descending confidence order/i);
    expect(readFileSync(scenarioPath, 'utf8')).toBe(before);
  });
});
