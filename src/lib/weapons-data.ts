// Loader + normalizador de la BD SSW canónica.
// Source: data/rules/ssw/equipment/*.json (copiado de Solaris Skunk Werks 0.7.4, BSD).
//
// Carga estática: las 5 tablas se bundlean en boot. ~2.7 MB de JSON parseado una vez.
// Construye índices BY_LOOKUP / BY_ALIAS para resolver nombres que aparecen en .ssw.
//
// API pública: weapons.ts (fachada delgada que estamos migrando).

import weaponsRaw from '../../data/rules/ssw/equipment/weapons.json';
import equipmentRaw from '../../data/rules/ssw/equipment/equipment.json';
import ammoRaw from '../../data/rules/ssw/equipment/ammunition.json';
import physicalsRaw from '../../data/rules/ssw/equipment/physicals.json';

import type {
  WeaponRule,
  AmmoRule,
  EquipmentRule,
  PhysicalRule,
  TechBase,
  WeaponCategory,
  WeaponClass,
  SpecialHook,
  AvailabilityMap,
} from './weapons-types';

// ── Tipos raw del JSON SSW (subset usado) ────────────────────
// SSW usa PascalCase y boolean primitivos. Casteamos al borde.

interface RawWeapon {
  ActualName: string;
  CritName?: string;
  MegaMekName: string;
  LookupName: string;
  ChatName?: string;
  Specials?: string;
  Type?: string;
  ModifiedType?: string;
  BookReference?: string;
  type?: string;          // weapon class lowercase
  variant?: string;
  HasAmmo?: boolean;
  SwitchableAmmo?: boolean;
  RequiresFusion?: boolean;
  RequiresNuclear?: boolean;
  RequiresPowerAmps?: boolean;
  Alloc_HD?: boolean;
  Alloc_CT?: boolean;
  Alloc_Torso?: boolean;
  Alloc_Arms?: boolean;
  Alloc_Legs?: boolean;
  alloc_front?: boolean;
  alloc_sides?: boolean;
  alloc_rear?: boolean;
  alloc_turret?: boolean;
  alloc_body?: boolean;
  CanSplit?: boolean;
  OmniRestrict?: boolean;
  LocationLinked?: boolean;
  Rotary?: boolean;
  Ultra?: boolean;
  IsCluster?: boolean;
  Explosive?: boolean;
  Streak?: boolean;
  OneShot?: boolean;
  CanUseFCS?: boolean;
  TCCapable?: boolean;
  ArrayCapable?: boolean;
  CanUseCapacitor?: boolean;
  CanUseInsulator?: boolean;
  CanUsePulseModule?: boolean;
  CanUseCaseless?: boolean;
  CanOS?: boolean;
  CanIOS?: boolean;
  Heat?: number;
  DamSht?: number;
  DamMed?: number;
  DamLng?: number;
  RngMin?: number;
  RngSht?: number;
  RngMed?: number;
  RngLng?: number;
  ToHitShort?: number;
  ToHitMedium?: number;
  ToHitLong?: number;
  AmmoLotSize?: number;
  AmmoIndex?: number;
  CaselessAmmoIDX?: number;
  NumCrits?: number;
  CVSpace?: number;
  ClusterSize?: number;
  ClusterGroup?: number;
  ClusterModShort?: number;
  ClusterModMedium?: number;
  ClusterModLong?: number;
  RackSize?: number;
  Tonnage?: number;
  Cost?: number;
  OffBV?: number;
  DefBV?: number;
  Availability?: AvailabilityMap;
  BattleForceAbilities?: string[];
}

