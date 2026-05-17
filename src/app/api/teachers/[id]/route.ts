import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
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

  // If phone is being changed, ensure it's not taken by another record in
  // the same source (teacher portal directories only block teacher portal
  // duplicates — a matching admin-portal staff account on the same phone is
  // intentionally allowed).
  if (
    body.phone !== undefined &&
    typeof body.phone === "string" &&
    body.phone.trim() !== ""
  ) {
    const newPhone = body.phone.trim();
    if (newPhone !== target.phone) {
      const conflict = await prisma.user.findFirst({
        where: {
          phone: newPhone,
          createdVia: target.createdVia,
          id: { not: target.id },
        },
      });
      if (conflict) {
        return NextResponse.json(
          {
            error:
              "Another teacher in this list already uses that phone number.",
          },
          { status: 409 }
        );
      }
    }
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined && body.phone.trim() !== "") {
    data.phone = body.phone.trim();
  }
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

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "UPDATE_TEACHER",
    targetType: "teacher",
    targetId: updated.id,
    targetName: updated.name,
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

  // Only teachers and admins can delete teacher accounts
  // (students and editors are blocked)
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only teachers and admins can delete teacher accounts." },
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

  await logActivity({
    userId: user.id,
    userRole: user.role as UserRole,
    userName: user.name,
    action: "DELETE_TEACHER",
    targetType: "teacher",
    targetId: target.id,
    targetName: target.name,
  });

  return NextResponse.json({ message: "Teacher deleted successfully" });
}
