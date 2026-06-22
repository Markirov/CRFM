import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load weapons.ts
import { MECH_WEAPON_DB, WEAPONS_MIN_EMBEDDED, MECH_AMMO_PER_TON } from '../src/lib/weapons.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEST_DIR = path.join(__dirname, '../data/rules/armas');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Ensure category directories
const dirs = ['energia', 'balisticas', 'misiles', 'equipo', 'fisico'];
dirs.forEach(d => ensureDir(path.join(DEST_DIR, d)));

const masterMap = new Map<string, any>();

// Helper to normalize names for grouping
function normalizeName(name: string) {
  let n = name.replace(/\(CL\)|\(IS\)/g, '').trim();
  // Expand abbreviations
  n = n.replace(/\bMed\b/g, 'Medium')
       .replace(/\bLrg\b/g, 'Large')
       .replace(/\bSm\b/g, 'Small');
  return n;
}

function determineCategoryAndType(name: string, dm: string, r: string) {
  const n = name.toLowerCase();
  if (n.includes('laser') || n.includes('ppc') || n.includes('flamer') || n.includes('plasma')) {
    return { category: 'Energy', type: n.includes('pulse') ? 'P' : 'DE' };
  }
  if (n.includes('ac') || n.includes('autocannon') || n.includes('gauss') || n.includes('machine gun') || n.includes('mg')) {
    return { category: 'Ballistic', type: 'DB' };
  }
  if (n.includes('lrm') || n.includes('srm') || n.includes('mrm') || n.includes('atm') || n.includes('narc')) {
    return { category: 'Missile', type: 'M' };
  }
  if (n.includes('tag') || n.includes('c3') || n.includes('ams') || n.includes('ecm') || n.includes('probe')) {
    return { category: 'Equipment', type: 'E' };
  }
  return { category: 'Equipment', type: '?' };
}

function getTechBase(alias: string, name: string) {
  if (alias.startsWith('CL') || name.includes('(CL)')) return 'Clan';
  if (alias.startsWith('IS') || name.includes('(IS)')) return 'Inner Sphere';
  return 'Mixed'; 
}

// 1. Process WEAPONS_MIN_EMBEDDED
for (const [key, data] of Object.entries(WEAPONS_MIN_EMBEDDED)) {
  const tb = getTechBase(key, key);
  const nName = normalizeName(key);
  const mapKey = `${tb}_${nName}`;
  
  const { category, type } = determineCategoryAndType(nName, '', '');
  
  masterMap.set(mapKey, {
    item: nName,
    aliases: [key],
    tech_base: tb,
    category,
    manual_type: type,
    heat: parseInt(data.Heat as any) || 0,
    damage: String(data.DamSht),
    min_range: 0,
    short_range: parseInt(data.RngSht as any) || 0,
    medium_range: parseInt(data.RngMed as any) || 0,
    long_range: parseInt(data.RngLng as any) || 0,
    has_ammo: !!data.HasAmmo,
    ammo_per_ton: null,
    is_cluster: !!data.IsCluster,
    special_hooks: [],
    house_rules: {},
    notes: "",
    enrichment_level: 'minimal',
    source: 'weapons.ts (MIN_EMBEDDED)'
  });
}

// 2. Process MECH_WEAPON_DB
for (const [alias, data] of Object.entries(MECH_WEAPON_DB)) {
  const tb = getTechBase(alias, data.d);
  const nName = normalizeName(data.d);
  const mapKey = `${tb}_${nName}`;
  
  let entry = masterMap.get(mapKey);
  if (!entry) {
    const { category, type } = determineCategoryAndType(nName, data.dm, data.r);
    const ranges = data.r.split('/').map((x: string) => parseInt(x) || 0);
    
    entry = {
      item: nName,
      aliases: [],
      tech_base: tb,
      category,
      manual_type: type,
      heat: parseInt(data.h as any) || 0,
      damage: String(data.dm),
      min_range: 0,
      short_range: ranges[0] || 0,
      medium_range: ranges[1] || 0,
      long_range: ranges[2] || 0,
      has_ammo: false,
      ammo_per_ton: null,
      is_cluster: data.dm.includes('/m'),
      special_hooks: [],
      house_rules: {},
      notes: "",
      enrichment_level: 'minimal',
      source: 'weapons.ts (MECH_WEAPON_DB)'
    };
    masterMap.set(mapKey, entry);
  }
  
  if (!entry.aliases.includes(alias)) {
    entry.aliases.push(alias);
  }
  if (MECH_AMMO_PER_TON[nName] || MECH_AMMO_PER_TON[alias]) {
    entry.has_ammo = true;
    entry.ammo_per_ton = MECH_AMMO_PER_TON[nName] || MECH_AMMO_PER_TON[alias];
  }
}

// Fill auto hooks
for (const entry of masterMap.values()) {
  if (MECH_AMMO_PER_TON[entry.item]) {
    entry.has_ammo = true;
    entry.ammo_per_ton = MECH_AMMO_PER_TON[entry.item];
  }
  if (entry.manual_type === 'P') entry.special_hooks.push({ kind: 'pulse_mod', value: -2 });
  if (entry.item.toLowerCase().includes('flamer')) entry.special_hooks.push({ kind: 'flamer_dual' });
  if (entry.item.toLowerCase().includes('gauss')) entry.special_hooks.push({ kind: 'gauss_explosion' });
  if (entry.item.toLowerCase().includes('ultra')) entry.special_hooks.push({ kind: 'ultra_jam' });
}

// Group into output files
const outFiles: Record<string, any[]> = {};

function addToFile(dir: string, filename: string, entry: any) {
  const isClan = entry.tech_base === 'Clan';
  const prefix = isClan ? 'clan/' : '';
  const fullPath = `${prefix}${dir}/${filename}.json`;
  if (!outFiles[fullPath]) outFiles[fullPath] = [];
  outFiles[fullPath].push(entry);
}

for (const entry of masterMap.values()) {
  const t = entry.item.toLowerCase();
  const cat = entry.category;
  
  if (cat === 'Energy') {
    if (t.includes('laser')) addToFile('energia', 'laseres', entry);
    else if (t.includes('ppc')) addToFile('energia', 'ppc', entry);
    else if (t.includes('flamer')) addToFile('energia', 'flamer', entry);
    else addToFile('energia', 'misc_energia', entry);
  } else if (cat === 'Ballistic') {
    if (t.includes('gauss')) addToFile('balisticas', 'gauss', entry);
    else if (t.includes('machine gun') || t.includes('mg')) addToFile('balisticas', 'mg', entry);
    else addToFile('balisticas', 'autocannons', entry);
  } else if (cat === 'Missile') {
    if (t.includes('lrm')) addToFile('misiles', 'lrm', entry);
    else if (t.includes('srm') || t.includes('streak')) addToFile('misiles', 'srm', entry);
    else addToFile('misiles', 'misc_misiles', entry);
  } else {
    addToFile('equipo', 'misc', entry);
  }
}

['energia', 'balisticas', 'misiles', 'equipo'].forEach(d => {
  ensureDir(path.join(DEST_DIR, 'clan', d));
});

for (const [filename, arr] of Object.entries(outFiles)) {
  if (arr.length > 0) {
    fs.writeFileSync(path.join(DEST_DIR, filename), JSON.stringify(arr, null, 2), 'utf-8');
    console.log(`Generated ${filename} con ${arr.length} armas.`);
  }
}

console.log(`\n¡Éxito! Total de armas únicas procesadas: ${masterMap.size}`);
