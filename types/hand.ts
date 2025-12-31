// ハンド記録用の型定義

export type Suit = 's' | 'h' | 'd' | 'c'; // spade, heart, diamond, club
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export type Card = {
  rank: Rank;
  suit: Suit;
};

export type Position = 'SB' | 'BB' | 'UTG' | 'UTG1' | 'MP' | 'MP1' | 'HJ' | 'CO' | 'BTN';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export type Action = {
  position: Position | 'Hero';
  action: ActionType;
  amount_bb?: number;
};

export type GameType = 'NLH' | 'PLO' | 'PLO5';

export type HandResult = 'win' | 'lose' | 'split' | 'unknown';

export type Hand = {
  id: string;
  user_id: string;
  
  // ゲーム基本情報
  game_type: GameType;
  sb: number;
  bb: number;
  ante: number;
  max_players: number;
  
  // Heroの情報
  hero_position: Position;
  hero_card1_rank: Rank;
  hero_card1_suit: Suit;
  hero_card2_rank: Rank;
  hero_card2_suit: Suit;
  hero_stack_bb: number;
  
  // ボード
  board: Card[];
  
  // 各ストリートのアクション
  preflop_actions: Action[];
  flop_actions: Action[];
  turn_actions: Action[];
  river_actions: Action[];
  
  // 結果
  result: HandResult | null;
  profit_bb: number | null;
  
  // メタ
  memo: string | null;
  title: string | null;
  is_public: boolean;
  villain_cards: Card[] | null;
  shop_id: string | null;
  tournament_name: string | null;
  
  created_at: string;
  updated_at: string;
};

// ハンド作成時の入力型
export type HandInput = Omit<Hand, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// 表示用のカード情報
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  s: 'text-slate-900',
  h: 'text-red-500',
  d: 'text-blue-500',
  c: 'text-green-600',
};

export const POSITIONS_9MAX: Position[] = ['SB', 'BB', 'UTG', 'UTG1', 'MP', 'MP1', 'HJ', 'CO', 'BTN'];
export const POSITIONS_8MAX: Position[] = ['SB', 'BB', 'UTG', 'UTG1', 'MP', 'HJ', 'CO', 'BTN'];
export const POSITIONS_7MAX: Position[] = ['SB', 'BB', 'UTG', 'MP', 'HJ', 'CO', 'BTN'];
export const POSITIONS_6MAX: Position[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];
export const POSITIONS_5MAX: Position[] = ['SB', 'BB', 'UTG', 'CO', 'BTN'];
export const POSITIONS_4MAX: Position[] = ['SB', 'BB', 'CO', 'BTN'];
export const POSITIONS_3MAX: Position[] = ['SB', 'BB', 'BTN'];
export const POSITIONS_HU: Position[] = ['SB', 'BB'];

// プレイヤー数に応じたポジションを取得
export function getPositionsForTableSize(maxPlayers: number): Position[] {
  switch (maxPlayers) {
    case 2: return POSITIONS_HU;
    case 3: return POSITIONS_3MAX;
    case 4: return POSITIONS_4MAX;
    case 5: return POSITIONS_5MAX;
    case 6: return POSITIONS_6MAX;
    case 7: return POSITIONS_7MAX;
    case 8: return POSITIONS_8MAX;
    default: return POSITIONS_9MAX;
  }
}

export const POSITION_LABELS: Record<Position, string> = {
  SB: 'SB',
  BB: 'BB',
  UTG: 'UTG',
  UTG1: 'UTG+1',
  MP: 'MP',
  MP1: 'MP+1',
  HJ: 'HJ',
  CO: 'CO',
  BTN: 'BTN',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  fold: 'Fold',
  check: 'Check',
  call: 'Call',
  bet: 'Bet',
  raise: 'Raise',
  'all-in': 'All-in',
};

// カードを文字列として表示（例: "A♠"）
export function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

// カード2枚を表示（例: "A♠ K♦"）
export function formatHoleCards(card1: Card, card2: Card): string {
  return `${formatCard(card1)} ${formatCard(card2)}`;
}

// ボードを表示（例: "K♠ 7♥ 2♦"）
export function formatBoard(board: Card[]): string {
  return board.map(formatCard).join(' ');
}

// ストリートのアクションからポットサイズを計算
export function calculatePotAfterStreet(actions: Action[], initialPot: number = 0): number {
  let pot = initialPot;
  const contributions = new Map<string, number>();
  
  for (const action of actions) {
    const pos = action.position;
    const currentContribution = contributions.get(pos) || 0;
    
    if (action.action === 'call' || action.action === 'bet' || action.action === 'raise' || action.action === 'all-in') {
      const amount = action.amount_bb || 0;
      // 追加で入れた分だけポットに加算
      const additionalAmount = amount - currentContribution;
      if (additionalAmount > 0) {
        pot += additionalAmount;
        contributions.set(pos, amount);
      }
    }
  }
  
  return pot;
}

// プリフロップのポット計算（SB/BBを考慮）
export function calculatePreflopPot(actions: Action[], maxPlayers: number, ante: number = 0): number {
  // 初期ポット: SB(0.5BB) + BB(1BB) + アンティ
  let pot = 1.5 + (ante * maxPlayers);
  
  // 各プレイヤーの最大コントリビューションを追跡
  const contributions = new Map<string, number>();
  contributions.set('SB', 0.5);
  contributions.set('BB', 1);
  
  for (const action of actions) {
    const pos = action.position;
    const currentContribution = contributions.get(pos) || 0;
    
    if (action.action === 'call' || action.action === 'raise' || action.action === 'all-in') {
      const amount = action.amount_bb || 0;
      const additionalAmount = amount - currentContribution;
      if (additionalAmount > 0) {
        pot += additionalAmount;
        contributions.set(pos, amount);
      }
    }
  }
  
  return pot;
}
