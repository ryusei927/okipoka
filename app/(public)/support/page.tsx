import Image from "next/image";
import { Trophy, Globe, Star, ExternalLink, Instagram, Twitter } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ヒーローセクション */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/dai01.jpg')] bg-cover bg-center opacity-20 blur-sm scale-110" />
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/50 via-slate-900/80 to-slate-900" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star className="w-4 h-4 fill-orange-400" />
            OFFICIAL SPONSORSHIP
          </div>
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-tight">
            OKIPOKAは<br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">スピだい</span>の
            <span className="inline-block">挑戦を応援しています</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-loose animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            沖縄から世界へ。<br className="sm:hidden" />
            ポーカーという競技を通じて<br className="sm:hidden" />
            限界に挑み続けるプレイヤーを、<br className="sm:hidden" />
            応援します。
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
        {/* メインプロフィールカード */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
          <div className="md:w-1/2 relative h-96 md:h-auto min-h-[400px] bg-slate-200">
            <Image
              src="/dai01.jpg"
              alt="スピだい"
              fill
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent md:hidden" />
            <div className="absolute bottom-4 left-4 text-white md:hidden">
              <div className="text-sm font-bold opacity-80">Professional Poker Player</div>
              <div className="text-3xl font-black">SPIDAI</div>
            </div>
          </div>
          
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="hidden md:block mb-6">
              <div className="text-sm font-bold text-orange-500 tracking-widest mb-1">PLAYER PROFILE</div>
              <h2 className="text-4xl font-black text-slate-900">SPIDAI</h2>
              <p className="text-slate-400 font-bold">スピだい</p>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">
              沖縄を拠点に活動するポーカープレイヤー。
              アグレッシブなプレイスタイルと冷静な判断力を武器に、国内外のトーナメントで活躍中。
              ポーカーの普及活動にも力を入れており、沖縄のポーカーシーンを牽引する存在として注目を集めている。
            </p>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                主な戦績
              </h3>
              
              <div className="space-y-3">
                {/* 2024年の実績 */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-md">2024</span>
                    <span className="text-xs font-bold text-orange-600">Latest</span>
                  </div>
                  <ul className="space-y-2 text-sm font-bold text-slate-800">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">●</span>
                      台湾 AJPC Main Event 14位
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">●</span>
                      台湾 ZSOP Final Table ×2 (インマネ)
                    </li>
                  </ul>
                </div>
                
                {/* 2023年の実績 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 mb-2">2023</div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-300 mt-1">●</span>
                      APT Mini Championship 8位 (日本人最高位)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-300 mt-1">●</span>
                      Doyle Brunson Memorial 準優勝
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-300 mt-1">●</span>
                      HKPT Korea / Taiwan AJPC / APT 賞金獲得
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-300 mt-1">●</span>
                      全日本ランキング / 新人王ランキング 上位
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-300 mt-1">●</span>
                      全日本 PLO 上位入賞
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                   <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">World Ranking Listed</span>
                   <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">2022-2023 All Japan Player</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <a href="#" className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/damima.poker?igsh=MW1sM3V0YWZoYnQ5MQ==" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-tr from-yellow-500 via-red-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
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
