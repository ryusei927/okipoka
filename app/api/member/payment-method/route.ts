import { createClient } from "@/lib/supabase/server";
import { getCardOnFile } from "@/lib/square";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("square_customer_id, subscription_id, subscription_status, payment_method")
    .eq("id", user.id)
    .single();

  const status = profile?.subscription_status;
  const isCardMember =
    (status === "active" || status === "canceling") &&
    profile?.payment_method !== "cash" &&
    !!profile?.square_customer_id;

  if (!isCardMember) {
    return NextResponse.json({ card: null });
  }

  const card = await getCardOnFile({
    subscriptionId: profile?.subscription_id ?? null,
    customerId: profile?.square_customer_id ?? null,
  });

  return NextResponse.json({ card });
}
