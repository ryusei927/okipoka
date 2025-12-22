"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      
      setSubscription(sub);
      
      // サーバーに保存
      await fetch("/api/web-push/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sub),
      });

      // テスト通知を送信（自分自身に）
      // 実際の運用では、サーバー側でユーザーIDを特定して送信するが、
      // ここでは簡易的に「登録完了」の通知を送るAPIがあればそれを叩くか、
      // あるいは登録API側でウェルカム通知を送るのが良い。
      // 今回は登録APIは保存だけなので、別途テスト送信ボタンを用意するか、
      // ここで「登録しました」のアラートを出すだけにする。
      alert("通知設定をオンにしました！");

    } catch (error) {
      console.error("Push subscription failed:", error);
      alert("通知の許可に失敗しました。ブラウザの設定を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      // サーバー側の削除処理は今回は省略（次回登録時に上書きor期限切れで削除される想定）
      alert("通知をオフにしました。");
    } catch (error) {
      console.error("Unsubscribe failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null; // 非対応ブラウザでは何も表示しない
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>確認中...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${subscription ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
          {subscription ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        <div>
          <div className="font-bold text-sm text-gray-900">プッシュ通知</div>
          <div className="text-xs text-gray-500">
            {subscription ? "現在オンになっています" : "重要なお知らせを受け取る"}
          </div>
        </div>
      </div>

      <button
        onClick={subscription ? unsubscribeFromPush : subscribeToPush}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
          subscription
            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
            : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
      >
        {subscription ? "オフにする" : "オンにする"}
      </button>
    </div>
  );
}
