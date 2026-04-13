-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentNameEn" TEXT NOT NULL,
    "studentNameBn" TEXT,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "religion" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Bangladeshi',
    "bloodGroup" TEXT,
    "birthCertificateNo" TEXT,
    "phone" TEXT NOT NULL,
    "presentAddress" TEXT NOT NULL,
    "permanentAddress" TEXT,
    "className" INTEGER NOT NULL,
    "section" TEXT,
    "admissionYear" INTEGER NOT NULL,
    "admissionFee" TEXT NOT NULL DEFAULT 'Free',
    "previousSchool" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Student_className_admissionYear_idx" ON "Student"("className", "admissionYear");
