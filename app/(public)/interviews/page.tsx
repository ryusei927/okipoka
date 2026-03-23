import { interviews } from "@/lib/interviews";
import { Mic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "インタビュー | OKIPOKA",
  description: "沖縄最大級ポーカートーナメントのインタビュー記事一覧",
};

export default function InterviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Mic className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            大会インタビュー
          </h1>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          沖縄最大級ポーカートーナメントに参加した選手・運営の声をお届けします。
        </p>

        <div className="space-y-4">
          {interviews.map((interview) => (
            <Link
              key={interview.slug}
              href={`/interviews/${interview.slug}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden">
                  <Image
                    src={interview.image}
                    alt={interview.personName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                    {interview.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {interview.personName}（{interview.personRole}）
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
