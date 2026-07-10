import 'server-only';
import {
  LeaderboardService,
  RunService,
  getDatabaseClient,
} from '@signal-or-noise/database';
import type { PrismaClient } from '@prisma/client';

let runService: RunService | undefined;
let leaderboardService: LeaderboardService | undefined;

export function getDb(): PrismaClient {
  return getDatabaseClient();
}

export function getRunService(): RunService {
  if (!runService) {
    runService = new RunService(getDatabaseClient());
  }
  return runService;
}

export function getLeaderboardService(): LeaderboardService {
  if (!leaderboardService) {
    leaderboardService = new LeaderboardService(getDatabaseClient());
  }
  return leaderboardService;
}
