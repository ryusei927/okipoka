import {
  SUBSCRIPTION_CAMPAIGN,
  formatCampaignDateTime,
} from "@/lib/subscription-campaign";
import { AtSign, Camera, CheckCircle2, Clock, Gift, Send, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "サブスク登録キャンペーン | OKIPOKA",
  description:
    "OKIPOKAのサブスク登録キャンペーン。期間中にサブスク登録してInstagramストーリーでメンション投稿すると、抽選でアビスアイBOXやAmazonギフト券が当たります。",
};

export default function PublicSubscriptionCampaignPage() {
  const endLabel = formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.endAt);

  return (
    <div className="bg-[#eef1f4] pb-16 text-gray-950">
      <div className="mx-auto max-w-5xl bg-white">
        <section className="grid gap-6 px-4 pb-8 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-12 md:pt-10">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600 ring-1 ring-orange-100">
              <Sparkles className="h-3.5 w-3.5" />
              期間限定キャンペーン
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-5xl">
              サブスク登録で
              <br />
              豪華賞品が当たる！
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-gray-600 md:text-base">
              期間中にOKIPOKAプレミアムへ登録し、応募画面をInstagramストーリーで
              @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンション投稿すると抽選対象になります。
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full bg-gray-950 px-3 py-1.5 text-white">
                {endLabel} 締切
              </span>
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700 ring-1 ring-orange-100">
                サブスク登録者限定
              </span>
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700 ring-1 ring-orange-100">
                ストーリー投稿で応募
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/member/subscription"
                className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600"
              >
                サブスク登録して応募する
              </Link>
              <Link
                href="/member"
                className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-gray-800"
              >
                マイページへ
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-gray-950 ring-1 ring-gray-200">
            <Image
              src="/promo.webp"
              alt="サブスク登録キャンペーン告知画像"
              width={1080}
              height={1920}
              className="h-auto w-full"
              priority
            />
          </div>
        </section>

        <section className="border-t border-gray-100 bg-[#f8fafc] px-4 py-8 md:px-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-orange-500">PRIZES</p>
              <h2 className="mt-1 text-2xl font-black">賞品</h2>
            </div>
            <p className="text-xs font-bold text-gray-400">各1名様</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {SUBSCRIPTION_CAMPAIGN.prizes.map((prize) => (
              <div key={prize.name} className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                <div className="relative aspect-[16/10] bg-gray-100">
                  <Image
                    src={prize.image}
                    alt={prize.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs font-black text-orange-600">
                    <Gift className="h-4 w-4" />
                    抽選で{prize.winners}名様
                  </div>
                  <h3 className="mt-2 text-xl font-black">{prize.name}</h3>
                  <p className="mt-1 text-sm font-bold text-gray-500">{prize.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-8 md:px-8">
          <div className="mb-4">
            <p className="text-xs font-black tracking-[0.16em] text-orange-500">HOW TO ENTER</p>
            <h2 className="mt-1 text-2xl font-black">参加方法</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Step icon={<ShieldCheck className="h-5 w-5" />} title="サブスク登録">
              OKIPOKAプレミアムへ登録します。
            </Step>
            <Step icon={<Ticket className="h-5 w-5" />} title="抽選番号を発行">
              マイページからキャンペーンに応募します。
            </Step>
            <Step icon={<Camera className="h-5 w-5" />} title="スクショ投稿">
              応募完了画面をInstagramストーリーに投稿します。
            </Step>
            <Step icon={<AtSign className="h-5 w-5" />} title="メンション">
              @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションし、12時間以上公開します。
            </Step>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-950 px-4 py-8 text-white md:px-8">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-orange-400">DETAILS</p>
              <h2 className="mt-1 text-2xl font-black">応募条件</h2>
              <dl className="mt-5 space-y-3 text-sm leading-relaxed text-white/75">
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 font-black text-white">期間</dt>
                  <dd>{formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.startAt)} - {endLabel} 締切</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 font-black text-white">対象</dt>
                  <dd>期間中にOKIPOKAプレミアムへ登録し、応募条件を満たした方</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 font-black text-white">投稿</dt>
                  <dd>応募完了画面をストーリー投稿し、@{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンション。投稿は{SUBSCRIPTION_CAMPAIGN.storyHoldHours}時間以上公開してください。</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 font-black text-white">当選連絡</dt>
                  <dd>当選者にはOKIPOKA公式InstagramアカウントよりDMでご連絡します。</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 font-black text-white">お渡し</dt>
                  <dd>アビスアイBOXは発送、Amazonギフト券はギフトコード送付にてお渡しします。</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
              <div className="flex items-center gap-2 text-orange-300">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-black">締切</span>
              </div>
              <p className="mt-2 text-3xl font-black">{endLabel}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                参加にはログイン・サブスク登録が必要です。登録後、マイページに表示される「キャンペーン応募」から抽選番号を発行してください。
              </p>
              <Link
                href="/member/subscription"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-orange-600"
              >
                <Send className="h-4 w-4" />
                応募へ進む
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-6 text-xs leading-relaxed text-gray-500 md:px-8">
          <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              本キャンペーンはInstagramとは関係ありません。アカウントが非公開の場合や投稿を確認できない場合は、抽選対象外となる場合があります。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-black text-gray-950">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{children}</p>
    </div>
  );
}
