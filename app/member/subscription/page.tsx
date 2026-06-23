"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  Loader2,
  CalendarClock,
  Lock,
  Dices,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackLink } from "@/components/BackLink";

// Square Web Payments SDKの型定義（簡易）
declare global {
  interface Window {
    Square: any;
  }
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [chargedThroughDate, setChargedThroughDate] = useState<string | null>(null);
  const [nextRenewalDate, setNextRenewalDate] = useState<string | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // 現在のサブスク状態を取得（未ログインなら401）
    fetch("/api/member/subscription/status")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setSubscriptionStatus(data.subscription_status ?? null);
        setChargedThroughDate(data.charged_through_date ?? null);
        setNextRenewalDate(data.next_renewal_date ?? null);
      })
      .finally(() => {
        setStatusLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!statusLoaded) return;

    // 加入済みならSDK不要
    if (subscriptionStatus === "active" || subscriptionStatus === "canceling") {
      setCard(null);
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || !process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      setError("Squareの設定（環境変数）が不足しています。管理者に連絡してください。");
      return;
    }

    // Square SDKのスクリプトをロード
    const script = document.createElement("script");

    // アプリケーションIDが 'sq0idp-' で始まる場合は本番環境、'sandbox-' で始まる場合はサンドボックス環境
    const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
    const isSandbox = appId.startsWith("sandbox-");

    script.src = isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";

    script.onload = initializePayments;
    document.body.appendChild(script);
  }, [statusLoaded, subscriptionStatus]);

  async function initializePayments() {
    if (!window.Square) return;

    try {
      const payments = window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
      );

      // クレジットカードフォーム
      const cardInstance = await payments.card();
      await cardInstance.attach("#card-container");
      setCard(cardInstance);

    } catch (e: any) {
      console.error(e);
      setError("決済フォームの読み込みに失敗しました: " + e.message);
    }
  }

  // クレジットカードで支払い
  async function handleSubscribe() {
    if (!card) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await card.tokenize();
      if (result.status === "OK") {
        await handlePayment(result.token);
      } else {
        setError(result.errors[0].message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status: string | null) {
    switch (status) {
      case "active":
        return { label: "有効", className: "bg-green-50 text-green-600 ring-green-100" };
      case "canceling":
        return { label: "解約予定", className: "bg-amber-50 text-amber-700 ring-amber-100" };
      case "past_due":
        return { label: "支払いエラー", className: "bg-red-50 text-red-600 ring-red-100" };
      case "canceled":
        return { label: "解約済み", className: "bg-gray-100 text-gray-600 ring-gray-200" };
      default:
        return { label: "未登録", className: "bg-gray-100 text-gray-500 ring-gray-200" };
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const ok = window.confirm("プレミアム会員を解約しますか？\n（次回更新日までは利用できます）");
      if (!ok) return;

      const res = await fetch("/api/payment/square/subscription/cancel", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");

      setSubscriptionStatus(data.status ?? "canceling");
      setChargedThroughDate(data.charged_through_date ?? chargedThroughDate);
      setNextRenewalDate(data.next_renewal_date ?? nextRenewalDate);
      setInfoMessage("解約手続きが完了しました。（解約予定）");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResume() {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const ok = window.confirm("解約を取り消して、プレミアム会員を継続しますか？");
      if (!ok) return;

      const res = await fetch("/api/payment/square/subscription/resume", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resume failed");

      setSubscriptionStatus(data.status ?? "active");
      setChargedThroughDate(data.charged_through_date ?? chargedThroughDate);
      setNextRenewalDate(data.next_renewal_date ?? nextRenewalDate);
      setInfoMessage("解約を取り消しました。（有効）");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(token: string) {
    try {
      const res = await fetch("/api/payment/square/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // 登録完了 → 即リダイレクトせず「完了画面」を表示する
      setSubscriptionStatus("active");
      setJustSubscribed(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const badge = statusBadge(subscriptionStatus);
  const isMember = subscriptionStatus === "active" || subscriptionStatus === "canceling";
  const isSandbox = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.startsWith("sandbox-");

  const benefits = [
    "毎日1回ガチャが引ける",
    "ドリンクチケットや割引券が当たる",
    "いつでも解約OK",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f7]">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
        <BackLink className="mb-4" />

        <div className="overflow-hidden rounded-sm bg-white ring-1 ring-gray-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          {justSubscribed ? (
          /* 登録完了画面 */
          <div className="px-6 py-10 text-center">
            <div className="flex flex-col items-center">
              <span className="font-serif text-[30px] italic leading-none tracking-tight text-gray-950">
                Thank you
              </span>
            </div>
            <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-orange-600">
              WELCOME TO OKIPOKA PREMIUM
            </p>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-gray-950">
              プレミアム登録が完了しました
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
              本日からプレミアム特典をご利用いただけます。
              <br />
              さっそく今日の1回を引いてみましょう。
            </p>

            <ul className="mt-6 space-y-2.5 text-left">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-[15px] text-gray-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
                    <Check className="h-3 w-3 text-orange-600" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-7 space-y-3">
              <Link
                href="/member/gacha"
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-orange-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                <Dices className="h-4 w-4" />
                ガチャを引きに行く
              </Link>
              <Link
                href="/member"
                className="flex w-full items-center justify-center rounded-sm bg-white px-4 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
              >
                マイページへ戻る
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-orange-600">
                OKIPOKA PREMIUM
              </p>
              {statusLoaded && (
                <span
                  className={`inline-flex shrink-0 items-center rounded-sm px-2.5 py-1 text-[11px] font-bold ring-1 ${badge.className}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">プレミアム会員</h1>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-gray-950">¥2,200</span>
              <span className="text-sm text-gray-400">/ 月（税込）</span>
            </div>
          </div>

          {/* 特典リスト */}
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

          {/* 更新日・利用期限 */}
          {statusLoaded && (nextRenewalDate || chargedThroughDate) && (
            <div className="mx-6 mb-5 rounded-sm bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
              <div className="flex items-start gap-2.5">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="space-y-0.5 text-[13px] text-gray-600">
                  {nextRenewalDate && (
                    <div>
                      次回更新日：<span className="font-semibold text-gray-900">{nextRenewalDate}</span>
                    </div>
                  )}
                  {chargedThroughDate && (
                    <div>
                      {subscriptionStatus === "canceling" ? "解約後の利用期限" : "利用期限"}：
                      <span className="font-semibold text-gray-900">{chargedThroughDate}</span> まで
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* アクション領域 */}
          <div className="border-t border-gray-100 px-6 py-5">
            {/* 加入済み：解約／取り消し */}
            {isMember && (
              <div className="space-y-3">
                <button
                  onClick={handleCancel}
                  disabled={loading || subscriptionStatus === "canceling"}
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {subscriptionStatus === "canceling"
                    ? "解約手続き済み"
                    : loading
                      ? "処理中..."
                      : "解約する"}
                </button>

                {subscriptionStatus === "canceling" && (
                  <button
                    onClick={handleResume}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-sm bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "処理中..." : "解約を取り消す"}
                  </button>
                )}
                <p className="text-center text-xs text-gray-400">
                  解約後も、次回更新日まではプレミアム特典を利用できます。
                </p>
              </div>
            )}

            {/* 未加入：カード入力フォーム */}
            {statusLoaded && !isMember && (
              <div className="space-y-4">
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

                {/* クレジットカードフォーム（Square がここに描画） */}
                <div
                  id="card-container"
                  className="min-h-25 rounded-sm bg-white p-3 ring-1 ring-gray-200 focus-within:ring-gray-400 transition-shadow"
                ></div>

                <button
                  id="card-button"
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
                    "カードで登録する"
                  )}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
                  <Lock className="h-3 w-3" />
                  決済は Square のセキュア環境で処理されます
                </p>
              </div>
            )}

            {/* メッセージ */}
            {infoMessage && (
              <div className="mt-4 rounded-sm bg-green-50 px-3 py-2.5 text-sm text-green-700 ring-1 ring-green-100">
                {infoMessage}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-sm bg-red-50 px-3 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                {error}
              </div>
            )}
          </div>
          </>
          )}
        </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
