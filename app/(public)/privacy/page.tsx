export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. 個人情報の収集について</h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトでは、お問い合わせや会員登録の際に、お名前、メールアドレス等の個人情報をご登録いただく場合がございます。
            これらの個人情報は、質問に対する回答や必要な情報を電子メールなどでご連絡する場合に利用させていただくものであり、個人情報をご提供いただく際の目的以外では利用いたしません。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. 個人情報の第三者への開示</h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトでは、個人情報は適切に管理し、以下に該当する場合を除いて第三者に開示することはありません。
          </p>
          <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
            <li>本人のご了解がある場合</li>
            <li>法令等への協力のため、開示が必要となる場合</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">3. アクセス解析ツールについて</h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。
            このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。
            このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
            この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
          </p>
        </section>
      </div>
    </div>
  );
}
