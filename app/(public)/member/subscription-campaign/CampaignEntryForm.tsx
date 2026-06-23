"use client";

import { SUBSCRIPTION_CAMPAIGN } from "@/lib/subscription-campaign";
import { AtSign, Camera, ChevronRight, Instagram } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampaignEntryForm() {
  const router = useRouter();
  const [instagramUsername, setInstagramUsername] = useState("");
  const [campaignConsent, setCampaignConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/member/subscription-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramUsername, campaignConsent }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "応募に失敗しました");
      }

      router.push("/member/subscription-campaign?created=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "応募に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ol className="space-y-3">
        <Step n={1} icon={<AtSign className="h-4 w-4" />}>
          InstagramユーザーIDを入力して応募
        </Step>
        <Step n={2} icon={<Camera className="h-4 w-4" />}>
          表示された抽選番号をスクショ
        </Step>
        <Step n={3} icon={<Instagram className="h-4 w-4" />}>
          ストーリーに投稿して @{SUBSCRIPTION_CAMPAIGN.instagramAccount} をメンション
        </Step>
      </ol>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="instagramUsername" className="text-sm font-bold text-gray-900">
            InstagramユーザーID
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 focus-within:border-orange-400 focus-within:bg-white">
            <Instagram className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-400">@</span>
            <input
              id="instagramUsername"
              name="instagramUsername"
              type="text"
              required
              maxLength={80}
              value={instagramUsername}
              onChange={(event) => setInstagramUsername(event.target.value)}
              placeholder="okipoka"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            抽選番号と一緒に保存されます。入力ミスにご注意ください。
          </p>
        </div>

        <label className="flex gap-3 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-600 ring-1 ring-gray-100">
          <input
            type="checkbox"
            name="campaignConsent"
            required
            checked={campaignConsent}
            onChange={(event) => setCampaignConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
          />
          <span>
            応募条件に同意します。当選した場合、OKIPOKA公式アカウントでInstagramユーザーIDまたは抽選番号をメンション・掲載されること、当選連絡をInstagram DMで受け取り、賞品発送やギフトコード送付に必要な情報をDMで確認されることに同意します。
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {isSubmitting ? "応募中..." : "抽選番号を発行して応募"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}

function Step({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        {icon}
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
          {n}
        </span>
      </span>
      <span className="text-sm leading-snug text-gray-700">{children}</span>
    </li>
  );
}
