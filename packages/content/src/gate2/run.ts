/**
 * Node-only Gate 2 CLI helpers: export blind payloads and check stored results.
 * No model API calls. Do not re-export from package root.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GATE2_DIFFICULTIES,
  GATE2_MODEL,
  GATE2_PROMPT_VERSION,
  type Gate2Difficulty,
} from './config';
import { evaluateScenarioGate2, listMissingGate2Variants } from './evaluate';
import {
  hashVariantPayload,
  renderVariantPayload,
  type Gate2VariantPayload,
} from './payload';
import { validateScenario } from '../validation';
import type { Scenario, ScenarioStatus } from '../types';

export type ExportPayloadEntry = {
  scenarioId: string;
  difficulty: Gate2Difficulty;
  payloadHash: string;
  payload: Gate2VariantPayload;
};

export type ExportPayloadFile = {
  exportedAt: string;
  model: typeof GATE2_MODEL;
  promptVersion: typeof GATE2_PROMPT_VERSION;
  entries: ExportPayloadEntry[];
};

type ScenarioFolder = 'draft' | 'reviewed' | 'active';

const DEFAULT_FOLDERS: ScenarioFolder[] = ['reviewed', 'active'];

/** packages/content root (src/gate2/run.ts → ../../..) */
export function getContentPackageRoot(): string {
  const here = fileURLToPath(import.meta.url);
  return resolve(here, '..', '..', '..');
}

/** Monorepo root (packages/content → ../..) */
export function getMonorepoRoot(
  contentPackageRoot = getContentPackageRoot(),
): string {
  return resolve(contentPackageRoot, '..', '..');
}

export function getScenariosRoot(
  contentPackageRoot = getContentPackageRoot(),
): string {
  return join(contentPackageRoot, 'scenarios');
}

/**
 * Load + validate scenarios for Gate 2 CLI.
 * - `skipGate2: true` for check: non-Gate-2 failures still block; Gate 2
 *   stored-result issues are reported later as structured findings.
 * - `skipGate2: false` (default) for export: full validation required.
 */
