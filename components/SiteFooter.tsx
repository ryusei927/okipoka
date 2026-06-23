import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#151515] text-gray-400 px-4 py-10 text-sm">
      <div className="mx-auto max-w-5xl">
        <div className="border-y border-[#2a2a2a] py-8 md:flex md:items-start md:justify-between md:gap-10">
          <div className="mb-8 md:mb-0 md:max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2 text-white">
              <span className="text-xl font-black tracking-wide leading-none">OKIPOKA</span>
              <span className="text-xs text-gray-500">沖縄</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              沖縄のポーカー店舗・トーナメント情報をまとめて探せるローカルガイド。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div>
              <h3 className="text-xs font-bold tracking-wide text-white mb-4">POLICY</h3>
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
              <h3 className="text-xs font-bold tracking-wide text-white mb-4">CONTACT</h3>
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
        </div>
        <div className="flex items-center justify-between gap-4 py-5 text-[11px] text-gray-600">
          <p>&copy; 2025 OKIPOKA</p>
          <p>OKINAWA POKER GUIDE</p>
        </div>
      </div>
    </footer>
  );
}
