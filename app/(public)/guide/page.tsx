import { BookOpen, Star, Shield, Users } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-green-600 text-white py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">初心者ガイド</h1>
        <p className="opacity-90">ポーカーを始めてみたいあなたへ</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="text-yellow-500" />
            まずはアミューズメントカジノへ
          </h2>
          <p className="text-gray-700 leading-relaxed">
            沖縄には「アミューズメントカジノ」と呼ばれる、お金を賭けずにゲームとしてポーカーを楽しめるお店がたくさんあります。
            まずはこれらのお店に行ってみるのが一番の近道です。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-blue-500" />
            初心者講習を受けよう
          </h2>
          <p className="text-gray-700 leading-relaxed">
            多くの店舗で「初心者講習」を行っています。
            ルールの説明から、実際にカードを配ってのプレイまで、ディーラーさんが優しく教えてくれます。
            OKIPOKAで「初心者講習あり」の店舗やイベントを探してみましょう。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-orange-500" />
            マナーについて
          </h2>
          <p className="text-gray-700 leading-relaxed">
            ポーカーは紳士淑女のゲームと言われています。
            「順番を守る」「カードを大切に扱う」「相手をリスペクトする」といった基本的なマナーを守れば、誰でも楽しくプレイできます。
            分からないことがあれば、同卓のプレイヤーやディーラーに気軽に聞いてみてください。
          </p>
        </section>
      </div>
    </div>
  );
}
