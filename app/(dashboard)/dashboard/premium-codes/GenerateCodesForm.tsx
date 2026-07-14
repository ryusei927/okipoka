"use client";

import { useState, useTransition } from "react";
import { Loader2, Ticket } from "lucide-react";
import { generateCodes } from "./actions";

function defaultExpiry(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function GenerateCodesForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await generateCodes(formData);
      if (result.ok) {
        setMessage({ ok: true, text: `${result.count}枚のコードを発行しました。CSVをダウンロードして印刷業者へ渡してください。` });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  };

  return (
    <form action={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <Ticket className="h-4 w-4 text-orange-500" />
        コードを一括発行
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">ロット名（店舗名など）</span>
          <input
            type="text"
            name="batchLabel"
            required
            placeholder="例: 2026-07 ジャックナイン那覇"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">発行枚数</span>
          <input
            type="number"
            name="count"
            required
            min={1}
            max={1000}
            defaultValue={50}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">期間</span>
          <select
            name="durationMonths"
            defaultValue={3}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            <option value={1}>1ヶ月</option>
            <option value={3}>3ヶ月</option>
            <option value={6}>6ヶ月</option>
            <option value={12}>12ヶ月</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">額面（円・任意）</span>
          <input
            type="number"
            name="faceValueYen"
            min={0}
            placeholder="例: 6600"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-gray-500">
            登録期限（発行から6ヶ月以内 / カードに「◯月◯日までにご登録ください」と印字）
          </span>
          <input
            type="date"
            name="expiresAt"
            required
            defaultValue={defaultExpiry()}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 sm:w-56"
          />
        </label>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-500/30 transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        発行する
      </button>
    </form>
  );
}
