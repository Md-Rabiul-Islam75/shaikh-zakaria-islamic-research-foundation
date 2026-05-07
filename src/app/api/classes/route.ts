import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const classes = await prisma.class.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(classes);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot create classes." },
      { status: 403 }
    );
  }

  const { nameEn, nameBn, description } = await request.json();

  if (!nameEn?.trim() || !nameBn?.trim()) {
    return NextResponse.json(
      { error: "Both English and Bangla names are required" },
      { status: 400 }
    );
  }

  // Find the max order to append new class at the end
  const last = await prisma.class.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? 0) + 1;

  const newClass = await prisma.class.create({
    data: {
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      description: description?.trim() || null,
      order: nextOrder,
      createdById: user.id,
    },
  });

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "CREATE_CLASS",
    targetType: "class",
    targetId: newClass.id,
    targetName: newClass.nameEn,
    metadata: { nameBn: newClass.nameBn },
  });

  return NextResponse.json(newClass, { status: 201 });
}
