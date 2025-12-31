"use client";

import { useState } from "react";
import { Action, ActionType, Position, ACTION_LABELS, POSITION_LABELS } from "@/types/hand";
import { Plus, X, GripVertical } from "lucide-react";

type ActionInputProps = {
  actions: Action[];
  onChange: (actions: Action[]) => void;
  heroPosition: Position;
  positions: Position[];
  streetName: string;
  potBefore?: number;
};

const ACTION_TYPES: ActionType[] = ['fold', 'check', 'call', 'bet', 'raise', 'all-in'];

export function ActionInput({ 
  actions, 
  onChange, 
  heroPosition, 
  positions, 
  streetName,
  potBefore = 0 
}: ActionInputProps) {
  const [isAdding, setIsAdding] = useState(false);

  const addAction = (action: Action) => {
    onChange([...actions, action]);
    setIsAdding(false);
  };

  const updateAction = (index: number, updated: Partial<Action>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updated };
    onChange(newActions);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  // アクションに金額が必要かどうか
  const needsAmount = (actionType: ActionType) => {
    return ['bet', 'raise', 'call', 'all-in'].includes(actionType);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">{streetName}</h4>
        {potBefore > 0 && (
          <span className="text-xs text-slate-400">Pot: {potBefore}BB</span>
        )}
      </div>

      {/* アクション一覧 */}
      <div className="space-y-1">
        {actions.map((action, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 group"
          >
            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
            
            {/* ポジション選択 */}
            <select
              value={action.position}
              onChange={(e) => updateAction(index, { position: e.target.value as Position | 'Hero' })}
              className="text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 min-w-[70px]"
            >
              <option value="Hero">Hero</option>
              {positions.filter(p => p !== heroPosition).map(pos => (
                <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>
              ))}
            </select>

            {/* アクション選択 */}
            <select
              value={action.action}
              onChange={(e) => updateAction(index, { action: e.target.value as ActionType })}
              className="text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 min-w-[80px]"
            >
              {ACTION_TYPES.map(type => (
                <option key={type} value={type}>{ACTION_LABELS[type]}</option>
              ))}
            </select>

            {/* 金額入力 */}
            {needsAmount(action.action) && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={action.amount_bb || ''}
                  onChange={(e) => updateAction(index, { amount_bb: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  className="w-16 text-xs bg-white border border-slate-200 rounded px-2 py-1 text-right"
                />
                <span className="text-xs text-slate-400">BB</span>
              </div>
            )}

            {/* 削除ボタン */}
            <button
              type="button"
              onClick={() => removeAction(index)}
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {/* アクション追加 */}
      {isAdding ? (
        <QuickActionAdd
          positions={positions}
          heroPosition={heroPosition}
          onAdd={addAction}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors py-1"
        >
          <Plus className="w-4 h-4" />
          アクション追加
        </button>
      )}
    </div>
  );
}

// クイックアクション追加UI
type QuickActionAddProps = {
  positions: Position[];
  heroPosition: Position;
  onAdd: (action: Action) => void;
  onCancel: () => void;
};

function QuickActionAdd({ positions, heroPosition, onAdd, onCancel }: QuickActionAddProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | 'Hero'>('Hero');
  const [selectedAction, setSelectedAction] = useState<ActionType>('raise');
  const [amount, setAmount] = useState<string>('');

  const needsAmount = ['bet', 'raise', 'call', 'all-in'].includes(selectedAction);

  const handleAdd = () => {
    onAdd({
      position: selectedPosition,
      action: selectedAction,
      amount_bb: needsAmount && amount ? parseFloat(amount) : undefined,
    });
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-3">
      {/* ポジション選択 */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setSelectedPosition('Hero')}
          className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
            selectedPosition === 'Hero'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-slate-600 hover:bg-orange-100'
          }`}
        >
          Hero
        </button>
        {positions.filter(p => p !== heroPosition).map(pos => (
          <button
            key={pos}
            type="button"
            onClick={() => setSelectedPosition(pos)}
            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
              selectedPosition === pos
                ? 'bg-orange-500 text-white'
                : 'bg-white text-slate-600 hover:bg-orange-100'
            }`}
          >
            {POSITION_LABELS[pos]}
          </button>
        ))}
      </div>

      {/* アクション選択 */}
      <div className="flex flex-wrap gap-1">
        {ACTION_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedAction(type)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              selectedAction === type
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {ACTION_LABELS[type]}
          </button>
        ))}
      </div>

      {/* 金額入力 */}
      {needsAmount && (
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

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 bg-orange-500 text-white text-sm font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 bg-slate-200 text-slate-600 text-sm font-bold py-2 rounded-lg hover:bg-slate-300 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
