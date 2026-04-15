import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header>
      <nav className="bg-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-700"
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
              <span className="text-white text-xl font-bold tracking-wide">
                Student Management
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-100 hover:text-white transition-colors font-medium text-sm"
              >
                Home
              </Link>
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 bg-blue-800 px-3 py-1.5 rounded-full">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-blue-100 hover:text-white transition-colors font-medium text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Marquee education quote */}
      <div className="bg-blue-600 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          &quot;Education is the most powerful weapon which you can use to change
          the world.&quot; — Nelson Mandela &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          &quot;The roots of education are bitter, but the fruit is
          sweet.&quot; — Aristotle &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          &quot;Live as if you were to die tomorrow. Learn as if you were to
          live forever.&quot; — Mahatma Gandhi
          &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; &quot;শিক্ষা জাতির
          মেরুদণ্ড&quot; &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; &quot;An
          investment in knowledge pays the best interest.&quot; — Benjamin
          Franklin
        </div>
      </div>
    </header>
  );
}
