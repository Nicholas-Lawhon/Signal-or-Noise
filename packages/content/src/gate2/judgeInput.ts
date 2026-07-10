import {
  GATE2_DIFFICULTIES,
  type Gate2Difficulty,
} from './config';

export type JudgeExportEntry = {
  judgeId: string;
  difficulty: Gate2Difficulty;
} & Record<string, unknown>;

export type JudgeExport = {
  exportedAt: string;
  model: string;
  promptVersion: string;
  entries: JudgeExportEntry[];
};

/**
 * Reject malformed or mixed-difficulty input before it can reach the blind judge.
 * Export isolation is security-relevant: sibling variants can reveal which clues
 * were deliberately removed and contaminate an otherwise blind identity test.
 */
export function assertDifficultyIsolatedJudgeExport(
  value: unknown,
): asserts value is JudgeExport {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Judge export must be an object');
  }
  const candidate = value as Partial<JudgeExport>;
  if (!Array.isArray(candidate.entries) || candidate.entries.length === 0) {
    throw new Error('Judge export must contain entries');
  }

  const difficulties = new Set<Gate2Difficulty>();
  for (const entry of candidate.entries) {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('Judge export entries must be objects');
    }
    const raw = entry as Partial<JudgeExportEntry>;
    if (typeof raw.judgeId !== 'string' || raw.judgeId.length === 0) {
      throw new Error('Judge export entries require judgeId');
    }
    if (
      typeof raw.difficulty !== 'string' ||
      !GATE2_DIFFICULTIES.includes(raw.difficulty as Gate2Difficulty)
    ) {
      throw new Error(
        'Judge export entries require difficulty easy, medium, or hard',
      );
    }
    difficulties.add(raw.difficulty as Gate2Difficulty);
  }

  if (difficulties.size !== 1) {
    throw new Error(
      'Refusing mixed-difficulty input: each judge run must contain exactly one difficulty',
    );
  }
}
