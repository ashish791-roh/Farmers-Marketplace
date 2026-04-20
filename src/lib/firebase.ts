import { getApp, initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDplvDoi3g41TwEW63Ukn9kZKUBzmqRxjs",
  authDomain: "farmers--marketplace.firebaseapp.com",
  projectId: "farmers--marketplace",
  storageBucket: "farmers--marketplace.firebasestorage.app",
  messagingSenderId: "408478267035",
  appId: "1:408478267035:web:33ebe17adb3e6c3eeab83e",
  measurementId: "G-Q6ZRVR09BZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);