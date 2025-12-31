"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift, Ticket, Unlock, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PublicGachaItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  probability: number | null;
  type: string;
  stock_total: number | null;
  stock_used: number | null;
  is_monthly_limit: boolean | null;
  current_stock_used: number | null;
  shop_image_url: string | null;
};

export default function PremiumGuidePage() {
  const [showItemsList, setShowItemsList] = useState(false);
  const [gachaItems, setGachaItems] = useState<PublicGachaItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchGachaItems = async () => {
      const { data, error } = await supabase.rpc("get_public_gacha_items");

      if (!error) {
        setGachaItems((data ?? []) as PublicGachaItem[]);
        return;
      }

      const { data: legacy } = await supabase
        .from("gacha_items")
        .select("id,name,description,image_url,probability,type,stock_total,stock_used,is_monthly_limit,shops(image_url)")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("probability", { ascending: false });

      if (legacy) {
        const mapped: PublicGachaItem[] = (legacy as any[]).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          image_url: item.image_url ?? null,
          probability: item.probability ?? null,
          type: item.type,
          stock_total: item.stock_total ?? null,
          stock_used: item.stock_used ?? null,
          is_monthly_limit: item.is_monthly_limit ?? null,
          current_stock_used: item.stock_used ?? 0,
          shop_image_url: item.shops?.image_url ?? null,
        }));
        setGachaItems(mapped);
      }
    };

    fetchGachaItems();
  }, [supabase]);

  const totalWeight = gachaItems.reduce((sum, item) => sum + (item.probability ?? 0), 0);
  const formatProbabilityPct = (item: PublicGachaItem) => {
    const w = item.probability ?? 0;
    if (!totalWeight || !w) return "0%";
    const pct = Math.round((w / totalWeight) * 1000) / 10;
    return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
  };
  const formatRemainingStock = (item: PublicGachaItem) => {
    if (item.stock_total === null || item.stock_total === undefined) return "無制限";
    const used = Number(item.current_stock_used ?? item.stock_used ?? 0);
    return String(Math.max(0, item.stock_total - used));
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-slate-800">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">おきぽかプレミアム</h1>
        <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full transition-colors">
          トップへ戻る
        </Link>
      </header>

      <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-53px)]">
         {/* バナー画像エリア */}
         <div className="w-full aspect-3/2 bg-slate-100 flex items-center justify-center relative overflow-hidden group">
           {/* ユーザーが画像を差し替える場所 */}
           <img 
             src="/premium-banner1.png" 
             alt="おきぽかプレミアム" 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             onError={(e) => {
               // 画像がない場合のフォールバック表示
               e.currentTarget.style.display = 'none';
               const el = e.currentTarget.nextElementSibling;
               if (el) {
                 el.classList.remove('hidden');
                 el.classList.add('flex');
               }
             }}
           />
           <div className="absolute inset-0 flex-col items-center justify-center text-slate-400 bg-slate-50 hidden">
              <span className="text-4xl mb-2 opacity-50">🖼️</span>
              <span className="font-bold text-sm">告知バナー画像エリア</span>
              <span className="text-[10px] mt-1 opacity-70">推奨サイズ: 1200x800 (3:2)</span>
           </div>
           
           {/* 画像上のオーバーレイ装飾（画像がある場合でも少しリッチに見せる） */}
           <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent pointer-events-none"></div>
         </div>
         
         <div className="px-6 py-10">
           {/* タイトル & 価格 */}
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-4">
               <Sparkles className="w-3 h-3" />
               <span>月額会員プラン</span>
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
               おきぽかプレミアムで<br/>
               ポーカーライフを充実させよう
             </h2>
             
             <div className="relative inline-block">
                <div className="absolute -inset-1 bg-linear-to-r from-orange-400 to-pink-500 rounded-2xl blur-sm opacity-30"></div>
                <div className="relative bg-white rounded-xl px-8 py-5 border border-orange-100 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold mb-1 tracking-wider">MONTHLY PLAN</p>
                  <div className="flex items-baseline justify-center gap-1 text-slate-900">
                    <span className="text-4xl font-black tracking-tighter">2,200</span>
                    <span className="text-sm font-bold text-slate-500">円 (税込)</span>
                  </div>
                </div>
             </div>
           </div>
           
           {/* 特徴リスト - デザイン刷新 */}
           <div className="space-y-10 mb-16 relative">
                         {/* 縦線 */}
                         <div className="absolute left-6.75 top-8 bottom-8 w-0.5 bg-slate-100 -z-10"></div>
             
                         <div className="flex gap-6 items-start group">
               <div className="w-14 h-14 rounded-2xl bg-white border border-orange-100 shadow-lg shadow-orange-100/50 flex items-center justify-center text-orange-500 shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Gift className="w-7 h-7" />
               </div>
               <div className="pt-1">
                 <h3 className="font-bold text-slate-900 text-lg mb-2">毎日1回ガチャが引ける</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   1日1回の運試し。ログインするだけで毎日ワクワクをお届けします。何が出るかはお楽しみ。
                 </p>
               </div>
             </div>
             
             <div className="flex gap-6 items-start group">
               <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 shadow-lg shadow-blue-100/50 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Ticket className="w-7 h-7" />
               </div>
               <div className="pt-1">
                 <h3 className="font-bold text-slate-900 text-lg mb-2">必ず何かが当たる</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   アミューズメントポーカー店舗の割引券やドリンクチケットなど、ハズレなし！お得にポーカーを楽しめます。
                 </p>
               </div>
             </div>
             
             <div className="flex gap-6 items-start group">
               <div className="w-14 h-14 rounded-2xl bg-white border border-green-100 shadow-lg shadow-green-100/50 flex items-center justify-center text-green-500 shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Unlock className="w-7 h-7" />
               </div>
               <div className="pt-1">
                 <h3 className="font-bold text-slate-900 text-lg mb-2">いつでも解約可能</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   契約期間の縛りはありません。マイページからいつでも簡単に解約手続きが可能です。
                 </p>
               </div>
             </div>
           </div>
           
           {/* アクションボタン */}
           <div className="mt-12 mb-8">
             <Link
               href="/member"
               className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
             >
               <span className="text-lg">今すぐ登録する</span>
             </Link>

             <button
               type="button"
               onClick={() => setShowItemsList(true)}
               className="w-full mt-4 bg-white border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"
             >
               ラインナップを見る
             </button>
           </div>
         </div>
      </div>

      {/* 景品一覧モーダル */}
      {showItemsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">ラインナップ</h3>
              <button
                type="button"
                onClick={() => setShowItemsList(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                aria-label="閉じる"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3">
              {gachaItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-12 h-12 shrink-0 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                    {item.type === "none" ? (
                      <span className="text-2xl">😢</span>
                    ) : (item.image_url || item.shop_image_url) ? (
                      <img src={item.image_url || item.shop_image_url || ""} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🎁</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>確率: {formatProbabilityPct(item)}</span>
                      <span>残り: {formatRemainingStock(item)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {gachaItems.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  現在開催中のガチャはありません
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 text-center">
              <button
                type="button"
                onClick={() => setShowItemsList(false)}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
