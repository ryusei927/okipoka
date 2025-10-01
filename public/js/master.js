import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  getDocs, doc, query, limit, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ==== Firebase設定 ====
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

// ▼▼▼ 管理画面で選択できる店舗のリスト ▼▼▼
// 店舗を追加・削除する場合は、このリストを編集してください。
const STORE_LIST = [
  "Jack9", "UnderTheGun", "Re:Barta", "BACKDOOR", "JACKS",
  "TOKISHIRAZU", "TheHand", "GUTSHOT", "Donk", "Re:raise",
  "NUTS", "WBERRY", "那覇 BIG SLICK"
];
// ▲▲▲ ▲▲▲

// ==== 運営ログイン処理 ====
const ADMIN_EMAIL = "admin@okipoka.jp";

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pass = document.getElementById("admin-pass").value.trim();
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pass);
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("admin-section").style.display = "block";
    populateStores();
    initAdminListUI();
  } catch (err) {
    console.error(err);
    alert("パスワードが違います");
  }
});

// ==== 店舗選択プルダウンを生成 ====
function populateStores() {
  const storeSelect = document.getElementById("store-select");
  const adminFilterStore = document.getElementById("admin-filter-store");
  storeSelect.innerHTML = "";
  adminFilterStore.innerHTML = '<option value="">すべて</option>';

  const sortedStores = [...STORE_LIST].sort((a, b) => a.localeCompare(b, "ja"));

  sortedStores.forEach(storeName => {
    // 登録フォーム用
    const opt1 = document.createElement("option");
    opt1.value = storeName;
    opt1.textContent = storeName;
    storeSelect.appendChild(opt1);

    // フィルタ用
    const opt2 = document.createElement("option");
    opt2.value = storeName;
    opt2.textContent = storeName;
    adminFilterStore.appendChild(opt2);
  });
}

// ==== トーナメント登録処理 ====
document.getElementById("tournament-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const storeName = document.getElementById("store-select").value;
  const eventName = document.getElementById("event-name").value.trim();
  const dateRaw = document.getElementById("multi-date").value;
  const startTime = document.getElementById("start-time").value;
  const buyIn = document.getElementById("buy-in").value;
  const addon = document.getElementById("addon").value || "なし";
  const prize = document.getElementById("prize").value || "店舗にてご確認ください";
  const stack = document.getElementById("stack").value;
  const note = document.getElementById("note").value;
  const lateReg = document.getElementById("late-reg").value;
  const structureUrl = document.getElementById("structureUrl").value;
  const eventType = document.getElementById("eventType").value;
  const reentryFeeRaw = document.getElementById("reentry-fee").value ?? "";
  const reentryFee = String(reentryFeeRaw).trim() === "" ? null : Number(reentryFeeRaw);

  if (!eventName || !startTime || !dateRaw) {
    alert("イベント名・開催日・開始時間は必須です");
    return;
  }

  const selectedDates = dateRaw.split(",").map(s => s.trim()).filter(Boolean);
  if (!selectedDates.length) {
    alert("開催日が正しく入力されていません");
    return;
  }

  try {
    for (const raw of selectedDates) {
      const startDate = new Date(raw).toISOString().slice(0, 10);
      const payload = {
        eventName, storeName, startTime, startDate, buyIn, addon, prize,
        stack, note, lateReg, structureUrl, eventType, reentryFee,
        postedBy: "運営", // 投稿者を「運営」に固定
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, "tournaments"), payload);
    }
    alert("トーナメント情報を送信しました！");
    e.target.reset();
  } catch (err) {
    console.error("保存失敗:", err);
    alert("保存に失敗しました");
  }
});


// ============== 投稿一覧管理機能 ==============
let _adminCache = [];

function renderAdminRows(rows) {
  const tbody = document.getElementById("admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.createdAt || "-"}</td>
      <td>${r.storeName || "-"}</td>
      <td>${r.eventName || "-"}</td>
      <td>${r.startDate || "-"}</td>
      <td>${r.startTime || "-"}</td>
      <td><a href="/tournaments/${r.id}" target="_blank" rel="noopener">詳細</a></td>
      <td style="text-align:center;">
        <button class="admin-del" data-id="${r.id}">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".admin-del").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!id || !confirm("このトーナメントを完全に削除します。よろしいですか？")) return;
      try {
        await deleteDoc(doc(db, "tournaments", id));
        _adminCache = _adminCache.filter(x => x.id !== id);
        applyAdminFilters();
        alert("削除しました");
      } catch (e) {
        console.error(e);
        alert("削除に失敗しました");
      }
    });
  });
}

function applyAdminFilters() {
  const storeFilter = document.getElementById("admin-filter-store")?.value || "";
  let dateFilter = document.getElementById("admin-filter-date")?.value || "";
  if (dateFilter.includes("/")) dateFilter = dateFilter.replaceAll("/", "-");

  let rows = _adminCache.slice();
  if (storeFilter) rows = rows.filter(r => r.storeName === storeFilter);
  if (dateFilter) rows = rows.filter(r => r.startDate === dateFilter);
  
  renderAdminRows(rows);
}

async function loadAdminChunk() {
  const q = query(collection(db, "tournaments"), limit(200));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach(d => {
    const data = d.data() || {};
    const ts = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : 0;
    rows.push({
      id: d.id,
      createdAt: ts ? new Date(ts).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : "",
      _ts: ts,
      eventName: data.eventName || "",
      storeName: data.storeName || "",
      startDate: data.startDate || "",
      startTime: data.startTime || ""
    });
  });
  rows.sort((a,b) => (b._ts||0) - (a._ts||0));
  _adminCache = rows;
  applyAdminFilters();
}

async function initAdminListUI() {
  document.getElementById("admin-filter-apply")?.addEventListener("click", applyAdminFilters);
  document.getElementById("admin-filter-clear")?.addEventListener("click", () => {
    document.getElementById("admin-filter-date").value = "";
    document.getElementById("admin-filter-store").value = "";
    applyAdminFilters();
  });
  document.getElementById("admin-load-more")?.addEventListener("click", loadAdminChunk);

  await loadAdminChunk();
}