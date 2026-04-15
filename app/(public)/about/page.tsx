import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Store,
  Camera,
  Trophy,
  Smartphone,
  Search,
  Shield,
  ChevronRight,
  Mail,
} from "lucide-react";
import { AdBanner, Ad } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";

export const metadata = {
  title: "OKIPOKAとは | おきぽか",
  description:
    "OKIPOKAは沖縄のポーカートーナメント情報を全てここに集約。大会スケジュール、店舗情報、プレイヤーズフォトをリアルタイムでお届けします。",
};

export default async function AboutPage() {
  const supabase = await createClient();

  // 統計情報と広告を並列取得
  const [shopsRes, tournamentsRes, albumsRes, adsRes] = await Promise.all([
    supabase.from("shops").select("id", { count: "exact", head: true }),
    supabase.from("tournaments").select("id", { count: "exact", head: true }),
    supabase
      .from("photo_albums")
      .select("id, photo_count")
      .eq("is_published", true),
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false }),
  ]);

  const shopCount = shopsRes.count || 0;
  const tournamentCount = tournamentsRes.count || 0;
  const albumCount = albumsRes.data?.length || 0;
  const photoCount =
    albumsRes.data?.reduce((sum, a) => sum + (a.photo_count || 0), 0) || 0;

  // 広告
  const now = new Date();
  const activeAds = ((adsRes.data || []) as Ad[]).filter((ad) => {
    if (ad.start_at && new Date(ad.start_at) > now) return false;
    if (ad.end_at && new Date(ad.end_at) < now) return false;
    return true;
  });
  const bannerAds = activeAds.filter((ad) => ad.type === "banner");
  const squareAds = activeAds.filter((ad) => ad.type === "square");
  const bannerAd = bannerAds.sort(() => Math.random() - 0.5)[0] || null;
  const displaySquareAds = squareAds.sort(() => Math.random() - 0.5).slice(0, 2);

  const features = [
    {
      icon: Calendar,
      title: "大会スケジュール",
      desc: "沖縄県内のポーカートーナメントを毎日更新。日付別に開催情報をチェックできます。",
    },
    {
      icon: Store,
      title: "店舗情報",
      desc: "沖縄のポーカースポットをエリア別に網羅。営業時間やSNSも確認できます。",
    },
    {
      icon: Camera,
      title: "プレイヤーズフォト",
      desc: "イベントで撮影された写真をアルバムで公開。ダウンロード・シェアも自由です。",
    },
    {
      icon: Smartphone,
      title: "PWA対応",
      desc: "ホーム画面に追加すれば、アプリのような操作感でいつでもアクセス。",
    },
    {
      icon: Shield,
      title: "プレミアム会員",
      desc: "VIPクーポンガチャや優先情報など、特別な特典が受けられます。",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* ヒーロー + イントロ */}
      <section className="bg-gray-900 md:bg-transparent">
        {/* スマホ: 画像フルワイド → その下にテキスト */}
        {/* PC: 左に画像、右にテキスト */}
        <div className="md:flex md:items-stretch">
          <div className="md:w-3/5 md:shrink-0">
            <Image
              src="/top.png"
              alt="OKIPOKA"
              width={1000}
              height={300}
              className="w-full h-auto md:h-full md:object-cover"
              priority
            />
          </div>
          <div className="bg-white md:w-2/5 flex flex-col justify-center px-6 py-10 md:py-14 md:px-10">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
              OKIPOKAとは
            </h1>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              OKIPOKAは、沖縄県内のポーカートーナメント情報をリアルタイムで配信するプラットフォームです。
              大会スケジュール、店舗情報、プレイヤーズフォトなど、沖縄ポーカーに必要な情報をひとつのサービスに集約しました。
              初めての方もベテランプレイヤーも、沖縄のポーカーシーンをもっと楽しめるようサポートします。
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-md md:max-w-3xl mx-auto px-4">

        {/* バナー広告 */}
        {bannerAd && <AdBanner ad={bannerAd} />}

        {/* 統計 */}
        <section className="py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: shopCount, label: "登録店舗", suffix: "店舗" },
              { value: tournamentCount.toLocaleString(), label: "掲載トーナメント", suffix: "件" },
              { value: albumCount, label: "フォトアルバム", suffix: "件" },
              { value: photoCount.toLocaleString(), label: "プレイヤーズフォト", suffix: "枚" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-6 bg-white border border-gray-100"
              >
                <div className="text-2xl md:text-3xl font-black text-orange-500">
                  {stat.value}
                  <span className="text-sm font-medium text-gray-400 ml-0.5">
                    {stat.suffix}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 機能一覧 */}
        <section className="py-10">
          <h2 className="text-lg font-black text-gray-900 text-center mb-8">
            OKIPOKAでできること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 bg-white border border-gray-100"
              >
                <div className="w-10 h-10 bg-orange-50 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* スクエア広告 */}
        {displaySquareAds.length >= 2 && <AdSquareGrid ads={displaySquareAds} />}

        {/* 使い方 */}
        <section className="py-10">
          <h2 className="text-lg font-black text-gray-900 text-center mb-8">
            使い方はかんたん
          </h2>
          <div className="space-y-0">
            {[
              {
                step: "01",
                title: "サイトにアクセス",
                desc: "スマホのブラウザで OKIPOKA を開くだけ。アプリのインストール不要です。",
              },
              {
                step: "02",
                title: "今日の大会をチェック",
                desc: "トップページに本日開催のトーナメントが一覧表示。日付を切り替えて先の予定も確認。",
              },
              {
                step: "03",
                title: "ホーム画面に追加",
                desc: "「ホーム画面に追加」で次回からワンタップでアクセス。通知も受け取れます。",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="flex gap-4 p-5 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-2xl font-black text-orange-500/30 leading-none shrink-0 w-10">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-10">
          <div className="bg-gray-900 p-8 text-center">
            <h2 className="text-lg font-black text-white mb-2">
              さっそく使ってみよう
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              沖縄のポーカートーナメント情報を、いつでもどこでも。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white font-bold text-sm px-6 py-3 hover:bg-orange-600 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                今日の大会を見る
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shops"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold text-sm px-6 py-3 hover:bg-white/20 transition-colors"
              >
                <Search className="w-4 h-4" />
                店舗を探す
              </Link>
            </div>
          </div>
        </section>

        {/* 広告掲載案内 */}
        <section className="py-8">
          <div className="border border-gray-200 p-6 text-center">
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              広告掲載について
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              OKIPOKAへの広告掲載をご検討の方は、お気軽にお問い合わせください。
            </p>
            <Link
              href="/ads/contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              広告掲載のお問い合わせ
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* スピだい応援 */}
        <section className="py-8 mb-4">
          <Link
            href="/support"
            className="group block border border-gray-200 p-6 text-center hover:border-purple-200 hover:bg-purple-50/30 transition-colors"
          >
            <p className="text-xs text-gray-400 mb-1">OKIPOKAの応援プロジェクト</p>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              🌟 スピだいの挑戦を応援しています
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              詳しく見る →
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
