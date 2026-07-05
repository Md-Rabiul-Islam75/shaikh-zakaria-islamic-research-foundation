import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const STUDENT_PORTAL = ["/student-portal", "/student"];
const TEACHER_PORTAL = ["/teacher-portal", "/teacher", "/teachers"];
const ADMIN_PORTAL = ["/admin-portal", "/admin"];
const AUTH_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;
  const user = token ? await verifyToken(token) : null;

  const inStudentPortal = STUDENT_PORTAL.some((p) => pathname.startsWith(p));
  const inTeacherPortal = TEACHER_PORTAL.some((p) => pathname.startsWith(p));
  const inAdminPortal = ADMIN_PORTAL.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Logged-in users should not see the login page
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Not logged in + protected route → redirect to login
  if ((inStudentPortal || inTeacherPortal || inAdminPortal) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based enforcement
  if (user) {
    const role = user.role;

    if (role === "student" && (inTeacherPortal || inAdminPortal)) {
      return NextResponse.redirect(new URL("/?error=forbidden", request.url));
    }

    if (role === "teacher" && inAdminPortal) {
      return NextResponse.redirect(new URL("/?error=forbidden", request.url));
    }

    // Admin can access everything
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student-portal/:path*",
    "/teacher-portal/:path*",
    "/teacher/:path*",
    "/admin-portal/:path*",
    "/student/:path*",
    "/teachers/:path*",
    "/admin/:path*",
    "/login",
  ],
};
