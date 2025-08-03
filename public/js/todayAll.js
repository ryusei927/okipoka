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

const now = new Date(); // assume local JST environment
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const today = `${yyyy}-${mm}-${dd}`;

const q = query(
  collection(db, "tournaments"),
  where("startDate", "==", today)
);

getDocs(q).then(snapshot => {
  if (snapshot.empty) {
    list.innerHTML = "<p style='color:#666;'>本日のトーナメントはまだ登録されていません。</p>";
    return;
  }

  const docs = snapshot.docs;

  // startTimeで昇順ソート
  docs.sort((a, b) => {
    const timeA = a.data().startTime || "";
    const timeB = b.data().startTime || "";
    return timeA.localeCompare(timeB);
  });

  docs.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("info-card");
    div.innerHTML = `
      <strong>${data.storeName}</strong> - ${data.eventName}<br>
      ${data.startTime}〜 / Buy-in: ¥${data.buyIn}
    `;
    list.appendChild(div);
  });
});