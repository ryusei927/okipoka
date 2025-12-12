"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function upsertShop(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const plan = formData.get("plan") as "free" | "business" | "premium";
  const imageUrl = formData.get("imageUrl") as string; // クライアント側でアップロード済みのURLを受け取る
  const address = formData.get("address") as string;
  const openingHours = formData.get("openingHours") as string;
  const googleMapUrl = formData.get("googleMapUrl") as string;
  const instagramUrl = formData.get("instagramUrl") as string;
  const twitterUrl = formData.get("twitterUrl") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const area = formData.get("area") as string;

  const data = {
    name,
    slug,
    plan,
    area: area || "那覇",
    image_url: imageUrl || null,
    address: address || null,
    opening_hours: openingHours || null,
    google_map_url: googleMapUrl || null,
    instagram_url: instagramUrl || null,
    twitter_url: twitterUrl || null,
    website_url: websiteUrl || null,
  };

  let error;
  if (id) {
    // 更新
    const result = await supabase.from("shops").update(data).eq("id", id);
    error = result.error;
  } else {
    // 新規作成
    const result = await supabase.from("shops").insert(data);
    error = result.error;
  }

  if (error) {
    console.error(error);
    throw new Error("店舗の保存に失敗しました");
  }

  revalidatePath("/dashboard/shops");
  revalidatePath("/");
  redirect("/dashboard/shops");
}

export async function deleteShop(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("店舗IDが必要です");
  }

  const { error } = await supabase.from("shops").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("店舗の削除に失敗しました");
  }

  redirect("/dashboard/shops");
}
