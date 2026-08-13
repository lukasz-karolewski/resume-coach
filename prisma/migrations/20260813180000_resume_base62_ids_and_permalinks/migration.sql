BEGIN;

LOCK TABLE
  "Resume",
  "Experience",
  "Education",
  "Patent",
  "Section",
  "ResumeSkill",
  "chat_threads"
IN ACCESS EXCLUSIVE MODE;

CREATE TABLE "__resume_id_migration" (
  "oldId" INTEGER PRIMARY KEY,
  "newId" VARCHAR(6) NOT NULL UNIQUE
);

DO $$
DECLARE
  old_resume_id INTEGER;
  candidate TEXT;
  alphabet CONSTANT TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
BEGIN
  FOR old_resume_id IN SELECT "id" FROM "Resume" ORDER BY "id" LOOP
    LOOP
      SELECT string_agg(substr(alphabet, floor(random() * 62)::INTEGER + 1, 1), '')
      INTO candidate
      FROM generate_series(1, 6);

      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "__resume_id_migration" WHERE "newId" = candidate
      );
    END LOOP;

    INSERT INTO "__resume_id_migration" ("oldId", "newId")
    VALUES (old_resume_id, candidate);
  END LOOP;
END $$;

ALTER TABLE "Resume" ADD COLUMN "newId" VARCHAR(6);
ALTER TABLE "Experience" ADD COLUMN "newResumeId" VARCHAR(6);
ALTER TABLE "Education" ADD COLUMN "newResumeId" VARCHAR(6);
ALTER TABLE "Patent" ADD COLUMN "newResumeId" VARCHAR(6);
ALTER TABLE "Section" ADD COLUMN "newResumeId" VARCHAR(6);
ALTER TABLE "ResumeSkill" ADD COLUMN "newResumeId" VARCHAR(6);
ALTER TABLE "chat_threads" ADD COLUMN "newResumeId" VARCHAR(6);

UPDATE "Resume" AS resume
SET "newId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE resume."id" = mapping."oldId";

UPDATE "Experience" AS child
SET "newResumeId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE child."resumeId" = mapping."oldId";

UPDATE "Education" AS child
SET "newResumeId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE child."resumeId" = mapping."oldId";

UPDATE "Patent" AS child
SET "newResumeId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE child."resumeId" = mapping."oldId";

UPDATE "Section" AS child
SET "newResumeId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE child."resumeId" = mapping."oldId";

UPDATE "ResumeSkill" AS child
SET "newResumeId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE child."resumeId" = mapping."oldId";

UPDATE "chat_threads" AS child
SET "newResumeId" = mapping."newId"
FROM "__resume_id_migration" AS mapping
WHERE child."resumeId" = mapping."oldId";

ALTER TABLE "Resume" ALTER COLUMN "newId" SET NOT NULL;
ALTER TABLE "ResumeSkill" ALTER COLUMN "newResumeId" SET NOT NULL;

ALTER TABLE "Experience" DROP CONSTRAINT "Experience_resumeId_fkey";
ALTER TABLE "Education" DROP CONSTRAINT "Education_resumeId_fkey";
ALTER TABLE "Patent" DROP CONSTRAINT "Patent_resumeId_fkey";
ALTER TABLE "Section" DROP CONSTRAINT "Section_resumeId_fkey";
ALTER TABLE "ResumeSkill" DROP CONSTRAINT "ResumeSkill_resumeId_fkey";
ALTER TABLE "chat_threads" DROP CONSTRAINT "chat_threads_resumeId_fkey";
ALTER TABLE "Resume" DROP CONSTRAINT "Resume_pkey";

ALTER TABLE "Resume" DROP COLUMN "id";
ALTER TABLE "Experience" DROP COLUMN "resumeId";
ALTER TABLE "Education" DROP COLUMN "resumeId";
ALTER TABLE "Patent" DROP COLUMN "resumeId";
ALTER TABLE "Section" DROP COLUMN "resumeId";
ALTER TABLE "ResumeSkill" DROP COLUMN "resumeId";
ALTER TABLE "chat_threads" DROP COLUMN "resumeId";

ALTER TABLE "Resume" RENAME COLUMN "newId" TO "id";
ALTER TABLE "Experience" RENAME COLUMN "newResumeId" TO "resumeId";
ALTER TABLE "Education" RENAME COLUMN "newResumeId" TO "resumeId";
ALTER TABLE "Patent" RENAME COLUMN "newResumeId" TO "resumeId";
ALTER TABLE "Section" RENAME COLUMN "newResumeId" TO "resumeId";
ALTER TABLE "ResumeSkill" RENAME COLUMN "newResumeId" TO "resumeId";
ALTER TABLE "chat_threads" RENAME COLUMN "newResumeId" TO "resumeId";

ALTER TABLE "Resume" ADD CONSTRAINT "Resume_pkey" PRIMARY KEY ("id");
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_id_base62_check"
  CHECK ("id" ~ '^[A-Za-z0-9]{6}$');

CREATE INDEX "Experience_resumeId_idx" ON "Experience"("resumeId");
CREATE INDEX "Education_resumeId_idx" ON "Education"("resumeId");
CREATE INDEX "Patent_resumeId_idx" ON "Patent"("resumeId");
CREATE UNIQUE INDEX "ResumeSkill_resumeId_skillId_key" ON "ResumeSkill"("resumeId", "skillId");
CREATE INDEX "chat_threads_resumeId_idx" ON "chat_threads"("resumeId");

ALTER TABLE "Experience" ADD CONSTRAINT "Experience_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Education" ADD CONSTRAINT "Education_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patent" ADD CONSTRAINT "Patent_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResumeSkill" ADD CONSTRAINT "ResumeSkill_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ResumePermalink" (
  "id" TEXT NOT NULL,
  "slug" VARCHAR(64) NOT NULL,
  "resumeId" VARCHAR(6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ResumePermalink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ResumePermalink_slug_check"
    CHECK (
      char_length("slug") BETWEEN 3 AND 64
      AND "slug" ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$'
    ),
  CONSTRAINT "ResumePermalink_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ResumePermalink_slug_key" ON "ResumePermalink"("slug");

CREATE UNIQUE INDEX "ResumePermalink_resumeId_key" ON "ResumePermalink"("resumeId");

DROP TABLE "__resume_id_migration";

COMMIT;
