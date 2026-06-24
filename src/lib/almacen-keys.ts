/**
 * almacen-keys.ts
 * ───────────────
 * Funciones para generar claves canónicas del almacén,
 * migrar claves legacy, y buscar stock de munición.
 */

import type { AmmoBin } from './combat-types';

/* ═══════════════════════════════════════════════════════════════
   7. familyKeyNormalize
   ─────────────────────────────────────────────────────────────── */

const FAMILY_MAP: Record<string, string> = {
  lrm:    'LRM',
  lrm5:   'LRM',
  lrm10:  'LRM',
  lrm15:  'LRM',
  lrm20:  'LRM',
  srm:    'SRM',
  srm2:   'SRM',
  srm4:   'SRM',
  srm6:   'SRM',
  ac2:    'AC/2',
  ac5:    'AC/5',
  ac10:   'AC/10',
  ac20:   'AC/20',
  mg:     'MG',
  gauss:  'Gauss',
  lbx10:  'LB 10-X',
  uac5:   'UAC/5',
};

/**
 * Normaliza familyKey del simulador a su forma canónica de display.
 *
 * `'lrm'` → `'LRM'`, `'ac5'` → `'AC/5'`, `'lbx10'` → `'LB 10-X'`, etc.
 */
export function familyKeyNormalize(raw: string): string {
  if (!raw) return 'UNKNOWN';
  // El sim usa formato `tech:er:family` (ej `IS:STD:LRM-15`). Extrae cola.
  const tail = raw.includes(':') ? raw.split(':').pop()! : raw;
  // Normaliza: lowercase + quita guiones/espacios/barras/underscores
  const lower = tail.toLowerCase().replace(/[-\s/_]/g, '');
  // 1. Match directo en map
  if (FAMILY_MAP[lower]) return FAMILY_MAP[lower];
  // 2. Detección por substring (cubre LRM-15, LRM 15, lrm_15, etc.)
  if (lower.startsWith('lrm')) return 'LRM';
  if (lower.startsWith('srm')) return 'SRM';
  if (lower.startsWith('mrm')) return 'MRM';
  if (lower.startsWith('lbx') || lower.startsWith('lb')) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `LB ${num}-X` : 'LB-X';
  }
  if (lower.startsWith('uac')) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `UAC/${num}` : 'UAC';
  }
  if (lower.startsWith('rac')) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `RAC/${num}` : 'RAC';
  }
  if (lower.startsWith('ac')) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `AC/${num}` : 'AC';
  }
  if (lower.startsWith('atm')) return 'ATM';
  if (lower.startsWith('streak')) return 'Streak SRM';
  if (lower.startsWith('narc')) return 'NARC';
  if (lower === 'mg' || lower.startsWith('machinegun')) return 'MG';
  if (lower.startsWith('gauss')) return 'Gauss';
  if (lower.startsWith('arrow')) return 'Arrow IV';
  if (lower.startsWith('rocket')) return 'Rocket Launcher';
  if (lower.startsWith('thunderbolt')) return 'Thunderbolt';
  return raw.toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════
   1. ammoKeyFromBin
   ─────────────────────────────────────────────────────────────── */

/**
 * Genera la clave canónica del almacén para un bin de munición.
 *
 * Formato: `Ammo_<FAMILY>_<VARIANT>`
 *
 * @example ammoKeyFromBin({ familyKey: 'lrm', variant: 'Standard', ... })
 *          // → 'Ammo_LRM_Standard'
 * @example ammoKeyFromBin({ familyKey: 'ac5', variant: 'Armor-Piercing', ... })
 *          // → 'Ammo_AC/5_Armor-Piercing'
 */
export function ammoKeyFromBin(bin: AmmoBin): string {
  const family = familyKeyNormalize(bin.familyKey || bin.family || '');
  // Cubre null/undefined/empty string
  const variant = (bin.variant && bin.variant.trim()) ? bin.variant : 'Standard';
  return `Ammo_${family}_${variant}`;
}

/* ═══════════════════════════════════════════════════════════════
   2. armorKey
   ─────────────────────────────────────────────────────────────── */

/**
 * Genera clave canónica para blindaje.
 *
 * @example armorKey('Standard')       // → 'Armor_Standard'
 * @example armorKey('Ferro-Fibrous')  // → 'Armor_Ferro-Fibrous'
 */
export function armorKey(armorType?: string): string {
  return `Armor_${armorType ?? 'Standard'}`;
}

/* ───────────────────────────────────────────────
   armor chassis lock (Sprint Integración Tarea 6)
   ──────────────────────────────────────────────
   Blindaje INSTALADO en un mech no se trasvasa entre chasis distintos.
   Sólo entre variantes del mismo chasis (Griffin 1S → Griffin 1N OK,
   Griffin → Crusader NO).

   Convención: el "chasis" es el nombre base del mech (Griffin, Crusader,
   Atlas, etc.). El "model" es la variante (1S, 1N, GHR-3K, etc.).
   Comparar por chasis (NO por full name).
   ─────────────────────────────────────────────── */

