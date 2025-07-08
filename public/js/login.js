import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/tournaments/dashboard";
    } catch (error) {
      console.error(error);
      errorMsg.textContent = "ログインに失敗しました。メールアドレスとパスワードを確認してください。";
    }
  });
});
