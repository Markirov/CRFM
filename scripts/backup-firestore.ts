// ═══════════════════════════════════════════════════════════════
// backup-firestore.ts — Exporta todas las colecciones a JSON local.
//
// Uso:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\service-account.json"
//   npx tsx scripts/backup-firestore.ts
//
// Salida: backups/YYYY-MM-DD_HHmmss/<collection>.json
//
// Service account: descarga desde Firebase Console → Project Settings
// → Service Accounts → Generate new private key. NUNCA commit.
// ═══════════════════════════════════════════════════════════════

import * as admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const COLLECTIONS = [
  'config',
  'personajes',
  'personal',
  'libroMayor',
  'cronicas',
  'parteDiario',
  'movimientos',
  'hangar',
  'fuerzas',
  'ordenDia',
  'historial',
  'logros',
  'mejoras',
  'misiones',
];

function ts(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('[backup] Falta GOOGLE_APPLICATION_CREDENTIALS env var.');
    console.error('Set con: $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\service-account.json"');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'crfm-dc873',
  });

  const db = admin.firestore();
  const outDir = join('backups', ts());
  mkdirSync(outDir, { recursive: true });

  let totalDocs = 0;
  for (const col of COLLECTIONS) {
    try {
      const snap = await db.collection(col).get();
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      writeFileSync(join(outDir, `${col}.json`), JSON.stringify(docs, null, 2), 'utf8');
      console.log(`[backup] ${col}: ${docs.length} docs`);
      totalDocs += docs.length;
    } catch (e: any) {
      console.error(`[backup] ${col}: ERROR — ${e?.message ?? e}`);
    }
  }

  console.log(`\n[backup] Total: ${totalDocs} docs en ${outDir}`);
  process.exit(0);
}

main().catch(e => {
  console.error('[backup] fallo:', e);
  process.exit(1);
});
