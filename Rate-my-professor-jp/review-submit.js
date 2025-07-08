import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// あとはそのままでOK
console.log("✅ review-submit.js 読み込まれた");

export async function submitReview(professorId, comment, rating) {
  console.log("🔥 Firestoreへ送信します");

  const data = {
    professorId,
    comment,
    rating,
    createdAt: serverTimestamp(),
  };

  console.log("📦 保存予定データ:", data);

  try {
    const docRef = await addDoc(collection(db, "reviews"), data);
    console.log("✅ Firestoreに追加されました！ID:", docRef.id);
    alert("レビューを投稿しました！");
  } catch (e) {
    console.error("❌ Firestore 投稿エラー:", e);
    alert("エラーが発生しました。Consoleを確認してください。");
  }
}
