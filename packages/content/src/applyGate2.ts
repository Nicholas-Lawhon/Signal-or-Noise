/**
 * CLI: apply opaque blind Gate 2 results through a private export mapping.
 *
 * Usage:
 *   pnpm --filter @signal-or-noise/content gate2:apply -- \
 *     --results <judge-results.json> --mapping <private-mapping.json>
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyBlindGate2Results } from './gate2/apply';

function requiredArgument(argv: string[], flag: string): string {
  const index = argv.indexOf(flag);
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a path`);
  }
  return value;
}

function main(): void {
  let argv = process.argv.slice(2);
  if (argv[0] === '--') argv = argv.slice(1);

  try {
    const packageRoot = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '..',
    );
    const monorepoRoot = resolve(packageRoot, '..', '..');
    const resultsPath = requiredArgument(argv, '--results');
    const mappingPath = requiredArgument(argv, '--mapping');
    const scenariosRootIndex = argv.indexOf('--scenarios-root');
    const scenariosRoot =
      scenariosRootIndex >= 0
        ? requiredArgument(argv, '--scenarios-root')
        : resolve(
            dirname(fileURLToPath(import.meta.url)),
            '..',
            'scenarios',
          );
    const knownArguments = new Set([
      '--results',
      resultsPath,
      '--mapping',
      mappingPath,
      ...(scenariosRootIndex >= 0
        ? ['--scenarios-root', scenariosRoot]
        : []),
    ]);
    const unknown = argv.find((argument) => !knownArguments.has(argument));
    if (unknown) throw new Error(`Unknown argument: ${unknown}`);

    const report = applyBlindGate2Results({
      resultsPath,
      mappingPath,
      scenariosRoot,
      cwd: monorepoRoot,
    });
    console.log(
      `Applied ${report.appliedVariants} Gate 2 result(s) across ${report.updatedFiles} scenario file(s).`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`gate2 apply failed: ${message}`);
    process.exit(1);
  }
}

main();
