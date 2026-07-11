-- CreateEnum
CREATE TYPE "PortfolioDraftStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('awaiting_opponent', 'awaiting_ready', 'in_progress', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "BattleRoundPhase" AS ENUM ('deciding', 'reveal');

-- CreateEnum
CREATE TYPE "BattleRole" AS ENUM ('creator', 'opponent');

-- CreateEnum
CREATE TYPE "BattleOutcome" AS ENUM ('creator_win', 'opponent_win', 'draw');

-- CreateTable
CREATE TABLE "PortfolioDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "status" "PortfolioDraftStatus" NOT NULL DEFAULT 'in_progress',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "windowStart" DATE NOT NULL,
    "windowEnd" DATE NOT NULL,
    "scenarioIds" JSONB NOT NULL,
    "selectedScenarioIds" JSONB,
    "budget" DECIMAL(65,30) NOT NULL,
    "finalValue" DECIMAL(65,30),
    "optimalScenarioIds" JSONB,
    "optimalValue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PortfolioDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendBattle" (
    "id" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "opponentId" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "timerSeconds" INTEGER,
    "status" "BattleStatus" NOT NULL DEFAULT 'awaiting_opponent',
    "scenarioOrder" JSONB NOT NULL,
    "startingBankroll" DECIMAL(65,30) NOT NULL,
    "totalRounds" INTEGER NOT NULL,
    "currentRoundIndex" INTEGER NOT NULL DEFAULT 0,
    "roundPhase" "BattleRoundPhase" NOT NULL DEFAULT 'deciding',
    "roundDeadlineAt" TIMESTAMP(3),
    "outcome" "BattleOutcome",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FriendBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendBattlePlayer" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BattleRole" NOT NULL,
    "currentBankroll" DECIMAL(65,30) NOT NULL,
    "signalScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isBankrupt" BOOLEAN NOT NULL DEFAULT false,
    "readyRound" INTEGER NOT NULL DEFAULT -1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendBattlePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendBattleDecision" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "action" "RoundAction" NOT NULL,
    "confidence" "Confidence",
    "companyGuess" TEXT,
    "companyGuessCorrect" BOOLEAN,
    "stakeAmount" DECIMAL(65,30) NOT NULL,
    "bankrollBefore" DECIMAL(65,30) NOT NULL,
    "bankrollAfter" DECIMAL(65,30) NOT NULL,
    "pnlAmount" DECIMAL(65,30) NOT NULL,
    "signalScoreDelta" DECIMAL(65,30) NOT NULL,
    "wasCorrect" BOOLEAN,
    "wasAutoPass" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendBattleDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioDraft_userId_status_idx" ON "PortfolioDraft"("userId", "status");

-- CreateIndex
CREATE INDEX "PortfolioDraft_guestSessionId_status_idx" ON "PortfolioDraft"("guestSessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendBattle_inviteCode_key" ON "FriendBattle"("inviteCode");

-- CreateIndex
CREATE INDEX "FriendBattle_creatorId_status_idx" ON "FriendBattle"("creatorId", "status");

-- CreateIndex
CREATE INDEX "FriendBattle_opponentId_status_idx" ON "FriendBattle"("opponentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendBattlePlayer_battleId_userId_key" ON "FriendBattlePlayer"("battleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendBattlePlayer_battleId_role_key" ON "FriendBattlePlayer"("battleId", "role");

-- CreateIndex
CREATE INDEX "FriendBattleDecision_battleId_roundIndex_idx" ON "FriendBattleDecision"("battleId", "roundIndex");

-- CreateIndex
CREATE UNIQUE INDEX "FriendBattleDecision_battleId_userId_roundIndex_key" ON "FriendBattleDecision"("battleId", "userId", "roundIndex");

-- AddForeignKey
ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendBattle" ADD CONSTRAINT "FriendBattle_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendBattle" ADD CONSTRAINT "FriendBattle_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendBattlePlayer" ADD CONSTRAINT "FriendBattlePlayer_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "FriendBattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendBattlePlayer" ADD CONSTRAINT "FriendBattlePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendBattleDecision" ADD CONSTRAINT "FriendBattleDecision_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ownership and competitive game-state invariants that Prisma cannot express.
ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_exactly_one_owner_check"
CHECK (
  ("userId" IS NOT NULL AND "guestSessionId" IS NULL)
  OR ("userId" IS NULL AND "guestSessionId" IS NOT NULL)
);

ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_official_user_check"
CHECK (NOT "isOfficial" OR "userId" IS NOT NULL);

ALTER TABLE "PortfolioDraft" ADD CONSTRAINT "PortfolioDraft_snapshot_check"
CHECK (
  "budget" = 10000
  AND "windowStart" < "windowEnd"
  AND CASE
    WHEN jsonb_typeof("scenarioIds") = 'array' THEN jsonb_array_length("scenarioIds") = 6
    ELSE false
  END
);

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
    AND jsonb_array_length("selectedScenarioIds") = 3
    AND jsonb_typeof("optimalScenarioIds") = 'array'
    AND jsonb_array_length("optimalScenarioIds") = 3
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

-- At most one resumable draft exists for each owner, including concurrent starts.
CREATE UNIQUE INDEX "PortfolioDraft_one_in_progress_user_key"
ON "PortfolioDraft"("userId")
WHERE "status" = 'in_progress' AND "userId" IS NOT NULL;

CREATE UNIQUE INDEX "PortfolioDraft_one_in_progress_guest_key"
ON "PortfolioDraft"("guestSessionId")
WHERE "status" = 'in_progress' AND "guestSessionId" IS NOT NULL;

ALTER TABLE "FriendBattle" ADD CONSTRAINT "FriendBattle_configuration_check"
CHECK (
  "timerSeconds" IS NULL OR "timerSeconds" IN (30, 60, 120)
);

ALTER TABLE "FriendBattle" ADD CONSTRAINT "FriendBattle_snapshot_check"
CHECK (
  "creatorId" <> "opponentId"
  AND "currentRoundIndex" >= 0
  AND "currentRoundIndex" < "totalRounds"
  AND "expiresAt" = "createdAt" + INTERVAL '24 hours'
  AND CASE
    WHEN jsonb_typeof("scenarioOrder") = 'array'
      THEN jsonb_array_length("scenarioOrder") = "totalRounds"
    ELSE false
  END
  AND (
    ("difficulty" = 'easy' AND "totalRounds" = 10 AND "startingBankroll" = 12500)
    OR ("difficulty" = 'medium' AND "totalRounds" = 15 AND "startingBankroll" = 10000)
    OR ("difficulty" = 'hard' AND "totalRounds" = 20 AND "startingBankroll" = 7500)
  )
);

ALTER TABLE "FriendBattle" ADD CONSTRAINT "FriendBattle_status_fields_check"
CHECK (
  (
    "status" = 'awaiting_opponent'
    AND "opponentId" IS NULL
    AND "outcome" IS NULL
    AND "completedAt" IS NULL
  )
  OR (
    "status" IN ('awaiting_ready', 'in_progress')
    AND "opponentId" IS NOT NULL
    AND "outcome" IS NULL
    AND "completedAt" IS NULL
  )
  OR (
    "status" = 'completed'
    AND "opponentId" IS NOT NULL
    AND "outcome" IS NOT NULL
    AND "completedAt" IS NOT NULL
  )
  OR (
    "status" = 'expired'
    AND "outcome" IS NULL
    AND "completedAt" IS NULL
  )
);

ALTER TABLE "FriendBattle" ADD CONSTRAINT "FriendBattle_deadline_check"
CHECK (
  (
    "status" = 'in_progress'
    AND "roundPhase" = 'deciding'
    AND "timerSeconds" IS NOT NULL
    AND "roundDeadlineAt" IS NOT NULL
  )
  OR (
    NOT ("status" = 'in_progress' AND "roundPhase" = 'deciding' AND "timerSeconds" IS NOT NULL)
    AND "roundDeadlineAt" IS NULL
  )
);

ALTER TABLE "FriendBattlePlayer" ADD CONSTRAINT "FriendBattlePlayer_state_check"
CHECK (
  "currentBankroll" >= 0
  AND "readyRound" >= -1
);

ALTER TABLE "FriendBattleDecision" ADD CONSTRAINT "FriendBattleDecision_action_confidence_check"
CHECK (
  ("action" = 'pass' AND "confidence" IS NULL AND "stakeAmount" = 0)
  OR ("action" IN ('long', 'short') AND "confidence" IS NOT NULL)
);

ALTER TABLE "FriendBattleDecision" ADD CONSTRAINT "FriendBattleDecision_bankroll_check"
CHECK (
  "stakeAmount" >= 0
  AND "bankrollBefore" >= 0
  AND "bankrollAfter" >= 0
);

-- A decision must belong to one of the battle's two immutable player rows.
ALTER TABLE "FriendBattleDecision" ADD CONSTRAINT "FriendBattleDecision_battleId_userId_fkey"
FOREIGN KEY ("battleId", "userId")
REFERENCES "FriendBattlePlayer"("battleId", "userId")
ON DELETE CASCADE ON UPDATE CASCADE;

