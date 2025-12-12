"use client";

import { useState } from "react";
import { resetPassword } from "../actions";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsSuccess(true);
      }
    } catch (e) {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsPending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">メールを送信しました</h2>
          <p className="text-gray-600">
            パスワード再設定用のリンクをメールでお送りしました。メールをご確認ください。
          </p>
          <div className="pt-4">
            <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" />
            ログインに戻る
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">パスワードをお忘れの方</h2>
          <p className="mt-2 text-sm text-gray-600">
            登録したメールアドレスを入力してください。再設定用のリンクをお送りします。
          </p>
        </div>

        <form action={handleSubmit} className="space-y-6">
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
              placeholder="example@okipoka.jp"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            送信する
          </button>
        </form>
      </div>
    </div>
  );
}
