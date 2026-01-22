import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBl7etILVkrqYc0FU3MJv-HpXS1KYZeXYo",
  authDomain: "reino-cloud-app.firebaseapp.com",
  projectId: "reino-cloud-app",
  storageBucket: "reino-cloud-app.firebasestorage.app",
  messagingSenderId: "498900193832",
  appId: "1:498900193832:web:36e93db13c2d6f6b5d9b1d"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);