"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Save, Share2, Lock, Globe, User } from "lucide-react";
import { CardPicker, BoardPicker } from "@/components/hands/CardPicker";
import { SequentialActionInput } from "@/components/hands/SequentialActionInput";
import { 
  Card, 
  Position, 
  Action, 
  GameType, 
  HandResult,
  getPositionsForTableSize,
  POSITION_LABELS,
  formatCard,
  calculatePreflopPot,
  calculatePotAfterStreet,
} from "@/types/hand";
import { createClient } from "@/lib/supabase/client";

type Step = 'basic' | 'cards' | 'preflop' | 'flop' | 'turn' | 'river' | 'result';

const STEPS: Step[] = ['basic', 'cards', 'preflop', 'flop', 'turn', 'river', 'result'];

const STEP_LABELS: Record<Step, string> = {
  basic: '基本情報',
  cards: 'ハンド',
  preflop: 'プリフロップ',
  flop: 'フロップ',
  turn: 'ターン',
  river: 'リバー',
  result: '結果',
};

const BLINDS_PRESETS = [
  { sb: 1, bb: 3 },
  { sb: 2, bb: 5 },
  { sb: 5, bb: 10 },
  { sb: 25, bb: 50 },
  { sb: 50, bb: 100 },
  { sb: 100, bb: 200 },
  { sb: 200, bb: 400 },
  { sb: 500, bb: 1000 },
];

