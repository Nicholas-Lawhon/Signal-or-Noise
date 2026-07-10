-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('draft', 'reviewed', 'active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "RecognitionBucket" AS ENUM ('famous', 'moderate', 'obscure');

-- CreateEnum
CREATE TYPE "ContentPackStatus" AS ENUM ('draft', 'active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "MarketPointPhase" AS ENUM ('pre_decision', 'outcome');

-- CreateEnum
CREATE TYPE "RunMode" AS ENUM ('classic_run', 'daily_challenge');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('in_progress', 'completed', 'bankrupt', 'abandoned');

-- CreateEnum
CREATE TYPE "RoundAction" AS ENUM ('long', 'short', 'pass');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('low', 'medium', 'high', 'all_in');

-- CreateEnum
CREATE TYPE "LeaderboardType" AS ENUM ('daily_challenge_bankroll', 'best_classic_run_bankroll', 'all_time_signal_score', 'weekly_bankroll', 'monthly_bankroll');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "externalAuthId" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "completedRuns" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL DEFAULT 0,
    "correctCalls" INTEGER NOT NULL DEFAULT 0,
    "wrongCalls" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "totalSignalScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bestRunBankroll" DECIMAL(65,30),
    "averageFinalBankroll" DECIMAL(65,30),
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL,
    "clientSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Era" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Era_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentPackStatus" NOT NULL DEFAULT 'active',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "status" "ScenarioStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "decisionDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "decisionDateLabel" TEXT NOT NULL,
    "outcomeLabel" TEXT NOT NULL,
    "holdingPeriodLabel" TEXT NOT NULL,
    "eraId" TEXT NOT NULL,
    "recognitionBucket" "RecognitionBucket" NOT NULL,
    "companyName" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "acceptedNames" TEXT[],
    "identityBannedTerms" TEXT[],
    "revealShortText" TEXT NOT NULL,
    "revealFunFact" TEXT NOT NULL,
    "revealWhyItMoved" TEXT[],
    "startingPrice" DECIMAL(65,30) NOT NULL,
    "endingPrice" DECIMAL(65,30) NOT NULL,
    "actualReturnPercent" DECIMAL(65,30) NOT NULL,
    "splitAdjustedPrices" BOOLEAN NOT NULL,
    "totalReturn" BOOLEAN NOT NULL,
    "reviewGeneratedByAi" BOOLEAN NOT NULL,
    "humanReviewed" BOOLEAN NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT NOT NULL,
    "factBank" JSONB NOT NULL,
    "likelyGuesses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioContentPack" (
    "scenarioId" TEXT NOT NULL,
    "contentPackId" TEXT NOT NULL,

    CONSTRAINT "ScenarioContentPack_pkey" PRIMARY KEY ("scenarioId","contentPackId")
);

-- CreateTable
CREATE TABLE "ScenarioVariant" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "macroContext" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "longCase" TEXT NOT NULL,
    "shortCase" TEXT NOT NULL,
    "setupHints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioSource" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPoint" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "phase" "MarketPointPhase" NOT NULL,
    "pointDate" DATE NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengePool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startingBankroll" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallengePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengePoolEntry" (
    "poolId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,

    CONSTRAINT "DailyChallengePoolEntry_pkey" PRIMARY KEY ("poolId","ordinal")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "challengeDate" DATE NOT NULL,
    "poolId" TEXT NOT NULL,
    "startingBankroll" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "dailyChallengeId" TEXT,
    "mode" "RunMode" NOT NULL,
    "difficulty" "Difficulty",
    "status" "RunStatus" NOT NULL DEFAULT 'in_progress',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "scenarioOrder" JSONB NOT NULL,
    "currentRoundIndex" INTEGER NOT NULL DEFAULT 0,
    "startingBankroll" DECIMAL(65,30) NOT NULL,
    "finalBankroll" DECIMAL(65,30),
    "currentBankroll" DECIMAL(65,30) NOT NULL,
    "signalScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL,
    "completedRounds" INTEGER NOT NULL DEFAULT 0,
    "correctCalls" INTEGER NOT NULL DEFAULT 0,
    "wrongCalls" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completionTimeMs" INTEGER,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundDecision" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT,
    "scenarioId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "action" "RoundAction" NOT NULL,
    "confidence" "Confidence",
    "companyGuess" TEXT,
    "companyGuessCorrect" BOOLEAN,
    "confidencePercent" DECIMAL(65,30),
    "stakeAmount" DECIMAL(65,30) NOT NULL,
    "bankrollBefore" DECIMAL(65,30) NOT NULL,
    "bankrollAfter" DECIMAL(65,30) NOT NULL,
    "actualReturnPercent" DECIMAL(65,30) NOT NULL,
    "pnlAmount" DECIMAL(65,30) NOT NULL,
    "signalScoreDelta" DECIMAL(65,30) NOT NULL,
    "wasCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runId" TEXT,
    "leaderboardType" "LeaderboardType" NOT NULL,
    "periodKey" TEXT,
    "scoreBankroll" DECIMAL(65,30),
    "scoreSignal" DECIMAL(65,30),
    "correctCalls" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "completionTimeMs" INTEGER,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_userId_key" ON "PlayerStats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestSession_clientSessionId_key" ON "GuestSession"("clientSessionId");

-- CreateIndex
CREATE INDEX "Scenario_status_idx" ON "Scenario"("status");

-- CreateIndex
CREATE INDEX "Scenario_eraId_idx" ON "Scenario"("eraId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVariant_scenarioId_difficulty_key" ON "ScenarioVariant"("scenarioId", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioSource_scenarioId_url_key" ON "ScenarioSource"("scenarioId", "url");

-- CreateIndex
CREATE INDEX "MarketPoint_scenarioId_phase_pointDate_idx" ON "MarketPoint"("scenarioId", "phase", "pointDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPoint_scenarioId_phase_ordinal_key" ON "MarketPoint"("scenarioId", "phase", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengePoolEntry_poolId_scenarioId_key" ON "DailyChallengePoolEntry"("poolId", "scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_challengeDate_key" ON "DailyChallenge"("challengeDate");

-- CreateIndex
CREATE INDEX "DailyChallenge_poolId_idx" ON "DailyChallenge"("poolId");

-- CreateIndex
CREATE INDEX "Run_userId_status_idx" ON "Run"("userId", "status");

-- CreateIndex
CREATE INDEX "Run_guestSessionId_status_idx" ON "Run"("guestSessionId", "status");

-- CreateIndex
CREATE INDEX "Run_dailyChallengeId_idx" ON "Run"("dailyChallengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Run_dailyChallengeId_userId_key" ON "Run"("dailyChallengeId", "userId");

-- CreateIndex
CREATE INDEX "RoundDecision_scenarioId_idx" ON "RoundDecision"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundDecision_runId_roundIndex_key" ON "RoundDecision"("runId", "roundIndex");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_leaderboardType_periodKey_idx" ON "LeaderboardEntry"("leaderboardType", "periodKey");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_userId_leaderboardType_idx" ON "LeaderboardEntry"("userId", "leaderboardType");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_eraId_fkey" FOREIGN KEY ("eraId") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioContentPack" ADD CONSTRAINT "ScenarioContentPack_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioContentPack" ADD CONSTRAINT "ScenarioContentPack_contentPackId_fkey" FOREIGN KEY ("contentPackId") REFERENCES "ContentPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioVariant" ADD CONSTRAINT "ScenarioVariant_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSource" ADD CONSTRAINT "ScenarioSource_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPoint" ADD CONSTRAINT "MarketPoint_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengePoolEntry" ADD CONSTRAINT "DailyChallengePoolEntry_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "DailyChallengePool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengePoolEntry" ADD CONSTRAINT "DailyChallengePoolEntry_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "DailyChallengePool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_dailyChallengeId_fkey" FOREIGN KEY ("dailyChallengeId") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundDecision" ADD CONSTRAINT "RoundDecision_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundDecision" ADD CONSTRAINT "RoundDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundDecision" ADD CONSTRAINT "RoundDecision_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ownership and game-state invariants that Prisma cannot express.
ALTER TABLE "Run" ADD CONSTRAINT "Run_exactly_one_owner_check"
CHECK (
  ("userId" IS NOT NULL AND "guestSessionId" IS NULL)
  OR ("userId" IS NULL AND "guestSessionId" IS NOT NULL)
);

ALTER TABLE "Run" ADD CONSTRAINT "Run_mode_configuration_check"
CHECK (
  ("mode" = 'classic_run' AND "difficulty" IS NOT NULL AND "dailyChallengeId" IS NULL)
  OR ("mode" = 'daily_challenge' AND "difficulty" IS NULL AND "dailyChallengeId" IS NOT NULL)
);

ALTER TABLE "Run" ADD CONSTRAINT "Run_official_user_check"
CHECK (NOT "isOfficial" OR "userId" IS NOT NULL);

ALTER TABLE "Run" ADD CONSTRAINT "Run_progress_check"
CHECK (
  "totalRounds" > 0
  AND "completedRounds" = "currentRoundIndex"
  AND "currentRoundIndex" >= 0
  AND "currentRoundIndex" <= "totalRounds"
  AND "startingBankroll" >= 0
  AND "currentBankroll" >= 0
);

ALTER TABLE "Run" ADD CONSTRAINT "Run_terminal_fields_check"
CHECK (
  ("status" IN ('completed', 'bankrupt') AND "completedAt" IS NOT NULL AND "finalBankroll" IS NOT NULL)
  OR ("status" IN ('in_progress', 'abandoned'))
);

ALTER TABLE "RoundDecision" ADD CONSTRAINT "RoundDecision_action_confidence_check"
CHECK (
  ("action" = 'pass' AND "confidence" IS NULL AND "confidencePercent" IS NULL AND "stakeAmount" = 0)
  OR ("action" IN ('long', 'short') AND "confidence" IS NOT NULL AND "confidencePercent" IS NOT NULL)
);

ALTER TABLE "RoundDecision" ADD CONSTRAINT "RoundDecision_bankroll_check"
CHECK ("stakeAmount" >= 0 AND "bankrollBefore" >= 0 AND "bankrollAfter" >= 0);
