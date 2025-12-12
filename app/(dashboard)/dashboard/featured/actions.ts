"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFeaturedItem(formData: FormData) {
  const supabase = await createClient();

  const imageFile = formData.get("image") as File;
  const linkUrl = formData.get("linkUrl") as string;
  const altText = formData.get("altText") as string;

  if (!imageFile) {
    throw new Error("画像が必要です");
  }

  // 画像アップロード
  const fileExt = imageFile.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `featured/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("ads") // adsバケットを借用
    .upload(filePath, imageFile);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("画像のアップロードに失敗しました");
  }

  const { data: { publicUrl } } = supabase.storage
    .from("ads")
    .getPublicUrl(filePath);

  // DB保存
  // 複数表示に対応するため、既存のPRを非アクティブにする処理を削除
  /*
  await supabase
    .from("featured_items")
    .update({ is_active: false })
    .eq("is_active", true);
  */

  const { error: dbError } = await supabase
    .from("featured_items")
    .insert({
      image_url: publicUrl,
      link_url: linkUrl || null,
      alt_text: altText || null,
      is_active: true,
    });

  if (dbError) {
    console.error("DB error:", dbError);
    throw new Error("データベースへの保存に失敗しました");
  }

  revalidatePath("/dashboard/featured");
  revalidatePath("/");
}

export async function deleteFeaturedItem(id: string) {
  const supabase = await createClient();
  
  await supabase.from("featured_items").delete().eq("id", id);
  
  revalidatePath("/dashboard/featured");
  revalidatePath("/");
}

export async function toggleFeaturedItemStatus(id: string, isActive: boolean) {
  const supabase = await createClient();

  // 複数表示に対応するため、他を非アクティブにする処理を削除
  /*
  if (isActive) {
    // アクティブにする場合、他を非アクティブにする
    await supabase
      .from("featured_items")
      .update({ is_active: false })
      .neq("id", id);
  }
  */

  await supabase
    .from("featured_items")
    .update({ is_active: isActive })
    .eq("id", id);

  revalidatePath("/dashboard/featured");
  revalidatePath("/");
}

export async function updateFeaturedItem(id: string, formData: FormData) {
  const supabase = await createClient();

  const imageFile = formData.get("image") as File;
  const linkUrl = formData.get("linkUrl") as string;
  const altText = formData.get("altText") as string;

  const updates: any = {
    link_url: linkUrl || null,
    alt_text: altText || null,
    updated_at: new Date().toISOString(),
  };

  if (imageFile && imageFile.size > 0) {
    // 画像アップロード
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `featured/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("ads")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("画像のアップロードに失敗しました");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("ads")
      .getPublicUrl(filePath);
      
    updates.image_url = publicUrl;
  }

  const { error } = await supabase
    .from("featured_items")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Update error:", error);
    throw new Error("更新に失敗しました");
  }

  revalidatePath("/dashboard/featured");
  revalidatePath("/");
}
