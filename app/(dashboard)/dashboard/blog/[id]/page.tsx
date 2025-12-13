import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import BlogPostForm from "../form";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = (data?.user?.email ?? "").toLowerCase();

  if (!email || email !== ADMIN_EMAIL) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-600">
        権限がありません。
      </div>
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700">
        <div className="font-bold text-gray-900">環境変数が不足しています</div>
        <div className="mt-2 text-gray-600">
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> が未設定のため、ブログ編集ができません。
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: post, error } = await admin
    .from("blog_posts")
    .select("id,title,slug,excerpt,category,cover_image_url,content_md,status,published_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    const message =
      typeof (error as any)?.message === "string" ? (error as any).message : "";
    const code = typeof (error as any)?.code === "string" ? (error as any).code : "";
    const isMissingTable =
      code === "42P01" ||
      message.includes("relation") ||
      message.includes("does not exist") ||
      message.includes("blog_posts");

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700">
        <div className="font-bold text-gray-900">記事の取得に失敗しました</div>
        <div className="mt-2 text-gray-600">
          {isMissingTable
            ? "Supabaseに blog_posts テーブルがまだ作成されていません。"
            : "Supabaseからの取得に失敗しました。"}
        </div>
        {isMissingTable && (
          <div className="mt-2 text-gray-600">
            <code className="font-mono">database/create_blog_posts.sql</code> を Supabase の SQL Editor で実行してください。
          </div>
        )}
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return <BlogPostForm post={post} />;
}
