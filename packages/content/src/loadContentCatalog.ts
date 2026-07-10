// Node-only helpers for the content validation CLI and tests.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContentCatalog } from './catalogValidation';
import type {
  ContentCatalogValidationResult,
} from './catalogValidation';
import type { Scenario, ValidationIssue } from './types';

export function getContentDataRoot(fromUrl = import.meta.url): string {
  const here = fileURLToPath(fromUrl);
  return resolve(here, '..', '..', 'data');
}

function readJson(path: string, label: string): unknown | ValidationIssue {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { path: label, message: `Failed to read/parse JSON: ${message}` };
  }
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    'message' in value
  );
}

export function loadAndValidateContentCatalog(
  scenarios: Scenario[],
  dataRoot = getContentDataRoot(),
): ContentCatalogValidationResult {
  const pools = readJson(
    resolve(dataRoot, 'daily-challenge-pools.json'),
    'dailyChallengePools',
  );
  const eras = readJson(resolve(dataRoot, 'market-eras.json'), 'marketEras');
  const inventory = readJson(
    resolve(dataRoot, 'production-scenario-inventory.json'),
    'productionScenarioInventory',
  );
  const readErrors = [pools, eras, inventory].filter(isValidationIssue);
  if (readErrors.length > 0) {
    return { success: false, errors: readErrors };
  }

  return validateContentCatalog(pools, eras, inventory, scenarios);
}