interface RawAmmo {
  ActualName: string;
  LookupName: string;
  MegaMekName: string;
  BookRef?: string;
  Tonnage?: number;
  Cost?: number;
  OffBV?: number;
  DefBV?: number;
  LotSize?: number;
  AmmoIndex?: number;
  minrng?: number;
  srtrng?: number;
  medrng?: number;
  lngrng?: number;
  damsht?: number;
  dammed?: number;
  damlng?: number;
  ToHitShort?: number;
  ToHitMedium?: number;
  ToHitLong?: number;
  group?: number;
  cluster?: number;
  WeaponClass?: number;
  FCSType?: number;
  Explosive?: boolean;
  IsCluster?: boolean;
  Availability?: AvailabilityMap;
  BattleForceAbilities?: string[];
}

interface RawEquipment {
  ActualName: string;
  LookupName: string;
  MegaMekName: string;
  ChatName?: string;
  Type?: string;
  Specials?: string;
  BookReference?: string;
  Crits?: number;
  CVSpace?: number;
  LotSize?: number;
  AmmoIndex?: number;
  ShtRange?: number;
  MedRange?: number;
  LngRange?: number;
  Heat?: number;
  Tonnage?: number;
  Cost?: number;
  OffBV?: number;
  DefBV?: number;
  HasAmmo?: boolean;
  Explosive?: boolean;
  VariableSize?: boolean;
  CanMountRear?: boolean;
  Availability?: AvailabilityMap;
  BattleForceAbilities?: string[];
}

interface RawPhysical {
  ActualName: string;
  LookupName: string;
  MegaMekName: string;
  ChatName?: string;
  Type?: string;
  Specials?: string;
  BookReference?: string;
  Heat?: number;
  ToHitShort?: number;
  ToHitMedium?: number;
  ToHitLong?: number;
  DamageAdd?: number;
  DamageMult?: number;
  CritAdd?: number;
  CritMult?: number;
  TonAdd?: number;
  TonMult?: number;
  CostAdd?: number;
  CostMult?: number;
  BVAdd?: number;
  BVMult?: number;
  DefBV?: number;
  RequiresHand?: boolean;
  ReplacesHand?: boolean;
  RequiresLowerArm?: boolean;
  ReplacesLowerArm?: boolean;
  Availability?: AvailabilityMap;
  BattleForceAbilities?: string[];
}

// Cast via unknown: el JSON tiene fields extra y tipos heterogéneos en Availability;
// nosotros solo consumimos un subset estable.
const WEAPONS_RAW = weaponsRaw as unknown as Record<string, RawWeapon>;
const EQUIPMENT_RAW = equipmentRaw as unknown as Record<string, RawEquipment>;
const AMMO_RAW = ammoRaw as unknown as Record<string, RawAmmo>;
const PHYSICALS_RAW = physicalsRaw as unknown as Record<string, RawPhysical>;

// ── Helpers de inferencia ─────────────────────────────────────

function inferTechBase(lookupName: string): TechBase {
  if (lookupName.startsWith('(CL)')) return 'CL';
  return 'IS'; // default: sin prefijo = Inner Sphere canon
}

const WEAPON_CLASS_TO_CATEGORY: Record<string, WeaponCategory> = {
  AUTOCANNON: 'Ballistic',
  GAUSS: 'Ballistic',
  MG: 'Ballistic',
  RIFLE: 'Ballistic',
  ARTILLERY_CANNON: 'Ballistic',
  FLUID_GUN: 'Ballistic',
  LASER: 'Energy',
  PPC: 'Energy',
  FLAMER: 'Energy',
  PLASMA_RIFLE: 'Energy',
  PLASMA_CANNON: 'Energy',
  TASER: 'Energy',
  TSEMP: 'Energy',
  LRM: 'Missile',
  SRM: 'Missile',
  MRM: 'Missile',
  MML: 'Missile',
  ATM: 'Missile',
  NARC: 'Missile',
  LRT: 'Missile',
  SRT: 'Missile',
  MORTAR: 'Missile',
  THUNDERBOLT: 'Missile',
  ROCKET_LAUNCHER: 'Missile',
  CRUISE_MISSILE: 'Missile',
  ARROW_IV: 'Missile',
  OTHER: 'Other',
};

