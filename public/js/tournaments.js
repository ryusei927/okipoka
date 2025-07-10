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
    list.innerHTML = ""; // Clear previous contents

    snapshot.forEach(doc => {
        const data = doc.data();
        const card = document.createElement("div");
        card.classList.add("tournament-card");

        card.innerHTML = `
          <div class="tournament-card-body">
            <p><strong>タイトル：</strong>${data.eventName || "タイトル未定"}</p>
            <div class="row">
              <p><strong>店舗：</strong>${data.storeName || data.postedBy || "不明な店舗"}</p>
              <p><strong>開始時間：</strong>${data.startTime || "時間未定"}</p>
            </div>
            <div class="row">
              <p><strong>Buy-in：</strong>${data.buyIn || "未定"}</p>
              <p><strong>Add-on：</strong>${data.addon || "なし"}</p>
            </div>
            <p><strong>スタック：</strong>${data.stack || "未定"}</p>
            <p><strong>プライズ：</strong>${data.prize || ""}</p>
          </div>
        `;
        list.appendChild(card);
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