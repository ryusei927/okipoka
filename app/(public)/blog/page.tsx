import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function normalizeCategory(raw: unknown): string {
  const s = String(raw ?? "").trim();
  return s || "other";
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const selectedCategory = typeof sp.category === "string" ? sp.category : "";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,category,cover_image_url,published_at,created_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  const posts = (data || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: normalizeCategory(p.category),
    cover_image_url: p.cover_image_url,
    published_at: p.published_at,
  }));

  const categories = Array.from(new Set(posts.map((p) => p.category))).sort((a, b) =>
    a.localeCompare(b, "ja")
  );

  const filtered = selectedCategory
    ? posts.filter((p) => p.category === selectedCategory)
    : posts;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">ブログ</h1>
        <p className="text-sm text-gray-600">
          大会インタビュー・大会レビュー・ポーカー理論・ツール紹介
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-2">
        <Link
          href="/blog"
          className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
            selectedCategory
              ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              : "bg-orange-500 text-white border-orange-500"
          }`}
        >
          すべて
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/blog?category=${encodeURIComponent(c)}`}
            className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
              selectedCategory === c
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-600">
          記事がありません。
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${encodeURIComponent(p.slug)}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:bg-gray-50 transition-colors"
            >
              {p.cover_image_url && (
                <div className="mb-3">
                  <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={p.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                  {p.category}
                </span>
                {p.published_at && (
                  <span>
                    {new Date(p.published_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="mt-2 font-bold text-gray-900">{p.title}</div>
              {p.excerpt && (
                <div className="mt-1 text-sm text-gray-600 line-clamp-2">{p.excerpt}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
