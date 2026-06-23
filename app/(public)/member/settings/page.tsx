import Link from "next/link";
import { Lock, ChevronRight } from "lucide-react";
import { BackLink } from "@/components/BackLink";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="pt-2">
          <BackLink className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">設定</h1>
        </div>
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
