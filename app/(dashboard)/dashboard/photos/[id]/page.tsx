"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  Camera,
  CheckSquare,
  Square,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Album = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string;
  is_published: boolean;
  photo_count: number;
};

type Photo = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export default function PhotoAlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/photos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAlbum(data.album);
        setPhotos(data.photos);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    const failedFiles: { name: string; reason: string }[] = [];

    try {
      // 1枚ずつアップロード（サイズ制限回避）
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`${i + 1} / ${files.length} 枚をアップロード中...`);

        const formData = new FormData();
        formData.append("files", files[i]);

        try {
          const res = await fetch(`/api/admin/photos/${id}/upload`, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const result = await res.json();
            successCount += result.uploaded;
            if (result.failed > 0) {
              failedFiles.push(...result.failedFiles);
            }
          } else {
            failedFiles.push({ name: files[i].name, reason: "アップロードに失敗" });
          }
        } catch {
          failedFiles.push({ name: files[i].name, reason: "通信エラー" });
        }
      }

      let msg = `${successCount}枚の写真をアップロードしました`;
      if (failedFiles.length > 0) {
        msg += `\n\n⚠️ ${failedFiles.length}枚が失敗しました:\n`;
        msg += failedFiles
          .map((f) => `・${f.name}: ${f.reason}`)
          .join("\n");
      }
      alert(msg);
      fetchData();
    } catch (err) {
      console.error("Upload error:", err);
      alert("アップロードに失敗しました");
    } finally {
      setUploading(false);
      setUploadProgress("");
      // inputをリセット
      e.target.value = "";
    }
  };

  const toggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(`${selectedIds.size}枚の写真を削除しますか？`)
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/photos/${id}/upload`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchData();
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSetCover = async (imageUrl: string) => {
    try {
      await fetch(`/api/admin/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image_url: imageUrl }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to set cover:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">アルバムが見つかりません</p>
        <Link
          href="/dashboard/photos"
          className="mt-4 text-sm text-orange-500 hover:text-orange-600"
        >
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <Link
          href="/dashboard/photos"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          アルバム一覧に戻る
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(album.event_date), "yyyy年M月d日", {
                locale: ja,
              })}
              {" ・ "}
              {photos.length}枚
              {" ・ "}
              <span
                className={
                  album.is_published ? "text-green-600" : "text-gray-400"
                }
              >
                {album.is_published ? "公開中" : "非公開"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* アクションバー */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? (uploadProgress || "アップロード中...") : "写真をアップロード"}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {photos.length > 0 && (
          <>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              {selectedIds.size === photos.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === photos.length ? "全選択解除" : "全選択"}
            </button>

            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {selectedIds.size}枚を削除
              </button>
            )}
          </>
        )}
      </div>

      {/* 写真グリッド */}
      {photos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">まだ写真がありません</p>
          <p className="text-sm text-gray-400 mt-1">
            上の「写真をアップロード」ボタンから写真を追加してください
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              <Image
                src={photo.image_url}
                alt={photo.caption || ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* オーバーレイ */}
              <div
                className={`absolute inset-0 transition-colors ${
                  selectedIds.has(photo.id)
                    ? "bg-orange-500/30"
                    : "bg-black/0 group-hover:bg-black/20"
                }`}
              >
                {/* 選択チェック */}
                <button
                  onClick={() => toggleSelect(photo.id)}
                  className="absolute top-2 left-2 p-1"
                >
                  {selectedIds.has(photo.id) ? (
                    <CheckSquare className="w-5 h-5 text-orange-500 drop-shadow-md" />
                  ) : (
                    <Square className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  )}
                </button>

                {/* カバー設定 */}
                <button
                  onClick={() => handleSetCover(photo.image_url)}
                  className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="カバー画像に設定"
                >
                  <ImageIcon className="w-4 h-4 text-white drop-shadow-md" />
                </button>
              </div>

              {/* カバー画像バッジ */}
              {album.cover_image_url === photo.image_url && (
                <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  カバー
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
