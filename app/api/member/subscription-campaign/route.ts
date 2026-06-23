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
import { NextResponse } from "next/server";

function isMissingCampaignSchemaError(error?: { message?: string; code?: string } | null) {
  return (
    error?.code === "PGRST204" ||
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("Could not find the table")
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  if (!isSubscriptionCampaignActive()) {
    return NextResponse.json({ error: "キャンペーン期間外です。" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const instagramUsername = normalizeInstagramUsername(body.instagramUsername ?? null);
  const campaignConsent = Boolean(body.campaignConsent);

  if (!isValidInstagramUsername(instagramUsername)) {
    return NextResponse.json({ error: "InstagramユーザーIDを正しく入力してください。" }, { status: 400 });
  }

  if (!campaignConsent) {
    return NextResponse.json({ error: "応募条件への同意が必要です。" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("subscription_status,payment_method,subscription_expires_at")
    .eq("id", user.id)
    .single();

  if (profileError || !isActiveSubscriptionProfile(profile)) {
    return NextResponse.json({ error: "サブスク登録中のユーザーのみ応募できます。" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await admin
    .from("subscription_campaign_entries")
    .select("id")
    .eq("campaign_key", SUBSCRIPTION_CAMPAIGN.key)
    .eq("user_id", user.id)
    .maybeSingle();

  if (isMissingCampaignSchemaError(existingError)) {
    console.error("Subscription campaign schema is not ready:", existingError);
    return NextResponse.json(
      { error: "現在、応募受付の準備中です。時間をおいて再度お試しください。" },
      { status: 503 }
    );
  }

  if (existingError) {
    return NextResponse.json({ error: "応募状況の確認に失敗しました。" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ success: true, existing: true });
  }

  let lastError: { message?: string; code?: string } | null = null;
  for (let i = 0; i < 5; i += 1) {
    const consentedAt = new Date().toISOString();
    const { error } = await admin.from("subscription_campaign_entries").insert({
      campaign_key: SUBSCRIPTION_CAMPAIGN.key,
      user_id: user.id,
      instagram_username: instagramUsername,
      draw_number: generateDrawNumber(),
      status: "entered",
      publicity_consent_at: consentedAt,
      prize_contact_consent_at: consentedAt,
    });

    if (!error) {
      return NextResponse.json({ success: true });
    }

    lastError = error;
    if (error.code !== "23505") break;
  }

  if (isMissingCampaignSchemaError(lastError)) {
    console.error("Subscription campaign schema is not ready:", lastError);
    return NextResponse.json(
      { error: "現在、応募受付の準備中です。時間をおいて再度お試しください。" },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "応募に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
}
