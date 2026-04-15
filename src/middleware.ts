import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Routes that require authentication
const protectedPaths = ["/class", "/student"];

// Routes for unauthenticated users only (redirect if logged in)
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  const user = token ? await verifyToken(token) : null;

  // Protected route + not logged in → redirect to login
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Login/register page + already logged in → redirect to home
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/class/:path*", "/student/:path*", "/login", "/register"],
};
