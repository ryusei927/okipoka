"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 py-3.5 text-red-500 bg-white rounded-sm ring-1 ring-gray-200/70 hover:bg-red-50 hover:ring-red-200 transition-all font-medium"
    >
      <LogOut className="w-5 h-5" />
      ログアウト
    </button>
  );
}
