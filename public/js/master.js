import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  getDocs, doc, getDoc, query, limit, orderBy, startAfter, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ==== Firebase設定（既存に合わせる）====
const firebaseConfig = {
  apiKey: "AIzaSyBhItIbOxR6rXdClsDidrcB1iB1714paAs",
  authDomain: "okipoka-68419.firebaseapp.com",
  projectId: "okipoka-68419",
  storageBucket: "okipoka-68419.firebasestorage.app", // tournaments.js に合わせる
  messagingSenderId: "749122576664",
  appId: "1:749122576664:web:20b93253162b185d993e6d",
  measurementId: "G-GN4PCM7BZB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const STORE_EMAIL_MAP = {
  "batabata@gmail.com": "リバータ",     
  "toki2025@gmail.com": "トキシラズ",
  "j9j9@gmail.com": "Jack9",
  "nut@gmail.com": "ナッツ",
  "bdoor@gmail.com": "那覇バックドア",
  "hand00@gmail.com": "ハンド",
  "utg@gmail.com": "アンダーザガン",
  "re@gmail.com": "リレイズ",
  "jj@gmail.com": "ジャックス",
  "donk@gmail.com": "ドンク",
  "wb@gmail.com": "ダブルベリー",
  "bigs@gmail.com": "那覇 BIG SLICK"
};

// ==== “パスだけ”ログインの中身：管理用メールで正規ログイン ====
const ADMIN_EMAIL = "admin@okipoka.jp";   // 事前にFirebaseでこのユーザーを作っておく
// 画面ではメールを聞かず、入力パスワードでこのメールにログインする

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pass = document.getElementById("admin-pass").value.trim();
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pass); // ← これで“パスだけUX”
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("admin-section").style.display = "block";
    await populateStores(); // ログイン後に店舗リストをロード
    await initAdminListUI(); // 管理一覧の初期化
  } catch (err) {
    console.error(err);
    alert("パスワードが違います");
  }
});

// ==== usersコレクションから店舗名リストを生成（必要なら固定でOK）====
async function populateStores() {
  const sel = document.getElementById("store-select");
  sel.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));

  // emailLower -> originalDocId
  const mapLowerToDocId = new Map();

  snap.forEach(d => {
    const originalId = d.id || "";
    const emailLower = originalId.toLowerCase();
    if (STORE_EMAIL_MAP[emailLower]) {
      mapLowerToDocId.set(emailLower, originalId);
    }
  });

  // 並べ替えは店舗名（日本語）で
  const items = Array.from(mapLowerToDocId.keys())
    .sort((a, b) => STORE_EMAIL_MAP[a].localeCompare(STORE_EMAIL_MAP[b], "ja"));

  for (const emailLower of items) {
    const docId = mapLowerToDocId.get(emailLower);
    const opt = document.createElement("option");
    opt.value = docId;                         // Firestore取得用に「元のdocId」（大文字保持）
    opt.dataset.emailLower = emailLower;       // 表示名マップ用に小文字も保持
    opt.textContent = STORE_EMAIL_MAP[emailLower];
    sel.appendChild(opt);
  }
}

