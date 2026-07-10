import 'server-only';
import { RunService, getDatabaseClient } from '@signal-or-noise/database';
import type { PrismaClient } from '@prisma/client';

let runService: RunService | undefined;

export function getDb(): PrismaClient {
  return getDatabaseClient();
}

export function getRunService(): RunService {
  if (!runService) {
    runService = new RunService(getDatabaseClient());
  }
  return runService;
}
