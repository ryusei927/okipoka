import {
  SUBSCRIPTION_CAMPAIGN,
  formatCampaignDateTime,
} from "@/lib/subscription-campaign";
import { AtSign, Camera, CreditCard, Dices, Gift, Instagram, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "サブスク登録キャンペーン | OKIPOKA",
  description:
    "おきぽかプレミアムに登録してInstagramストーリーで@okipokaをメンション投稿すると、抽選でアビスアイBOXやAmazonギフト券が当たります。プレミアムの内容と登録方法もこのページで確認できます。",
};

export default function PublicSubscriptionCampaignPage() {
  const startLabel = formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.startAt);
  const endLabel = formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.endAt);

  return (
    <div className="bg-[#eef1f4] pb-16 text-gray-950">
      <div className="mx-auto max-w-5xl bg-white">
        {/* ヒーロー */}
        <section className="grid gap-6 px-4 pb-8 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-12 md:pt-10">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600 ring-1 ring-orange-100">
              {endLabel} まで
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-5xl">
              プレミアム登録で、
              <br />
              抽選に参加できます。
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-gray-600 md:text-base">
              おきぽかプレミアムに登録して、応募画面をInstagramのストーリーに投稿。
              @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションすると、抽選で
              アビスアイBOX か Amazonギフト券10,000円分が当たります。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/member/subscription"
                className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600"
              >
                プレミアムに登録する
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-gray-900 ring-1 ring-gray-300 transition-colors hover:bg-gray-50"
              >
                プレミアムの内容を見る
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

        {/* プレミアムとは（キャンペーン以前の価値） */}
        <section className="border-t border-gray-100 bg-[#f8fafc] px-4 py-9 md:px-8 md:py-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black tracking-tight">おきぽかプレミアムとは</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-gray-600 md:text-base">
              沖縄でポーカーを楽しむ方のための月額メンバーシップです。毎日1回ガチャを引いて、
              店舗で使える特典を獲得できます。本キャンペーンは、その登録のきっかけとしてご用意しました。
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Benefit icon={<Dices className="h-5 w-5" />} title="毎日1回、会員ガチャ">
              ログインした日に1回引けます。ハズレなしで、大会前や来店前のちょっとした楽しみになります。
            </Benefit>
            <Benefit icon={<MapPin className="h-5 w-5" />} title="店舗で使える特典">
              割引券やドリンク、店舗ごとのサービスなど、沖縄のポーカー店で使える特典が当たります。
            </Benefit>
            <Benefit icon={<CreditCard className="h-5 w-5" />} title="月額2,200円・縛りなし">
              月額2,200円（税込）。契約期間の縛りはなく、マイページからいつでも解約できます。
            </Benefit>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            特典のラインナップや確率は{" "}
            <Link href="/premium" className="font-bold text-orange-600 underline underline-offset-2">
              プレミアム紹介ページ
            </Link>{" "}
            で確認できます。
          </p>
        </section>

        {/* 賞品 */}
        <section className="px-4 py-9 md:px-8 md:py-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight">キャンペーンで当たるもの</h2>
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

        {/* 登録のしかた */}
        <section className="border-t border-gray-100 bg-[#f8fafc] px-4 py-9 md:px-8 md:py-12">
          <h2 className="text-2xl font-black tracking-tight">登録の流れ</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-gray-600">
            登録はマイページから数分で完了します。決済はSquareで処理され、カード番号がOKIPOKA側に保存されることはありません。
          </p>

          <ol className="mt-6 space-y-3">
            <NumberStep num="1" title="マイページにログイン">
              アカウントをお持ちでない場合は、無料の会員登録から始めてください。
            </NumberStep>
            <NumberStep num="2" title="「プレミアム会員」からカードで登録">
              カード情報を入力して登録すると、その日からプレミアム特典が使えるようになります。
            </NumberStep>
            <NumberStep num="3" title="マイページの「キャンペーン応募」へ">
              InstagramのユーザーIDを入力すると、応募用の抽選番号が発行されます。
            </NumberStep>
            <NumberStep num="4" title="抽選番号の画面をストーリーに投稿">
              @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンションし、投稿は
              {SUBSCRIPTION_CAMPAIGN.storyHoldHours}時間以上そのまま公開してください。これで応募完了です。
            </NumberStep>
          </ol>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <MiniStep icon={<Ticket className="h-5 w-5" />} label="抽選番号を発行" />
            <MiniStep icon={<Camera className="h-5 w-5" />} label="スクショして投稿" />
            <MiniStep icon={<AtSign className="h-5 w-5" />} label="@okipoka をメンション" />
          </div>
        </section>

        {/* 詳細・条件 */}
        <section className="px-4 py-9 md:px-8 md:py-12">
          <h2 className="text-2xl font-black tracking-tight">応募の詳細</h2>
          <dl className="mt-5 divide-y divide-gray-100 rounded-2xl bg-white ring-1 ring-gray-200">
            <Row term="期間">
              {startLabel} 〜 {endLabel} まで
            </Row>
            <Row term="対象">
              期間中におきぽかプレミアムへ登録し、応募条件を満たした方
            </Row>
            <Row term="投稿">
              応募画面のストーリー投稿で @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンション。投稿は
              {SUBSCRIPTION_CAMPAIGN.storyHoldHours}時間以上公開してください。
            </Row>
            <Row term="当選連絡">
              当選者にはOKIPOKA公式InstagramよりDMでご連絡します。
            </Row>
            <Row term="お渡し">
              アビスアイBOXは発送、Amazonギフト券はギフトコードの送付でお渡しします。
            </Row>
            <Row term="発表">
              当選者は、OKIPOKA公式アカウントでInstagramのユーザーIDまたは抽選番号をメンション・掲載する場合があります。
            </Row>
          </dl>

          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 ring-1 ring-gray-200">
            <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            本キャンペーンはInstagramとは関係ありません。アカウントが非公開の場合や、投稿を確認できない場合は抽選対象外となることがあります。
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/member/subscription"
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-orange-600"
            >
              プレミアムに登録する
            </Link>
            <Link
              href="/member"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-gray-900 ring-1 ring-gray-300 transition-colors hover:bg-gray-50"
            >
              マイページへ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Benefit({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-black text-gray-950">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-gray-600">{children}</p>
    </div>
  );
}

function NumberStep({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-gray-200">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-sm font-black text-white">
        {num}
      </span>
      <div>
        <h3 className="text-sm font-black text-gray-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-gray-600">{children}</p>
      </div>
    </li>
  );
}

function MiniStep({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-gray-200">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        {icon}
      </span>
      <span className="text-sm font-bold text-gray-800">{label}</span>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-4 text-sm">
      <dt className="w-20 shrink-0 font-black text-gray-900">{term}</dt>
      <dd className="leading-relaxed text-gray-600">{children}</dd>
    </div>
  );
}
