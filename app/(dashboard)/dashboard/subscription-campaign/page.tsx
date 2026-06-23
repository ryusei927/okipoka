import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_CAMPAIGN,
  formatCampaignDateTime,
} from "@/lib/subscription-campaign";
import { CheckCircle2, Clock, Gift, Instagram, Ticket, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import type React from "react";
import { updateCampaignEntryStatus } from "./actions";

export const dynamic = "force-dynamic";

type EntryProfile = {
  display_name: string | null;
  subscription_status: string | null;
  payment_method: string | null;
};

type CampaignEntry = {
  id: string;
  instagram_username: string;
  draw_number: string;
  status: string;
  story_checked_at: string | null;
  eligible_at: string | null;
  admin_note: string | null;
  created_at: string;
  profiles?: EntryProfile | EntryProfile[] | null;
};

const STATUS_OPTIONS = [
  { value: "entered", label: "応募済み" },
  { value: "story_confirmed", label: "投稿確認済み / 12時間待ち" },
  { value: "eligible", label: "抽選対象" },
  { value: "won", label: "当選" },
  { value: "invalid", label: "無効" },
];

export default async function SubscriptionCampaignAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_campaign_entries")
    .select(
      "id,instagram_username,draw_number,status,story_checked_at,eligible_at,admin_note,created_at,profiles(display_name,subscription_status,payment_method)"
    )
    .eq("campaign_key", SUBSCRIPTION_CAMPAIGN.key)
    .order("created_at", { ascending: false });

  const entries = (data ?? []) as unknown as CampaignEntry[];
  const stats = {
    total: entries.length,
    confirmed: entries.filter((entry) => entry.status === "story_confirmed").length,
    eligible: entries.filter((entry) => entry.status === "eligible" || entry.status === "won").length,
    invalid: entries.filter((entry) => entry.status === "invalid").length,
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">サブスクキャンペーン応募</h1>
          <p className="mt-1 text-sm text-gray-500">
            Instagramストーリー投稿を確認し、抽選対象者を管理します。
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.startAt)} - {formatCampaignDateTime(SUBSCRIPTION_CAMPAIGN.endAt)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Ticket} label="応募数" value={stats.total} className="text-orange-600 bg-orange-50" />
        <StatCard icon={Clock} label="12時間待ち" value={stats.confirmed} className="text-amber-600 bg-amber-50" />
        <StatCard icon={CheckCircle2} label="抽選対象" value={stats.eligible} className="text-green-600 bg-green-50" />
        <StatCard icon={XCircle} label="無効" value={stats.invalid} className="text-red-600 bg-red-50" />
      </div>

      <div className="rounded-sm bg-white p-4 text-sm text-gray-600 ring-1 ring-gray-200">
        <p className="font-bold text-gray-900">運用メモ</p>
        <p className="mt-1 leading-relaxed">
          メンション通知で投稿を確認したら「投稿確認済み / 12時間待ち」に変更してください。
          その時刻から {SUBSCRIPTION_CAMPAIGN.storyHoldHours} 時間後の再確認で「抽選対象」に変更します。
        </p>
      </div>

      {error && (
        <div className="rounded-sm bg-red-50 p-4 text-sm font-bold text-red-600 ring-1 ring-red-100">
          応募者の取得に失敗しました: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-sm bg-white py-12 text-center text-gray-500 ring-1 ring-gray-200">
            <Gift className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            まだ応募はありません
          </div>
        ) : (
          entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: CampaignEntry }) {
  const status = getStatusView(entry);
  const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
  const createdAt = new Date(entry.created_at).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-sm bg-white p-4 ring-1 ring-gray-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-black text-gray-950">{entry.draw_number}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1 font-bold text-gray-900">
              <Instagram className="h-4 w-4 text-pink-500" />@{entry.instagram_username}
            </span>
            <span>{profile?.display_name || "(名前未設定)"}</span>
            <span>応募: {createdAt}</span>
          </div>
          {entry.eligible_at && (
            <p className="mt-2 text-xs text-gray-500">
              抽選対象にできる目安: {formatCampaignDateTime(entry.eligible_at)}
            </p>
          )}
          {entry.admin_note && (
            <p className="mt-2 rounded-sm bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {entry.admin_note}
            </p>
          )}
        </div>

        <form action={updateCampaignEntryStatus} className="w-full space-y-2 lg:w-72">
          <input type="hidden" name="id" value={entry.id} />
          <select
            name="status"
            defaultValue={entry.status}
            className="w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            name="adminNote"
            defaultValue={entry.admin_note ?? ""}
            rows={2}
            placeholder="メモ（任意）"
            className="w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="w-full rounded-sm bg-gray-900 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800"
          >
            更新する
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-sm bg-white p-4 ring-1 ring-gray-200">
      <div className={`flex h-9 w-9 items-center justify-center rounded-sm ${className}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}

function getStatusView(entry: CampaignEntry) {
  const now = Date.now();
  const eligibleAt = entry.eligible_at ? new Date(entry.eligible_at).getTime() : null;

  if (entry.status === "story_confirmed" && eligibleAt && eligibleAt > now) {
    return { label: "12時間待ち", className: "bg-amber-50 text-amber-700" };
  }

  switch (entry.status) {
    case "story_confirmed":
      return { label: "再確認待ち", className: "bg-blue-50 text-blue-700" };
    case "eligible":
      return { label: "抽選対象", className: "bg-green-50 text-green-700" };
    case "won":
      return { label: "当選", className: "bg-orange-50 text-orange-700" };
    case "invalid":
      return { label: "無効", className: "bg-red-50 text-red-600" };
    case "entered":
    default:
      return { label: "応募済み", className: "bg-gray-100 text-gray-600" };
  }
}
