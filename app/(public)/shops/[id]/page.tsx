import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin, Clock, Phone, ExternalLink, Instagram,
  ChevronRight, Users, Sparkles, Dices, MessageCircle,
} from "lucide-react";
import {
  getFeaturedShop,
  getAllFeaturedSlugs,
  type ShopFeature,
  type ShopFeatureAppeal,
} from "@/lib/shop-features";
import { ShopFeatureFaq } from "@/components/shop-feature/ShopFeatureFaq";
import { ShopFeatureGallery } from "@/components/shop-feature/ShopFeatureGallery";

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const feature = getFeaturedShop(id);
  if (!feature) return {};

  return {
    title: feature.meta.title,
    description: feature.meta.description,
    openGraph: {
      title: feature.meta.title,
      description: feature.meta.description,
      ...(feature.meta.ogImage
        ? { images: [{ url: feature.meta.ogImage, width: 1920, height: 1280 }] }
        : {}),
    },
  };
}

// ─────────────────────────────────────────────
// アイコンマップ
// ─────────────────────────────────────────────

const ICON_MAP = {
  users: Users,
  sparkles: Sparkles,
  dices: Dices,
  message: MessageCircle,
} as const;

function AppealIcon({ type }: { type: ShopFeatureAppeal["icon"] }) {
  const Icon = ICON_MAP[type];
  return <Icon className="w-5 h-5 text-orange-400" />;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feature = getFeaturedShop(id);

  // 特設ページデータが無い → 従来どおり店舗一覧へリダイレクト
  if (!feature) {
    redirect(`/shops#shop-${id}`);
  }

  // DB から店舗 ID + トーナメントを取得
  const supabase = await createClient();

  const slugFilter = feature.dbSlugs.map((s) => `slug.eq.${s}`).join(",");
  const { data: shop } = await supabase
    .from("shops")
    .select("id, slug")
    .or(`${slugFilter},name.ilike.${feature.dbNamePattern}`)
    .maybeSingle();

  let tournaments: {
    id: string;
    title: string;
    start_at: string;
    buy_in: string | null;
  }[] = [];

  if (shop) {
    const { data } = await supabase
      .from("tournaments")
      .select("id, title, start_at, buy_in")
      .eq("shop_id", shop.id)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(5);
    tournaments = data || [];
  }

  const shopListHref = shop ? `/shops#shop-${shop.id}` : "/shops";
  const { info } = feature;
  const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.googleMapQuery ?? info.address)}`;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* ① メインビジュアル */}
      <section className="relative min-h-[92vh] flex items-end">
        <Image
          src={feature.hero.image}
          alt={`${feature.hero.shopName}店内`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-12 md:pb-16">
          <div className="max-w-2xl">
            <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-4">
              {feature.hero.tagline}
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.3] tracking-tight whitespace-pre-line">
              {feature.hero.catchcopy.split("\n").map((line, i, arr) =>
                i === arr.length - 1 ? (
                  <span key={i} className="text-orange-400">{line}</span>
                ) : (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ),
              )}
            </h1>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-xl md:text-2xl font-black tracking-wide">
                {feature.hero.shopName}
              </span>
              <span className="text-sm text-gray-400 font-medium">
                {feature.hero.shopNameEn}
              </span>
            </div>
            <p className="mt-4 text-sm md:text-base text-gray-300 leading-relaxed max-w-lg whitespace-pre-line">
              {feature.hero.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {feature.hero.badges.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 text-xs font-bold bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#events"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3.5 transition-colors"
              >
                大会・イベント情報
                <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="#access"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold text-sm px-6 py-3.5 border border-white/20 transition-colors"
              >
                店舗情報・アクセス
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ② 店内紹介動画 */}
      <section className="bg-[#111] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">MOVIE</p>
          <h2 className="text-xl md:text-2xl font-black mb-2">
            まずは、店内の雰囲気をのぞいてみよう。
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            写真だけでは伝わりきらない店内の空気を、動画でご紹介します。
          </p>

          {feature.video ? (
            feature.video.type === "youtube" ? (
              <iframe
                src={feature.video.src}
                className="w-full aspect-video border border-white/10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${feature.hero.shopName}の店内動画`}
              />
            ) : (
              <video
                src={feature.video.src}
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-video bg-black border border-white/10"
              >
                <track kind="captions" />
              </video>
            )
          ) : (
            <div className="relative aspect-video bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-white/60 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">動画は近日公開予定</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ③ リバータ・プラスの魅力 */}
      <section className="bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
              FEATURES
            </p>
            <h2 className="text-2xl md:text-3xl font-black">
              {feature.appeals.heading}
            </h2>
          </div>

          <div className="grid gap-8 md:gap-6 md:grid-cols-3">
            {feature.appeals.items.map((item, i) => (
              <div key={i} className="group">
                <div className="relative aspect-[4/3] overflow-hidden mb-5">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <AppealIcon type={item.icon} />
                  </div>
                </div>
                <h3 className="text-lg font-black mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ 初めての方へ */}
      <section className="bg-[#111] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
            FOR BEGINNERS
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            {feature.beginners.heading}
          </h2>

          <div className="bg-white/5 border border-white/10 p-6 md:p-8">
            {feature.beginners.paragraphs.map((p, i) => (
              <p
                key={i}
                className={`text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-line ${i > 0 ? "mt-4" : ""}`}
              >
                {p}
              </p>
            ))}
            {feature.beginners.note && (
              <p className="mt-6 text-xs text-gray-500">{feature.beginners.note}</p>
            )}
            {feature.beginners.ctaUrl && (
              <div className="mt-6">
                <a
                  href={feature.beginners.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-3 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  {feature.beginners.ctaLabel ?? "お問い合わせ"}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⑤ 店内フォトギャラリー */}
      {feature.gallery.length > 0 && (
        <section className="bg-[#0d0d0d]">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
              GALLERY
            </p>
            <h2 className="text-xl md:text-2xl font-black mb-8">
              今夜を過ごす、こんな空間。
            </h2>
            <ShopFeatureGallery images={feature.gallery} />
          </div>
        </section>
      )}

      {/* ⑥ トーナメント・イベント情報 */}
      <section id="events" className="bg-[#111] border-y border-white/5 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
            EVENTS
          </p>
          <h2 className="text-xl md:text-2xl font-black mb-2">
            次の楽しみを、見つけよう。
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {feature.hero.shopName}
            の大会・イベント情報をチェック。気になる開催日や内容をご確認ください。
          </p>

          {tournaments.length > 0 ? (
            <div className="divide-y divide-white/10 border border-white/10">
              {tournaments.map((t) => {
                const d = new Date(t.start_at);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                const weekday = ["日", "月", "火", "水", "木", "金", "土"][
                  d.getDay()
                ];
                const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

                return (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="shrink-0 w-16 text-center">
                      <div className="text-lg font-black text-white">
                        {dateStr}
                      </div>
                      <div className="text-[10px] font-bold text-gray-500">
                        ({weekday})
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                        {t.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {timeStr}〜
                        </span>
                        {t.buy_in && (
                          <span className="text-xs text-gray-500">
                            参加費: {t.buy_in}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-white/10 p-8 text-center">
              <p className="text-sm text-gray-500">
                現在予定されている大会はありません
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href={shopListHref}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-5 py-3 transition-colors"
            >
              このお店の大会情報を見る
              <ChevronRight className="w-4 h-4" />
            </Link>
            {info.instagram && (
              <a
                href={info.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-5 py-3 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                公式Instagramで最新情報を見る
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ⑦ 料金案内 */}
      {feature.pricing && (
        <section className="bg-[#0d0d0d]">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
            <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
              PRICING
            </p>
            <h2 className="text-xl md:text-2xl font-black mb-2">
              {feature.pricing.heading}
            </h2>
            <p className="text-sm text-gray-400 mb-8 whitespace-pre-line">
              {feature.pricing.description}
            </p>
            <a
              href={feature.pricing.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {feature.pricing.ctaLabel}
            </a>
          </div>
        </section>
      )}

      {/* ⑧ よくある質問 */}
      {feature.faq.length > 0 && (
        <section className="bg-[#111] border-y border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
            <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
              FAQ
            </p>
            <h2 className="text-xl md:text-2xl font-black mb-8">
              よくある質問
            </h2>
            <ShopFeatureFaq items={feature.faq} />
          </div>
        </section>
      )}

      {/* ⑨ 店舗情報・アクセス */}
      <section id="access" className="bg-[#0d0d0d] scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-3">
            ACCESS
          </p>
          <h2 className="text-xl md:text-2xl font-black mb-8">
            久茂地で、今夜の遊び場に。
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="border border-white/10 divide-y divide-white/10">
              <InfoRow label="店舗名">
                <p className="text-sm font-bold text-white">{info.name}</p>
                <p className="text-xs text-gray-500">{info.nameEn}</p>
              </InfoRow>
              <InfoRow label="住所">
                <p className="text-sm text-gray-300">
                  {info.zip}
                  <br />
                  {info.address}
                </p>
              </InfoRow>
              <InfoRow label="アクセス">
                <p className="text-sm text-gray-300">{info.access}</p>
              </InfoRow>
              <InfoRow label="営業時間">
                <p className="text-sm text-gray-300">{info.hours}</p>
              </InfoRow>
              <InfoRow label="電話">
                <a
                  href={`tel:${info.phone}`}
                  className="text-sm text-gray-300 hover:text-orange-400 transition-colors"
                >
                  {info.phone}
                </a>
              </InfoRow>
              {info.instagramHandle && (
                <InfoRow label="Instagram">
                  <a
                    href={info.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-orange-400 transition-colors"
                  >
                    {info.instagramHandle}
                  </a>
                </InfoRow>
              )}
              {info.website && (
                <InfoRow label="公式サイト">
                  <a
                    href={info.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-orange-400 transition-colors break-all"
                  >
                    {new URL(info.website).hostname}
                  </a>
                </InfoRow>
              )}
            </div>

            <div>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(info.googleMapQuery ?? info.address)}&output=embed&z=17`}
                className="w-full aspect-square md:aspect-[4/5] border border-white/10"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${info.name}の場所`}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={googleMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Googleマップで場所を見る
                </a>
                <a
                  href={`tel:${info.phone}`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  電話する
                </a>
              </div>
            </div>
          </div>

          {feature.infoNote && (
            <p className="mt-8 text-[11px] text-gray-600">{feature.infoNote}</p>
          )}
        </div>
      </section>

      {/* ⑩ 最後のメッセージ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={feature.hero.image}
            alt=""
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/80 to-black/60" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <h2 className="text-2xl md:text-4xl font-black leading-tight whitespace-pre-line">
            {feature.closing.heading}
          </h2>
          <p className="mt-4 text-sm md:text-base text-gray-400 whitespace-pre-line">
            {feature.closing.description}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3.5 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Googleマップで場所を見る
            </a>
            {info.instagram && (
              <a
                href={info.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3.5 border border-white/20 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                Instagramで最新情報を見る
              </a>
            )}
            <Link
              href={shopListHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3.5 border border-white/20 transition-colors"
            >
              OKIPOKAで大会情報を見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// ヘルパーコンポーネント
// ─────────────────────────────────────────────

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 flex gap-3">
      <span className="shrink-0 w-20 text-xs font-bold text-gray-500">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
