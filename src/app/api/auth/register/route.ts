import { prisma } from "@/lib/prisma";
import { signToken, UserRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Only students can self-register publicly. Teacher/editor accounts are
// created by an admin from the Admin Portal; admins are seeded.
const VALID_ROLES: UserRole[] = ["student"];

export async function POST(request: NextRequest) {
  const { name, phone, password, confirmPassword, role } = await request.json();

  // Normalize phone by removing non-digit characters so storage is consistent
  const normalizedPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : phone;

  // Validation
  if (!name || !phone || !password || !confirmPassword || !role) {
    return NextResponse.json(
      { error: "All fields are required" },
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

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      {
        error:
          "Only student accounts can be registered publicly. Teacher, editor, and admin accounts are created by the administrator.",
      },
      { status: 403 }
    );
  }

  // Check if phone already exists
  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this phone number already exists" },
      { status: 409 }
    );
  }

  // Hash password & create
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, phone: normalizedPhone, password: hashedPassword, role },
  });

  // Create JWT token
  const token = await signToken({
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role as UserRole,
  });

  const response = NextResponse.json(
    {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
    { status: 201 }
  );

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
