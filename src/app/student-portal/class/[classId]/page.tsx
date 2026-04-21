import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClassStudentsClient from "./ClassStudentsClient";

export default async function ClassStudentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/student-portal");

  const { classId } = await params;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) notFound();

  return (
    <ClassStudentsClient
      userRole={user.role}
      userName={user.name}
      classInfo={{
        id: cls.id,
        nameEn: cls.nameEn,
        nameBn: cls.nameBn,
        description: cls.description,
      }}
    />
  );
}
