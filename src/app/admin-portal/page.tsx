import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminPortalClient from "./AdminPortalClient";

export default async function AdminPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin-portal");
  if (user.role !== "admin") redirect("/?error=forbidden");

  // Pre-fetch stats server-side for fast first paint
  const [studentCount, teacherCount, classCount, activityCount] = await Promise.all([
    prisma.student.count(),
    prisma.user.count({ where: { role: "teacher" } }),
    prisma.class.count(),
    prisma.activityLog.count(),
  ]);

  return (
    <AdminPortalClient
      userName={user.name}
      stats={{
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        activities: activityCount,
      }}
    />
  );
}