/** True si blindaje instalado en `fromChassis` se puede mover a `toChassis`. */
export function canTransferArmor(fromChassis: string, toChassis: string): boolean {
  if (!fromChassis || !toChassis) return false;
  return fromChassis.trim().toLowerCase() === toChassis.trim().toLowerCase();
}

/** Normaliza nombre chasis para keys (lowercase, sin espacios extras). */
export function normalizeChassis(chassis: string): string {
  return chassis.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Clave canónica para blindaje chassis-locked.
 * Usado cuando se canibaliza armor de un mech destruido — el armor queda
 * vinculado al chasis y sólo puede reinstalarse en otro mech del mismo chasis.
 *
 * @example chassisArmorKey('Griffin', 'Standard')      // → 'ArmorChassis_griffin_Standard'
 * @example chassisArmorKey('Crusader', 'Ferro-Fibrous')// → 'ArmorChassis_crusader_Ferro-Fibrous'
 */
export function chassisArmorKey(chassis: string, armorType?: string): string {
  return `ArmorChassis_${normalizeChassis(chassis)}_${armorType ?? 'Standard'}`;
}

/**
 * Suma blindaje disponible para reparar mech del chasis dado.
 * Combina pool global (`Armor_<type>`) + pool chasis-locked
 * (`ArmorChassis_<chasis>_<type>`).
 */
export function getAvailableArmor(
  almacen: Record<string, number>,
  chassis: string,
  armorType: string = 'Standard',
): { global: number; chassisLocked: number; total: number } {
  const global = almacen[armorKey(armorType)] ?? 0;
  const chassisLocked = almacen[chassisArmorKey(chassis, armorType)] ?? 0;
  return { global, chassisLocked, total: global + chassisLocked };
}

/**
 * Consume puntos de blindaje del almacén para reparar mech del chasis dado.
 * Prefiere pool chasis-locked primero (canibalizado), luego global.
 * Devuelve nuevo almacén + puntos efectivamente consumidos.
 */
export function consumeArmor(
  almacen: Record<string, number>,
  chassis: string,
  armorType: string,
  points: number,
): { newAlmacen: Record<string, number>; consumed: number; missing: number } {
  const next = { ...almacen };
  const chKey = chassisArmorKey(chassis, armorType);
  const gKey = armorKey(armorType);
  let remaining = Math.max(0, Math.floor(points));

  const fromChassis = Math.min(remaining, next[chKey] ?? 0);
  if (fromChassis > 0) {
    next[chKey] = (next[chKey] ?? 0) - fromChassis;
    remaining -= fromChassis;
  }

  const fromGlobal = Math.min(remaining, next[gKey] ?? 0);
  if (fromGlobal > 0) {
    next[gKey] = (next[gKey] ?? 0) - fromGlobal;
    remaining -= fromGlobal;
  }

  return {
    newAlmacen: next,
    consumed: fromChassis + fromGlobal,
    missing: remaining,
  };
}

/**
 * Devuelve puntos de blindaje al pool chasis-locked (canibalización).
 * Usado al desinstalar armor de un mech destruido del chasis dado.
 */
export function depositChassisArmor(
  almacen: Record<string, number>,
  chassis: string,
  armorType: string,
  points: number,
): Record<string, number> {
  const next = { ...almacen };
  const key = chassisArmorKey(chassis, armorType);
  next[key] = (next[key] ?? 0) + Math.max(0, Math.floor(points));
  return next;
}

/* ═══════════════════════════════════════════════════════════════
   2b. equipmentKey — tech split granularidad
   ───────────────────────────────────────────────────────────────
   Equipo de Mech (armas, equipo no-ammo) se separa por tech base
   en el almacén porque cambia stats Y coste:

     "Medium Laser (IS)"  ≠  "Medium Laser (CL)"

   Esto permite contabilizar stocks/precios distintos sin
   colisiones cuando un mech mixto monta variantes Clan/IS.
   ─────────────────────────────────────────────────────────────── */

export type EquipTech = 'IS' | 'CL' | 'Any';

/** Genera key tech-split. `tech='Any'` deja el nombre sin sufijo (compat). */
export function equipmentKey(name: string, tech: EquipTech = 'Any'): string {
  const clean = (name || '').trim();
  if (!clean) return '';
  // Si ya viene con sufijo (IS)/(CL), respetar tal cual
  if (/\((IS|CL)\)\s*$/i.test(clean)) return clean;
  if (tech === 'Any') return clean;
  return `${clean} (${tech})`;
}

/** Parsea key tech-split de vuelta a {name, tech}. */
export function parseEquipmentKey(key: string): { name: string; tech: EquipTech } {
  const m = /^(.+?)\s*\((IS|CL)\)\s*$/i.exec(key || '');
  if (m) return { name: m[1].trim(), tech: (m[2].toUpperCase() as 'IS' | 'CL') };
  return { name: (key || '').trim(), tech: 'Any' };
}

/**
 * Predicado de búsqueda. Empareja una key del almacén contra una query
 * que puede ser nombre original (EN) o traducido (ES). El caller pasa
 * una tabla opcional de aliases ES→EN para soporte ES.
 *
 * @example equipmentMatchesQuery('Medium Laser (IS)', 'láser', {'láser':'laser'})
 *          // → true
 */
export function equipmentMatchesQuery(
  key: string,
  rawQuery: string,
  aliases?: Record<string, string>,
): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const k = (key || '').toLowerCase();
  if (k.includes(q)) return true;
  // Substituye términos ES→EN y reintenta
  if (aliases) {
    let qEn = q;
    for (const [es, en] of Object.entries(aliases)) {
      qEn = qEn.replace(es.toLowerCase(), en.toLowerCase());
    }
    if (qEn !== q && k.includes(qEn)) return true;
  }
  return false;
}

