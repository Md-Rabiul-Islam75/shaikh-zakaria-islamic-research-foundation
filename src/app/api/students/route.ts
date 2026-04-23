import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const classId = searchParams.get("classId");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (year) where.admissionYear = parseInt(year);

  const students = await prisma.student.findMany({
    where,
    orderBy: { roll: "asc" },
    include: { class: { select: { nameEn: true, nameBn: true } } },
  });

  return NextResponse.json(students);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.classId) {
    return NextResponse.json(
      { error: "classId is required" },
      { status: 400 }
    );
  }

  // Verify class exists
  const targetClass = await prisma.class.findUnique({
    where: { id: body.classId },
  });
  if (!targetClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Auto-assign roll: find the highest roll in this class+year, then +1
  const lastStudent = await prisma.student.findFirst({
    where: {
      classId: body.classId,
      admissionYear: parseInt(body.admissionYear),
    },
    orderBy: { roll: "desc" },
    select: { roll: true },
  });
  const nextRoll = body.roll
    ? parseInt(body.roll)
    : (lastStudent?.roll ?? 0) + 1;

  const student = await prisma.student.create({
    data: {
      studentNameEn: body.studentNameEn,
      studentNameBn: body.studentNameBn || null,
      fatherName: body.fatherName,
      motherName: body.motherName,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      religion: body.religion,
      nationality: body.nationality || "Bangladeshi",
      bloodGroup: body.bloodGroup || null,
      birthCertificateNo: body.birthCertificateNo || null,
      phone: body.phone,
      presentAddress: body.presentAddress,
      permanentAddress: body.permanentAddress || null,
      roll: nextRoll,
      classId: body.classId,
      section: body.section || null,
      admissionYear: parseInt(body.admissionYear),
      admissionType: body.admissionType || "free",
      admissionFee: body.admissionFee || "Free",
      previousSchool: body.previousSchool || null,
      imageUrl: body.imageUrl || null,
      imagePublicId: body.imagePublicId || null,
      createdById: user.id,
    },
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "CREATE_STUDENT",
    targetType: "student",
    targetId: student.id,
    targetName: student.studentNameEn,
    metadata: {
      classNameEn: targetClass.nameEn,
      roll: student.roll,
      admissionYear: student.admissionYear,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
