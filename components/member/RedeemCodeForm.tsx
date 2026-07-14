"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket } from "lucide-react";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "コードが見つかりません。入力内容をご確認ください。",
  already_used: "このコードはすでに使用されています。",
  void: "このコードは無効化されています。購入店舗にお問い合わせください。",
  expired: "このコードは登録期限を過ぎています。",
  rate_limited: "試行回数が上限に達しました。1時間ほどおいてからお試しください。",
  card_subscription_active:
    "カードでのプレミアム登録が有効なため、コードは使用できません。解約後の期間終了を待ってからご利用ください。",
};

export function RedeemCodeForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ months: number; expiresAt: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("redeem_premium_code", {
      p_code: code,
    });

    setLoading(false);

    if (rpcError) {
      setError("エラーが発生しました。時間をおいてお試しください。");
      return;
    }

    const result = data as { ok: boolean; error?: string; duration_months?: number; expires_at?: string };

    if (!result.ok) {
      setError(ERROR_MESSAGES[result.error ?? ""] ?? "コードを利用できませんでした。");
      return;
    }

    setSuccess({
      months: result.duration_months ?? 0,
      expiresAt: result.expires_at ?? "",
    });
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    router.refresh();
  };

  if (success) {
    return (
      <div className="px-5 py-4 bg-green-50/70">
        <p className="text-[15px] font-bold text-green-800">
          プレミアムが有効になりました！
        </p>
        <p className="mt-0.5 text-xs text-green-700">
          {success.months}ヶ月分（{success.expiresAt}まで）が追加されました。毎日ガチャをお楽しみください。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 shrink-0 text-orange-500" />
        <p className="text-[15px] font-medium text-gray-900">プレミアムカードをお持ちの方</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-400">
        店舗で購入したカードのコードを入力してください
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-sm border border-gray-200 px-3 py-2 text-sm font-mono tracking-wider uppercase placeholder:normal-case focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          登録
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </form>
  );
}
