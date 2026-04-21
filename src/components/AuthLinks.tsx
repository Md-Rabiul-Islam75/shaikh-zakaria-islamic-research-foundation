"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLinks() {
  const pathname = usePathname();
  const onLogin = pathname === "/login";
  const onRegister = pathname === "/register";

  return (
    <>
      {!onLogin && (
        <Link
          href="/login"
          className="text-blue-100 hover:text-white transition-colors font-medium text-sm"
        >
          Login
        </Link>
      )}
      {!onRegister && (
        <Link
          href="/register"
          className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Register
        </Link>
      )}
    </>
  );
}
