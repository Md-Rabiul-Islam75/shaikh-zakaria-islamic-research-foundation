import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot access teacher data" },
      { status: 403 }
    );
  }

  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      imageUrl: true,
      designation: true,
      qualification: true,
      subject: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      nidNumber: true,
      joiningDate: true,
      bio: true,
      responsibleClasses: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teachers);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only teachers and admins can add new teachers
  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot add teachers" },
      { status: 403 }
    );
  }

  const {
    name,
    phone,
    password,
    confirmPassword,
    designation,
    subject,
    qualification,
  } = await request.json();

  if (!name?.trim() || !phone?.trim() || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Name, phone, password and confirm password are required" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this phone number already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const teacher = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: "teacher",
      designation: designation?.trim() || null,
      subject: subject?.trim() || null,
      qualification: qualification?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      designation: true,
      subject: true,
      qualification: true,
    },
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "CREATE_TEACHER",
    targetType: "teacher",
    targetId: teacher.id,
    targetName: teacher.name,
  });

  return NextResponse.json(teacher, { status: 201 });
}
