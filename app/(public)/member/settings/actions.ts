"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "パスワードが一致しません" };
  }

  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください" };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Password update error:", error);
    return { error: error.message };
  }

  revalidatePath("/member");
  return { success: true };
}