// ==== 送信（dashboard.jsの項目に揃える）====
document.getElementById("tournament-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const sel = document.getElementById("store-select");
  const docId = sel.value; // 元のdocId（大文字を保持）
  const emailLower = sel.options[sel.selectedIndex]?.dataset.emailLower || docId.toLowerCase();

  let storeUrl = "";
  try {
    const userDoc = await getDoc(doc(db, "users", docId)); // 大小区別のdocIdで取得
    if (userDoc.exists() && userDoc.data().instagramUrl) {
      storeUrl = userDoc.data().instagramUrl;
    }
  } catch (e) {
    console.warn("店舗URLの取得に失敗:", e);
  }

  const storeName = STORE_EMAIL_MAP[emailLower];
  const eventName = document.getElementById("event-name").value.trim();
  const dateRaw   = document.getElementById("multi-date").value;
  const startTime = document.getElementById("start-time").value;

  const buyIn  = document.getElementById("buy-in").value;
  const addon  = document.getElementById("addon").value || "なし";
  const prize  = document.getElementById("prize").value || "店舗にてご確認ください";
  const stack  = document.getElementById("stack").value;
  const note   = document.getElementById("note").value;
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
      // YYYY-MM-DD 正規化（ローカル→ISO切り出し）
      const startDate = new Date(raw).toISOString().slice(0, 10);

      const payload = {
        eventName,
        storeName,                 // 表示で利用 [oai_citation:5‡tournaments.js](file-service://file-AkjANLXkknzsn4KJXFiq7b)
        storeUrl,
        startTime,
        startDate,
        buyIn,
        addon,
        prize,
        stack,
        note,
        lateReg,
        structureUrl,
        eventType,
        reentryFee,                // 表示で利用（円フォーマット側あり） [oai_citation:6‡tournaments.js](file-service://file-AkjANLXkknzsn4KJXFiq7b)
        postedBy: "運営",
        postedByEmailLower: ADMIN_EMAIL, // 互換用（ダミーでOK）
        storeId: ADMIN_EMAIL,          // 将来UID連携するなら適宜変更
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

// ============== 管理一覧（非表示/復活・フィルタ付き） ==============
let _adminCache = [];
let _adminLastDoc = null; // 将来ページングに使う予定

function renderAdminRows(rows) {
  const tbody = document.getElementById("admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  rows.forEach((r) => {
    const statusHtml = r.archived
      ? `<span class="badge" style="padding:.15em .5em;border:1px solid #999;border-radius:9999px;color:#555;">非表示</span>`
      : `<span class="badge" style="padding:.15em .5em;border:1px solid #22c55e;border-radius:9999px;color:#16a34a;">公開</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">${r.createdAt || "-"}</td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">${r.storeName || "-"}</td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">${r.eventName || "-"}</td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">${r.startDate || "-"}</td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">${r.startTime || "-"}</td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">${statusHtml}</td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0;">
        <a href="/tournaments/${r.id}" target="_blank" rel="noopener">詳細</a>
      </td>
      <td style="padding:.5em; border-bottom:1px solid #f0f0f0; text-align:center;">
        <button class="admin-del" data-id="${r.id}">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 削除（ハードデリート）
  tbody.querySelectorAll(".admin-del").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!id) return;
      if (!confirm("このトーナメントを完全に削除します。よろしいですか？（元に戻せません）")) return;
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
  const storeSel = document.getElementById("admin-filter-store");
  const dateInput = document.getElementById("admin-filter-date");
  const incArchived = document.getElementById("admin-filter-include-archived");

  const storeFilter = storeSel?.value || "";
  let dateFilter = dateInput?.value || "";
  if (dateFilter.includes("/")) dateFilter = dateFilter.replaceAll("/", "-");

  let rows = _adminCache.slice();
  if (storeFilter) rows = rows.filter(r => r.storeName === storeFilter);
  if (dateFilter) rows = rows.filter(r => r.startDate === dateFilter);
  if (!incArchived?.checked) rows = rows.filter(r => !r.archived);

  renderAdminRows(rows);
}

async function loadAdminChunk() {
  // インデックス不要版：最大200件取得 → クライアントで降順ソート
  const q = query(collection(db, "tournaments"), limit(200));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach(d => {
    const data = d.data() || {};
    const ts = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : 0;
    rows.push({
      id: d.id,
      createdAt: ts ? new Date(ts).toLocaleString() : "",
      _ts: ts,
      eventName: data.eventName || "",
      storeName: data.storeName || "",
      startDate: data.startDate || "",
      startTime: data.startTime || "",
      archived: !!data.archived
    });
  });
  rows.sort((a,b) => (b._ts||0) - (a._ts||0));
  _adminCache = rows;
  _adminLastDoc = null;
  applyAdminFilters();
  return true;
}

async function initAdminListUI() {
  // フィルタの店舗候補（store-select と同じ）を流用
  const storeSel = document.getElementById("admin-filter-store");
  const sourceSel = document.getElementById("store-select");
  if (storeSel && sourceSel) {
    storeSel.innerHTML = '<option value="">すべて</option>';
    Array.from(sourceSel.options).forEach(opt => {
      const name = opt.textContent || "";
      if (!name) return;
      const o = document.createElement("option");
      o.value = name;
      o.textContent = name;
      storeSel.appendChild(o);
    });
  }

  // 初期はフィルタ空（全件表示）
  const d0 = document.getElementById("admin-filter-date");
  const s0 = document.getElementById("admin-filter-store");
  if (d0) d0.value = "";
  if (s0) s0.value = "";

  document.getElementById("admin-filter-apply")?.addEventListener("click", applyAdminFilters);
  document.getElementById("admin-filter-clear")?.addEventListener("click", () => {
    const d = document.getElementById("admin-filter-date");
    const s = document.getElementById("admin-filter-store");
    const inc = document.getElementById("admin-filter-include-archived");
    if (d) d.value = "";
    if (s) s.value = "";
    if (inc) inc.checked = false;
    applyAdminFilters();
  });
  document.getElementById("admin-load-more")?.addEventListener("click", async () => {
    await loadAdminChunk(); // 再取得
  });

  _adminCache = [];
  await loadAdminChunk(); // 初回ロード→applyAdminFilters() を呼ぶ
}