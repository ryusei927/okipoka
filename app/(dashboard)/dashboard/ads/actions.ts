"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AdState = {
  message?: string;
  error?: string;
};

export async function upsertAd(prevState: AdState, formData: FormData): Promise<AdState> {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const linkUrl = formData.get("linkUrl") as string;
  const type = formData.get("type") as string;
  const priority = formData.get("priority") as string;
  const isActive = formData.get("isActive") === "on";
  const imageFile = formData.get("image") as File;

  let imageUrl = formData.get("currentImageUrl") as string;

  // 画像アップロード処理
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ads')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error(uploadError);
      return { error: "画像のアップロードに失敗しました" };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ads')
      .getPublicUrl(filePath);
      
    imageUrl = publicUrl;
  }

  const data = {
    title,
    link_url: linkUrl || null,
    type,
    priority: 0, // ランダム表示になったため優先度は0固定
    is_active: isActive,
    image_url: imageUrl,
  };

  let error;
  if (id) {
    const result = await supabase.from("ads").update(data).eq("id", id);
    error = result.error;
  } else {
    if (!imageUrl) {
        return { error: "画像は必須です" };
    }
    const result = await supabase.from("ads").insert(data);
    error = result.error;
  }

  if (error) {
    console.error(error);
    return { error: "保存に失敗しました" };
  }

  revalidatePath("/dashboard/ads");
  revalidatePath("/");
  redirect("/dashboard/ads");
}

export async function deleteAd(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) throw new Error("削除に失敗しました");
  revalidatePath("/dashboard/ads");
  revalidatePath("/");
}