function inferCategory(rawClass: string | undefined): WeaponCategory {
  if (!rawClass) return 'Other';
  return WEAPON_CLASS_TO_CATEGORY[rawClass] ?? 'Other';
}

function safeWeaponClass(s: string | undefined): WeaponClass {
  if (!s) return 'OTHER';
  return (WEAPON_CLASS_TO_CATEGORY[s] ? s : 'OTHER') as WeaponClass;
}

function buildAliases(raw: RawWeapon): string[] {
  const out = new Set<string>();
  if (raw.LookupName) out.add(raw.LookupName);
  if (raw.ActualName) out.add(raw.ActualName);
  if (raw.MegaMekName) out.add(raw.MegaMekName);
  if (raw.ChatName) out.add(raw.ChatName);
  if (raw.CritName) out.add(raw.CritName);
  return [...out];
}

// Detecta variante ammo desde el LookupName: "(IS) @ AC/2 (Armor-Piercing)" → "Armor-Piercing"
// y parent weapon "(IS) AC/2"
function parseAmmoName(lookupName: string): { parent: string; variant: string } {
  const m = lookupName.match(/^(\(IS\)|\(CL\))\s*@\s*(.+?)(?:\s*\((.+)\))?$/);
  if (!m) return { parent: lookupName, variant: 'Standard' };
  const prefix = m[1];
  const weapon = m[2].trim();
  const variant = m[3]?.trim() || 'Standard';
  return { parent: `${prefix} ${weapon}`, variant };
}

// Genera special_hooks desde flags + Type SSW.
// Source of truth: el campo Type 'P' detecta Pulse; los flags Rotary/Ultra/Streak/OneShot
// son directos del SSW. Para Gauss/Flamer/AI deducimos del weaponClass o Specials.
function deriveSpecialHooks(raw: RawWeapon): SpecialHook[] {
  const hooks: SpecialHook[] = [];

  if (raw.Type === 'P') {
    hooks.push({ kind: 'pulse_mod', value: -2 });
  }
  if (raw.Ultra) {
    hooks.push({ kind: 'ultra_jam', jamOn: 2 });
  }
  if (raw.Rotary) {
    hooks.push({
      kind: 'rotary_variable',
      maxShots: 6,
      jamTable: { 2: 2, 3: 2, 4: 3, 5: 3, 6: 4 },
    });
  }
  // Nota: lbx_cluster_mode eliminado del hook automático. El toggle slug/cluster
  // es exclusivo de LB-X autocannons y ya lo cubre el selector de ammo bin
  // (variants "Slug" / "Cluster" en ammunition.json con damage/toHit overrides).
  // Hacerlo aquí causaba falsos positivos en LRM/SRM (también IsCluster + SwitchableAmmo).
  if (raw.Streak) {
    hooks.push({ kind: 'streak_all_or_nothing' });
  }
  if (raw.OneShot) {
    hooks.push({ kind: 'one_shot' });
  }
  if (raw.TCCapable) {
    hooks.push({ kind: 'tc_capable' });
  }
  if (raw.CanUseCapacitor) {
    hooks.push({ kind: 'capacitor_capable' });
  }

  const cls = raw.type;
  if (cls === 'GAUSS') {
    // SSW no marca damage explícito; clasificamos por Heavy/Light/Standard via tonnage.
    // 25 Heavy Gauss, 16 Light Gauss, 20 Standard.
    const tons = raw.Tonnage ?? 0;
    let dmg = 20;
    if (raw.LookupName.includes('Heavy')) dmg = 25;
    else if (raw.LookupName.includes('Light')) dmg = 16;
    else if (tons >= 18) dmg = 25;
    hooks.push({ kind: 'gauss_explosion', damage: dmg });
  }
  if (cls === 'FLAMER') {
    hooks.push({ kind: 'flamer_dual_mode' });
  }
  if ((raw.Specials ?? '').split('/').includes('AI')) {
    hooks.push({ kind: 'anti_infantry' });
  }
  if (cls === 'NARC') {
    hooks.push({ kind: 'narc_attached' });
  }

  return hooks;
}

