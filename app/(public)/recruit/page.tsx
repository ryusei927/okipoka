import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { recruitments } from "@/lib/recruitments";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "求人情報 | OKIPOKA",
  description:
    "沖縄のポーカー店舗の求人情報。スタッフ・店長など募集中の店舗をまとめて確認できます。",
};

export default async function RecruitIndexPage() {
  const supabase = await createClient();
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, slug, image_url");

  const shopBySlug = new Map(
    (shops || []).map((s) => [s.slug, s] as const)
  );
  const shopByName = new Map(
    (shops || []).map((s) => [s.name.toLowerCase(), s] as const)
  );

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      <div className="mx-auto max-w-3xl bg-white px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-bold text-orange-500">求人情報</p>
        <h1 className="mt-1 text-xl font-black text-gray-900 sm:text-2xl">
          沖縄ポーカー求人
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          募集中の店舗一覧です。詳細は各求人ページから確認できます。
        </p>

        <div className="mt-6 divide-y divide-gray-100 border border-gray-200">
          {recruitments.map((recruit) => {
            const shop =
              shopBySlug.get(recruit.shopSlug ?? recruit.slug) ||
              shopByName.get(recruit.shopName.toLowerCase());
            const imageUrl = shop?.image_url ?? null;
            const paySummary = recruit.roles
              .map((r) => `${r.title} ${r.payLabel}`)
              .join(" ／ ");

            return (
              <Link
                key={recruit.slug}
                href={`/recruit/${recruit.slug}`}
                className="flex items-center gap-3.5 px-3.5 py-3.5 transition-colors hover:bg-gray-50"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-gray-100 bg-gray-50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={recruit.shopName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                      {recruit.shopName.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-[15px] font-bold text-gray-900">
                      {recruit.shopName}
                    </h2>
                    <span className="bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {recruit.area}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {paySummary}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-orange-600">
                  詳細 →
                </span>
              </Link>
            );
          })}
        </div>

        {recruitments.length === 0 && (
          <p className="mt-8 text-sm text-gray-500">
            現在募集中の求人はありません。
          </p>
        )}
      </div>
    </div>
  );
}
