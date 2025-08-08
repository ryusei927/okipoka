import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("welcome-msg").textContent = `${user.email} さんがログインしています。`;
  } else {
    window.location.href = "login.html";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});

document.getElementById("tournament-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const eventName = document.getElementById("event-name").value;
  const dateRaw = document.getElementById("multi-date").value;
  const selectedDates = dateRaw.split(",").map(s => s.trim());
  const start = document.getElementById("start-time").value;
  const buyIn = document.getElementById("buy-in").value;
  const addon = document.getElementById("addon").value || "なし";
  const prize = document.getElementById("prize").value || "店舗にてご確認ください";
  const stack = document.getElementById("stack").value;
  const note = document.getElementById("note").value;
  const lateReg = document.getElementById("late-reg").value;
  const structureUrl = document.getElementById("structureUrl").value;
  const eventType = document.getElementById("eventType").value;

  if (!eventName || !start || selectedDates.length === 0) {
    alert("トーナメントタイトル、開催日、開始時間は必須です");
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.email));
    const storeName = userDoc.exists() ? userDoc.data().storeName : "無名店舗";

    for (const rawDate of selectedDates) {
      const startDate = new Date(rawDate).toISOString().slice(0, 10);

      console.log("Firestore送信データ", {
        eventName,
        storeName,
        startTime: start,
        startDate,
        buyIn,
        addon,
        prize,
        stack,
        note,
        lateReg,
        structureUrl,
        eventType
      });
      await addDoc(collection(db, "tournaments"), {
        eventName,
        storeName,
        startTime: start,
        startDate,
        buyIn,
        addon,
        prize,
        stack,
        note,
        lateReg,
        structureUrl,
        eventType,
        postedBy: auth.currentUser ? auth.currentUser.email : "unknown",
        timestamp: serverTimestamp()
      });
    }

    alert("トーナメント情報を送信しました！");
    this.reset();
  } catch (err) {
    console.error("保存失敗:", err);
    alert("保存に失敗しました");
  }
});