"use client";

import { upsertTournament, type TournamentState } from "./actions";
import { ArrowLeft, Save, Sparkles, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useActionState, useState } from "react";

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

const initialState: TournamentState = {
  message: "",
  error: "",
};

function formatTime(date: Date) {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export default function TournamentForm({ shops, tournament }: { shops: any[], tournament?: any }) {
  const [state, formAction] = useActionState(upsertTournament, initialState);
  
  // AI Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Initialize Form Data
  const [formData, setFormData] = useState(() => {
    let defaultDate = new Date().toISOString().split("T")[0];
    let defaultTime = "19:00";
    let defaultLateRegTime = "";

    if (tournament?.start_at) {
      const dateObj = new Date(tournament.start_at);
      defaultDate = dateObj.toISOString().split("T")[0];
      defaultTime = formatTime(dateObj);
    }

    if (tournament?.late_reg_at) {
      const dateObj = new Date(tournament.late_reg_at);
      defaultLateRegTime = formatTime(dateObj);
    }

    return {
      shopId: tournament?.shop_id || "",
      type: tournament?.type || "トーナメント",
      title: tournament?.title || "",
      date: defaultDate,
      time: defaultTime,
      lateRegTime: defaultLateRegTime,
      buyIn: tournament?.buy_in || "",
      reentryFee: tournament?.reentry_fee || "",
      stack: tournament?.stack || "",
      addonFee: tournament?.addon_fee || "",
      addonStack: tournament?.addon_stack || "",
      prizes: tournament?.prizes || "",
      notes: tournament?.notes || "",
    };
  });

  const [addonStatus, setAddonStatus] = useState(tournament?.addon_status || "unknown");

  const handleAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const res = await fetch("/api/admin/analyze-tournament", {
        method: "POST",
        body: uploadData,
      });
      
      if (!res.ok) throw new Error("解析に失敗しました");
      
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        date: data.date || prev.date,
        time: data.time || prev.time,
        lateRegTime: data.lateRegTime || prev.lateRegTime,
        buyIn: data.buyIn || prev.buyIn,
        reentryFee: data.reentryFee || prev.reentryFee,
        stack: data.stack || prev.stack,
        addonFee: data.addonFee || prev.addonFee,
        addonStack: data.addonStack || prev.addonStack,
        prizes: data.prizes || prev.prizes,
        notes: data.notes || prev.notes,
      }));
      
      if (data.addonStatus) {
        setAddonStatus(data.addonStatus);
      }
      
      setFormKey(k => k + 1);
      
    } catch (e) {
      console.error(e);
      alert("画像の解析に失敗しました。もう一度お試しください。");
    } finally {
      setAnalyzing(false);
      e.target.value = "";
    }
  };

  // 自動フォーマット関数
  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    
    // 既に「円」が含まれている場合は何もしない
    if (value.includes("円")) return;

    // 数字のみの場合は「円」を追加
    // カンマ区切りも考慮して、一度数値にしてからフォーマット
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      e.target.value = `${num.toLocaleString()}円`;
    }
  };

  const handleStackBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    
    // 既に「点」が含まれている場合は何もしない
    if (value.includes("点")) return;

    // 数字のみの場合は「点」を追加
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      e.target.value = `${num.toLocaleString()}点`;
    }
  };

  return (
    <div className="pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tournaments" className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {tournament ? "大会情報の編集" : "新規大会作成"}
          </h1>
        </div>
      </header>

      {/* AI解析ボタン */}
      <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">AI自動入力</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Instagramなどの画像をアップロードすると、AIが情報を読み取って自動で入力します。
            </p>
            
            <label className={`
              inline-flex items-center gap-2 bg-white text-indigo-600 font-bold py-2.5 px-5 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors shadow-sm
              ${analyzing ? "opacity-70 cursor-wait" : ""}
            `}>
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  画像をアップロード
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAnalyze}
                disabled={analyzing}
              />
            </label>
          </div>
        </div>
      </div>

      <form key={formKey} action={formAction} className="space-y-6">
        {tournament && <input type="hidden" name="id" value={tournament.id} />}
        
        {state.error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
            {state.error}
          </div>
        )}

        {/* 店舗選択 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-2">
          <label className="block text-sm font-bold text-gray-700">開催店舗</label>
          <select
            name="shopId"
            required
            defaultValue={formData.shopId}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">店舗を選択してください</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        {/* 基本情報 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="font-bold text-gray-900 border-b pb-2">基本情報</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">イベント種別</label>
            <select
              name="type"
              defaultValue={formData.type}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="トーナメント">トーナメント</option>
              <option value="リングゲーム">リングゲーム</option>
              <option value="初心者講習">初心者講習</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">イベント名</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={formData.title}
              placeholder="例：金曜ナイトスタック"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">開催日</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={formData.date}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">開始時間</label>
              <input
                type="time"
                name="time"
                required
                defaultValue={formData.time}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">締切時間 (Late Reg)</label>
            <input
              type="time"
              name="lateRegTime"
              defaultValue={formData.lateRegTime}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <p className="text-xs text-gray-500">※開始時間より早い時間を設定すると、翌日の時間として扱われます</p>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="font-bold text-gray-900 border-b pb-2">詳細情報</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">参加費 (Buy-in)</label>
              <input
                type="text"
                name="buyIn"
                defaultValue={formData.buyIn}
                placeholder="例：3,000円"
                onBlur={handleCurrencyBlur}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">リエントリー</label>
              <input
                type="text"
                name="reentryFee"
                defaultValue={formData.reentryFee}
                placeholder="例：3,000円"
                onBlur={handleCurrencyBlur}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">スタック</label>
              <input
                type="text"
                name="stack"
                defaultValue={formData.stack}
                placeholder="例：30,000点"
                onBlur={handleStackBlur}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">アドオン</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="addonStatus"
                  value="available"
                  checked={addonStatus === "available"}
                  onChange={(e) => setAddonStatus(e.target.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">あり</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="addonStatus"
                  value="unavailable"
                  checked={addonStatus === "unavailable"}
                  onChange={(e) => setAddonStatus(e.target.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">なし</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="addonStatus"
                  value="unknown"
                  checked={addonStatus === "unknown"}
                  onChange={(e) => setAddonStatus(e.target.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">不明</span>
              </label>
            </div>

            {addonStatus === "available" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">費用</label>
                  <input
                    type="text"
                    name="addonFee"
                    defaultValue={formData.addonFee}
                    placeholder="例：2,000円"
                    onBlur={handleCurrencyBlur}
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">追加スタック</label>
                  <input
                    type="text"
                    name="addonStack"
                    defaultValue={formData.addonStack}
                    placeholder="例：20,000点"
                    onBlur={handleStackBlur}
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">プライズ</label>
            <textarea
              name="prizes"
              defaultValue={formData.prizes}
              placeholder="例：1位 10,000マイル..."
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">備考</label>
            <textarea
              name="notes"
              defaultValue={formData.notes}
              placeholder="その他、特記事項があれば入力してください"
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
