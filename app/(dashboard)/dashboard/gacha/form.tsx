"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { upsertGachaItem, type GachaItemState } from "./actions";

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

const initialState: GachaItemState = {
  message: "",
  error: "",
};

export default function GachaItemForm({ item, shops = [] }: { item?: any; shops?: any[] }) {
  const [state, formAction] = useActionState(upsertGachaItem, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image_url || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <form action={formAction} className="space-y-8 pb-20">
      <input type="hidden" name="id" value={item?.id || ""} />
      <input type="hidden" name="currentImageUrl" value={item?.image_url || ""} />

      <div className="flex items-center gap-4">
        <Link href="/dashboard/gacha" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {item ? "ガチャ景品を編集" : "ガチャ景品を追加"}
        </h1>
      </div>

      {state.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            対象店舗（任意）
          </label>
          <select
            name="shop_id"
            defaultValue={item?.shop_id || ""}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
          >
            <option value="">指定なし（共通クーポンなど）</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            特定の店舗で使えるクーポンの場合は選択してください。
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={item?.name}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: 500円割引券"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">説明</label>
          <textarea
            name="description"
            defaultValue={item?.description || ""}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-y"
            placeholder="例: トーナメント参加費から500円割引"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              当選確率（重み） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="probability"
              min={1}
              step={1}
              defaultValue={item?.probability ?? 10}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
            <p className="text-xs text-gray-500">数値が大きいほど当たりやすい</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              種類 <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              defaultValue={item?.type || "drink_ticket"}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
            >
              <option value="drink_ticket">ドリンクチケット</option>
              <option value="discount_coupon">割引クーポン</option>
              <option value="ring_chip">リングチップ</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">金額（任意）</label>
          <input
            type="number"
            name="value"
            min={0}
            step={1}
            defaultValue={item?.value ?? ""}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: 500"
          />
          <p className="text-xs text-gray-500">割引額など。不要なら空欄</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            原価（円・期待値計算用）
          </label>
          <input
            type="number"
            name="costYen"
            min={0}
            step={1}
            defaultValue={item?.cost_yen ?? 0}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: 200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              全体の当選上限（個）
            </label>
            <input
              type="number"
              name="stockTotal"
              min={0}
              step={1}
              defaultValue={item?.stock_total ?? ""}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="空欄で無制限"
            />
            <p className="text-xs text-gray-500">
              この景品が当選する総数です。在庫切れになると排出されなくなります。
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              1人あたりの当選上限（回）
            </label>
            <input
              type="number"
              name="limitPerUser"
              min={1}
              step={1}
              defaultValue={item?.limit_per_user ?? ""}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="空欄で無制限"
            />
            <p className="text-xs text-gray-500">
              1人のユーザーがこの景品を当てられる最大回数です。
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              name="isMonthlyLimit"
              defaultChecked={item?.is_monthly_limit ?? false}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
            />
            <div>
              <div className="font-bold text-gray-900">毎月リセットする</div>
              <div className="text-xs text-gray-500">
                有効にすると、当選上限（在庫）と1人あたりの上限が「月間」の制限になります。<br/>
                翌月1日になると自動的にカウントがリセットされ、また当たるようになります。
              </div>
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            有効期限（日） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="expiresDays"
            min={0}
            step={1}
            defaultValue={item?.expires_days ?? 30}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: 30"
          />
          <p className="text-xs text-gray-500">当選してから何日間使えるか（0なら当日まで）</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">画像（任意）</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors relative">
            {previewUrl ? (
              <div className="relative w-full aspect-video max-w-md">
                <Image src={previewUrl} alt="Preview" fill className="object-contain rounded-lg" />
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
            />
          </div>
          <p className="text-xs text-gray-500">画像はクーポン表示用（任意）</p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            defaultChecked={item?.is_active ?? true}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
          />
          <label htmlFor="isActive" className="font-bold text-gray-700 cursor-pointer">
            有効にする（ガチャに入れる）
          </label>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
