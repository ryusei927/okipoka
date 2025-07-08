import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
// トーナメントを開始時間で昇順に全件取得
const q = query(
    collection(db, "tournaments"),
    orderBy("startTime", "asc")
);

onSnapshot(q, (snapshot) => {
    // テーブルの構造を一度だけセット
    list.innerHTML = `
      <table class="tournament-table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>店舗名</th>
            <th>開始時間</th>
            <th>Buy-in</th>
            <th>Add-on</th>
            <th>スタック</th>
            <th>プライズ</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody id="tournament-rows"></tbody>
      </table>
    `;
    const tbody = document.getElementById("tournament-rows");
    // データ行を追加（本日の日付のみ表示）
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log("データ受信:", data);
        const row = document.createElement("tr");
        row.innerHTML = `
        <td data-label="タイトル">${data.eventName || "タイトル未定"}</td>
        <td data-label="店舗">${data.storeName || data.postedBy || "不明な店舗"}</td>
        <td data-label="開始時間">${data.startTime || "時間未定"}</td>
        <td data-label="Buy-in">${data.buyIn || "未定"}</td>
        <td data-label="Add-on">${data.addon || "なし"}</td>
        <td data-label="スタック">${data.stack || "未定"}</td>
        <td data-label="プライズ">${data.prize || ""}</td>
        <td data-label="備考">${data.note || ""}</td>
      `;
        tbody.appendChild(row);
    });
});


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