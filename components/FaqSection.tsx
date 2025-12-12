"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "OKIPOKAとはどのようなサイトですか？",
    answer: "OKIPOKA（オキポカ）は、沖縄県内のポーカー情報を集約したポータルサイトです。県内のポーカースポットや、開催されるトーナメント情報をリアルタイムでお届けします。"
  },
  {
    question: "掲載されている情報は最新ですか？",
    answer: "可能な限り最新の情報を掲載するよう努めていますが、店舗や主催者の都合により急遽変更となる場合があります。確実な情報は各店舗のSNS等をご確認ください。"
  },
  {
    question: "広告を出したいのですが。",
    answer: "店舗様やイベント主催者様からの広告掲載を随時募集しております。詳細はお問い合わせフォームまたはメールにてご連絡ください。"
  },
  {
    question: "初心者でも参加できるトーナメントはありますか？",
    answer: "はい、多くの店舗で初心者講習付きのトーナメントや、初心者歓迎のイベントが開催されています。「初心者歓迎」タグのついたイベントを探してみてください。"
  },
  {
    question: "サイトの利用にお金はかかりますか？",
    answer: "いいえ、OKIPOKAの閲覧・会員登録・機能利用はすべて無料です。"
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="max-w-md md:max-w-4xl mx-auto px-4 py-12 border-t border-gray-100">
      <h2 className="text-xl font-bold text-center mb-8 text-gray-900">よくある質問</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left font-bold text-gray-800"
            >
              <span>{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {openIndex === index && (
              <div className="p-4 bg-white text-gray-600 leading-relaxed border-t border-gray-200">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
