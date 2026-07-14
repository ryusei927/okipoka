import type { Metadata } from "next";

// page.tsx がクライアントコンポーネントのため、metadataはここで定義する
export const metadata: Metadata = {
  title: "おきぽかプレミアム | 月額2,200円で毎日ガチャ",
  description:
    "月額2,200円（税込）で毎日1回ハズレなしの会員ガチャ。沖縄のポーカー店舗で使える割引券やドリンクチケットが当たります。いつでも解約OK。",
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
