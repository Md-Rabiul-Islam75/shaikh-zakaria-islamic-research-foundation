import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot promote. Only teachers and admins can." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    students,
    fromClassId,
    fromSession,
    toClassId,
    toSession,
  }: {
    students: { id: string; newRoll: number }[];
    fromClassId: string;
    fromSession: number;
    toClassId: string;
    toSession: number;
  } = body;

  if (!students || students.length === 0) {
    return NextResponse.json(
      { error: "No students selected" },
      { status: 400 }
    );
  }

  // Get "from" class name for history snapshot
  const fromClass = await prisma.class.findUnique({ where: { id: fromClassId } });
  const toClass = await prisma.class.findUnique({ where: { id: toClassId } });
  if (!fromClass || !toClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    for (const s of students) {
      const student = await tx.student.findUnique({ where: { id: s.id } });
      if (!student) continue;

      // Save history snapshot with class name (not id)
      await tx.classHistory.create({
        data: {
          studentId: student.id,
          classNameEn: fromClass.nameEn,
          classNameBn: fromClass.nameBn,
          session: fromSession,
          roll: student.roll,
          section: student.section,
          result: "Promoted",
        },
      });

      await tx.student.update({
        where: { id: s.id },
        data: {
          classId: toClassId,
          admissionYear: toSession,
          roll: s.newRoll,
          section: null,
        },
      });
    }
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "PROMOTE_STUDENTS",
    targetType: "class",
    targetId: toClassId,
    targetName: `${fromClass.nameEn} → ${toClass.nameEn}`,
    metadata: {
      count: students.length,
      fromSession,
      toSession,
    },
  });

  return NextResponse.json({
    message: `${students.length} student(s) promoted from ${fromClass.nameEn} to ${toClass.nameEn}`,
    promoted: students.length,
  });
}
