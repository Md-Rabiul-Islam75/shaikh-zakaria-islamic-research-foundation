import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherPortalClient from "./TeacherPortalClient";

export default async function TeacherPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/teacher-portal");
  if (user.role === "student") redirect("/?error=forbidden");

  return (
    <TeacherPortalClient
      currentUserId={user.id}
      userRole={user.role}
      userName={user.name}
    />
  );
}
