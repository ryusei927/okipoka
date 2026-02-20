import { createClient } from "@/lib/supabase/server";
import { Camera, Calendar, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "プレイヤーズフォト | おきぽか",
  description:
    "沖縄のポーカートーナメントイベントで撮影されたプレイヤーズフォトギャラリー",
};

export default async function PhotosPage() {
  const supabase = await createClient();

  const { data: albums } = await supabase
    .from("photo_albums")
    .select("*")
    .eq("is_published", true)
    .order("event_date", { ascending: false });

  return (
    <main className="max-w-md md:max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* ヘッダーバナー */}
      <div className="mb-6 rounded-2xl overflow-hidden shadow-md">
        <Image
          src="/prayersphoto.png"
          alt="プレイヤーズフォト"
          width={1024}
          height={367}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* アルバム一覧 */}
      {!albums || albums.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            まだフォトアルバムがありません
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/photos/${album.id}`}
              className="group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* カバー画像 */}
              <div className="relative aspect-[16/9] bg-gray-100">
                {album.cover_image_url ? (
                  <Image
                    src={album.cover_image_url}
                    alt={album.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                {/* 写真枚数バッジ */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {album.photo_count}枚
                </div>
              </div>

              {/* アルバム情報 */}
              <div className="p-4">
                <h2 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-1">
                  {album.title}
                </h2>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(album.event_date), "yyyy年M月d日", {
                    locale: ja,
                  })}
                </div>
                {album.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {album.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
