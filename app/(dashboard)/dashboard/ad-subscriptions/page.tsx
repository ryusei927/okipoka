import { createClient } from "@/lib/supabase/server";
import { getSubscriptionBilling } from "@/lib/square";
import { AdSubscriptionRow, type AdSub, type LinkedAd } from "./AdSubscriptionRow";

export const dynamic = "force-dynamic";

export default async function AdSubscriptionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  const subscriptions = (data ?? []) as AdSub[];

  // 紐づく広告クリエイティブを取得（申込から自動生成された下書き広告など）
  const subIds = subscriptions.map((s) => s.id);
  const adBySubId = new Map<string, LinkedAd>();
  if (subIds.length > 0) {
    const { data: ads } = await supabase
      .from("ads")
      .select("id, title, image_url, link_url, type, is_active, ad_subscription_id")
      .in("ad_subscription_id", subIds);
    for (const ad of (ads ?? []) as (LinkedAd & { ad_subscription_id: string })[]) {
      if (ad.ad_subscription_id) adBySubId.set(ad.ad_subscription_id, ad);
    }
  }

  // 各サブスクの請求情報（次回更新日・カード）を Square から取得
  const billings = await Promise.all(
    subscriptions.map((sub) =>
      sub.square_subscription_id
        ? getSubscriptionBilling(sub.square_subscription_id)
        : Promise.resolve(null)
    )
  );

  // 有効件数は Square のライブ状態を優先して数える
  const activeCount = subscriptions.filter((sub, i) => {
    const status = billings[i]?.status ?? sub.subscription_status;
    return status === "active" || status === "canceling";
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">広告申込</h1>
          <p className="mt-1 text-sm text-gray-500">
            サイトの申込フォーム（/advertise）から登録された広告主の一覧です。
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900">{activeCount}</div>
          <div className="text-xs text-gray-500">有効な契約</div>
        </div>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((sub, i) => (
          <AdSubscriptionRow
            key={sub.id}
            sub={sub}
            billing={billings[i]}
            ad={adBySubId.get(sub.id) ?? null}
          />
        ))}

        {subscriptions.length === 0 && (
          <div className="border border-gray-200 bg-white py-12 text-center text-gray-500">
            まだ広告の申込はありません
          </div>
        )}
      </div>
    </div>
  );
}
