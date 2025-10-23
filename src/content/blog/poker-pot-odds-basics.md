---
title: 'ポーカーの基礎を支える数式：ポットオッズとは'
description: 'ポーカーのコール判断で重要であり、基本の「ポットオッズ」を徹底解説。計算方法、必要勝率の概念、そして具体的や練習問題も用意して解説します。'
publishDate: 2024-10-23T00:00:00.000Z
---

<div class="article-content">

# ポットオッズとは何か？

ポーカーにおけるポットオッズ（Pot Odds）とは、相手のベットに対してコールするかどうかを数学的に判断するための指標です。具体的には、「コールするために必要な金額」に対して「獲得できるポット総額」がどの程度の比率になるかを計算し、それをEQ（勝率）に変換したものです。
<br><br>
例えば、10BBのポットに対して5BBのベットを受けた場合、あなたは5BBを投資することで15BBを獲得するチャンスを得ます。この時、投資を正当化するためには、現在のハンドで一定以上のEQが必要になります。つまり、ポットオッズは「どれだけの勝率があれば、このコールが長期的に利益をもたらすか」を教えてくれる計算式なのです。

<div class="terminology-box">
<div class="term-item">
<strong>エクイティ(EQ)</strong>とは、現在の手札とボードカードから計算される勝率のことを指します。ショーダウンまで進むことを前提とし、今後のベッティングアクションは考慮しません。
</div>
<style>
.terminology-box {
  background-color: #f8f9fa;
  border-left: 4px solid #007acc;
  padding: 20px;
  margin: 20px 0;
  border-radius: 4px;
}

.term-item {
  margin-bottom: 15px;
  line-height: 1.6;
}

.term-item:last-child {
  margin-bottom: 0;
}

.term-item strong {
  color: #007acc;
  font-weight: 600;
}
</style>

<br>

ポットオッズの基本から計算方法まで、実戦で必要な知識を学びましょう。期待値の概念を理解して、回収できない投資を避け、長期的に収益性の高いプレイを実現しましょう！

<img src="/images/blog/odds.png" /><br>

この式は、「現在のポット」と「相手のベット額」を加えた「ポット総額」に対して、「コールに必要な額」が占める割合を示しています。

<img src="/images/blog/odds2.png" /><br>

### 実践での応用：ドローハンドの判断

ポットオッズの使い方の例として、ドローハンドでのコール判断です。

<img src="/images/blog/odds3.png" /><br>

さて、あなたは相手からのオープンに、AToでコールしました。<br>
フロップではKsQs5hが開かれ、相手はポットに対して33%サイズ(1/3)をBetしてきます。<br>
この場合、4.5BBのポットに、1.5BBのBetを受けているので、コールするのに必要な勝率は、これから自分がコールする場合に必要な1.5BBと、既に相手が投入している1.5BB、そして4.5BBのポット額を足すと7.5BBです。その場合、1.5BB÷7.5BB＝0.2 となる。これをわかりやすく％にするために100を掛けると、20%ということになります。<br><br>
では、次は、AToが必要勝率20%を満たしているかという判定をする必要があります。そして正直なところ、これを実践で正確に求めることは困難です。
相手のハンドが見えているのであれば別ですが、実際相手が何を持っているかを断定することはできません。その場合、相手のオープンレンジ並びに、その中から、33%Betに回るレンジに対しての必要勝率を求める必要があるので、実践で導き出すには困難というわけです。<br><br>
なので実際はGTOヒューリスティクスに頼らないといけないのですが、ポットオッズの概念を理解することで、その直感も、なんとなくコール、フォールドから、20%の勝率は満たしているはずだから、コールと判断できます。この思考材料があるかの違いは大きいです。

