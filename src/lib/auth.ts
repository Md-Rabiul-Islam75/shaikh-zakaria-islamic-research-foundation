import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_change_me"
);

export type UserRole = "student" | "teacher" | "editor" | "admin";

export interface JWTPayload {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  [key: string]: unknown;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function canAccessPortal(
  userRole: UserRole,
  portal: "student" | "teacher" | "admin"
): boolean {
  if (userRole === "admin") return true; // admin sees all
  if (userRole === "teacher" || userRole === "editor")
    return portal === "student" || portal === "teacher";
  if (userRole === "student") return portal === "student";
  return false;
}
