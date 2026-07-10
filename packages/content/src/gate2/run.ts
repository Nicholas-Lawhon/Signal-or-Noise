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
  /** Opaque key used by the judge. The answer-bearing scenario id is withheld. */
  judgeId: string;
  difficulty: Gate2Difficulty;
  payloadHash: string;
  payload: Gate2VariantPayload;
};

export type ExportMappingEntry = {
  judgeId: string;
  scenarioId: string;
  difficulty: Gate2Difficulty;
  payloadHash: string;
};

export type ExportPayloadFile = {
  exportedAt: string;
  model: typeof GATE2_MODEL;
  promptVersion: typeof GATE2_PROMPT_VERSION;
  entries: ExportPayloadEntry[];
};

export type ExportMappingFile = {
  exportedAt: string;
  entries: ExportMappingEntry[];
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
 * - `skipGate2: true` for export too: exports are the repair path for stale or
 *   missing stored evidence, while all non-Gate-2 validation still blocks.
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
  /** Answer-bearing mapping written separately and withheld from the judge. */
  mappingOutPath?: string;
  /** Filter to a single scenario id when set. */
  scenarioId?: string;
  /** Required isolation boundary so a judge never sees sibling variants. */
  difficulty: Gate2Difficulty;
  /** Emit only payloads whose hash differs from a prior private mapping. */
  changedFromMappingPath?: string;
  /** When true, also load draft/ folder. Default: reviewed + active only. */
  includeDraft?: boolean;
  /** When true, load only draft/ (for a phase candidate campaign). */
  draftOnly?: boolean;
  scenariosRoot?: string;
  contentPackageRoot?: string;
  monorepoRoot?: string;
  now?: () => string;
};

/**
 * Export blind pre-decision payloads for an independent phase-internal judge.
 * Payload entries never include company name, ticker, reveal, return, or review.
 * Relative `--out` paths resolve from the monorepo root (e.g. agents/gate2/...).
 */
