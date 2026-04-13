import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const className = searchParams.get("class");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = {};
  if (className) where.className = parseInt(className);
  if (year) where.admissionYear = parseInt(year);

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Auto-assign roll: find the highest roll in this class+year, then +1
  const lastStudent = await prisma.student.findFirst({
    where: {
      className: parseInt(body.className),
      admissionYear: parseInt(body.admissionYear),
    },
    orderBy: { roll: "desc" },
    select: { roll: true },
  });
  const nextRoll = (lastStudent?.roll ?? 0) + 1;

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
      className: parseInt(body.className),
      section: body.section || null,
      admissionYear: parseInt(body.admissionYear),
      admissionFee: body.admissionFee || "Free",
      previousSchool: body.previousSchool || null,
      imageUrl: body.imageUrl || null,
      imagePublicId: body.imagePublicId || null,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
