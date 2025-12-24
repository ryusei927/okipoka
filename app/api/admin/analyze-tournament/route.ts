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

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "画像がアップロードされていません" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    // 日本時間 (JST) の今日の日付を取得
    const now = new Date();
    const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = jstDate.toISOString().split('T')[0];

    const prompt = `
      この画像はポーカーのトーナメント情報（スケジュールや詳細）です。
      以下の情報を抽出してJSON形式で返してください。
      見つからない項目は null または空文字にしてください。
      
      出力フォーマット:
      {
        "title": "イベント名",
        "date": "開催日 (YYYY-MM-DD形式, 日付が不明なら '${todayStr}' を設定)",
        "time": "開始時間 (HH:MM形式)",
        "lateRegTime": "レイトレジスト締切時間 (HH:MM形式)",
        "buyIn": "参加費 (例: 3,000円)",
        "reentryFee": "リエントリー費 (例: 3,000円)",
        "stack": "スタートスタック (例: 30,000点)",
        "addonStatus": "available" | "unavailable" | "unknown" (アドオンの有無),
        "addonFee": "アドオン費用",
        "addonStack": "アドオンスタック",
        "prizes": "プライズ情報（テキストで要約）",
        "notes": "その他特記事項"
      }

      注意:
      - 金額は「円」、スタックは「点」をつけてください。
      - 時間は24時間表記にしてください。
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("AIからの応答がありませんでした");
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "画像の解析に失敗しました" },
      { status: 500 }
    );
  }
}
