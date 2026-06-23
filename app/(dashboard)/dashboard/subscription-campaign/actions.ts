"use server";

import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIPTION_CAMPAIGN } from "@/lib/subscription-campaign";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = new Set(["entered", "story_confirmed", "eligible", "won", "invalid"]);

export async function updateCampaignEntryStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id");
  const status = formData.get("status");
  const adminNote = formData.get("adminNote");

  if (typeof id !== "string" || typeof status !== "string" || !VALID_STATUSES.has(status)) {
    throw new Error("Invalid request");
  }

  const updateData: Record<string, string | null> = {
    status,
    admin_note: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : null,
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
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/subscription-campaign");
}
