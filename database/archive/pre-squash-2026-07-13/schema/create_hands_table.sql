-- ハンド記録・共有機能用テーブル

-- 1. ハンド記録テーブル
CREATE TABLE IF NOT EXISTS hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ゲーム基本情報
  game_type TEXT NOT NULL DEFAULT 'NLH', -- NLH, PLO, PLO5
  sb INTEGER NOT NULL DEFAULT 100,
  bb INTEGER NOT NULL DEFAULT 200,
  ante INTEGER DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 9,
  
  -- Heroの情報
  hero_position TEXT NOT NULL, -- SB, BB, UTG, UTG1, MP, MP1, HJ, CO, BTN
  hero_card1_rank TEXT NOT NULL, -- A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
  hero_card1_suit TEXT NOT NULL, -- s, h, d, c (spade, heart, diamond, club)
  hero_card2_rank TEXT NOT NULL,
  hero_card2_suit TEXT NOT NULL,
  hero_stack_bb NUMERIC(10,2) NOT NULL DEFAULT 100,
  
  -- ボード（JSON配列）
  board JSONB DEFAULT '[]'::jsonb, -- [{"rank": "K", "suit": "s"}, ...]
  
  -- 各ストリートのアクション（JSON配列）
  preflop_actions JSONB DEFAULT '[]'::jsonb,
  flop_actions JSONB DEFAULT '[]'::jsonb,
  turn_actions JSONB DEFAULT '[]'::jsonb,
  river_actions JSONB DEFAULT '[]'::jsonb,
  
  -- 結果
  result TEXT, -- win, lose, split, unknown
  profit_bb NUMERIC(10,2),
  
  -- メモ・公開設定
  memo TEXT,
  title TEXT, -- ハンドのタイトル（任意）
  is_public BOOLEAN NOT NULL DEFAULT true,
  
  -- Villainのハンド（ショーダウン時）
  villain_cards JSONB, -- [{"rank": "Q", "suit": "h"}, {"rank": "Q", "suit": "s"}]
  
  -- メタデータ
  shop_id UUID REFERENCES shops(id), -- どの店舗でのハンドか（任意）
  tournament_name TEXT, -- トーナメント名（任意）
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. インデックス
CREATE INDEX IF NOT EXISTS hands_user_id_idx ON hands(user_id);
CREATE INDEX IF NOT EXISTS hands_created_at_idx ON hands(created_at DESC);
CREATE INDEX IF NOT EXISTS hands_is_public_idx ON hands(is_public) WHERE is_public = true;

-- 3. RLSポリシー
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;

-- 自分のハンドは全操作可能
DROP POLICY IF EXISTS "Users can manage their own hands" ON hands;
CREATE POLICY "Users can manage their own hands" ON hands
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 公開ハンドは誰でも閲覧可能
DROP POLICY IF EXISTS "Anyone can view public hands" ON hands;
CREATE POLICY "Anyone can view public hands" ON hands
  FOR SELECT
  USING (is_public = true);

-- 4. ハンドへのコメント（将来用）
CREATE TABLE IF NOT EXISTS hand_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_id UUID REFERENCES hands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hand_comments_hand_id_idx ON hand_comments(hand_id);

ALTER TABLE hand_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments on public hands" ON hand_comments;
CREATE POLICY "Anyone can view comments on public hands" ON hand_comments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_comments.hand_id AND hands.is_public = true)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Authenticated users can add comments" ON hand_comments;
CREATE POLICY "Authenticated users can add comments" ON hand_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON hand_comments;
CREATE POLICY "Users can delete their own comments" ON hand_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. いいね機能（将来用）
CREATE TABLE IF NOT EXISTS hand_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_id UUID REFERENCES hands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hand_id, user_id)
);

CREATE INDEX IF NOT EXISTS hand_likes_hand_id_idx ON hand_likes(hand_id);

ALTER TABLE hand_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own likes" ON hand_likes;
CREATE POLICY "Users can manage their own likes" ON hand_likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view likes count" ON hand_likes;
CREATE POLICY "Anyone can view likes count" ON hand_likes
  FOR SELECT
  USING (true);
