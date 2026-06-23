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
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CampaignEntryForm } from "./CampaignEntryForm";

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

          <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/80">
            <Image
              src="/promo.webp"
              alt="サブスク登録キャンペーン告知画像"
              width={1080}
              height={1920}
              className="h-auto w-full"
              priority
            />
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
                    key={prize.name}
                    className={`relative overflow-hidden rounded-xl p-4 ${
                      isHero
                        ? "bg-neutral-950 text-white"
                        : "bg-white text-gray-900 ring-1 ring-gray-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ${
                          isHero ? "ring-2 ring-orange-500/50" : "ring-1 ring-gray-200"
                        }`}
                      >
                        <Image
                          src={prize.image}
                          alt={prize.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black ${
                              isHero ? "text-orange-400" : "text-orange-600"
                            }`}
                          >
                            抽選で{prize.winners}名様
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
              <div
                className="relative overflow-hidden rounded-[28px] bg-neutral-950 bg-cover bg-center p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] ring-4 ring-orange-100"
                style={{ backgroundImage: "url('/campaign-share-bg.webp')" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-black/35"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/35"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/25 blur-3xl"
                />

                <div className="relative flex justify-end">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-white/80 ring-1 ring-white/15">
                    ENTRY
                  </span>
                </div>

                <div className="relative mt-8">
                  <h3 className="text-[26px] font-black leading-[1.15] tracking-tight">
                    OKIPOKA
                    <br />
                    サブスクキャンペーン
                    <br />
                    <span className="text-orange-400">参加中</span>
                  </h3>
                  <p className="mt-3 text-sm font-bold leading-relaxed text-white/72">
                    抽選でアビスアイBOX or
                    <br />
                    Amazonギフト券10,000円分が当たる！
                  </p>
                </div>

                <div className="relative mt-6 grid grid-cols-2 gap-2 text-left">
                  <div className="rounded-2xl bg-white px-3 py-3 text-neutral-950">
                    <div className="text-[10px] font-black text-orange-600">抽選番号</div>
                    <div className="mt-1 break-all font-mono text-sm font-black tracking-tight">
                      {entry.draw_number}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
                    <div className="text-[10px] font-black text-orange-300">参加アカウント</div>
                    <div className="mt-1 break-all text-sm font-black">@{entry.instagram_username}</div>
                  </div>
                </div>

                <div className="relative mt-4 rounded-2xl bg-orange-500 px-4 py-3 text-center text-xs font-black leading-relaxed text-white">
                  @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションして応募完了
                  <br />
                  締切 {endLabel}
                </div>
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

              <CampaignEntryForm />
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
                  <span className="ml-1 font-bold text-orange-600">締切</span>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-gray-700">当選</dt>
                <dd>
                  各賞 抽選で1名様。当選者にはInstagramのDMにてご連絡します。
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-gray-700">お渡し</dt>
                <dd>
                  アビスアイBOXは発送、Amazonギフト券はギフトコード送付にてお渡しします。発送先情報や送付先確認は当選後にInstagram DMで行います。
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-gray-700">発表</dt>
                <dd>
                  当選者はOKIPOKA公式アカウントでInstagramユーザーIDまたは抽選番号をメンション・掲載する場合があります。
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
