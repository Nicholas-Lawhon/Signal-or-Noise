import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

/** Load a repository-root .env for local CLI commands without ever logging it. */
export function loadDatabaseEnvironment(): void {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const candidates = [
    process.env.DOTENV_CONFIG_PATH,
    resolve(process.cwd(), '.env'),
    resolve(packageRoot, '..', '..', '.env'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path, override: false });
      return;
    }
  }
}