function normalizeWeapon(raw: RawWeapon): WeaponRule {
  return {
    lookupName: raw.LookupName,
    actualName: raw.ActualName,
    megaMekName: raw.MegaMekName,
    chatName: raw.ChatName ?? '',
    aliases: buildAliases(raw),
    techBase: inferTechBase(raw.LookupName),
    category: inferCategory(raw.type),
    manualType: raw.ModifiedType ?? raw.Type ?? '',
    weaponClass: safeWeaponClass(raw.type),
    specials: raw.Specials ?? '',
    bookReference: raw.BookReference ?? '',
    heat: raw.Heat ?? 0,
    damageShort: raw.DamSht ?? 0,
    damageMedium: raw.DamMed ?? 0,
    damageLong: raw.DamLng ?? 0,
    rangeMin: raw.RngMin ?? 0,
    rangeShort: raw.RngSht ?? 0,
    rangeMedium: raw.RngMed ?? 0,
    rangeLong: raw.RngLng ?? 0,
    toHitShort: raw.ToHitShort ?? 0,
    toHitMedium: raw.ToHitMedium ?? 0,
    toHitLong: raw.ToHitLong ?? 0,
    hasAmmo: raw.HasAmmo ?? false,
    switchableAmmo: raw.SwitchableAmmo ?? false,
    ammoPerTon: raw.AmmoLotSize ?? null,
    ammoIndex: raw.AmmoIndex ?? null,
    caselessAmmoIdx: raw.CaselessAmmoIDX ?? null,
    rotary: raw.Rotary ?? false,
    ultra: raw.Ultra ?? false,
    streak: raw.Streak ?? false,
    oneShot: raw.OneShot ?? false,
    isCluster: raw.IsCluster ?? false,
    explosive: raw.Explosive ?? false,
    tcCapable: raw.TCCapable ?? false,
    arrayCapable: raw.ArrayCapable ?? false,
    canUseCapacitor: raw.CanUseCapacitor ?? false,
    canUseInsulator: raw.CanUseInsulator ?? false,
    canUsePulseModule: raw.CanUsePulseModule ?? false,
    canUseCaseless: raw.CanUseCaseless ?? false,
    canOS: raw.CanOS ?? false,
    canIOS: raw.CanIOS ?? false,
    canUseFCS: raw.CanUseFCS ?? false,
    clusterSize: raw.ClusterSize ?? 0,
    clusterGroup: raw.ClusterGroup ?? 0,
    clusterModShort: raw.ClusterModShort ?? 0,
    clusterModMedium: raw.ClusterModMedium ?? 0,
    clusterModLong: raw.ClusterModLong ?? 0,
    rackSize: raw.RackSize ?? 0,
    numCrits: raw.NumCrits ?? 0,
    cvSpace: raw.CVSpace ?? 0,
    tonnage: raw.Tonnage ?? 0,
    cost: raw.Cost ?? 0,
    bvOffensive: raw.OffBV ?? 0,
    bvDefensive: raw.DefBV ?? 0,
    availability: raw.Availability ?? {},
    battleForceAbilities: raw.BattleForceAbilities ?? [],
    allocHead: raw.Alloc_HD ?? false,
    allocCT: raw.Alloc_CT ?? false,
    allocTorso: raw.Alloc_Torso ?? false,
    allocArms: raw.Alloc_Arms ?? false,
    allocLegs: raw.Alloc_Legs ?? false,
    allocFront: raw.alloc_front ?? false,
    allocSides: raw.alloc_sides ?? false,
    allocRear: raw.alloc_rear ?? false,
    allocTurret: raw.alloc_turret ?? false,
    allocBody: raw.alloc_body ?? false,
    canSplit: raw.CanSplit ?? false,
    omniRestrict: raw.OmniRestrict ?? false,
    locationLinked: raw.LocationLinked ?? false,
    requiresFusion: raw.RequiresFusion ?? false,
    requiresNuclear: raw.RequiresNuclear ?? false,
    requiresPowerAmps: raw.RequiresPowerAmps ?? false,
  };
}

