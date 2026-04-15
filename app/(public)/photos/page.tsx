import { createClient } from "@/lib/supabase/server";
import { Camera, Calendar, ImageIcon, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { AdBanner, Ad } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "プレイヤーズフォト | おきぽか",
  description:
    "沖縄のポーカートーナメントイベントで撮影されたプレイヤーズフォトギャラリー",
};

export default async function PhotosPage() {
  const supabase = await createClient();

  const [albumsRes, adsRes] = await Promise.all([
    supabase
      .from("photo_albums")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false }),
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false }),
  ]);

  const albums = albumsRes.data;
  const totalPhotos = (albums || []).reduce((sum, a) => sum + (a.photo_count || 0), 0);

  // 広告ロジック
  const now = new Date();
  const activeAds = ((adsRes.data || []) as Ad[]).filter(ad => {
    if (ad.start_at && new Date(ad.start_at) > now) return false;
    if (ad.end_at && new Date(ad.end_at) < now) return false;
    return true;
  });

  const bannerAds = activeAds.filter(ad => ad.type === "banner");
  const squareAds = activeAds.filter(ad => ad.type === "square");

  const weightedPick = <T extends { priority: number }>(arr: T[]): T | null => {
    if (arr.length === 0) return null;
    const weighted = arr.map(item => ({ item, weight: Math.random() * (item.priority + 1) }));
    weighted.sort((a, b) => b.weight - a.weight);
    return weighted[0].item;
  };

  const topBannerAd = weightedPick(bannerAds);
  const bottomBannerAd = weightedPick(bannerAds.filter(a => a.id !== topBannerAd?.id)) || topBannerAd;
  const squareAdsTop = squareAds.sort(() => Math.random() - 0.5).slice(0, 2);
  const squareAdsBottom = squareAds.filter(a => !squareAdsTop.find(s => s.id === a.id)).sort(() => Math.random() - 0.5).slice(0, 2);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヒーローバナー - フルワイド */}
      <div className="relative overflow-hidden">
        <Image
          src="/prayersphoto.png"
          alt="プレイヤーズフォト"
          width={1024}
          height={367}
          className="w-full h-auto"
          priority
        />
        {/* 下部グラデーション */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-gray-50 to-transparent" />
      </div>

      <div className="max-w-md md:max-w-4xl mx-auto px-4 pb-12">
        {/* 統計バー */}
        {albums && albums.length > 0 && (
          <div className="flex items-center gap-6 py-4 mb-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Images className="w-4 h-4 text-orange-500" />
              <span><span className="font-bold text-gray-900">{albums.length}</span> アルバム</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-500" />
              <span><span className="font-bold text-gray-900">{totalPhotos.toLocaleString()}</span> 枚</span>
            </div>
          </div>
        )}

        {/* バナー広告（上部） */}
        {topBannerAd && <AdBanner ad={topBannerAd} />}

        {/* アルバム一覧 */}
        {!albums || albums.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">
              まだフォトアルバムがありません
            </p>
          </div>
        ) : (
          <>
            {/* 上半分のアルバム */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {albums.slice(0, 6).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>

            {/* スクエア広告（中間） */}
            {albums.length > 4 && squareAdsTop.length > 0 && (
              <AdSquareGrid ads={squareAdsTop} />
            )}

            {/* 下半分のアルバム */}
            {albums.length > 6 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {albums.slice(6).map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}
          </>
        )}

        {/* スクエア広告（下部） - 2つ揃っている場合のみ表示 */}
        {squareAdsBottom.length >= 2 && <AdSquareGrid ads={squareAdsBottom} />}

        {/* バナー広告（下部） */}
        {bottomBannerAd && <AdBanner ad={bottomBannerAd} />}
      </div>
    </main>
  );
}

function AlbumCard({ album }: { album: any }) {
  return (
    <Link
      href={`/photos/${album.id}`}
      className="group block overflow-hidden"
    >
      <div className="relative aspect-3/4 bg-gray-200 overflow-hidden">
        {album.cover_image_url ? (
          <Image
            src={album.cover_image_url}
            alt={album.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Camera className="w-10 h-10 text-gray-300" />
          </div>
        )}

        {/* 写真枚数バッジ - 右上 */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {album.photo_count}
        </div>

        {/* 下部グラデーション + テキスト */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-3">
          <h2 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-orange-300 transition-colors">
            {album.title}
          </h2>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-white/70">
            <Calendar className="w-3 h-3" />
            {format(new Date(album.event_date), "M月d日", {
              locale: ja,
            })}
            {album.description && (
              <>
                <span className="mx-1">·</span>
                <span className="line-clamp-1">{album.description}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
