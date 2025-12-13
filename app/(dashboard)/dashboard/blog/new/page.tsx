import { createClient } from "@/lib/supabase/server";
import BlogPostForm from "../form";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

export default async function NewBlogPostPage() {
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

  return <BlogPostForm />;
}
