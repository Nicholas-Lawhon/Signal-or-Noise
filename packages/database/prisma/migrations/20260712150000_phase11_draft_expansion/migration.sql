-- Phase 11 D055: additive weighted Draft formats, solo best results, and
-- invite-only two-player Draft Battles. No existing Smart Pass columns are
-- changed by this migration.

CREATE TYPE "DraftFormat" AS ENUM ('classic', 'quick', 'era');
CREATE TYPE "DraftBattleStatus" AS ENUM ('awaiting_opponent', 'awaiting_submissions', 'completed', 'expired');
CREATE TYPE "DraftBattleRole" AS ENUM ('creator', 'opponent');
CREATE TYPE "DraftBattleOutcome" AS ENUM ('creator_win', 'opponent_win', 'draw', 'no_winner');

ALTER TABLE "PortfolioDraft"
  ADD COLUMN "format" "DraftFormat" NOT NULL DEFAULT 'classic',
  ADD COLUMN "eraId" TEXT,
  ADD COLUMN "scenarioSnapshot" JSONB,
  ADD COLUMN "allocations" JSONB,
  ADD COLUMN "optimalAllocations" JSONB;

-- Preserve already-created D052 drafts by freezing the exact Medium card and
-- outcome data they referenced before making the new snapshot mandatory.
UPDATE "PortfolioDraft" AS draft
SET "scenarioSnapshot" = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'scenarioId', scenario."id",
      'title', scenario."title",
      'companyName', scenario."companyName",
      'ticker', scenario."ticker",
      'actualReturnPercent', scenario."actualReturnPercent"::double precision,
      'decisionDateLabel', scenario."decisionDateLabel",
      'holdingPeriodLabel', scenario."holdingPeriodLabel",
      'companyDescription', variant."companyDescription",
      'macroContext', variant."macroContext",
      'situation', variant."situation",
      'longCase', variant."longCase",
      'shortCase', variant."shortCase",
      'setupHints', to_jsonb(variant."setupHints"),
      'lookbackChart', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'date', to_char(point."pointDate", 'YYYY-MM-DD'),
          'price', point."price"::double precision
        ) ORDER BY point."ordinal")
        FROM "MarketPoint" AS point
        WHERE point."scenarioId" = scenario."id" AND point."phase" = 'pre_decision'
      ), '[]'::jsonb)
    ) ORDER BY ids.ordinality
  )
  FROM jsonb_array_elements_text(draft."scenarioIds") WITH ORDINALITY AS ids("id", ordinality)
  JOIN "Scenario" AS scenario ON scenario."id" = ids."id"
  JOIN "ScenarioVariant" AS variant ON variant."scenarioId" = scenario."id" AND variant."difficulty" = 'medium'
);

-- D052 in-progress drafts did not collect D055's mandatory weights. Retire
-- those transient sessions so every playable Phase 11 draft uses the weighted
-- rules; completed historical reveals remain readable through their snapshots.
UPDATE "PortfolioDraft" SET "status" = 'abandoned' WHERE "status" = 'in_progress';

ALTER TABLE "PortfolioDraft" ALTER COLUMN "scenarioSnapshot" SET NOT NULL;

CREATE TABLE "DraftLeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "format" "DraftFormat" NOT NULL,
    "finalValue" DECIMAL(65,30) NOT NULL,
    "gapFromOptimal" DECIMAL(65,30) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DraftLeaderboardEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DraftBattle" (
    "id" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "opponentId" TEXT,
    "format" "DraftFormat" NOT NULL,
    "eraId" TEXT,
    "timerSeconds" INTEGER,
    "status" "DraftBattleStatus" NOT NULL DEFAULT 'awaiting_opponent',
    "scenarioIds" JSONB NOT NULL,
    "scenarioSnapshot" JSONB NOT NULL,
    "budget" DECIMAL(65,30) NOT NULL,
    "submissionDeadlineAt" TIMESTAMP(3),
    "outcome" "DraftBattleOutcome",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "DraftBattle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DraftBattlePlayer" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DraftBattleRole" NOT NULL,
    "selectedScenarioIds" JSONB,
    "allocations" JSONB,
    "finalValue" DECIMAL(65,30),
    "gapFromOptimal" DECIMAL(65,30),
    "submittedAt" TIMESTAMP(3),
    "forfeited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DraftBattlePlayer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DraftLeaderboardEntry_draftId_key" ON "DraftLeaderboardEntry"("draftId");
CREATE UNIQUE INDEX "DraftLeaderboardEntry_userId_format_key" ON "DraftLeaderboardEntry"("userId", "format");
CREATE INDEX "DraftLeaderboardEntry_format_finalValue_gapFromOptimal_completedAt_idx"
  ON "DraftLeaderboardEntry"("format", "finalValue", "gapFromOptimal", "completedAt");
