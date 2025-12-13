-- Blog posts (運営投稿)

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  content_md TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx
  ON blog_posts (status, published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 公開記事のみ閲覧可（anon/authenticated）
DROP POLICY IF EXISTS "Public can read published blog_posts" ON blog_posts;
CREATE POLICY "Public can read published blog_posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

-- 運営のCRUDはアプリ側で管理（Service Roleを使用するためRLS対象外）
