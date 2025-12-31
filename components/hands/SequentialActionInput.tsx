"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Action, ActionType, Position, ACTION_LABELS, POSITION_LABELS } from "@/types/hand";
import { X, User, RotateCcw } from "lucide-react";

type SequentialActionInputProps = {
  actions: Action[];
  onChange: (actions: Action[]) => void;
  positions: Position[];
  streetName: string;
  isPreflop?: boolean;
  heroPosition?: Position | null;
  onHeroSelect?: (position: Position) => void;
  foldedPlayers?: Position[]; // 前のストリートでフォールドしたプレイヤー
  onRoundComplete?: () => void; // ストリート完了時のコールバック
};

// 全ポジションのプリフロップ順序（UTGから、SB/BBが最後）
const PREFLOP_ORDER_ALL: Position[] = ['UTG', 'UTG1', 'MP', 'MP1', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// 全ポジションのポストフロップ順序（SBから）
const POSTFLOP_ORDER_ALL: Position[] = ['SB', 'BB', 'UTG', 'UTG1', 'MP', 'MP1', 'HJ', 'CO', 'BTN'];

// HU（ヘッズアップ）の特殊ルール
// プリフロップ: SB(=BTN)が先、BBが後
// ポストフロップ: BBが先、SB(=BTN)が後
const PREFLOP_ORDER_HU: Position[] = ['SB', 'BB'];
const POSTFLOP_ORDER_HU: Position[] = ['BB', 'SB'];

const ACTION_TYPES: ActionType[] = ['fold', 'check', 'call', 'bet', 'raise', 'all-in'];

export function SequentialActionInput({
  actions,
  onChange,
  positions,
  streetName,
  isPreflop = false,
  heroPosition = null,
  onHeroSelect,
  foldedPlayers = [],
  onRoundComplete,
}: SequentialActionInputProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType>('fold');
  const [amount, setAmount] = useState<string>('');

  // HUかどうかを判定
  const isHeadsUp = positions.length === 2;

  // このテーブルのアクション順序を取得（渡されたpositionsからフィルタ）
  const actionOrder = useMemo(() => {
    // HUの場合は特別な順序
    if (isHeadsUp) {
      return isPreflop ? PREFLOP_ORDER_HU : POSTFLOP_ORDER_HU;
    }
    const orderTemplate = isPreflop ? PREFLOP_ORDER_ALL : POSTFLOP_ORDER_ALL;
    // テーブルに存在するポジションのみを順序通りにフィルタ
    return orderTemplate.filter(pos => positions.includes(pos));
  }, [positions, isPreflop, isHeadsUp]);

  // 有効なポジションのみフィルタ（前のストリートでフォールドしたプレイヤーを除外）
  const validPositions = useMemo(() => {
    return actionOrder.filter(pos => 
      positions.includes(pos) && !foldedPlayers.includes(pos)
    );
  }, [actionOrder, positions, foldedPlayers]);

  // フォールド/オールインしたプレイヤーを追跡
  const inactivePlayers = useMemo(() => {
    const inactive = new Set<Position>();
    actions.forEach(action => {
      if (action.position !== 'Hero') {
        if (action.action === 'fold' || action.action === 'all-in') {
          inactive.add(action.position);
        }
      }
    });
    return inactive;
  }, [actions]);

  // 現在アクティブなプレイヤー（フォールド/オールインしていない）
  const activePlayers = useMemo(() => {
    return validPositions.filter(pos => !inactivePlayers.has(pos));
  }, [validPositions, inactivePlayers]);

  // ベッティングラウンドが終了したかどうかを判定
  const isRoundComplete = useMemo(() => {
    if (actions.length === 0) return false;
    if (activePlayers.length <= 1) return true;

    // 最後のアグレッサー（raise/bet）を探す
    let lastAggressorIndex = -1;
    let lastAggressorPosition: Position | null = null;
    
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      if (action.action === 'raise' || action.action === 'bet' || action.action === 'all-in') {
        lastAggressorIndex = i;
        lastAggressorPosition = action.position as Position;
        break;
      }
    }

    // アグレッサーがいない場合（全員check）
    if (lastAggressorIndex === -1) {
      // 全員がアクションしたかチェック
      const actedPlayers = new Set<Position>();
      actions.forEach(action => {
        if (action.position !== 'Hero') {
          actedPlayers.add(action.position as Position);
        }
      });
      return activePlayers.every(pos => actedPlayers.has(pos) || inactivePlayers.has(pos));
    }

    // アグレッサー以降、全てのアクティブプレイヤーがアクションしたか確認
    const actionsAfterAggressor = actions.slice(lastAggressorIndex + 1);
    const playersActedAfter = new Set<Position>();
    actionsAfterAggressor.forEach(action => {
      if (action.position !== 'Hero') {
        playersActedAfter.add(action.position as Position);
      }
    });

    // アグレッサー以外の全アクティブプレイヤーがアクションしたか
    const otherActivePlayers = activePlayers.filter(pos => pos !== lastAggressorPosition);
    return otherActivePlayers.every(pos => playersActedAfter.has(pos));
  }, [actions, activePlayers, inactivePlayers]);

  // 次にアクションするポジションを計算
  const nextPosition = useMemo(() => {
    if (activePlayers.length <= 1) return null;
    if (isRoundComplete) return null;

    // 最後のアクションを取得
    const lastAction = actions[actions.length - 1];
    if (!lastAction) {
      // 最初のアクション
      return isPreflop ? activePlayers[0] : activePlayers[0];
    }

    // 最後のアクションのポジションを取得
    let lastPos = lastAction.position;
    if (lastPos === 'Hero' && heroPosition) {
      lastPos = heroPosition;
    }

    // 次のアクティブプレイヤーを探す
    const lastIndex = validPositions.indexOf(lastPos as Position);
    for (let i = 1; i <= validPositions.length; i++) {
      const nextIndex = (lastIndex + i) % validPositions.length;
      const nextPos = validPositions[nextIndex];
      if (activePlayers.includes(nextPos)) {
        return nextPos;
      }
    }

    return null;
  }, [actions, activePlayers, validPositions, isPreflop, heroPosition, isRoundComplete]);

  // アクションに金額入力が必要かどうか（Callは自動計算なので不要）
  const needsAmountInput = (actionType: ActionType) => {
    return ['bet', 'raise', 'all-in'].includes(actionType);
  };

  // 現在のコール額を計算（最後のベット/レイズ額）
  const currentCallAmount = useMemo(() => {
    // プリフロップの場合、デフォルトは1BB（BBへのコール）
    let callAmount = isPreflop ? 1 : 0;
    
    for (const action of actions) {
      if (action.action === 'bet' || action.action === 'raise' || action.action === 'all-in') {
        callAmount = action.amount_bb || callAmount;
      }
    }
    
    return callAmount;
  }, [actions, isPreflop]);

  // 最後のアグレッシブアクションがオールインかどうか
  const facingAllIn = useMemo(() => {
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      if (action.action === 'all-in') {
        return true;
      }
      // 最後のアグレッシブアクションを見つけたら終了
      if (action.action === 'bet' || action.action === 'raise') {
        return false;
      }
    }
    return false;
  }, [actions]);

  // 現在のベッティングラウンドで可能なアクション
  const availableActions = useMemo(() => {
    // オールインに直面している場合: fold, call, all-in のみ（raiseは不可）
    if (facingAllIn) {
      return ['fold', 'call', 'all-in'] as ActionType[];
    }

    // 最後のアグレッシブアクションをチェック
    let hasBet = false;
    for (const action of actions) {
      if (action.action === 'bet' || action.action === 'raise' || action.action === 'all-in') {
        hasBet = true;
      }
    }
    
    // プリフロップはBBが強制ベットなのでraise可能
    if (isPreflop) hasBet = true;

    if (hasBet) {
      // ベットがある場合: fold, call, raise, all-in
      return ['fold', 'call', 'raise', 'all-in'] as ActionType[];
    } else {
      // ベットがない場合: check, bet, all-in
      return ['check', 'bet', 'all-in'] as ActionType[];
    }
  }, [actions, isPreflop, facingAllIn]);

  const handleAddAction = () => {
    if (!nextPosition) return;

    // Callの場合は自動でコール額をセット
    let actionAmount: number | undefined;
    if (selectedAction === 'call') {
      actionAmount = currentCallAmount;
    } else if (needsAmountInput(selectedAction) && amount) {
      actionAmount = parseFloat(amount);
    }

    const newAction: Action = {
      position: nextPosition,
      action: selectedAction,
      amount_bb: actionAmount,
    };

    onChange([...actions, newAction]);
    setAmount('');
    // 次のデフォルトアクションを設定
    if (selectedAction === 'fold' || selectedAction === 'check') {
      setSelectedAction(availableActions[0]);
    }
  };

  const handleSetHero = (position: Position) => {
    if (onHeroSelect) {
      onHeroSelect(position);
    }
  };

  const removeAction = (index: number) => {
    // 指定されたアクション以降を全て削除（順序が崩れるため）
    onChange(actions.slice(0, index));
  };

  const resetActions = () => {
    onChange([]);
  };

  // ラウンド完了時に自動で次へ進む
  const prevActionsLength = useRef(actions.length);
  useEffect(() => {
    // アクションが追加された時のみチェック（削除時は無視）
    if (actions.length > prevActionsLength.current && isRoundComplete && onRoundComplete) {
      // 少し遅延させて完了を表示してから遷移
      const timer = setTimeout(() => {
        onRoundComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
    prevActionsLength.current = actions.length;
  }, [actions.length, isRoundComplete, onRoundComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">{streetName}</h4>
        {actions.length > 0 && (
          <button
            type="button"
            onClick={resetActions}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            リセット
          </button>
        )}
      </div>

      {/* アクション履歴 */}
      {actions.length > 0 && (
        <div className="space-y-1">
          {actions.map((action, index) => {
            const isHero = heroPosition && action.position === heroPosition;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-lg p-2 group ${
                  isHero ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'
                }`}
              >
                <span className={`text-xs font-bold min-w-[50px] ${
                  isHero ? 'text-orange-600' : 'text-slate-600'
                }`}>
                  {POSITION_LABELS[action.position as Position] || action.position}
                  {isHero && ' 👤'}
                </span>
                <span className={`text-xs font-bold ${
                  action.action === 'fold' ? 'text-slate-400' :
                  action.action === 'all-in' ? 'text-red-600' :
                  action.action === 'raise' || action.action === 'bet' ? 'text-green-600' :
                  'text-slate-700'
                }`}>
                  {ACTION_LABELS[action.action]}
                  {action.amount_bb && ` ${action.amount_bb}BB`}
                </span>
                
                {/* ヒーロー設定ボタン */}
                {onHeroSelect && !heroPosition && action.position !== 'Hero' && (
                  <button
                    type="button"
                    onClick={() => handleSetHero(action.position as Position)}
                    className="ml-auto opacity-0 group-hover:opacity-100 px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-all flex items-center gap-1"
                  >
                    <User className="w-3 h-3" />
                    自分
                  </button>
                )}

                {/* 削除ボタン（最後のアクションのみ） */}
                {index === actions.length - 1 && (
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 次のアクション入力 */}
      {nextPosition && activePlayers.length > 1 ? (
        <div className="bg-slate-100 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">次:</span>
            <span className="text-sm font-bold text-slate-800">
              {POSITION_LABELS[nextPosition]}
              {heroPosition === nextPosition && (
                <span className="ml-1 text-orange-500">（自分）</span>
              )}
            </span>
          </div>

          {/* アクション選択 */}
          <div className="flex flex-wrap gap-1">
            {availableActions.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedAction(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  selectedAction === type
                    ? type === 'fold' ? 'bg-slate-600 text-white' :
                      type === 'all-in' ? 'bg-red-500 text-white' :
                      'bg-orange-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ACTION_LABELS[type]}
              </button>
            ))}
          </div>

          {/* コール額表示（Callの場合） */}
          {selectedAction === 'call' && (
            <div className="flex items-center justify-center gap-2 py-2 bg-white rounded-lg">
              <span className="text-sm text-slate-600">コール額:</span>
              <span className="text-lg font-bold text-orange-600">{currentCallAmount}BB</span>
            </div>
          )}

          {/* 金額入力（bet, raise, all-inの場合） */}
          {needsAmountInput(selectedAction) && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="金額"
                className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                autoFocus
              />
              <span className="text-sm text-slate-500 font-bold">BB</span>
            </div>
          )}

          {/* 追加ボタン */}
          <button
            type="button"
            onClick={handleAddAction}
            disabled={needsAmountInput(selectedAction) && !amount}
            className="w-full bg-orange-500 text-white text-sm font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            アクションを追加
          </button>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-slate-400">
          {activePlayers.length <= 1 ? (
            <span>🏆 ハンド終了（残り1人）</span>
          ) : isRoundComplete ? (
            <span>✅ このストリート完了 → 次へ進んでください</span>
          ) : actions.length === 0 ? (
            <span>アクションを入力してください</span>
          ) : (
            <span>アクションを入力してください</span>
          )}
        </div>
      )}

      {/* ヒーロー選択プロンプト */}
      {onHeroSelect && !heroPosition && actions.length >= 2 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-700 text-center">
            💡 アクションにカーソルを合わせて「自分」をタップすると、あなたのポジションを設定できます
          </p>
        </div>
      )}
    </div>
  );
}
