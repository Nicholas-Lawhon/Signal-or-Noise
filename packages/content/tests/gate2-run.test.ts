import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  exportGate2Payloads,
  getContentPackageRoot,
  getScenariosRoot,
  parseGate2Args,
} from '../src/gate2/run';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('Gate 2 blind export', () => {
  it('withholds scenario identities in a separate mapping', () => {
    const dir = mkdtempSync(join(tmpdir(), 'signal-gate2-'));
    tempDirs.push(dir);
    const outPath = join(dir, 'hard.json');
    const mappingOutPath = join(dir, 'hard.private.json');
    const contentPackageRoot = getContentPackageRoot();

    const result = exportGate2Payloads({
      outPath,
      mappingOutPath,
      difficulty: 'hard',
      scenariosRoot: getScenariosRoot(contentPackageRoot),
      contentPackageRoot,
      includeDraft: false,
      now: () => '2026-07-10T00:00:00.000Z',
    });

    expect(result.entryCount).toBeGreaterThan(0);
    expect(result.file.entries.every((entry) => entry.difficulty === 'hard')).toBe(
      true,
    );
    expect(result.file.entries[0]?.judgeId).toBe('blind_0001');
    expect(result.mappingFile.entries).toHaveLength(result.entryCount);
    expect(result.mappingFile.entries[0]?.judgeId).toBe(
      result.file.entries[0]?.judgeId,
    );

    const judgeText = readFileSync(outPath, 'utf8').toLowerCase();
    const mappingText = readFileSync(mappingOutPath, 'utf8');
    expect(judgeText).not.toContain('scenarioid');
    expect(mappingText).toContain('scenarioId');
    for (const mapping of result.mappingFile.entries) {
      expect(judgeText).not.toContain(mapping.scenarioId.toLowerCase());
    }
  });

  it('parses separate mapping and difficulty options', () => {
    expect(
      parseGate2Args([
        'export',
        '--out',
        'judge.json',
        '--mapping-out',
        'private.json',
        '--difficulty',
        'medium',
        '--draft-only',
      ]),
    ).toEqual({
      command: 'export',
      outPath: 'judge.json',
      mappingOutPath: 'private.json',
      scenarioId: undefined,
      difficulty: 'medium',
      changedFromMappingPath: undefined,
      includeDraft: false,
      draftOnly: true,
    });
  });

  it('rejects an export command without a difficulty boundary', () => {
    expect(() => parseGate2Args(['export', '--out', 'judge.json'])).toThrow(
      'export requires --difficulty <easy|medium|hard>',
    );
  });

  it('rejects a programmatic export without a difficulty boundary', () => {
    const dir = mkdtempSync(join(tmpdir(), 'signal-gate2-'));
    tempDirs.push(dir);

    expect(() =>
      exportGate2Payloads({
        outPath: join(dir, 'judge.json'),
        // @ts-expect-error Regression coverage for untyped JavaScript callers.
        difficulty: undefined,
      }),
    ).toThrow('Gate 2 export requires exactly one difficulty');
  });
});
