import { BackLink } from "@/components/BackLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_CAMPAIGN,
  formatCampaignDateTime,
  isActiveSubscriptionProfile,
  isSubscriptionCampaignActive,
} from "@/lib/subscription-campaign";
import { CheckCircle2, Gift, Instagram, Ticket, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSubscriptionCampaignEntry } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ created?: string; error?: string }>;

export default async function SubscriptionCampaignPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: entry }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status,payment_method,subscription_expires_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscription_campaign_entries")
      .select("draw_number,instagram_username,status,eligible_at,created_at")
      .eq("campaign_key", SUBSCRIPTION_CAMPAIGN.key)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const isSubscriber = isActiveSubscriptionProfile(profile);
  const campaignActive = isSubscriptionCampaignActive();

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f7]">
      <SiteHeader />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <BackLink className="mb-4" />

          <div className="overflow-hidden rounded-sm bg-white ring-1 ring-gray-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="bg-linear-to-br from-orange-500 to-amber-500 px-6 py-7 text-white">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-orange-50">
                <Gift className="h-4 w-4" />
                INSTAGRAM CAMPAIGN
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight">
                {SUBSCRIPTION_CAMPAIGN.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-orange-50">
                サブスク登録後、応募完了画面をスクショしてストーリーで @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションしてください。
              </p>
            </div>

            <div className="px-6 py-6">
              {params.created && (
                <div className="mb-4 rounded-sm bg-green-50 px-4 py-3 text-sm font-bold text-green-700 ring-1 ring-green-100">
                  応募を受け付けました。下の画面をスクショしてください。
                </div>
              )}

              {params.error && (
                <div className="mb-4 rounded-sm bg-red-50 px-4 py-3 text-sm font-bold text-red-600 ring-1 ring-red-100">
                  {params.error}
                </div>
              )}

              {!isSubscriber ? (
                <div className="space-y-4 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-orange-500" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-950">
                      サブスク登録後に応募できます
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      期間中にプレミアム会員へ登録すると、抽選番号を発行できます。
                    </p>
                  </div>
                  <Link
                    href="/member/subscription"
                    className="block rounded-sm bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                  >
                    プレミアム会員登録へ
                  </Link>
                </div>
              ) : entry ? (
                <div className="space-y-5">
                  <div className="rounded-sm border-2 border-dashed border-orange-200 bg-orange-50 px-5 py-6 text-center">
                    <p className="text-xs font-bold tracking-[0.2em] text-orange-600">
                      ENTRY COMPLETE
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-gray-950">
                      <Ticket className="h-5 w-5 text-orange-500" />
                      <span className="font-mono text-2xl font-black tracking-tight">
                        {entry.draw_number}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-gray-700">
                      @{entry.instagram_username}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-sm bg-gray-50 p-4 text-sm text-gray-700">
                    <Instruction>
                      この画面をスクリーンショットしてください。
                    </Instruction>
                    <Instruction>
                      Instagramストーリーで @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションしてください。
                    </Instruction>
                    <Instruction>
                      投稿後 {SUBSCRIPTION_CAMPAIGN.storyHoldHours} 時間以上ストーリーを公開してください。
                    </Instruction>
                  </div>

                  <p className="text-xs leading-relaxed text-gray-500">
                    アカウントが非公開の場合や、投稿後 {SUBSCRIPTION_CAMPAIGN.storyHoldHours} 時間以内に削除された場合は抽選対象外となる場合があります。
                  </p>
                </div>
              ) : campaignActive ? (
                <form action={createSubscriptionCampaignEntry} className="space-y-5">
                  <div>
                    <label htmlFor="instagramUsername" className="text-sm font-bold text-gray-900">
                      InstagramユーザーID
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2.5">
                      <Instagram className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-400">@</span>
                      <input
                        id="instagramUsername"
                        name="instagramUsername"
                        type="text"
                        required
                        maxLength={30}
                        placeholder="okipoka"
                        className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      抽選番号と一緒に管理画面へ保存されます。入力ミスにご注意ください。
                    </p>
                  </div>

                  <div className="rounded-sm bg-orange-50 p-4 text-xs leading-relaxed text-orange-900 ring-1 ring-orange-100">
                    応募後に表示される抽選番号画面をスクショし、ストーリーで @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションしてください。
                    投稿は {SUBSCRIPTION_CAMPAIGN.storyHoldHours} 時間以上公開してください。
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-sm bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                  >
                    抽選に応募する
                  </button>
                </form>
              ) : (
                <div className="space-y-3 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-gray-400" />
                  <h2 className="text-lg font-bold text-gray-950">キャンペーンは終了しました</h2>
                  <p className="text-sm leading-relaxed text-gray-500">
                    応募受付期間は {formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.endAt)} までです。
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-sm bg-white p-4 text-xs leading-relaxed text-gray-500 ring-1 ring-gray-200/80">
            <p className="font-bold text-gray-800">賞品</p>
            <p className="mt-1">{SUBSCRIPTION_CAMPAIGN.prizes.join(" / ")} 各1名様</p>
            <p className="mt-3">
              キャンペーン期間: {formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.startAt)} - {formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.endAt)}
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
      <span>{children}</span>
    </div>
  );
}
