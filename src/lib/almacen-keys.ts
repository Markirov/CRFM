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
  const lower = raw.toLowerCase();
  return FAMILY_MAP[lower] ?? raw.toUpperCase();
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
  const family = familyKeyNormalize(bin.familyKey);
  const variant = bin.variant ?? 'Standard';
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
  return ROUNDS_MAP[familyKey.toLowerCase()] ?? 1;
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

  // 2. Fallback legacy: `Ammo (FAMILY)`
  const family = familyKeyNormalize(bin.familyKey);
  const legacyKey = `Ammo (${family})`;
  if (legacyKey in almacen) {
    return { key: legacyKey, stock: almacen[legacyKey] };
  }

  // 3. Nada
  return { key: canonical, stock: 0 };
}
