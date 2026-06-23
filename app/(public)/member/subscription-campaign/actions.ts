"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_CAMPAIGN,
  generateDrawNumber,
  isActiveSubscriptionProfile,
  isSubscriptionCampaignActive,
  isValidInstagramUsername,
  normalizeInstagramUsername,
} from "@/lib/subscription-campaign";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectWithError(message: string) {
  redirect(`/member/subscription-campaign?error=${encodeURIComponent(message)}`);
}

function isMissingCampaignTableError(error?: { message?: string; code?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("Could not find the table")
  );
}

export async function createSubscriptionCampaignEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isSubscriptionCampaignActive()) {
    redirectWithError("キャンペーン期間外です。");
  }

  const instagramUsername = normalizeInstagramUsername(formData.get("instagramUsername"));
  if (!isValidInstagramUsername(instagramUsername)) {
    redirectWithError("InstagramユーザーIDを正しく入力してください。");
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("subscription_status,payment_method,subscription_expires_at")
    .eq("id", user.id)
    .single();

  if (profileError || !isActiveSubscriptionProfile(profile)) {
    redirectWithError("サブスク登録中のユーザーのみ応募できます。");
  }

  const { data: existing, error: existingError } = await admin
    .from("subscription_campaign_entries")
    .select("id")
    .eq("campaign_key", SUBSCRIPTION_CAMPAIGN.key)
    .eq("user_id", user.id)
    .maybeSingle();

  if (isMissingCampaignTableError(existingError)) {
    redirectWithError("キャンペーン応募の準備中です。時間をおいて再度お試しください。");
  }

  if (existingError) {
    redirectWithError("応募状況の確認に失敗しました。時間をおいて再度お試しください。");
  }

  if (existing) {
    redirect("/member/subscription-campaign");
  }

  let lastError: { message?: string; code?: string } | null = null;
  for (let i = 0; i < 5; i += 1) {
    const { error } = await admin.from("subscription_campaign_entries").insert({
      campaign_key: SUBSCRIPTION_CAMPAIGN.key,
      user_id: user.id,
      instagram_username: instagramUsername,
      draw_number: generateDrawNumber(),
      status: "entered",
    });

    if (!error) {
      revalidatePath("/member");
      revalidatePath("/member/subscription-campaign");
      revalidatePath("/dashboard/subscription-campaign");
      redirect("/member/subscription-campaign?created=1");
    }

    lastError = error;
    if (error.code !== "23505") break;
  }

  if (isMissingCampaignTableError(lastError)) {
    redirectWithError("キャンペーン応募の準備中です。時間をおいて再度お試しください。");
  }

  redirectWithError("応募に失敗しました。時間をおいて再度お試しください。");
}
