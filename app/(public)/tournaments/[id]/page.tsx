import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CalendarDays,
  MapPin,
  Users,
  Layers,
  Info,
  Trophy,
  CreditCard,
  RefreshCw,
  Plus,
  ChevronRight,
  ExternalLink,
  Phone,
  Globe,
  Instagram,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Ad } from "@/components/ads/AdBanner";
import { AdClickWrapper } from "@/components/ads/AdClickWrapper";
import { TournamentStatus } from "@/components/tournament/TournamentStatus";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // 並列でデータ取得
  const [adsResponse, tournamentResponse] = await Promise.all([
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true),
    supabase
      .from("tournaments")
      .select(`
        *,
        shops (
          *
        )
      `)
      .eq("id", id)
      .single()
  ]);

  const adsData = adsResponse.data;
  const tournament = tournamentResponse.data;
  const error = tournamentResponse.error;

  const ads = (adsData || []) as Ad[];
  const squareAds = ads.filter(ad => ad.type === 'square');

  // スクエア広告: ランダムに1つ
  const displaySquareAd = squareAds.length > 0
    ? squareAds[Math.floor(Math.random() * squareAds.length)]
    : null;

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

  const jstDateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const jstTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateStr = jstDateFormatter.format(startDate);
  const startTimeStr = jstTimeFormatter.format(startDate);

  let lateRegStr: string | null = null;
  if (tournament.late_reg_at) {
    lateRegStr = jstTimeFormatter.format(new Date(tournament.late_reg_at));
  }

  // アドオン表示テキスト
  const addonText = (() => {
    if (tournament.addon_status === "unavailable") return "なし";
    if (tournament.addon_status === "available") {
      const parts = [];
      if (tournament.addon_fee) parts.push(tournament.addon_fee);
      if (tournament.addon_stack) parts.push(tournament.addon_stack);
      return parts.join(" / ") || "あり";
    }
    return "不明";
  })();

  const shop = tournament.shops;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* ヒーローセクション */}
      <div className="relative bg-gray-900">
        {/* 店舗画像の背景 */}
        {shop?.image_url && (
          <Image
            src={shop.image_url}
            alt=""
            fill
            className="object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/60 to-gray-900" />

        <div className="relative max-w-5xl mx-auto px-4">
          {/* ナビゲーション */}
          <div className="flex items-center justify-between h-14 pt-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Link>
          </div>

          {/* タイトルエリア */}
          <div className="pb-6 pt-2 md:pb-8 md:pt-4">
            {/* タイプバッジ */}
            <span className="inline-block text-xs font-bold tracking-wide text-orange-400 bg-orange-500/15 px-2.5 py-1 mb-3">
              {tournament.type || "トーナメント"}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
              {tournament.title}
            </h1>

            {/* 日付・時間のサマリー */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {startTimeStr}開始
              </span>
              <TournamentStatus startAt={tournament.start_at} lateRegAt={tournament.late_reg_at} className="text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* PC: 2カラム / モバイル: 1カラム */}
      <div className="max-w-5xl mx-auto px-4 -mt-3 md:flex md:gap-6 md:items-start">

        {/* 左カラム: メイン情報 */}
        <div className="md:flex-1 md:min-w-0 space-y-4">
          {/* 店舗カード */}
          <Link
            href={`/shops#shop-${shop.id}`}
            className="flex items-center gap-3 bg-white shadow-sm border border-gray-100 p-3.5 group hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 bg-gray-100 overflow-hidden shrink-0">
              {shop?.image_url ? (
                <Image
                  src={shop.image_url}
                  alt={shop.name}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-orange-500 transition-colors">{shop.name}</p>
              {shop.area && <p className="text-xs text-gray-400">{shop.area}</p>}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
          </Link>

          {/* メイン情報グリッド */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            {/* 参加費ハイライト */}
            <div className="bg-linear-to-r from-orange-500 to-orange-400 px-5 py-4">
              <p className="text-xs font-medium text-orange-100 mb-0.5">参加費</p>
              <p className="text-2xl font-black text-white tracking-tight">
                {tournament.buy_in || "無料"}
              </p>
            </div>

            {/* 詳細グリッド */}
            <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-gray-100">
              <DetailCell
                icon={<Clock className="w-4 h-4 text-orange-500" />}
                label="開始"
                value={startTimeStr}
              />
              <DetailCell
                icon={<Users className="w-4 h-4 text-orange-500" />}
                label="レイトレジ"
                value={lateRegStr || "-"}
              />
              <DetailCell
                icon={<CreditCard className="w-4 h-4 text-orange-500" />}
                label="種類"
                value={tournament.type || "トーナメント"}
                className="hidden md:block"
              />
            </div>
            <div className="border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 divide-x divide-gray-100">
              <DetailCell
                icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
                label="リエントリー"
                value={tournament.reentry_fee || "-"}
              />
              <DetailCell
                icon={<Layers className="w-4 h-4 text-orange-500" />}
                label="スタック"
                value={tournament.stack || "-"}
              />
              <DetailCell
                icon={<Plus className="w-4 h-4 text-orange-500" />}
                label="アドオン"
                value={addonText}
                className="hidden md:block"
              />
            </div>
            {/* モバイルのみ: 3行目 */}
            <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100 md:hidden">
              <DetailCell
                icon={<Plus className="w-4 h-4 text-orange-500" />}
                label="アドオン"
                value={addonText}
              />
              <DetailCell
                icon={<CreditCard className="w-4 h-4 text-orange-500" />}
                label="種類"
                value={tournament.type || "トーナメント"}
              />
            </div>
          </div>

          {/* プライズ */}
          {tournament.prizes && (
            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <div className="w-7 h-7 bg-yellow-50 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">プライズ</h2>
              </div>
              <div className="px-5 py-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {tournament.prizes}
              </div>
            </div>
          )}

          {/* 備考 */}
          {tournament.notes && (
            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <div className="w-7 h-7 bg-blue-50 flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">備考</h2>
              </div>
              <div className="px-5 py-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {tournament.notes}
              </div>
            </div>
          )}

          {/* モバイルのみ: 広告 */}
          {displaySquareAd && (
            <div className="pt-2 md:hidden">
              <div className="text-[10px] text-gray-400 mb-1">広告</div>
              <AdClickWrapper ad={displaySquareAd} className="block group">
                <div className="relative w-full aspect-square overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={displaySquareAd.image_url}
                    alt={displaySquareAd.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </AdClickWrapper>
            </div>
          )}
        </div>

        {/* 右カラム: サイドバー（PCのみ） */}
        <div className="hidden md:block md:w-72 md:shrink-0 space-y-4 mt-4">
          {/* 広告 */}
          {displaySquareAd && (
            <div>
              <div className="text-[10px] text-gray-400 mb-1">広告</div>
              <AdClickWrapper ad={displaySquareAd} className="block group">
                <div className="relative w-full aspect-square overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={displaySquareAd.image_url}
                    alt={displaySquareAd.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </AdClickWrapper>
            </div>
          )}

          {/* 店舗情報（サイドバー版） */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500">店舗情報</p>
            </div>

            {/* 店舗ヘッダー */}
            <Link href={`/shops#shop-${shop.id}`} className="block p-4 group hover:bg-gray-50 transition-colors border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 overflow-hidden shrink-0">
                  {shop?.image_url ? (
                    <Image
                      src={shop.image_url}
                      alt={shop.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors">{shop.name}</p>
                  {shop.area && <p className="text-xs text-gray-400 mt-0.5">{shop.area}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
              </div>
            </Link>

            {/* 詳細情報 */}
            <div className="px-4 py-3 space-y-3 text-sm">
              {shop.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-600 leading-snug">{shop.address}</span>
                </div>
              )}
              {shop.opening_hours && (
                <div className="flex items-start gap-2.5">
                  <Clock3 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-600 leading-snug">{shop.opening_hours}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <a href={`tel:${shop.phone}`} className="text-gray-600 hover:text-orange-500 transition-colors">{shop.phone}</a>
                </div>
              )}
            </div>

            {/* リンク */}
            {(shop.google_map_url || shop.website_url || shop.instagram_url) && (
              <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
                {shop.google_map_url && (
                  <a
                    href={shop.google_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-orange-500 bg-gray-50 px-3 py-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    地図
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {shop.website_url && (
                  <a
                    href={shop.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-orange-500 bg-gray-50 px-3 py-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Web
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {shop.instagram_url && (
                  <a
                    href={shop.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-orange-500 bg-gray-50 px-3 py-1.5 transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    Instagram
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

function DetailCell({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`px-5 py-3.5 ${className || ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}
