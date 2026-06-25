// ══════════════════════════════════════════════════════════════
//  recruitment/mech-assignment.ts — Tirada BattleMech inicial
//  Spec §11
//
//  ELH: 1d16, mods [-2..+2], clamp [1, 16].
//  IS : 2d6, mods [-3..+3], clamp [-1, 15].
//
//  Mod negativo concede puntos; positivo gasta.
//  Coste en puntos = modifier * 10 (aplicado en costs.ts).
// ══════════════════════════════════════════════════════════════

import type { AssignedMech, CampaignId } from './types';

export interface MechTableEntry {
  model: string;
  tons:  number;
}

// ── ELH (1..16) — modelo único per fila ──────────────────────
export const MECH_TABLE_ELH: Record<number, MechTableEntry> = {
  1:  { model: 'Dervish DV-6M',      tons: 55 },
  2:  { model: 'Gladiator GLD-4R',   tons: 55 },
  3:  { model: 'Griffin GRF-1N',     tons: 55 },
  4:  { model: 'Wolverine WVR-6M',   tons: 55 },
  5:  { model: 'Shadow Hawk-2ELH',   tons: 55 },
  6:  { model: 'Wolverine WVR-6R',   tons: 55 },
  7:  { model: 'Wolverine WVR-6S',   tons: 55 },
  8:  { model: 'Wolverine WVR-6D',   tons: 55 },
  9:  { model: 'Quickdraw QKD-5A',   tons: 60 },
  10: { model: 'Merlin MLN-1A',      tons: 60 },
  11: { model: 'Exterminator EXT-4A', tons: 65 },
  12: { model: 'Catapult CPT-C1',    tons: 65 },
  13: { model: 'Thunderbolt-5SE',    tons: 65 },
  14: { model: 'Grasshopper GHR-5H', tons: 70 },
  15: { model: 'Guillotine GLT-4L',  tons: 70 },
  16: { model: 'BattleAxe BKX-7K',   tons: 70 },
};

// ── IS (-1..15) — fila puede contener varios modelos ─────────
// Spec §11 corrección 13: convertir grupo en modelo definitivo.
// El roll devuelve `groupModels` y el usuario elige uno (UI),
// o se selecciona aleatoriamente con un RNG.
export interface MechTableGroup {
  groupModels: string[];
  tons:        number;
}

export const MECH_TABLE_IS: Record<number, MechTableGroup> = {
  [-1]: { groupModels: ['Locust', 'Wasp', 'Stinger'], tons: 20 },
  [0]:  { groupModels: ['Commando'], tons: 25 },
  [1]:  { groupModels: ['Javelin', 'Spider', 'Valkyrie', 'Urbanmech'], tons: 30 },
  [2]:  { groupModels: ['Locust', 'Wasp', 'Stinger'], tons: 20 },
  [3]:  { groupModels: ['Commando'], tons: 25 },
  [4]:  { groupModels: ['Javelin', 'Spider', 'Valkyrie', 'Urbanmech'], tons: 30 },
  [5]:  { groupModels: ['Firestarter', 'Jenner', 'Panther', 'Ostscout', 'Firebee'], tons: 35 },
  [6]:  { groupModels: ['Assassin', 'Cicada', 'Clint', 'Hermes II', 'Vulcan', 'Whitworth', 'Icarus II'], tons: 40 },
  [7]:  { groupModels: ['Blackjack', 'Hatchetman', 'Vindicator', 'Phoenix Hawk'], tons: 45 },
  [8]:  { groupModels: ['Centurion', 'Enforcer', 'Hunchback', 'Trebuchet'], tons: 50 },
  [9]:  { groupModels: ['Griffin', 'Shadow Hawk', 'Wolverine', 'Scorpion', 'Dervish', 'Gladiator'], tons: 55 },
  [10]: { groupModels: ['Dragon', 'Ostroc', 'Ostsol', 'Rifleman', 'Quickdraw'], tons: 60 },
  [11]: { groupModels: ['Catapult', 'Jagermech', 'Thunderbolt', 'Crusader'], tons: 65 },
  [12]: { groupModels: ['Archer', 'Warhammer', 'Grasshopper', 'Battleaxe'], tons: 70 },
  [13]: { groupModels: ['Marauder', 'Orion'], tons: 75 },
  [14]: { groupModels: ['Awesome', 'Charger', 'Victor', 'Goliath', 'Zeus'], tons: 80 },
  [15]: { groupModels: ['Battlemaster', 'Stalker', 'Longbow'], tons: 85 },
};

