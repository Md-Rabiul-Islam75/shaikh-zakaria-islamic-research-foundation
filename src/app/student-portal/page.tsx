import { getCurrentUser } from "@/lib/auth";
import StudentPortalClient from "./StudentPortalClient";

// Public page — no login required. Guests get a read-only view.
export default async function StudentPortalPage() {
  const user = await getCurrentUser();

  return (
    <StudentPortalClient
      userRole={user?.role ?? null}
      userName={user?.name ?? "Guest"}
    />
  );
}
