import { prisma } from "@/lib/prisma";
import { signToken, UserRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const VALID_ROLES: UserRole[] = ["student", "teacher", "admin"];

const roleLabel: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
};

export async function POST(request: NextRequest) {
  const { phone, password, role } = await request.json();

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

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found with this phone number" },
      { status: 404 }
    );
  }

  // Verify role matches the registered account
  if (user.role !== role) {
    return NextResponse.json(
      {
        error: `This phone number is registered as a ${roleLabel[user.role as UserRole]}, not a ${roleLabel[role as UserRole]}. Please select the correct role.`,
      },
      { status: 403 }
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
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
