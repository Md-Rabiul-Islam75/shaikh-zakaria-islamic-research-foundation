import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeacherDetailsClient from "./TeacherDetailsClient";

export default async function TeacherDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/teacher-portal");
  if (user.role === "student") redirect("/?error=forbidden");

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

  if (!teacher || teacher.role !== "teacher") notFound();

  return (
    <TeacherDetailsClient
      currentUserId={user.id}
      userRole={user.role}
      teacher={{
        ...teacher,
        dateOfBirth: teacher.dateOfBirth?.toISOString() || null,
        joiningDate: teacher.joiningDate?.toISOString() || null,
        createdAt: teacher.createdAt.toISOString(),
      }}
    />
  );
}
