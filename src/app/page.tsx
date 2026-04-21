import Link from "next/link";
import Image from "next/image";
import { getCurrentUser, UserRole } from "@/lib/auth";

const portals: {
  role: UserRole;
  title: string;
  description: string;
  href: string;
  gradient: string;
  accent: string;
  icon: React.ReactNode;
}[] = [
  {
    role: "student",
    title: "Student Portal",
    description:
      "Browse classes, view student records, and help with admissions.",
    href: "/student-portal",
    gradient: "from-emerald-500 to-teal-600",
    accent: "bg-emerald-100 text-emerald-700",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    role: "teacher",
    title: "Teacher Portal",
    description:
      "Manage teachers, assign classes, and coordinate staff activities.",
    href: "/teacher-portal",
    gradient: "from-blue-500 to-indigo-600",
    accent: "bg-blue-100 text-blue-700",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    role: "admin",
    title: "Admin Portal",
    description:
      "Oversee all activity, monitor changes, and manage system-wide settings.",
    href: "/admin-portal",
    gradient: "from-amber-500 to-orange-600",
    accent: "bg-amber-100 text-amber-700",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Login to Your Portal",
    description: "Sign in with your role-based account (Student, Teacher, or Admin).",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Browse Classes",
    description: "Explore all Madrasa classes from Nurani to Dawra-e-Hadith.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Manage Students",
    description: "Add new students, update information, and track promotions.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Track Activities",
    description: "Admins see who did what, keeping the system safe and transparent.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

function canSeePortal(userRole: UserRole, portalRole: UserRole): boolean {
  if (userRole === "admin") return true;
  if (userRole === "teacher") return portalRole === "student" || portalRole === "teacher";
  if (userRole === "student") return portalRole === "student";
  return false;
}

export default async function Home() {
  const user = await getCurrentUser();
  const visiblePortals = user
    ? portals.filter((p) => canSeePortal(user.role, p.role))
    : [];

  return (
    <div>
      {/* Banner Section */}
      <section className="relative h-[420px] bg-gradient-to-r from-blue-800 to-blue-600 overflow-hidden">
        <Image
          src="/students_banner_unsplash.jpg"
          alt="Madrasa Banner"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mb-8">
            A complete solution for managing student admissions, records, and
            class organization. Here you can also view Teachers&apos; records,
            while the Admin can see and manage both Students and Teachers&apos;
            activities.
          </p>
          {user ? (
            <a
              href="#portals"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-blue-50 transition-all hover:scale-105"
            >
              Go to Your Portal
            </a>
          ) : (
            <div className="flex gap-3 flex-wrap justify-center">
              <Link
                href="/login"
                className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-blue-50 transition-all hover:scale-105"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-800 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-blue-900 transition-all hover:scale-105 border border-blue-400"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Portals (Logged In) OR Steps (Logged Out) */}
      {user ? (
        <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
              Welcome, {user.name}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Your Available Portals
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {user.role === "admin"
                ? "As an admin, you have access to all three portals."
                : user.role === "teacher"
                  ? "As a teacher, you can access student and teacher portals."
                  : "As a student, you can access the student portal."}
            </p>
          </div>

          <div className={`grid gap-6 ${visiblePortals.length === 1 ? "max-w-md mx-auto" : visiblePortals.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
            {visiblePortals.map((portal) => (
              <Link key={portal.role} href={portal.href} className="group">
                <div
                  className={`bg-gradient-to-br ${portal.gradient} rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer h-full flex flex-col`}
                >
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
                    {portal.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{portal.title}</h3>
                  <p className="text-white/90 text-sm mb-6 flex-1">
                    {portal.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-full group-hover:bg-white group-hover:text-gray-800 transition-colors">
                      Enter Portal
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Follow these simple steps to get started
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-100 text-center group"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-blue-500 tracking-widest uppercase">
                  Step {step.number}
                </span>
                <h3 className="text-lg font-semibold text-gray-800 mt-2 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
