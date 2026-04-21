import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherPortalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/teacher-portal");

  if (user.role === "student") redirect("/?error=forbidden");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
            Teacher Portal
          </span>
          <h1 className="text-3xl font-bold text-gray-800">Teacher Management</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming in Phase 4</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Teacher management features — view, assign classes, manage staff — will be available in the next phase.
        </p>
      </div>
    </div>
  );
}
