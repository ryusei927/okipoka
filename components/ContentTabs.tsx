"use client";

import { useState } from "react";
import { Camera, Mic, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Tab = "photos" | "interviews" | "premium";

export function ContentTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("photos");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "photos", label: "フォト", icon: <Camera className="w-4 h-4" /> },
    { key: "interviews", label: "インタビュー", icon: <Mic className="w-4 h-4" /> },
    { key: "premium", label: "プレミアム", icon: <Crown className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-md md:max-w-4xl mx-auto px-4 mt-8 mb-8">
      {/* タブヘッダー */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold transition-colors relative ${
              activeTab === tab.key
                ? "text-orange-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="pt-5">
        {activeTab === "photos" && <PhotosTab />}
        {activeTab === "interviews" && <InterviewsTab />}
        {activeTab === "premium" && <PremiumTab />}
      </div>
    </div>
  );
}

function PhotosTab() {
  return (
    <div>
      <Link href="/photos" className="block relative rounded-xl overflow-hidden group">
        <Image
          src="/prayersphoto.png"
          alt="プレイヤーズフォト"
          width={1024}
          height={367}
          className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <Link
        href="/photos"
        className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
      >
        すべてのフォトを見る
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function InterviewsTab() {
  return (
    <div>
      <Link href="/interviews" className="block relative rounded-xl overflow-hidden group bg-gray-900">
        <div className="relative h-32 flex items-center px-6">
          <div className="absolute inset-0 bg-linear-to-r from-orange-600/90 via-orange-500/70 to-orange-400/50" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-0.5">大会インタビュー</h3>
              <p className="text-xs text-white/80 font-bold">選手・運営の生の声をお届け</p>
            </div>
          </div>
        </div>
      </Link>
      <Link
        href="/interviews"
        className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
      >
        すべてのインタビューを見る
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function PremiumTab() {
  return (
    <div>
      <Link href="/premium" className="block relative rounded-xl overflow-hidden group">
        <Image
          src="/premium-banner1.png"
          alt="おきぽかプレミアム"
          width={1024}
          height={643}
          className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <Link
        href="/premium"
        className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
      >
        プレミアムの詳細を見る
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
