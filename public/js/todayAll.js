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
list.innerHTML = `<p>本日のトーナメントを読み込み中...</p>`;

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
    list.innerHTML = "<p style='color:#666; text-align:center;'>本日のトーナメントはまだ登録されていません。</p>";
    return;
  }

  rows.sort((a, b) => {
    const minA = parseTimeToMinutes(a.startTime || "");
    const minB = parseTimeToMinutes(b.startTime || "");
    const adjA = (a.startDate !== today && isEarlyMorningHHMM(a.startTime||"")) ? minA+24*60 : minA;
    const adjB = (b.startDate !== today && isEarlyMorningHHMM(b.startTime||"")) ? minB+24*60 : minB;
    return adjA - adjB;
  });

  list.innerHTML = ''; // リストをクリア
  rows.forEach(data => {
    const div = document.createElement("a");
    div.href = `/tournaments/${data.id}`;
    div.classList.add("info-card");
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items: baseline;">
        <strong style="font-size: 1.1rem;">${data.storeName}</strong>
        <span style="font-weight: bold; color: var(--color-primary);">${data.startTime}〜</span>
      </div>
      <p style="margin: 0.5rem 0 0; color: #555;">${data.eventName}</p>
      <small style="color: #777;">Buy-in: ¥${data.buyIn}</small>
    `;
    list.appendChild(div);
  });
});