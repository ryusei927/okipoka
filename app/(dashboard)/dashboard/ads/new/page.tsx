import { createClient } from "@/lib/supabase/server";
import AdForm from "../form";

export default async function NewAdPage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string }>;
}) {
  const { sub } = await searchParams;

  let prefill:
    | { adSubscriptionId: string; title?: string; type?: string; linkUrl?: string; businessName?: string }
    | undefined;

  if (sub) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ad_subscriptions")
      .select("id, business_name, desired_ad_type, link_url")
      .eq("id", sub)
      .single();

    if (data) {
      prefill = {
        adSubscriptionId: data.id,
        businessName: data.business_name ?? undefined,
        title: data.business_name ?? undefined,
        type: data.desired_ad_type ?? undefined,
        linkUrl: data.link_url ?? undefined,
      };
    }
  }

  return <AdForm prefill={prefill} />;
}
