import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can modify staff accounts." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || (target.role !== "teacher" && target.role !== "editor")) {
    return NextResponse.json(
      { error: "Staff account not found" },
      { status: 404 }
    );
  }

  const { name, phone, password, confirmPassword } = await request.json();

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  if (password) {
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
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Phone number must contain digits" },
      { status: 400 }
    );
  }

  if (normalizedPhone !== target.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: normalizedPhone, createdVia: "admin_portal" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Another staff account already has this phone number" },
        { status: 409 }
      );
    }
  }

  const data: Record<string, unknown> = {
    name: name.trim(),
    phone: normalizedPhone,
  };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
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
    action: "UPDATE_TEACHER",
    targetType: "teacher",
    targetId: updated.id,
    targetName: updated.name,
    metadata: { role: updated.role, passwordChanged: !!password },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can delete staff accounts." },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || (target.role !== "teacher" && target.role !== "editor")) {
    return NextResponse.json(
      { error: "Staff account not found" },
      { status: 404 }
    );
  }

  await prisma.user.delete({ where: { id } });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "DELETE_TEACHER",
    targetType: "teacher",
    targetId: target.id,
    targetName: target.name,
    metadata: { role: target.role },
  });

  return NextResponse.json({ message: "Staff account deleted successfully" });
}
