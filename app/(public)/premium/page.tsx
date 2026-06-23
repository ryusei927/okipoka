"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PublicGachaItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  probability: number | null;
  type: string;
  stock_total: number | null;
  stock_used: number | null;
  is_monthly_limit: boolean | null;
  current_stock_used: number | null;
  shop_image_url: string | null;
};

type LegacyGachaItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  probability: number | null;
  type: string;
  stock_total: number | null;
  stock_used: number | null;
  is_monthly_limit: boolean | null;
  shops?: { image_url?: string | null } | null;
};

export default function PremiumGuidePage() {
  const [showItemsList, setShowItemsList] = useState(false);
  const [gachaItems, setGachaItems] = useState<PublicGachaItem[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchGachaItems = async () => {
      const { data, error } = await supabase.rpc("get_public_gacha_items");

      if (!error) {
        setGachaItems((data ?? []) as PublicGachaItem[]);
        return;
      }

      const { data: legacy } = await supabase
        .from("gacha_items")
        .select("id,name,description,image_url,probability,type,stock_total,stock_used,is_monthly_limit,shops(image_url)")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("probability", { ascending: false });

      if (legacy) {
        const mapped: PublicGachaItem[] = (legacy as LegacyGachaItem[]).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          image_url: item.image_url ?? null,
          probability: item.probability ?? null,
          type: item.type,
          stock_total: item.stock_total ?? null,
          stock_used: item.stock_used ?? null,
          is_monthly_limit: item.is_monthly_limit ?? null,
          current_stock_used: item.stock_used ?? 0,
          shop_image_url: item.shops?.image_url ?? null,
        }));
        setGachaItems(mapped);
      }
    };

    fetchGachaItems();
  }, [supabase]);

  const totalWeight = gachaItems.reduce((sum, item) => sum + (item.probability ?? 0), 0);
  const formatProbabilityPct = (item: PublicGachaItem) => {
    const w = item.probability ?? 0;
    if (!totalWeight || !w) return "0%";
    const pct = Math.round((w / totalWeight) * 1000) / 10;
    return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
  };
  const formatRemainingStock = (item: PublicGachaItem) => {
    if (item.stock_total === null || item.stock_total === undefined) return "無制限";
    const used = Number(item.current_stock_used ?? item.stock_used ?? 0);
    return String(Math.max(0, item.stock_total - used));
  };

  const featuredItems = gachaItems.filter((item) => item.type !== "none").slice(0, 4);
  const visibleItems = featuredItems.length > 0 ? featuredItems : gachaItems.slice(0, 4);

  const benefits = [
    {
      image: "/premium-benefit-gacha.svg",
      title: "毎日1回、会員ガチャ",
      description: "ログインした日に1回。大会に行く前、店に向かう前の小さな楽しみを作れます。",
    },
    {
      image: "/premium-benefit-ticket.svg",
      title: "店舗で使える特典",
      description: "割引券、ドリンク、店舗ごとのサービスなど、沖縄のポーカー店で使える特典を掲載します。",
    },
    {
      image: "/premium-benefit-member.svg",
      title: "月額制で、いつでも解約",
      description: "月額2,200円。契約期間の縛りはなく、マイページからいつでも手続きできます。",
    },
  ];

  const steps = [
    ["01", "プレミアム登録", "マイページからカードで登録。決済はSquareで安全に処理されます。"],
    ["02", "毎日ガチャを引く", "会員ページにログインして、その日の1回を引きます。"],
    ["03", "当たった特典を使う", "表示された特典内容を確認して、対象店舗で利用します。"],
  ];

  const faqs = [
    ["ガチャは毎日引けますか？", "プレミアム会員は1日1回引けます。日付が変わると次の1回が使えます。"],
    ["出てくるお店は選べますか？", "お店や特典は選べません。会員ガチャは対象ラインナップの中からランダムで出ます。"],
    ["解約したらすぐ使えなくなりますか？", "解約手続き後も、次回更新日まではプレミアム特典を利用できます。"],
    ["カード情報は保存されますか？", "決済はSquareの環境で処理されます。OKIPOKA側でカード番号を保持しません。"],
    ["景品はいつも同じですか？", "店舗特典や在庫状況に合わせてラインナップは更新されます。"],
  ];

  return (
    <div className="min-h-screen bg-[#eef1f4] pb-24 font-sans text-[#171717]">
      <div className="mx-auto min-h-screen max-w-6xl bg-[#fffdf8]">
        <section className="border-b border-[#ded6c7] px-4 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black tracking-tight">おきぽかプレミアム</p>
            <Link href="/" className="text-xs font-bold text-[#6f665c] underline underline-offset-4 hover:text-[#171717]">
              トップへ戻る
            </Link>
          </div>
        </section>

        <section className="grid gap-8 border-b border-[#ded6c7] px-4 pb-14 pt-8 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:py-12">
          <div>
            <p className="mb-3 inline-block bg-[#171717] px-3 py-1 text-xs font-black tracking-[0.18em] text-[#fffdf8]">
              OKIPOKA PREMIUM
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
              沖縄ポーカーを<br className="hidden md:block" />
              遊ぶ人の月額パス。
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-[#5f574f] md:text-base">
              毎日1回の会員ガチャで、店舗で使える特典を引く。大会前に見て、店に行って、ちょっと得する。
              OKIPOKAをよく開く人向けのプレミアムです。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <span className="bg-[#171717] px-3 py-1.5 text-[#fffdf8]">ハズレなし</span>
              <span className="bg-[#f5ecdd] px-3 py-1.5 text-[#171717] ring-1 ring-[#ded6c7]">毎日1回引ける</span>
              <span className="bg-[#f5ecdd] px-3 py-1.5 text-[#171717] ring-1 ring-[#ded6c7]">店舗特典が当たる</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/member/subscription"
                className="inline-flex items-center justify-center bg-[#ff6b00] px-6 py-3 text-sm font-black text-white ring-2 ring-[#171717] transition-transform hover:-translate-y-0.5"
              >
                プレミアム登録へ
              </Link>
              <button
                type="button"
                onClick={() => setShowItemsList(true)}
                className="inline-flex items-center justify-center bg-white px-6 py-3 text-sm font-black text-[#171717] ring-2 ring-[#171717] transition-transform hover:-translate-y-0.5"
              >
                景品ラインナップを見る
              </button>
            </div>
          </div>

          <div className="relative">
            <Image
              src="/premium-texas-holdem-table.png"
              alt="ポーカーテーブルを囲んで楽しく遊んでいる人たち"
              width={819}
              height={578}
              className="w-full border-2 border-[#171717] bg-[#f5ecdd]"
              priority
            />
            <div className="absolute -bottom-7 right-3 flex justify-end md:-bottom-8 md:right-5">
              <Image
                src="/premium-price-ticket.svg"
                alt="月額2,200円税込"
                width={420}
                height={220}
                className="w-40 rotate-[-1deg] drop-shadow-[4px_5px_0_rgba(23,23,23,0.18)] sm:w-52 md:w-64"
              />
            </div>
          </div>
        </section>

        <section className="grid border-b border-[#ded6c7] md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="border-b border-[#ded6c7] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <Image src={benefit.image} alt="" width={160} height={120} className="mb-4 h-24 w-32 object-contain" />
              <h2 className="text-lg font-black">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#62594f]">{benefit.description}</p>
            </div>
          ))}
        </section>

        <section className="border-b border-[#ded6c7] px-4 py-8 md:px-8 md:py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-[#ff6b00]">LINEUP</p>
              <h2 className="mt-1 text-2xl font-black">今出ている会員特典</h2>
              <p className="mt-1 text-sm font-medium text-[#6f665c]">
                ここでは一部をピックアップ。ハズレなしで、全ラインナップは一覧から確認できます。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowItemsList(true)}
              className="hidden text-sm font-black underline underline-offset-4 md:inline-block"
            >
              全部見る
            </button>
          </div>

          {visibleItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-4">
              {visibleItems.map((item) => (
                <div key={item.id} className="bg-white p-3 ring-1 ring-[#ded6c7]">
                  <div className="mb-2 text-[10px] font-black tracking-[0.16em] text-[#ff6b00]">PICK UP</div>
                  <div className="mb-3 flex h-28 items-center justify-center overflow-hidden bg-[#f3efe6]">
                    {item.image_url || item.shop_image_url ? (
                      <Image
                        src={item.image_url || item.shop_image_url || ""}
                        alt={item.name}
                        width={240}
                        height={160}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-sm font-black text-[#7a7065]">OKIPOKA 特典</span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 min-h-10 text-sm font-black">{item.name}</h3>
                  {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6f665c]">{item.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 text-center text-sm font-bold text-[#6f665c] ring-1 ring-[#ded6c7]">
              現在開催中の会員特典は準備中です。
            </div>
          )}
        </section>

        <section className="grid border-b border-[#ded6c7] md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-[#171717] p-6 text-[#fffdf8] md:p-8">
            <p className="text-xs font-black tracking-[0.18em] text-[#ff6b00]">HOW TO USE</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">登録したら、今日から使えます。</h2>
            <p className="mt-4 text-sm leading-7 text-[#d8cfbf]">
              やることはシンプルです。登録して、会員ページでガチャを引いて、当たった特典を確認するだけ。
            </p>
          </div>
          <div className="divide-y divide-[#ded6c7] bg-white">
            {steps.map(([num, title, description]) => (
              <div key={num} className="grid grid-cols-[52px_1fr] gap-4 p-5">
                <div className="font-mono text-2xl font-black text-[#ff6b00]">{num}</div>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#62594f]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 px-4 py-8 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-10">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-[#ff6b00]">FAQ</p>
            <h2 className="mt-1 text-2xl font-black">登録前によくある質問</h2>
          </div>
          <div className="divide-y divide-[#ded6c7] border-y border-[#ded6c7]">
            {faqs.map(([question, answer]) => (
              <div key={question} className="py-4">
                <h3 className="text-sm font-black">{question}</h3>
                <p className="mt-1 text-sm leading-6 text-[#62594f]">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[#ded6c7] bg-[#f5ecdd] px-4 py-8 text-center md:px-8">
          <p className="text-sm font-black text-[#62594f]">月額2,200円（税込） / いつでも解約OK</p>
          <h2 className="mt-2 text-2xl font-black">今日の1回から始めよう。</h2>
          <Link
            href="/member/subscription"
            className="mt-5 inline-flex w-full max-w-sm items-center justify-center bg-[#ff6b00] px-6 py-3.5 text-sm font-black text-white ring-2 ring-[#171717] transition-transform hover:-translate-y-0.5"
          >
            プレミアム登録へ
          </Link>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#171717] bg-[#fffdf8]/95 p-3 backdrop-blur md:hidden">
        <Link
          href="/member/subscription"
          className="flex w-full items-center justify-center bg-[#ff6b00] px-4 py-3 text-sm font-black text-white ring-2 ring-[#171717]"
        >
          月額2,200円で登録する
        </Link>
      </div>

      {/* 景品一覧モーダル */}
      {showItemsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden bg-[#fffdf8] shadow-2xl ring-2 ring-[#171717]">
            <div className="flex items-center justify-between border-b border-[#ded6c7] bg-[#f5ecdd] p-4">
              <h3 className="text-lg font-black text-[#171717]">景品ラインナップ</h3>
              <button
                type="button"
                onClick={() => setShowItemsList(false)}
                className="bg-white px-3 py-1 text-sm font-black ring-1 ring-[#171717]"
                aria-label="閉じる"
              >
                閉じる
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-4">
              {gachaItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-white p-3 ring-1 ring-[#ded6c7]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-[#f3efe6] ring-1 ring-[#ded6c7]">
                    {item.type === "none" ? (
                      <span className="text-xs font-black text-[#7a7065]">抽選枠</span>
                    ) : (item.image_url || item.shop_image_url) ? (
                      <Image
                        src={item.image_url || item.shop_image_url || ""}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs font-black text-[#7a7065]">特典</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#171717]">{item.name}</div>
                    {item.description && (
                      <div className="mt-0.5 text-xs text-[#6f665c]">{item.description}</div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6f665c]">
                      <span>確率: {formatProbabilityPct(item)}</span>
                      <span>残り: {formatRemainingStock(item)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {gachaItems.length === 0 && (
                <div className="py-8 text-center text-sm text-[#6f665c]">
                  現在開催中のガチャはありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
