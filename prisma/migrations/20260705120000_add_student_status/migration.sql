-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "graduatedAt" TIMESTAMP(3),
ADD COLUMN     "graduatedSession" INTEGER;

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");
