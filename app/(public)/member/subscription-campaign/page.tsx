import { BackLink } from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_CAMPAIGN,
  formatCampaignDateTime,
  isActiveSubscriptionProfile,
  isSubscriptionCampaignActive,
} from "@/lib/subscription-campaign";
import {
  AtSign,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Gift,
  Instagram,
  Package,
  Sparkles,
  Ticket,
} from "lucide-react";
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
  const endLabel = formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.endAt);

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-md space-y-5">
        <BackLink />

          {/* ヒーロー */}
          <section className="relative overflow-hidden rounded-2xl bg-neutral-950 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/30 blur-3xl"
            />
            <div className="relative px-6 pb-7 pt-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/90 ring-1 ring-white/15">
                <Instagram className="h-3.5 w-3.5" />
                OKIPOKA × INSTAGRAM
              </div>

              <h1 className="mt-5 text-[28px] font-black leading-[1.15] tracking-tight">
                サブスク登録で、
                <br />
                <span className="text-orange-400">最新弾BOX</span>を当てよう。
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-white/60">
                期間中にプレミアム会員へ登録した方の中から、抽選で豪華賞品をプレゼント。応募はストーリーで投稿するだけ。
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-white/80">
                <Clock className="h-4 w-4 text-orange-400" />
                応募は {endLabel} まで
              </div>
            </div>
          </section>

          {/* 賞品 */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-black tracking-wide text-gray-900">賞品</h2>
              <span className="text-[11px] font-bold text-gray-400">
                抽選 / 各{SUBSCRIPTION_CAMPAIGN.prizes[0].winners}名様
              </span>
            </div>

            <div className="space-y-3">
              {SUBSCRIPTION_CAMPAIGN.prizes.map((prize, i) => {
                const isHero = i === 0;
                return (
                  <div
                    key={prize.rank}
                    className={`relative overflow-hidden rounded-xl p-4 ${
                      isHero
                        ? "bg-neutral-950 text-white"
                        : "bg-white text-gray-900 ring-1 ring-gray-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${
                          isHero ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {isHero ? (
                          <Package className="h-7 w-7" />
                        ) : (
                          <Gift className="h-7 w-7" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black ${
                              isHero ? "text-orange-400" : "text-orange-600"
                            }`}
                          >
                            {prize.rank}
                          </span>
                          {"tag" in prize && prize.tag && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              <Sparkles className="h-2.5 w-2.5" />
                              {prize.tag}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[17px] font-black leading-tight tracking-tight">
                          {prize.name}
                        </div>
                        <div
                          className={`text-sm font-bold ${
                            isHero ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {prize.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {params.created && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 ring-1 ring-green-100">
              応募を受け付けました。下の画面をスクショしてください。
            </div>
          )}
          {params.error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 ring-1 ring-red-100">
              {params.error}
            </div>
          )}

          {/* アクション領域 */}
          {!isSubscriber ? (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-gray-200/80">
              <h2 className="text-lg font-black tracking-tight text-gray-950">
                まずはプレミアム登録
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                期間中にプレミアム会員へ登録すると、応募用の抽選番号を発行できます。月額¥2,200でガチャなどの特典も使い放題。
              </p>
              <Link
                href="/member/subscription"
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                プレミアム会員登録へ
                <ChevronRight className="h-4 w-4" />
              </Link>
            </section>
          ) : entry ? (
            <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-gray-200/80">
              <div className="relative overflow-hidden rounded-xl bg-neutral-950 px-5 py-6 text-center text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <p className="relative text-[11px] font-bold tracking-[0.22em] text-orange-400">
                  ENTRY COMPLETE
                </p>
                <div className="relative mt-3 flex items-center justify-center gap-2">
                  <Ticket className="h-5 w-5 text-orange-400" />
                  <span className="font-mono text-[26px] font-black tracking-tight">
                    {entry.draw_number}
                  </span>
                </div>
                <p className="relative mt-2 text-sm font-bold text-white/80">
                  @{entry.instagram_username}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-900">応募を完了させる</h3>
                <ol className="mt-3 space-y-3">
                  <Step n={1} icon={<Camera className="h-4 w-4" />}>
                    この抽選番号の画面をスクリーンショット
                  </Step>
                  <Step n={2} icon={<AtSign className="h-4 w-4" />}>
                    Instagramストーリーに投稿し @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンション
                  </Step>
                  <Step n={3} icon={<Clock className="h-4 w-4" />}>
                    投稿は {SUBSCRIPTION_CAMPAIGN.storyHoldHours} 時間以上そのまま公開
                  </Step>
                </ol>
              </div>

              <p className="text-xs leading-relaxed text-gray-400">
                アカウントが非公開の場合や、投稿後 {SUBSCRIPTION_CAMPAIGN.storyHoldHours} 時間以内に削除された場合は抽選対象外となることがあります。
              </p>
            </section>
          ) : campaignActive ? (
            <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-gray-200/80">
              <div>
                <h2 className="text-lg font-black tracking-tight text-gray-950">
                  抽選に応募する
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  InstagramのユーザーIDを入力して応募。完了画面の抽選番号をストーリーに投稿すれば応募完了です。
                </p>
              </div>

              {/* 応募の流れ */}
              <ol className="space-y-3">
                <Step n={1} icon={<AtSign className="h-4 w-4" />}>
                  InstagramユーザーIDを入力して応募
                </Step>
                <Step n={2} icon={<Camera className="h-4 w-4" />}>
                  表示された抽選番号をスクショ
                </Step>
                <Step n={3} icon={<Instagram className="h-4 w-4" />}>
                  ストーリーに投稿して @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンション
                </Step>
              </ol>

              <form action={createSubscriptionCampaignEntry} className="space-y-4">
                <div>
                  <label
                    htmlFor="instagramUsername"
                    className="text-sm font-bold text-gray-900"
                  >
                    InstagramユーザーID
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 focus-within:border-orange-400 focus-within:bg-white">
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
                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    抽選番号と一緒に保存されます。入力ミスにご注意ください。
                  </p>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                >
                  抽選番号を発行して応募
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            </section>
          ) : (
            <section className="rounded-2xl bg-white p-6 text-center ring-1 ring-gray-200/80">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <h2 className="mt-3 text-lg font-black text-gray-950">
                キャンペーンは終了しました
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                応募受付期間は {endLabel} までです。たくさんのご応募ありがとうございました。
              </p>
            </section>
          )}

          {/* 詳細 */}
          <section className="rounded-xl bg-white p-4 text-xs leading-relaxed text-gray-500 ring-1 ring-gray-200/80">
            <dl className="space-y-2">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-gray-700">期間</dt>
                <dd>
                  {formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.startAt)} 〜 {endLabel}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-gray-700">当選</dt>
                <dd>
                  各賞 抽選で1名様。当選者にはInstagramのDMにてご連絡します。
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-gray-700">条件</dt>
                <dd>
                  期間中のプレミアム会員登録 ＋ 抽選番号画面のストーリー投稿（@{SUBSCRIPTION_CAMPAIGN.instagramAccount} メンション）。
                </dd>
              </div>
            </dl>
        </section>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        {icon}
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
          {n}
        </span>
      </span>
      <span className="text-sm leading-snug text-gray-700">{children}</span>
    </li>
  );
}
