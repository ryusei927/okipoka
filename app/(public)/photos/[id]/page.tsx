import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Camera, Calendar, ArrowLeft, Images } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { AdBanner, Ad } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("photo_albums")
    .select("title, description")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!album) {
    return { title: "アルバムが見つかりません | おきぽか" };
  }

  return {
    title: `${album.title} | プレイヤーズフォト | おきぽか`,
    description:
      album.description || `${album.title}のフォトギャラリー`,
  };
}

export default async function PhotoAlbumPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [albumRes, photosRes, adsRes] = await Promise.all([
    supabase
      .from("photo_albums")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single(),
    supabase
      .from("photo_album_photos")
      .select("id, image_url, caption, sort_order")
      .eq("album_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false }),
  ]);

  if (albumRes.error || !albumRes.data) {
    notFound();
  }

  const album = albumRes.data;
  const photos = photosRes.data || [];

  // 広告ロジック
  const now = new Date();
  const activeAds = ((adsRes.data || []) as Ad[]).filter(ad => {
    if (ad.start_at && new Date(ad.start_at) > now) return false;
    if (ad.end_at && new Date(ad.end_at) < now) return false;
    return true;
  });

  const bannerAds = activeAds.filter(ad => ad.type === "banner");
  const squareAds = activeAds.filter(ad => ad.type === "square");
  const bannerAd = bannerAds.length > 0
    ? bannerAds.sort(() => Math.random() - 0.5)[0]
    : null;
  const displaySquareAds = squareAds.sort(() => Math.random() - 0.5).slice(0, 2);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-md md:max-w-4xl mx-auto px-4 py-4">
          {/* 戻るリンク */}
          <Link
            href="/photos"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-orange-500 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            フォト一覧
          </Link>

          <h1 className="text-xl font-black text-gray-900">{album.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(album.event_date), "yyyy年M月d日", {
                locale: ja,
              })}
            </span>
            <span className="flex items-center gap-1">
              <Images className="w-3.5 h-3.5" />
              {photos.length}枚
            </span>
          </div>
          {album.description && (
            <p className="text-sm text-gray-500 mt-2">{album.description}</p>
          )}
        </div>
      </div>

      {/* フォトギャラリー */}
      <div className="max-w-md md:max-w-4xl mx-auto px-4 py-6">
        {photos.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">
              まだ写真がアップロードされていません
            </p>
          </div>
        ) : (
          <PhotoGallery
            photos={photos.map((p) => ({
              id: p.id,
              image_url: p.image_url,
              caption: p.caption,
            }))}
            albumTitle={album.title}
          />
        )}

        {/* スクエア広告 */}
        {displaySquareAds.length > 0 && <AdSquareGrid ads={displaySquareAds} />}

        {/* バナー広告 */}
        {bannerAd && <AdBanner ad={bannerAd} />}
      </div>
    </main>
  );
}
