import { createClient } from "@/lib/supabase/server";
import { TournamentFilterList } from "@/components/tournament/TournamentFilterList";
import { AdBanner, Ad } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";
import { AdCardInfeed } from "@/components/ads/AdCardInfeed";
import { AdClickWrapper } from "@/components/ads/AdClickWrapper";
import { HeroSliderWrapper } from "@/components/HeroSliderWrapper";
import { Store, MapPin } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import ShopAccordion from "@/components/ShopAccordion";

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

  // 並列でデータ取得
  const [adsResponse, featuredResponse, tournamentsResponse, shopsResponse, upcomingTournamentsResponse] = await Promise.all([
    // 広告の取得
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false }),
    // ピックアップPRの取得
    supabase
      .from("featured_items")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5),
    // トーナメントの取得
    supabase
      .from("tournaments")
      .select(`
        *,
        shops (
          name,
          plan,
          image_url,
          area
        )
      `)
      .gte("start_at", startOfDay.toISOString())
      .lte("start_at", endOfDay.toISOString())
      .order("start_at", { ascending: true }),
    // 店舗一覧を取得
    supabase.from("shops").select("*").order("name"),
    // 店舗アコーディオン用: 今後のトーナメント
    supabase
      .from("tournaments")
      .select("id, title, start_at, buy_in, shop_id")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
  ]);

  const adsData = adsResponse.data;
  const featuredItems = featuredResponse.data;
  const tournaments = tournamentsResponse.data;
  const error = tournamentsResponse.error;
  const shops = shopsResponse.data;
  const upcomingTournaments = upcomingTournamentsResponse.data;

  const ads = (adsData || []) as Ad[];

  // --- 広告ロジック ---
  // 1. 期間フィルタ: start_at/end_at で有効期間内のものだけ表示
  const now = new Date();
  const activeAds = ads.filter(ad => {
    if (ad.start_at && new Date(ad.start_at) > now) return false;
    if (ad.end_at && new Date(ad.end_at) < now) return false;
    return true;
  });

  // 2. priority加重ランダム: priorityが高いほど選ばれやすい
  const weightedShuffle = <T extends { priority: number }>(array: T[]): T[] => {
    const weighted = array.map(item => ({
      item,
      weight: Math.random() * (item.priority + 1),
    }));
    weighted.sort((a, b) => b.weight - a.weight);
    return weighted.map(w => w.item);
  };

  // 3. タイプ別に分類
  const bannerAds = activeAds.filter(ad => ad.type === 'banner');
  const squareAds = activeAds.filter(ad => ad.type === 'square');
  const storyAds = activeAds.filter(ad => ad.type === 'story');
  const cardAds = activeAds.filter(ad => ad.type === 'card');
  const allShuffled = weightedShuffle(activeAds);

  // 4. 各枠に配分
  // ② カード型（トーナメントリスト内）
  const displayCardAd = cardAds.length > 0
    ? weightedShuffle(cardAds)[0]
    : allShuffled[0] || null;

  // ③④ スクエア上段（スクエア広告のみ）
  const usedIds = new Set([displayCardAd?.id].filter(Boolean));
  const remainingSquares1 = weightedShuffle(squareAds.filter(a => !usedIds.has(a.id)));
  const displaySquareAds1 = remainingSquares1.slice(0, 2);

  // ⑤⑥ スクエア中段
  const usedIds2 = new Set([...usedIds, ...displaySquareAds1.map(a => a.id)]);
  const displaySquareAds2 = weightedShuffle(squareAds.filter(a => !usedIds2.has(a.id))).slice(0, 2);

  // ⑦ バナー（店舗間）
  const usedIds3 = new Set([...usedIds2, ...displaySquareAds2.map(a => a.id)]);
  const bannerPool = weightedShuffle(bannerAds.length > 0 ? bannerAds : []);
  const displayMidBannerAd = bannerPool[0] || null;

  // ⑧⑨ スクエア下段
  const usedIds4 = new Set([...usedIds3, displayMidBannerAd?.id].filter(Boolean));
  const displaySquareAds3 = weightedShuffle(squareAds.filter(a => !usedIds4.has(a.id))).slice(0, 2);

  // ⑩ バナー（フッター上）
  const usedIds5 = new Set([...usedIds4, ...displaySquareAds3.map(a => a.id)]);
  const footerBannerPool = weightedShuffle(bannerAds.filter(a => !usedIds5.has(a.id)));
  const displayBottomBannerAd = footerBannerPool[0] || bannerPool[1] || bannerPool[0] || null;

  // ⑪⑫ スクエア最下部
  const usedIds6 = new Set([...usedIds5, displayBottomBannerAd?.id].filter(Boolean));
  const displaySquareAds4 = weightedShuffle(squareAds.filter(a => !usedIds6.has(a.id))).slice(0, 2);

  if (error) {
    console.error("Supabase error:", error);
  }

  // トーナメントをshop_idごとにマップ
  const tournamentsByShop = (upcomingTournaments || []).reduce((acc, t) => {
    if (!t.shop_id) return acc;
    if (!acc[t.shop_id]) acc[t.shop_id] = [];
    acc[t.shop_id].push(t);
    return acc;
  }, {} as Record<string, any[]>);

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
    <div className="min-h-screen">
      {/* ヒーロースライダー (トップ画像 + PR) */}
      <HeroSliderWrapper featuredItems={featuredItems || []} />

      {/* PC: 2カラム / スマホ: 1カラム */}
      <div className="max-w-6xl mx-auto md:flex md:gap-8 md:items-start md:px-4">

        {/* 左: メインコンテンツ */}
        <div className="md:flex-1 md:min-w-0">

          {/* OKIPOKAプレミアム バナー */}
          <div className="max-w-md md:max-w-none mx-auto px-4 md:px-0 py-4">
            <Link href="/premium">
              <Image
                src="/premium-banner1.png"
                alt="OKIPOKAプレミアム"
                width={1500}
                height={500}
                className="w-full h-auto"
              />
            </Link>
          </div>

          {/* トーナメントリスト（フィルター付き） */}
          <TournamentFilterList
            tournaments={(tournaments || []) as any}
            allShops={(shops || []).map((s: any) => ({ id: s.id, name: s.name, area: s.area || null, image_url: s.image_url || null }))}
            dateStr={targetDateStr}
            prevDateStr={prevDateStr}
            nextDateStr={nextDateStr}
            infeedAd={displayBottomBannerAd || displayMidBannerAd}
          />

          {/* スマホのみ: スクエア広告 */}
          <div className="md:hidden">
            {displaySquareAds1.length > 0 && <AdSquareGrid ads={displaySquareAds1} />}
          </div>

          {/* バナー広告（店舗一覧の上） */}
          {displayMidBannerAd && <AdBanner ad={displayMidBannerAd} />}

          {/* 店舗一覧セクション（前半: 那覇・中部） */}
          <div className="max-w-md md:max-w-none mx-auto px-4 md:px-0 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-black text-gray-900">店舗一覧</h2>
            </div>
            <div className="space-y-5">
              {areaOrder.slice(0, 2).map((area, idx) => {
                const areaShops = groupedShops[area];
                if (!areaShops || areaShops.length === 0) return null;
                return (
                  <div key={area}>
                    {/* 那覇と中部の間にスクエア広告2つ */}
                    {idx === 1 && displaySquareAds1.length > 0 && <AdSquareGrid ads={displaySquareAds1} />}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-orange-500" />
                      <h3 className="text-sm font-bold text-gray-600">{area}</h3>
                    </div>
                    <ShopAccordion shops={areaShops.map((shop: any) => ({ ...shop, tournaments: tournamentsByShop[shop.id] || [] }))} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* スマホのみ: バナー広告 */}
          <div className="md:hidden">
            {displayMidBannerAd && <AdBanner ad={displayMidBannerAd} />}
          </div>

          {/* 店舗一覧セクション（後半: 南部・北部・宮古島） */}
          <div className="max-w-md md:max-w-none mx-auto px-4 md:px-0 mb-8">
            <div className="space-y-5">
              {areaOrder.slice(2).map((area) => {
                const areaShops = groupedShops[area];
                if (!areaShops || areaShops.length === 0) return null;
                return (
                  <div key={area}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-orange-500" />
                      <h3 className="text-sm font-bold text-gray-600">{area}</h3>
                    </div>
                    <ShopAccordion shops={areaShops.map((shop: any) => ({ ...shop, tournaments: tournamentsByShop[shop.id] || [] }))} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* スマホのみ: 下部広告 */}
          <div className="md:hidden">
            {displaySquareAds3.length > 0 && <AdSquareGrid ads={displaySquareAds3} />}
            {displayBottomBannerAd && <AdBanner ad={displayBottomBannerAd} />}
            {displaySquareAds4.length > 0 && <AdSquareGrid ads={displaySquareAds4} />}
          </div>

          {/* PC: バナー広告はメインコンテンツ内に全幅で表示 */}
          <div className="hidden md:block px-4 md:px-0 space-y-4 mb-8">
            {displayMidBannerAd && <AdBanner ad={displayMidBannerAd} />}
            {displayBottomBannerAd && <AdBanner ad={displayBottomBannerAd} />}
          </div>

        </div>

        {/* 右: 広告サイドバー（PCのみ・スクエア広告のみ） */}
        <div className="hidden md:block md:w-72 md:shrink-0 mt-6 space-y-4">
          <div className="text-[10px] text-gray-400">広告</div>
          {squareAds.slice(0, 6).map((ad: any) => (
            <AdClickWrapper key={ad.id} ad={ad} className="block group">
              <div className="relative w-full aspect-square overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                <Image
                  src={ad.image_url}
                  alt={ad.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pt-8 pb-2 px-2">
                  <p className="text-xs font-bold text-white leading-tight line-clamp-2">{ad.title}</p>
                  {ad.description && (
                    <p className="text-[10px] text-white/70 leading-tight line-clamp-1 mt-0.5">{ad.description}</p>
                  )}
                </div>
              </div>
            </AdClickWrapper>
          ))}
        </div>

      </div>
    </div>
  );
}
