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
    <div className="max-w-md md:max-w-4xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
          <h1 className="text-2xl font-bold text-gray-900">ブログ</h1>
        </div>
        <p className="text-sm text-gray-600">
          大会インタビュー・大会レビュー・ポーカー理論・ツール紹介
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <Link
            href="/blog"
            className={`px-3 py-2 rounded-full text-sm font-bold border transition-colors ${
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
              className={`px-3 py-2 rounded-full text-sm font-bold border transition-colors ${
                selectedCategory === c
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <div className="text-lg font-bold text-gray-900">準備中。</div>
          <div className="mt-1 text-sm text-gray-600">記事が公開されるまでお待ちください</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${encodeURIComponent(p.slug)}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              {p.cover_image_url ? (
                <div className="w-full h-44 sm:h-52 bg-gray-100 border-b border-gray-200 overflow-hidden">
                  <img
                    src={p.cover_image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full h-3 bg-gray-100" />
              )}

              <div className="p-5">
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

                <div className="mt-2 text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                  {p.title}
                </div>
                {p.excerpt && (
                  <div className="mt-2 text-sm text-gray-600 line-clamp-3">{p.excerpt}</div>
                )}

                <div className="mt-4 text-sm font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
                  続きを読む →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
