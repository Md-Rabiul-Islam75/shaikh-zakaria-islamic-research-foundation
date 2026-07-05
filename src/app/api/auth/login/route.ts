import { prisma } from "@/lib/prisma";
import { signToken, UserRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const VALID_ROLES: UserRole[] = ["student", "teacher", "editor", "admin"];

const roleLabel: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  editor: "Editor",
  admin: "Admin",
};

export async function POST(request: NextRequest) {
  const { phone, password, role } = await request.json();

  // Normalize phone by removing non-digit characters (handles dashes, spaces, +88 etc.)
  const normalizedPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : phone;

  if (!phone || !password || !role) {
    return NextResponse.json(
      { error: "Role, phone, and password are all required" },
      { status: 400 }
    );
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role selected" },
      { status: 400 }
    );
  }

  // The same phone can exist in multiple records (e.g. admin-portal login +
  // teacher-portal directory entry). Find the candidate that matches the
  // selected role AND the provided password.
  const candidates = await prisma.user.findMany({
    where: { phone: normalizedPhone },
  });

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No account found with this phone number" },
      { status: 404 }
    );
  }

  const sameRole = candidates.filter((c) => c.role === role);
  if (sameRole.length === 0) {
    const otherRole = candidates[0].role as UserRole;
    return NextResponse.json(
      {
        error: `This phone number is registered as a ${roleLabel[otherRole]}, not a ${roleLabel[role as UserRole]}. Please select the correct role.`,
      },
      { status: 403 }
    );
  }

  let user = null;
  for (const c of sameRole) {
    // Profile-only records (e.g. Teacher Portal directory entries) have an
    // empty password and are never valid login accounts.
    if (!c.password) continue;
    if (await bcrypt.compare(password, c.password)) {
      user = c;
      break;
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: "Incorrect password. Please try again." },
      { status: 401 }
    );
  }

  const token = await signToken({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role as UserRole,
  });

  const response = NextResponse.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
  });

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