// ══════════════════════════════════════════════════════════════
//  KKK — Tabla nueva por peso (scaffold rellenable)
//  La tirada da un PESO; el jugador después elige el modelo
//  concreto de la lista disponible para ese peso.
//
//  Tirada: 2d6 + mod, clamp [2, 12]. Cada fila → tonelaje.
//  Catálogo de modelos por peso vive en MECH_CATALOG_BY_TONS.
//
//  TODO usuario: rellenar MECH_TABLE_KKK + MECH_CATALOG_BY_TONS
//  con los datos definitivos. Por ahora pesos estándar BattleTech.
// ══════════════════════════════════════════════════════════════

export interface MechTonsResult {
  tons: number;
  /** Texto descriptivo de clase/peso. */
  label: string;
}

export const MECH_TABLE_KKK: Record<number, MechTonsResult> = {
  2:  { tons: 100, label: 'Asalto pesado' },
  3:  { tons: 90,  label: 'Asalto' },
  4:  { tons: 85,  label: 'Asalto ligero' },
  5:  { tons: 75,  label: 'Pesado' },
  6:  { tons: 65,  label: 'Pesado ligero' },
  7:  { tons: 55,  label: 'Mediano' },
  8:  { tons: 45,  label: 'Mediano ligero' },
  9:  { tons: 40,  label: 'Mediano bajo' },
  10: { tons: 35,  label: 'Ligero pesado' },
  11: { tons: 25,  label: 'Ligero' },
  12: { tons: 20,  label: 'Explorador' },
};

/**
 * Modelos disponibles para cada peso (BattleMechs canon).
 * Se filtra por `tons` exacto al elegir modelo concreto.
 * Lista pre-rellenada con clásicos; admin puede ampliar.
 */
export const MECH_CATALOG_BY_TONS: Record<number, string[]> = {
  20:  ['Locust', 'Wasp', 'Stinger', 'Flea'],
  25:  ['Commando', 'Mongoose'],
  30:  ['Spider', 'Javelin', 'Valkyrie', 'Urbanmech'],
  35:  ['Firestarter', 'Jenner', 'Panther', 'Ostscout', 'Firebee'],
  40:  ['Assassin', 'Cicada', 'Clint', 'Hermes II', 'Vulcan', 'Whitworth', 'Icarus II'],
  45:  ['Blackjack', 'Hatchetman', 'Vindicator', 'Phoenix Hawk'],
  50:  ['Centurion', 'Enforcer', 'Hunchback', 'Trebuchet'],
  55:  ['Griffin', 'Shadow Hawk', 'Wolverine', 'Scorpion', 'Dervish', 'Gladiator'],
  60:  ['Dragon', 'Ostroc', 'Ostsol', 'Rifleman', 'Quickdraw'],
  65:  ['Catapult', 'Jagermech', 'Thunderbolt', 'Crusader'],
  70:  ['Archer', 'Warhammer', 'Grasshopper', 'Battleaxe'],
  75:  ['Marauder', 'Orion'],
  80:  ['Awesome', 'Charger', 'Victor', 'Goliath', 'Zeus'],
  85:  ['Battlemaster', 'Stalker', 'Longbow'],
  90:  ['Cyclops', 'Highlander'],
  100: ['Atlas', 'BattleMaster (variante)', 'Annihilator'],
};

// ══════════════════════════════════════════════════════════════
//  MERC — Tabla 1d20 columna Mercenary/Periphery (RANDOM 'MECH
//  ASSIGNMENT TABLE: INNER SPHERE 2). 5 mechs per clase, mezclados.
//  1-5 = ligeros, 6-10 = medianos, 11-15 = pesados, 16-20 = asalto.
//  Tirada plana 1d20, mods [-2..+2] desplazan al peso vecino.
//
//  Conviene refinar. MERC-LMH abajo: sin asalto, 7+7+6.
// ══════════════════════════════════════════════════════════════

