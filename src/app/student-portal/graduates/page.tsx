import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import GraduatesClient from "./GraduatesClient";

export default async function GraduatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/student-portal/graduates");

  return <GraduatesClient userRole={user.role} userName={user.name} />;
}
