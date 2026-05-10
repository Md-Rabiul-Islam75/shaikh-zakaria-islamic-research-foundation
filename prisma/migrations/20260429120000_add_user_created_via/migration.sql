-- AlterTable
ALTER TABLE "User" ADD COLUMN "createdVia" TEXT;

-- Backfill existing rows so admin dashboard lists the right accounts:
--   editors can only have been created via the admin portal,
--   teachers have historically been created via the teacher portal,
--   students self-register.
UPDATE "User" SET "createdVia" = 'admin_portal'   WHERE "role" = 'editor'  AND "createdVia" IS NULL;
UPDATE "User" SET "createdVia" = 'teacher_portal' WHERE "role" = 'teacher' AND "createdVia" IS NULL;
UPDATE "User" SET "createdVia" = 'self_register'  WHERE "role" = 'student' AND "createdVia" IS NULL;
UPDATE "User" SET "createdVia" = 'seeded'         WHERE "role" = 'admin'   AND "createdVia" IS NULL;