export const MECH_TABLE_MERC: Record<number, MechTableEntry> = {
  // ── Ligeros (20-35t) ──
  1:  { model: 'LCT-1V Locust',         tons: 20 },
  2:  { model: 'WSP-1A Wasp',           tons: 20 },
  3:  { model: 'STG-3G Stinger',        tons: 20 },
  4:  { model: 'JVN-10F Javelin',       tons: 30 },
  5:  { model: 'PTN-9R Panther',        tons: 35 },
  // ── Medianos (40-55t) ──
  6:  { model: 'HBK-4G Hunchback',      tons: 50 },
  7:  { model: 'GRF-1N Griffin',        tons: 55 },
  8:  { model: 'SHD-2H Shadow Hawk',    tons: 55 },
  9:  { model: 'WVR-6R Wolverine',      tons: 55 },
  10: { model: 'CN9-A Centurion',       tons: 50 },
  // ── Pesados (60-75t) ──
  11: { model: 'TDR-5SE Thunderbolt',   tons: 65 },
  12: { model: 'ARC-2R Archer',         tons: 70 },
  13: { model: 'CRD-3R Crusader',       tons: 65 },
  14: { model: 'WHM-6R Warhammer',      tons: 70 },
  15: { model: 'ON1-K Orion',           tons: 75 },
  // ── Asalto (80-100t) ──
  16: { model: 'BLR-1G BattleMaster',   tons: 85 },
  17: { model: 'VTR-9B Victor',         tons: 80 },
  18: { model: 'AWS-8R Awesome',        tons: 80 },
  19: { model: 'STK-3F Stalker',        tons: 85 },
  20: { model: 'BNC-3E Banshee',        tons: 95 },
};

// ══════════════════════════════════════════════════════════════
//  MERC-LMH — Tabla 1d20 sin Asalto. 7 ligeros + 7 medianos + 6 pesados.
//  Tirada plana 1d20, mods [-2..+2] clamp [1, 20].
// ══════════════════════════════════════════════════════════════

export const MECH_TABLE_MERC_LMH: Record<number, MechTableEntry> = {
  // ── Ligeros (7) ──
  1:  { model: 'LCT-1V Locust',         tons: 20 },
  2:  { model: 'WSP-1A Wasp',           tons: 20 },
  3:  { model: 'STG-3G Stinger',        tons: 20 },
  4:  { model: 'UM-R60 UrbanMech',      tons: 30 },
  5:  { model: 'JVN-10F Javelin',       tons: 30 },
  6:  { model: 'PTN-9R Panther',        tons: 35 },
  7:  { model: 'WLF-1 Wolfhound',       tons: 35 },
  // ── Medianos (7) ──
  8:  { model: 'ASN-21 Assassin',       tons: 40 },
  9:  { model: 'HBK-4G Hunchback',      tons: 50 },
  10: { model: 'TBT-5N Trebuchet',      tons: 50 },
  11: { model: 'CN9-A Centurion',       tons: 50 },
  12: { model: 'GRF-1N Griffin',        tons: 55 },
  13: { model: 'SHD-2H Shadow Hawk',    tons: 55 },
  14: { model: 'WVR-6R Wolverine',      tons: 55 },
  // ── Pesados (6) ──
  15: { model: 'TDR-5SE Thunderbolt',   tons: 65 },
  16: { model: 'CRD-3R Crusader',       tons: 65 },
  17: { model: 'ARC-2R Archer',         tons: 70 },
  18: { model: 'WHM-6R Warhammer',      tons: 70 },
  19: { model: 'ON1-K Orion',           tons: 75 },
  20: { model: 'MAD-3R Marauder',       tons: 75 },
};

// ── Modificadores permitidos por campaña ─────────────────────
export const ALLOWED_MODIFIERS: Record<CampaignId, readonly number[]> = {
  ELH:        [-2, -1, 0, 1, 2],
  IS:         [-3, -2, -1, 0, 1, 2, 3],
  KKK:        [-3, -2, -1, 0, 1, 2, 3],
  MERC:       [-2, -1, 0, 1, 2],
  'MERC-LMH': [-2, -1, 0, 1, 2],
};

export const ROLL_BOUNDS: Record<CampaignId, { min: number; max: number }> = {
  ELH:        { min: 1, max: 16 },
  IS:         { min: -1, max: 15 },
  KKK:        { min: 2, max: 12 },
  MERC:       { min: 1, max: 20 },
  'MERC-LMH': { min: 1, max: 20 },
};

