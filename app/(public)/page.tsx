import { createClient } from "@/lib/supabase/server";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { AdBanner, Ad } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";
import { FaqSection } from "@/components/FaqSection";
import { HeroSlider } from "@/components/HeroSlider";
import { ChatBot } from "@/components/ChatBot";
import { Calendar, ChevronLeft, ChevronRight, Store, MapPin } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const { date } = await searchParams;
  
  // 1. 基準となる営業日(JST)を決定する
  let targetDateStr = date;
  
  if (!targetDateStr) {
    const now = new Date();
    // UTC時間に9時間足してJST時間をシミュレート
    const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    
    // JSTで0時〜10時の間なら、営業日は「前日」
    if (jstTime.getUTCHours() < 10) {
      jstTime.setUTCDate(jstTime.getUTCDate() - 1);
    }
    
    // YYYY-MM-DD 形式を取得
    const y = jstTime.getUTCFullYear();
    const m = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jstTime.getUTCDate()).padStart(2, '0');
    targetDateStr = `${y}-${m}-${d}`;
  }

  // 2. 検索範囲を決定 (JST 10:00 〜 翌 JST 10:00)
  // ISO文字列でタイムゾーン(+09:00)を指定してDateオブジェクトを作ることで、正確なUTC時刻に変換する
  const startOfDay = new Date(`${targetDateStr}T10:00:00+09:00`);
  const endOfDay = new Date(`${targetDateStr}T10:00:00+09:00`);
  endOfDay.setDate(endOfDay.getDate() + 1); // 翌日の同時刻

  // 前日・翌日のリンク用日付
  // targetDateStr自体は "YYYY-MM-DD" なので、そのままDateにするとUTC 00:00扱いになるが、
  // 日付の加減算用としては問題ない
  const targetDate = new Date(targetDateStr);
  const prevDate = subDays(targetDate, 1);
  const nextDate = addDays(targetDate, 1);
  
  const prevDateStr = format(prevDate, "yyyy-MM-dd");
  const nextDateStr = format(nextDate, "yyyy-MM-dd");

  // 広告の取得
  const { data: adsData } = await supabase
    .from("ads")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  const ads = (adsData || []) as Ad[];
  const bannerAds = ads.filter(ad => ad.type === 'banner');
  const squareAds = ads.filter(ad => ad.type === 'square');

  // シャッフル関数
  const shuffle = <T,>(array: T[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // バナー広告: 全ての中からランダムに1つ（優先度無視）
  let displayBannerAd = null;
  if (bannerAds.length > 0) {
    displayBannerAd = bannerAds[Math.floor(Math.random() * bannerAds.length)];
  }

  // スクエア広告: 全ての中からランダムに2つ（優先度無視）
  const displaySquareAds = shuffle(squareAds).slice(0, 2);

  // ピックアップPRの取得
  const { data: featuredItems } = await supabase
    .from("featured_items")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      shops (
        name,
        plan,
        image_url
      )
    `)
    .gte("start_at", startOfDay.toISOString())
    .lte("start_at", endOfDay.toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
  }

  // 店舗一覧を取得
  const { data: shops } = await supabase.from("shops").select("*").order("name");

  // エリアごとにグループ化
  const groupedShops = (shops || []).reduce((acc, shop) => {
    const area = shop.area || "その他";
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(shop);
    return acc;
  }, {} as Record<string, typeof shops>);

  // 表示順序の定義
  const areaOrder = ["那覇", "中部", "南部", "北部", "宮古島", "その他"];

  return (
    <div className="min-h-screen pb-20">
      {/* ヒーロースライダー (トップ画像 + PR) */}
      <HeroSlider featuredItems={featuredItems || []} />

      {/* バナー広告 */}
      {displayBannerAd && <AdBanner ad={displayBannerAd} />}

      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md md:max-w-4xl mx-auto px-4 py-4 flex items-center justify-center relative">
          <h1 className="text-xl font-bold text-gray-900">トーナメント情報</h1>
        </div>
        
        {/* 日付選択バー */}
        <div className="border-t border-gray-100 overflow-x-auto">
          <div className="max-w-md md:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href={`/?date=${prevDateStr}`} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </Link>
            
            <div className="flex items-center gap-2 font-bold text-lg">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span>
                {new Intl.DateTimeFormat("ja-JP", {
                  timeZone: "Asia/Tokyo",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(targetDate).replace(/\//g, "/")}
              </span>
            </div>

            <Link href={`/?date=${nextDateStr}`} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* コンテンツエリア */}
      <div className="max-w-md md:max-w-4xl mx-auto px-4 py-6 space-y-4">
        {tournaments && tournaments.length > 0 ? (
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              id={tournament.id}
              title={tournament.title}
              startAt={tournament.start_at}
              lateRegAt={tournament.late_reg_at}
              // @ts-ignore: Supabaseの型定義と結合時の型推論が複雑なため一旦無視
              shopName={tournament.shops?.name || "Unknown Shop"}
              // @ts-ignore
              shopImageUrl={tournament.shops?.image_url}
              buyIn={tournament.buy_in || "-"}
              tags={tournament.tags || []}
              // @ts-ignore
              isPremium={tournament.shops?.plan === "premium" || tournament.shops?.plan === "business"}
            />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>本日のトーナメントはありません</p>
          </div>
        )}
      </div>

      {/* プレミアム会員バナー */}
      <div className="max-w-md md:max-w-4xl mx-auto px-4 mt-6 mb-8">
        <Link href="/premium" className="block relative rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow group">
          <Image
            src="/premium-banner1.png"
            alt="おきぽかプレミアム"
            width={1024}
            height={643}
            className="w-full h-auto"
          />
        </Link>
      </div>

      {/* スクエア広告 */}
      {displaySquareAds.length > 0 && <AdSquareGrid ads={displaySquareAds} />}

      {/* 店舗一覧セクション */}
      <div className="max-w-md md:max-w-4xl mx-auto px-4 py-8 border-t border-gray-100">
        <h2 className="text-xl font-bold text-center mb-8 text-gray-900">店舗一覧</h2>
        <div className="space-y-8">
          {areaOrder.map((area) => {
            const areaShops = groupedShops[area];
            if (!areaShops || areaShops.length === 0) return null;

            return (
              <div key={area}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-gray-700">{area}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {areaShops.map((shop: any) => (
                    <Link
                      key={shop.id}
                      href={`/shops/${shop.id}`}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center border border-gray-100">
                        {shop.image_url ? (
                          <Image
                            src={shop.image_url}
                            alt={shop.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{shop.name}</h4>
                        {shop.address && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 truncate">
                            <MapPin className="w-3 h-3" />
                            <span>{shop.address}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* よくある質問 */}
      <FaqSection />
    </div>
  );
}
