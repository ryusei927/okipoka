"use client";

import Link from "next/link";
import { Gift, Ticket, Unlock, ChevronRight, Sparkles } from "lucide-react";

export default function PremiumGuidePage() {
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
               className="group w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-between"
             >
               <span className="text-lg">登録してガチャを引く</span>
               <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                 <ChevronRight className="w-5 h-5" />
               </div>
             </Link>
             <p className="text-[10px] text-center text-slate-400 mt-4">
               ※マイページへ移動します。未ログインの場合はログイン画面が表示されます。
             </p>
           </div>
         </div>
      </div>
    </div>
  );
}