<div class="side-note">
<p><strong>補足：ヒューリスティクスについて</strong></p>
<p>ヒューリスティクスとは、ポーカーに限定された概念ではありません。「必ずしも最適な解ではないが、限られた時間や情報の中で、実用的に十分な正解を迅速に導き出すための経験則、近道、または思考のルール」を意味します。もちろん瞬時に、ポットオッズの計算に限らず最適解を"正確に計算"して導き出せるのであれば頼る必要はないのですが、実際現実的ではないので、人間の限界と割り切りヒューリスティックに頼ります。判断材料を増やすことで、直感の質を高めます。</p>
</div>

では実際に、AToの扱いはどうなるのかを確認していきます。<br>

<img src="/images/blog/odds4.png" /><br>
AToは必要勝率20%に対し、どれも30%以上の勝率を保有しており、十分に満たしていると評価できます。<br><br>
<img src="/images/blog/odds5.png" /><br>

また、T8sのようなハンドのEQ(勝率)を見てみると、フラッシュドローであれば、ターン以降でフラッシュになる可能性があり、それが勝率を上げる要素となっているので、ディフェンスが許されていますが、その他のハンドは一応勝てるEQは保持しているものの、必要勝率20%に満たしていないようなハンドは、フォールドしています。

### 練習問題

<div class="quiz-container">
<div class="quiz-question">
<strong>問題：</strong>6BBのポットに3BBのBetを受けています。この時の、必要勝率を求めてください。
</div>

<div class="quiz-input-section">
<label for="answer-input">答え（%で入力）：</label>
<input type="number" id="answer-input" min="0" max="100" step="1">
<button id="check-answer" onclick="checkAnswer()">答え合わせ</button>
</div>

<div id="quiz-result" class="quiz-result hidden">
</div>

<div id="quiz-explanation" class="quiz-explanation hidden">
<h4>解説：</h4>
<p><strong>計算過程</strong></p>
<ol>
<li>現在のポット：6BB</li>
<li>相手のベット：3BB</li>
<li>コール額：3BB</li>
<li>ポット総額：6BB + 3BB + 3BB = 12BB</li>
<li>必要勝率 = 3BB ÷ 12BB = 0.25 = <strong>25%</strong></li>
</ol>
<p>この場合、25%以上の勝率があればコールが正当化されます。</p>
</div>
</div>

### 練習問題２

<div class="quiz-container">
<div class="quiz-question">
<strong>問題：</strong>10BBのポットに8BBのBetを受けています。この時の、必要勝率を求めてください。
</div>

<div class="quiz-input-section">
<label for="answer-input-2">答え（%で入力）：</label>
<input type="number" id="answer-input-2" placeholder="
" min="0" max="100" step="1">
<button id="check-answer-2" onclick="checkAnswer2()">答え合わせ</button>
</div>

<div id="quiz-result-2" class="quiz-result hidden">
</div>

<div id="quiz-explanation-2" class="quiz-explanation hidden">
<h4>解説：</h4>
<p><strong>計算過程</strong></p>
<ol>
<li>現在のポット：10BB</li>
<li>相手のベット：8BB</li>
<li>コール額：8BB</li>
<li>ポット総額：10BB + 8BB + 8BB = 26BB</li>
<li>必要勝率 = 8BB ÷ 26BB ≈ 0.308 = <strong>約30.8%</strong></li>
</ol>
<p>この場合、約31%以上の勝率があればコールが正当化されます。実戦では「約31%」として覚えておけば十分です。</p>
</div>
</div>

### 練習問題３（ラスト問題）

<div class="quiz-container">
<div class="quiz-question">
<strong>ラスト問題：</strong>あなたはSBです。現在のポットは1.5BB（SB 0.5BB + BB 1BB）。UTGが3BBにレイズし、COがコール、BTNがコール。あなたもコールしました。<br><br>
UTGが9BBをベット、COとBTNがフォールド。あなたに回ってきました。この時の必要勝率を求めてください。
</div>

<div class="calculation-note">
<p><strong>複雑な状況のコツ：</strong>プリフロップのアクションも含めてポット総額を正しく計算する必要があります。実戦では複数プレイヤーが関わる状況が多く発生するので、段階的に整理しましょう。</p>
</div>

