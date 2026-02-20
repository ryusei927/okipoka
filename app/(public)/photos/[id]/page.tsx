import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Camera, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PhotoGallery } from "@/components/photos/PhotoGallery";

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

  const [albumRes, photosRes] = await Promise.all([
    supabase
      .from("photo_albums")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single(),
    supabase
      .from("photo_album_photos")
      .select("*")
      .eq("album_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (albumRes.error || !albumRes.data) {
    notFound();
  }

  const album = albumRes.data;
  const photos = photosRes.data || [];

  return (
    <main className="max-w-md md:max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* 戻るリンク */}
      <Link
        href="/photos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        フォト一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{album.title}</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(album.event_date), "yyyy年M月d日", {
                locale: ja,
              })}
              <span className="ml-2">📷 {photos.length}枚</span>
            </div>
          </div>
        </div>
        {album.description && (
          <p className="text-sm text-gray-600 mt-2">{album.description}</p>
        )}
      </div>

      {/* フォトギャラリー */}
      {photos.length === 0 ? (
        <div className="text-center py-20">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
    </main>
  );
}
