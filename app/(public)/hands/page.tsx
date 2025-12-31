import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Clock, Globe, Lock, Trophy, TrendingDown } from "lucide-react";
import { formatCard } from "@/types/hand";

export default async function HandsPage() {
  const supabase = await createClient();
  
  // 公開ハンドを新しい順に取得
  const { data: hands, error } = await supabase
    .from("hands")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 製作中バナー */}
      <div className="bg-amber-500 text-white text-center py-2 px-4">
        <span className="text-sm font-bold">🚧 製作中 - 現在開発中の機能です</span>
      </div>
      
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ハンド共有</h1>
            <p className="text-xs text-slate-400 mt-0.5">みんなのハンドを見て学ぼう</p>
          </div>
          <Link
            href="/hands/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            記録する
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-4">
            ハンドの取得に失敗しました
          </div>
        )}

        {hands && hands.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🃏</div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">まだハンドがありません</h2>
            <p className="text-sm text-slate-400 mb-6">最初のハンドを記録してみましょう！</p>
            <Link
              href="/hands/new"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              ハンドを記録
            </Link>
          </div>
        )}

        {hands && hands.length > 0 && (
          <div className="space-y-3">
            {hands.map((hand) => {
              const card1 = { rank: hand.hero_card1_rank, suit: hand.hero_card1_suit };
              const card2 = { rank: hand.hero_card2_rank, suit: hand.hero_card2_suit };
              const boardCards = hand.board || [];
              
              return (
                <Link
                  key={hand.id}
                  href={`/hands/${hand.id}`}
                  className="block bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* ハンド表示 */}
                      <div className="flex items-center gap-1 bg-slate-900 text-white px-3 py-2 rounded-lg font-mono font-bold">
                        <span className={hand.hero_card1_suit === 'h' || hand.hero_card1_suit === 'd' ? 'text-red-400' : ''}>
                          {formatCard(card1 as any)}
                        </span>
                        <span className={hand.hero_card2_suit === 'h' || hand.hero_card2_suit === 'd' ? 'text-red-400' : ''}>
                          {formatCard(card2 as any)}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">{hand.hero_position}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{hand.game_type}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{hand.sb}/{hand.bb}</span>
                        </div>
                        {hand.title && (
                          <p className="text-sm font-bold text-slate-700 mt-1">{hand.title}</p>
                        )}
                        {boardCards.length > 0 && (
                          <div className="text-xs text-slate-400 mt-1 font-mono">
                            Board: {boardCards.map((c: any) => formatCard(c)).join(' ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 結果表示 */}
                    {hand.result && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                        hand.result === 'win' 
                          ? 'bg-green-100 text-green-700' 
                          : hand.result === 'lose'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {hand.result === 'win' && <Trophy className="w-3 h-3" />}
                        {hand.result === 'lose' && <TrendingDown className="w-3 h-3" />}
                        {hand.profit_bb !== null && (
                          <span>{hand.profit_bb > 0 ? '+' : ''}{hand.profit_bb}BB</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(hand.created_at).toLocaleDateString('ja-JP')}</span>
                    {hand.is_public ? (
                      <Globe className="w-3 h-3 ml-2" />
                    ) : (
                      <Lock className="w-3 h-3 ml-2" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