export function exportGate2Payloads(options: ExportOptions): {
  absoluteOutPath: string;
  absoluteMappingOutPath: string;
  file: ExportPayloadFile;
  mappingFile: ExportMappingFile;
  entryCount: number;
} {
  if (!GATE2_DIFFICULTIES.includes(options.difficulty)) {
    throw new Error('Gate 2 export requires exactly one difficulty');
  }
  const contentPackageRoot =
    options.contentPackageRoot ?? getContentPackageRoot();
  const monorepoRoot =
    options.monorepoRoot ?? getMonorepoRoot(contentPackageRoot);
  const scenariosRoot =
    options.scenariosRoot ?? getScenariosRoot(contentPackageRoot);
  const folders: ScenarioFolder[] = options.draftOnly
    ? ['draft']
    : options.includeDraft
      ? ['draft', 'reviewed', 'active']
      : [...DEFAULT_FOLDERS];

  let loaded = loadScenariosFromFolders(folders, scenariosRoot, {
    skipGate2: true,
  });
  if (options.scenarioId) {
    loaded = loaded.filter((s) => s.scenario.id === options.scenarioId);
    if (loaded.length === 0) {
      throw new Error(
        `No scenario found with id "${options.scenarioId}" in folders: ${folders.join(', ')}`,
      );
    }
  }

  const exportedAt = (options.now ?? (() => new Date().toISOString()))();
  const baselineByVariant = new Map<string, string>();
  if (options.changedFromMappingPath) {
    const baselinePath = isAbsolute(options.changedFromMappingPath)
      ? options.changedFromMappingPath
      : resolve(monorepoRoot, options.changedFromMappingPath);
    const baseline = JSON.parse(
      readFileSync(baselinePath, 'utf8'),
    ) as ExportMappingFile;
    for (const entry of baseline.entries) {
      baselineByVariant.set(
        `${entry.scenarioId}:${entry.difficulty}`,
        entry.payloadHash,
      );
    }
  }
  const entries: ExportPayloadEntry[] = [];
  const mappingEntries: ExportMappingEntry[] = [];
  for (const { scenario } of loaded) {
    for (const difficulty of GATE2_DIFFICULTIES) {
      if (difficulty !== options.difficulty) continue;
      const payload = renderVariantPayload(scenario, difficulty);
      const payloadHash = hashVariantPayload(payload);
      if (
        baselineByVariant.get(`${scenario.id}:${difficulty}`) === payloadHash
      ) {
        continue;
      }
      const judgeId = `blind_${String(entries.length + 1).padStart(4, '0')}`;
      entries.push({
        judgeId,
        difficulty,
        payloadHash,
        payload,
      });
      mappingEntries.push({
        judgeId,
        scenarioId: scenario.id,
        difficulty,
        payloadHash,
      });
    }
  }

  const file: ExportPayloadFile = {
    exportedAt,
    model: GATE2_MODEL,
    promptVersion: GATE2_PROMPT_VERSION,
    entries,
  };
  const mappingFile: ExportMappingFile = {
    exportedAt,
    entries: mappingEntries,
  };

  const absoluteOutPath = isAbsolute(options.outPath)
    ? options.outPath
    : resolve(monorepoRoot, options.outPath);
  const mappingOutPath = options.mappingOutPath ?? `${options.outPath}.mapping.json`;
  const absoluteMappingOutPath = isAbsolute(mappingOutPath)
    ? mappingOutPath
    : resolve(monorepoRoot, mappingOutPath);
  mkdirSync(dirname(absoluteOutPath), { recursive: true });
  mkdirSync(dirname(absoluteMappingOutPath), { recursive: true });
  writeFileSync(absoluteOutPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  writeFileSync(
    absoluteMappingOutPath,
    `${JSON.stringify(mappingFile, null, 2)}\n`,
    'utf8',
  );

  return {
    absoluteOutPath,
    absoluteMappingOutPath,
    file,
    mappingFile,
    entryCount: entries.length,
  };
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
 * Missing results are reported as info for draft content.
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
  // structured ERROR lines instead of aborting the command.
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
        message: `Missing Gate 2 result (${status}) — informational until the phase gate`,
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
  mappingOutPath?: string;
  scenarioId?: string;
  difficulty?: Gate2Difficulty;
  changedFromMappingPath?: string;
  includeDraft: boolean;
  draftOnly: boolean;
} {
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help') {
    return { command: 'help', includeDraft: false, draftOnly: false };
  }

  const command = argv[0];
  if (command !== 'export' && command !== 'check') {
    throw new Error(
      `Unknown gate2 command "${command}". Use: export | check`,
    );
  }

  let outPath: string | undefined;
  let mappingOutPath: string | undefined;
  let scenarioId: string | undefined;
  let difficulty: Gate2Difficulty | undefined;
  let changedFromMappingPath: string | undefined;
  let includeDraft = false;
  let draftOnly = false;

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      outPath = argv[i + 1];
      i += 1;
      if (!outPath) throw new Error('--out requires a path');
    } else if (arg === '--mapping-out') {
      mappingOutPath = argv[i + 1];
      i += 1;
      if (!mappingOutPath) throw new Error('--mapping-out requires a path');
    } else if (arg === '--id') {
      scenarioId = argv[i + 1];
      i += 1;
      if (!scenarioId) throw new Error('--id requires a scenario id');
    } else if (arg === '--include-draft') {
      includeDraft = true;
    } else if (arg === '--draft-only') {
      draftOnly = true;
    } else if (arg === '--difficulty') {
      const value = argv[i + 1];
      i += 1;
      if (!value || !GATE2_DIFFICULTIES.includes(value as Gate2Difficulty)) {
        throw new Error('--difficulty requires easy, medium, or hard');
      }
      difficulty = value as Gate2Difficulty;
    } else if (arg === '--changed-from') {
      changedFromMappingPath = argv[i + 1];
      i += 1;
      if (!changedFromMappingPath) {
        throw new Error('--changed-from requires a private mapping path');
      }
    } else if (arg === '--help') {
      return { command: 'help', includeDraft: false, draftOnly: false };
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (command === 'export' && !outPath) {
    throw new Error('export requires --out <path>');
  }
  if (command === 'export' && !difficulty) {
    throw new Error('export requires --difficulty <easy|medium|hard>');
  }
  if (includeDraft && draftOnly) {
    throw new Error('--include-draft and --draft-only are mutually exclusive');
  }

  return {
    command,
    outPath,
    mappingOutPath,
    scenarioId,
    difficulty,
    changedFromMappingPath,
    includeDraft,
    draftOnly,
  };
}

export function printHelp(): void {
  console.log(`Gate 2 offline helpers (no model calls)

Usage:
  pnpm --filter @signal-or-noise/content gate2 -- export --out <judge-path> --difficulty <easy|medium|hard> [--mapping-out <private-path>] [--id <scenarioId>] [--changed-from <prior-private-mapping>] [--draft-only|--include-draft]
  pnpm --filter @signal-or-noise/content gate2 -- check [--id <scenarioId>] [--include-draft]

Commands:
  export   Write opaque blind payloads plus a separate answer-bearing mapping
  check    Evaluate stored review.gate2 results offline; draft missing = informational
`);
}
