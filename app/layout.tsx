import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OKIPOKA | 沖縄ポーカーポータル",
    template: "%s | OKIPOKA",
  },
  description: "沖縄のポーカー情報を全てここに。毎日のトーナメント情報や店舗の詳細情報をリアルタイムでお届けします。",
  keywords: ["沖縄", "ポーカー", "アミューズメントカジノ", "トーナメント", "テキサスホールデム", "OKIPOKA", "オキポカ"],
  openGraph: {
    title: "OKIPOKA | 沖縄ポーカーポータル",
    description: "沖縄のポーカー情報を全てここに。毎日のトーナメント情報や店舗の詳細情報をリアルタイムでお届けします。",
    url: "https://www.okipoka.com",
    siteName: "OKIPOKA",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OKIPOKA | 沖縄ポーカーポータル",
    description: "沖縄のポーカー情報を全てここに。毎日のトーナメント情報や店舗の詳細情報をリアルタイムでお届けします。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 min-h-screen`}
        style={{ backgroundColor: 'white' }}
      >
        {children}
      </body>
    </html>
  );
}
