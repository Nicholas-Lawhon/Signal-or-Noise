-- Add public-safe identity fields. Existing Clerk/profile names remain private.
ALTER TABLE "User"
ADD COLUMN "publicAlias" TEXT,
ADD COLUMN "publicDisplayName" TEXT,
ADD COLUMN "publicDisplayNameNormalized" TEXT;

-- Backfill a stable alias before making the field required. This sequence is
-- deterministic for the existing database and does not expose an internal ID.
WITH ranked_users AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS ordinal
  FROM "User"
)
UPDATE "User" AS users
SET "publicAlias" = 'Player-' || LPAD(ranked_users.ordinal::text, 4, '0')
FROM ranked_users
WHERE users."id" = ranked_users."id";

ALTER TABLE "User" ALTER COLUMN "publicAlias" SET NOT NULL;

CREATE UNIQUE INDEX "User_publicAlias_key" ON "User"("publicAlias");
CREATE UNIQUE INDEX "User_publicDisplayNameNormalized_key"
ON "User"("publicDisplayNameNormalized");

-- Canonical-run query indexes for the three Phase 7 boards.
CREATE INDEX "Run_mode_difficulty_isOfficial_status_userId_idx"
ON "Run"("mode", "difficulty", "isOfficial", "status", "userId");
CREATE INDEX "Run_dailyChallengeId_isOfficial_status_userId_idx"
ON "Run"("dailyChallengeId", "isOfficial", "status", "userId");
CREATE INDEX "Run_isOfficial_status_userId_completedAt_idx"
ON "Run"("isOfficial", "status", "userId", "completedAt");
