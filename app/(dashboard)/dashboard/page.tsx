import { Calendar, Store, Users, PlusCircle, Megaphone, Star, Dice5 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>

      {/* クイックアクション */}
      <div className="flex justify-center">
        <Link href="/dashboard/tournaments/new" className="w-full max-w-md p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="font-bold text-gray-900">大会を作成</span>
        </Link>
      </div>

      {/* メニューリスト */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          <Link href="/dashboard/tournaments" className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">大会管理</div>
              <div className="text-xs text-gray-500">開催予定の大会を編集・削除</div>
            </div>
          </Link>
          
          <Link href="/dashboard/shops" className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <Store className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">店舗管理</div>
              <div className="text-xs text-gray-500">店舗の一覧・追加・編集</div>
            </div>
          </Link>

          <Link href="/dashboard/ads" className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <Megaphone className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">広告管理</div>
              <div className="text-xs text-gray-500">バナー・スクエア広告の管理</div>
            </div>
          </Link>

          <Link href="/dashboard/featured" className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <Star className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">ピックアップPR管理</div>
              <div className="text-xs text-gray-500">トップページのPR画像設定</div>
            </div>
          </Link>

          <Link href="/dashboard/members" className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <Users className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">会員管理</div>
              <div className="text-xs text-gray-500">VIP会員の確認</div>
            </div>
          </Link>

          <Link href="/dashboard/gacha" className="flex items-center gap-3 p-4 hover:bg-gray-50">
            <Dice5 className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">ガチャ景品管理</div>
              <div className="text-xs text-gray-500">クーポン/当選確率の編集</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
