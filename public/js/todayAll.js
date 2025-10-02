import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

const list = document.getElementById("today-all-card");
list.innerHTML = `<p style="text-align: center; padding: 1rem;">本日のトーナメントを読み込み中...</p>`;

const now = new Date();
const today = now.toISOString().slice(0, 10);

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

const nextDateStr = getNextDateStr(today);
const qMain = query(collection(db, "tournaments"), where("startDate", "==", today));
const qNext = query(collection(db, "tournaments"), where("startDate", "==", nextDateStr));

Promise.all([getDocs(qMain), getDocs(qNext)]).then(([snapMain, snapNext]) => {
  const rows = [
    ...snapMain.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => !isEarlyMorningHHMM(x.startTime || "")),
    ...snapNext.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => isEarlyMorningHHMM(x.startTime || "")),
  ];

  if (rows.length === 0) {
    list.innerHTML = "<p style='color:#666; text-align:center; padding: 1rem; background: var(--color-surface); border-radius: 8px;'>本日のトーナメントはまだ登録されていません。</p>";
    return;
  }

  rows.sort((a, b) => {
    const minA = parseTimeToMinutes(a.startTime || "");
    const minB = parseTimeToMinutes(b.startTime || "");
    const adjA = (a.startDate !== today && isEarlyMorningHHMM(a.startTime||"")) ? minA+24*60 : minA;
    const adjB = (b.startDate !== today && isEarlyMorningHHMM(b.startTime||"")) ? minB+24*60 : minB;
    return adjA - adjB;
  });

  list.innerHTML = rows.map(createTournamentCard).join('');
});

// `tournaments.js` と同じHTML構造とCSSを生成する
function createTournamentCard(data) {
    const isNextDay = data.startDate !== today && isEarlyMorningHHMM(data.startTime);
    const startTimeLabel = `${isNextDay ? "翌 " : ""}${data.startTime}`;
    const eventType = data.eventType || 'トーナメント';

    return `
    <a href="/tournaments/${data.id}" class="tournament-card">
        <div class="time-info">
            <span class="start-time">${startTimeLabel}</span>
            <span class="event-type">${eventType}</span>
        </div>
        <div class="main-info">
            <h3>${data.eventName || "イベント名未設定"}</h3>
            <p class="store-name">${data.storeName || "店舗未設定"}</p>
        </div>
        <div class="entry-info">
            <p><strong>Buy-in:</strong> ${data.buyIn ? `¥${data.buyIn}` : '未定'}</p>
            <p><strong>Re-entry:</strong> ${data.reentryFee ? `¥${data.reentryFee}` : 'なし'}</p>
        </div>
        <div class="details-arrow">→</div>
    </a>
  `;
}

// `tournaments.js` と同じCSSをページに注入する
const styles = `
.tournament-card {
    display: grid;
    grid-template-columns: 100px 1fr 1fr auto;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--color-surface);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    text-decoration: none;
    transition: box-shadow 0.2s, transform 0.2s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.tournament-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}
.time-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}
.time-info .start-time {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-primary);
}
.event-type {
    font-size: 0.8rem;
    background: #e9ecef;
    color: #495057;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
    text-align: center;
}
.main-info h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.2rem;
    color: #333;
}
.store-name {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0;
}
.entry-info {
    font-size: 0.9rem;
    color: #444;
}
.entry-info p {
    margin: 0.25rem 0;
}
.details-arrow {
    font-size: 2rem;
    color: var(--color-primary);
    justify-self: end;
}
@media (max-width: 768px) {
    .tournament-card {
        grid-template-columns: 1fr;
        gap: 0.8rem;
        text-align: center;
    }
    .time-info, .main-info, .entry-info {
        grid-column: 1 / -1;
    }
    .details-arrow { display: none; }
}
`;

if (!document.getElementById('tournament-card-style')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'tournament-card-style';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}