export default function NewHandPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [saving, setSaving] = useState(false);
  
  // フォームの状態
  const [gameType, setGameType] = useState<GameType>('NLH');
  const [sb, setSb] = useState(100);
  const [bb, setBb] = useState(200);
  const [ante, setAnte] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(9);
  
  const [heroPosition, setHeroPosition] = useState<Position | null>(null);
  const [heroCard1, setHeroCard1] = useState<Card | null>(null);
  const [heroCard2, setHeroCard2] = useState<Card | null>(null);
  const [heroStackBb, setHeroStackBb] = useState(100);
  
  const [board, setBoard] = useState<Card[]>([]);
  
  const [preflopActions, setPreflopActions] = useState<Action[]>([]);
  const [flopActions, setFlopActions] = useState<Action[]>([]);
  const [turnActions, setTurnActions] = useState<Action[]>([]);
  const [riverActions, setRiverActions] = useState<Action[]>([]);
  
  const [result, setResult] = useState<HandResult | null>(null);
  const [memo, setMemo] = useState('');
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const positions = getPositionsForTableSize(maxPlayers);
  
  const usedCards = [heroCard1, heroCard2, ...board].filter((c): c is Card => c !== null);

  const currentStepIndex = STEPS.indexOf(currentStep);
  
  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };
  
  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  // アクションに参加したポジションからヒーロー候補を取得
  const heroOptions = useMemo(() => {
    const allActions = [...preflopActions, ...flopActions, ...turnActions, ...riverActions];
    const participatedPositions = new Set<Position>();
    allActions.forEach(action => {
      if (action.position !== 'Hero' && action.action !== 'fold') {
        participatedPositions.add(action.position as Position);
      }
    });
    return positions.filter(pos => participatedPositions.has(pos));
  }, [preflopActions, flopActions, turnActions, riverActions, positions]);

  // プリフロップでフォールドしたプレイヤーを追跡
  const preflopFoldedPlayers = useMemo(() => {
    const folded: Position[] = [];
    preflopActions.forEach(action => {
      if (action.position !== 'Hero' && action.action === 'fold') {
        folded.push(action.position as Position);
      }
    });
    return folded;
  }, [preflopActions]);

  // フロップでフォールドしたプレイヤーを追跡
  const flopFoldedPlayers = useMemo(() => {
    const folded = [...preflopFoldedPlayers];
    flopActions.forEach(action => {
      if (action.position !== 'Hero' && action.action === 'fold') {
        folded.push(action.position as Position);
      }
    });
    return folded;
  }, [preflopFoldedPlayers, flopActions]);

  // ターンでフォールドしたプレイヤーを追跡
  const turnFoldedPlayers = useMemo(() => {
    const folded = [...flopFoldedPlayers];
    turnActions.forEach(action => {
      if (action.position !== 'Hero' && action.action === 'fold') {
        folded.push(action.position as Position);
      }
    });
    return folded;
  }, [flopFoldedPlayers, turnActions]);

  // 各ストリート開始時のポットサイズを計算
  const potAfterPreflop = useMemo(() => {
    return calculatePreflopPot(preflopActions, maxPlayers, ante);
  }, [preflopActions, maxPlayers, ante]);

  const potAfterFlop = useMemo(() => {
    return calculatePotAfterStreet(flopActions, potAfterPreflop);
  }, [flopActions, potAfterPreflop]);

  const potAfterTurn = useMemo(() => {
    return calculatePotAfterStreet(turnActions, potAfterFlop);
  }, [turnActions, potAfterFlop]);

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return true;
      case 'cards':
        return heroCard1 !== null && heroCard2 !== null && heroPosition !== null;
      case 'preflop':
        return preflopActions.length >= 1;
      default:
        return true;
    }
  };

  const handleSave = async () => {
    if (!heroCard1 || !heroCard2 || !heroPosition) return;
    
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('hands')
        .insert({
          user_id: user.id,
          game_type: gameType,
          sb,
          bb,
          ante,
          max_players: maxPlayers,
          hero_position: heroPosition,
          hero_card1_rank: heroCard1.rank,
          hero_card1_suit: heroCard1.suit,
          hero_card2_rank: heroCard2.rank,
          hero_card2_suit: heroCard2.suit,
          hero_stack_bb: heroStackBb,
          board,
          preflop_actions: preflopActions,
          flop_actions: flopActions,
          turn_actions: turnActions,
          river_actions: riverActions,
          result,
          memo: memo || null,
          title: title || null,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/hands/${data.id}`);
    } catch (error) {
      console.error('Failed to save hand:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* 製作中バナー */}
      <div className="bg-amber-500 text-white text-center py-2 px-4">
        <span className="text-sm font-bold">🚧 製作中 - 現在開発中の機能です。お試しいただけますが、保存機能は未完成です</span>
      </div>
      
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/hands" className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">戻る</span>
          </Link>
          <h1 className="text-lg font-bold text-slate-900">ハンドを記録</h1>
          <div className="w-16" />
        </div>
        
        {/* プログレスバー */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-1">
            {STEPS.map((step, index) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  index <= currentStepIndex ? 'bg-orange-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400">
                {currentStepIndex + 1} / {STEPS.length}
              </span>
              <span className="text-xs text-slate-600 ml-2">
                {STEP_LABELS[currentStep]}
              </span>
            </div>
            <button
              onClick={goNext}
              disabled={currentStepIndex === STEPS.length - 1}
              className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: 基本情報 */}
        {currentStep === 'basic' && (
          <div className="space-y-6">
            {/* ブラインド */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ブラインド</label>
              <div className="flex flex-wrap gap-2">
                {BLINDS_PRESETS.map(preset => (
                  <button
                    key={`${preset.sb}/${preset.bb}`}
                    type="button"
                    onClick={() => { setSb(preset.sb); setBb(preset.bb); }}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                      sb === preset.sb && bb === preset.bb
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
                    }`}
                  >
                    {preset.sb}/{preset.bb}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={sb}
                    onChange={(e) => setSb(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center"
                    placeholder="SB"
                  />
                </div>
                <span className="text-slate-400 self-center">/</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={bb}
                    onChange={(e) => setBb(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center"
                    placeholder="BB"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={ante}
                    onChange={(e) => setAnte(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-center"
                    placeholder="Ante"
                  />
                </div>
              </div>
            </div>

            {/* プレイヤー数 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">テーブル</label>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                      maxPlayers === num
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
                    }`}
                  >
                    {num === 2 ? 'HU' : `${num}-max`}
                  </button>
                ))}
              </div>
            </div>

            {/* ポジション - Step1ではスキップ（後で選択） */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-sm text-slate-600 text-center">
                💡 ポジションはプリフロップのアクション入力時に選択します
              </p>
            </div>

            {/* スタック */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">スタック (BB)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={heroStackBb}
                  onChange={(e) => setHeroStackBb(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-bold text-center"
                />
                <span className="text-slate-500 font-bold">BB</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[20, 50, 100, 150, 200].map(stack => (
                  <button
                    key={stack}
                    type="button"
                    onClick={() => setHeroStackBb(stack)}
                    className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {stack}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: ハンド選択 */}
        {currentStep === 'cards' && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4 text-center">
                あなたのハンド
              </label>
              <div className="flex justify-center gap-4">
                <CardPicker
                  value={heroCard1}
                  onChange={setHeroCard1}
                  usedCards={heroCard2 ? [heroCard2] : []}
                  label="1枚目"
                  size="lg"
                />
                <CardPicker
                  value={heroCard2}
                  onChange={setHeroCard2}
                  usedCards={heroCard1 ? [heroCard1] : []}
                  label="2枚目"
                  size="lg"
                />
              </div>
              {heroCard1 && heroCard2 && (
                <div className="text-center mt-4">
                  <span className="text-2xl font-bold text-slate-800">
                    {formatCard(heroCard1)} {formatCard(heroCard2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: プリフロップ */}
        {currentStep === 'preflop' && (
          <div className="space-y-6">
            <SequentialActionInput
              actions={preflopActions}
              onChange={setPreflopActions}
              positions={positions}
              streetName="プリフロップ"
              isPreflop={true}
              heroPosition={heroPosition}
              onHeroSelect={setHeroPosition}
              onRoundComplete={goNext}
            />
            
            {/* ヒーロー選択状態表示 */}
            {heroPosition && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-bold text-slate-700">
                    あなた: <span className="text-orange-600">{POSITION_LABELS[heroPosition]}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHeroPosition(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  変更
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: フロップ */}
        {currentStep === 'flop' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">フロップ</label>
                <span className="text-sm font-bold text-green-600">
                  Pot: {potAfterPreflop.toFixed(1)}BB
                </span>
              </div>
              <BoardPicker
                value={board.slice(0, 3)}
                onChange={(cards) => setBoard([...cards, ...board.slice(3)])}
                maxCards={3}
                usedCards={[heroCard1, heroCard2].filter((c): c is Card => c !== null)}
              />
            </div>
            {board.length >= 3 && (
              <SequentialActionInput
                actions={flopActions}
                onChange={setFlopActions}
                positions={positions}
                streetName="フロップアクション"
                isPreflop={false}
                heroPosition={heroPosition}
                foldedPlayers={preflopFoldedPlayers}
                onRoundComplete={goNext}
              />
            )}
          </div>
        )}

        {/* Step 5: ターン */}
        {currentStep === 'turn' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">ターン</label>
                <span className="text-sm font-bold text-green-600">
                  Pot: {potAfterFlop.toFixed(1)}BB
                </span>
              </div>
              <BoardPicker
                value={board.slice(0, 4)}
                onChange={(cards) => setBoard([...cards, ...board.slice(4)])}
                maxCards={4}
                usedCards={[heroCard1, heroCard2].filter((c): c is Card => c !== null)}
              />
            </div>
            {board.length >= 4 && (
              <SequentialActionInput
                actions={turnActions}
                onChange={setTurnActions}
                positions={positions}
                streetName="ターンアクション"
                isPreflop={false}
                heroPosition={heroPosition}
                foldedPlayers={flopFoldedPlayers}
                onRoundComplete={goNext}
              />
            )}
          </div>
        )}

        {/* Step 6: リバー */}
        {currentStep === 'river' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">リバー</label>
                <span className="text-sm font-bold text-green-600">
                  Pot: {potAfterTurn.toFixed(1)}BB
                </span>
              </div>
              <BoardPicker
                value={board}
                onChange={setBoard}
                maxCards={5}
                usedCards={[heroCard1, heroCard2].filter((c): c is Card => c !== null)}
              />
            </div>
            {board.length >= 5 && (
              <SequentialActionInput
                actions={riverActions}
                onChange={setRiverActions}
                positions={positions}
                streetName="リバーアクション"
                isPreflop={false}
                heroPosition={heroPosition}
                foldedPlayers={turnFoldedPlayers}
                onRoundComplete={goNext}
              />
            )}
          </div>
        )}

        {/* Step 7: 結果 */}
        {currentStep === 'result' && (
          <div className="space-y-6">
            {/* 結果選択 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">結果</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'win', label: '勝ち', color: 'bg-green-500' },
                  { value: 'lose', label: '負け', color: 'bg-red-500' },
                  { value: 'split', label: '引分', color: 'bg-yellow-500' },
                  { value: 'unknown', label: '不明', color: 'bg-slate-500' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResult(opt.value)}
                    className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                      result === opt.value
                        ? `${opt.color} text-white`
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* タイトル */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">タイトル（任意）</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3"
                placeholder="例: 難しいリバーのスポット"
              />
            </div>

            {/* メモ */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">メモ（任意）</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 min-h-[100px] resize-none"
                placeholder="振り返りや気づいたことを記録..."
              />
            </div>

            {/* 公開設定 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">公開設定</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    isPublic
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  公開
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    !isPublic
                      ? 'bg-slate-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  非公開
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {isPublic 
                  ? '誰でも閲覧・共有できます' 
                  : '自分だけが閲覧できます'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* フッターナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              戻る
            </button>
          )}
          
          {currentStep === 'result' ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !heroCard1 || !heroCard2 || !heroPosition}
              className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                '保存中...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  保存する
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
