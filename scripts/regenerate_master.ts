import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MECH_WEAPON_DB, WEAPONS_MIN_EMBEDDED } from '../src/lib/weapons.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEST_DIR = path.join(__dirname, '../data/rules/armas');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

['energia', 'balisticas', 'misiles', 'equipo', 'municion', 'clan'].forEach(d => ensureDir(path.join(DEST_DIR, d)));

// Load the text file
const categorizedData = fs.readFileSync(path.join(__dirname, '../scratch/weapons_categorized.txt'), 'utf-8');

interface RawEntry {
  rawName: string;
  count: number;
  section: string;
}

const entries: RawEntry[] = [];
let currentSection = '';

for (const line of categorizedData.split('\n')) {
  const t = line.trim();
  if (t.startsWith('=== ')) {
    currentSection = t.replace(/=== |\(\d+\) ===/g, '').trim();
    continue;
  }
  if (!t) continue;
  
  // Format: (IS) Medium Laser  [2336]
  const match = t.match(/^(.*?)\[(\d+)\]$/);
  if (match) {
    let name = match[1].trim();
    // Strip (R)
    if (name.startsWith('(R) ')) {
      name = name.substring(4).trim();
    }
    entries.push({ rawName: name, count: parseInt(match[2]), section: currentSection });
  }
}

// Sort by count desc
entries.sort((a, b) => b.count - a.count);

// Canonical map
const canonMap = new Map<string, any>();

function getBaseName(name: string) {
  return name.replace(/\(CL\)|\(IS\)|@/g, '').trim();
}

function fetchStats(rawName: string) {
  let stats = WEAPONS_MIN_EMBEDDED[rawName] || MECH_WEAPON_DB[rawName];
  if (!stats) {
    const base = getBaseName(rawName);
    stats = WEAPONS_MIN_EMBEDDED[base] || MECH_WEAPON_DB[base] || WEAPONS_MIN_EMBEDDED[`(IS) ${base}`] || MECH_WEAPON_DB[`IS${base.replace(/ /g, '')}`];
  }
  return stats || null;
}

for (const e of entries) {
  // Deduplicate and process
  const rawName = e.rawName;
  const isAmmo = e.section === 'AMMO' || rawName.includes('@');
  const isEquip = e.section === 'EQUIPMENT';
  const isPhysical = e.section === 'PHYSICAL';
  
  let techBase = 'Mixed';
  if (rawName.includes('(CL)')) techBase = 'Clan';
  if (rawName.includes('(IS)')) techBase = 'Inner Sphere';

  const baseName = getBaseName(rawName);
  
  let mapKey = baseName; // Group by base name
  
  // If weapon, check stats to see if IS/Clan differ
  let stats = null;
  if (!isAmmo && !isEquip && !isPhysical) {
    stats = fetchStats(rawName);
    if (stats) {
      // If tech base matters, check if we need separate keys
      // (For this simple iteration, we'll prefix mapKey with techbase if stats exist to keep them separate, 
      // but if both exist and are identical we'd merge them. For now, let's keep Clan/IS separate unless missing).
      mapKey = `${techBase}_${baseName}`;
    }
  } else {
    // Ammo / Equip
    mapKey = `${e.section}_${rawName}`;
  }

  if (!canonMap.has(mapKey)) {
    let heat = 0, damage = "0", s = 0, m = 0, l = 0;
    if (stats) {
      if (stats.Heat !== undefined) {
        heat = parseInt(stats.Heat) || 0;
        damage = String(stats.DamSht);
        s = parseInt(stats.RngSht) || 0;
        m = parseInt(stats.RngMed) || 0;
        l = parseInt(stats.RngLng) || 0;
      } else {
        heat = parseInt(stats.h) || 0;
        damage = String(stats.dm);
        const ranges = stats.r ? stats.r.split('/') : ['0','0','0'];
        s = parseInt(ranges[0]) || 0;
        m = parseInt(ranges[1]) || 0;
        l = parseInt(ranges[2]) || 0;
      }
    }

    let category = "Equipment";
    if (isAmmo) category = "Ammo";
    else if (isPhysical) category = "Physical";
    else if (baseName.includes('Laser') || baseName.includes('PPC') || baseName.includes('Flamer')) category = "Energy";
    else if (baseName.includes('AC') || baseName.includes('Autocannon') || baseName.includes('Gauss') || baseName.includes('Machine Gun')) category = "Ballistic";
    else if (baseName.includes('LRM') || baseName.includes('SRM') || baseName.includes('ATM')) category = "Missile";

    canonMap.set(mapKey, {
      item: isAmmo ? rawName : baseName,
      aliases: [rawName],
      tech_base: techBase,
      category: category,
      manual_type: isEquip ? "E" : (isAmmo ? "Ammo" : "Weapon"),
      heat: heat,
      damage: damage,
      min_range: 0,
      short_range: s,
      medium_range: m,
      long_range: l,
      has_ammo: isAmmo ? false : (baseName.includes('AC') || baseName.includes('LRM') || baseName.includes('SRM') || baseName.includes('Gauss')),
      ammo_per_ton: null,
      is_cluster: damage.includes('/m') || baseName.includes('LB') || baseName.includes('ATM'),
      special_hooks: [],
      house_rules: {},
      notes: "",
      enrichment_level: stats ? 'minimal' : 'missing_stats',
      source: 'weapons_categorized.txt',
      frequency: e.count
    });
  } else {
    const entry = canonMap.get(mapKey);
    if (!entry.aliases.includes(rawName)) {
      entry.aliases.push(rawName);
    }
    entry.frequency += e.count;
  }
}

// Convert to array and sort by frequency desc
const finalArray = Array.from(canonMap.values()).sort((a, b) => b.frequency - a.frequency);

fs.writeFileSync(path.join(DEST_DIR, 'weapons_master_draft.json'), JSON.stringify(finalArray, null, 2), 'utf-8');
console.log(`Generated weapons_master_draft.json with ${finalArray.length} unified entries!`);
