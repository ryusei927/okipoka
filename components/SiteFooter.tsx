import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 text-sm">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-white font-bold mb-4">ガイド</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/guide" className="hover:text-white transition-colors">
                初心者ガイド
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors">
                ブログ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">規約・ポリシー</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                免責事項
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">お問い合わせ</h3>
          <ul className="space-y-2">
            <li>
              <a href="mailto:okipoka.jp@gmail.com" className="hover:text-white transition-colors">
                okipoka.jp@gmail.com
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/okipoka/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                公式Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center border-t border-gray-800 pt-8">
        <p>&copy; 2025 OKIPOKA</p>
      </div>
    </footer>
  );
}
