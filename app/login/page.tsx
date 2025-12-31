"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { login, signup, signInWithGoogle } from "./actions";
import { ChevronLeft } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative">
      {/* 戻るボタン */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </Link>

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

        {/* 区切り線 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>

        {/* Googleログイン */}
        <form>
          <button
            formAction={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </button>
        </form>
      </div>
    </div>
  );
}