function loadScenariosFromFolders(
  folders: ScenarioFolder[],
  scenariosRoot: string,
  options?: { skipGate2?: boolean },
): { relativePath: string; scenario: Scenario }[] {
  const out: { relativePath: string; scenario: Scenario }[] = [];
  const skipGate2 = options?.skipGate2 ?? false;

  for (const folder of folders) {
    const dir = join(scenariosRoot, folder);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .sort();

    for (const name of files) {
      const filePath = join(dir, name);
      const relativePath = join('scenarios', folder, name);
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse ${relativePath}: ${message}`);
      }

      const result = validateScenario(raw, { skipGate2 });
      if (!result.success) {
        const detail = result.errors
          .map((e) => `${e.path}: ${e.message}`)
          .join('; ');
        throw new Error(`Invalid scenario ${relativePath}: ${detail}`);
      }
      out.push({ relativePath, scenario: result.scenario });
    }
  }

  return out;
}

export type ExportOptions = {
  outPath: string;
  /** Filter to a single scenario id when set. */
  scenarioId?: string;
  /** When true, also load draft/ folder. Default: reviewed + active only. */
  includeDraft?: boolean;
  scenariosRoot?: string;
  contentPackageRoot?: string;
  monorepoRoot?: string;
  now?: () => string;
};

/**
 * Export blind pre-decision payloads for the next Grok judge handoff.
 * Payload entries never include company name, ticker, reveal, return, or review.
 * Relative `--out` paths resolve from the monorepo root (e.g. agents/gate2/...).
 */
export function exportGate2Payloads(options: ExportOptions): {
  absoluteOutPath: string;
  file: ExportPayloadFile;
  entryCount: number;
} {
  const contentPackageRoot =
    options.contentPackageRoot ?? getContentPackageRoot();
  const monorepoRoot =
    options.monorepoRoot ?? getMonorepoRoot(contentPackageRoot);
  const scenariosRoot =
    options.scenariosRoot ?? getScenariosRoot(contentPackageRoot);
  const folders: ScenarioFolder[] = options.includeDraft
    ? ['draft', 'reviewed', 'active']
    : [...DEFAULT_FOLDERS];

  let loaded = loadScenariosFromFolders(folders, scenariosRoot);
  if (options.scenarioId) {
    loaded = loaded.filter((s) => s.scenario.id === options.scenarioId);
    if (loaded.length === 0) {
      throw new Error(
        `No scenario found with id "${options.scenarioId}" in folders: ${folders.join(', ')}`,
      );
    }
  }

  const entries: ExportPayloadEntry[] = [];
  for (const { scenario } of loaded) {
    for (const difficulty of GATE2_DIFFICULTIES) {
      const payload = renderVariantPayload(scenario, difficulty);
      entries.push({
        scenarioId: scenario.id,
        difficulty,
        payloadHash: hashVariantPayload(payload),
        payload,
      });
    }
  }

  const file: ExportPayloadFile = {
    exportedAt: (options.now ?? (() => new Date().toISOString()))(),
    model: GATE2_MODEL,
    promptVersion: GATE2_PROMPT_VERSION,
    entries,
  };

  const absoluteOutPath = isAbsolute(options.outPath)
    ? options.outPath
    : resolve(monorepoRoot, options.outPath);
  mkdirSync(dirname(absoluteOutPath), { recursive: true });
  writeFileSync(absoluteOutPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');

  return { absoluteOutPath, file, entryCount: entries.length };
}

export type CheckOptions = {
  includeDraft?: boolean;
  scenarioId?: string;
  scenariosRoot?: string;
  contentPackageRoot?: string;
};

export type CheckReportLine = {
  severity: 'error' | 'warning' | 'info';
  scenarioId: string;
  path: string;
  message: string;
};

/**
 * Offline check of any stored review.gate2 results.
 * Missing results are reported as info (not failures) in H021.
 * Returns exitCode 1 only when real error findings exist on stored results.
 */
export function checkGate2StoredResultsCli(options: CheckOptions = {}): {
  lines: CheckReportLine[];
  errorCount: number;
  warningCount: number;
  missingCount: number;
  exitCode: number;
} {
  const contentPackageRoot =
    options.contentPackageRoot ?? getContentPackageRoot();
  const scenariosRoot =
    options.scenariosRoot ?? getScenariosRoot(contentPackageRoot);
  const folders: ScenarioFolder[] = options.includeDraft
    ? ['draft', 'reviewed', 'active']
    : [...DEFAULT_FOLDERS];

  // Skip Gate 2 during load so stale/wrong-pin/threshold failures become
  // structured ERROR lines instead of aborting the command (H022).
  let loaded = loadScenariosFromFolders(folders, scenariosRoot, {
    skipGate2: true,
  });
  if (options.scenarioId) {
    loaded = loaded.filter((s) => s.scenario.id === options.scenarioId);
  }

  const lines: CheckReportLine[] = [];
  let errorCount = 0;
  let warningCount = 0;
  let missingCount = 0;

  for (const { scenario } of loaded) {
    const status: ScenarioStatus = scenario.status;
    const missing = listMissingGate2Variants(scenario);
    for (const difficulty of missing) {
      missingCount += 1;
      lines.push({
        severity: 'info',
        scenarioId: scenario.id,
        path: `review.gate2.${difficulty}`,
        message: `Missing Gate 2 result (${status}) — not enforced in H021`,
      });
    }

    const findings = evaluateScenarioGate2(scenario);
    for (const finding of findings) {
      // Draft: surface threshold/pin issues as warnings only (C003 Q7).
      const severity =
        status === 'draft' && finding.severity === 'error'
          ? 'warning'
          : finding.severity;

      if (severity === 'error') errorCount += 1;
      else warningCount += 1;

      lines.push({
        severity,
        scenarioId: scenario.id,
        path: finding.path,
        message: finding.message,
      });
    }
  }

  return {
    lines,
    errorCount,
    warningCount,
    missingCount,
    exitCode: errorCount > 0 ? 1 : 0,
  };
}

/**
 * Parse argv after `gate2` (e.g. process.argv.slice(2)).
 */
export function parseGate2Args(argv: string[]): {
  command: 'export' | 'check' | 'help';
  outPath?: string;
  scenarioId?: string;
  includeDraft: boolean;
} {
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help') {
    return { command: 'help', includeDraft: false };
  }

  const command = argv[0];
  if (command !== 'export' && command !== 'check') {
    throw new Error(
      `Unknown gate2 command "${command}". Use: export | check`,
    );
  }

  let outPath: string | undefined;
  let scenarioId: string | undefined;
  let includeDraft = false;

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      outPath = argv[i + 1];
      i += 1;
      if (!outPath) throw new Error('--out requires a path');
    } else if (arg === '--id') {
      scenarioId = argv[i + 1];
      i += 1;
      if (!scenarioId) throw new Error('--id requires a scenario id');
    } else if (arg === '--include-draft') {
      includeDraft = true;
    } else if (arg === '--help') {
      return { command: 'help', includeDraft: false };
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (command === 'export' && !outPath) {
    throw new Error('export requires --out <path>');
  }

  return { command, outPath, scenarioId, includeDraft };
}

export function printHelp(): void {
  console.log(`Gate 2 offline helpers (no model calls)

Usage:
  pnpm --filter @signal-or-noise/content gate2 -- export --out <path> [--id <scenarioId>] [--include-draft]
  pnpm --filter @signal-or-noise/content gate2 -- check [--id <scenarioId>] [--include-draft]

Commands:
  export   Write blind pre-decision payloads (scenario id, difficulty, hash, payload only)
  check    Evaluate any stored review.gate2 results offline; missing = info only in H021
`);
}
