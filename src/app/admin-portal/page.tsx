import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin-portal");

  if (user.role !== "admin") redirect("/?error=forbidden");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
            Admin Portal
          </span>
          <h1 className="text-3xl font-bold text-gray-800">System Administration</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming in Phase 5</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Activity log, student &amp; teacher activity tracking, and system settings will be available in the next phase.
        </p>
      </div>
    </div>
  );
}
