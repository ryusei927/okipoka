import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { AdBanner, Ad } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";

export const metadata = {
  title: "OKIPOKAとは | おきぽか",
  description:
    "OKIPOKAは沖縄のポーカートーナメント情報を全てここに集約。大会スケジュール、店舗情報、プレイヤーズフォトをリアルタイムでお届けします。",
};

export default async function AboutPage() {
  const supabase = await createClient();

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
    albumsRes.data?.reduce((sum, album) => sum + (album.photo_count || 0), 0) || 0;

  const now = new Date();
  const activeAds = ((adsRes.data || []) as Ad[]).filter((ad) => {
    if (ad.start_at && new Date(ad.start_at) > now) return false;
    if (ad.end_at && new Date(ad.end_at) < now) return false;
    return true;
  });
  const bannerAds = activeAds.filter((ad) => ad.type === "banner");
  const squareAds = activeAds.filter((ad) => ad.type === "square");
  const bannerAd = bannerAds[0] || null;
  const displaySquareAds = squareAds.slice(0, 2);

  const stats = [
    { value: shopCount, label: "登録店舗", suffix: "店舗" },
    { value: tournamentCount.toLocaleString(), label: "掲載トーナメント", suffix: "件" },
    { value: albumCount, label: "フォトアルバム", suffix: "件" },
    { value: photoCount.toLocaleString(), label: "プレイヤーズフォト", suffix: "枚" },
  ];

  const features = [
    {
      label: "01",
      title: "大会スケジュール",
      desc: "今日の開催、開始時間、参加費、店舗名をまとめて確認できます。日付を切り替えて先の予定も見られます。",
    },
    {
      label: "02",
      title: "店舗情報",
      desc: "沖縄のポーカースポットをエリア別に整理。営業時間、住所、SNS、開催予定を見つけやすくしています。",
    },
    {
      label: "03",
      title: "プレイヤーズフォト",
      desc: "イベントで撮影された写真をアルバムで公開。参加した日の雰囲気や思い出をあとから見返せます。",
    },
    {
      label: "04",
      title: "スマホで見やすい",
      desc: "ブラウザでそのまま使えます。ホーム画面に追加すれば、アプリのようにすぐ開けます。",
    },
    {
      label: "05",
      title: "プレミアム会員",
      desc: "毎日1回の会員ガチャで、沖縄のポーカー店で使える特典を引けます。",
    },
  ];

  const guide = [
    ["FOR PLAYERS", "今日どこで遊べるか、どの大会があるかをすぐ確認できます。"],
    ["FOR BEGINNERS", "初めて行く店舗でも、エリアや開催予定から探しやすくしています。"],
    ["FOR SHOPS", "店舗情報、トーナメント、広告掲載でプレイヤーとの接点を増やせます。"],
  ];

  const steps = [
    ["01", "今日の大会を見る", "トップページで当日のトーナメントを確認。時間や参加費を見て予定を決めます。"],
    ["02", "店舗を調べる", "気になるお店の場所、SNS、開催予定をチェックします。"],
    ["03", "写真や特典も楽しむ", "イベント写真を見たり、プレミアム特典で次の遊びを少しお得にします。"],
  ];

  return (
    <main className="min-h-screen bg-[#eef1f4] text-[#171717]">
      <div className="mx-auto max-w-6xl bg-[#fffdf8]">
        <section className="grid gap-8 border-b border-[#ded6c7] px-4 py-8 md:grid-cols-[0.92fr_1.08fr] md:px-8 md:py-12">
          <div className="flex flex-col justify-center">
            <p className="mb-3 inline-block w-fit bg-[#171717] px-3 py-1 text-xs font-black tracking-[0.18em] text-[#fffdf8]">
              ABOUT OKIPOKA
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
              沖縄ポーカーの情報を、<br className="hidden md:block" />
              迷わず見つける。
            </h1>
            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#5f574f] md:text-base">
              OKIPOKAは、沖縄県内のポーカートーナメント、店舗情報、プレイヤーズフォトをまとめたローカル情報サイトです。
              今日どこで遊べるか、どんなお店があるか、イベントの雰囲気までひとつの場所で見られるようにしています。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="inline-flex items-center justify-center bg-[#ff6b00] px-6 py-3 text-sm font-black text-white ring-2 ring-[#171717]">
                今日の大会を見る
              </Link>
              <Link href="/shops" className="inline-flex items-center justify-center bg-white px-6 py-3 text-sm font-black text-[#171717] ring-2 ring-[#171717]">
                店舗を探す
              </Link>
            </div>
          </div>
          <Image
            src="/about-okipoka-board.svg"
            alt="OKIPOKAの情報案内ボード"
            width={1100}
            height={720}
            className="w-full border-2 border-[#171717] bg-[#171717]"
            priority
          />
        </section>

        {bannerAd && (
          <section className="border-b border-[#ded6c7] bg-[#f7f2e8] py-4">
            <AdBanner ad={bannerAd} />
          </section>
        )}

        <section className="grid border-b border-[#ded6c7] md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border-b border-[#ded6c7] p-5 md:border-b-0 md:border-r md:last:border-r-0">
              <p className="text-[10px] font-black tracking-[0.18em] text-[#ff6b00]">LIVE INDEX</p>
              <div className="mt-2 text-3xl font-black">
                {stat.value}
                <span className="ml-1 text-sm font-black text-[#6f665c]">{stat.suffix}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-[#6f665c]">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid border-b border-[#ded6c7] md:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-[#171717] p-6 text-[#fffdf8] md:p-8">
            <p className="text-xs font-black tracking-[0.18em] text-[#ff6b00]">WHAT YOU CAN FIND</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">OKIPOKAで見られるもの</h2>
            <p className="mt-4 text-sm leading-7 text-[#d8cfbf]">
              大会、店舗、写真、プレミアム特典。沖縄ポーカーに必要な情報を、毎日使いやすい形で整理しています。
            </p>
          </div>
          <div className="divide-y divide-[#ded6c7] bg-white">
            {features.map((feature) => (
              <div key={feature.title} className="grid grid-cols-[56px_1fr] gap-4 p-5">
                <div className="font-mono text-2xl font-black text-[#ff6b00]">{feature.label}</div>
                <div>
                  <h3 className="font-black">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#62594f]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid border-b border-[#ded6c7] md:grid-cols-3">
          {guide.map(([title, desc]) => (
            <div key={title} className="border-b border-[#ded6c7] p-5 md:border-b-0 md:border-r md:last:border-r-0">
              <p className="text-xs font-black tracking-[0.16em] text-[#ff6b00]">{title}</p>
              <p className="mt-3 text-sm font-medium leading-7 text-[#5f574f]">{desc}</p>
            </div>
          ))}
        </section>

        {displaySquareAds.length >= 2 && (
          <section className="border-b border-[#ded6c7] bg-[#f7f2e8] py-4">
            <AdSquareGrid ads={displaySquareAds} />
          </section>
        )}

        <section className="grid border-b border-[#ded6c7] md:grid-cols-[0.92fr_1.08fr]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-black tracking-[0.18em] text-[#ff6b00]">HOW TO USE</p>
            <h2 className="mt-2 text-2xl font-black">使い方はかんたん</h2>
          </div>
          <div className="divide-y divide-[#ded6c7] bg-white">
            {steps.map(([num, title, desc]) => (
              <div key={num} className="grid grid-cols-[52px_1fr] gap-4 p-5">
                <div className="font-mono text-2xl font-black text-[#ff6b00]">{num}</div>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#62594f]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 border-b border-[#ded6c7] bg-[#f5ecdd] px-4 py-8 text-center md:px-8">
          <p className="text-xs font-black tracking-[0.18em] text-[#ff6b00]">START</p>
          <h2 className="text-2xl font-black">今日の大会から見てみよう。</h2>
          <p className="text-sm font-medium text-[#62594f]">沖縄のポーカー情報を、いつでもどこでも。</p>
          <div className="mx-auto grid w-full max-w-lg gap-3 sm:grid-cols-2">
            <Link href="/" className="bg-[#ff6b00] px-6 py-3 text-sm font-black text-white ring-2 ring-[#171717]">
              今日の大会を見る
            </Link>
            <Link href="/premium" className="bg-white px-6 py-3 text-sm font-black text-[#171717] ring-2 ring-[#171717]">
              プレミアムを見る
            </Link>
          </div>
        </section>

        <section className="grid gap-4 px-4 py-8 md:grid-cols-2 md:px-8">
          <Link href="/advertise" className="block bg-white p-5 ring-1 ring-[#ded6c7]">
            <p className="text-xs font-black tracking-[0.16em] text-[#ff6b00]">FOR BUSINESS</p>
            <h3 className="mt-2 font-black">広告掲載について</h3>
            <p className="mt-2 text-sm leading-6 text-[#62594f]">OKIPOKAへの広告掲載をご検討の方は、掲載プランをご確認ください。</p>
          </Link>
          <Link href="/support" className="block bg-white p-5 ring-1 ring-[#ded6c7]">
            <p className="text-xs font-black tracking-[0.16em] text-[#ff6b00]">SUPPORT</p>
            <h3 className="mt-2 font-black">スピだいの挑戦を応援しています</h3>
            <p className="mt-2 text-sm leading-6 text-[#62594f]">OKIPOKAの応援プロジェクトもこちらから見られます。</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
