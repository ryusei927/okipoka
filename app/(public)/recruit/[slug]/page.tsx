import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRecruitmentBySlug,
  recruitments,
} from "@/lib/recruitments";
import { createClient } from "@/lib/supabase/server";
import { RecruitPhotoSlider } from "@/components/recruit/RecruitPhotoSlider";

export function generateStaticParams() {
  return recruitments.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recruit = getRecruitmentBySlug(slug);
  if (!recruit) return {};
  return {
    title: `${recruit.shopName} 求人 | OKIPOKA`,
    description: recruit.intro,
  };
}

export default async function RecruitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recruit = getRecruitmentBySlug(slug);
  if (!recruit) notFound();

  let shopId: string | null = null;
  let phone: string | null = null;
  let instagramUrl: string | null = null;
  let googleMapUrl: string | null = null;
  let imageUrl: string | null = null;

  try {
    const supabase = await createClient();
    const select =
      "id, phone, instagram_url, google_map_url, slug, image_url";
    const bySlug = await supabase
      .from("shops")
      .select(select)
      .eq("slug", recruit.shopSlug ?? recruit.slug)
      .maybeSingle();

    const shop =
      bySlug.data ??
      (
        await supabase
          .from("shops")
          .select(select)
          .eq("name", recruit.shopName)
          .maybeSingle()
      ).data;

    if (shop) {
      shopId = shop.id;
      phone = shop.phone;
      instagramUrl = shop.instagram_url;
      googleMapUrl = shop.google_map_url;
      imageUrl = shop.image_url;
    }
  } catch {
    // 店舗DBが無い環境でも静的求人ページは表示する
  }

  const shopHref = shopId ? `/shops#shop-${shopId}` : "/shops";

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      <div className="mx-auto max-w-3xl bg-white px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/recruit"
          className="mb-4 inline-block text-xs font-bold text-gray-400 hover:text-gray-600"
        >
          ← 求人一覧
        </Link>
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-gray-100 bg-gray-50 sm:h-20 sm:w-20">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={recruit.shopName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
                {recruit.shopName.slice(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-orange-500">求人</p>
            <h1 className="mt-1 text-xl font-black text-gray-900 sm:text-2xl">
              {recruit.shopName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {recruit.area}
              {recruit.openingHours ? ` ／ ${recruit.openingHours}` : ""}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-700">
          {recruit.intro}
        </p>

        {recruit.photos && recruit.photos.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-4 w-1 bg-orange-500" />
              <h2 className="text-sm font-black text-gray-900">店内の雰囲気</h2>
            </div>
            <RecruitPhotoSlider photos={recruit.photos} />
          </section>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 bg-orange-500" />
            <h2 className="text-sm font-black text-gray-900">募集職種・給与</h2>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200">
            {recruit.roles.map((role) => (
              <div key={role.title} className="px-4 py-4">
                <p className="text-sm font-bold text-gray-900">{role.title}</p>
                <p className="mt-1 text-base font-black text-gray-900">
                  {role.payLabel}
                </p>
                {role.payNote && (
                  <p className="mt-1 text-xs text-gray-500">{role.payNote}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 bg-orange-500" />
            <h2 className="text-sm font-black text-gray-900">待遇</h2>
          </div>
          <ul className="border border-gray-200 divide-y divide-gray-100">
            {recruit.commonPerks.map((perk) => (
              <li key={perk} className="px-4 py-3 text-sm text-gray-700">
                {perk}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 bg-orange-500" />
            <h2 className="text-sm font-black text-gray-900">勤務地</h2>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 bg-gray-50/50">
            <div className="flex gap-3 px-4 py-3">
              <span className="w-14 shrink-0 text-[10px] font-bold text-gray-400">
                店名
              </span>
              <p className="text-sm text-gray-700">{recruit.shopName}</p>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <span className="w-14 shrink-0 text-[10px] font-bold text-gray-400">
                住所
              </span>
              <p className="text-sm text-gray-700">{recruit.address}</p>
            </div>
            {recruit.openingHours && (
              <div className="flex gap-3 px-4 py-3">
                <span className="w-14 shrink-0 text-[10px] font-bold text-gray-400">
                  営業時間
                </span>
                <p className="text-sm text-gray-700">{recruit.openingHours}</p>
              </div>
            )}
            {phone && (
              <div className="flex gap-3 px-4 py-3">
                <span className="w-14 shrink-0 text-[10px] font-bold text-gray-400">
                  電話
                </span>
                <a
                  href={`tel:${phone}`}
                  className="text-sm text-gray-700 hover:text-orange-600"
                >
                  {phone}
                </a>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={shopHref}
              className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100"
            >
              店舗ページ
            </Link>
            {googleMapUrl && (
              <a
                href={googleMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100"
              >
                Google Map
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100"
              >
                Instagram
              </a>
            )}
          </div>
        </section>

        <section className="mt-8 border-t border-gray-100 pt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 bg-orange-500" />
            <h2 className="text-sm font-black text-gray-900">応募について</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">
            {recruit.applyNote}
          </p>
          <Link
            href={shopHref}
            className="mt-4 inline-flex bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            {recruit.shopName} の店舗情報へ
          </Link>
        </section>
      </div>
    </div>
  );
}