CREATE UNIQUE INDEX "DraftBattle_inviteCode_key" ON "DraftBattle"("inviteCode");
CREATE INDEX "DraftBattle_creatorId_status_idx" ON "DraftBattle"("creatorId", "status");
CREATE INDEX "DraftBattle_opponentId_status_idx" ON "DraftBattle"("opponentId", "status");
CREATE UNIQUE INDEX "DraftBattlePlayer_battleId_userId_key" ON "DraftBattlePlayer"("battleId", "userId");
CREATE UNIQUE INDEX "DraftBattlePlayer_battleId_role_key" ON "DraftBattlePlayer"("battleId", "role");
CREATE INDEX "PortfolioDraft_format_status_completedAt_idx" ON "PortfolioDraft"("format", "status", "completedAt");

ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_eraId_fkey"
  FOREIGN KEY ("eraId") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DraftLeaderboardEntry" ADD CONSTRAINT "DraftLeaderboardEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DraftLeaderboardEntry" ADD CONSTRAINT "DraftLeaderboardEntry_draftId_fkey"
  FOREIGN KEY ("draftId") REFERENCES "PortfolioDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DraftBattle" ADD CONSTRAINT "DraftBattle_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DraftBattle" ADD CONSTRAINT "DraftBattle_opponentId_fkey"
  FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DraftBattle" ADD CONSTRAINT "DraftBattle_eraId_fkey"
  FOREIGN KEY ("eraId") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DraftBattlePlayer" ADD CONSTRAINT "DraftBattlePlayer_battleId_fkey"
  FOREIGN KEY ("battleId") REFERENCES "DraftBattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DraftBattlePlayer" ADD CONSTRAINT "DraftBattlePlayer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The D052 check required exactly 6 scenarioIds; the format-aware check below
-- replaces it so Quick Drafts (4 cards) are accepted.
ALTER TABLE "PortfolioDraft" DROP CONSTRAINT "PortfolioDraft_snapshot_check";

ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_format_snapshot_check"
CHECK (
  (("format" IN ('classic', 'era') AND jsonb_array_length("scenarioIds") = 6)
  OR ("format" = 'quick' AND jsonb_array_length("scenarioIds") = 4))
  AND jsonb_array_length("scenarioSnapshot") = jsonb_array_length("scenarioIds")
);

ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_era_format_check"
CHECK (("format" = 'era' AND "eraId" IS NOT NULL) OR ("format" <> 'era' AND "eraId" IS NULL));

-- The D052 terminal check required exactly 3 picks; replace it with the
-- format-aware pick counts (Quick locks 2, Classic/Era lock 3).
ALTER TABLE "PortfolioDraft" DROP CONSTRAINT "PortfolioDraft_terminal_fields_check";
ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_terminal_fields_check"
CHECK (
  (
    "status" = 'completed'
    AND "selectedScenarioIds" IS NOT NULL
    AND "optimalScenarioIds" IS NOT NULL
    AND "finalValue" IS NOT NULL
    AND "optimalValue" IS NOT NULL
    AND "completedAt" IS NOT NULL
    AND jsonb_typeof("selectedScenarioIds") = 'array'
    AND jsonb_typeof("optimalScenarioIds") = 'array'
    AND jsonb_array_length("selectedScenarioIds") = CASE WHEN "format" = 'quick' THEN 2 ELSE 3 END
    AND jsonb_array_length("optimalScenarioIds") = CASE WHEN "format" = 'quick' THEN 2 ELSE 3 END
  )
  OR (
    "status" IN ('in_progress', 'abandoned')
    AND "selectedScenarioIds" IS NULL
    AND "optimalScenarioIds" IS NULL
    AND "finalValue" IS NULL
    AND "optimalValue" IS NULL
    AND "completedAt" IS NULL
  )
);

ALTER TABLE "DraftBattle" ADD CONSTRAINT "DraftBattle_configuration_check"
CHECK (
  "creatorId" <> "opponentId"
  AND "budget" = 10000
  AND "expiresAt" = "createdAt" + INTERVAL '24 hours'
  AND ("timerSeconds" IS NULL OR "timerSeconds" IN (120, 300))
  AND (
    ("format" IN ('classic', 'era') AND jsonb_array_length("scenarioIds") = 6)
    OR ("format" = 'quick' AND jsonb_array_length("scenarioIds") = 4)
  )
  AND jsonb_array_length("scenarioSnapshot") = jsonb_array_length("scenarioIds")
  AND (("format" = 'era' AND "eraId" IS NOT NULL) OR ("format" <> 'era' AND "eraId" IS NULL))
);

ALTER TABLE "DraftBattle" ADD CONSTRAINT "DraftBattle_status_fields_check"
CHECK (
  ("status" = 'awaiting_opponent' AND "opponentId" IS NULL AND "submissionDeadlineAt" IS NULL AND "outcome" IS NULL AND "completedAt" IS NULL)
  OR ("status" = 'awaiting_submissions' AND "opponentId" IS NOT NULL AND "outcome" IS NULL AND "completedAt" IS NULL)
  OR ("status" = 'completed' AND "opponentId" IS NOT NULL AND "outcome" IS NOT NULL AND "completedAt" IS NOT NULL AND "submissionDeadlineAt" IS NULL)
  OR ("status" = 'expired' AND "outcome" = 'no_winner' AND "submissionDeadlineAt" IS NULL)
);

ALTER TABLE "DraftBattlePlayer" ADD CONSTRAINT "DraftBattlePlayer_submission_check"
CHECK (
  ("selectedScenarioIds" IS NULL AND "allocations" IS NULL AND "finalValue" IS NULL AND "gapFromOptimal" IS NULL AND "submittedAt" IS NULL)
  OR ("selectedScenarioIds" IS NOT NULL AND "allocations" IS NOT NULL AND "finalValue" IS NOT NULL AND "gapFromOptimal" IS NOT NULL AND "submittedAt" IS NOT NULL)
);
