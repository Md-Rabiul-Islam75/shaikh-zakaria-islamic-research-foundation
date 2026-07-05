import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClassStudentsClient from "./ClassStudentsClient";

// Public page — no login required. Guests get a read-only view.
export default async function ClassStudentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await getCurrentUser();

  const { classId } = await params;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) notFound();

  return (
    <ClassStudentsClient
      userRole={user?.role ?? null}
      userName={user?.name ?? "Guest"}
      classInfo={{
        id: cls.id,
        nameEn: cls.nameEn,
        nameBn: cls.nameBn,
        description: cls.description,
      }}
    />
  );
}
