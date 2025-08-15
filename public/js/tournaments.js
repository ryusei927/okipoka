import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhItIbOxR6rXdClsDidrcB1iB1714paAs",
    authDomain: "okipoka-68419.firebaseapp.com",
    projectId: "okipoka-68419",
    storageBucket: "okipoka-68419.firebasestorage.app",
    messagingSenderId: "749122576664",
    appId: "1:749122576664:web:20b93253162b185d993e6d",
    measurementId: "G-GN4PCM7BZB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const list = document.getElementById("tournament-list");
const dateInput = document.getElementById("datePicker");

// 円表記フォーマッタ
function formatYen(v) {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  if (Number.isNaN(n)) return v; // 文字ならそのまま
  return `${n.toLocaleString()}円`;
}

// 日付取得関数（ローカルタイム）
function getFormattedDate(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---- 6時境界ユーティリティ ここから ----
function getNextDateStr(yyyy_mm_dd) {
  const [y,m,d] = yyyy_mm_dd.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate() + 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth()+1).padStart(2,"0");
  const dd = String(dt.getDate()).padStart(2,"0");
  return `${yy}-${mm}-${dd}`;
}
function parseTimeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return 0;
  const [h,m] = hhmm.split(":").map(Number);
  return (h||0)*60 + (m||0);
}
function isEarlyMorningHHMM(hhmm) {
  return parseTimeToMinutes(hhmm) < 6*60; // 06:00 未満
}
// “表示用時刻ソート値” 6時境界：翌日0〜5:59は +24h 扱い（24:00〜29:59で並ぶ）
function sortKeyWith06Boundary(dateStr, data) {
  const t = data.startTime || "00:00";
  const base = parseTimeToMinutes(t);
  const isNext = data.startDate !== dateStr; // 翌日分
  return isNext && isEarlyMorningHHMM(t) ? base + 24*60 : base;
}
// 表示ラベル（翌日分は「翌日 02:00」と表示）
function timeLabelWithNextMark(dateStr, data) {
  const t = data.startTime || "00:00";
  const isNext = data.startDate !== dateStr && isEarlyMorningHHMM(t);
  return `${isNext ? "翌日 " : ""}${t}`;
}
// ---- 6時境界ユーティリティ ここまで ----

// 初期設定（今日を表示）
const defaultDate = new Date();
const formattedToday = getFormattedDate(defaultDate);
dateInput.value = formattedToday;
loadTournaments(formattedToday);

// イベントリスナー：日付変更時に再取得
dateInput.addEventListener("change", () => {
  const selected = dateInput.value;
  loadTournaments(selected);
});

