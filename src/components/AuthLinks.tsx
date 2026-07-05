"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLinks() {
  const pathname = usePathname();
  const onLogin = pathname === "/login";

  return (
    <>
      {!onLogin && (
        <Link
          href="/login"
          className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Login
        </Link>
      )}
    </>
  );
}