/** Alias mínimo ES→EN para búsqueda. El caller puede ampliar. */
export const EQUIPMENT_ALIAS_ES_EN: Record<string, string> = {
  'láser':       'laser',
  'laser':       'laser',
  'medio':       'medium',
  'pequeño':     'small',
  'grande':      'large',
  'pesado':      'heavy',
  'ligero':      'light',
  'autocañón':   'autocannon',
  'autocannon':  'autocannon',
  'misil':       'missile',
  'pulso':       'pulse',
  'gauss':       'gauss',
  'lanzallamas': 'flamer',
  'ametralladora': 'machine gun',
  'mg':          'machine gun',
  'ppc':         'ppc',
  'cañón':       'cannon',
  'cohete':      'rocket',
  'lrm':         'lrm',
  'srm':         'srm',
};

/* ═══════════════════════════════════════════════════════════════
   3. roundsPerShot
   ─────────────────────────────────────────────────────────────── */

const ROUNDS_MAP: Record<string, number> = {
  lrm5:  5,
  lrm10: 10,
  lrm15: 15,
  lrm20: 20,
  srm2:  2,
  srm4:  4,
  srm6:  6,
  ac2:   1,
  ac5:   1,
  ac10:  1,
  ac20:  1,
  mg:    1,
  gauss: 1,
};

/**
 * Cuántos misiles/proyectiles consume un disparo para la familyKey dada.
 *
 * @example roundsPerShot('lrm15') // → 15
 * @example roundsPerShot('ac5')   // → 1
 */
export function roundsPerShot(familyKey: string): number {
  if (!familyKey) return 1;
  // El sim usa `tech:er:family` (ej `IS:STD:LRM-15`). Extrae tail.
  const tail = familyKey.includes(':') ? familyKey.split(':').pop()! : familyKey;
  const key = tail.toLowerCase().replace(/[-\s/_]/g, '');
  if (ROUNDS_MAP[key] !== undefined) return ROUNDS_MAP[key];
  // Match permisivo per family + número
  const match = key.match(/^(lrm|srm|mrm|ac|mg|gauss)(\d+)?$/);
  if (match) {
    const fam = match[1];
    const num = match[2];
    const combined = `${fam}${num ?? ''}`;
    if (ROUNDS_MAP[combined] !== undefined) return ROUNDS_MAP[combined];
    // Para LRM/SRM/MRM sin sufijo num → usar fallback canónico (rack size)
    if (fam === 'lrm' || fam === 'srm' || fam === 'mrm') return num ? parseInt(num) : 1;
  }
  return 1;
}

/* ═══════════════════════════════════════════════════════════════
   4. roundsToFullRounds
   ─────────────────────────────────────────────────────────────── */

/**
 * Redondea hacia abajo a rondas completas.
 *
 * Si faltan 18 misiles de LRM-15, devuelve 15 (1 ronda completa × 15).
 *
 * @example roundsToFullRounds(18, 'lrm15') // → 15
 * @example roundsToFullRounds(3, 'srm4')   // → 0
 */
export function roundsToFullRounds(roundsMissing: number, familyKey: string): number {
  const rps = roundsPerShot(familyKey);
  return Math.floor(roundsMissing / rps) * rps;
}

/* ═══════════════════════════════════════════════════════════════
   5. migrateAlmacenKeys
   ─────────────────────────────────────────────────────────────── */

/**
 * Patrones legacy → clave nueva.
 *
 * `'Ammo (LRM)'`               → `'Ammo_LRM_Standard'`
 * `'Blindaje (Estándar)'`      → `'Armor_Standard'`
 * `'Blindaje (Ferro-Fibroso)'` → `'Armor_Ferro-Fibrous'`
 * `'Armor (Standard)'`         → `'Armor_Standard'`
 */

