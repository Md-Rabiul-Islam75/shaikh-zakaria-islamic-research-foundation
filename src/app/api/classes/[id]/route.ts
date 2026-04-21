import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  return NextResponse.json(cls);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only teachers and admins can modify classes" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { nameEn, nameBn, description } = await request.json();

  if (!nameEn?.trim() || !nameBn?.trim()) {
    return NextResponse.json(
      { error: "Both English and Bangla names are required" },
      { status: 400 }
    );
  }

  const updated = await prisma.class.update({
    where: { id },
    data: {
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      description: description?.trim() || null,
    },
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

  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only teachers and admins can delete classes" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  await prisma.class.delete({ where: { id } });

  return NextResponse.json({ message: "Class deleted successfully" });
}
