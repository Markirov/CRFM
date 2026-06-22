import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'data/rules/ssw/equipment');
const DEST_DIR = path.join(process.cwd(), 'data/rules/armas');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

['energia', 'balisticas', 'misiles', 'fisicas', 'equipo', 'municion', 'artilleria'].forEach(d => ensureDir(path.join(DEST_DIR, d)));

// Load all SSW data
const weapons = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'weapons.json'), 'utf-8'));
const equipment = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'equipment.json'), 'utf-8'));
const ammo = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'ammunition.json'), 'utf-8'));
const physicals = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'physicals.json'), 'utf-8'));

const db: any[] = [];

function getTechBaseStr(tb: number) {
  if (tb === 0) return 'Inner Sphere';
  if (tb === 1) return 'Clan';
  return 'Mixed';
}

function processGroup(group: any, baseCategory: string, isAmmo = false, isEquip = false, isPhys = false) {
  for (const key of Object.keys(group)) {
    const raw = group[key];
    
    // Build aliases array uniquely
    const aliasesSet = new Set<string>();
    if (raw.LookupName) aliasesSet.add(raw.LookupName);
    if (raw.MegaMekName) aliasesSet.add(raw.MegaMekName);
    if (raw.ChatName) aliasesSet.add(raw.ChatName);
    if (raw.CritName) aliasesSet.add(raw.CritName);
    if (key) aliasesSet.add(key);

    let category = baseCategory;
    if (raw.type === 'LASER' || raw.type === 'PPC' || raw.type === 'FLAMER' || raw.type === 'ENERGY') category = 'Energy';
    if (raw.type === 'AUTOCANNON' || raw.type === 'GAUSS' || raw.type === 'MACHINE_GUN' || raw.type === 'BALLISTIC' || raw.type === 'RIFLE') category = 'Ballistic';
    if (raw.type === 'MISSILE' || raw.type === 'LRM' || raw.type === 'SRM' || raw.type === 'ATM' || raw.type === 'MML' || raw.type === 'MRM' || raw.type === 'ROCKET_LAUNCHER' || raw.type === 'TORPEDO') category = 'Missile';
    if (raw.type === 'ARTILLERY') category = 'Artillery';
    
    if (isAmmo) category = 'Ammo';
    if (isPhys) category = 'Physical';
    if (isEquip) category = 'Equipment';

    const entry = {
      item: raw.ActualName || raw.CritName || key,
      aliases: Array.from(aliasesSet),
      tech_base: getTechBaseStr(raw.Availability?.TechBase ?? 2),
      category: category,
      manual_type: raw.Type || (isEquip ? 'E' : 'Weapon'),
      heat: raw.Heat || 0,
      damage: raw.DamSht ? String(raw.DamSht) : (raw.Damage ? String(raw.Damage) : '0'),
      min_range: raw.RngMin || 0,
      short_range: raw.RngSht || 0,
      medium_range: raw.RngMed || 0,
      long_range: raw.RngLng || 0,
      has_ammo: !!raw.HasAmmo,
      ammo_per_ton: raw.AmmoLotSize || null,
      is_cluster: !!raw.IsCluster,
      cost: raw.Cost || 0,
      tonnage: raw.Tonnage || 0,
      battle_value: raw.OffBV || raw.DefBV || raw.BV || 0,
      special_hooks: [],
      house_rules: {
        custom_to_hit_modifier: { active: false, value: 0, notes: "" }
      },
      notes: raw.BookReference ? `Source: ${raw.BookReference}` : '',
      source: 'SSW JSON Export'
    };
    db.push(entry);
  }
}

console.log('Parsing SSW files...');
processGroup(weapons, 'Weapon');
processGroup(equipment, 'Equipment', false, true, false);
processGroup(physicals, 'Physical', false, false, true);
processGroup(ammo, 'Ammo', true, false, false);

console.log(`Parsed ${db.length} total entries.`);

// Split them by category and write
const files = {
  'energia/laseres.json': db.filter(w => w.category === 'Energy'),
  'balisticas/autocanones.json': db.filter(w => w.category === 'Ballistic'),
  'misiles/lanzadores.json': db.filter(w => w.category === 'Missile'),
  'artilleria/canones.json': db.filter(w => w.category === 'Artillery'),
  'fisicas/melee.json': db.filter(w => w.category === 'Physical'),
  'equipo/general.json': db.filter(w => w.category === 'Equipment' && !w.item.includes('CASE')),
  'equipo/municion.json': db.filter(w => w.category === 'Ammo'),
  'equipo/internos.json': db.filter(w => w.item.includes('CASE'))
};

for (const [relPath, entries] of Object.entries(files)) {
  const fullPath = path.join(DEST_DIR, relPath);
  // Optional: write a small wrapper if needed, or just dump the array
  fs.writeFileSync(fullPath, JSON.stringify(entries, null, 2), 'utf-8');
}

console.log('Modular files generated successfully in data/rules/armas/');