// ── RNG injectable ───────────────────────────────────────────
export interface Rng {
  /** Entero uniforme [min, max] inclusive. */
  integer(min: number, max: number): number;
  d6(): number;
  /** Elección uniforme de un array. */
  pick<T>(arr: readonly T[]): T;
}

export function defaultRng(): Rng {
  return {
    integer(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); },
    d6()              { return 1 + Math.floor(Math.random() * 6); },
    pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; },
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ── Roll principal ───────────────────────────────────────────
/**
 * Realiza la tirada base + aplica modificador + clamp + lookup tabla.
 * Para campaña IS si la fila tiene varios modelos, devuelve el primero;
 * usar `pickModelFromGroup` después para refinarlo (UI o RNG).
 */
export function rollMech(
  campaign: CampaignId,
  modifier: number,
  rng: Rng = defaultRng(),
): AssignedMech {
  const bounds = ROLL_BOUNDS[campaign];

  let rawRoll: number;
  if (campaign === 'ELH') {
    rawRoll = rng.integer(1, 16);
  } else if (campaign === 'MERC' || campaign === 'MERC-LMH') {
    rawRoll = rng.integer(1, 20);
  } else {
    rawRoll = rng.d6() + rng.d6();
  }

  const finalRoll = clamp(rawRoll + modifier, bounds.min, bounds.max);

  if (campaign === 'ELH') {
    const e = MECH_TABLE_ELH[finalRoll];
    return { modifier, rawRoll, finalRoll, model: e?.model ?? null, tons: e?.tons ?? null };
  } else if (campaign === 'MERC') {
    const e = MECH_TABLE_MERC[finalRoll];
    return { modifier, rawRoll, finalRoll, model: e?.model ?? null, tons: e?.tons ?? null };
  } else if (campaign === 'MERC-LMH') {
    const e = MECH_TABLE_MERC_LMH[finalRoll];
    return { modifier, rawRoll, finalRoll, model: e?.model ?? null, tons: e?.tons ?? null };
  } else if (campaign === 'IS') {
    const g = MECH_TABLE_IS[finalRoll];
    if (!g) return { modifier, rawRoll, finalRoll, model: null, tons: null };
    return {
      modifier, rawRoll, finalRoll,
      model: g.groupModels[0] ?? null,
      tons:  g.tons,
    };
  } else {
    // KKK: tirada → tonelaje. Modelo se elige después (pickModelByTons).
    const k = MECH_TABLE_KKK[finalRoll];
    if (!k) return { modifier, rawRoll, finalRoll, model: null, tons: null };
    return {
      modifier, rawRoll, finalRoll,
      model: null,         // sin modelo aún
      tons:  k.tons,
    };
  }
}

/** KKK: tirada produce tonelaje + modelos disponibles para ese peso. */
export function rollMechKKK(modifier: number, rng: Rng = defaultRng()):
  AssignedMech & { tonsLabel: string | null; candidates: string[] }
{
  const base = rollMech('KKK', modifier, rng);
  const k = base.finalRoll !== null ? MECH_TABLE_KKK[base.finalRoll] : null;
  return {
    ...base,
    tonsLabel:  k?.label ?? null,
    candidates: base.tons !== null ? (MECH_CATALOG_BY_TONS[base.tons] ?? []) : [],
  };
}

/** Devuelve modelos disponibles para un peso dado (KKK). */
export function getModelsByTons(tons: number | null): string[] {
  if (tons === null) return [];
  return MECH_CATALOG_BY_TONS[tons] ?? [];
}

/** Selecciona modelo concreto dentro del peso (KKK). */
export function pickModelByTons(assigned: AssignedMech, model: string): AssignedMech {
  return { ...assigned, model };
}

/** Devuelve modelos disponibles para refinar tras una tirada IS. */
export function getISGroupModels(finalRoll: number | null): string[] {
  if (finalRoll === null) return [];
  return MECH_TABLE_IS[finalRoll]?.groupModels ?? [];
}

/** Aplica una elección manual o aleatoria de modelo dentro del grupo IS. */
export function pickModelFromGroup(assigned: AssignedMech, model: string): AssignedMech {
  return { ...assigned, model };
}

/** Invalida la asignación (cambio campaña/modificador). */
export function clearMechAssignment(modifier: number = 0): AssignedMech {
  return { modifier, rawRoll: null, finalRoll: null, model: null, tons: null };
}
