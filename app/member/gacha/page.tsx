"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function GachaPage() {
  const bgSrc = "/gacha.png";

  const [spinning, setSpinning] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealImageLoaded, setRevealImageLoaded] = useState(false);
  const [revealImageFailed, setRevealImageFailed] = useState(false);

  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    setRevealImageLoaded(false);
    setRevealImageFailed(false);
  }, [result?.image_url]);

  const capsules = useMemo(
    () => [
      { className: "bg-orange-200" },
      { className: "bg-pink-200" },
      { className: "bg-yellow-200" },
      { className: "bg-blue-200" },
      { className: "bg-green-200" },
      { className: "bg-purple-200" },
      { className: "bg-red-200" },
      { className: "bg-teal-200" },
      { className: "bg-indigo-200" },
      { className: "bg-amber-200" },
      { className: "bg-lime-200" },
      { className: "bg-cyan-200" },
      { className: "bg-orange-200" },
      { className: "bg-pink-200" },
      { className: "bg-yellow-200" },
      { className: "bg-blue-200" },
    ],
    []
  );

  const idleAnglesDeg = useMemo(() => {
    const n = capsules.length;
    return Array.from({ length: n }, (_, i) => {
      const base = (360 / n) * i;
      const jitter = [0, 12, -9, 20, -16, 7, 11, -6, 16, -14, 9, -8][i % 12] ?? 0;
      return base + jitter;
    });
  }, [capsules.length]);

  const spinMotion = useMemo(() => {
    const n = capsules.length;
    return Array.from({ length: n }, (_, i) => {
      const duration = 820 + (i % 6) * 95 + (i % 2) * 55;
      const delay = -i * 70;
      const variant = i % 3 === 0 ? "orbitSlow" : "orbit";
      return { duration, delay, variant };
    });
  }, [capsules.length]);

  const spinGacha = async () => {
    clearTimers();
    setError(null);
    setResult(null);
    setRevealed(false);
    setDropping(false);
    setSpinning(true);
    setRevealImageLoaded(false);
    setRevealImageFailed(false);

    const startedAt = Date.now();

    try {
      const res = await fetch("/api/gacha/spin", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        const raw = String(data.error || "");
        if (raw.includes("Subscription")) {
          throw new Error("プレミアム会員のみガチャを回せます");
        }
        if (raw.includes("Already played")) {
          throw new Error("本日のガチャはすでに回しています");
        }
        if (raw.includes("Unauthorized")) {
          throw new Error("ログインが必要です");
        }
        throw new Error(raw || "ガチャの実行に失敗しました");
      }

      // 画像は演出中に先読みして「白抜け」を減らす
      if (data?.item?.image_url) {
        try {
          const img = new window.Image();
          img.src = data.item.image_url;
        } catch {
          // ignore
        }
      }

      // 抽選中の“ため”を作る（最低時間だけ回してから落下へ）
      const minSpinMs = 2600;
      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(0, minSpinMs - elapsed);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      setDropping(true);

      const t1 = window.setTimeout(() => {
        setSpinning(false);
      }, 450);
      const t2 = window.setTimeout(() => {
        setResult(data.item);
      }, 650);
      const t3 = window.setTimeout(() => {
        setRevealed(true);
        setDropping(false);
      }, 1350);
      timersRef.current.push(t1, t2, t3);

    } catch (e: any) {
      setError(e.message);
      setSpinning(false);
      setDropping(false);
      setRevealed(false);
    }
  };

  const reset = () => {
    clearTimers();
    setResult(null);
    setRevealed(false);
    setDropping(false);
    setError(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <div
        className="absolute inset-0 bg-transparent"
        style={{ backgroundImage: `url(${bgSrc})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden
      />

      <div className="relative max-w-md mx-auto px-6 py-10 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-8 text-center">デイリーガチャ</h1>

        {/* ガチャ筐体 */}
        <div className="w-full max-w-sm" aria-live="polite">
          <div className="relative mx-auto w-[360px] max-w-full">
            {/* ドーム */}
            <div className="relative mx-auto w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-white/40 border border-gray-200 dome-rim" />
              <div className="absolute inset-2 rounded-full bg-white/25" />
              <div className="absolute inset-0 rounded-full dome-sheen" />

              {/* 内部回転カプセル */}
              <div className="absolute inset-7 rounded-full overflow-hidden">
                {capsules.map((c, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2"
                    style={
                      spinning
                        ? {
                            animation: `${spinMotion[i].variant} ${spinMotion[i].duration}ms linear infinite`,
                            animationDelay: `${spinMotion[i].delay}ms`,
                          }
                        : {
                            transform: `translate(-50%, -50%) rotate(${idleAnglesDeg[i]}deg) translateX(104px)`,
                          }
                    }
                  >
                    <div
                      className={
                        "w-12 h-12 rounded-full border border-white/70 shadow-sm " +
                        c.className
                      }
                    />
                  </div>
                ))}
              </div>

              {/* 排出口（ドーム下） */}
              <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 w-32 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm" />
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-20 h-6 rounded-full bg-gray-200/60" />
            </div>

            {/* ベース */}
            <div className="relative mx-auto w-80 max-w-full -mt-3">
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-linear-to-r from-orange-50 to-pink-50 border-b border-gray-100">
                  <div className="text-xs font-bold text-gray-600 tracking-widest">OKIPOKA GACHA</div>
                </div>
                <div className="p-4">
                  {/* 取り出し口 */}
                  <div className="relative">
                    <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 min-h-[110px] flex items-center justify-center">
                      <div
                        className={
                          "relative w-24 h-24 " +
                          (dropping ? "capsule-drop" : "")
                        }
                        aria-hidden={!dropping && !revealed}
                      >
                        <div
                          className={
                            "absolute inset-0 rounded-full border border-white/70 shadow-sm bg-orange-200 " +
                            (revealed ? "capsule-open" : "")
                          }
                        />
                        {revealed ? (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            {result ? (
                              result.type === "none" ? (
                                <span className="text-2xl">😢</span>
                              ) : result.image_url && !revealImageFailed ? (
                                <div className="relative w-20 h-20">
                                  {!revealImageLoaded ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-2xl">🎁</span>
                                    </div>
                                  ) : null}
                                  <Image
                                    src={result.image_url}
                                    alt={result.name || "景品"}
                                    fill
                                    sizes="80px"
                                    className="object-contain"
                                    priority
                                    onLoadingComplete={() => setRevealImageLoaded(true)}
                                    onError={() => {
                                      setRevealImageFailed(true);
                                      setRevealImageLoaded(false);
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-2xl">🎁</span>
                              )
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      {spinning ? "回転中…" : result ? "結果が出ました" : "タップして回す"}
                    </div>
                  </div>

                  {/* ボタン */}
                  {!result ? (
                    <button
                      onClick={spinGacha}
                      disabled={spinning}
                      className="mt-4 w-full bg-linear-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-8 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {spinning ? "抽選中…" : "ガチャを回す！"}
                    </button>
                  ) : (
                    <button
                      onClick={reset}
                      className="mt-4 w-full bg-white text-gray-700 font-bold py-4 px-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      もう一度見る
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {result && revealed ? (
          <div className="w-full max-w-sm mt-6">
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <div className="px-4 py-3 bg-linear-to-r from-orange-50 to-pink-50 border-b border-gray-100">
                <div className="text-xs font-bold text-gray-600 tracking-widest">RESULT</div>
                <div className="mt-1 text-lg font-extrabold text-gray-900 leading-tight break-words">
                  {result.type === "none" ? "ざんねん…" : result.name}
                </div>
              </div>
              <div className="px-4 py-4">
                {result.type === "none" ? (
                  <div className="text-sm text-gray-600">明日また挑戦してね。</div>
                ) : (
                  <>
                    {result.description ? (
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {result.description}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700">当たり！</div>
                    )}
                    <Link
                      href="/member/items"
                      className="mt-4 block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <p className="text-sm text-yellow-800">マイページの「獲得アイテム」から確認できます</p>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        <style jsx>{`
          .dome-rim {
            box-shadow:
              0 18px 40px rgba(0, 0, 0, 0.06),
              inset 0 0 0 10px rgba(255, 255, 255, 0.45);
          }

          @keyframes sheen {
            0% {
              transform: translateX(-30%) rotate(18deg);
              opacity: 0;
            }
            25% {
              opacity: 0.75;
            }
            55% {
              opacity: 0.35;
            }
            100% {
              transform: translateX(30%) rotate(18deg);
              opacity: 0;
            }
          }

          .dome-sheen {
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.55) 28%,
              rgba(255, 255, 255, 0) 55%
            );
            filter: blur(0.2px);
            mix-blend-mode: screen;
            animation: sheen 2.8s ease-in-out infinite;
            pointer-events: none;
          }

          /* capsules orbit */
          @keyframes orbit {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) translateX(104px) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg) translateX(104px) rotate(-360deg);
            }
          }

          @keyframes orbitSlow {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) translateX(92px) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg) translateX(92px) rotate(-360deg);
            }
          }

          /* capsule drop */
          @keyframes drop {
            0% {
              transform: translateY(-28px) scale(0.85);
              opacity: 0;
            }
            40% {
              transform: translateY(0px) scale(1);
              opacity: 1;
            }
            65% {
              transform: translateY(6px) scale(0.98);
            }
            100% {
              transform: translateY(0px) scale(1);
              opacity: 1;
            }
          }
          .capsule-drop {
            animation: drop 520ms ease-out both;
          }

          @keyframes open {
            0% {
              transform: scale(1);
            }
            100% {
              transform: scale(1);
            }
          }
          .capsule-open {
            animation: open 1ms linear both;
          }

          @media (prefers-reduced-motion: reduce) {
            .orbit-a,
            .orbit-b,
            .orbit-c,
            .orbit-d,
            .orbit-e,
            .orbit-f,
            .capsule-drop {
              animation: none !important;
            }

            .dome-sheen {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
