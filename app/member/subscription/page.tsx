"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Square Web Payments SDKの型定義（簡易）
declare global {
  interface Window {
    Square: any;
  }
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || !process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      setError("Squareの設定（環境変数）が不足しています。管理者に連絡してください。");
      return;
    }

    // Square SDKのスクリプトをロード
    const script = document.createElement("script");
    // 本番環境かサンドボックスかでURLが変わります
    // アプリケーションIDが 'sq0idp-' で始まる場合は本番環境、'sandbox-' で始まる場合はサンドボックス環境
    const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
    const isSandbox = appId.startsWith("sandbox-");
    
    script.src = isSandbox 
      ? "https://sandbox.web.squarecdn.com/v1/square.js" 
      : "https://web.squarecdn.com/v1/square.js";
      
    script.onload = initializeCard;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function initializeCard() {
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
      <h1 className="text-2xl font-bold text-center mb-6">おきぽかプレミアム会員</h1>
      
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold text-orange-800 mb-2">月額 2,200円（税込）</h2>
        <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
          <li>毎日1回ガチャが引ける！</li>
          <li>ドリンクチケットや割引券が当たる！</li>
          <li>いつでも解約可能</li>
        </ul>
      </div>

      <div className="text-xs text-center text-gray-500 mb-4 bg-gray-100 p-2 rounded">
        {process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.startsWith("sandbox-") 
          ? "🔧 テスト環境モード：テスト用カード番号（4111...）が使えます" 
          : "💳 本番環境モード：実際のお支払いが発生します（本物のカードのみ有効）"}
      </div>

      <div id="card-container" className="min-h-25"></div>
      
      {error && (
        <div className="text-red-500 text-sm mt-2 mb-4 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <button
        id="card-button"
        onClick={handleSubscribe}
        disabled={loading || !card}
        className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
      >
        {loading ? "処理中..." : "登録してガチャを引く"}
      </button>
    </div>
  );
}
