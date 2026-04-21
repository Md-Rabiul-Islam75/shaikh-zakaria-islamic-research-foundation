import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentPortalClient from "./StudentPortalClient";

export default async function StudentPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/student-portal");

  return <StudentPortalClient userRole={user.role} userName={user.name} />;
}
