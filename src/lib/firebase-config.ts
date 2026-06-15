// ══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FIREBASE Y FIRESTORE
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // Lo descomentaremos cuando hagamos el Login

// ⚠️ SUSTITUYE ESTO POR EL OBJETO QUE TE HA DADO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCNxTd8StB__GsBaIWto-FAk0uVJm9yyAI",
  authDomain: "crfm-dc873.firebaseapp.com",
  projectId: "crfm-dc873",
  storageBucket: "crfm-dc873.firebasestorage.app",
  messagingSenderId: "191640647112",
  appId: "1:191640647112:web:d3302a56c35db145427cfd",
  measurementId: "G-W9DEZ98JNQ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// export const auth = getAuth(app); // Para el futuro sistema de roles