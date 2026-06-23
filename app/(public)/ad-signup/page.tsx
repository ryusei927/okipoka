"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Loader2, Lock, Megaphone } from "lucide-react";

declare global {
  interface Window {
    Square: any;
  }
}

type AdType = "banner" | "square";

export default function AdSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [done, setDone] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adType, setAdType] = useState<AdType>("banner");
  const [linkUrl, setLinkUrl] = useState("");
  const [note, setNote] = useState("");

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (
      !process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ||
      !process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
    ) {
      setError("Squareの設定（環境変数）が不足しています。管理者に連絡してください。");
      return;
    }

    const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
    const isSandbox = appId.startsWith("sandbox-");

    const script = document.createElement("script");
    script.src = isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";
    script.onload = initializePayments;
    document.body.appendChild(script);
  }, []);

  async function initializePayments() {
    if (!window.Square) return;
    try {
      const payments = window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
      );
      const cardInstance = await payments.card();
      await cardInstance.attach("#card-container");
      setCard(cardInstance);
    } catch (e: any) {
      console.error(e);
      setError("決済フォームの読み込みに失敗しました: " + e.message);
    }
  }

  function validate(): string | null {
    if (!businessName.trim()) return "事業者名・店舗名を入力してください。";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "正しいメールアドレスを入力してください。";
    if (!card) return "決済フォームの読み込みが完了していません。";
    return null;
  }

  async function handleSubscribe() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await card.tokenize();
      if (result.status !== "OK") {
        setError(result.errors?.[0]?.message ?? "カード情報を確認してください。");
        return;
      }

      const res = await fetch("/api/payment/square/ad-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          businessName: businessName.trim(),
          contactName: contactName.trim() || null,
          email: email.trim(),
          phone: phone.trim() || null,
          adType,
          linkUrl: linkUrl.trim() || null,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const isSandbox = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.startsWith("sandbox-");

  const benefits = [
    "サイト内に広告を掲載",
    "毎月自動更新で掲載を継続",
    "いつでも解約OK",
  ];

  const inputClass =
    "w-full rounded-sm bg-white px-3 py-2.5 text-sm text-gray-900 ring-1 ring-gray-200 transition-shadow placeholder:text-gray-400 focus:outline-none focus:ring-gray-400";

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-sm bg-white ring-1 ring-gray-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          {done ? (
            /* 申込完了画面 */
            <div className="px-6 py-10 text-center">
              <span className="font-serif text-[30px] italic leading-none tracking-tight text-gray-950">
                Thank you
              </span>
              <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-orange-600">
                AD PLAN
              </p>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-gray-950">
                お申し込みが完了しました
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                ご登録ありがとうございます。
                <br />
                広告画像について、担当者よりご連絡いたします。
              </p>
              <div className="mt-7">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center rounded-sm bg-white px-4 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
                >
                  トップへ戻る
                </Link>
              </div>
              <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <Lock className="h-3 w-3" />
                決済は Square のセキュア環境で処理されました
              </p>
            </div>
          ) : (
            <>
              {/* ヘッダー */}
              <div className="border-b border-gray-100 px-6 py-6">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-orange-600">
                  <Megaphone className="h-3.5 w-3.5" />
                  広告掲載プラン
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                  広告を掲載する
                </h1>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-gray-950">¥3,800</span>
                  <span className="text-sm text-gray-400">/ 月（税込）</span>
                </div>
              </div>

              {/* 特典 */}
              <div className="px-6 py-5">
                <ul className="space-y-2.5">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[15px] text-gray-800">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
                        <Check className="h-3 w-3 text-orange-600" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 入力フォーム */}
              <div className="border-t border-gray-100 px-6 py-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      事業者名・店舗名 <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      ご担当者名
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      メールアドレス <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* 広告タイプ（希望） */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      広告タイプ（ご希望）
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: "banner", label: "バナー", note: "横長 1200×300" },
                          { value: "square", label: "スクエア", note: "正方形 600×600" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAdType(opt.value)}
                          className={`rounded-sm px-3 py-2.5 text-left ring-1 transition-colors ${
                            adType === opt.value
                              ? "bg-orange-50 ring-orange-300"
                              : "bg-white ring-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <span className="block text-sm font-bold text-gray-900">
                            {opt.label}
                          </span>
                          <span className="block text-[11px] text-gray-400">{opt.note}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* リンクURL */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      リンク先URL
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      広告をクリックしたときに開くページ（任意）
                    </p>
                  </div>

                  {/* 要望メモ */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      ご要望・備考
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="掲載のご希望など"
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {/* 広告画像の案内 */}
                  <div className="rounded-sm bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600 ring-1 ring-gray-100">
                    広告画像は、お申し込み後に担当者からご連絡し、ご用意・調整のうえ掲載いたします。
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-medium ring-1 ${
                      isSandbox
                        ? "bg-blue-50 text-blue-700 ring-blue-100"
                        : "bg-gray-50 text-gray-600 ring-gray-100"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    {isSandbox
                      ? "テスト決済モード：テスト用カード（4111…）が使えます"
                      : "Square による安全な決済。カード情報は当サイトに保存されません。"}
                  </div>

                  {/* カードフォーム（Square がここに描画） */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      クレジットカード <span className="text-orange-500">*</span>
                    </label>
                    <div
                      id="card-container"
                      className="min-h-25 rounded-sm bg-white p-3 ring-1 ring-gray-200 transition-shadow focus-within:ring-gray-400"
                    ></div>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={loading || !card}
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-orange-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      "月額3,800円で申し込む"
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
                    <Lock className="h-3 w-3" />
                    決済は Square のセキュア環境で処理されます
                  </p>

                  {error && (
                    <div className="rounded-sm bg-red-50 px-3 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
