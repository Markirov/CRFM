// Helpers de tiradas auto del simulador. Consumen tablas canon de ayudas-data.ts.
// Cada función devuelve el resultado + breakdown del roll para logging en sim.
//
// Source: Total Warfare, BattleMech Manual.

import {
  CLUSTER_TABLE,
  MECH_HIT_LOCATIONS,
  MECH_KICK_LOCATIONS,
  MECH_PUNCH_LOCATIONS,
  MECH_CRITICAL_HITS,
} from './ayudas-data';

// ════════════════════════════════════════════════════════
// Primitives
// ════════════════════════════════════════════════════════

export interface DiceRoll {
  d1: number;
  d2?: number;
  sum: number;
  natural?: boolean;  // true si d1=d2
}

export function roll1d6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function roll2d6(): DiceRoll {
  const d1 = roll1d6();
  const d2 = roll1d6();
  return { d1, d2, sum: d1 + d2, natural: d1 === d2 };
}

// ════════════════════════════════════════════════════════
// Mapping nombres ES → location keys del sim
// ════════════════════════════════════════════════════════

const LOC_NAME_TO_KEY: Record<string, string> = {
  'Cabeza':           'HD',
  'Torso Central':    'CT',
  'Torso Izquierdo':  'LT',
  'Torso Derecho':    'RT',
  'Brazo Izquierdo':  'LA',
  'Brazo Derecho':    'RA',
  'Pierna Izquierda': 'LL',
  'Pierna Derecha':   'RL',
};

function nameToKey(name: string): string {
  return LOC_NAME_TO_KEY[name] ?? name;
}

// ════════════════════════════════════════════════════════
// toHit roll (Gunnery)
// ════════════════════════════════════════════════════════

export interface ToHitResult {
  roll: DiceRoll;
  target: number;        // número objetivo a igualar/superar
  success: boolean;
  natural2: boolean;     // crítico fallo / Ultra AC jam etc
  natural12: boolean;
}

/** target = gunnery + mods totales (atacante + objetivo + rango + terreno). */
export function rollToHit(target: number): ToHitResult {
  const roll = roll2d6();
  return {
    roll,
    target,
    success: roll.sum >= target,
    natural2: roll.sum === 2,
    natural12: roll.sum === 12,
  };
}

// ════════════════════════════════════════════════════════
// Cluster hits (LRM/SRM/MRM)
// ════════════════════════════════════════════════════════

export interface ClusterResult {
  roll: DiceRoll;
  rackSize: number;
  hits: number;
}

/**
 * Cluster hits roll. rackSize = tamaño lanzador (2/4/5/6/10/12/15/20).
 * Devuelve hits según tabla canon.
 */
export function rollClusterHits(rackSize: number, mod = 0): ClusterResult {
  const roll = roll2d6();
  const adjusted = Math.max(2, Math.min(12, roll.sum + mod));
  const hits = CLUSTER_TABLE[adjusted]?.[rackSize] ?? rackSize;  // fallback all hit
  return { roll, rackSize, hits };
}

// ════════════════════════════════════════════════════════
// Hit location
// ════════════════════════════════════════════════════════

export type AttackDirection = 'front' | 'left' | 'right' | 'rear';

export interface HitLocationResult {
  roll: DiceRoll;
  direction: AttackDirection;
  locKey: string;        // 'HD' | 'CT' | 'LT' | 'RT' | 'LA' | 'RA' | 'LL' | 'RL'
  locLabel: string;      // nombre humano ES
  rearArmor: boolean;    // si rear → daño a armor rear de la loc (CTr/LTr/RTr)
}

// Tabla rear (Total Warfare). Locations son rear armor de los torsos.
// Roll → [locKey, label, isRearArmor]
const MECH_HIT_LOCATIONS_REAR: Array<{ roll: number; key: string; label: string; rear: boolean }> = [
  { roll: 2,  key: 'CT', label: 'Torso Central (Trasero)',    rear: true  },
  { roll: 3,  key: 'RL', label: 'Pierna Derecha',             rear: false },
  { roll: 4,  key: 'RL', label: 'Pierna Derecha',             rear: false },
  { roll: 5,  key: 'RT', label: 'Torso Derecho (Trasero)',    rear: true  },
  { roll: 6,  key: 'RT', label: 'Torso Derecho (Trasero)',    rear: true  },
  { roll: 7,  key: 'CT', label: 'Torso Central (Trasero)',    rear: true  },
  { roll: 8,  key: 'LT', label: 'Torso Izquierdo (Trasero)',  rear: true  },
  { roll: 9,  key: 'LT', label: 'Torso Izquierdo (Trasero)',  rear: true  },
  { roll: 10, key: 'LL', label: 'Pierna Izquierda',           rear: false },
  { roll: 11, key: 'LL', label: 'Pierna Izquierda',           rear: false },
  { roll: 12, key: 'HD', label: 'Cabeza',                     rear: false },
];

/**
 * Standard weapon attack hit location 2d6.
 * direction = lado del que viene el ataque relativo al target.
 */
