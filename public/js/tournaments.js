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
function isEarlyMorningHHMM(hhmm) { return parseTimeToMinutes(hhmm) < 6*60; }
function sortKeyWith06Boundary(dateStr, data) {
  const t = data.startTime || "00:00";
  const base = parseTimeToMinutes(t);
  return (data.startDate !== dateStr && isEarlyMorningHHMM(t)) ? base + 24*60 : base;
}

const today = new Date().toISOString().slice(0, 10);
dateInput.value = today;
loadTournaments(today);

dateInput.addEventListener("change", () => loadTournaments(dateInput.value));

async function loadTournaments(dateStr) {
  list.innerHTML = `<p style="text-align:center;">読み込み中...</p>`;

  const qMain = query(collection(db, "tournaments"), where("startDate", "==", dateStr));
  const qNext = query(collection(db, "tournaments"), where("startDate", "==", getNextDateStr(dateStr)));

  const [snapMain, snapNext] = await Promise.all([getDocs(qMain), getDocs(qNext)]);

  const rows = [
    ...snapMain.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isEarlyMorningHHMM(x.startTime)),
    ...snapNext.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => isEarlyMorningHHMM(x.startTime))
  ];

  if (rows.length === 0) {
    list.innerHTML = "<p style='text-align: center; padding: 2rem; background: var(--color-surface); border-radius: 8px;'>この日のトーナメント情報はありません。</p>";
    return;
  }

  rows.sort((a, b) => sortKeyWith06Boundary(dateStr, a) - sortKeyWith06Boundary(dateStr, b));

  list.innerHTML = rows.map(data => createTournamentCard(data, dateStr)).join('');
}

function createTournamentCard(data, dateStr) {
    const isNextDay = data.startDate !== dateStr && isEarlyMorningHHMM(data.startTime);
    const startTimeLabel = `${isNextDay ? "翌 " : ""}${data.startTime}`;

    return `
    <a href="/tournaments/${data.id}" class="tournament-card">
        <div class="time-info">
            <span class="start-time">${startTimeLabel}</span>
            <span class="event-type">${data.eventType || 'トーナメント'}</span>
        </div>
        <div class="main-info">
            <h3>${data.eventName || "イベント名未設定"}</h3>
            <p class="store-name">${data.storeName || "店舗未設定"}</p>
        </div>
        <div class="entry-info">
            <p><strong>Buy-in:</strong> ¥${data.buyIn || '未定'}</p>
            <p><strong>Re-entry:</strong> ${data.reentryFee ? `¥${data.reentryFee}` : 'なし'}</p>
        </div>
        <div class="details-arrow">→</div>
    </a>
  `;
}

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
.time-info .start-time {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-primary);
    display: block;
}
.event-type {
    font-size: 0.8rem;
    background: #e9ecef;
    color: #495057;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
}
.main-info h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
}
.store-name {
    color: var(--color-text-muted);
    font-size: 0.9rem;
}
.entry-info {
    font-size: 0.9rem;
    color: #444;
}
.details-arrow {
    font-size: 2rem;
    color: var(--color-primary);
}
@media (max-width: 768px) {
    .tournament-card {
        grid-template-columns: 1fr;
        text-align: center;
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