<div class="quiz-input-section">
<label for="answer-input-3">答え（%で入力）：</label>
<input type="number" id="answer-input-3" placeholder="" min="0" max="100" step="1">
<button id="check-answer-3" onclick="checkAnswer3()">答え合わせ</button>
</div>

<div id="quiz-result-3" class="quiz-result hidden">
</div>

<div id="quiz-explanation-3" class="quiz-explanation hidden">
<h4>解説：</h4>
<p><strong>計算過程（複雑な状況の整理）</strong></p>
<ol>
<li><strong>プリフロップ後のポット：</strong>SB(0.5) + BB(1) + UTG(3) + CO(3) + BTN(3) + あなた(3) = 13.5BB</li>
<li><strong>フロップでのベット：</strong>UTG が 9BB をベット</li>
<li><strong>現在のポット：</strong>13.5BB + 9BB = 22.5BB</li>
<li><strong>あなたのコール額：</strong>9BB</li>
<li><strong>ポット総額：</strong>22.5BB + 9BB = 31.5BB</li>
<li><strong>必要勝率：</strong>9BB ÷ 31.5BB ≈ 0.286 = <strong>約28.6%</strong></li>
</ol>
<p>この場合、約29%以上の勝率があればコールが正当化されます。<br>
<strong>実戦のコツ：</strong>複雑な状況では、まずポット総額を正確に把握することが重要です！</p>
</div>
</div>

<style>
.quiz-container {
  background-color: #f0f8ff;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  padding: 25px;
  margin: 25px 0;
}



.quiz-question {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
}

.calculation-note {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.4;
}

.calculation-note strong {
  color: #856404;
}

.quiz-input-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.quiz-input-section label {
  font-weight: 600;
  color: #333;
}

#answer-input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  width: 120px;
}

#answer-input:focus, #answer-input-2:focus, #answer-input-3:focus {
  outline: none;
  border-color: #4a90e2;
}

#answer-input-2, #answer-input-3 {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  width: 120px;
}

#check-answer, #check-answer-2, #check-answer-3 {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s;
}

#check-answer:hover, #check-answer-2:hover, #check-answer-3:hover {
  background-color: #357abd;
}



.quiz-result {
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-weight: 600;
  text-align: center;
}

.quiz-result.correct {
  background-color: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.quiz-result.incorrect {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

.quiz-explanation {
  background-color: white;
  padding: 20px;
  border-radius: 6px;
  border-left: 4px solid #4a90e2;
}

.quiz-explanation h4 {
  color: #4a90e2;
  margin-top: 0;
}

.quiz-explanation ol {
  padding-left: 20px;
}

.quiz-explanation li {
  margin-bottom: 5px;
}

.hidden {
  display: none;
}

@media (max-width: 600px) {
  .quiz-input-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  #answer-input, #answer-input-2, #answer-input-3 {
    width: 100%;
  }
}
</style>

<script>
function checkAnswer() {
  const userAnswer = parseFloat(document.getElementById('answer-input').value);
  const correctAnswer = 25;
  const tolerance = 1.0; // 1%の誤差を許容
  
  const resultDiv = document.getElementById('quiz-result');
  const explanationDiv = document.getElementById('quiz-explanation');
  
  if (isNaN(userAnswer)) {
    resultDiv.innerHTML = '数値を入力してください。';
    resultDiv.className = 'quiz-result incorrect';
    resultDiv.classList.remove('hidden');
    explanationDiv.classList.add('hidden');
    return;
  }
  
  if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
    resultDiv.innerHTML = '🎉 正解です！よく理解できていますね。';
    resultDiv.className = 'quiz-result correct';
  } else {
    resultDiv.innerHTML = `❌ 不正解です。正解は25%です。<br>あなたの回答: ${userAnswer}%`;
    resultDiv.className = 'quiz-result incorrect';
  }
  
  resultDiv.classList.remove('hidden');
  explanationDiv.classList.remove('hidden');
}

