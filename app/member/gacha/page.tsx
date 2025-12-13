"use client";

import { useState } from "react";
import { Gift, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function GachaPage() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const spinGacha = async () => {
    setSpinning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/gacha/spin", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ガチャの実行に失敗しました");
      }

      // 演出のために少し待つ
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult(data.item);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 min-h-[80vh] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8 text-center">デイリーガチャ</h1>

      <div className="relative w-64 h-64 mb-8">
        {/* ガチャマシンの演出（簡易） */}
        <div className={`w-full h-full bg-orange-100 rounded-full flex items-center justify-center transition-all duration-500 ${spinning ? "animate-spin" : ""}`}>
          {result ? (
            <div className="text-center animate-bounce">
              {result.type === 'none' ? (
                <span className="text-6xl">😢</span>
              ) : result.image_url ? (
                <div className="relative w-40 h-40">
                  <Image
                    src={result.image_url}
                    alt={result.name || "景品"}
                    fill
                    sizes="160px"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <span className="text-6xl">🎁</span>
              )}
            </div>
          ) : (
            <Gift className="w-32 h-32 text-orange-500" />
          )}
        </div>
      </div>

      {result && (
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-2">{result.name}</h2>
          <p className="text-gray-600">{result.description}</p>
          {result.type !== 'none' && (
            <Link
              href="/member/items"
              className="mt-4 block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <p className="text-sm text-yellow-800">マイページの「獲得アイテム」から確認できます</p>
            </Link>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!result && (
        <button
          onClick={spinGacha}
          disabled={spinning}
          className="w-full max-w-xs bg-linear-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {spinning ? "抽選中..." : "ガチャを回す！"}
        </button>
      )}
      
      {result && (
        <button
          onClick={() => window.location.reload()}
          className="text-gray-500 underline hover:text-gray-800"
        >
          戻る
        </button>
      )}
    </div>
  );
}
