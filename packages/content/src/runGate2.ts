/**
 * CLI entry: Gate 2 offline export / check.
 * Usage: pnpm --filter @signal-or-noise/content gate2 -- <export|check> ...
 */
import {
  checkGate2StoredResultsCli,
  exportGate2Payloads,
  parseGate2Args,
  printHelp,
} from './gate2/run';

function main(): void {
  // tsx/node: process.argv = [node, script, ...args]
  // pnpm passes args after `--`
  let argv = process.argv.slice(2);
  if (argv[0] === '--') {
    argv = argv.slice(1);
  }

  let parsed;
  try {
    parsed = parseGate2Args(argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`gate2: ${message}`);
    printHelp();
    process.exit(1);
  }

  if (parsed.command === 'help') {
    printHelp();
    process.exit(0);
  }

  if (parsed.command === 'export') {
    try {
      const { absoluteOutPath, entryCount } = exportGate2Payloads({
        outPath: parsed.outPath!,
        scenarioId: parsed.scenarioId,
        includeDraft: parsed.includeDraft,
      });
      console.log(`Exported ${entryCount} payload(s) to ${absoluteOutPath}`);
      process.exit(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`gate2 export failed: ${message}`);
      process.exit(1);
    }
  }

  // check
  try {
    const report = checkGate2StoredResultsCli({
      scenarioId: parsed.scenarioId,
      includeDraft: parsed.includeDraft,
    });

    for (const line of report.lines) {
      const tag =
        line.severity === 'error'
          ? 'ERROR'
          : line.severity === 'warning'
            ? 'WARN '
            : 'INFO ';
      console.log(
        `${tag}  ${line.scenarioId}  ${line.path}: ${line.message}`,
      );
    }

    console.log('');
    console.log(
      `Gate 2 check: ${report.errorCount} error(s), ${report.warningCount} warning(s), ${report.missingCount} missing variant(s).`,
    );
    if (report.missingCount > 0 && report.errorCount === 0) {
      console.log(
        'Missing Gate 2 results are informational only in H021 (fail-closed enforcement comes later).',
      );
    }
    process.exit(report.exitCode);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`gate2 check failed: ${message}`);
    process.exit(1);
  }
}

main();
