import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

// Farewell = graduate students from the final class. Same privilege level as
// promotion: only teachers and admins.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only teachers and admins can give farewell." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    studentIds,
    fromClassId,
    session,
  }: {
    studentIds: string[];
    fromClassId: string;
    session: number;
  } = body;

  if (!studentIds || studentIds.length === 0) {
    return NextResponse.json({ error: "No students selected" }, { status: 400 });
  }

  const fromClass = await prisma.class.findUnique({ where: { id: fromClassId } });
  if (!fromClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  let graduated = 0;

  await prisma.$transaction(async (tx) => {
    for (const id of studentIds) {
      const student = await tx.student.findUnique({ where: { id } });
      if (!student || student.status === "graduated") continue;

      // Snapshot the completed class into history
      await tx.classHistory.create({
        data: {
          studentId: student.id,
          classNameEn: fromClass.nameEn,
          classNameBn: fromClass.nameBn,
          session,
          roll: student.roll,
          section: student.section,
          result: "Graduated",
        },
      });

      await tx.student.update({
        where: { id: student.id },
        data: {
          status: "graduated",
          graduatedAt: new Date(),
          graduatedSession: session,
        },
      });

      graduated += 1;
    }
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "FAREWELL_STUDENTS",
    targetType: "class",
    targetId: fromClassId,
    targetName: fromClass.nameEn,
    metadata: { count: graduated, session },
  });

  return NextResponse.json({
    message: `${graduated} student(s) graduated from ${fromClass.nameEn}`,
    graduated,
  });
}
