// Node-only helpers for the validation CLI. Do not re-export from the package root.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScenario } from './validation';
import type { Scenario, ValidationIssue, ValidationWarning } from './types';

export type ScenarioFolder = 'draft' | 'reviewed' | 'active';

export type LoadedScenarioFile = {
  folder: ScenarioFolder;
  filePath: string;
  relativePath: string;
  result:
    | { success: true; scenario: Scenario; warnings: ValidationWarning[] }
    | { success: false; errors: ValidationIssue[]; warnings: ValidationWarning[] };
};

const FOLDERS: ScenarioFolder[] = ['draft', 'reviewed', 'active'];

export function getScenariosRoot(fromUrl = import.meta.url): string {
  const here = fileURLToPath(fromUrl);
  // src/loadScenarios.ts → packages/content/scenarios
  return resolve(here, '..', '..', 'scenarios');
}

/**
 * Load and validate every JSON file under scenarios/{draft,reviewed,active}.
 */
export function loadAllScenarioFiles(
  scenariosRoot = getScenariosRoot(),
): LoadedScenarioFile[] {
  const results: LoadedScenarioFile[] = [];

  for (const folder of FOLDERS) {
    const dir = join(scenariosRoot, folder);
    if (!existsSync(dir)) {
      continue;
    }

    const files = readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .sort();

    for (const name of files) {
      const filePath = join(dir, name);
      const relativePath = join('scenarios', folder, name);
      let raw: unknown;
      try {
        const text = readFileSync(filePath, 'utf8');
        raw = JSON.parse(text) as unknown;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          folder,
          filePath,
          relativePath,
          result: {
            success: false,
            errors: [{ path: '(file)', message: `Failed to read/parse JSON: ${message}` }],
            warnings: [],
          },
        });
        continue;
      }

      const result = validateScenario(raw);
      results.push({ folder, filePath, relativePath, result });
    }
  }

  return results;
}
