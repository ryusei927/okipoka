import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Check,
  Megaphone,
  Users,
  MapPin,
  Repeat,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "広告掲載 | OKIPOKA",
  description:
    "OKIPOKAに広告を掲載しませんか。月額3,800円（税込）で沖縄のポーカープレイヤーにリーチ。毎月自動更新・いつでも解約OK。",
};

const benefits = [
  "サイト内に広告を掲載",
  "毎月自動更新で掲載を継続",
  "いつでも解約OK",
];

const reasons = [
  {
    icon: Users,
    title: "ポーカー層に直接リーチ",
    desc: "沖縄のポーカー店舗・トーナメントを探すユーザーが集まるサイトです。",
  },
  {
    icon: MapPin,
    title: "沖縄ローカルに特化",
    desc: "地域に根ざしたポータルなので、店舗・イベントの集客に相性が良いです。",
  },
  {
    icon: Repeat,
    title: "手間なく掲載を継続",
    desc: "月額制で自動更新。毎月の手続きは不要で、掲載を止めたいときだけ解約できます。",
  },
];

const steps = [
  { num: "1", title: "お申し込み", desc: "事業者情報とカード情報を入力するだけ。" },
  { num: "2", title: "自動で課金開始", desc: "Squareの安全な決済で月額3,800円を自動請求。" },
  { num: "3", title: "担当者が掲載対応", desc: "掲載内容について担当者よりご連絡いたします。" },
];

export default function AdvertisePage() {
  return (
    <main className="pb-12">
      {/* ヒーロー（背景画像） */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/advertise-hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/75 to-gray-950/30" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:py-28">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.25em] text-orange-400">
            <Megaphone className="h-3.5 w-3.5" />
            広告掲載プラン
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            OKIPOKAに広告を
            <br />
            掲載しませんか
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-200 sm:text-base">
            沖縄のポーカー店舗・トーナメント情報を探すユーザーへ、あなたのお店やサービスを届けられます。
          </p>
          <Link
            href="/ad-signup"
            className="mt-7 inline-flex items-center gap-2 rounded-sm bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600"
          >
            お申し込みへ進む
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4">
        {/* プランカード */}
        <div className="mx-auto -mt-12 max-w-md overflow-hidden rounded-lg bg-white ring-1 ring-gray-200/70 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
          {/* 価格 */}
          <div className="border-b border-gray-100 px-8 pb-7 pt-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-600">
              Monthly Plan
            </p>
            <div className="mt-4 flex items-start justify-center">
              <span className="mt-2 text-2xl font-bold text-gray-900">¥</span>
              <span className="text-[64px] font-black leading-[0.9] tracking-tight text-gray-950 tabular-nums">
                3,800
              </span>
              <span className="mt-2 self-end text-base font-medium text-gray-400">/ 月</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
                税込
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
                初期費用 0円
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
                最低契約期間なし
              </span>
            </div>
          </div>

          {/* 特典 */}
          <div className="px-8 py-6">
            <ul className="space-y-3.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-[15px] font-medium text-gray-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-8 pb-7">
            <Link
              href="/ad-signup"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600"
            >
              お申し込みへ進む
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
              <ShieldCheck className="h-3 w-3" />
              決済は Square のセキュア環境で処理されます
            </p>
          </div>
        </div>

        {/* 選ばれる理由 */}
        <div className="mt-20">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-600">
              Why OKIPOKA
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">掲載のメリット</h2>
            <span className="mx-auto mt-4 block h-px w-10 bg-orange-500/70" />
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {reasons.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg bg-white p-6 ring-1 ring-gray-200/70 transition-shadow hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
                  <Icon className="h-5 w-5 text-orange-600" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 流れ */}
        <div className="mt-20">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-600">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">お申し込みの流れ</h2>
            <span className="mx-auto mt-4 block h-px w-10 bg-orange-500/70" />
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {steps.map(({ num, title, desc }) => (
              <div
                key={num}
                className="relative rounded-lg bg-white p-6 ring-1 ring-gray-200/70"
              >
                <span className="text-4xl font-black leading-none text-gray-100 tabular-nums">
                  0{num}
                </span>
                <h3 className="mt-2 text-[15px] font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 末尾CTA */}
        <div className="mt-20 overflow-hidden rounded-xl bg-gray-950 px-8 py-12 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            まずはお気軽に、はじめましょう。
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400">
            月額3,800円・最低契約期間なし。いつでも解約できます。
          </p>
          <Link
            href="/ad-signup"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600"
          >
            広告掲載を申し込む
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
