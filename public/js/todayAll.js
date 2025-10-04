import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase設定 (変更なし)
const firebaseConfig = {
  apiKey: "AIzaSyBhItIbOxR6rXdClsDidrcB1iB1714paAs",
  authDomain: "okipoka-68419.firebaseapp.com",
  projectId: "okipoka-68419",
  storageBucket: "okipoka-68419.firebasestorage.app",
  messagingSenderId: "749122576664",
  appId: "1:749122576664:web:20b93253162b185d993e6d"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML要素を取得
const list = document.getElementById("today-all-card");
const dateInput = document.getElementById("indexDatePicker"); // 新しい日付ピッカー

// ヘルパー関数 (変更なし)
function getNextDateStr(yyyy_mm_dd) {
  const [y,m,d] = yyyy_mm_dd.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
function parseTimeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return 0;
  const [h,m] = hhmm.split(":").map(Number);
  return (h||0)*60 + (m||0);
}
function isEarlyMorningHHMM(hhmm) {
  return parseTimeToMinutes(hhmm) < 6*60;
}
function sortKeyWith06Boundary(dateStr, data) {
  const t = data.startTime || "00:00";
  const base = parseTimeToMinutes(t);
  return (data.startDate !== dateStr && isEarlyMorningHHMM(t)) ? base + 24*60 : base;
}


// ロジックを関数化
async function loadTournamentsForDate(dateStr) {
  list.innerHTML = `<p style="text-align: center; padding: 1rem;">${dateStr}のトーナメントを読み込み中...</p>`;

  const qMain = query(collection(db, "tournaments"), where("startDate", "==", dateStr));
  const qNext = query(collection(db, "tournaments"), where("startDate", "==", getNextDateStr(dateStr)));

  const [snapMain, snapNext] = await Promise.all([getDocs(qMain), getDocs(qNext)]);

  const rows = [
    ...snapMain.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isEarlyMorningHHMM(x.startTime)),
    ...snapNext.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => isEarlyMorningHHMM(x.startTime))
  ];

  if (rows.length === 0) {
    list.innerHTML = `<p style='color:#666; text-align:center; padding: 1rem; background: var(--color-surface); border-radius: 8px;'>${dateStr}のトーナメント情報はありません。</p>`;
    return;
  }
  
  rows.sort((a, b) => sortKeyWith06Boundary(dateStr, a) - sortKeyWith06Boundary(dateStr, b));

  list.innerHTML = rows.map(data => createTournamentCard(data, dateStr)).join('');
}

// カードを生成する関数
function createTournamentCard(data, dateStr) {
    const isNextDay = data.startDate !== dateStr && isEarlyMorningHHMM(data.startTime);
    const startTimeLabel = `${isNextDay ? "翌 " : ""}${data.startTime}`;
    const eventType = data.eventType || 'トーナメント';

    const buyIn = data.buyIn ? `<div>Buy-in: ¥${data.buyIn}</div>` : '';
    const reentry = data.reentryFee ? `<div>Re-entry: ¥${data.reentryFee}</div>` : '<div>Re-entry: なし</div>';

    return `
      <a href="/tournaments/${data.id}" class="tournament-card">
        <div class="tournament-left">
          <div class="tournament-time">${startTimeLabel}</div>
          <div class="tournament-details">
            <span class="tournament-title">${data.eventName || '名称未設定'}</span>
            <span class="tournament-store">${data.storeName || ''}</span>
            <span class="tournament-type" data-type="${eventType}">${eventType}</span>
          </div>
        </div>
        <div class="tournament-right">
          ${buyIn}
          ${reentry}
        </div>
        <div class="tournament-arrow">→</div>
      </a>
    `;
}

// 初期化とイベントリスナーの設定
const today = new Date().toISOString().slice(0, 10);
dateInput.value = today;
loadTournamentsForDate(today);

dateInput.addEventListener("change", () => {
    loadTournamentsForDate(dateInput.value);
});

// `tournaments.js` と同じCSSをページに注入する (これは変更なし)
const styles = `
.tournament-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.2rem;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.04);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: inherit;
  }
  
  .tournament-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .tournament-left {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-grow: 1;
    min-width: 0;
  }

  .tournament-time {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-text, #333);
    width: 5em;
    text-align: left;
    flex-shrink: 0;
  }

  .tournament-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex-grow: 1;
    min-width: 0;
  }

  .tournament-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text, #333);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .tournament-store {
      font-size: 0.9rem;
      color: var(--color-text-muted, #777);
      font-weight: 500;
  }

  .tournament-type {
    display: inline-block;
    padding: 0.15em 0.6em;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 999px;
    margin-top: 0.4rem;
    color: #fff;
    background-color: #888; /* デフォルト */
    width: fit-content;
  }
  
  .tournament-type[data-type="トーナメント"] {
    background-color: var(--color-primary, #ff7f00);
  }

  .tournament-type[data-type="サテライト"] {
    background-color: #007bff;
  }

  .tournament-right {
    text-align: right;
    font-size: 0.9rem;
    color: var(--color-text-muted, #777);
    white-space: nowrap;
    flex-shrink: 0;
    padding-left: 1rem;
  }

  .tournament-arrow {
    margin-left: 1.5rem;
    color: var(--color-primary, #ff7f00);
    font-size: 1.5rem;
    font-weight: bold;
    flex-shrink: 0;
  }
  @media(max-width: 768px) {
    .tournament-card {
        flex-direction: column;
        align-items: stretch;
        gap: 0.8rem;
    }
    .tournament-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    .tournament-right {
        text-align: left;
        padding-left: 0;
        margin-top: 0.5rem;
    }
    .tournament-arrow {
        display: none;
    }
  }
`;

// スタイルシートの注入ロジックを修正
const styleSheetId = 'today-tournament-card-style';
let styleSheet = document.getElementById(styleSheetId);
if (!styleSheet) {
    styleSheet = document.createElement("style");
    styleSheet.id = styleSheetId;
    document.head.appendChild(styleSheet);
}
styleSheet.innerText = styles;