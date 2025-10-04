// js/tournaments.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// v2のFirebaseプロジェクト設定
const firebaseConfig = {
    apiKey: "AIzaSyB8q6HLBGi_DWmrvkGCaWK_B6EeP7D--wo",
    authDomain: "okipoka-v2.firebaseapp.com",
    projectId: "okipoka-v2",
    storageBucket: "okipoka-v2.firebasestorage.app",
    messagingSenderId: "6256473895",
    appId: "1:6256473895:web:df644eaac108a218d59b02",
    measurementId: "G-JLC2569WN3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const list = document.getElementById("tournament-list");
const dateInput = document.getElementById("datePicker");

if (!list || !dateInput) {
    console.error("トーナメント表示用のHTML要素が見つかりません。");
} else {
    initialize();
}

function initialize() {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = today;
    loadTournaments(today);

    dateInput.addEventListener("change", () => {
        loadTournaments(dateInput.value);
    });
}

function getNextDateStr(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
}

function isBefore10AM(timeStr) {
    if (!timeStr) return false;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours < 10;
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
}

// ★★★ 1. 全店舗の情報も一緒に読み込むように修正 ★★★
async function loadTournaments(dateStr) {
    list.innerHTML = `<p style="text-align:center;">${dateStr}のトーナメントを読み込み中...</p>`;

    const nextDateStr = getNextDateStr(dateStr);

    const qToday = query(collection(db, "tournaments"), where("startDate", "==", dateStr));
    const qNextDay = query(collection(db, "tournaments"), where("startDate", "==", nextDateStr));
    const qStores = collection(db, "stores"); // 全店舗の情報を取得するクエリ

    const [todaySnapshot, nextDaySnapshot, storesSnapshot] = await Promise.all([
        getDocs(qToday),
        getDocs(qNextDay),
        getDocs(qStores) // 店舗情報も同時に取得
    ]);
    
    // ロゴ情報を簡単に使えるようにMap形式に変換 (例: {Jack9: 'url', ...})
    const logoMap = new Map(storesSnapshot.docs.map(doc => [doc.id, doc.data().logoUrl]));

    const todayDocs = todaySnapshot.docs;
    const nextDayDocs = nextDaySnapshot.docs.filter(doc => isBefore10AM(doc.data().startTime));
    const allDocs = [...todayDocs, ...nextDayDocs];

    if (allDocs.length === 0) {
        list.innerHTML = `<p style='text-align: center; padding: 2rem; background: var(--color-surface); border-radius: 8px;'>${dateStr}のトーナメント情報はありません。</p>`;
        return;
    }

    const sortedDocs = allDocs.sort((a, b) => {
        const dataA = a.data();
        const dataB = b.data();
        const minutesA = timeToMinutes(dataA.startTime);
        const minutesB = timeToMinutes(dataB.startTime);
        const sortKeyA = dataA.startDate === dateStr ? minutesA : minutesA + 1440;
        const sortKeyB = dataB.startDate === dateStr ? minutesB : minutesB + 1440;
        return sortKeyA - sortKeyB;
    });

    // createTournamentCardにlogoMapを渡す
    list.innerHTML = sortedDocs.map(doc => createTournamentCard(doc, dateStr, logoMap)).join('');
}

// ★★★ 2. ロゴを表示するHTMLを追加 ★★★
function createTournamentCard(doc, selectedDate, logoMap) {
    const data = doc.data();
    const isNextDayTournament = data.startDate !== selectedDate;

    const eventType = data.eventType || 'トーナメント';
    const buyIn = data.buyIn ? `<div><strong>Buy-in:</strong> ${data.buyIn}円</div>` : '<div><strong>Buy-in:</strong> -</div>';
    const reentry = data.reentryFee ? `<div><strong>Re-entry:</strong> ${data.reentryFee}円</div>` : '<div><strong>Re-entry:</strong> なし</div>';
    const timeLabel = isNextDayTournament ? `翌 ${data.startTime || ''}` : data.startTime || '';
    
    // Mapから店舗IDに対応するロゴURLを取得
    const logoUrl = logoMap.get(data.storeId);
    // ロゴがあればimgタグを、なければ空文字を生成
    const logoImg = logoUrl ? `<img src="${logoUrl}" alt="${data.storeName}" class="tournament-store-logo">` : '';

    return `
      <a href="/tournaments/${doc.id}" class="tournament-card">
        <div class="tournament-col-time">
          <div class="tournament-time">${timeLabel}</div>
          <span class="tournament-type">${eventType}</span>
        </div>
        <div class="tournament-col-details">
          <div class="tournament-title">${data.eventName || '名称未設定'}</div>
          <div class="tournament-store">
            ${logoImg} <span>${data.storeName || ''}</span>
          </div>
        </div>
        <div class="tournament-col-entry">
          ${buyIn}
          ${reentry}
        </div>
        <div class="tournament-arrow">→</div>
      </a>
    `;
}

// ★★★ 3. ロゴ用のCSSを追加 ★★★
function injectStyles() {
    const styles = `
      /* ... 既存のスタイル ... */
      .tournament-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
      }

      .tournament-col-time .tournament-time {
        font-size: 1.5rem;
        font-weight: bold;
        color: #ff7f00;
        display: block;
      }
      
      .tournament-type {
        font-size: 0.8rem;
        background: #e9ecef;
        color: #495057;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        margin-top: 0.25rem;
        display: inline-block;
      }

      .tournament-col-details .tournament-title {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
        font-weight: 600;
      }
      
      .tournament-store {
        color: #777;
        font-size: 0.9rem;
        margin: 0.25rem 0 0 0;
        /* ロゴとテキストを縦中央揃えにするための設定 */
        display: flex;
        align-items: center;
        gap: 8px; /* ロゴとテキストの間隔 */
      }

      /* ロゴのスタイルを新設 */
      .tournament-store-logo {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: contain;
        background-color: #fff;
        border: 1px solid #eee;
      }

      .tournament-col-entry {
        font-size: 0.9rem;
        color: #444;
        text-align: right;
      }
      
      /* ... 既存のスタイル ... */

      @media (max-width: 768px) {
        /* ... */
        .tournament-store {
          justify-content: center; /* スマホ表示時は中央揃え */
        }
        /* ... */
      }
    `;

    const styleSheetId = 'tournament-card-style';
    let styleSheet = document.getElementById(styleSheetId);
    if (!styleSheet) {
        styleSheet = document.createElement("style");
        styleSheet.id = styleSheetId;
        document.head.appendChild(styleSheet);
    }
    // 全体を置き換えるので、既存のスタイルもすべて含める
    const fullStyles = `
      .tournament-card {
        display: grid;
        grid-template-columns: 100px 1fr 1fr auto;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background-color: #fff;
        border-radius: 8px;
        border: 1px solid #e6e6e6;
        color: #333;
        text-decoration: none;
        transition: box-shadow 0.2s, transform 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        margin-bottom: 0.8rem;
      }
      .tournament-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
      }
      .tournament-col-time .tournament-time {
        font-size: 1.5rem;
        font-weight: bold;
        color: #ff7f00;
        display: block;
      }
      .tournament-type {
        font-size: 0.8rem;
        background: #e9ecef;
        color: #495057;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        margin-top: 0.25rem;
        display: inline-block;
      }
      .tournament-col-details .tournament-title {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
        font-weight: 600;
      }
      .tournament-store {
        color: #777;
        font-size: 0.9rem;
        margin: 0.25rem 0 0 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tournament-store-logo {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: contain;
        background-color: #fff;
        border: 1px solid #eee;
      }
      .tournament-col-entry {
        font-size: 0.9rem;
        color: #444;
        text-align: right;
      }
      .tournament-col-entry div {
        margin: 0.1rem 0;
      }
      .tournament-arrow {
        font-size: 2rem;
        color: #ff7f00;
        font-weight: bold;
      }
      @media (max-width: 768px) {
        .tournament-card {
          grid-template-columns: 1fr;
          text-align: center;
          gap: 0.8rem;
          padding: 1.2rem 1rem;
        }
        .tournament-col-time {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }
        .tournament-col-time .tournament-time {
          font-size: 1.6rem;
        }
        .tournament-type {
          margin-top: 0;
        }
        .tournament-col-details .tournament-title {
          font-size: 1.3rem;
          margin-bottom: 0.3rem;
        }
        .tournament-store {
          font-size: 1rem;
          margin: 0;
          justify-content: center;
        }
        .tournament-col-entry {
          text-align: center;
          margin-top: 0.5rem;
        }
        .tournament-arrow { 
          display: none; 
        }
      }
    `;
    styleSheet.innerText = fullStyles;
}

injectStyles();