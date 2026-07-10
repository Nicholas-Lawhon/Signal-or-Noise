/**
 * Run one difficulty-isolated Gate 2 export through the pinned Grok CLI.
 * The private mapping is deliberately not accepted by this command.
 */
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gate2JudgeResultSchema } from './gate2/resultValidation';
import {
  assertDifficultyIsolatedJudgeExport,
  type JudgeExport,
} from './gate2/judgeInput';

type JudgeResult = {
  model: string;
  promptVersion: string;
  testedAt: string;
  entries: ({ judgeId: string } & Record<string, unknown>)[];
};

function requiredArgument(argv: string[], flag: string): string {
  const index = argv.indexOf(flag);
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a path`);
  }
  return value;
}

function jsonObjects(text: string): unknown[] {
  const values: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try {
          values.push(JSON.parse(text.slice(start, index + 1)) as unknown);
        } catch {
          // Ignore malformed attempts; exact-coverage validation selects a result.
        }
        start = -1;
      }
    }
  }
  return values;
}

function isJudgeResult(value: unknown): value is JudgeResult {
  return gate2JudgeResultSchema.safeParse(value).success;
}

function extractJudgeResult(stdout: string, expectedIds: string[]): JudgeResult {
  const candidates: unknown[] = [];
  try {
    const outer = JSON.parse(stdout) as unknown;
    candidates.push(outer);
    if (typeof outer === 'object' && outer !== null) {
      const wrapper = outer as {
        structuredOutput?: unknown;
        text?: unknown;
      };
      if (wrapper.structuredOutput) candidates.push(wrapper.structuredOutput);
      if (typeof wrapper.text === 'string') {
        candidates.push(...jsonObjects(wrapper.text));
      }
    }
  } catch {
    candidates.push(...jsonObjects(stdout));
  }

  const expected = [...expectedIds].sort();
  for (const candidate of candidates) {
    if (!isJudgeResult(candidate)) continue;
    const actual = candidate.entries
      .map((entry) => entry.judgeId)
      .sort();
    if (
      actual.length === expected.length &&
      actual.every((id, index) => id === expected[index])
    ) {
      return candidate;
    }
  }
  throw new Error(
    `Grok output did not contain one complete result covering ${expected.length} judge IDs`,
  );
}

function main(): void {
  let argv = process.argv.slice(2);
  if (argv[0] === '--') argv = argv.slice(1);

  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const monorepoRoot = resolve(packageRoot, '..', '..');
  const inputPath = resolve(monorepoRoot, requiredArgument(argv, '--input'));
  const outputPath = resolve(monorepoRoot, requiredArgument(argv, '--output'));
  const chunkSizeIndex = argv.indexOf('--chunk-size');
  const chunkSize =
    chunkSizeIndex >= 0 ? Number(requiredArgument(argv, '--chunk-size')) : 10;
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 20) {
    throw new Error('--chunk-size must be an integer from 1 to 20');
  }
  const known = new Set([
    '--input',
    argv[argv.indexOf('--input') + 1],
    '--output',
    argv[argv.indexOf('--output') + 1],
    ...(chunkSizeIndex >= 0
      ? ['--chunk-size', argv[chunkSizeIndex + 1]]
      : []),
  ]);
  const unknown = argv.find((argument) => !known.has(argument));
  if (unknown) throw new Error(`Unknown argument: ${unknown}`);

  const judgePrompt = readFileSync(
    resolve(packageRoot, 'GATE2_JUDGE_PROMPT.md'),
    'utf8',
  );
  const exportJson = readFileSync(inputPath, 'utf8');
  // Prove the judge input has no explicit answer-bearing mapping field.
  if (/"scenarioId"\s*:/.test(exportJson)) {
    throw new Error('Refusing non-blind input: export contains scenarioId');
  }
  const judgeExport: unknown = JSON.parse(exportJson);
  assertDifficultyIsolatedJudgeExport(judgeExport);
  const schema = readFileSync(
    resolve(packageRoot, 'gate2-result.schema.json'),
    'utf8',
  );

  const tempRoot = mkdtempSync(resolve(tmpdir(), 'signal-gate2-judge-'));
  const promptPath = resolve(tempRoot, 'prompt.md');
  try {
    const command = process.platform === 'win32' ? 'grok.exe' : 'grok';
    const mergedEntries: JudgeResult['entries'] = [];
    let testedAt: string | undefined;
    for (let offset = 0; offset < judgeExport.entries.length; offset += chunkSize) {
      const entries = judgeExport.entries.slice(offset, offset + chunkSize);
      const chunk: JudgeExport = { ...judgeExport, entries };
      writeFileSync(
        promptPath,
        `${judgePrompt}\n\n## Judge export\n\n\`\`\`json\n${JSON.stringify(chunk, null, 2)}\n\`\`\`\n`,
        'utf8',
      );
      const result = spawnSync(
        command,
        [
          '--model',
          'grok-4.5',
          '--reasoning-effort',
          'medium',
          '--prompt-file',
          promptPath,
          '--json-schema',
          schema,
          '--disable-web-search',
          '--no-memory',
          '--no-subagents',
          '--max-turns',
          '1',
          '--permission-mode',
          'plan',
        ],
        {
          cwd: tempRoot,
          encoding: 'utf8',
          maxBuffer: 20 * 1024 * 1024,
        },
      );
      if (result.status !== 0) {
        throw new Error(
          `Grok judge failed (${result.status ?? 'no status'}): ${result.stderr || result.stdout}`,
        );
      }
      const judged = extractJudgeResult(
        result.stdout,
        entries.map((entry) => entry.judgeId),
      );
      if (judged.model !== judgeExport.model) {
        throw new Error(`Judge model mismatch: ${judged.model}`);
      }
      if (judged.promptVersion !== judgeExport.promptVersion) {
        throw new Error(`Judge prompt mismatch: ${judged.promptVersion}`);
      }
      testedAt ??= judged.testedAt;
      mergedEntries.push(...judged.entries);
    }
    const merged: JudgeResult = {
      model: judgeExport.model,
      promptVersion: judgeExport.promptVersion,
      testedAt: testedAt ?? new Date().toISOString(),
      entries: mergedEntries,
    };
    writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`Wrote blind Gate 2 results to ${outputPath}`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`gate2 judge failed: ${message}`);
  process.exit(1);
}
