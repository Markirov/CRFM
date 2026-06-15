// ═══════════════════════════════════════════════════════════════
// MIGRACIÓN ONE-SHOT: Google Sheets (Apps Script) → Firestore
//
// Ejecutar:  npx tsx scripts/migrate-sheets-to-firestore.ts
//
// Usa el SDK web (mismo firebaseConfig que la app). Las rules
// Firestore deben permitir write (lo están durante dev).
//
// Si alguna sección falla (endpoint no existe, formato distinto)
// el script continúa con la siguiente. Reporta resumen al final.
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCNxTd8StB__GsBaIWto-FAk0uVJm9yyAI',
  authDomain: 'crfm-dc873.firebaseapp.com',
  projectId: 'crfm-dc873',
  storageBucket: 'crfm-dc873.firebasestorage.app',
  messagingSenderId: '191640647112',
  appId: '1:191640647112:web:d3302a56c35db145427cfd',
};

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyIDYDFO2UyLJ7I6c0QadLU4O85gQWPoaaYo9HmObQaZloSq8bsy_ET_UevkLvDY61a9w/exec';

const PILOTOS = ['Jaime', 'Marcos', 'Joan', 'Alex', 'Erik', 'Zhao', 'Val', 'Tariq'];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stats: Record<string, { ok: number; err: number; skip: number }> = {};
function bump(section: string, key: 'ok' | 'err' | 'skip', n = 1) {
  stats[section] ??= { ok: 0, err: 0, skip: 0 };
  stats[section][key] += n;
}

async function sheetsGet(params: Record<string, string>): Promise<any> {
  const url = new URL(SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// CONFIG → config/main
// ─────────────────────────────────────────────────────────────
async function migrateConfig() {
  const section = 'config';
  console.log(`\n[${section}] Fetching…`);
  try {
    const r = await sheetsGet({ action: 'getConfiguracion' });
    const cfg = r?.config ?? r;
    if (!cfg || typeof cfg !== 'object') {
      console.log(`[${section}] sin datos`);
      bump(section, 'skip');
      return;
    }
    await setDoc(doc(db, 'config', 'main'), cfg, { merge: true });
    console.log(`[${section}] OK (${Object.keys(cfg).length} keys)`);
    bump(section, 'ok');
  } catch (e: any) {
    console.error(`[${section}] ERROR:`, e?.message ?? e);
    bump(section, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// PERSONAJES → personajes/{nombre}
// ─────────────────────────────────────────────────────────────
async function migratePersonajes() {
  const section = 'personajes';
  console.log(`\n[${section}] Fetching ${PILOTOS.length} pilotos…`);
  for (const name of PILOTOS) {
    try {
      const r = await sheetsGet({ jugador: name });
      if (!r || (typeof r === 'object' && Object.keys(r).length === 0)) {
        console.log(`  [${name}] vacío`);
        bump(section, 'skip');
        continue;
      }
      await setDoc(doc(db, 'personajes', name), r, { merge: true });
      console.log(`  [${name}] OK`);
      bump(section, 'ok');
    } catch (e: any) {
      console.error(`  [${name}] ERROR:`, e?.message ?? e);
      bump(section, 'err');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Genérico: endpoint que devuelve array → colección
// ─────────────────────────────────────────────────────────────
async function migrateCollection(opts: {
  section: string;
  action: string;
  arrayKey: string;         // p.ej. 'libro', 'personal'
  collectionName: string;
  idField?: string;         // default 'id'
}) {
  const { section, action, arrayKey, collectionName, idField = 'id' } = opts;
  console.log(`\n[${section}] Fetching…`);
  try {
    const r = await sheetsGet({ action });
    // Posibles shapes:
    //   { [arrayKey]: [...] }
    //   { data: { [arrayKey]: [...] } }
    //   { data: [...] }
    //   { success: true, [arrayKey]: [...] }
    //   [...]
    let arr: any = r?.[arrayKey];
    if (!Array.isArray(arr)) arr = r?.entries;       // shape común: {result, success, entries}
    if (!Array.isArray(arr)) arr = r?.data?.[arrayKey];
    if (!Array.isArray(arr)) arr = r?.data;
    if (!Array.isArray(arr) && Array.isArray(r)) arr = r;
    if (!Array.isArray(arr)) {
      console.log(`[${section}] no es array (shape: ${JSON.stringify(Object.keys(r ?? {}))})`);
      bump(section, 'skip');
      return;
    }
    if (arr.length === 0) {
      console.log(`[${section}] vacío`);
      bump(section, 'skip');
      return;
    }
    // Batches de 500 (límite Firestore)
    for (let i = 0; i < arr.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = arr.slice(i, i + 500);
      for (const item of chunk) {
        const id = String(item?.[idField] ?? '').trim() ||
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        batch.set(doc(collection(db, collectionName), id), { ...item, [idField]: id }, { merge: true });
      }
      await batch.commit();
    }
    console.log(`[${section}] OK (${arr.length} docs)`);
    bump(section, 'ok', arr.length);
  } catch (e: any) {
    console.error(`[${section}] ERROR:`, e?.message ?? e);
    bump(section, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' MIGRACIÓN Sheets → Firestore (proyecto crfm-dc873)');
  console.log('═══════════════════════════════════════════════════');

  await migrateConfig();
  await migratePersonajes();

  await migrateCollection({ section: 'personal',     action: 'getPersonal',     arrayKey: 'personal',    collectionName: 'personal' });
  await migrateCollection({ section: 'libroMayor',   action: 'getLibroMayor',   arrayKey: 'libro',       collectionName: 'libroMayor' });
  await migrateCollection({ section: 'fuerzas',      action: 'getFuerzas',      arrayKey: 'fuerzas',     collectionName: 'fuerzas' });
  await migrateCollection({ section: 'cronicas',     action: 'getCronicas',     arrayKey: 'cronicas',    collectionName: 'cronicas' });
  await migrateCollection({ section: 'ordenDia',     action: 'getOrdenDia',     arrayKey: 'ordenDia',    collectionName: 'ordenDia' });
  await migrateCollection({ section: 'parteDiario',  action: 'getParteDiario',  arrayKey: 'partes',      collectionName: 'parteDiario' });
  await migrateCollection({ section: 'historial',    action: 'getHistorial',    arrayKey: 'historial',   collectionName: 'historial' });
  await migrateCollection({ section: 'logros',       action: 'getLogros',       arrayKey: 'logros',      collectionName: 'logros' });

  console.log('\n═══════════════════════════════════════════════════');
  console.log(' RESUMEN');
  console.log('═══════════════════════════════════════════════════');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k.padEnd(15)} ok=${v.ok}  err=${v.err}  skip=${v.skip}`);
  }
  console.log('\nFinalizado.');
  process.exit(0);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
