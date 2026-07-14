import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { interviews } from "@/lib/interviews";
import { recruitments } from "@/lib/recruitments";
import { SITE_URL } from "@/lib/seo";

// 1時間ごとに再生成（トーナメントは日々更新されるため）
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shops`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/photos`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/interviews`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/premium`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/advertise`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/recruit`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const interviewPages: MetadataRoute.Sitemap = interviews.map((interview) => ({
    url: `${SITE_URL}/interviews/${interview.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const recruitPages: MetadataRoute.Sitemap = recruitments.map((recruit) => ({
    url: `${SITE_URL}/recruit/${recruit.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // 動的ページ（トーナメント・フォトアルバム）はDBから取得。
  // 失敗しても静的ページだけのsitemapを返す。
  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [{ data: tournaments }, { data: albums }] = await Promise.all([
      supabase
        .from("tournaments")
        .select("id, start_at")
        .gte("start_at", thirtyDaysAgo)
        .order("start_at", { ascending: true })
        .limit(1000),
      supabase
        .from("photo_albums")
        .select("id")
        .eq("is_published", true)
        .limit(500),
    ]);

    dynamicPages = [
      ...(tournaments ?? []).map((t) => ({
        url: `${SITE_URL}/tournaments/${t.id}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...(albums ?? []).map((a) => ({
        url: `${SITE_URL}/photos/${a.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("sitemap: failed to fetch dynamic pages", error);
  }

  return [...staticPages, ...interviewPages, ...recruitPages, ...dynamicPages];
}
