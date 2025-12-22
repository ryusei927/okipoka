import Link from "next/link";
import { Lock, ChevronRight, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 flex items-center">
        <Link href="/member" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 ml-2">設定</h1>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            <Link href="/member/settings/password" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">パスワード変更</div>
                <div className="text-xs text-gray-500">ログインパスワードを変更します</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