export function rollHitLocation(direction: AttackDirection): HitLocationResult {
  const roll = roll2d6();

  if (direction === 'rear') {
    const entry = MECH_HIT_LOCATIONS_REAR.find(e => e.roll === roll.sum)!;
    return {
      roll,
      direction,
      locKey: entry.key,
      locLabel: entry.label,
      rearArmor: entry.rear,
    };
  }

  // front/left/right → MECH_HIT_LOCATIONS columns [roll, left, front, right]
  const row = MECH_HIT_LOCATIONS.find(r => r[0] === roll.sum)!;
  const colIdx = direction === 'left' ? 1 : direction === 'right' ? 3 : 2;
  const label = row[colIdx];
  return {
    roll,
    direction,
    locKey: nameToKey(label),
    locLabel: label,
    rearArmor: false,
  };
}

/** Punch 1d6 (sólo brazo o cabeza). */
export function rollPunchLocation(direction: 'front' | 'left' | 'right'): HitLocationResult {
  const r = roll1d6();
  const row = MECH_PUNCH_LOCATIONS.find(x => x[0] === r)!;
  const colIdx = direction === 'left' ? 1 : direction === 'right' ? 3 : 2;
  const label = row[colIdx];
  return {
    roll: { d1: r, sum: r },
    direction,
    locKey: nameToKey(label),
    locLabel: label,
    rearArmor: false,
  };
}

/** Kick 1d6 (sólo piernas). */
export function rollKickLocation(direction: 'front' | 'left' | 'right'): HitLocationResult {
  const r = roll1d6();
  const row = MECH_KICK_LOCATIONS.find(x => x[0] === r)!;
  const colIdx = direction === 'left' ? 1 : direction === 'right' ? 3 : 2;
  const label = row[colIdx];
  return {
    roll: { d1: r, sum: r },
    direction,
    locKey: nameToKey(label),
    locLabel: label,
    rearArmor: false,
  };
}

// ════════════════════════════════════════════════════════
// Critical Hit (TAC + crit chain)
// ════════════════════════════════════════════════════════

export type CritArea = 'torso' | 'arm' | 'leg';

export interface CritResult {
  roll: DiceRoll;
  area: CritArea;
  effect: string;        // nombre del componente afectado ("Motor", "Giróscopo", "Arma", ...)
  // Para "Arma" / "Disipadores de Calor" / "Munición" → sim resuelve slot específico
}

/**
 * Critical hit roll cuando damage entra IS o TAC ocurre.
 * area = tipo de localización afectada (afecta tabla).
 *   torso = HD/CT/LT/RT
 *   arm   = LA/RA
 *   leg   = LL/RL
 */
export function rollCritical(area: CritArea): CritResult {
  const roll = roll2d6();
  const row = MECH_CRITICAL_HITS.find(r => r[0] === roll.sum)!;
  const colIdx = area === 'torso' ? 2 : area === 'arm' ? 1 : 3;
  return {
    roll,
    area,
    effect: row[colIdx],
  };
}

/** Mapea loc key del sim a CritArea para tabla. */
export function locKeyToCritArea(locKey: string): CritArea {
  if (locKey === 'LA' || locKey === 'RA') return 'arm';
  if (locKey === 'LL' || locKey === 'RL') return 'leg';
  return 'torso';
}

// ════════════════════════════════════════════════════════
// Ammo explosion (avoid roll)
// ════════════════════════════════════════════════════════

export interface AmmoExplosionResult {
  roll: DiceRoll;
  heat: number;          // heat actual de la unidad
  threshold: number;     // target number canon
  exploded: boolean;
}

/**
 * Avoid Ammo Explosion roll por calor (Total Warfare).
 * Thresholds canon:
 *   heat 19-22 → avoid 4+
 *   heat 23-27 → avoid 6+
 *   heat 28+   → avoid 8+
 *
 * Si heat < 19 → no triggers (no roll needed).
 */
export function rollAmmoExplosionAvoid(heat: number): AmmoExplosionResult | null {
  if (heat < 19) return null;
  let threshold = 4;
  if (heat >= 23 && heat <= 27) threshold = 6;
  if (heat >= 28) threshold = 8;
  const roll = roll2d6();
  return {
    roll,
    heat,
    threshold,
    exploded: roll.sum < threshold,
  };
}

// ════════════════════════════════════════════════════════
// Piloting Skill Roll
// ════════════════════════════════════════════════════════

export interface PilotingResult {
  roll: DiceRoll;
  target: number;
  success: boolean;
}

/** Target = piloting skill + mods. Pass on ≥. */
export function rollPiloting(target: number): PilotingResult {
  const roll = roll2d6();
  return {
    roll,
    target,
    success: roll.sum >= target,
  };
}

// ════════════════════════════════════════════════════════
// Iniciativa
// ════════════════════════════════════════════════════════

export interface InitiativeResult {
  myRoll: DiceRoll;
  opponentRoll: DiceRoll;
  // Higher wins initiative — wins act SECOND in canon.
  iWon: boolean;
  tie: boolean;
}

export function rollInitiative(): InitiativeResult {
  const myRoll = roll2d6();
  const opponentRoll = roll2d6();
  return {
    myRoll,
    opponentRoll,
    iWon: myRoll.sum > opponentRoll.sum,
    tie: myRoll.sum === opponentRoll.sum,
  };
}
