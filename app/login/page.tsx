"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { login, signup } from "./actions";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  const ui = useMemo(() => {
    if (mode === "signup") {
      return {
        title: "新規登録",
        description: "すでにアカウントをお持ちの場合はログインしてください",
        primaryLabel: "新規登録",
        primaryAction: signup,
        secondaryLabel: "ログインへ",
        secondaryAction: () => setMode("login"),
        passwordAutoComplete: "new-password" as const,
      };
    }

    return {
      title: "ログイン",
      description: "アカウントをお持ちでない場合は登録してください",
      primaryLabel: "ログイン",
      primaryAction: login,
      secondaryLabel: "新規登録",
      secondaryAction: () => setMode("signup"),
      passwordAutoComplete: "current-password" as const,
    };
  }, [mode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{ui.title}</h2>
          <p className="mt-2 text-sm text-gray-600">{ui.description}</p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                {mode === "login" ? (
                  <div className="text-sm">
                    <Link
                      href="/login/forgot-password"
                      className="font-medium text-orange-600 hover:text-orange-500"
                    >
                      パスワードをお忘れですか？
                    </Link>
                  </div>
                ) : null}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={ui.passwordAutoComplete}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={ui.primaryAction}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {ui.primaryLabel}
            </button>
            <button
              type="button"
              onClick={ui.secondaryAction}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {ui.secondaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
