/*
  Warnings:

  - You are about to drop the column `className` on the `ClassHistory` table. All the data in the column will be lost.
  - You are about to drop the column `className` on the `Student` table. All the data in the column will be lost.
  - Added the required column `classNameEn` to the `ClassHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ClassHistory_className_session_idx";

-- DropIndex
DROP INDEX "Student_className_admissionYear_idx";

-- AlterTable
ALTER TABLE "ClassHistory" DROP COLUMN "className",
ADD COLUMN     "classNameBn" TEXT,
ADD COLUMN     "classNameEn" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "className",
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "createdById" TEXT;

-- CreateIndex
CREATE INDEX "ClassHistory_session_idx" ON "ClassHistory"("session");

-- CreateIndex
CREATE INDEX "Student_classId_admissionYear_idx" ON "Student"("classId", "admissionYear");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
