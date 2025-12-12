"use client";

import { upsertAd, type AdState } from "./actions";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useActionState, useState } from "react";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 transition-colors disabled:opacity-50"
    >
      <Save className="w-5 h-5" />
      {pending ? "保存中..." : "保存する"}
    </button>
  );
}

const initialState: AdState = {
  message: "",
  error: "",
};

export default function AdForm({ ad }: { ad?: any }) {
  const [state, formAction] = useActionState(upsertAd, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(ad?.image_url || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <form action={formAction} className="space-y-8 pb-20">
      <input type="hidden" name="id" value={ad?.id || ""} />
      <input type="hidden" name="currentImageUrl" value={ad?.image_url || ""} />

      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ads" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {ad ? "広告を編集" : "広告を作成"}
        </h1>
      </div>

      {state.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* タイトル */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            defaultValue={ad?.title}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: 夏のキャンペーン"
          />
        </div>

        {/* タイプ */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            広告タイプ <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            defaultValue={ad?.type || "banner"}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
          >
            <option value="banner">バナー (横長)</option>
            <option value="square">スクエア (正方形)</option>
          </select>
        </div>

        {/* 画像 */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            画像 <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors relative">
            {previewUrl ? (
              <div className="relative w-full aspect-video max-w-md">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">クリックして画像をアップロード</span>
              </div>
            )}
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required={!ad?.image_url}
            />
          </div>
          <p className="text-xs text-gray-500">
            推奨サイズ: バナー(1200x300), スクエア(600x600)
          </p>
        </div>

        {/* リンクURL */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            リンクURL
          </label>
          <input
            type="url"
            name="linkUrl"
            defaultValue={ad?.link_url}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="https://..."
          />
        </div>

        {/* ステータス */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            defaultChecked={ad?.is_active ?? true}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
          />
          <label htmlFor="isActive" className="font-bold text-gray-700 cursor-pointer">
            有効にする
          </label>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
