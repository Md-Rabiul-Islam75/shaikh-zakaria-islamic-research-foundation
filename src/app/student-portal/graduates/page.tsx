import { getCurrentUser } from "@/lib/auth";
import GraduatesClient from "./GraduatesClient";

// Public page — no login required. Guests get a read-only view.
export default async function GraduatesPage() {
  const user = await getCurrentUser();

  return (
    <GraduatesClient
      userRole={user?.role ?? null}
      userName={user?.name ?? "Guest"}
    />
  );
}