function normalizeAmmo(raw: RawAmmo): AmmoRule {
  const { parent, variant } = parseAmmoName(raw.LookupName);
  return {
    lookupName: raw.LookupName,
    actualName: raw.ActualName,
    parentWeaponLookup: parent,
    variant,
    megaMekName: raw.MegaMekName,
    bookReference: raw.BookRef ?? '',
    techBase: inferTechBase(raw.LookupName),
    ammoIndex: raw.AmmoIndex ?? 0,
    lotSize: raw.LotSize ?? 0,
    isCluster: raw.IsCluster ?? false,
    explosive: raw.Explosive ?? false,
    damageShort: raw.damsht ?? 0,
    damageMedium: raw.dammed ?? 0,
    damageLong: raw.damlng ?? 0,
    rangeMin: raw.minrng ?? 0,
    rangeShort: raw.srtrng ?? 0,
    rangeMedium: raw.medrng ?? 0,
    rangeLong: raw.lngrng ?? 0,
    toHitShort: raw.ToHitShort ?? 0,
    toHitMedium: raw.ToHitMedium ?? 0,
    toHitLong: raw.ToHitLong ?? 0,
    clusterGroup: raw.group ?? 0,
    weaponClass: raw.WeaponClass ?? 0,
    fcsType: raw.FCSType ?? 0,
    tonnage: raw.Tonnage ?? 0,
    cost: raw.Cost ?? 0,
    bvOffensive: raw.OffBV ?? 0,
    bvDefensive: raw.DefBV ?? 0,
    availability: raw.Availability ?? {},
    battleForceAbilities: raw.BattleForceAbilities ?? [],
  };
}

function normalizeEquipment(raw: RawEquipment): EquipmentRule {
  return {
    lookupName: raw.LookupName,
    actualName: raw.ActualName,
    megaMekName: raw.MegaMekName,
    chatName: raw.ChatName ?? '',
    category: 'Equipment',
    manualType: raw.Type ?? '',
    bookReference: raw.BookReference ?? '',
    specials: raw.Specials ?? '',
    numCrits: raw.Crits ?? 0,
    cvSpace: raw.CVSpace ?? 0,
    heat: raw.Heat ?? 0,
    tonnage: raw.Tonnage ?? 0,
    cost: raw.Cost ?? 0,
    bvOffensive: raw.OffBV ?? 0,
    bvDefensive: raw.DefBV ?? 0,
    hasAmmo: raw.HasAmmo ?? false,
    ammoPerTon: raw.LotSize ?? null,
    ammoIndex: raw.AmmoIndex ?? null,
    rangeShort: raw.ShtRange ?? 0,
    rangeMedium: raw.MedRange ?? 0,
    rangeLong: raw.LngRange ?? 0,
    explosive: raw.Explosive ?? false,
    variableSize: raw.VariableSize ?? false,
    canMountRear: raw.CanMountRear ?? false,
    availability: raw.Availability ?? {},
    battleForceAbilities: raw.BattleForceAbilities ?? [],
  };
}

