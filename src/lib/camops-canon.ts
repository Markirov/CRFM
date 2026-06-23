// ════════════════════════════════════════════════════════════════
//  CamOps Canon — tiempos reparación/recarga + salvage (Sprint Integración)
//  Source: Campaign Operations.
// ════════════════════════════════════════════════════════════════

/** Tiempos canon (minutos) base. Multiplicadores aplicados aparte. */
export const CAMOPS_TIME = {
  /** Reparación blindaje: 5 min por punto. */
  armorPointMin: 5,
  /** Reemplazo arma: 120 min por arma. */
  weaponReplaceMin: 120,
  /** Reimplantación brazo: 180 min. */
  armReplaceMin: 180,
  /** Recarga munición: 10 min por tonelada (skill Regular). */
  ammoReloadPerTonMin: 10,
  /** Desguace (salvage) = mismo tiempo que reemplazo (canon). */
  salvageWeaponMin: 120,
  salvageArmMin: 180,
};

/** Skill del técnico — afecta tiempo y tirada salvage. */
export type TechSkill = 'green' | 'regular' | 'veteran' | 'elite';

const SKILL_TIME_MULT: Record<TechSkill, number> = {
  green:   1.5,
  regular: 1.0,
  veteran: 0.75,
  elite:   0.5,
};

const SKILL_SALVAGE_TARGET: Record<TechSkill, number> = {
  green:   9,
  regular: 7,
  veteran: 6,
  elite:   5,
};

/** Multiplicador por equipos asignados (canon: hasta 3 simultáneos divide tiempo). */
function teamsDivisor(teamsCount: number): number {
  const c = Math.max(0, Math.min(3, Math.floor(teamsCount)));
  return c === 0 ? Infinity : c;
}

/** Tiempo total reparación blindaje (X puntos). */
export function calcArmorRepairTime(points: number, skill: TechSkill, teams: number, onBattlefield = false): number {
  const base = points * CAMOPS_TIME.armorPointMin;
  const adj = base * SKILL_TIME_MULT[skill] / teamsDivisor(teams);
  return Math.ceil(adj * (onBattlefield ? 2 : 1));
}

/** Tiempo reemplazo arma. */
export function calcWeaponReplaceTime(skill: TechSkill, teams: number, onBattlefield = false): number {
  const adj = CAMOPS_TIME.weaponReplaceMin * SKILL_TIME_MULT[skill] / teamsDivisor(teams);
  return Math.ceil(adj * (onBattlefield ? 2 : 1));
}

/** Tiempo reimplantación brazo/pierna. */
export function calcArmReplaceTime(skill: TechSkill, teams: number, onBattlefield = false): number {
  const adj = CAMOPS_TIME.armReplaceMin * SKILL_TIME_MULT[skill] / teamsDivisor(teams);
  return Math.ceil(adj * (onBattlefield ? 2 : 1));
}

/** Tiempo recarga munición — X toneladas. */
export function calcAmmoReloadTime(tons: number, skill: TechSkill, teams: number, onBattlefield = false): number {
  const base = tons * CAMOPS_TIME.ammoReloadPerTonMin;
  const adj = base * SKILL_TIME_MULT[skill] / teamsDivisor(teams);
  return Math.ceil(adj * (onBattlefield ? 2 : 1));
}

// ════════════════════════════════════════════════════════════════
//  Salvage — desguace fino (Sprint Integración Tarea 8)
//  Canon: arrancar un componente requiere tirada Technician Skill.
//  Fallo → componente queda destruido permanentemente.
// ════════════════════════════════════════════════════════════════

export interface SalvageResult {
  d1: number;
  d2: number;
  sum: number;
  target: number;
  success: boolean;
  componentName: string;
  timeMin: number;
  /** Si false, la pieza queda destruida. */
  recovered: boolean;
}

/** Tirada salvage 2d6 ≥ target según skill. */
export function rollSalvage(
  componentName: string,
  skill: TechSkill,
  teams: number,
  isArmOrLeg = false,
): SalvageResult {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const sum = d1 + d2;
  const target = SKILL_SALVAGE_TARGET[skill];
  const success = sum >= target;
  const baseMin = isArmOrLeg ? CAMOPS_TIME.salvageArmMin : CAMOPS_TIME.salvageWeaponMin;
  const timeMin = Math.ceil(baseMin * SKILL_TIME_MULT[skill] / teamsDivisor(teams));
  return {
    d1, d2, sum, target, success,
    componentName,
    timeMin,
    recovered: success,
  };
}
