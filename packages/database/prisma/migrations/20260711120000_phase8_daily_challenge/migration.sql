-- A published Daily Challenge must keep the exact scenario/difficulty order it
-- was created with. Pool entries remain editable content, but a challenge day
-- never changes after publication.
ALTER TABLE "DailyChallenge" ADD COLUMN "scenarioOrder" JSONB;

UPDATE "DailyChallenge" AS challenge
SET "scenarioOrder" = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'scenarioId', entry."scenarioId",
        'difficulty', entry."difficulty"
      )
      ORDER BY entry."ordinal"
    )
    FROM "DailyChallengePoolEntry" AS entry
    WHERE entry."poolId" = challenge."poolId"
  ),
  '[]'::jsonb
);

ALTER TABLE "DailyChallenge" ALTER COLUMN "scenarioOrder" SET NOT NULL;

-- A player can resume one current Daily attempt. Finished attempts are
-- intentionally unconstrained so replay remains unlimited and immutable.
CREATE UNIQUE INDEX "Run_dailyChallenge_active_user_key"
  ON "Run" ("dailyChallengeId", "userId")
  WHERE "status" = 'in_progress'
    AND "dailyChallengeId" IS NOT NULL
    AND "userId" IS NOT NULL;
