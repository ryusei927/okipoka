import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">メールを確認してください</h2>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          登録されたメールアドレスに確認メールを送信しました。<br />
          メール内のリンクをクリックして、登録を完了してください。
        </p>
        <Link href="/login" className="text-orange-600 font-bold hover:underline text-sm">
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
