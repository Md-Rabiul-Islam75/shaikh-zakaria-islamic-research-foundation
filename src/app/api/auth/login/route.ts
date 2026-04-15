import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { phone, password } = await request.json();

  if (!phone || !password) {
    return NextResponse.json(
      { error: "Phone and password are required" },
      { status: 400 }
    );
  }

  const teacher = await prisma.teacher.findUnique({ where: { phone } });
  if (!teacher) {
    return NextResponse.json(
      { error: "Invalid phone or password" },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(password, teacher.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid phone or password" },
      { status: 401 }
    );
  }

  const token = await signToken({
    id: teacher.id,
    phone: teacher.phone,
    name: teacher.name,
    role: teacher.role,
  });

  const response = NextResponse.json({
    id: teacher.id,
    phone: teacher.phone,
    name: teacher.name,
    role: teacher.role,
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
