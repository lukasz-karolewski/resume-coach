-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "location" TEXT,
ADD COLUMN "nextActionAt" TIMESTAMP(3),
ADD COLUMN "status" "JobStatus" NOT NULL DEFAULT 'SAVED',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Replace the global URL constraint so different users can track the same posting.
DROP INDEX "Job_url_key";
CREATE UNIQUE INDEX "Job_userId_url_key" ON "Job"("userId", "url");

-- CreateIndex
CREATE INDEX "Job_userId_status_idx" ON "Job"("userId", "status");
CREATE INDEX "Job_userId_nextActionAt_idx" ON "Job"("userId", "nextActionAt");

-- User-owned applications should be removed with their owner.
ALTER TABLE "Job" DROP CONSTRAINT "Job_userId_fkey";
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
