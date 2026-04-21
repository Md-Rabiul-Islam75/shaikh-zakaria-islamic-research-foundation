import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const teacher = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      imageUrl: true,
      imagePublicId: true,
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
  });

  if (!teacher || teacher.role !== "teacher") {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json(teacher);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only teachers and admins can update teacher profiles
  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot modify teacher records." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "teacher") {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.designation !== undefined) data.designation = body.designation || null;
  if (body.qualification !== undefined) data.qualification = body.qualification || null;
  if (body.subject !== undefined) data.subject = body.subject || null;
  if (body.gender !== undefined) data.gender = body.gender || null;
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.address !== undefined) data.address = body.address || null;
  if (body.nidNumber !== undefined) data.nidNumber = body.nidNumber || null;
  if (body.joiningDate !== undefined) {
    data.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
  }
  if (body.bio !== undefined) data.bio = body.bio || null;
  if (body.responsibleClasses !== undefined) data.responsibleClasses = body.responsibleClasses;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.imagePublicId !== undefined) data.imagePublicId = body.imagePublicId;

  const updated = await prisma.user.update({
    where: { id },
    data,
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

  // BOTH teachers AND admins can delete teachers — only students are blocked
  if (user.role === "student") {
    return NextResponse.json(
      { error: "Students cannot delete teacher accounts." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "teacher") {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  // Cannot delete yourself
  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 403 }
    );
  }

  if (target.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(target.imagePublicId);
    } catch {
      // ignore cleanup errors
    }
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "Teacher deleted successfully" });
}