// 2つ目のクイズ用の関数
function checkAnswer2() {
  const userAnswer = parseFloat(document.getElementById('answer-input-2').value);
  const correctAnswer = 30.8;
  const tolerance = 1.5; // 少し広めの誤差を許容
  
  const resultDiv = document.getElementById('quiz-result-2');
  const explanationDiv = document.getElementById('quiz-explanation-2');
  
  if (isNaN(userAnswer)) {
    resultDiv.innerHTML = '数値を入力してください。';
    resultDiv.className = 'quiz-result incorrect';
    resultDiv.classList.remove('hidden');
    explanationDiv.classList.add('hidden');
    return;
  }
  
  if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
    resultDiv.innerHTML = '🎉 正解です！実戦的な計算力が身についていますね。';
    resultDiv.className = 'quiz-result correct';
  } else {
    resultDiv.innerHTML = `❌ 不正解です。正解は約31%（厳密には30.8%）です。<br>あなたの回答: ${userAnswer}%`;
    resultDiv.className = 'quiz-result incorrect';
  }
  
  resultDiv.classList.remove('hidden');
  explanationDiv.classList.remove('hidden');
}

// Enterキーでも答え合わせできるように
document.getElementById('answer-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    checkAnswer();
  }
});

document.getElementById('answer-input-2').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    checkAnswer2();
  }
});

// 3つ目のクイズ用の関数（高難易度）
function checkAnswer3() {
  const userAnswer = parseFloat(document.getElementById('answer-input-3').value);
  const correctAnswer = 28.6;
  const tolerance = 2.0; // 複雑な計算なので少し広めの誤差を許容
  
  const resultDiv = document.getElementById('quiz-result-3');
  const explanationDiv = document.getElementById('quiz-explanation-3');
  
  if (isNaN(userAnswer)) {
    resultDiv.innerHTML = '数値を入力してください。';
    resultDiv.className = 'quiz-result incorrect';
    resultDiv.classList.remove('hidden');
    explanationDiv.classList.add('hidden');
    return;
  }
  
  if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
    resultDiv.innerHTML = '🎉 素晴らしい！複雑な状況での計算を正確にできています。実戦力が高いですね！';
    resultDiv.className = 'quiz-result correct';
  } else {
    resultDiv.innerHTML = `❌ 不正解です。正解は約29%（厳密には28.6%）です。<br>複雑な状況では段階的に計算することが重要です。<br>あなたの回答: ${userAnswer}%`;
    resultDiv.className = 'quiz-result incorrect';
  }
  
  resultDiv.classList.remove('hidden');
  explanationDiv.classList.remove('hidden');
}

document.getElementById('answer-input-3').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    checkAnswer3();
  }
});
</script>

## まとめ

<div class="summary-box">
<h3>ポットオッズの要点</h3>

<div class="summary-item">
<h4>基本公式</h4>
<p><strong>必要勝率 = コール額 ÷ ポット総額 × 100</strong></p>
</div>

<div class="summary-item">
<h4>実戦のコツ</h4>
<ul>
<li><strong>完璧な精度は不要：</strong>「約25%」「30%くらい」といった大まかな数値で十分</li>
<li><strong>スピード重視：</strong>小数点以下よりも瞬時の判断力が重要。本ページではポットオッズのみに焦点を当て解説していますが、実践では、ポットオッズだけでは判断できない場面。他に思考を巡らせないといけない事が沢山あります。ポットオッズの計算に時間を割きすぎていたら、それはそれで良いプレイに繋がりません</li>
</ul>
</div>

<div class="summary-item">
<h4>実戦での活用</h4>
<p>ポットオッズは「コールが数学的に正当化されるかどうか」の判断基準です。計算に基づいた判断ができるようになることで、長期的に収益性の高いプレイが実現できます。</p>
</div>


<style>
.summary-box {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 25px;
  margin: 25px 0;
}

.summary-box h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.summary-item {
  margin-bottom: 20px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
}

.summary-item strong {
  color: #007acc;
}
</style>

</div>





