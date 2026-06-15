#!/usr/bin/env node
/**
 * sync-solaris.cjs
 *
 * 1) Lee la carpeta de instalación de Solaris Skunk Werks (SSW).
 * 2) Copia los .ssw que no estén ya en public/assets/mechs/.
 * 3) Llama a rebuild-indexes.cjs para regenerar index.json.
 *
 * Origen configurable por env SOLARIS_DIR. Por defecto busca en
 * varias ubicaciones comunes de Windows.
 *
 * Uso:
 *   node scripts/sync-solaris.cjs
 *   SOLARIS_DIR="D:\Solaris\Saves" node scripts/sync-solaris.cjs
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'public', 'assets', 'mechs');

// ── Candidatos de origen (en orden) ────────────────────────────
function candidateSources() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const docs = path.join(home, 'Documents');
  return [
    process.env.SOLARIS_DIR,
    path.join(docs, 'Solaris Skunk Werks', 'Saves'),
    path.join(docs, 'SSW', 'Saves'),
    path.join(docs, 'SSW', 'mechs'),
    'E:\\Drive\\CBT\\SSW_0.7.4',
    'C:\\SSW\\Saves',
    'C:\\Program Files (x86)\\Solaris Skunk Werks\\Saves',
    'C:\\Program Files\\Solaris Skunk Werks\\Saves',
  ].filter(Boolean);
}

function pickSource() {
  for (const c of candidateSources()) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      return c;
    }
  }
  return null;
}

// ── Walk recursivo (Solaris a veces guarda en subcarpetas) ────
function walkSsw(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSsw(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ssw')) {
      out.push(full);
    }
  }
  return out;
}

// ── Main ──────────────────────────────────────────────────────
function main() {
  console.log('==========================================');
  console.log(' SYNC SOLARIS → public/assets/mechs');
  console.log('==========================================\n');

  const src = pickSource();
  if (!src) {
    console.error('[ERROR] No se encontró carpeta de Solaris.\n');
    console.error('Define la variable SOLARIS_DIR apuntando a la carpeta Saves de SSW.');
    console.error('Ejemplo: set SOLARIS_DIR=D:\\Solaris\\Saves\n');
    console.error('Candidatos probados:');
    for (const c of candidateSources()) console.error('  ·', c);
    process.exit(1);
  }
  console.log('Origen:  ' + src);
  console.log('Destino: ' + DEST + '\n');

  if (!fs.existsSync(DEST)) {
    console.error('[ERROR] No existe', DEST);
    process.exit(1);
  }

  // Set con nombres ya presentes en destino
  const existing = new Set(
    fs.readdirSync(DEST).filter(f => f.toLowerCase().endsWith('.ssw'))
  );

  const sourceFiles = walkSsw(src);
  console.log(`Encontrados ${sourceFiles.length} .ssw en origen, ${existing.size} ya en destino.\n`);

  let copied = 0;
  let skipped = 0;
  for (const sFile of sourceFiles) {
    const basename = path.basename(sFile);
    if (existing.has(basename)) {
      skipped++;
      continue;
    }
    fs.copyFileSync(sFile, path.join(DEST, basename));
    console.log('  + ' + basename);
    copied++;
  }

  console.log(`\nCopiados: ${copied} · ya existentes: ${skipped}`);

  if (copied === 0) {
    console.log('\nNada nuevo. Saliendo sin regenerar índice.');
    return;
  }

  console.log('\nRegenerando índices...\n');
  const res = spawnSync('node', [path.join(__dirname, 'rebuild-indexes.cjs')], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  if (res.status !== 0) {
    console.error('\n[ERROR] rebuild-indexes falló (código', res.status, ')');
    process.exit(res.status || 1);
  }
  console.log('\n[OK] Sync completado.');
}

main();
