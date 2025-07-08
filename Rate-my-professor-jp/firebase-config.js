// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// 🔽 自分の Firebase 設定をここに貼る！
const firebaseConfig = {
  apiKey: "AIzaSyDP_1iMVykIIPRaUxDrSu7y9QJPx0aYC1k",
  authDomain: "rakutan-hiroba.firebaseapp.com",
  projectId: "rakutan-hiroba",
  storageBucket: "rakutan-hiroba.appspot.com", // ← 修正済み ✅
  messagingSenderId: "71187742619",
  appId: "1:71187742619:web:41966e7baba8cc0793ab3e"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, serverTimestamp };
