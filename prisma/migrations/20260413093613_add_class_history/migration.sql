-- CreateTable
CREATE TABLE "ClassHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "className" INTEGER NOT NULL,
    "session" INTEGER NOT NULL,
    "roll" INTEGER NOT NULL,
    "section" TEXT,
    "result" TEXT NOT NULL DEFAULT 'Promoted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassHistory_studentId_idx" ON "ClassHistory"("studentId");

-- CreateIndex
CREATE INDEX "ClassHistory_className_session_idx" ON "ClassHistory"("className", "session");

-- AddForeignKey
ALTER TABLE "ClassHistory" ADD CONSTRAINT "ClassHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
