"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  ImageIcon,
  Loader2,
  ArrowLeft,
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
  created_at: string;
};

export default function PhotosAdminPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    is_published: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/admin/photos");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch (err) {
      console.error("Failed to fetch albums:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          title: "",
          description: "",
          event_date: "",
          is_published: false,
        });
        fetchAlbums();
      }
    } catch (err) {
      console.error("Failed to create album:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？写真もすべて削除されます。`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/photos/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error("Failed to delete album:", err);
    }
  };

  const handleTogglePublish = async (album: Album) => {
    try {
      const res = await fetch(`/api/admin/photos/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !album.is_published }),
      });
      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              プレイヤーズフォト管理
            </h1>
            <p className="text-sm text-gray-500">
              イベント写真のアルバムを管理
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規アルバム
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <h2 className="font-bold text-gray-900">新規アルバム作成</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="例: 第5回沖縄ポーカーフェスティバル"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="イベントの説明（任意）"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              イベント開催日 *
            </label>
            <input
              type="date"
              required
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <label htmlFor="is_published" className="text-sm text-gray-700">
              すぐに公開する
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              作成
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* アルバム一覧 */}
      {albums.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">まだアルバムがありません</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-orange-500 hover:text-orange-600"
          >
            最初のアルバムを作成する
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                {/* サムネイル */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {album.cover_image_url ? (
                    <Image
                      src={album.cover_image_url}
                      alt={album.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* 情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">
                      {album.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        album.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {album.is_published ? "公開中" : "非公開"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(album.event_date), "yyyy年M月d日", {
                        locale: ja,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {album.photo_count}枚
                    </span>
                  </div>
                </div>

                {/* アクション */}
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/photos/${album.id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-orange-500"
                    title="写真管理"
                  >
                    <Camera className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(album)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      album.is_published
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    }`}
                  >
                    {album.is_published ? (
                      <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" />非公開にする</span>
                    ) : (
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />公開する</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(album.id, album.title)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
