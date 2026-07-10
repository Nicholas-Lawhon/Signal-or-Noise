/**
 * CLI: validate all scenario JSON under scenarios/{draft,reviewed,active}.
 * Usage: pnpm --filter @signal-or-noise/content validate
 */
import { loadAllScenarioFiles } from './loadScenarios';
import { loadAndValidateContentCatalog } from './loadContentCatalog';

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

  const validScenarios = files.flatMap((file) =>
    file.result.success ? [file.result.scenario] : [],
  );
  const catalog = loadAndValidateContentCatalog(validScenarios);
  if (catalog.success) {
    console.log('PASS  data/daily-challenge-pools.json');
    console.log('PASS  data/market-eras.json');
    console.log('PASS  data/production-scenario-inventory.json');
  } else {
    errorCount += 1;
    console.log('FAIL  content catalog');
    for (const error of catalog.errors) {
      console.log(`  error ${error.path}: ${error.message}`);
    }
  }

  console.log('');
  console.log(
    `Validated ${files.length} scenario file(s) and the content catalog: ${errorCount} failure(s), ${warningCount} warning(s).`,
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
