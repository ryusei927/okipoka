import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title,excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .maybeSingle();

  if (!data) return {};
  return {
    title: data.title ? `${data.title} | OKIPOKA` : "OKIPOKA",
    description: data.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("title,excerpt,category,cover_image_url,content_md,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .maybeSingle();

  if (error) {
    console.error(error);
  }
  if (!data) {
    notFound();
  }

  const publishedAt = data.published_at
    ? new Date(data.published_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  return (
    <article className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/blog" className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
          ← ブログ一覧
        </Link>
      </div>

      <header className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
            {data.category || "other"}
          </span>
          {publishedAt && <span>{publishedAt}</span>}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
        {data.excerpt && <p className="text-sm text-gray-600">{data.excerpt}</p>}

        {data.cover_image_url && (
          <div className="pt-3">
            <div className="w-full h-56 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={data.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {data.content_md || ""}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
