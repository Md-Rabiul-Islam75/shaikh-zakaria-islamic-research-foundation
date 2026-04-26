import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import AuthLinks from "./AuthLinks";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <>
      <nav className="bg-blue-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 min-h-16 py-2 sm:py-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              {/* Full name on md+, shorter on mobile */}
              <span className="hidden md:inline text-white text-lg lg:text-xl font-bold tracking-wide">
                জামিয়া দারুল উলুম নুরিয়া মাদ্‌রাসা ও এতিমখানা
              </span>
              <span className="md:hidden text-white text-sm sm:text-base font-bold tracking-wide leading-tight line-clamp-2">
                জামিয়া দারুল উলুম
                <span className="block text-[11px] sm:text-xs font-medium text-blue-100">
                  নুরিয়া মাদ্‌রাসা ও এতিমখানা
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="text-blue-100 hover:text-white transition-colors font-medium text-sm hidden sm:inline"
              >
                Home
              </Link>
              {user ? (
                <>
                  <div className="hidden lg:flex items-center gap-2 bg-blue-800 px-3 py-1.5 rounded-full">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-sm font-medium truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-amber-400 text-amber-900"
                          : user.role === "teacher"
                            ? "bg-emerald-400 text-emerald-900"
                            : "bg-sky-300 text-sky-900"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  {/* Compact role badge for tablet/mobile */}
                  <span
                    className={`lg:hidden text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      user.role === "admin"
                        ? "bg-amber-400 text-amber-900"
                        : user.role === "teacher"
                          ? "bg-emerald-400 text-emerald-900"
                          : "bg-sky-300 text-sky-900"
                    }`}
                  >
                    {user.role}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <AuthLinks />
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Marquee education quote */}
      <div className="bg-blue-600 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          &quot;শিক্ষা জাতির মেরুদণ্ড&quot;
          &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          &quot;জ্ঞান অর্জন প্রত্যেক মুসলিম নর-নারীর উপর ফরজ।&quot; — হাদীস (ইবনে মাজাহ)
        </div>
      </div>
    </>
  );
}
