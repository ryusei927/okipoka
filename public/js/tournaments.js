// js/tournaments.js (改善版)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB8q6HLBGi_DWmrvkGCaWK_B6EeP7D--wo",
    authDomain: "okipoka-v2.firebaseapp.com",
    projectId: "okipoka-v2",
    storageBucket: "okipoka-v2.firebasestorage.app",
    messagingSenderId: "6256473895",
    appId: "1:6256-473895:web:df644eaac108a218d59b02",
    measurementId: "G-JLC2569WN3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const list = document.getElementById("tournament-list");
const dateInput = document.getElementById("datePicker");

let statusUpdateTimer = null;

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

// 時刻のステータスHTMLを生成するメインの関数
function getTournamentTimeHtml(start, end, now, timeLabel, hasRealLateReg) {
    // 無効な日付なら元の時刻ラベルを返す
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return `<div class="tournament-time">${timeLabel}</div>`;
    }

    // 締切時刻を過ぎていたら「終了」
    if (now > end) {
        return `<div class="status-finished">終了</div>`;
    }

    let statusHtml = `<div class="tournament-time">${timeLabel}</div>`;

    // 開催中であれば、「開催中」バッジと残り時間を追加
    if (now >= start && now <= end) {
        statusHtml += `<div class="status-in-progress">開催中</div>`;
        
        if (hasRealLateReg) {
            const diffMins = Math.round((end - now) / (1000 * 60));
            statusHtml += `<div class="status-countdown">受付終了まで ${diffMins}分</div>`;
        }
    }
    
    return statusHtml;
}

// 1分ごとに全てのカードステータスを更新
function updateAllCardStatuses() {
    const now = new Date();
    document.querySelectorAll('.tournament-card').forEach(card => {
        const startStr = card.dataset.startDatetime;
        const lateRegStr = card.dataset.lateRegDatetime;
        const timeLabel = card.dataset.timeLabel;
        const timeCol = card.querySelector('[data-status-container]');

        if (!startStr || !timeCol || !timeLabel) return;

        const start = new Date(startStr);
        const hasRealLateReg = !!lateRegStr;
        const end = hasRealLateReg 
            ? new Date(lateRegStr) 
            : new Date(start.getTime() + 6 * 60 * 60 * 1000);

        timeCol.innerHTML = getTournamentTimeHtml(start, end, now, timeLabel, hasRealLateReg);
    });
}

async function loadTournaments(dateStr) {
    if (statusUpdateTimer) clearInterval(statusUpdateTimer);
    list.innerHTML = `<p style="text-align:center;">${dateStr}のトーナメントを読み込み中...</p>`;
    
    // データ取得ロジック (変更なし)
    const nextDateStr = getNextDateStr(dateStr);
    const qToday = query(collection(db, "tournaments"), where("startDate", "==", dateStr));
    const qNextDay = query(collection(db, "tournaments"), where("startDate", "==", nextDateStr));
    const qStores = collection(db, "stores");
    const [todaySnapshot, nextDaySnapshot, storesSnapshot] = await Promise.all([ getDocs(qToday), getDocs(qNextDay), getDocs(qStores) ]);
    const logoMap = new Map(storesSnapshot.docs.map(doc => [doc.id, doc.data().logoUrl]));
    const todayDocs = todaySnapshot.docs;
    const nextDayDocs = nextDaySnapshot.docs.filter(doc => isBefore10AM(doc.data().startTime));
    const allDocs = [...todayDocs, ...nextDayDocs];
    if (allDocs.length === 0) { list.innerHTML = `<p style='text-align: center; padding: 2rem; background: var(--color-surface); border-radius: 8px;'>${dateStr}のトーナメント情報はありません。</p>`; return; }
    const sortedDocs = allDocs.sort((a, b) => { const dataA = a.data(), dataB = b.data(); const minutesA = timeToMinutes(dataA.startTime), minutesB = timeToMinutes(dataB.startTime); const sortKeyA = dataA.startDate === dateStr ? minutesA : minutesA + 1440; const sortKeyB = dataB.startDate === dateStr ? minutesB : minutesB + 1440; return sortKeyA - sortKeyB; });

    list.innerHTML = sortedDocs.map(doc => createTournamentCard(doc, dateStr, logoMap)).join('');
    
    updateAllCardStatuses();
    statusUpdateTimer = setInterval(updateAllCardStatuses, 60000);
}

