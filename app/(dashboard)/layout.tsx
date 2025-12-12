import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="font-bold text-gray-900 hover:text-orange-500 transition-colors">
            OKIPOKA 管理画面
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
              サイトへ戻る
            </Link>
            <div className="text-sm text-gray-500">管理者専用</div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
