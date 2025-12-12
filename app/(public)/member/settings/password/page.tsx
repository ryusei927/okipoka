"use client";

import { useState } from "react";
import { updatePassword } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await updatePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setIsSuccess(true);
        // 3秒後にマイページへ
        setTimeout(() => {
          router.push("/member");
        }, 3000);
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
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">パスワードを変更しました</h2>
          <p className="text-gray-600">
            新しいパスワードでログインできます。
            <br />
            まもなくマイページへ移動します...
          </p>
          <div className="pt-4">
            <Link href="/member" className="text-orange-600 hover:text-orange-700 font-medium">
              マイページへ戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">新しいパスワードの設定</h2>
          <p className="mt-2 text-sm text-gray-600">
            新しいパスワードを入力してください
          </p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                新しいパスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="6文字以上"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="もう一度入力してください"
              />
            </div>
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
            パスワードを変更する
          </button>
        </form>
      </div>
    </div>
  );
}
