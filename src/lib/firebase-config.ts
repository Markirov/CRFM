// ══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FIREBASE Y FIRESTORE
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
// import { getAuth } from "firebase/auth"; // Activar cuando hagamos el Login

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

// Analytics solo en runtime browser que lo soporte (evita crash en SSR/dev edge cases).
analyticsSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});

// export const auth = getAuth(app); // Para el futuro sistema de roles