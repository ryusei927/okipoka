export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">免責事項</h1>
        
        <section className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について一切の責任を負いません。
          </p>
          <p className="text-gray-700 leading-relaxed">
            また当サイトのコンテンツ・情報について、できる限り正確な情報を提供するように努めておりますが、正確性や安全性を保証するものではありません。情報が古くなっていることもございます。
          </p>
          <p className="text-gray-700 leading-relaxed">
            当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">著作権について</h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトで掲載している文章や画像などにつきましては、無断転載することを禁止します。
          </p>
          <p className="text-gray-700 leading-relaxed">
            当サイトは著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、お問い合わせフォームよりご連絡ください。迅速に対応いたします。
          </p>
        </section>
      </div>
    </div>
  );
}
