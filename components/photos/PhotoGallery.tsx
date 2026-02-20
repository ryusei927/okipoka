"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  ZoomIn,
} from "lucide-react";

type Photo = {
  id: string;
  image_url: string;
  caption: string | null;
};

type PhotoGalleryProps = {
  photos: Photo[];
  albumTitle: string;
};

export function PhotoGallery({ photos, albumTitle }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  // キーボードナビゲーション
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, goNext, goPrev]);

  // ダウンロード
  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `okipoka-photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // フォールバック: 新しいタブで開く
      window.open(photo.image_url, "_blank");
    }
  };

  // SNSシェア
  const handleShare = async (photo: Photo) => {
    const shareData = {
      title: albumTitle,
      text: photo.caption
        ? `${albumTitle} - ${photo.caption}`
        : `${albumTitle} | おきぽか プレイヤーズフォト`,
      url: photo.image_url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // ユーザーがキャンセルした場合
      }
    } else {
      // Web Share APIが使えない場合、URLをコピー
      try {
        await navigator.clipboard.writeText(photo.image_url);
        alert("画像URLをコピーしました");
      } catch {
        // 何もしない
      }
    }
  };

  return (
    <>
      {/* グリッド表示 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption || `写真 ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* ライトボックス */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-9999 bg-black/95 flex flex-col"
          onClick={closeLightbox}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm opacity-75">
              {lightboxIndex + 1} / {photos.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(photos[lightboxIndex]);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="ダウンロード"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(photos[lightboxIndex]);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="シェア"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* メイン画像 */}
          <div
            className="flex-1 flex items-center justify-center relative px-12"
            onClick={closeLightbox}
          >
            {/* 前へボタン */}
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            <div
              className="relative w-full h-full max-w-4xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[lightboxIndex].image_url}
                alt={
                  photos[lightboxIndex].caption ||
                  `写真 ${lightboxIndex + 1}`
                }
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* 次へボタン */}
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* キャプション */}
          {photos[lightboxIndex].caption && (
            <div className="p-4 text-center text-white text-sm opacity-75">
              {photos[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}
