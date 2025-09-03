// dashboard.js (safe fix: email lower + self-heal + storeName embed)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

// 認証ガード
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("welcome-msg").textContent = `${user.email} さんがログインしています。`;
  } else {
    window.location.href = "login.html";
  }
});

// ログアウト
document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});

// 小文字メールでユーザープロファイル取得（自己修復付き）
async function getStoreProfileWithSelfHeal() {
  const user = auth.currentUser;
  if (!user) throw new Error("not signed in");
  const email = user.email || "";
  const emailLower = email.toLowerCase();

  const lowerRef = doc(db, "users", emailLower);
  const exactRef = doc(db, "users", email);

  const lowerSnap = await getDoc(lowerRef);
  if (lowerSnap.exists()) {
    return { storeName: lowerSnap.data().storeName || "無名店舗", emailLower, uid: user.uid };
  }

  // 小文字が無ければ元IDも試す（大文字混じりを使っていた過去データ救済）
  const exactSnap = await getDoc(exactRef);
  if (exactSnap.exists()) {
    // 自己修復：小文字IDへコピー
    await setDoc(lowerRef, exactSnap.data(), { merge: true });
    return { storeName: exactSnap.data().storeName || "無名店舗", emailLower, uid: user.uid };
  }

  // どちらも無ければフォールバック
  return { storeName: "無名店舗", emailLower, uid: user.uid };
}

// 送信
document.getElementById("tournament-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const eventName = document.getElementById("event-name").value;
  const dateRaw = document.getElementById("multi-date").value;
  const selectedDates = dateRaw.split(",").map(s => s.trim()).filter(Boolean);
  const start = document.getElementById("start-time").value;

  const buyIn = document.getElementById("buy-in").value;
  const addon = document.getElementById("addon").value || "なし";
  const prize = document.getElementById("prize").value || "店舗にてご確認ください";
  const stack = document.getElementById("stack").value;
  const note = document.getElementById("note").value;
  const lateReg = document.getElementById("late-reg").value;
  const structureUrl = document.getElementById("structureUrl").value;
  const eventType = document.getElementById("eventType").value;

  // ★ 追加：リエントリー料金（数値）
  const reentryFeeRaw = document.getElementById("reentry-fee")?.value ?? "";
  const reentryFee = reentryFeeRaw.trim() === "" ? null : Number(reentryFeeRaw);

  if (!eventName || !start || selectedDates.length === 0) {
    alert("トーナメントタイトル、開催日、開始時間は必須です");
    return;
  }

  try {
    // ここが肝：storeName を取得（自己修復＆小文字統一）
    const profile = await getStoreProfileWithSelfHeal();

    for (const rawDate of selectedDates) {
      const startDate = new Date(rawDate).toISOString().slice(0, 10);

      const payload = {
        eventName,
        storeName: profile.storeName,               // ← 表示用に埋め込み
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
        reentryFee,                                 // ★ 追加：リエントリー料金（数値 or null）
        postedBy: auth.currentUser ? auth.currentUser.email : "unknown",
        postedByEmailLower: profile.emailLower,     // ← 互換用
        storeId: profile.uid,                       // ← 将来のUID方式移行に備え保存
        timestamp: serverTimestamp()
      };

      console.log("Firestore送信データ", payload);
      await addDoc(collection(db, "tournaments"), payload);
    }

    alert("トーナメント情報を送信しました！");
    this.reset();
  } catch (err) {
    console.error("保存失敗:", err);
    alert("保存に失敗しました");
  }
});