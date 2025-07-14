document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".ai-question-box");
  const articleTitle = section?.dataset.title || "";
  const contextContent = section?.dataset.context || "";
  const article = `【${articleTitle}】\n${contextContent}`;

  async function callAI(messages) {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.result;
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Raw response:", text);
      return "エラーが発生しました（AI応答の解析に失敗）";
    }
  }

  document.getElementById('ask-ai')?.addEventListener('click', async () => {
    const q = document.getElementById('ai-question').value;
    const output = document.getElementById('ai-response');
    output.textContent = "考え中...";
    const reply = await callAI([
      { role: "system", content: "あなたはポーカー戦略を初心者にもわかりやすく説明するAIです。" },
      { role: "user", content: `${q}\n\n以下が参考記事です：\n${article}` }
    ]);
    output.textContent = reply;
  });

  document.getElementById('simplify-ai')?.addEventListener('click', async () => {
    const output = document.getElementById('ai-response');
    output.textContent = "考え中...";
    const reply = await callAI([
      { role: "system", content: "あなたはポーカーの複雑な記事内容を、初心者にもわかるように噛み砕いて説明するAIです。" },
      { role: "user", content: `以下の内容を噛み砕いて説明してください：\n${article}` }
    ]);
    output.textContent = reply;
  });
});