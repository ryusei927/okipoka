import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API Key is missing");
      return NextResponse.json(
        { error: "OpenAI API Keyが設定されていません" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const body = await request.json();
    const { messages, sessionId } = body;
    const lastMessage = messages[messages.length - 1];

    // ユーザーID取得（ログインしている場合） - エラーになってもチャットは続行させる
    let userId = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (e) {
      console.warn("Failed to get user session:", e);
    }

    // ログ保存用の管理者クライアント（環境変数がない場合はスキップ）
    let adminSupabase = null;
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        adminSupabase = createAdminClient();
      } else {
        console.warn("SUPABASE_SERVICE_ROLE_KEY is missing, chat logging disabled");
      }
    } catch (e) {
      console.warn("Failed to create admin client:", e);
    }

    // ユーザーメッセージを保存
    if (adminSupabase && lastMessage && lastMessage.role === 'user') {
      try {
        await adminSupabase.from('chat_logs').insert({
          user_id: userId,
          role: 'user',
          content: lastMessage.content,
          session_id: sessionId
        });
      } catch (err) {
        console.error("Failed to save user log:", err);
      }
    }

    const systemPrompt = `
あなたは沖縄のポーカー情報ポータルサイト「OKIPOKA（オキポカ）」のAIアシスタントです。
ユーザーからの質問に対して、親切かつフレンドリーに答えてください。

サイトの概要:
- OKIPOKAは沖縄県内のポーカースポットやトーナメント情報を集約したサイトです。
- 閲覧、会員登録、機能利用はすべて無料です。
- 初心者向けの講習を行っている店舗やイベントも紹介しています。

重要な中立性ポリシー:
- OKIPOKAは完全中立のポータルサイトです。
- 特定の店舗やトーナメントを「おすすめ」したり、優劣をつけたりしないでください。
- 「どの店舗がおすすめ？」「一番良いトーナメントは？」などと聞かれた場合は、「OKIPOKAは中立なポータルサイトなので、特定の店舗やイベントをおすすめすることはできません。ぜひ [店舗一覧](/shops) や [トップページ](/) から、ご自身に合ったお店やイベントを探してみてください！」と案内してください。
- 店舗名を挙げる場合も、複数の店舗を平等に紹介するか、サイト内で探せることを案内するだけにしてください。

重要な指示:
ユーザーが特定の情報を求めている場合は、必ず以下のURLへのリンクを案内してください。
リンク形式はMarkdownの [リンクテキスト](URL) を使用してください。

案内用URLリスト:
- トップページ（トーナメント情報・店舗一覧）: /
- 店舗一覧ページ: /shops
- ログイン: /login
- 新規登録: /login?view=sign-up
- おきぽかプレミアム詳細: /premium

あなたの役割:
- このサイト「OKIPOKA」の使い方や、サイトに掲載されている情報（店舗、トーナメントなど）の探し方について案内すること。
- 「おきぽかプレミアム」について聞かれたら、以下の情報を魅力的に伝えてください：
  - 月額2,200円（税込）で、毎日1回ハズレなしのガチャが引けるお得なプランです。
  - ガチャでは、ポーカー店舗の割引券やドリンクチケットなどが必ず当たります。
  - さらに、サブスク会員限定のトーナメント割引や、無料招待トーナメントが開催されることもあります！
  - 契約期間の縛りはなく、いつでも解約可能です。
  - 詳しくは [こちらのページ](/premium) をご覧ください。
- 「店舗を探したい」と言われたら、「こちらの [店舗一覧ページ](/shops) からエリアごとに探せますよ！」のように案内する。
- 「初心者講習」について聞かれたら、「トップページで初心者マークのついたイベントを探すのがおすすめです。」のように案内する。
- ポーカーの基本的なルールや用語（例：役の強さ、ポジション、用語の意味など）や、ゲーム形式の違い（トーナメントとリングゲームの違いなど）については、初心者にもわかりやすく教えてあげてください。
- ただし、具体的な戦略アドバイス、ハンドレビュー（「このハンドはどうプレイすべき？」など）、GTO（ゲーム理論最適）に関する質問には回答しないでください。「申し訳ありませんが、戦略的なアドバイスやハンドレビューは行っていません。ぜひ店舗で実践しながら学んでみてください！」と応援する形で断ってください。
- 具体的な店舗の空き状況やリアルタイムなトーナメントの開催状況については、「最新情報は各店舗のSNSやサイト内の詳細ページをご確認ください」と案内すること。

回答のトーン:
- 丁寧ですが、少し親しみやすさを出してください。
- 絵文字を適度に使っても構いません。

回答のフォーマット:
- 必ず読みやすく改行を入れてください。長文を一気に書かないでください。
- 1つの段落は2〜3文程度にして、段落ごとに空行を入れてください。
- 複数のポイントがある場合は、箇条書きを使ってください。
- リンクは文中に自然に埋め込むか、別の行に記載してください。
- 回答は簡潔にまとめ、必要な情報だけを伝えてください。
- アスタリスク（*）やハッシュ（#）などのMarkdown記号は絶対に使わないでください。太字や見出しは不要です。
- 箇条書きには「-」のみを使い、番号付きリストには「1. 2. 3.」を使ってください。
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
        let fullContent = "";
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
        } catch (e) {
          console.error("Streaming error:", e);
        } finally {
          // AIの応答が完了したらログに保存
          if (adminSupabase && fullContent) {
            try {
              await adminSupabase.from('chat_logs').insert({
                user_id: userId,
                role: 'assistant',
                content: fullContent,
                session_id: sessionId
              });
            } catch (err) {
              console.error("Failed to save assistant log:", err);
            }
          }
          controller.close();
        }
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
      { error: "エラーが発生しました", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
