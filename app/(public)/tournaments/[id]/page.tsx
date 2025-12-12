import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Info, Trophy, Share2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { AdBanner, Ad } from "@/components/ads/AdBanner";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // 広告の取得
  const { data: adsData } = await supabase
    .from("ads")
    .select("*")
    .eq("is_active", true);

  const ads = (adsData || []) as Ad[];
  const bannerAds = ads.filter(ad => ad.type === 'banner');

  // バナー広告: 全ての中からランダムに1つ
  let displayBannerAd = null;
  if (bannerAds.length > 0) {
    displayBannerAd = bannerAds[Math.floor(Math.random() * bannerAds.length)];
  }

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      shops (
        *
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Tournament fetch error:", error);
    notFound();
  }

  if (!tournament) {
    console.error("Tournament not found");
    notFound();
  }

  // 日付フォーマット (JST固定で表示)
  const startDate = new Date(tournament.start_at);
  
  // 日本時間でフォーマットするためのフォーマッター
  const jstDateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const jstTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });

  // yyyy/MM/dd -> yyyy-MM-dd に変換
  const dateStr = jstDateFormatter.format(startDate).replace(/\//g, "-");
  const startTimeStr = jstTimeFormatter.format(startDate);
  
  let lateRegStr = "-";
  if (tournament.late_reg_at) {
    lateRegStr = jstTimeFormatter.format(new Date(tournament.late_reg_at));
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-orange-500 font-bold">
            <ArrowLeft className="w-5 h-5" />
            <span>TOP</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* タイトルセクション */}
        <div className="flex items-start gap-3">
          <div className="w-1 h-6 bg-orange-500 rounded-full mt-1 shrink-0"></div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {tournament.title}
          </h1>
        </div>

        {/* 基本情報テーブル */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 space-y-4">
            <InfoRow label="場所">
              <Link href={`/shops/${tournament.shops.id}`} className="text-blue-600 font-bold hover:underline">
                {tournament.shops.name}
              </Link>
            </InfoRow>
            
            <InfoRow label="日付">
              <span className="font-medium">{dateStr}</span>
            </InfoRow>
            
            <InfoRow label="開始">
              <span className="font-medium">{startTimeStr}</span>
            </InfoRow>
            
            <InfoRow label="締切">
              <span className="font-medium">{lateRegStr}</span>
            </InfoRow>
            
            <InfoRow label="種類">
              <span className="font-medium">{tournament.type || "トーナメント"}</span>
            </InfoRow>
          </div>
          
          <div className="border-t border-gray-100 p-4 space-y-4">
            <InfoRow label="参加費">
              <span className="font-bold text-gray-900">{tournament.buy_in || "-"}</span>
            </InfoRow>
            
            <InfoRow label="リエントリー">
              <span className="font-medium">{tournament.reentry_fee || "-"}</span>
            </InfoRow>
            
            <InfoRow label="アドオン">
              <span className="font-medium">
                {(() => {
                  if (tournament.addon_status === "unavailable") return "なし";
                  if (tournament.addon_status === "available") {
                     const parts = [];
                     if (tournament.addon_fee) parts.push(tournament.addon_fee);
                     if (tournament.addon_stack) parts.push(tournament.addon_stack);
                     return parts.join(" / ") || "あり";
                  }
                  return "不明";
                })()}
              </span>
            </InfoRow>
            
            <InfoRow label="スタック">
              <span className="font-medium">{tournament.stack || "-"}</span>
            </InfoRow>
          </div>
        </div>

        {/* 備考 */}
        {tournament.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold">
              <Info className="w-5 h-5 text-orange-500" />
              <h2>備考</h2>
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {tournament.notes}
            </div>
          </div>
        )}

        {/* プライズ */}
        {tournament.prizes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2>プライズ</h2>
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {tournament.prizes}
            </div>
          </div>
        )}

        {/* 広告 */}
        {displayBannerAd && (
          <div className="pt-4">
            <AdBanner ad={displayBannerAd} />
          </div>
        )}
      </div>
    </main>
  );
}

function InfoRow({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="w-24 text-sm font-bold text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 text-sm text-gray-900 break-all">
        {children}
      </div>
    </div>
  );
}
