import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const CREATABLE_ROLES = ["teacher", "editor"] as const;
type CreatableRole = (typeof CREATABLE_ROLES)[number];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can view staff accounts." },
      { status: 403 }
    );
  }

  const accounts = await prisma.user.findMany({
    where: { role: { in: ["teacher", "editor"] } },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can create teacher or editor credentials." },
      { status: 403 }
    );
  }

  const { name, phone, password, confirmPassword, role } = await request.json();

  if (!name?.trim() || !phone?.trim() || !password || !confirmPassword || !role) {
    return NextResponse.json(
      { error: "Name, phone, password, confirm password, and role are required" },
      { status: 400 }
    );
  }

  if (!CREATABLE_ROLES.includes(role as CreatableRole)) {
    return NextResponse.json(
      { error: "Role must be either teacher or editor" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  if (password.length < 5) {
    return NextResponse.json(
      { error: "Password must be at least 5 characters" },
      { status: 400 }
    );
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Phone number must contain digits" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this phone number already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: normalizedPhone,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: role === "editor" ? "CREATE_EDITOR" : "CREATE_TEACHER",
    targetType: "teacher",
    targetId: created.id,
    targetName: created.name,
    metadata: { role: created.role },
  });

  return NextResponse.json(created, { status: 201 });
}
