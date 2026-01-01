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

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [chargedThroughDate, setChargedThroughDate] = useState<string | null>(null);
  const [nextRenewalDate, setNextRenewalDate] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
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
        setPaymentMethod(data.payment_method ?? null);
        setDaysRemaining(data.days_remaining ?? null);
        setSubscriptionExpiresAt(data.subscription_expires_at ?? null);
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
        {paymentMethod === "cash" && (
          <span className="ml-2 text-xs text-orange-600">（現金払い）</span>
        )}
      </div>

      {/* 現金払いの残り日数表示 */}
      {paymentMethod === "cash" && daysRemaining !== null && (subscriptionStatus === "active" || subscriptionStatus === "canceling") && (
        <div className={`text-center mb-4 p-3 rounded-lg ${daysRemaining <= 7 ? "bg-red-50" : "bg-blue-50"}`}>
          <div className={`text-2xl font-bold ${daysRemaining <= 7 ? "text-red-600" : "text-blue-600"}`}>
            残り {daysRemaining} 日
          </div>
          <div className="text-xs text-gray-600 mt-1">
            有効期限：{subscriptionExpiresAt} まで
          </div>
        </div>
      )}

      {/* カード払いの場合の表示 */}
      {paymentMethod !== "cash" && (nextRenewalDate || chargedThroughDate) && (
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

          {/* クレジットカードフォーム */}
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
