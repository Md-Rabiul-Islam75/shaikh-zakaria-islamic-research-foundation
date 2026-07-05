import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

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
    where: { role: "teacher", createdVia: "teacher_portal" },
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
    designation,
    subject,
    qualification,
  } = await request.json();

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  // Store phones as digits-only so they match everywhere (login, admin, dedup).
  const normalizedPhone = String(phone).replace(/\D/g, "");
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Phone number must contain digits" },
      { status: 400 }
    );
  }

  // Only check for duplicates within the teacher portal directory itself —
  // the same phone may already exist as an admin-portal staff account, and
  // that is intentionally allowed.
  const existing = await prisma.user.findFirst({
    where: { phone: normalizedPhone, createdVia: "teacher_portal" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A teacher with this phone number already exists in the directory" },
      { status: 409 }
    );
  }

  // Teacher Portal entries are directory/profile records only — they are NOT
  // login accounts. An empty password can never match at login (bcrypt.compare
  // against "" is always false). To give a teacher a login, an admin creates a
  // Staff Account in the Admin Portal and shares that password.
  const teacher = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: normalizedPhone,
      password: "",
      role: "teacher",
      designation: designation?.trim() || null,
      subject: subject?.trim() || null,
      qualification: qualification?.trim() || null,
      createdVia: "teacher_portal",
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
