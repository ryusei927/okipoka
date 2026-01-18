"use client";

import { upsertTournament, removeTemplate, type TournamentState } from "./actions";
import { ArrowLeft, Save, Sparkles, Loader2, Upload, ScanLine, Wand2, History, Copy, Star, X, ChevronDown, ChevronUp } from "lucide-react";
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

export default function TournamentForm({ shops, tournament, recentTournaments = [] }: { shops: any[], tournament?: any, recentTournaments?: any[] }) {
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
      isTemplate: tournament?.is_template || false,
    };
  });

  const [addonStatus, setAddonStatus] = useState(tournament?.addon_status || "unknown");
  const [isTemplateOpen, setIsTemplateOpen] = useState(true);

  // 履歴からのコピー機能
  const handleCopyFromHistory = (history: any) => {
    // 日付は今日にする
    const now = new Date();
    const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = jstDate.toISOString().split('T')[0];

    // 時間のフォーマット
    const formatTimeStr = (dateStr: string) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    setFormData({
      shopId: history.shop_id || "",
      type: history.type || "トーナメント",
      title: history.title || "",
      date: todayStr,
      time: formatTimeStr(history.start_at) || "19:00",
      lateRegTime: formatTimeStr(history.late_reg_at) || "",
      buyIn: history.buy_in || "",
      reentryFee: history.reentry_fee || "",
      stack: history.stack || "",
      addonFee: history.addon_fee || "",
      addonStack: history.addon_stack || "",
      prizes: history.prizes || "",
      notes: history.notes || "",
      isTemplate: false,
    });
    
    if (history.addon_status) {
      setAddonStatus(history.addon_status);
    }
    
    setFormKey(k => k + 1);
    
    // フォームトップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("このテンプレートを削除（解除）しますか？\n※トーナメント自体は削除されません")) return;
    
    try {
      await removeTemplate(id);
      // ページリロードして反映させる（簡易的な対応）
      window.location.reload();
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  // 履歴の重複除外（タイトルでユニークにする）
  const uniqueHistory = recentTournaments.reduce((acc: any[], curr) => {
    if (!acc.find(item => item.title === curr.title)) {
      acc.push(curr);
    }
    return acc;
  }, []);

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

      {/* AI解析セクション */}
      <label className={`
        block mb-6 relative overflow-hidden group rounded-xl shadow-lg cursor-pointer
        ${analyzing ? "cursor-wait" : ""}
      `}>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAnalyze}
          disabled={analyzing}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 transition-all duration-300 group-hover:scale-[1.01]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        <div className="relative p-4 text-white border border-white/10 rounded-xl">
          <div className="flex items-center gap-4">
            
            {/* アイコンエリア */}
            <div className={`
              relative flex items-center justify-center w-12 h-12 rounded-xl flex-none
              ${analyzing ? "bg-white/20" : "bg-white/10"} 
              backdrop-blur-md transition-all duration-500
            `}>
              {analyzing ? (
                <ScanLine className="w-6 h-6 text-cyan-300 animate-pulse" />
              ) : (
                <Wand2 className="w-6 h-6 text-yellow-300" />
              )}
              
              {/* 解析中のエフェクト */}
              {analyzing && (
                <div className="absolute inset-0 border-2 border-cyan-300/50 rounded-xl animate-ping" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 whitespace-nowrap">
                AIトーナメント解析
              </h3>
              {analyzing && (
                <p className="text-indigo-100 text-xs sm:text-sm opacity-90 animate-pulse">
                  解析中...
                </p>
              )}
            </div>

            {/* アップロードアイコン（ボタンの代わり） */}
            <div className="flex-none">
              <div className={`
                p-2 rounded-full bg-white/10 backdrop-blur-sm
                group-hover:bg-white/20 transition-colors
              `}>
                {analyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
                ) : (
                  <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>
          </div>
        </div>
      </label>

      {/* テンプレートからコピー */}
      {!tournament && uniqueHistory.length > 0 && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button 
            type="button"
            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              テンプレートからコピー
              <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                {uniqueHistory.length}件
              </span>
            </div>
            {isTemplateOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          
          {isTemplateOpen && (
            <div className="p-4 bg-gray-50/50 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {uniqueHistory.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCopyFromHistory(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCopyFromHistory(item);
                      }
                    }}
                    className="relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTemplate(e, item.id)}
                        className="bg-red-100 p-1.5 rounded-full hover:bg-red-200 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="テンプレートから削除"
                      >
                        <X className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                    
                    <div className="font-bold text-gray-900 truncate mb-1 pr-8 group-hover:text-orange-600 transition-colors text-sm">
                      {item.title}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium text-[10px]">
                        {item.type}
                      </span>
                      {item.buy_in && (
                        <span className="font-medium text-gray-500 text-xs">
                          {item.buy_in}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                      <span>前回: {new Date(item.start_at).toLocaleDateString()}</span>
                      <span className="text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        コピー
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form key={formKey} action={formAction} className="space-y-6">
        {tournament && <input type="hidden" name="id" value={tournament.id} />}
        
        {state.error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
            {state.error}
          </div>
        )}

        {/* テンプレート登録オプション */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
          <input
            type="checkbox"
            id="isTemplate"
            name="isTemplate"
            defaultChecked={formData.isTemplate}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
          />
          <label htmlFor="isTemplate" className="text-sm font-bold text-gray-800 cursor-pointer select-none">
            この内容をテンプレート（お気に入り）として保存する
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              次回から「テンプレートからコピー」に表示され、簡単に入力できるようになります。
            </p>
          </label>
        </div>

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
