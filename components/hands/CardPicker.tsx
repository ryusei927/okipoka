"use client";

import { useState } from "react";
import { Card, Rank, Suit, RANKS, SUITS, SUIT_SYMBOLS, SUIT_COLORS } from "@/types/hand";
import { X } from "lucide-react";

type CardPickerProps = {
  value: Card | null;
  onChange: (card: Card | null) => void;
  usedCards?: Card[]; // 既に選択されているカード（選択不可にする）
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function CardPicker({ value, onChange, usedCards = [], label, size = "md" }: CardPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return usedCards.some(c => c.rank === rank && c.suit === suit);
  };

  const handleSelect = (rank: Rank, suit: Suit) => {
    onChange({ rank, suit });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  const sizeClasses = {
    sm: "w-10 h-14 text-lg",
    md: "w-14 h-20 text-2xl",
    lg: "w-20 h-28 text-4xl",
  };

  return (
    <div className="relative">
      {label && (
        <div className="text-xs font-bold text-slate-500 mb-1">{label}</div>
      )}
      
      {/* 選択されたカード表示 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizeClasses[size]}
          rounded-lg border-2 flex flex-col items-center justify-center
          transition-all duration-200 relative cursor-pointer
          ${value 
            ? "bg-white border-slate-300 shadow-md hover:shadow-lg" 
            : "bg-slate-100 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50"
          }
        `}
      >
        {value ? (
          <>
            <span className={`font-bold ${SUIT_COLORS[value.suit]}`}>
              {value.rank}
            </span>
            <span className={`${SUIT_COLORS[value.suit]} ${size === "sm" ? "text-base" : size === "md" ? "text-xl" : "text-3xl"}`}>
              {SUIT_SYMBOLS[value.suit]}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-slate-600 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <span className="text-slate-400 text-sm">?</span>
        )}
      </div>

      {/* カード選択モーダル */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute z-50 top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 min-w-[280px]">
            <div className="grid grid-cols-13 gap-0.5">
              {/* ヘッダー行（ランク） */}
              <div className="col-span-13 grid grid-cols-13 gap-0.5 mb-1">
                {RANKS.map(rank => (
                  <div key={rank} className="text-center text-xs font-bold text-slate-400 py-1">
                    {rank}
                  </div>
                ))}
              </div>
              
              {/* 各スート行 */}
              {SUITS.map(suit => (
                <div key={suit} className="col-span-13 grid grid-cols-13 gap-0.5">
                  {RANKS.map(rank => {
                    const used = isCardUsed(rank, suit);
                    const isSelected = value?.rank === rank && value?.suit === suit;
                    
                    return (
                      <button
                        key={`${rank}${suit}`}
                        type="button"
                        disabled={used}
                        onClick={() => handleSelect(rank, suit)}
                        className={`
                          aspect-square rounded text-xs font-bold flex items-center justify-center
                          transition-all duration-150
                          ${used 
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                            : isSelected
                              ? "bg-orange-500 text-white ring-2 ring-orange-300"
                              : `bg-slate-50 hover:bg-slate-100 ${SUIT_COLORS[suit]}`
                          }
                        `}
                      >
                        {SUIT_SYMBOLS[suit]}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">カードを選択</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 複数カード選択用（ボード用）
type BoardPickerProps = {
  value: Card[];
  onChange: (cards: Card[]) => void;
  maxCards?: number;
  usedCards?: Card[];
};

export function BoardPicker({ value, onChange, maxCards = 5, usedCards = [] }: BoardPickerProps) {
  const allUsedCards = [...usedCards, ...value];

  const handleCardChange = (index: number, card: Card | null) => {
    const newCards = [...value];
    if (card) {
      newCards[index] = card;
    } else {
      newCards.splice(index, 1);
    }
    onChange(newCards);
  };

  const addCard = (card: Card) => {
    if (value.length < maxCards) {
      onChange([...value, card]);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {value.map((card, index) => (
        <CardPicker
          key={index}
          value={card}
          onChange={(c) => handleCardChange(index, c)}
          usedCards={allUsedCards.filter((_, i) => i !== index)}
          size="sm"
        />
      ))}
      {value.length < maxCards && (
        <CardPicker
          value={null}
          onChange={(c) => c && addCard(c)}
          usedCards={allUsedCards}
          size="sm"
        />
      )}
    </div>
  );
}
