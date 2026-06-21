// Tipos para la base de datos de armas/equipo derivada de SSW canonical data.
// Source: data/rules/ssw/equipment/{weapons,equipment,ammunition,physicals,quirks}.json
// Cualquier campo expuesto debe nacer aquí; los componentes consumen vía weapons.ts.

export type TechBase = 'IS' | 'CL';

export type WeaponCategory =
  | 'Energy'
  | 'Ballistic'
  | 'Missile'
  | 'Equipment'
  | 'Physical'
  | 'Other';

// Type canonical TacOps:
//   M  = Missile
//   DB = Direct-fire Ballistic
//   DE = Direct-fire Energy
//   P  = Pulse laser (Pulse class)
//   AE = Area Effect
export type ManualType = 'M' | 'DB' | 'DE' | 'P' | 'AE' | string;

// type field SSW (lowercase). Enum granular para clasificación.
export type WeaponClass =
  | 'AUTOCANNON' | 'LASER' | 'PPC' | 'GAUSS' | 'FLAMER'
  | 'LRM' | 'SRM' | 'MRM' | 'MML' | 'ATM' | 'NARC'
  | 'LRT' | 'SRT' | 'MORTAR' | 'THUNDERBOLT'
  | 'ROCKET_LAUNCHER' | 'RIFLE' | 'ARTILLERY_CANNON'
  | 'CRUISE_MISSILE' | 'ARROW_IV'
  | 'MG' | 'PLASMA_RIFLE' | 'PLASMA_CANNON'
  | 'TSEMP' | 'TASER' | 'FLUID_GUN'
  | 'OTHER';

// Availability per era (canon SSW). Values mezcla: códigos 'A'..'X' / '-' / '*',
// fechas (number) y flags (boolean).
// Keys ejemplo: IS_SL/IS_SW/IS_CI/IS_DA, CL_SL/..., IS_RandDStartDate (number),
// SuperHeavyOnly (boolean), IS_TechRating ('C').
export type AvailabilityMap = Record<string, string | number | boolean>;

export interface WeaponRule {
  // ── Identificación ────────────────────────────────────────────
  lookupName: string;          // "(IS) Autocannon/2" — clave SSW principal
  actualName: string;          // "Autocannon/2"      — nombre canon limpio
  megaMekName: string;         // "ISAC2"             — parser ID MTF/MegaMek
  chatName: string;            // "AC2"               — abreviatura UI
  aliases: string[];           // todas las variantes de búsqueda

  // ── Clasificación ─────────────────────────────────────────────
  techBase: TechBase;
  category: WeaponCategory;
  manualType: ManualType;      // M / DB / DE / P / AE
  weaponClass: WeaponClass;
  specials: string;            // flags raw separados por '/'  ej. "C/S/C5/5"
  bookReference: string;

  // ── Stats combate ─────────────────────────────────────────────
  heat: number;
  damageShort: number;
  damageMedium: number;
  damageLong: number;
  rangeMin: number;
  rangeShort: number;
  rangeMedium: number;
  rangeLong: number;
  toHitShort: number;
  toHitMedium: number;
  toHitLong: number;

  // ── Munición ──────────────────────────────────────────────────
  hasAmmo: boolean;
  switchableAmmo: boolean;
  ammoPerTon: number | null;   // AmmoLotSize
  ammoIndex: number | null;
  caselessAmmoIdx: number | null;

  // ── Reglas especiales (flags estructurados) ───────────────────
  rotary: boolean;
  ultra: boolean;
  streak: boolean;
  oneShot: boolean;
  isCluster: boolean;
  explosive: boolean;
  tcCapable: boolean;
  arrayCapable: boolean;
  canUseCapacitor: boolean;
  canUseInsulator: boolean;
  canUsePulseModule: boolean;
  canUseCaseless: boolean;
  canOS: boolean;
  canIOS: boolean;
  canUseFCS: boolean;

  // ── Cluster table ─────────────────────────────────────────────
  clusterSize: number;
  clusterGroup: number;
  clusterModShort: number;
  clusterModMedium: number;
  clusterModLong: number;
  rackSize: number;

  // ── Construcción / coste / BV ────────────────────────────────
  numCrits: number;
  cvSpace: number;
  tonnage: number;
  cost: number;
  bvOffensive: number;
  bvDefensive: number;

