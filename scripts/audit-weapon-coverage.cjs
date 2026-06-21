#!/usr/bin/env node
/**
 * Auditoría cobertura SSW canon vs catálogo de mechs.
 *
 * Recorre todos los .ssw en public/assets/mechs, extrae cada <name> dentro de
 * <equipment>, normaliza prefijos (R)/(T) y entidades HTML, y cruza con la BD
 * canon en data/rules/ssw/equipment/.
 *
 * Output:
 *   - total únicos en catálogo
 *   - matched / unmatched
 *   - top 30 unmatched con frecuencia
 *   - exit 0 si cobertura ≥ threshold (default 95%), 1 si menos.
 *
 * Uso:
 *   node scripts/audit-weapon-coverage.cjs
 *   node scripts/audit-weapon-coverage.cjs --threshold=98
 *   node scripts/audit-weapon-coverage.cjs --verbose
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MECH_DIR = path.join(ROOT, 'public/assets/mechs');
const SSW_DIR = path.join(ROOT, 'data/rules/ssw/equipment');

const args = process.argv.slice(2);
const threshold = parseFloat(
  (args.find(a => a.startsWith('--threshold=')) || '--threshold=95').split('=')[1]
);
const verbose = args.includes('--verbose');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function normalize(name) {
  return name
    .replace(/^\(R\)\s*/, '')
    .replace(/^\(T\)\s*/, '')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function buildAliases(entry) {
  const out = new Set();
  for (const k of ['LookupName', 'ActualName', 'MegaMekName', 'ChatName', 'CritName']) {
    if (entry[k]) out.add(entry[k]);
  }
  return out;
}

// ── Carga canon ──────────────────────────────────────────────
console.log('Cargando canon SSW…');
const weapons = loadJson(path.join(SSW_DIR, 'weapons.json'));
const equipment = loadJson(path.join(SSW_DIR, 'equipment.json'));
const ammo = loadJson(path.join(SSW_DIR, 'ammunition.json'));
const physicals = loadJson(path.join(SSW_DIR, 'physicals.json'));

const lookupSet = new Set();
const aliasSet = new Set();
for (const dict of [weapons, equipment, ammo, physicals]) {
  for (const [k, v] of Object.entries(dict)) {
    lookupSet.add(k);
    for (const a of buildAliases(v)) aliasSet.add(a);
  }
}

// Componentes estructurales (CASE, TC, MG Array, etc.) — parseamos manualmente
// la tabla de src/lib/components-canon.ts para cubrir items que SSW define en
// Java source, no en JSON.
const componentsTxt = fs.readFileSync(path.join(ROOT, 'src/lib/components-canon.ts'), 'utf8');
const compLookups = [...componentsTxt.matchAll(/lookupName:\s*'([^']+)'/g)].map(m => m[1]);
const compAliases = [...componentsTxt.matchAll(/aliases:\s*\[([^\]]+)\]/g)]
  .flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
for (const k of compLookups) lookupSet.add(k);
for (const k of compAliases) aliasSet.add(k);

console.log(
  `Canon cargado: ${Object.keys(weapons).length} weapons + ${Object.keys(equipment).length} equipment + ` +
  `${Object.keys(ammo).length} ammo + ${Object.keys(physicals).length} physicals + ${compLookups.length} components.`
);
console.log(`Total únicos lookup: ${lookupSet.size}. Total aliases: ${aliasSet.size}.`);

// ── Scan catálogo .ssw ───────────────────────────────────────
console.log(`\nEscaneando catálogo en ${MECH_DIR}…`);
if (!fs.existsSync(MECH_DIR)) {
  console.error(`✗ Carpeta no existe: ${MECH_DIR}`);
  process.exit(2);
}

const files = fs.readdirSync(MECH_DIR).filter(f => f.endsWith('.ssw'));
const usage = new Map();    // normalized → { count, sources: Set<file>, raw: Set<original> }
let totalInstances = 0;

for (const f of files) {
  const txt = fs.readFileSync(path.join(MECH_DIR, f), 'utf8');
  const blocks = txt.match(/<equipment>[\s\S]*?<\/equipment>/g) || [];
  for (const block of blocks) {
    const m = block.match(/<name[^>]*>([^<]+)<\/name>/);
    if (!m) continue;
    totalInstances++;
    const raw = m[1].trim();
    const norm = normalize(raw);
    if (!usage.has(norm)) usage.set(norm, { count: 0, sources: new Set(), raw: new Set() });
    const u = usage.get(norm);
    u.count++;
    u.sources.add(f);
    u.raw.add(raw);
  }
}

console.log(`Archivos escaneados: ${files.length}. Instancias equipo: ${totalInstances}. Únicos: ${usage.size}.`);

// ── Cross-check ──────────────────────────────────────────────
const matched = [];
const unmatched = [];
for (const [norm, info] of usage) {
  if (lookupSet.has(norm) || aliasSet.has(norm)) {
    matched.push({ name: norm, ...info });
  } else {
    unmatched.push({ name: norm, ...info });
  }
}

matched.sort((a, b) => b.count - a.count);
unmatched.sort((a, b) => b.count - a.count);

const coverageUniques = (matched.length / usage.size) * 100;
const matchedInstances = matched.reduce((s, x) => s + x.count, 0);
const coverageInstances = (matchedInstances / totalInstances) * 100;

console.log('\n══════════════════════════════════════════════════════════════');
console.log('RESULTADO');
console.log('══════════════════════════════════════════════════════════════');
console.log(`Únicos matched:     ${matched.length} / ${usage.size}  (${coverageUniques.toFixed(2)}%)`);
console.log(`Instancias matched: ${matchedInstances} / ${totalInstances}  (${coverageInstances.toFixed(2)}%)`);
console.log(`Threshold target:   ${threshold}%`);

if (unmatched.length) {
  console.log(`\n─── Top ${Math.min(30, unmatched.length)} UNMATCHED (por frecuencia) ───`);
  for (const u of unmatched.slice(0, 30)) {
    const sample = [...u.raw][0];
    console.log(`  ${String(u.count).padStart(5)}  ${u.name}${sample !== u.name ? `  (raw: ${sample})` : ''}`);
  }
  if (verbose) {
    console.log(`\n─── Full unmatched (${unmatched.length}) ───`);
    for (const u of unmatched) {
      console.log(`  ${String(u.count).padStart(5)}  ${u.name}`);
    }
  }
} else {
  console.log('\n✓ Cobertura 100%. Cero unmatched.');
}

// ── Exit ─────────────────────────────────────────────────────
const pass = coverageInstances >= threshold;
console.log(`\n${pass ? '✓ PASS' : '✗ FAIL'}: cobertura instancias ${coverageInstances.toFixed(2)}% vs threshold ${threshold}%.`);
process.exit(pass ? 0 : 1);
