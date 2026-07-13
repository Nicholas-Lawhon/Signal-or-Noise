import 'server-only';
import {
  DraftBattleService,
  FriendBattleService,
  LeaderboardService,
  PortfolioDraftService,
  RunService,
  getDatabaseClient,
} from '@signal-or-noise/database';
import type { PrismaClient } from '@prisma/client';

let runService: RunService | undefined;
let leaderboardService: LeaderboardService | undefined;
let draftService: PortfolioDraftService | undefined;
let battleService: FriendBattleService | undefined;
let draftBattleService: DraftBattleService | undefined;

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

export function getDraftService(): PortfolioDraftService {
  if (!draftService) {
    draftService = new PortfolioDraftService(getDatabaseClient());
  }
  return draftService;
}

export function getBattleService(): FriendBattleService {
  if (!battleService) {
    battleService = new FriendBattleService(getDatabaseClient());
  }
  return battleService;
}

export function getDraftBattleService(): DraftBattleService {
  if (!draftBattleService) {
    draftBattleService = new DraftBattleService(getDatabaseClient());
  }
  return draftBattleService;
}
