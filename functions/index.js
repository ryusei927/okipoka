const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Firestoreを初期化
admin.initializeApp();
const db = admin.firestore();

// 毎日午前5時に実行されるようにスケジュールを設定（新しい書き方）
exports.deleteOldTournaments = onSchedule({
  schedule: "every day 05:00",
  timeZone: "Asia/Tokyo",
}, async (event) => {
  console.log("古いトーナメントの削除処理を開始します。");

  // 1. 14日前の日付を計算
  const now = new Date();
  now.setHours(now.getHours() + 9); // JSTに補正
  now.setDate(now.getDate() - 14);
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const cutoffDateStr = `${year}-${month}-${day}`;

  console.log(`削除対象となる日付: ${cutoffDateStr} 以前`);

  // 2. 14日以上前のトーナメントを問い合わせ
  const oldTournamentsQuery = db.collection("tournaments")
    .where("startDate", "<=", cutoffDateStr);
    
  const snapshot = await oldTournamentsQuery.get();

  if (snapshot.empty) {
    console.log("削除対象の古いトーナメントはありませんでした。");
    return null;
  }

  // 3. 取得したトーナメントをまとめて削除
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    console.log(`削除: ${doc.id} (${doc.data().eventName}, ${doc.data().startDate})`);
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`${snapshot.size}件の古いトーナメントを削除しました。`);
  
  return null;
});