function createTournamentCard(doc, selectedDate, logoMap) {
    const data = doc.data();
    const isNextDayTournament = data.startDate !== selectedDate;
    
    const tournamentDateStr = isNextDayTournament ? getNextDateStr(selectedDate) : selectedDate;
    const startTimeStr = data.startTime || '00:00';
    const lateRegTimeStr = data.lateReg || null;
    const timeLabel = isNextDayTournament ? `翌 ${startTimeStr}` : startTimeStr;

    const startDateTime = new Date(`${tournamentDateStr}T${startTimeStr}`);
    let lateRegDateTime = lateRegTimeStr ? new Date(`${tournamentDateStr}T${lateRegTimeStr}`) : null;

    if (startDateTime && lateRegDateTime && lateRegDateTime < startDateTime) {
        lateRegDateTime.setDate(lateRegDateTime.getDate() + 1);
    }
    
    const hasRealLateReg = !!lateRegDateTime;
    const endDateTime = hasRealLateReg 
        ? lateRegDateTime 
        : new Date(startDateTime.getTime() + 6 * 60 * 60 * 1000);

    const timeDisplayHtml = getTournamentTimeHtml(startDateTime, endDateTime, new Date(), timeLabel, hasRealLateReg);
    
    const eventType = data.eventType || 'トーナメント';
    const buyIn = data.buyIn ? `<div><strong>Buy-in:</strong> ${data.buyIn}円</div>` : '<div><strong>Buy-in:</strong> -</div>';
    const reentry = data.reentryFee ? `<div><strong>Re-entry:</strong> ${data.reentryFee}円</div>` : '<div><strong>Re-entry:</strong> なし</div>';
    const logoUrl = logoMap.get(data.storeId);
    const logoImg = logoUrl ? `<img src="${logoUrl}" alt="${data.storeName}" class="tournament-store-logo">` : '';

    return `
      <a href="/tournaments/${doc.id}" class="tournament-card" 
         data-start-datetime="${!isNaN(startDateTime.getTime()) ? startDateTime.toISOString() : ''}" 
         data-late-reg-datetime="${(lateRegDateTime && !isNaN(lateRegDateTime.getTime())) ? lateRegDateTime.toISOString() : ''}"
         data-time-label="${timeLabel}">
        
        <div class="tournament-col-time" data-status-container>
          ${timeDisplayHtml}
        </div>
        <div class="tournament-col-details">
            <div class="tournament-title">${data.eventName || '名称未設定'}</div>
            <div class="tournament-store">
                ${logoImg} <span>${data.storeName || ''}</span>
            </div>
        </div>
        <div class="tournament-col-entry">
            ${buyIn}
            <div class="tournament-type">${eventType}</div>
        </div>
        <div class="tournament-arrow">→</div>
      </a>
    `;
}

function injectStyles() {
    // ★★★ スタイルシートに .status-in-progress を追加 ★★★
    const fullStyles = `
      .tournament-card { display: grid; grid-template-columns: 120px 1fr 1fr auto; align-items: center; gap: 1rem; padding: 1rem; background-color: #fff; border-radius: 8px; border: 1px solid #e6e6e6; color: #333; text-decoration: none; transition: box-shadow 0.2s, transform 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 0.8rem; }
      .tournament-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
      .tournament-col-time { text-align: center; }
      .tournament-col-time .tournament-time { font-size: 1.5rem; font-weight: bold; color: #ff7f00; display: block; line-height: 1.2; }
      .tournament-col-details .tournament-title { margin: 0; font-size: 1.2rem; color: #333; font-weight: 600; }
      .tournament-store { color: #777; font-size: 0.9rem; margin: 0.25rem 0 0 0; display: flex; align-items: center; gap: 8px; }
      .tournament-store-logo { width: 24px; height: 24px; border-radius: 50%; object-fit: contain; background-color: #fff; border: 1px solid #eee; }
      .tournament-col-entry { font-size: 0.9rem; color: #444; text-align: right; }
      .tournament-col-entry div { margin: 0.1rem 0; }
      .tournament-type { font-size: 0.8rem; background: #e9ecef; color: #495057; padding: 2px 6px; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 0.25rem; }
      .tournament-arrow { font-size: 2rem; color: #ff7f00; font-weight: bold; }
      .status-finished { font-size: 1.5rem; font-weight: bold; color: #6c757d; }
      .status-in-progress { font-size: 0.8rem; font-weight: bold; color: #28a745; margin-top: 4px; }
      .status-countdown { font-size: 0.8rem; font-weight: bold; color: #d9534f; margin-top: 4px; }
      @media (max-width: 768px) {
        .tournament-card { grid-template-columns: 1fr; text-align: center; gap: 0.8rem; padding: 1.2rem 1rem; }
        .tournament-col-time { display: flex; justify-content: center; align-items: center; gap: 0.5rem; flex-direction: column; }
        .tournament-col-time .tournament-time { font-size: 1.6rem; }
        .tournament-col-details .tournament-title { font-size: 1.3rem; margin-bottom: 0.3rem; }
        .tournament-store { font-size: 1rem; margin: 0; justify-content: center; }
        .tournament-col-entry { text-align: center; margin-top: 0.5rem; }
        .tournament-arrow { display: none; }
      }`;
    
    const styleSheetId = 'tournament-card-style';
    let styleSheet = document.getElementById(styleSheetId);
    if (!styleSheet) {
        styleSheet = document.createElement("style");
        styleSheet.id = styleSheetId;
        document.head.appendChild(styleSheet);
    }
    styleSheet.innerText = fullStyles;
}

// ヘルパー関数 (変更なし)
function getNextDateStr(dateStr) { const date = new Date(dateStr); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); }
function isBefore10AM(timeStr) { if (!timeStr) return false; const [hours] = timeStr.split(':').map(Number); return hours < 10; }
function timeToMinutes(timeStr) { if (!timeStr) return 0; const [hours, minutes] = timeStr.split(':').map(Number); return (hours * 60) + (minutes || 0); }

injectStyles();