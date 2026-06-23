import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

/**
 * メンバー系ページ共通の「戻る」ボタン。
 * デザインはサブスク画面のピル型に統一。
 */
export function BackLink({
  href = "/member",
  label = "マイページに戻る",
  className = "",
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-sm bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-gray-900 hover:ring-gray-300 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 text-gray-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-gray-600" />
      {label}
    </Link>
  );
}
