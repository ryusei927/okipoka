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

// 日付取得関数（ローカルタイム）
function getFormattedDate(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

// Firestoreから該当日のデータを取得＆表示
async function loadTournaments(dateStr) {
  list.innerHTML = ""; // Clear previous

  const q = query(collection(db, "tournaments"), where("startDate", "==", dateStr));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    list.innerHTML = "<p style='text-align: center; color: #666;'>指定された日のトーナメントはありません。</p>";
    return;
  }

  const docs = snapshot.docs.slice();

  docs.sort((a, b) => {
    const timeA = a.data().startTime || "";
    const timeB = b.data().startTime || "";
    return timeA.localeCompare(timeB);
  });

  docs.forEach(doc => {
    const data = doc.data();
    const card = document.createElement("div");
    card.classList.add("tournament-card");
    card.style.color = "inherit";
    card.innerHTML = `
      <div class="tournament-card-body">
        <p class="tournament-title"><strong>${data.eventName || "タイトル未定"}</strong></p>
        <div class="row">
          <p><span class="label">Venue：</span>${data.storeName || data.postedBy || "不明な店舗"}</p>
          <p><span class="label">Start：</span>${data.startTime || "時間未定"}</p>
        </div>
        <p><span class="label">Buy-in：</span>${data.buyIn || "未定"}</p>
      </div>
      <div class="details-button-wrapper">
        <a href="/tournaments/${doc.id}" class="details-button">
          詳細
        </a>
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