  // ── Disponibilidad ───────────────────────────────────────────
  availability: AvailabilityMap;
  battleForceAbilities: string[];

  // ── Restricciones de localización ────────────────────────────
  allocHead: boolean;
  allocCT: boolean;
  allocTorso: boolean;
  allocArms: boolean;
  allocLegs: boolean;
  allocFront: boolean;
  allocSides: boolean;
  allocRear: boolean;
  allocTurret: boolean;
  allocBody: boolean;
  canSplit: boolean;
  omniRestrict: boolean;
  locationLinked: boolean;
  requiresFusion: boolean;
  requiresNuclear: boolean;
  requiresPowerAmps: boolean;
}

export interface AmmoRule {
  lookupName: string;          // "(IS) @ AC/2 (Armor-Piercing)"
  actualName: string;
  parentWeaponLookup: string;  // "(IS) AC/2" — derivado del lookupName
  variant: string;             // "Armor-Piercing" | "Caseless" | "Flak" | "Standard" | ...
  megaMekName: string;
  bookReference: string;
  techBase: TechBase;

  ammoIndex: number;
  lotSize: number;
  isCluster: boolean;
  explosive: boolean;

  damageShort: number;
  damageMedium: number;
  damageLong: number;
  rangeMin: number;
  rangeShort: number;
  rangeMedium: number;
  rangeLong: number;
  toHitShort: number;
  toHitMedium: number;
  toHitLong: number;
  clusterGroup: number;
  weaponClass: number;
  fcsType: number;

  tonnage: number;
  cost: number;
  bvOffensive: number;
  bvDefensive: number;
  availability: AvailabilityMap;
  battleForceAbilities: string[];
}

export interface EquipmentRule {
  lookupName: string;
  actualName: string;
  megaMekName: string;
  chatName: string;
  category: WeaponCategory;
  manualType: ManualType;
  bookReference: string;
  specials: string;

  numCrits: number;
  cvSpace: number;
  heat: number;
  tonnage: number;
  cost: number;
  bvOffensive: number;
  bvDefensive: number;

  hasAmmo: boolean;
  ammoPerTon: number | null;
  ammoIndex: number | null;
  rangeShort: number;
  rangeMedium: number;
  rangeLong: number;

  explosive: boolean;
  variableSize: boolean;
  canMountRear: boolean;

  availability: AvailabilityMap;
  battleForceAbilities: string[];
}

export interface PhysicalRule {
  lookupName: string;
  actualName: string;
  megaMekName: string;
  chatName: string;
  manualType: ManualType;
  specials: string;
  bookReference: string;

  heat: number;
  toHitShort: number;
  toHitMedium: number;
  toHitLong: number;

  damageAdd: number;
  damageMult: number;
  critAdd: number;
  critMult: number;
  tonAdd: number;
  tonMult: number;
  costAdd: number;
  costMult: number;
  bvAdd: number;
  bvMult: number;
  bvDefensive: number;

  requiresHand: boolean;
  replacesHand: boolean;
  requiresLowerArm: boolean;
  replacesLowerArm: boolean;

  availability: AvailabilityMap;
  battleForceAbilities: string[];
}

// ── Hooks reglas especiales ejecutables por el sim ──
// Se derivan del WeaponRule en weapons-data.ts; sim los aplica en combat-data.
export type SpecialHook =
  | { kind: 'pulse_mod'; value: number }                       // P type → toHit -X
  | { kind: 'ultra_jam'; jamOn: number }                       // Ultra AC: 2 disparos, jam 2
  | { kind: 'rotary_variable'; maxShots: number; jamTable: Record<number, number> } // RAC 1-6, jam por cadencia
  | { kind: 'lbx_cluster_mode'; clusterMod: number }           // LBX toggle slug/cluster
  | { kind: 'streak_all_or_nothing' }                          // Streak SRM
  | { kind: 'one_shot' }                                       // OneShot: consume bin completo
  | { kind: 'gauss_explosion'; damage: number }                // Gauss crit explosion
  | { kind: 'flamer_dual_mode' }                               // Flamer: 2 dmg | 2 heat
  | { kind: 'tc_capable' }                                     // Targeting Computer compatible
  | { kind: 'anti_infantry' }                                  // AI bonus vs infantería
  | { kind: 'capacitor_capable' }                              // PPC + Capacitor
  | { kind: 'narc_attached' };                                 // NARC pod attach
