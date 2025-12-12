"use client";

import { upsertShop, deleteShop } from "./actions";
import { ArrowLeft, Save, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 transition-colors disabled:opacity-50"
    >
      <Save className="w-5 h-5" />
      {pending ? "保存中..." : "店舗情報を保存"}
    </button>
  );
}

export default function ShopForm({ shop }: { shop?: any }) {
  const [imageUrl, setImageUrl] = useState<string>(shop?.image_url || "");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('shop-images').getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`画像のアップロードに失敗しました: ${error.message || '不明なエラー'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pb-20">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/shops" className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {shop ? "店舗情報の編集" : "新規店舗登録"}
        </h1>
      </header>

      <form action={upsertShop} className="space-y-6">
        {shop && <input type="hidden" name="id" value={shop.id} />}
        <input type="hidden" name="imageUrl" value={imageUrl} />

        {/* 画像アップロード */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-2">
          <label className="block text-sm font-bold text-gray-700">店舗ロゴ画像</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-200">
              {imageUrl ? (
                <Image src={imageUrl} alt="Preview" fill className="object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "アップロード中..." : "画像を選択"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">推奨サイズ: 正方形 (500x500px)</p>
            </div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">店舗名</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={shop?.name}
              placeholder="例：OKIPOKA CASINO"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">店舗ID (URL用)</label>
            <input
              type="text"
              name="slug"
              required
              defaultValue={shop?.slug}
              placeholder="例：okipoka-casino"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <p className="text-xs text-gray-500">※半角英数字のみ。URLの一部になります。</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">エリア</label>
            <select
              name="area"
              defaultValue={shop?.area || "那覇"}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="那覇">那覇</option>
              <option value="中部">中部</option>
              <option value="南部">南部</option>
              <option value="北部">北部</option>
              <option value="宮古島">宮古島</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">住所</label>
            <input
              type="text"
              name="address"
              defaultValue={shop?.address}
              placeholder="例：沖縄県那覇市..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">営業時間</label>
            <input
              type="text"
              name="openingHours"
              defaultValue={shop?.opening_hours}
              placeholder="例：19:00 - 26:00"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Google Map URL</label>
            <input
              type="text"
              name="googleMapUrl"
              defaultValue={shop?.google_map_url}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Instagram URL</label>
            <input
              type="text"
              name="instagramUrl"
              defaultValue={shop?.instagram_url}
              placeholder="https://instagram.com/..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">X (Twitter) URL</label>
            <input
              type="text"
              name="twitterUrl"
              defaultValue={shop?.twitter_url}
              placeholder="https://twitter.com/..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">公式サイト URL</label>
            <input
              type="text"
              name="websiteUrl"
              defaultValue={shop?.website_url}
              placeholder="https://..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">契約プラン</label>
            <select
              name="plan"
              required
              defaultValue={shop?.plan || "free"}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="free">Free (無料)</option>
              <option value="business">Business (月額3,800円)</option>
              <option value="premium">Premium (月額8,800円)</option>
            </select>
          </div>
        </div>

        <SubmitButton />
      </form>

      {shop && (
        <form action={deleteShop} className="mt-8 pt-8 border-t border-gray-200">
          <input type="hidden" name="id" value={shop.id} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 rounded-xl hover:bg-red-50 transition-colors"
            onClick={(e) => {
              if (!confirm("本当に削除しますか？この操作は取り消せません。")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 className="w-5 h-5" />
            店舗を削除
          </button>
        </form>
      )}
    </div>
  );
}
