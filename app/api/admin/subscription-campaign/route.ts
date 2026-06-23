import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIPTION_CAMPAIGN } from "@/lib/subscription-campaign";
import { NextResponse } from "next/server";

const VALID_STATUSES = new Set(["entered", "story_confirmed", "eligible", "won", "invalid"]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, status, adminNote } = body as {
    id?: string;
    status?: string;
    adminNote?: string;
  };

  if (!id || !status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updateData: Record<string, string | null> = {
    status,
    admin_note: adminNote?.trim() ? adminNote.trim() : null,
  };

  const now = new Date();
  if (status === "story_confirmed") {
    const eligibleAt = new Date(now.getTime() + SUBSCRIPTION_CAMPAIGN.storyHoldHours * 60 * 60 * 1000);
    updateData.story_checked_at = now.toISOString();
    updateData.eligible_at = eligibleAt.toISOString();
  }

  if (status === "eligible") {
    updateData.story_checked_at = now.toISOString();
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("subscription_campaign_entries")
    .update(updateData)
    .eq("id", id)
    .eq("campaign_key", SUBSCRIPTION_CAMPAIGN.key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
