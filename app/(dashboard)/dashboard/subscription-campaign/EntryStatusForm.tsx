"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "entered", label: "応募済み" },
  { value: "story_confirmed", label: "投稿確認済み / 12時間待ち" },
  { value: "eligible", label: "抽選対象" },
  { value: "won", label: "当選" },
  { value: "invalid", label: "無効" },
];

export function EntryStatusForm({
  entryId,
  defaultStatus,
  defaultAdminNote,
}: {
  entryId: string;
  defaultStatus: string;
  defaultAdminNote: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(defaultStatus);
  const [adminNote, setAdminNote] = useState(defaultAdminNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/subscription-campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entryId, status, adminNote }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新に失敗しました");
      }

      setMessage({ type: "success", text: "更新しました" });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "更新に失敗しました",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2 lg:w-72">
      <select
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
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
        value={adminNote}
        onChange={(event) => setAdminNote(event.target.value)}
        rows={2}
        placeholder="メモ（任意）"
        className="w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
      />
      {message && (
        <p
          className={`rounded-sm px-3 py-2 text-xs font-bold ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-sm bg-gray-900 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {isSaving ? "更新中..." : "更新する"}
      </button>
    </form>
  );
}