// Regex: `Ammo (FAMILY)` — familia entre paréntesis
const RE_AMMO_LEGACY = /^Ammo\s*\((.+)\)$/;
// Regex: `Blindaje (tipo)`
const RE_BLINDAJE = /^Blindaje\s*\((.+)\)$/;
// Regex: `Armor (tipo)` — english legacy
const RE_ARMOR_LEGACY = /^Armor\s*\((.+)\)$/;

const BLINDAJE_MAP: Record<string, string> = {
  'Estándar':      'Standard',
  'Ferro-Fibroso': 'Ferro-Fibrous',
  'Stealth':       'Stealth',
};

function migrateSingleKey(key: string): string {
  // Ya en formato nuevo → dejar
  if (key.startsWith('Ammo_') || key.startsWith('Armor_')) return key;

  // Ammo (LRM) → Ammo_LRM_Standard
  const ammoMatch = RE_AMMO_LEGACY.exec(key);
  if (ammoMatch) {
    const family = ammoMatch[1].trim();
    return `Ammo_${family}_Standard`;
  }

  // Blindaje (Estándar) → Armor_Standard
  const blindajeMatch = RE_BLINDAJE.exec(key);
  if (blindajeMatch) {
    const raw = blindajeMatch[1].trim();
    const mapped = BLINDAJE_MAP[raw] ?? raw;
    return `Armor_${mapped}`;
  }

  // Armor (Standard) → Armor_Standard
  const armorMatch = RE_ARMOR_LEGACY.exec(key);
  if (armorMatch) {
    const tipo = armorMatch[1].trim();
    return `Armor_${tipo}`;
  }

  // Cualquier otra clave (armas, etc.) → tal cual
  return key;
}

/**
 * Convierte un almacén completo de claves legacy a formato nuevo.
 * Las claves que ya estén en formato nuevo se dejan sin cambio.
 * Las claves no reconocidas (armas, etc.) se dejan tal cual.
 */
export function migrateAlmacenKeys(old: Record<string, number>): Record<string, number> {
  const migrated: Record<string, number> = {};
  for (const [key, value] of Object.entries(old)) {
    const newKey = migrateSingleKey(key);
    // Si dos claves legacy colisionan en la misma nueva, sumar valores
    migrated[newKey] = (migrated[newKey] ?? 0) + value;
  }
  return migrated;
}

/* ═══════════════════════════════════════════════════════════════
   6. findAmmoStock
   ─────────────────────────────────────────────────────────────── */

/**
 * Busca el stock disponible en el almacén para un bin dado.
 *
 * 1. Intenta la clave exacta canónica (`Ammo_LRM_Standard`).
 * 2. Fallback a clave legacy (`Ammo (LRM)`).
 * 3. Si no hay nada → stock: 0.
 */
export function findAmmoStock(
  almacen: Record<string, number>,
  bin: AmmoBin,
): { key: string; stock: number } {
  // 1. Clave canónica
  const canonical = ammoKeyFromBin(bin);
  if (canonical in almacen) {
    return { key: canonical, stock: almacen[canonical] };
  }

  const family = familyKeyNormalize(bin.familyKey || bin.family || '');
  const variant = (bin.variant && bin.variant.trim()) ? bin.variant : 'Standard';

  // 2. Variantes nombre canónico (case-insensitive, espacios, guiones)
  const wanted = canonical.toLowerCase();
  for (const k of Object.keys(almacen)) {
    if (k.toLowerCase() === wanted) {
      return { key: k, stock: almacen[k] };
    }
  }

  // 3. Match permisivo por family + variant Standard (cubre keys Ammo_LRM)
  if (variant === 'Standard') {
    const shortKey = `Ammo_${family}`;
    if (shortKey in almacen) {
      return { key: shortKey, stock: almacen[shortKey] };
    }
  }

  // 4. Fallback legacy: `Ammo (FAMILY)`
  const legacyKey = `Ammo (${family})`;
  if (legacyKey in almacen) {
    return { key: legacyKey, stock: almacen[legacyKey] };
  }

  // 5. Búsqueda por substring family (ej almacén tiene `Ammo_LRM_X` cualquier
  //    variante → suma todos si standard pedido)
  let sumStock = 0;
  let foundAnyKey = '';
  const prefix = `ammo_${family.toLowerCase()}`;
  for (const k of Object.keys(almacen)) {
    if (k.toLowerCase().startsWith(prefix)) {
      sumStock += almacen[k];
      if (!foundAnyKey) foundAnyKey = k;
    }
  }
  if (sumStock > 0 && variant === 'Standard') {
    return { key: foundAnyKey, stock: sumStock };
  }

  return { key: canonical, stock: 0 };
}
