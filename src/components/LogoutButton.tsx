"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
    >
      Logout
    </button>
  );
}
