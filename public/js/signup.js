import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhItIbOxR6rXdClsDidrcB1iB1714paAs",
    authDomain: "okipoka-68419.firebaseapp.com",
    projectId: "okipoka-68419",
    storageBucket: "okipoka-68419.appspot.com",
    messagingSenderId: "749122576664",
    appId: "1:749122576664:web:20b93253162b185d993e6d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const storeName = document.getElementById("store-name").value;
    const errorMsg = document.getElementById("error-message");

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", email), { storeName });
        alert("登録が完了しました！ログインしてください。");
        window.location.href = "/tournaments/login";
    } catch (error) {
        console.error(error);
        errorMsg.textContent = "エラー: " + error.message;
    }
});