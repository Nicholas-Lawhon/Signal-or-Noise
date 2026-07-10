/** Node-only blind Gate 2 result importer. Do not re-export from package root. */
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { z } from 'zod';
import {
  GATE2_APPROVED_MODELS,
  GATE2_DIFFICULTIES,
  GATE2_PROMPT_VERSION,
} from './config';
import { hashScenarioVariant } from './payload';
import { gate2JudgeResultSchema } from './resultValidation';
import { validateScenario } from '../validation';
import type { ExportMappingFile } from './run';
import type {
  Gate2DirectionResult,
  Gate2Guess,
  Gate2VariantResult,
  Scenario,
} from '../types';

const nonEmptyString = z.string().min(1);
const mappingFileSchema = z.object({
  exportedAt: z.string().datetime(),
  entries: z
    .array(
      z.object({
        judgeId: nonEmptyString,
        scenarioId: nonEmptyString,
        difficulty: z.enum(GATE2_DIFFICULTIES),
        payloadHash: z
          .string()
          .regex(/^sha256:[a-f0-9]{64}$/, 'Expected a SHA-256 payload hash'),
      }),
    )
    .min(1),
});

export type BlindGate2ResultFile = z.infer<typeof gate2JudgeResultSchema>;

type LoadedScenario = {
  filePath: string;
  raw: Scenario;
  scenario: Scenario;
};

export type ApplyGate2Options = {
  resultsPath: string;
  mappingPath: string;
  scenariosRoot: string;
  cwd?: string;
};

export type ApplyGate2Report = {
  appliedVariants: number;
  updatedFiles: number;
};

function readJson(path: string, label: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read ${label} at ${path}: ${message}`);
  }
}

function parseOrThrow<T>(
  schema: z.ZodType<T>,
  input: unknown,
  label: string,
): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid ${label}: ${detail}`);
  }
  return parsed.data;
}

function indexUnique<T>(
  values: T[],
  key: (value: T) => string,
  label: string,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const value of values) {
    const id = key(value);
    if (index.has(id)) {
      throw new Error(`Duplicate ${label} "${id}"`);
    }
    index.set(id, value);
  }
  return index;
}

function loadScenarios(scenariosRoot: string): Map<string, LoadedScenario> {
  const loaded: LoadedScenario[] = [];
  for (const folder of ['draft', 'reviewed', 'active'] as const) {
    const directory = join(scenariosRoot, folder);
    if (!existsSync(directory)) continue;

    for (const name of readdirSync(directory).sort()) {
      if (!name.toLowerCase().endsWith('.json')) continue;
      const filePath = join(directory, name);
      const raw = readJson(filePath, `scenario ${name}`);
      const validation = validateScenario(raw, { skipGate2: true });
      if (!validation.success) {
        const detail = validation.errors
          .map((error) => `${error.path}: ${error.message}`)
          .join('; ');
        throw new Error(`Invalid scenario ${filePath}: ${detail}`);
      }
      loaded.push({
        filePath,
        raw: raw as Scenario,
        scenario: validation.scenario,
      });
    }
  }
  return indexUnique(loaded, (entry) => entry.scenario.id, 'scenario ID');
}

function resolveInputPath(path: string, cwd: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path);
}

/**
 * Join opaque judge results to the private export mapping and apply them.
 * Every shape, coverage, lookup, difficulty, and hash check completes before
 * the first scenario file is written.
 */
export function applyBlindGate2Results(
  options: ApplyGate2Options,
): ApplyGate2Report {
  const cwd = options.cwd ?? process.cwd();
  const resultsPath = resolveInputPath(options.resultsPath, cwd);
  const mappingPath = resolveInputPath(options.mappingPath, cwd);
  const scenariosRoot = resolveInputPath(options.scenariosRoot, cwd);

  const results = parseOrThrow(
    gate2JudgeResultSchema,
    readJson(resultsPath, 'result file'),
    'Gate 2 result file',
  );
  const mapping = parseOrThrow<ExportMappingFile>(
    mappingFileSchema,
    readJson(mappingPath, 'private mapping file'),
    'Gate 2 private mapping file',
  );

  if (!(GATE2_APPROVED_MODELS as readonly string[]).includes(results.model)) {
    throw new Error(
      `Unapproved Gate 2 model "${results.model}"; expected one of ${GATE2_APPROVED_MODELS.join(', ')}`,
    );
  }
  if (results.promptVersion !== GATE2_PROMPT_VERSION) {
    throw new Error(
      `Gate 2 prompt version mismatch: got "${results.promptVersion}", expected "${GATE2_PROMPT_VERSION}"`,
    );
  }

  const resultByJudgeId = indexUnique(
    results.entries,
    (entry) => entry.judgeId,
    'result judge ID',
  );
  const mappingByJudgeId = indexUnique(
    mapping.entries,
    (entry) => entry.judgeId,
    'mapping judge ID',
  );
  const resultIds = [...resultByJudgeId.keys()].sort();
  const mappingIds = [...mappingByJudgeId.keys()].sort();
  if (
    resultIds.length !== mappingIds.length ||
    resultIds.some((id, index) => id !== mappingIds[index])
  ) {
    throw new Error(
      'Judge-ID coverage mismatch: results must exactly cover the private mapping',
    );
  }

  indexUnique(
    mapping.entries,
    (entry) => `${entry.scenarioId}:${entry.difficulty}`,
    'scenario/difficulty mapping',
  );

  const scenarioById = loadScenarios(scenariosRoot);
  const pending = new Map<string, LoadedScenario>();

  for (const mappingEntry of mapping.entries) {
    const resultEntry = resultByJudgeId.get(mappingEntry.judgeId);
    if (!resultEntry) {
      throw new Error(`Missing result for judge ID "${mappingEntry.judgeId}"`);
    }
    const loaded = scenarioById.get(mappingEntry.scenarioId);
    if (!loaded) {
      throw new Error(
        `Mapping references unknown scenario "${mappingEntry.scenarioId}"`,
      );
    }
    if (
      !loaded.scenario.scenario.difficultySupported.includes(
        mappingEntry.difficulty,
      )
    ) {
      throw new Error(
        `Scenario "${mappingEntry.scenarioId}" does not support difficulty "${mappingEntry.difficulty}"`,
      );
    }

    const currentHash = hashScenarioVariant(
      loaded.scenario,
      mappingEntry.difficulty,
    );
    if (mappingEntry.payloadHash !== currentHash) {
      throw new Error(
        `Stale mapping hash for judge ID "${mappingEntry.judgeId}": mapped ${mappingEntry.payloadHash}, current ${currentHash}`,
      );
    }

    const stored: Gate2VariantResult = {
      payloadHash: currentHash,
      model: results.model,
      promptVersion: results.promptVersion,
      testedAt: results.testedAt,
      guesses: resultEntry.guesses as Gate2Guess[],
      direction: resultEntry.direction as Gate2DirectionResult,
    };
    loaded.raw.review.gate2 ??= {};
    loaded.raw.review.gate2[mappingEntry.difficulty] = stored;
    pending.set(loaded.filePath, loaded);
  }

  // All validation and joins have succeeded. Writes begin only here.
  for (const loaded of pending.values()) {
    writeFileSync(
      loaded.filePath,
      `${JSON.stringify(loaded.raw, null, 2)}\n`,
      'utf8',
    );
  }

  return {
    appliedVariants: mapping.entries.length,
    updatedFiles: pending.size,
  };
}
