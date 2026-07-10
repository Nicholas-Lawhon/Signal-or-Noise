import { describe, expect, it } from 'vitest';
import { assertDifficultyIsolatedJudgeExport } from '../src/gate2/judgeInput';

const baseExport = {
  exportedAt: '2026-07-10T00:00:00.000Z',
  model: 'grok-4.5',
  promptVersion: 'guess.v1+direction.v1',
};

describe('Gate 2 judge input isolation', () => {
  it('accepts entries from exactly one difficulty', () => {
    const input: unknown = {
      ...baseExport,
      entries: [
        { judgeId: 'blind_0001', difficulty: 'medium' },
        { judgeId: 'blind_0002', difficulty: 'medium' },
      ],
    };

    expect(() => assertDifficultyIsolatedJudgeExport(input)).not.toThrow();
  });

  it('rejects mixed-difficulty entries', () => {
    const input: unknown = {
      ...baseExport,
      entries: [
        { judgeId: 'blind_0001', difficulty: 'easy' },
        { judgeId: 'blind_0002', difficulty: 'hard' },
      ],
    };

    expect(() => assertDifficultyIsolatedJudgeExport(input)).toThrow(
      'Refusing mixed-difficulty input',
    );
  });

  it('rejects entries with no declared difficulty', () => {
    const input: unknown = {
      ...baseExport,
      entries: [{ judgeId: 'blind_0001' }],
    };

    expect(() => assertDifficultyIsolatedJudgeExport(input)).toThrow(
      'Judge export entries require difficulty',
    );
  });
});
