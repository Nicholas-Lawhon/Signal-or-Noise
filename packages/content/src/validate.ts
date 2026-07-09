/**
 * CLI: validate all scenario JSON under scenarios/{draft,reviewed,active}.
 * Usage: pnpm --filter @signal-or-noise/content validate
 */
import { loadAllScenarioFiles } from './loadScenarios';

function main(): void {
  const files = loadAllScenarioFiles();

  if (files.length === 0) {
    console.log('No scenario JSON files found under scenarios/{draft,reviewed,active}.');
    process.exit(0);
  }

  let errorCount = 0;
  let warningCount = 0;

  for (const file of files) {
    if (file.result.success) {
      const warnPart =
        file.result.warnings.length > 0
          ? ` (${file.result.warnings.length} warning(s))`
          : '';
      console.log(`PASS  ${file.relativePath}${warnPart}`);
      for (const warning of file.result.warnings) {
        console.log(`  warn  ${warning.path}: ${warning.message}`);
        warningCount += 1;
      }
    } else {
      errorCount += 1;
      console.log(`FAIL  ${file.relativePath}`);
      for (const error of file.result.errors) {
        console.log(`  error ${error.path}: ${error.message}`);
      }
      for (const warning of file.result.warnings) {
        console.log(`  warn  ${warning.path}: ${warning.message}`);
        warningCount += 1;
      }
    }
  }

  console.log('');
  console.log(
    `Validated ${files.length} file(s): ${files.length - errorCount} passed, ${errorCount} failed, ${warningCount} warning(s).`,
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
