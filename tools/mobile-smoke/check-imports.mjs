/**
 * Static import-constraint check for the mobile shared surface.
 *
 * Walks the import graph from each surface entry point and fails if any module
 * imports something outside the allowlist (zod and workspace surface modules).
 * This catches Node builtins, Prisma, Next.js, react-dom, dotenv, and any new
 * external dependency before it silently breaks Expo readiness.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Entry points that define the mobile shared surface. */
const SURFACE_ENTRIES = [
  'packages/shared-types/src/index.ts',
  'packages/game-engine/src/index.ts',
  'packages/content/src/textEncoding.ts',
  'packages/content/src/types.ts',
  'packages/content/src/schema.ts',
];

/** External module specifiers the surface may import. */
const ALLOWED_EXTERNALS = new Set(['zod']);

/** Workspace specifiers resolved to their source files (mirrors package.json exports). */
const WORKSPACE_EXPORTS = {
  '@signal-or-noise/shared-types': 'packages/shared-types/src/index.ts',
  '@signal-or-noise/game-engine': 'packages/game-engine/src/index.ts',
  '@signal-or-noise/content': 'packages/content/src/index.ts',
  '@signal-or-noise/content/types': 'packages/content/src/types.ts',
  '@signal-or-noise/content/schema': 'packages/content/src/schema.ts',
  '@signal-or-noise/content/textEncoding': 'packages/content/src/textEncoding.ts',
};

/** The full content index (scenario catalog) must never enter the surface graph. */
const FORBIDDEN_WORKSPACE = new Set(['@signal-or-noise/content', '@signal-or-noise/database']);

const IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)\s[^;'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const errors = [];
const visited = new Set();
const queue = SURFACE_ENTRIES.map((entry) => path.join(repoRoot, entry));

for (const entry of queue) {
  if (!fs.existsSync(entry)) {
    errors.push(`Surface entry missing: ${path.relative(repoRoot, entry)}`);
  }
}

while (queue.length > 0) {
  const file = queue.pop();
  if (visited.has(file) || !fs.existsSync(file)) continue;
  visited.add(file);
  if (file.endsWith('.json')) continue;

  const source = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(repoRoot, file).replaceAll('\\', '/');

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (!specifier) continue;

    if (specifier.startsWith('.')) {
      const resolved = resolveRelative(file, specifier);
      if (!resolved) {
        errors.push(`${relFile}: cannot resolve relative import '${specifier}'`);
      } else {
        queue.push(resolved);
      }
      continue;
    }

    if (specifier.startsWith('@signal-or-noise/')) {
      if (FORBIDDEN_WORKSPACE.has(specifier)) {
        errors.push(`${relFile}: forbidden workspace import '${specifier}' (catalog/database must not enter the mobile surface)`);
        continue;
      }
      const mapped = WORKSPACE_EXPORTS[specifier];
      if (!mapped) {
        errors.push(`${relFile}: unknown workspace import '${specifier}' — add it to check-imports.mjs deliberately`);
        continue;
      }
      queue.push(path.join(repoRoot, mapped));
      continue;
    }

    const packageName = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0];
    if (!ALLOWED_EXTERNALS.has(packageName)) {
      errors.push(`${relFile}: external import '${specifier}' is not on the mobile-surface allowlist`);
    }
  }
}

if (errors.length > 0) {
  console.error('mobile-smoke: import-constraint check FAILED');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`mobile-smoke: import-constraint check OK (${visited.size} modules walked)`);