// Firestoreから該当日のデータを取得＆表示（6時境界対応）
async function loadTournaments(dateStr) {
  list.innerHTML = ""; // clear

  // ① 選択日分（従来どおり）
  const qMain = query(collection(db, "tournaments"), where("startDate", "==", dateStr));
  const snapMain = await getDocs(qMain);

  // ② “翌日”の早朝(〜05:59)も同じ1日に含めたいので追い取り
  const nextDateStr = getNextDateStr(dateStr);
  const qNext = query(collection(db, "tournaments"), where("startDate", "==", nextDateStr));
  const snapNext = await getDocs(qNext);

  // ③ マージ（翌日分はクライアント側で 06:00 未満に絞る）
  const rows = [
    // 当日分は 06:00 以降のみ
    ...snapMain.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(x => !isEarlyMorningHHMM(x.startTime || "")),
    // 翌日分は 05:59 までのみ
    ...snapNext.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(x => isEarlyMorningHHMM(x.startTime || ""))
  ];

  if (rows.length === 0) {
    list.innerHTML = "<p style='text-align: center; color: #666;'>指定された日のトーナメントはありません。</p>";
    return;
  }

  // ④ 6時境界ソート（翌日0〜5:59は 24:00 以降として末尾に並ぶ）
  rows.sort((a, b) => sortKeyWith06Boundary(dateStr, a) - sortKeyWith06Boundary(dateStr, b));

  // ⑤ セクション見出し（視認性向上）
  const buckets = [
    { name: "(06:00–11:59)", from: 6*60,  to: 12*60-1, key: "am" },
    { name: "(12:00–17:59)", from:12*60,  to: 18*60-1, key: "pm" },
    { name: "(18:00–23:59)", from:18*60,  to: 24*60-1, key: "night" },
    { name: "(翌日00:00–05:59)", from:24*60, to: 30*60-1, key: "late" }, // +24h 側
  ];
  function bucketKeyOf(row) {
    const k = sortKeyWith06Boundary(dateStr, row);
    if (k < 12*60) return "am";
    if (k < 18*60) return "pm";
    if (k < 24*60) return "night";
    return "late";
  }

  let lastBucket = null;
  const firstLateAnchor = document.createElement("div");
  firstLateAnchor.id = "early-anchor";

  rows.forEach((data) => {
    const bucket = bucketKeyOf(data);
    if (bucket !== lastBucket) {
      const bk = buckets.find(b => b.key === bucket);
      const h = document.createElement("div");
      h.className = "time-bucket";
      h.textContent = bk ? bk.name : "";
      list.appendChild(h);
      lastBucket = bucket;
      if (bucket === "late" && !document.getElementById("early-anchor")) {
        list.appendChild(firstLateAnchor); // “早朝へ”のジャンプ先
      }
    }

    const isEarly = bucket === "late";
    const card = document.createElement("div");
    card.classList.add("tournament-card");
    if (isEarly) card.classList.add("is-early");

    card.innerHTML = `
      <div class="tournament-card-body">
        <p class="tournament-title">
          <strong>${data.eventName || "タイトル未定"}</strong>
        </p>
        <div class="row">
          <p><span class="label">場所：</span>${data.storeName || data.postedBy || "不明な店舗"}</p>
          <p><span class="label">開始：</span>${timeLabelWithNextMark(dateStr, data)}</p>
        </div>
        <p><span class="label">Buy-in：</span>${data.buyIn || "未定"}</p>
        <p><span class="label">リエントリー：</span>${
          (data.reentryFee !== undefined && data.reentryFee !== null && data.reentryFee !== "")
            ? formatYen(data.reentryFee)
            : "—"
        }</p>
      </div>
      <div class="details-button-wrapper">
        <a href="/tournaments/${data.id}" class="details-button">詳細</a>
      </div>
    `;
    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".ad-slide");
    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    showSlide(currentIndex);
    setInterval(nextSlide, 4000);
});

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".ad-slide");
    const dots = document.querySelectorAll(".ad-indicators .dot");
    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    showSlide(currentIndex);
    setInterval(nextSlide, 4000);
});

// --- Styles for tournament card (Consider moving to external CSS for production) ---
const tournamentCardStyles = `
.tournament-card-body {
  padding: 1em;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  margin-bottom: 1em;
  font-size: 0.95em;
}
.tournament-title {
  font-size: 1.1em;
  margin-bottom: 0.5em;
  color: #333;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3em;
}
.label {
  font-weight: bold;
  color: #666;
}
.details-button-wrapper {
  text-align: right;
  margin-top: 0.5em;
}
.details-button {
  padding: 0.4em 1em;
  background: #ff7f00;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
}
.details-button:hover {
  background: #e36f00;
}
`;
if (!document.getElementById('tournament-card-style')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'tournament-card-style';
  styleTag.textContent = tournamentCardStyles;
  document.head.appendChild(styleTag);
}
// 6時境界 表示用 追加スタイル
const extraStyles = `
.time-bucket {
  margin: .8em 0 .4em;
  font-weight: 700;
  color: #334155;
}
.badge-early {
  margin-left: .4em;
  font-size: .75em;
  padding: .05em .4em;
  border-radius: 9999px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
}
.tournament-card.is-early {
  outline: 2px solid #eef2ff;
  border-radius: 10px;
}
`;
if (!document.getElementById('tournament-6am-style')) {
  const styleTag2 = document.createElement('style');
  styleTag2.id = 'tournament-6am-style';
  styleTag2.textContent = extraStyles;
  document.head.appendChild(styleTag2);
}

// “早朝へ”ジャンプ（ボタンが存在する場合のみ動作）
document.getElementById("jump-early")?.addEventListener("click", () => {
  document.getElementById("early-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
});