import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // body = {
  //   students: [{ id, newRoll }],
  //   fromClass, fromSession,
  //   toClass, toSession,
  //   result (default: "Promoted")
  // }

  const {
    students,
    fromClass,
    fromSession,
    toClass,
    toSession,
  }: {
    students: { id: string; newRoll: number }[];
    fromClass: number;
    fromSession: number;
    toClass: number;
    toSession: number;
  } = body;

  if (!students || students.length === 0) {
    return NextResponse.json(
      { error: "No students selected" },
      { status: 400 }
    );
  }

  // Process each student in a transaction
  await prisma.$transaction(async (tx) => {
    for (const s of students) {
      // Get current student data
      const student = await tx.student.findUnique({ where: { id: s.id } });
      if (!student) continue;

      // Save current class info to history
      await tx.classHistory.create({
        data: {
          studentId: student.id,
          className: fromClass,
          session: fromSession,
          roll: student.roll,
          section: student.section,
          result: "Promoted",
        },
      });

      // Update student to new class
      await tx.student.update({
        where: { id: s.id },
        data: {
          className: toClass,
          admissionYear: toSession,
          roll: s.newRoll,
          section: null,
        },
      });
    }
  });

  return NextResponse.json({
    message: `${students.length} student(s) promoted from Class ${fromClass} to Class ${toClass}`,
    promoted: students.length,
  });
}
