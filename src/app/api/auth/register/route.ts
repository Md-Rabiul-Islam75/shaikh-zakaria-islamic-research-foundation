import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { phone, name, password } = await request.json();

  if (!phone || !name || !password) {
    return NextResponse.json(
      { error: "Phone, name, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Check if phone already exists
  const existing = await prisma.teacher.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "A teacher with this phone number already exists" },
      { status: 409 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create teacher
  const teacher = await prisma.teacher.create({
    data: { phone, name, password: hashedPassword },
  });

  // Create JWT token
  const token = await signToken({
    id: teacher.id,
    phone: teacher.phone,
    name: teacher.name,
    role: teacher.role,
  });

  // Set cookie and return response
  const response = NextResponse.json(
    {
      id: teacher.id,
      phone: teacher.phone,
      name: teacher.name,
      role: teacher.role,
    },
    { status: 201 }
  );

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
