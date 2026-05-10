-- Drop the global unique index on phone — same phone is now allowed across
-- different sources (admin_portal vs teacher_portal vs self_register).
DROP INDEX IF EXISTS "User_phone_key";

-- Create a composite unique index so duplicates are still prevented WITHIN a
-- single source (e.g. an editor cannot add the same teacher twice in the
-- teacher portal directory).
CREATE UNIQUE INDEX "User_phone_createdVia_key" ON "User" ("phone", "createdVia");
