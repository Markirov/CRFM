// ═══════════════════════════════════════════════════════════════
// SCRIPT DE SUBIDA DE REGLAS JSON A FIRESTORE
// Ejecutar: npx tsx scripts/db/upload_rules.ts
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const firebaseConfig = {
  apiKey: 'AIzaSyCNxTd8StB__GsBaIWto-FAk0uVJm9yyAI',
  authDomain: 'crfm-dc873.firebaseapp.com',
  projectId: 'crfm-dc873',
  storageBucket: 'crfm-dc873.firebasestorage.app',
  messagingSenderId: '191640647112',
  appId: '1:191640647112:web:d3302a56c35db145427cfd',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..');
const RULES_DIR = path.join(ROOT, 'data', 'rules');

// Firestore no soporta arrays anidados (ej. [[1,2], [3,4]]).
// Esta función convierte los arrays anidados en strings "1,2".
function sanitizeNestedArrays(obj: any): any {
  if (Array.isArray(obj)) {
    if (obj.some(el => Array.isArray(el))) {
      return obj.map(el => Array.isArray(el) ? JSON.stringify(el) : sanitizeNestedArrays(el));
    }
    return obj.map(el => sanitizeNestedArrays(el));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = sanitizeNestedArrays(obj[key]);
    }
    return newObj;
  }
  return obj;
}

async function uploadRules() {
  console.log('🚀 Iniciando subida masiva a Firestore (Colección: enciclopedia)...');
  
  if (!fs.existsSync(RULES_DIR)) {
    console.error(`❌ Directorio no encontrado: ${RULES_DIR}`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  const categories = fs.readdirSync(RULES_DIR);
  for (const catFolder of categories) {
    const catPath = path.join(RULES_DIR, catFolder);
    if (!fs.statSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const subcatSlug = file.replace('.json', '');
      const filePath = path.join(catPath, file);
      
      try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        let jsonData = JSON.parse(rawData);

        jsonData = sanitizeNestedArrays(jsonData);

        if (Array.isArray(jsonData)) {
          jsonData = { data: jsonData };
        }

        await setDoc(doc(db, 'enciclopedia', subcatSlug), jsonData);
        console.log(`  ✅ Subido: ${subcatSlug} (${catFolder})`);
        successCount++;
      } catch (err: any) {
        console.error(`  ❌ ERROR subiendo ${subcatSlug}:`, err.message);
        errorCount++;
      }
    }
  }

  console.log('\n=======================================');
  console.log(`✅ Subida Finalizada. Éxitos: ${successCount} | Errores: ${errorCount}`);
  console.log('=======================================');
  process.exit(0);
}

uploadRules();
