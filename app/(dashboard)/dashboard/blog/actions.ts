"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type BlogPostState = {
  message?: string;
  error?: string;
};

const initialAdminEmail = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error(error);
  }
  const user = data?.user;
  const email = (user?.email ?? "").toLowerCase();
  if (!email || email !== initialAdminEmail) {
    throw new Error("権限がありません");
  }
}

function requireServiceRoleKey() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY が未設定です（ブログ管理に必要）");
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function upsertBlogPost(prevState: BlogPostState, formData: FormData): Promise<BlogPostState> {
  try {
    await requireAdmin();
    requireServiceRoleKey();

    const id = String(formData.get("id") ?? "").trim() || null;
    const title = String(formData.get("title") ?? "").trim();
    const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
    const category = String(formData.get("category") ?? "").trim() || "other";
    const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;
    const content_md = String(formData.get("content_md") ?? "").trim();
    const status = String(formData.get("status") ?? "draft").trim() === "published" ? "published" : "draft";

    let slug = String(formData.get("slug") ?? "").trim();
    if (!slug) {
      slug = slugify(title);
    }

    if (!title) return { error: "タイトルは必須です" };
    if (!slug) return { error: "slug は必須です（英数字推奨）" };
    if (!content_md) return { error: "本文は必須です" };

    const now = new Date().toISOString();

    const admin = createAdminClient();

    const payload: any = {
      slug,
      title,
      excerpt,
      category,
      cover_image_url,
      content_md,
      status,
      updated_at: now,
    };

    if (status === "published") {
      payload.published_at = String(formData.get("published_at") ?? "").trim() || now;
    } else {
      payload.published_at = null;
    }

    if (id) {
      const { error } = await admin.from("blog_posts").update(payload).eq("id", id);
      if (error) {
        console.error(error);
        if (String(error.message || "").includes("duplicate") || String(error.code || "").includes("23505")) {
          return { error: "slug が重複しています" };
        }
        return { error: "保存に失敗しました" };
      }
    } else {
      const { error } = await admin.from("blog_posts").insert({ ...payload, created_at: now });
      if (error) {
        console.error(error);
        if (String(error.message || "").includes("duplicate") || String(error.code || "").includes("23505")) {
          return { error: "slug が重複しています" };
        }
        return { error: "保存に失敗しました" };
      }
    }

    revalidatePath("/blog");
    revalidatePath("/dashboard/blog");
    redirect("/dashboard/blog");
  } catch (e: any) {
    // redirect() は例外で制御されるため、ここで握りつぶすと UI に NEXT_REDIRECT が出る
    if (typeof e?.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return { error: e?.message || "保存に失敗しました" };
  }
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  requireServiceRoleKey();
  const admin = createAdminClient();

  const { error } = await admin.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.error(error);
    throw new Error("削除に失敗しました");
  }

  revalidatePath("/blog");
  revalidatePath("/dashboard/blog");
}

export async function uploadBlogImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdmin();
    requireServiceRoleKey();

    const file = formData.get("image") as File | null;
    if (!file || file.size <= 0) return { error: "画像ファイルを選択してください" };
    if (!file.type?.startsWith("image/")) return { error: "画像ファイルのみアップロードできます" };

    // 10MB 目安（必要なら調整）
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) return { error: "画像が大きすぎます（10MB以下にしてください）" };

    const admin = createAdminClient();

    const fileExtFromName = (file.name.split(".").pop() || "").toLowerCase();
    const fileExtFromType = (file.type.split("/").pop() || "").toLowerCase();
    const ext = (fileExtFromName || fileExtFromType || "png").replace(/[^a-z0-9]/g, "");
    const random = Math.random().toString(36).slice(2);
    const path = `blog/${Date.now()}-${random}.${ext || "png"}`;

    const { error: uploadError } = await admin.storage
      .from("blog-images")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });

    if (uploadError) {
      return { error: uploadError.message || "画像のアップロードに失敗しました" };
    }

    const { data } = admin.storage.from("blog-images").getPublicUrl(path);
    const url = data?.publicUrl;
    if (!url) return { error: "画像URLの取得に失敗しました" };
    return { url };
  } catch (e: any) {
    return { error: e?.message || "画像のアップロードに失敗しました" };
  }
}
