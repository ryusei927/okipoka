import { interviews, getInterviewBySlug } from "@/lib/interviews";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export async function generateStaticParams() {
  return interviews.map((interview) => ({
    slug: interview.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const interview = getInterviewBySlug(slug);
  if (!interview) return {};
  return {
    title: `${interview.title} | OKIPOKA`,
    description: interview.intro,
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const interview = getInterviewBySlug(slug);

  if (!interview) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヒーロー画像 */}
      <div className="relative w-full h-72 md:h-96">
        <Image
          src={interview.image}
          alt={interview.personName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="inline-block text-xs font-semibold text-white bg-orange-500 px-3 py-1 rounded-full mb-3">
            {interview.day}
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
            {interview.title}
          </h1>
        </div>
        <Link
          href="/interviews"
          className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* 本文 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* プロフィール */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
            <Image
              src={interview.image}
              alt={interview.personName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-gray-900">{interview.personName}</p>
            <p className="text-sm text-gray-500">{interview.personRole}</p>
          </div>
        </div>

        {/* イントロ */}
        <p className="text-gray-700 leading-relaxed mb-10 whitespace-pre-line">
          {interview.intro}
        </p>

        {/* セクション */}
        {interview.sections.map((section, i) => (
          <section key={i} className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-500 rounded-full" />
              {section.heading}
            </h2>
            <div className="space-y-4">
              {section.content.map((paragraph, j) => {
                if (paragraph.startsWith("「") && paragraph.endsWith("」")) {
                  return (
                    <blockquote
                      key={j}
                      className="border-l-4 border-orange-300 bg-orange-50 px-4 py-3 text-gray-800 leading-relaxed rounded-r-lg whitespace-pre-line"
                    >
                      {paragraph}
                    </blockquote>
                  );
                }
                if (paragraph.startsWith("・")) {
                  return (
                    <div
                      key={j}
                      className="bg-gray-50 rounded-lg p-4 text-gray-800 leading-relaxed whitespace-pre-line"
                    >
                      {paragraph}
                    </div>
                  );
                }
                return (
                  <p
                    key={j}
                    className="text-gray-700 leading-relaxed whitespace-pre-line"
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </section>
        ))}

        {/* 戻るリンク */}
        <div className="pt-6 border-t border-gray-100">
          <Link
            href="/interviews"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            インタビュー一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
