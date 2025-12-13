import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

async function isAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = (data?.user?.email ?? "").toLowerCase();
  return Boolean(email && email === ADMIN_EMAIL);
}

export default async function DashboardBlogPage() {
  const ok = await isAdmin();
  if (!ok) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-600">
        権限がありません。
      </div>
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ブログ管理</h1>
            <div className="text-xs text-gray-500 mt-1">運営のみ：下書き/公開の切替ができます</div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700">
          <div className="font-bold text-gray-900">環境変数が不足しています</div>
          <div className="mt-2 text-gray-600">
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> が未設定のため、ブログ管理（下書き含む取得）ができません。
          </div>
          <div className="mt-2 text-gray-600">
            開発環境の場合は <code className="font-mono">.env</code> に設定して再起動してください。
          </div>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select("id,title,slug,category,status,published_at,updated_at")
    .order("updated_at", { ascending: false });

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
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ブログ管理</h1>
            <div className="text-xs text-gray-500 mt-1">運営のみ：下書き/公開の切替ができます</div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700">
          <div className="font-bold text-gray-900">ブログの準備が必要です</div>
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
      </div>
    );
  }

  const posts = data || [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ブログ管理</h1>
          <div className="text-xs text-gray-500 mt-1">運営のみ：下書き/公開の切替ができます</div>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          ＋ 追加
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-600">
          記事がありません。
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {posts.map((p: any) => (
              <Link key={p.id} href={`/dashboard/blog/${p.id}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                        {p.category || "other"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          p.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {p.status === "published" ? "公開" : "下書き"}
                      </span>
                      <span className="truncate">/{p.slug}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {p.updated_at
                      ? new Date(p.updated_at).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
