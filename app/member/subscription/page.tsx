"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Square Web Payments SDKの型定義（簡易）
declare global {
  interface Window {
    Square: any;
  }
}

// サブスク料金（Apple Pay / Google Pay 用）
const SUBSCRIPTION_AMOUNT = "2200"; // 円
const SUBSCRIPTION_CURRENCY = "JPY";
const SUBSCRIPTION_LABEL = "OKIPOKAプレミアム会員（月額）";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [applePay, setApplePay] = useState<any>(null);
  const [applePaySupported, setApplePaySupported] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [chargedThroughDate, setChargedThroughDate] = useState<string | null>(null);
  const [nextRenewalDate, setNextRenewalDate] = useState<string | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const router = useRouter();
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

      // Apple Pay の初期化
      try {
        const applePayRequest = payments.paymentRequest({
          countryCode: "JP",
          currencyCode: SUBSCRIPTION_CURRENCY,
          total: {
            amount: SUBSCRIPTION_AMOUNT,
            label: SUBSCRIPTION_LABEL,
          },
        });
        const applePayInstance = await payments.applePay(applePayRequest);
        setApplePay(applePayInstance);
        setApplePaySupported(true);
      } catch (e: any) {
        console.log("Apple Pay not supported on this device", e);
        setApplePaySupported(false);
      }

    } catch (e: any) {
      console.error(e);
      setError("決済フォームの読み込みに失敗しました: " + e.message);
    }
  }

  // Apple Pay で支払い
  async function handleApplePay() {
    if (!applePay) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await applePay.tokenize();
      if (result.status === "OK") {
        await handlePayment(result.token);
      } else {
        setError(result.errors?.[0]?.message || "Apple Pay の処理に失敗しました");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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

  function statusLabel(status: string | null) {
    switch (status) {
      case "active":
        return "有効";
      case "canceling":
        return "解約予定";
      case "past_due":
        return "支払いエラー";
      case "canceled":
        return "解約済み";
      default:
        return "未登録";
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

      // 成功したらガチャページへ
      router.push("/member/gacha");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm my-10">
      <h1 className="text-2xl font-bold text-center mb-6">プレミアム会員管理</h1>

      <div className="text-sm text-center text-gray-700 mb-4">
        現在のステータス：<span className="font-bold">{statusLabel(subscriptionStatus)}</span>
      </div>

      {(nextRenewalDate || chargedThroughDate) && (
        <div className="text-xs text-center text-gray-600 mb-4 bg-gray-50 p-2 rounded">
          {nextRenewalDate && (
            <div>次回更新日：{nextRenewalDate}</div>
          )}
          {chargedThroughDate && (
            <div>
              {subscriptionStatus === "canceling" ? "解約後の利用期限" : "利用期限"}：{chargedThroughDate} まで
            </div>
          )}
        </div>
      )}
      
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold text-orange-800 mb-2">月額 2,200円（税込）</h2>
        <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
          <li>毎日1回ガチャが引ける！</li>
          <li>ドリンクチケットや割引券が当たる！</li>
          <li>いつでも解約可能</li>
        </ul>
      </div>

      {(subscriptionStatus === "active" || subscriptionStatus === "canceling") && (
        <div className="mb-6">
          <button
            onClick={handleCancel}
            disabled={loading || subscriptionStatus === "canceling"}
            className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscriptionStatus === "canceling" ? "解約手続き済み" : loading ? "処理中..." : "解約する"}
          </button>

          {subscriptionStatus === "canceling" && (
            <button
              onClick={handleResume}
              disabled={loading}
              className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
            >
              {loading ? "処理中..." : "解約を取り消す"}
            </button>
          )}
          <div className="text-xs text-gray-500 mt-2">
            解約後も、次回更新日まではプレミアム特典を利用できます。
          </div>
        </div>
      )}

      {(subscriptionStatus !== "active" && subscriptionStatus !== "canceling") && (
        <>
          <div className="text-xs text-center text-gray-500 mb-4 bg-gray-100 p-2 rounded">
            {process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.startsWith("sandbox-")
              ? "🔧 テスト決済：テスト用カード番号（4111...）が使えます"
              : "💳 この決済は課金されます"}
          </div>

          {/* Apple Pay ボタン */}
          {applePaySupported && (
            <div className="mb-4">
              <button
                onClick={handleApplePay}
                disabled={loading}
                className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {loading ? "処理中..." : "Apple Pay で登録"}
              </button>
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-xs text-gray-500">または</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            </div>
          )}

          {/* クレジットカードフォーム */}
          <div className="text-xs text-center text-gray-600 mb-2">
            クレジットカードで登録
          </div>
          <div id="card-container" className="min-h-25"></div>
        </>
      )}
      
      {infoMessage && (
        <div className="text-green-700 text-sm mt-2 mb-4 bg-green-50 p-2 rounded">
          {infoMessage}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mt-2 mb-4 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {(subscriptionStatus !== "active" && subscriptionStatus !== "canceling") && (
        <button
          id="card-button"
          onClick={handleSubscribe}
          disabled={loading || !card}
          className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
        >
          {loading ? "処理中..." : "カードで登録してガチャを引く"}
        </button>
      )}

      <Link
        href="/member"
        className="block w-full text-center text-sm text-gray-600 hover:text-gray-900 mt-6"
      >
        マイページに戻る
      </Link>
    </div>
  );
}
