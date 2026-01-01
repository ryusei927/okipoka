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
      className="w-full flex items-center justify-center gap-2 p-4 text-red-600 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 transition-colors font-medium"
    >
      <LogOut className="w-5 h-5" />
      ログアウト
    </button>
  );
}
