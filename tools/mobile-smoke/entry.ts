/**
 * Metro bundle smoke entry: imports the entire mobile shared surface the
 * future Expo app will consume. If this bundles for React Native, the surface
 * is free of Node-, Prisma-, and web-only code. The scenario catalog export of
 * the content package is deliberately excluded — mobile receives content from
 * the API, never from the bundle, to protect reveal data.
 */
import {
  leaderboardQuerySchema,
  draftLeaderboardQuerySchema,
  runOwnerSchema,
} from '@signal-or-noise/shared-types';
import type { LeaderboardPagePayload } from '@signal-or-noise/shared-types';
import { scoreRound, assignCompetitionRanks } from '@signal-or-noise/game-engine';
import { normalizeMojibake } from '@signal-or-noise/content/textEncoding';
import { scenarioSchema } from '@signal-or-noise/content/schema';
import type { Scenario } from '@signal-or-noise/content/types';

declare const console: { log: (...args: unknown[]) => void };

const surface: Record<string, unknown> = {
  leaderboardQuerySchema,
  draftLeaderboardQuerySchema,
  runOwnerSchema,
  scoreRound,
  assignCompetitionRanks,
  normalizeMojibake,
  scenarioSchema,
};

const page: LeaderboardPagePayload | null = null;
const scenario: Scenario | null = null;

console.log(Object.keys(surface).length, page, scenario);
