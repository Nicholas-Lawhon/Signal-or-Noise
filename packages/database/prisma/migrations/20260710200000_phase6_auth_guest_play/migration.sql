-- DropIndex
DROP INDEX "Run_dailyChallengeId_userId_key";

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Run_dailyChallengeId_userId_status_idx" ON "Run"("dailyChallengeId", "userId", "status");
