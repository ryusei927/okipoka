import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Share2, Globe, Lock, Trophy, TrendingDown, Clock, MessageCircle, Copy, Twitter } from "lucide-react";
import { Card, Action, SUIT_SYMBOLS, SUIT_COLORS, ACTION_LABELS, POSITION_LABELS, formatCard, formatBoard } from "@/types/hand";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: hand } = await supabase
    .from("hands")
    .select("*")
    .eq("id", id)
    .single();

  if (!hand) {
    return { title: "ハンドが見つかりません" };
  }

  const card1 = { rank: hand.hero_card1_rank, suit: hand.hero_card1_suit };
  const card2 = { rank: hand.hero_card2_rank, suit: hand.hero_card2_suit };
  const handStr = `${formatCard(card1 as any)} ${formatCard(card2 as any)}`;
  
  const title = hand.title || `${handStr} (${hand.hero_position})`;
  const description = `${hand.game_type} ${hand.sb}/${hand.bb} | ${hand.hero_position} | ${hand.result === 'win' ? '勝ち' : hand.result === 'lose' ? '負け' : ''} ${hand.profit_bb ? (hand.profit_bb > 0 ? '+' : '') + hand.profit_bb + 'BB' : ''}`;

  return {
    title: `${title} | OKIPOKA ハンド共有`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HandDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: hand, error } = await supabase
    .from("hands")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !hand) {
    notFound();
  }

  const card1 = { rank: hand.hero_card1_rank, suit: hand.hero_card1_suit } as Card;
  const card2 = { rank: hand.hero_card2_rank, suit: hand.hero_card2_suit } as Card;
  const boardCards = (hand.board || []) as Card[];

  const preflopActions = (hand.preflop_actions || []) as Action[];
  const flopActions = (hand.flop_actions || []) as Action[];
  const turnActions = (hand.turn_actions || []) as Action[];
  const riverActions = (hand.river_actions || []) as Action[];

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://okipoka.jp'}/hands/${hand.id}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/hands" className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">一覧に戻る</span>
          </Link>
          <div className="flex items-center gap-2">
            {hand.is_public ? (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Globe className="w-3 h-3" />
                公開
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                非公開
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* ハンド情報ヘッダー */}
          <div className="bg-slate-900 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  {hand.game_type}
                </span>
                <span className="text-xs text-slate-400">
                  {hand.sb}/{hand.bb} {hand.ante ? `(Ante ${hand.ante})` : ''}
                </span>
              </div>
              <span className="text-xs font-bold text-orange-400">
                {POSITION_LABELS[hand.hero_position as keyof typeof POSITION_LABELS]}
              </span>
            </div>

            {/* Hero ハンド */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <CardDisplay card={card1} size="lg" />
                <CardDisplay card={card2} size="lg" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Hero</div>
                <div className="text-2xl font-bold">
                  {formatCard(card1)} {formatCard(card2)}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Stack: {hand.hero_stack_bb}BB
                </div>
              </div>
            </div>
          </div>

          {/* ボード */}
          {boardCards.length > 0 && (
            <div className="p-6 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-400 mb-3">BOARD</div>
              <div className="flex gap-2">
                {boardCards.map((card, index) => (
                  <CardDisplay key={index} card={card} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* アクション */}
          <div className="p-6 space-y-6">
            {preflopActions.length > 0 && (
              <StreetActions name="Preflop" actions={preflopActions} />
            )}
            {flopActions.length > 0 && (
              <StreetActions name="Flop" actions={flopActions} board={boardCards.slice(0, 3)} />
            )}
            {turnActions.length > 0 && (
              <StreetActions name="Turn" actions={turnActions} board={boardCards.slice(0, 4)} />
            )}
            {riverActions.length > 0 && (
              <StreetActions name="River" actions={riverActions} board={boardCards} />
            )}
          </div>

          {/* 結果 */}
          {hand.result && (
            <div className={`p-6 border-t border-slate-100 ${
              hand.result === 'win' ? 'bg-green-50' : hand.result === 'lose' ? 'bg-red-50' : 'bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hand.result === 'win' && <Trophy className="w-5 h-5 text-green-600" />}
                  {hand.result === 'lose' && <TrendingDown className="w-5 h-5 text-red-600" />}
                  <span className={`font-bold ${
                    hand.result === 'win' ? 'text-green-700' : hand.result === 'lose' ? 'text-red-700' : 'text-slate-600'
                  }`}>
                    {hand.result === 'win' ? '勝ち' : hand.result === 'lose' ? '負け' : hand.result === 'split' ? '引き分け' : '不明'}
                  </span>
                </div>
                {hand.profit_bb !== null && (
                  <span className={`text-xl font-bold ${
                    hand.profit_bb > 0 ? 'text-green-600' : hand.profit_bb < 0 ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {hand.profit_bb > 0 ? '+' : ''}{hand.profit_bb} BB
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* タイトル・メモ */}
        {(hand.title || hand.memo) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {hand.title && (
              <h2 className="text-lg font-bold text-slate-800 mb-2">{hand.title}</h2>
            )}
            {hand.memo && (
              <p className="text-slate-600 text-sm whitespace-pre-wrap">{hand.memo}</p>
            )}
          </div>
        )}

        {/* メタ情報 */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(hand.created_at).toLocaleString('ja-JP')}</span>
          </div>
        </div>

        {/* シェアボタン */}
        {hand.is_public && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="text-sm font-bold text-slate-700 mb-4">このハンドをシェア</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                URLをコピー
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${formatCard(card1)} ${formatCard(card2)} のハンド共有`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Xでシェア
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// カード表示コンポーネント
function CardDisplay({ card, size = 'md' }: { card: Card; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-11 text-sm',
    md: 'w-12 h-16 text-xl',
    lg: 'w-16 h-22 text-2xl',
  };

  const isRed = card.suit === 'h' || card.suit === 'd';

  return (
    <div className={`${sizeClasses[size]} bg-white rounded-lg shadow-md border border-slate-200 flex flex-col items-center justify-center font-bold ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
      <span>{card.rank}</span>
      <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-xl'}>
        {SUIT_SYMBOLS[card.suit]}
      </span>
    </div>
  );
}

// ストリートアクション表示
function StreetActions({ name, actions, board }: { name: string; actions: Action[]; board?: Card[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-slate-400">{name.toUpperCase()}</span>
        {board && board.length > 0 && (
          <span className="text-xs text-slate-300 font-mono">
            [{formatBoard(board)}]
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <div
            key={index}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              action.position === 'Hero'
                ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className="font-bold">{action.position === 'Hero' ? 'Hero' : action.position}</span>
            <span className="mx-1 text-slate-400">→</span>
            <span>{ACTION_LABELS[action.action]}</span>
            {action.amount_bb && (
              <span className="ml-1 text-slate-500">{action.amount_bb}BB</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
