"use client";

import Image from "next/image";
import { Trophy, Globe, Star, ExternalLink, Instagram, Twitter, Sparkles, Moon, Sun, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SupportPage() {
  const [stars, setStars] = useState<Array<{ style: React.CSSProperties }>>([]);

  useEffect(() => {
    setStars([...Array(30)].map(() => ({
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.7 + 0.3
      }
    })));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0c29] text-white overflow-hidden relative selection:bg-purple-500 selection:text-white">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cosmic-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
          100% { transform: translateX(-500px) translateY(500px) rotate(-45deg); opacity: 0; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .bg-aurora {
          background: linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #4a148c, #1a237e);
          background-size: 400% 400%;
          animation: aurora 15s ease infinite;
        }
        .shooting-star {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.1), 0 0 0 8px rgba(255,255,255,0.1), 0 0 20px rgba(255,255,255,1);
          animation: shooting-star 3s linear infinite;
        }
        .shooting-star::before {
          content: '';
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 300px;
          height: 1px;
          background: linear-gradient(90deg, white, transparent);
        }
      `}</style>
      
      {/* 背景レイヤー */}
      <div className="absolute inset-0 bg-aurora z-0" />

      {/* 神秘的な渦巻きエフェクト */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] opacity-20 pointer-events-none z-0 mix-blend-screen">
         <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0%,#a855f7_20%,transparent_40%,#a855f7_60%,transparent_80%)] rounded-full blur-3xl animate-[spin_60s_linear_infinite]" />
      </div>

      {/* 🌀パーティクル (SVG自作) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <svg className="absolute top-[15%] left-[10%] w-20 h-20 opacity-40 animate-[spin_10s_linear_infinite] text-purple-400 blur-[1px]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M50 50 m0 0 a5 5 0 0 1 5 5 a10 10 0 0 1 -15 5 a15 15 0 0 1 -10 -20 a20 20 0 0 1 30 -10 a25 25 0 0 1 15 35 a30 30 0 0 1 -45 5" />
         </svg>
         <svg className="absolute top-[40%] right-[5%] w-32 h-32 opacity-30 animate-[spin_15s_linear_infinite] text-yellow-200 blur-[2px]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M50 50 m0 0 a5 5 0 0 1 5 5 a10 10 0 0 1 -15 5 a15 15 0 0 1 -10 -20 a20 20 0 0 1 30 -10 a25 25 0 0 1 15 35 a30 30 0 0 1 -45 5" />
         </svg>
         <svg className="absolute bottom-[20%] left-[15%] w-24 h-24 opacity-30 animate-[spin_12s_linear_infinite] text-pink-400 blur-[1px]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M50 50 m0 0 a5 5 0 0 1 5 5 a10 10 0 0 1 -15 5 a15 15 0 0 1 -10 -20 a20 20 0 0 1 30 -10 a25 25 0 0 1 15 35 a30 30 0 0 1 -45 5" />
         </svg>
         
         {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={star.style}
            />
         ))}
         <div className="shooting-star" style={{ top: '10%', right: '10%', animationDelay: '0s' }} />
         <div className="shooting-star" style={{ top: '20%', right: '20%', animationDelay: '5s' }} />
         <div className="shooting-star" style={{ top: '50%', right: '5%', animationDelay: '10s' }} />
      </div>

      {/* ヒーローセクション */}
      <div className="relative overflow-hidden z-10">
        
        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-500/50 text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            OFFICIAL PARTNER
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            OKIPOKAは<br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-300 via-purple-400 to-indigo-500 animate-pulse">スピだい</span>の
            <span className="inline-block">挑戦を応援しています</span>
          </h1>
          <p className="text-base sm:text-xl text-purple-200 max-w-2xl mx-auto leading-loose animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-serif italic">
            沖縄から世界へ。<br className="sm:hidden" />
            ポーカーという競技を通じて<br className="sm:hidden" />
            限界に挑み続けるプレイヤーを、<br className="sm:hidden" />
            応援します。
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
        {/* メインプロフィールカード */}
        <div className="bg-black/40 backdrop-blur-md rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.3)] overflow-hidden border border-purple-500/30 flex flex-col md:flex-row animate-float-slow relative z-10">
          <div className="md:w-1/2 relative h-96 md:h-auto min-h-100 bg-slate-900/50 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/dai01.jpg')] bg-cover bg-center opacity-50 blur-sm scale-110 group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative w-64 h-64 rounded-full p-1 bg-linear-to-tr from-yellow-400 via-purple-500 to-indigo-600 shadow-[0_0_60px_rgba(234,179,8,0.6)] animate-[spin_10s_linear_infinite]">
               <div className="w-full h-full rounded-full bg-black" /> 
            </div>
            <div className="absolute w-64 h-64 rounded-full overflow-hidden border-4 border-transparent">
                <Image
                src="/dai01.jpg"
                alt="スピだい"
                fill
                className="object-cover object-top"
                priority
                />
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center text-white md:hidden">
              <div className="text-sm font-bold text-purple-300 tracking-[0.2em] mb-1">Professional Poker Player</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-200 via-white to-purple-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SPIDAI</div>
            </div>
          </div>
          
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-purple-50">
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-2 text-sm font-bold text-yellow-400 tracking-[0.3em] mb-2">
                <Moon className="w-4 h-4" />
                PLAYER PROFILE
                <Sun className="w-4 h-4" />
              </div>
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-200 via-purple-200 to-indigo-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] mb-2">SPIDAI</h2>
              <p className="text-purple-300 font-serif text-lg">スピだい</p>
            </div>

            <p className="text-purple-100 leading-relaxed mb-6 font-serif">
              沖縄を拠点に活動するポーカープレイヤー。
              アグレッシブなプレイスタイルと冷静な判断力を武器に、国内外のトーナメントで活躍中。
              ポーカーの普及活動にも力を入れており、沖縄のポーカーシーンを牽引する存在として注目を集めている。
            </p>

            <div className="mb-10 relative">
              <div className="absolute -left-4 -top-4 text-6xl text-purple-500/20 font-serif">❝</div>
              <p className="text-purple-300 font-bold text-sm italic mb-3 pl-4 border-l-2 border-purple-500">
                「ポーカーに救われたから、ポーカーで恩返しを。」
              </p>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 rounded-lg blur opacity-30 animate-pulse"></div>
                <p className="relative text-3xl sm:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 tracking-wider drop-shadow-[0_0_25px_rgba(234,179,8,0.8)] pl-4 animate-float whitespace-nowrap">
                  沖縄から世界へ。
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-6xl text-purple-500/20 font-serif rotate-180">❝</div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-yellow-200 mb-4 flex items-center gap-2 tracking-widest border-b border-purple-500/30 pb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                主な戦績
              </h3>
              
              <div className="space-y-4">
                {/* 2025年の実績 */}
                <div className="bg-purple-900/40 p-5 rounded-xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-0.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]">2025</span>
                    <span className="text-xs font-bold text-yellow-400 animate-pulse">Latest</span>
                  </div>
                  <ul className="space-y-3 text-sm font-medium text-purple-100">
                    <li className="flex items-start gap-3">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0 fill-yellow-400" />
                      <span>沖縄 It&apos;s Showdown 年間チャンピオン<br/><span className="text-xs text-purple-400">（43回開催 / 1,697エントリー）</span></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                      台湾 AJPC Main Event 14位
                    </li>
                    <li className="flex items-start gap-3">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                      台湾 ZSOP Final Table ×2 (インマネ)
                    </li>
                  </ul>
                </div>
                
                {/* 2024年の実績 */}
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-400 mb-3">2024</div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      APT Mini Championship 8位 (日本人最高位)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      Doyle Brunson Memorial 準優勝
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      HKPT Korea / Taiwan AJPC / APT 賞金獲得
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      全日本ランキング / 新人王ランキング 上位
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      全日本 PLO 上位入賞
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                   <span className="px-3 py-1 bg-purple-900/30 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">World Ranking Listed</span>
                   <span className="px-3 py-1 bg-purple-900/30 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">2022-2023 All Japan Player</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <a href="#" className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white hover:bg-purple-900 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300 border border-purple-500/30">
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/damima.poker?igsh=MW1sM3V0YWZoYnQ5MQ==" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-tr from-yellow-500 via-red-500 to-purple-500 text-white hover:scale-110 hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
