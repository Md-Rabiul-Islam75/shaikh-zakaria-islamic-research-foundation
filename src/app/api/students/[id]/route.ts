import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only teachers and admins can edit students
  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot edit student records. Only teachers and admins can." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.studentNameEn !== undefined) data.studentNameEn = body.studentNameEn;
  if (body.studentNameBn !== undefined) data.studentNameBn = body.studentNameBn;
  if (body.fatherName !== undefined) data.fatherName = body.fatherName;
  if (body.motherName !== undefined) data.motherName = body.motherName;
  if (body.dateOfBirth !== undefined) data.dateOfBirth = new Date(body.dateOfBirth);
  if (body.gender !== undefined) data.gender = body.gender;
  if (body.religion !== undefined) data.religion = body.religion;
  if (body.nationality !== undefined) data.nationality = body.nationality;
  if (body.bloodGroup !== undefined) data.bloodGroup = body.bloodGroup;
  if (body.birthCertificateNo !== undefined) data.birthCertificateNo = body.birthCertificateNo;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.presentAddress !== undefined) data.presentAddress = body.presentAddress;
  if (body.permanentAddress !== undefined) data.permanentAddress = body.permanentAddress;
  if (body.roll !== undefined) data.roll = parseInt(body.roll);
  if (body.classId !== undefined) data.classId = body.classId;
  if (body.section !== undefined) data.section = body.section;
  if (body.admissionYear !== undefined) data.admissionYear = parseInt(body.admissionYear);
  if (body.admissionType !== undefined) data.admissionType = body.admissionType;
  if (body.admissionFee !== undefined) data.admissionFee = body.admissionFee;
  if (body.previousSchool !== undefined) data.previousSchool = body.previousSchool;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.imagePublicId !== undefined) data.imagePublicId = body.imagePublicId;

  const student = await prisma.student.update({
    where: { id },
    data,
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "UPDATE_STUDENT",
    targetType: "student",
    targetId: student.id,
    targetName: student.studentNameEn,
  });

  return NextResponse.json(student);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot delete student records. Only teachers and admins can." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (student.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(student.imagePublicId);
    } catch {
      // ignore cloudinary cleanup errors
    }
  }

  await prisma.student.delete({ where: { id } });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "DELETE_STUDENT",
    targetType: "student",
    targetId: student.id,
    targetName: student.studentNameEn,
  });

  return NextResponse.json({ message: "Student deleted successfully" });
}
