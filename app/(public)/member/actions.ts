"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "ログインしてください" };
    }

    const displayName = formData.get("displayName") as string;
    const avatarFile = formData.get("avatar") as File;

    let avatarUrl = null;

    // 画像がアップロードされた場合
    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return { error: `画像のアップロードに失敗しました: ${uploadError.message}` };
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      avatarUrl = publicUrl;
    }

    const updateData: { display_name: string; avatar_url?: string } = {
      display_name: displayName,
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ...updateData,
      });

    if (error) {
      console.error("Profile update error:", error);
      return { error: `プロフィールの保存に失敗しました: ${error.message}` };
    }

    revalidatePath("/member/profile");
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "プロフィールの更新に失敗しました" };
  }
}


