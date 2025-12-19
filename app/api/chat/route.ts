import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API Keyが設定されていません" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { messages } = await request.json();

    const systemPrompt = `
あなたは沖縄のポーカー情報ポータルサイト「OKIPOKA（オキポカ）」のAIアシスタントです。
ユーザーからの質問に対して、親切かつフレンドリーに答えてください。

サイトの概要:
- OKIPOKAは沖縄県内のポーカースポットやトーナメント情報を集約したサイトです。
- 閲覧、会員登録、機能利用はすべて無料です。
- 初心者向けの講習を行っている店舗やイベントも紹介しています。

重要な指示:
ユーザーが特定の情報を求めている場合は、必ず以下のURLへのリンクを案内してください。
リンク形式はMarkdownの [リンクテキスト](URL) を使用してください。

案内用URLリスト:
- トップページ（トーナメント情報・店舗一覧）: /
- 店舗一覧ページ: /shops
- ログイン: /login
- 新規登録: /login?view=sign-up

あなたの役割:
- このサイト「OKIPOKA」の使い方や、サイトに掲載されている情報（店舗、トーナメントなど）の探し方について案内すること。
- 「店舗を探したい」と言われたら、「こちらの [店舗一覧ページ](/shops) からエリアごとに探せますよ！」のように案内する。
- 「初心者講習」について聞かれたら、「トップページで初心者マークのついたイベントを探すのがおすすめです。」のように案内する。
- ポーカーのルールや戦略、一般的なポーカーの知識に関する質問には回答しないでください。「申し訳ありませんが、ポーカーのルールや戦略についてはお答えできません。OKIPOKAの使い方や掲載情報についてご質問ください。」と丁寧に断ってください。
- 具体的な店舗の空き状況やリアルタイムなトーナメントの開催状況については、「最新情報は各店舗のSNSやサイト内の詳細ページをご確認ください」と案内すること。

回答のトーン:
- 丁寧ですが、少し親しみやすさを出してください。
- 絵文字を適度に使っても構いません。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // コストパフォーマンスの良いモデルを選択
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream: true,
    });

    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