function normalizePhysical(raw: RawPhysical): PhysicalRule {
  return {
    lookupName: raw.LookupName,
    actualName: raw.ActualName,
    megaMekName: raw.MegaMekName,
    chatName: raw.ChatName ?? '',
    manualType: raw.Type ?? '',
    specials: raw.Specials ?? '',
    bookReference: raw.BookReference ?? '',
    heat: raw.Heat ?? 0,
    toHitShort: raw.ToHitShort ?? 0,
    toHitMedium: raw.ToHitMedium ?? 0,
    toHitLong: raw.ToHitLong ?? 0,
    damageAdd: raw.DamageAdd ?? 0,
    damageMult: raw.DamageMult ?? 0,
    critAdd: raw.CritAdd ?? 0,
    critMult: raw.CritMult ?? 0,
    tonAdd: raw.TonAdd ?? 0,
    tonMult: raw.TonMult ?? 0,
    costAdd: raw.CostAdd ?? 0,
    costMult: raw.CostMult ?? 0,
    bvAdd: raw.BVAdd ?? 0,
    bvMult: raw.BVMult ?? 0,
    bvDefensive: raw.DefBV ?? 0,
    requiresHand: raw.RequiresHand ?? false,
    replacesHand: raw.ReplacesHand ?? false,
    requiresLowerArm: raw.RequiresLowerArm ?? false,
    replacesLowerArm: raw.ReplacesLowerArm ?? false,
    availability: raw.Availability ?? {},
    battleForceAbilities: raw.BattleForceAbilities ?? [],
  };
}

// ── Tablas normalizadas ───────────────────────────────────────

export const WEAPONS: readonly WeaponRule[] = Object.values(WEAPONS_RAW).map(normalizeWeapon);
export const EQUIPMENT: readonly EquipmentRule[] = Object.values(EQUIPMENT_RAW).map(normalizeEquipment);
export const AMMO: readonly AmmoRule[] = Object.values(AMMO_RAW).map(normalizeAmmo);
export const PHYSICALS: readonly PhysicalRule[] = Object.values(PHYSICALS_RAW).map(normalizePhysical);

// ── Hooks por arma (derivados estructuralmente) ──────────────
// Calculados una sola vez en boot, indexados por lookupName.
const HOOKS_BY_LOOKUP: Map<string, SpecialHook[]> = new Map();
for (const [k, raw] of Object.entries(WEAPONS_RAW)) {
  HOOKS_BY_LOOKUP.set(k, deriveSpecialHooks(raw));
}

export function getHooks(lookupName: string): SpecialHook[] {
  return HOOKS_BY_LOOKUP.get(lookupName) ?? [];
}

// ── Índices de búsqueda ───────────────────────────────────────

export const BY_LOOKUP: Record<string, WeaponRule> = {};
export const BY_ALIAS: Record<string, WeaponRule> = {};

for (const w of WEAPONS) {
  BY_LOOKUP[w.lookupName] = w;
  for (const a of w.aliases) BY_ALIAS[a] = w;
}

export const EQUIPMENT_BY_LOOKUP: Record<string, EquipmentRule> = {};
for (const e of EQUIPMENT) EQUIPMENT_BY_LOOKUP[e.lookupName] = e;

export const AMMO_BY_LOOKUP: Record<string, AmmoRule> = {};
export const AMMO_BY_PARENT: Record<string, AmmoRule[]> = {};
for (const a of AMMO) {
  AMMO_BY_LOOKUP[a.lookupName] = a;
  if (!AMMO_BY_PARENT[a.parentWeaponLookup]) AMMO_BY_PARENT[a.parentWeaponLookup] = [];
  AMMO_BY_PARENT[a.parentWeaponLookup].push(a);
}

export const PHYSICALS_BY_LOOKUP: Record<string, PhysicalRule> = {};
for (const p of PHYSICALS) PHYSICALS_BY_LOOKUP[p.lookupName] = p;

// ── Telemetría boot (útil en dev) ─────────────────────────────

if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
  console.log('[weapons-data] cargado:', {
    weapons: WEAPONS.length,
    equipment: EQUIPMENT.length,
    ammo: AMMO.length,
    physicals: PHYSICALS.length,
    aliases: Object.keys(BY_ALIAS).length,
  });
}
