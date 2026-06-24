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

// ── Modificadores permitidos por campaña ─────────────────────
export const ALLOWED_MODIFIERS: Record<CampaignId, readonly number[]> = {
  ELH: [-2, -1, 0, 1, 2],
  IS:  [-3, -2, -1, 0, 1, 2, 3],
};

export const ROLL_BOUNDS: Record<CampaignId, { min: number; max: number }> = {
  ELH: { min: 1, max: 16 },
  IS:  { min: -1, max: 15 },
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
  } else {
    rawRoll = rng.d6() + rng.d6();
  }

  const finalRoll = clamp(rawRoll + modifier, bounds.min, bounds.max);

  if (campaign === 'ELH') {
    const e = MECH_TABLE_ELH[finalRoll];
    return { modifier, rawRoll, finalRoll, model: e?.model ?? null, tons: e?.tons ?? null };
  } else {
    const g = MECH_TABLE_IS[finalRoll];
    if (!g) return { modifier, rawRoll, finalRoll, model: null, tons: null };
    // Para IS devolvemos el primer modelo del grupo; UI debe permitir
    // afinar la elección llamando a pickModelFromGroup.
    return {
      modifier, rawRoll, finalRoll,
      model: g.groupModels[0] ?? null,
      tons:  g.tons,
    };
  }
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
