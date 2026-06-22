// ════════════════════════════════════════════════════════════════
// API canon SSW (Sprint 2). Coexiste con tabla legacy durante migración.
// Sim sigue usando MECH_WEAPON_DB hasta Sprint 3.
// ════════════════════════════════════════════════════════════════

import { BY_LOOKUP, BY_ALIAS, AMMO_BY_PARENT, AMMO_BY_LOOKUP, getHooks } from './weapons-data';
import type { WeaponRule, AmmoRule, SpecialHook } from './weapons-types';
import { lookupAmmoOverride } from './ammo-overrides';

export type { WeaponRule, AmmoRule, SpecialHook };
export { BY_LOOKUP, BY_ALIAS, AMMO_BY_PARENT, AMMO_BY_LOOKUP, getHooks };

/**
 * Normaliza nombre de arma para lookup canon SSW.
 * Maneja prefijos de orientación y entities HTML.
 *   "(R) (IS) Medium Laser"  → "(IS) Medium Laser"
 *   "(T) (CL) ER Med Laser"  → "(CL) ER Med Laser"
 *   "&apos;Mech Mortar 4"    → "'Mech Mortar 4"
 */
export function normalizeWeaponName(name: string): string {
  return name
    .replace(/^\(R\)\s*/, '')
    .replace(/^\(T\)\s*/, '')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Lookup canon: prueba lookupName, luego cualquier alias (LookupName,
 * ActualName, MegaMekName, ChatName, CritName).
 * Returns null si no encuentra.
 */
export function getWeaponStats(name: string): WeaponRule | null {
  const clean = normalizeWeaponName(name);
  return BY_LOOKUP[clean] ?? BY_ALIAS[clean] ?? null;
}

/**
 * Versión con WARN: registra en console.warn cuando un nombre no resuelve.
 * Útil durante migración para curar gaps. Usa en sim donde quieras tracking.
 */
const _missingReported = new Set<string>();
export function getWeaponStatsLogged(name: string): WeaponRule | null {
  const stats = getWeaponStats(name);
  if (!stats && !_missingReported.has(name)) {
    _missingReported.add(name);
    if (typeof console !== 'undefined') {
      console.warn(`[weapons] missing canon entry: "${name}"`);
    }
  }
  return stats;
}

/**
 * Daño por proyectil para armas con cluster (LRM 1, SRM 2, ATM-S 3, etc.).
 * SSW guarda damageShort = daño/misil para LRM/SRM. Para SRM debería ser 2,
 * verifica caso a caso al wirear sim (Sprint 3).
 */
export function getMissileDamagePerShot(stats: WeaponRule): number {
  // SSW pone damage por misil ya. Para SRM verifica que damageShort = 2.
  return stats.damageShort;
}

/**
 * Tamaño del cluster (rack size). Útil para tabla de cluster hits.
 */
export function getClusterSize(stats: WeaponRule): number {
  return stats.rackSize || stats.clusterSize || 1;
}

// ════════════════════════════════════════════════════════════════
// Formatters de display canon → legacy string compat
// ════════════════════════════════════════════════════════════════

/**
 * Damage display canon:
 *   AC/5             → "5"           (igual short/med/long, no cluster)
 *   LRM-15           → "1/m"         (per-misil + sufijo)
 *   SRM-6            → "2/m"
 *   ATM-6            → "S:3/M:2/L:1 /m"   (variable por rango + cluster)
 *   VSP Pulse        → "S:7/M:5/L:3"      (variable, no cluster)
 *   PPC              → "10"
 */
export function formatWeaponDamage(stats: WeaponRule): string {
  const { damageShort: s, damageMedium: m, damageLong: l, isCluster } = stats;
  const suffix = isCluster ? '/m' : '';
  if (s !== m || m !== l) {
    return `S:${s}/M:${m}/L:${l}${suffix ? ' ' + suffix : ''}`;
  }
  return `${s}${suffix}`;
}

/**
 * Range display canon:
 *   AC/5  rangeMin=3   → "m3/6/12/18"
 *   ML            min=0 → "3/6/9"
 *   PPC           min=3 → "m3/6/12/18"
 */
export function formatWeaponRange(stats: WeaponRule): string {
  const r = `${stats.rangeShort}/${stats.rangeMedium}/${stats.rangeLong}`;
  return stats.rangeMin > 0 ? `m${stats.rangeMin}/${r}` : r;
}

/**
 * Modifier toHit por arma — SSW ya guarda el bonus Pulse en ToHitShort/Medium/Long.
 *   Pulse Laser IS  → ToHitShort: -2
 *   ER Pulse CL     → ToHitShort: -1
 *   resto           → 0
 *
 * Usa toHitShort como representativo del arma (sim aplica el mismo a todos los rangos
 * porque Pulse mod canon no varía por rango). Para casos avanzados (variable por rango)
 * el sim puede leer toHitMedium/Long del WeaponRule directamente.
 */
export function getWeaponToHitMod(stats: WeaponRule): number {
  return stats.toHitShort;
}

// ════════════════════════════════════════════════════════════════
// Badges per arma para UI (Sprint 5.4)
// ════════════════════════════════════════════════════════════════

export interface WeaponBadge {
  label: string;      // texto corto a mostrar (ej. "P-2", "STREAK")
  title: string;      // tooltip
  kind: SpecialHook['kind'] | 'pulse_display' | 'tc_active';
  color?: 'amber' | 'red' | 'cyan' | 'green';
}

/**
 * Genera badges visuales para un weapon según sus hooks + flags del mech.
 * Para TC: requiere mechHasTC=true para aplicar el bonus -1; sino solo marca compatible.
 */
export function getWeaponBadges(
  hooks: SpecialHook[] | undefined,
  toHitMod: number | undefined,
  mechHasTC: boolean = false,
): WeaponBadge[] {
  const out: WeaponBadge[] = [];
  if (!hooks) return out;

  for (const h of hooks) {
    switch (h.kind) {
      case 'pulse_mod':
        out.push({
          label: `P${h.value}`,
          title: `Pulse Laser: ${h.value} a tirada de impacto. Aplicado ya en toHit total.`,
          kind: 'pulse_mod',
          color: 'cyan',
        });
        break;
      case 'streak_all_or_nothing':
        out.push({
          label: 'STREAK',
          title: 'Streak: todo o nada. Si fallas la tirada → 0 impactos, NO consume munición. Si aciertas → todo el rack impacta.',
          kind: 'streak_all_or_nothing',
          color: 'cyan',
        });
        break;
      case 'ultra_jam':
        out.push({
          label: 'ULTRA',
          title: 'Ultra AC: elige 1 o 2 disparos. Si disparas 2 y sacas natural 2 en toHit → arma atascada resto partida.',
          kind: 'ultra_jam',
          color: 'amber',
        });
        break;
      case 'rotary_variable':
        out.push({
          label: 'RAC',
          title: 'Rotary AC: elige cadencia 1/2/4/6 (house rule). Si cadencia >1 + tirada cadencia natural 2 → drop a cadencia inferior.',
          kind: 'rotary_variable',
          color: 'amber',
        });
        break;
      // lbx_cluster_mode: eliminado de hooks. Toggle slug/cluster ahora vía ammo selector.
      case 'one_shot':
        out.push({
          label: 'OS',
          title: 'One-Shot: el bin se consume entero al primer disparo. Sin recarga.',
          kind: 'one_shot',
          color: 'red',
        });
        break;
      case 'flamer_dual_mode':
        out.push({
          label: 'FLAMER',
          title: 'Flamer: toggle 2 daño o 2 calor al target.',
          kind: 'flamer_dual_mode',
          color: 'amber',
        });
        break;
      case 'gauss_explosion':
        out.push({
          label: 'GAUSS',
          title: `Gauss: explosión ${h.damage} de daño si recibe crit hit en el arma.`,
          kind: 'gauss_explosion',
          color: 'red',
        });
        break;
      case 'anti_infantry':
        out.push({
          label: 'AI',
          title: 'Anti-Infantry: daño x2 vs infantería convencional.',
          kind: 'anti_infantry',
          color: 'green',
        });
        break;
      case 'tc_capable':
        if (mechHasTC) {
          out.push({
            label: 'TC-1',
            title: 'Targeting Computer activo: -1 toHit aplicado.',
            kind: 'tc_active',
            color: 'cyan',
          });
        }
        // sin TC en mech → no badge (cosmetic minimal)
        break;
      case 'capacitor_capable':
        out.push({
          label: 'CAP',
          title: 'PPC + Capacitor: +5 daño/+5 calor al disparar. Riesgo de crit en capacitor.',
          kind: 'capacitor_capable',
          color: 'amber',
        });
        break;
      case 'narc_attached':
        out.push({
          label: 'NARC',
          title: 'NARC: aplica pod en target, facilita guiado de misiles.',
          kind: 'narc_attached',
          color: 'cyan',
        });
        break;
    }
  }

  // Si toHitMod es -3 (VSP Laser) y no salió como pulse_mod → forzar badge
  if (toHitMod !== undefined && toHitMod === -3 && !out.some(b => b.kind === 'pulse_mod')) {
    out.unshift({
      label: 'VSP-3',
      title: 'Variable Speed Pulse: -3 a tirada de impacto.',
      kind: 'pulse_display',
      color: 'cyan',
    });
  }

  return out;
}

// ════════════════════════════════════════════════════════════════
// Damage grouper (House rule Sprint 5.5)
// ════════════════════════════════════════════════════════════════

/**
 * Agrupa el daño total en grupos preferidos. Solo aplica a misiles cluster.
 *
 * Reglas casa:
 *   - Secuencia preferida: 5 > 6 > 4 > 3 > 2 > 1
 *   - El residuo 1 sobrante se absorbe en un grupo de 5 → 6 (única "subida")
 *   - Cualquier otro residuo (2/3/4) queda como grupo separado de su tamaño
 *   - Aplicado por arma individual (no acumula entre armas)
 *
 * Ejemplos:
 *   5  → [5]              6  → [6]
 *   7  → [5, 2]           8  → [5, 3]
 *   9  → [5, 4]           10 → [5, 5]
 *   11 → [5, 6]           12 → [5, 5, 2]
 *   13 → [5, 5, 3]        14 → [5, 5, 4]
 *   15 → [5, 5, 5]        16 → [5, 5, 6]
 *   4  → [4]              3  → [3]    1 → [1]
 */
export function groupMissileDamage(total: number): number[] {
  if (total <= 0) return [];
  const Q = Math.floor(total / 5);
  const R = total % 5;
  if (R === 0) return Array(Q).fill(5);
  if (R === 1 && Q >= 1) return [...Array(Q - 1).fill(5), 6];
  // R = 2, 3, 4  → Q grupos de 5 + 1 grupo R
  // R = 1, Q = 0 → [1] (no hay 5 al que sumar el 1)
  return [...Array(Q).fill(5), R];
}

// ════════════════════════════════════════════════════════════════
// Modes per weapon (Sprint 5.4)
// ════════════════════════════════════════════════════════════════

export type FlamerMode = 'damage' | 'heat';
export type LBXMode = 'slug' | 'cluster';
export type UltraMode = '1' | '2';
export type RACMode = '1' | '2' | '4' | '6';
export type WeaponMode = FlamerMode | LBXMode | UltraMode | RACMode;

/** Modo por defecto según hooks del arma. LBX cluster/slug NO está aquí — lo cubre ammo selector. */
export function getDefaultMode(hooks: SpecialHook[] | undefined): WeaponMode | null {
  if (!hooks) return null;
  if (hooks.some(h => h.kind === 'flamer_dual_mode')) return 'damage';
  if (hooks.some(h => h.kind === 'ultra_jam')) return '1';
  if (hooks.some(h => h.kind === 'rotary_variable')) return '1';
  return null;
}

/** Ciclo del modo al hacer click en el badge. */
export function cycleMode(hooks: SpecialHook[] | undefined, current: WeaponMode | undefined): WeaponMode | null {
  if (!hooks) return null;
  if (hooks.some(h => h.kind === 'flamer_dual_mode')) {
    return current === 'damage' ? 'heat' : 'damage';
  }
  if (hooks.some(h => h.kind === 'ultra_jam')) {
    return current === '1' ? '2' : '1';
  }
  if (hooks.some(h => h.kind === 'rotary_variable')) {
    const order: RACMode[] = ['1', '2', '4', '6'];
    const idx = order.indexOf((current as RACMode) ?? '1');
    return order[(idx + 1) % order.length];
  }
  return null;
}

/** ¿El arma tiene modo seleccionable? */
export function hasMode(hooks: SpecialHook[] | undefined): boolean {
  if (!hooks) return false;
  return hooks.some(h =>
    h.kind === 'flamer_dual_mode' ||
    h.kind === 'ultra_jam' ||
    h.kind === 'rotary_variable'
  );
}

/**
 * Detecta si el mech tiene Targeting Computer instalado.
 * Scan de crits en busca de "Targeting Computer".
 */
export function mechHasTargetingComputer(
  crits: Record<string, Array<{ name: string } | string | null>> | undefined,
): boolean {
  if (!crits) return false;
  for (const slots of Object.values(crits)) {
    if (!slots) continue;
    for (const slot of slots) {
      if (!slot) continue;
      const name = typeof slot === 'string' ? slot : (slot.name ?? '');
      if (/Targeting Computer/i.test(name)) return true;
    }
  }
  return false;
}

/**
 * Detecta variant del nombre canónico de un bin de munición.
 *   "(IS) @ AC/2 (Armor-Piercing)" → "Armor-Piercing"
 *   "(IS) @ AC/2"                  → "Standard"
 *   "@ SRM-2 (Inferno)"            → "Inferno"
 *   "(IS) @ LB 10-X AC (Cluster)"  → "Cluster"
 */
export function parseAmmoVariant(ammoName: string): string {
  const m = ammoName.match(/\(([^)]+)\)\s*$/);
  if (!m) return 'Standard';
  const v = m[1].trim();
  // Filtra los prefijos tech (no son variants)
  if (/^(IS|CL|Clan)$/i.test(v)) return 'Standard';
  return v;
}

/**
 * Resuelve stats del bin de ammo con variant.
 * 1. Lookup en ammunition.json canon
 * 2. Fallback overrides Inferno/Smoke/Fragmentation
 * 3. Devuelve undefined si no aplica override (= Standard base)
 */
export function getAmmoVariantOverride(family: string, variant: string, tech: 'IS' | 'CL'): import('./weapons-types').AmmoRule | import('./ammo-overrides').AmmoOverride | null {
  if (!variant || variant === 'Standard') return null;

  // Try canon SSW: "(IS) @ SRM-6 (Inferno)"
  const sswKey = `(${tech}) @ ${family} (${variant})`;
  const sswHit = AMMO_BY_LOOKUP[sswKey];
  if (sswHit) return sswHit;

  // Fallback overrides manuales
  return lookupAmmoOverride(family, variant);
}

/**
 * Mapea family legacy → SSW lookupName.
 *
 * SSW NO unifica AC. Standard "Autocannon/X", variantes mantienen "AC":
 *   ("AC/5", "IS")          → "(IS) Autocannon/5"
 *   ("Ultra AC/5", "IS")    → "(IS) Ultra AC/5"     (no se transforma)
 *   ("Light AC/5", "IS")    → "(IS) Light AC/5"     (no se transforma)
 *   ("LBX AC/10", "IS")     → "(IS) LB 10-X AC"
 *   ("Rotary AC/5", "IS")   → "(IS) Rotary AC/5"
 *
 *   ("LRM-15", "IS")        → "(IS) LRM-15"
 *   ("SRM-6", "IS")         → "(IS) SRM-6"
 *   ("Streak SRM-6", "CL")  → "(CL) Streak SRM-6"
 *   ("Gauss Rifle", "IS")   → "(IS) Gauss Rifle"
 *   ("Heavy Gauss", "IS")   → "(IS) Heavy Gauss Rifle"
 *   ("Light Gauss", "IS")   → "(IS) Light Gauss Rifle"
 *   ("Machine Gun", "IS")   → "(IS) Machine Gun"
 */
export function legacyFamilyToLookup(family: string, tech: 'IS' | 'CL'): string {
  let f = family.trim();

  // LBX AC/X → LB X-X AC  (formato especial canon)
  f = f.replace(/^LBX AC\/(\d+)$/i, 'LB $1-X AC');

  // Standard AC/X → Autocannon/X. NO toca variantes (Ultra/Light/Rotary).
  if (/^AC\/\d+$/i.test(f)) {
    f = f.replace(/^AC\/(\d+)$/i, 'Autocannon/$1');
  }

  // Gauss alias
  f = f.replace(/^Heavy Gauss$/i, 'Heavy Gauss Rifle');
  f = f.replace(/^Light Gauss$/i, 'Light Gauss Rifle');

  return `(${tech}) ${f}`;
}

// ════════════════════════════════════════════════════════════════
// Builder de entry para parsers — única fuente del weapon object.
// ════════════════════════════════════════════════════════════════

export interface BuildWeaponInput {
  id: number;
  name: string;
  rawName: string;
  loc: string;
  locRaw: string;
  stats: WeaponRule | null;
  ammo: number | null;
  ammoMax: number | null;
  slotIndices: number[];
}

export interface ParsedWeapon {
  // ── Identificación ──
  id: number;
  name: string;
  rawName: string;
  loc: string;
  locRaw: string;
  ammo: number | null;
  ammoMax: number | null;
  count: 1;
  slotIndices: number[];

  // ── Legacy display compat ──
  heat: number;
  dmg: string;
  r: string;

  // ── Canon completo ──
  lookupName: string;
  damageShort: number;
  damageMedium: number;
  damageLong: number;
  rangeMin: number;
  rangeShort: number;
  rangeMedium: number;
  rangeLong: number;
  isCluster: boolean;
  rackSize: number;
  toHitMod: number;
  weaponClass: string;
  techBase: 'IS' | 'CL';
  hasAmmo: boolean;
  ammoPerTon: number | null;
  hooks: SpecialHook[];
}

/**
 * Construye el weapon embebido en MechState desde stats SSW.
 * Cuando stats == null (arma desconocida): fallback con valores '?' / 0
 * para que sim no rompa.
 */
export function buildWeaponEntry(input: BuildWeaponInput): ParsedWeapon {
  const { id, name, rawName, loc, locRaw, stats, ammo, ammoMax, slotIndices } = input;

  if (!stats) {
    return {
      id, name, rawName, loc, locRaw,
      ammo, ammoMax, count: 1, slotIndices,
      heat: 0, dmg: '?', r: '?',
      lookupName: rawName,
      damageShort: 0, damageMedium: 0, damageLong: 0,
      rangeMin: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0,
      isCluster: false, rackSize: 0,
      toHitMod: 0, weaponClass: 'OTHER', techBase: 'IS',
      hasAmmo: false, ammoPerTon: null,
      hooks: [],
    };
  }

  return {
    id, name, rawName, loc, locRaw,
    ammo, ammoMax, count: 1, slotIndices,
    heat: stats.heat,
    dmg: formatWeaponDamage(stats),
    r: formatWeaponRange(stats),
    lookupName: stats.lookupName,
    damageShort: stats.damageShort,
    damageMedium: stats.damageMedium,
    damageLong: stats.damageLong,
    rangeMin: stats.rangeMin,
    rangeShort: stats.rangeShort,
    rangeMedium: stats.rangeMedium,
    rangeLong: stats.rangeLong,
    isCluster: stats.isCluster,
    rackSize: stats.rackSize,
    toHitMod: getWeaponToHitMod(stats),
    weaponClass: stats.weaponClass,
    techBase: stats.techBase,
    hasAmmo: stats.hasAmmo,
    ammoPerTon: stats.ammoPerTon,
    hooks: getHooks(stats.lookupName),
  };
}

// ════════════════════════════════════════════════════════════════
// Tabla LEGACY (a borrar en Sprint 3 tras wire sim + audit 100%).
// ════════════════════════════════════════════════════════════════

export const MECH_AMMO_PER_TON: Record<string, number> = {
  'Machine Gun': 200,
  'Light Machine Gun': 200,
  'Heavy Machine Gun': 100,
  'AC/2': 45, 'AC/5': 20, 'AC/10': 10, 'AC/20': 5,
  'Ultra AC/2': 45, 'Ultra AC/5': 20, 'Ultra AC/10': 10, 'Ultra AC/20': 5,
  'LBX AC/2': 45, 'LBX AC/5': 20, 'LBX AC/10': 10, 'LBX AC/20': 5,
  'Light AC/2': 45, 'Light AC/5': 20,
  'Gauss Rifle': 8, 'Heavy Gauss': 4, 'Light Gauss': 16,
  'LRM-5': 24, 'LRM-10': 12, 'LRM-15': 8, 'LRM-20': 6,
  'SRM-2': 50, 'SRM-4': 25, 'SRM-6': 15,
  'Streak SRM-2': 50, 'Streak SRM-4': 25, 'Streak SRM-6': 15
};

export const MECH_WEAPON_DB: Record<string, any> = {
  'ISSmallLaser':{'d':'Small Laser','h':1,'dm':'3','r':'1/2/3'},
  'Small Laser':{'d':'Small Laser','h':1,'dm':'3','r':'1/2/3'},
  'ISMediumLaser':{'d':'Medium Laser','h':3,'dm':'5','r':'3/6/9'},
  'ISLargeLaser':{'d':'Large Laser','h':8,'dm':'8','r':'5/10/15'},
  'ISERSmallLaser':{'d':'ER Small Laser','h':2,'dm':'3','r':'2/4/6'},
  'ISERMediumLaser':{'d':'ER Med Laser','h':5,'dm':'5','r':'4/8/12'},
  'ISERLargeLaser':{'d':'ER Lrg Laser','h':12,'dm':'8','r':'7/14/19'},
  'ISERPPC':{'d':'ER PPC','h':15,'dm':'10','r':'7/14/23'},
  'ISERPPCCanon':{'d':'ER PPC','h':15,'dm':'10','r':'7/14/23'},
  'ISPPC':{'d':'PPC','h':10,'dm':'10','r':'6/12/18'},
  'ISSnPPC':{'d':'Snub PPC','h':10,'dm':'10','r':'3/6/10'},
  'ISMediumPulseLaser':{'d':'Med Pulse Laser','h':4,'dm':'6','r':'2/4/6'},
  'ISLargePulseLaser':{'d':'Lrg Pulse Laser','h':10,'dm':'9','r':'3/7/10'},
  'ISSmallPulseLaser':{'d':'Sm Pulse Laser','h':2,'dm':'3','r':'1/2/3'},
  'ISFlamer':{'d':'Flamer','h':3,'dm':'2','r':'1/2/3'},
  'ISAC2':{'d':'AC/2','h':1,'dm':'2','r':'8/16/24'},'ISAC5':{'d':'AC/5','h':1,'dm':'5','r':'6/12/18'},
  'ISAC10':{'d':'AC/10','h':3,'dm':'10','r':'5/10/15'},'ISAC20':{'d':'AC/20','h':7,'dm':'20','r':'3/6/9'},
  'ISUltraAC2':{'d':'Ultra AC/2','h':1,'dm':'2','r':'9/18/27'},'ISUltraAC5':{'d':'Ultra AC/5','h':1,'dm':'5','r':'7/14/21'},
  'ISUltraAC10':{'d':'Ultra AC/10','h':4,'dm':'10','r':'6/12/18'},'ISUltraAC20':{'d':'Ultra AC/20','h':8,'dm':'20','r':'4/8/12'},
  'ISLBXAC2':{'d':'LBX AC/2','h':1,'dm':'2','r':'9/18/27'},'ISLBXAC5':{'d':'LBX AC/5','h':1,'dm':'5','r':'7/14/21'},
  'ISLBXAC10':{'d':'LBX AC/10','h':2,'dm':'10','r':'6/12/18'},'ISLBXAC20':{'d':'LBX AC/20','h':6,'dm':'20','r':'4/8/12'},
  'ISLightAC2':{'d':'Light AC/2','h':1,'dm':'2','r':'6/12/18'},'ISLightAC5':{'d':'Light AC/5','h':2,'dm':'5','r':'5/10/15'},
  'ISLAC2':{'d':'Light AC/2','h':1,'dm':'2','r':'6/12/18'},'ISLAC5':{'d':'Light AC/5','h':2,'dm':'5','r':'5/10/15'},
  'ISGaussRifle':{'d':'Gauss Rifle','h':1,'dm':'15','r':'7/15/22'},'ISHGaussRifle':{'d':'Heavy Gauss','h':2,'dm':'25','r':'4/8/16'},
  'ISLGaussRifle':{'d':'Light Gauss','h':1,'dm':'8','r':'8/17/25'},'ISMachineGun':{'d':'Machine Gun','h':0,'dm':'2','r':'1/2/3'},
  'ISRotaryAC2':{'d':'RAC/2','h':6,'dm':'2','r':'8/17/25'},'ISRotaryAC5':{'d':'RAC/5','h':6,'dm':'5','r':'5/10/15'},
  'ISLRM5':{'d':'LRM-5','h':2,'dm':'1/m','r':'7/14/21'},'ISLRM10':{'d':'LRM-10','h':4,'dm':'1/m','r':'7/14/21'},
  'ISLRM15':{'d':'LRM-15','h':5,'dm':'1/m','r':'7/14/21'},'ISLRM20':{'d':'LRM-20','h':6,'dm':'1/m','r':'7/14/21'},
  'ISSRM2':{'d':'SRM-2','h':2,'dm':'2/m','r':'3/6/9'},'ISSRM4':{'d':'SRM-4','h':3,'dm':'2/m','r':'3/6/9'},
  'ISSRM6':{'d':'SRM-6','h':4,'dm':'2/m','r':'3/6/9'},
  'ISStreakSRM2':{'d':'Streak SRM-2','h':2,'dm':'2/m','r':'3/6/9'},'ISStreakSRM4':{'d':'Streak SRM-4','h':3,'dm':'2/m','r':'3/6/9'},
  'ISStreakSRM6':{'d':'Streak SRM-6','h':4,'dm':'2/m','r':'3/6/9'},
  'CLERMediumLaser':{'d':'(CL) ER Med Laser','h':5,'dm':'7','r':'5/10/15'},
  'CLERLargeLaser':{'d':'(CL) ER Lrg Laser','h':12,'dm':'10','r':'8/15/25'},
  'CLERPPC':{'d':'(CL) ER PPC','h':15,'dm':'15','r':'7/14/23'},
  'CLGaussRifle':{'d':'(CL) Gauss Rifle','h':1,'dm':'15','r':'7/15/22'},
  'CLUltraAC20':{'d':'(CL) Ultra AC/20','h':7,'dm':'20','r':'4/8/12'},
  'CLSRM6':{'d':'(CL) SRM-6','h':4,'dm':'2/m','r':'3/6/9'},
  'CLStreakSRM6':{'d':'(CL) Streak SRM-6','h':4,'dm':'2/m','r':'3/6/9'},
  'CLLRM20':{'d':'(CL) LRM-20','h':6,'dm':'1/m','r':'7/14/21'},
  'Medium Laser':{'d':'Medium Laser','h':3,'dm':'5','r':'3/6/9'},
  'Large Laser':{'d':'Large Laser','h':8,'dm':'8','r':'5/10/15'},
  'PPC':{'d':'PPC','h':10,'dm':'10','r':'6/12/18'},
  'ER Medium Laser':{'d':'ER Med Laser','h':5,'dm':'5','r':'4/8/12'},
  'ER Large Laser':{'d':'ER Lrg Laser','h':12,'dm':'8','r':'7/14/19'},
  'SRM 2':{'d':'SRM-2','h':2,'dm':'2/m','r':'3/6/9'},'SRM 4':{'d':'SRM-4','h':3,'dm':'2/m','r':'3/6/9'},
  'SRM 6':{'d':'SRM-6','h':4,'dm':'2/m','r':'3/6/9'},
  'LRM 5':{'d':'LRM-5','h':2,'dm':'1/m','r':'7/14/21'},'LRM 10':{'d':'LRM-10','h':4,'dm':'1/m','r':'7/14/21'},
  'LRM 15':{'d':'LRM-15','h':5,'dm':'1/m','r':'7/14/21'},'LRM 20':{'d':'LRM-20','h':6,'dm':'1/m','r':'7/14/21'},
  'Autocannon/2':{'d':'AC/2','h':1,'dm':'2','r':'8/16/24'},'Autocannon/5':{'d':'AC/5','h':1,'dm':'5','r':'6/12/18'},
  'Autocannon/10':{'d':'AC/10','h':3,'dm':'10','r':'5/10/15'},'Autocannon/20':{'d':'AC/20','h':7,'dm':'20','r':'3/6/9'},
  'Gauss Rifle':{'d':'Gauss Rifle','h':1,'dm':'15','r':'7/15/22'},
  'Light AC/2':{'d':'Light AC/2','h':1,'dm':'2','r':'6/12/18'},'Light AC/5':{'d':'Light AC/5','h':2,'dm':'5','r':'5/10/15'},
};

export const WEAPONS_MIN_EMBEDDED: Record<string, any> = {
  "(CL) ER Large Laser": { "Heat": 12, "DamSht": 10, "RngSht": 8, "RngMed": 15, "RngLng": 25, "HasAmmo": false, "IsCluster": false },
  "(CL) ER Medium Laser": { "Heat": 5, "DamSht": 7, "RngSht": 5, "RngMed": 10, "RngLng": 15, "HasAmmo": false, "IsCluster": false },
  "(CL) ER Small Laser": { "Heat": 2, "DamSht": 5, "RngSht": 2, "RngMed": 4, "RngLng": 6, "HasAmmo": false, "IsCluster": false },
  "(CL) ER PPC": { "Heat": 15, "DamSht": 15, "RngSht": 7, "RngMed": 14, "RngLng": 23, "HasAmmo": false, "IsCluster": false },
  "(CL) Gauss Rifle": { "Heat": 1, "DamSht": 15, "RngSht": 7, "RngMed": 15, "RngLng": 22, "HasAmmo": true, "IsCluster": false },
  "(CL) LRM-20": { "Heat": 6, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(CL) LRM-15": { "Heat": 5, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(CL) LRM-10": { "Heat": 4, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(CL) LRM-5": { "Heat": 2, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(CL) SRM-6": { "Heat": 4, "DamSht": 2, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": true },
  "(CL) SRM-4": { "Heat": 3, "DamSht": 2, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": true },
  "(CL) SRM-2": { "Heat": 2, "DamSht": 2, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": true },
  "(CL) Streak SRM-6": { "Heat": 4, "DamSht": 2, "RngSht": 4, "RngMed": 8, "RngLng": 12, "HasAmmo": true, "IsCluster": true },
  "(CL) Ultra AC/20": { "Heat": 7, "DamSht": 20, "RngSht": 4, "RngMed": 8, "RngLng": 12, "HasAmmo": true, "IsCluster": true },
  "(CL) Ultra AC/10": { "Heat": 3, "DamSht": 10, "RngSht": 6, "RngMed": 12, "RngLng": 18, "HasAmmo": true, "IsCluster": true },
  "(CL) Ultra AC/5": { "Heat": 1, "DamSht": 5, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(CL) Ultra AC/2": { "Heat": 1, "DamSht": 2, "RngSht": 9, "RngMed": 18, "RngLng": 27, "HasAmmo": true, "IsCluster": true },
  "(CL) LB 20-X AC": { "Heat": 6, "DamSht": 20, "RngSht": 4, "RngMed": 8, "RngLng": 12, "HasAmmo": true, "IsCluster": true },
  "(CL) LB 10-X AC": { "Heat": 2, "DamSht": 10, "RngSht": 6, "RngMed": 12, "RngLng": 18, "HasAmmo": true, "IsCluster": true },
  "(CL) Machine Gun": { "Heat": 0, "DamSht": 2, "RngSht": 1, "RngMed": 2, "RngLng": 3, "HasAmmo": true, "IsCluster": false },
  "(IS) Autocannon/20": { "Heat": 7, "DamSht": 20, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": false },
  "(IS) Autocannon/10": { "Heat": 3, "DamSht": 10, "RngSht": 5, "RngMed": 10, "RngLng": 15, "HasAmmo": true, "IsCluster": false },
  "(IS) Autocannon/5": { "Heat": 1, "DamSht": 5, "RngSht": 6, "RngMed": 12, "RngLng": 18, "HasAmmo": true, "IsCluster": false },
  "(IS) Autocannon/2": { "Heat": 1, "DamSht": 2, "RngSht": 8, "RngMed": 16, "RngLng": 24, "HasAmmo": true, "IsCluster": false },
  "(IS) LRM-20": { "Heat": 6, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(IS) LRM-15": { "Heat": 5, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(IS) LRM-10": { "Heat": 4, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(IS) LRM-5": { "Heat": 2, "DamSht": 1, "RngSht": 7, "RngMed": 14, "RngLng": 21, "HasAmmo": true, "IsCluster": true },
  "(IS) SRM-6": { "Heat": 4, "DamSht": 2, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": true },
  "(IS) SRM-4": { "Heat": 3, "DamSht": 2, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": true },
  "(IS) SRM-2": { "Heat": 2, "DamSht": 2, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": true, "IsCluster": true },
  "(IS) Machine Gun": { "Heat": 0, "DamSht": 2, "RngSht": 1, "RngMed": 2, "RngLng": 3, "HasAmmo": true, "IsCluster": false },
  "(IS) Flamer": { "Heat": 3, "DamSht": 2, "RngSht": 1, "RngMed": 2, "RngLng": 3, "HasAmmo": false, "IsCluster": false },
  "(IS) Medium Laser": { "Heat": 3, "DamSht": 5, "RngSht": 3, "RngMed": 6, "RngLng": 9, "HasAmmo": false, "IsCluster": false },
  "(IS) Large Laser": { "Heat": 8, "DamSht": 8, "RngSht": 5, "RngMed": 10, "RngLng": 15, "HasAmmo": false, "IsCluster": false },
  "(IS) Small Laser": { "Heat": 1, "DamSht": 3, "RngSht": 1, "RngMed": 2, "RngLng": 3, "HasAmmo": false, "IsCluster": false },
  "(IS) PPC": { "Heat": 10, "DamSht": 10, "RngSht": 6, "RngMed": 12, "RngLng": 18, "HasAmmo": false, "IsCluster": false },
};

export function weaponMiniToDbEntry(rec: any, fallbackName: string){
  const heat = parseInt(rec?.Heat, 10);
  const dSht = rec?.DamSht;
  const dmgBase = (dSht === null || dSht === undefined || dSht === '') ? '?' : String(dSht);
  const type = String(rec?.type || '').toUpperCase();
  const isCluster = !!rec?.IsCluster || /^(LRM|SRM|MRM|LRT|SRT|ATM)/.test(type);
  const dmg = (isCluster && dmgBase !== '?') ? (dmgBase + '/m') : dmgBase;

  const rs = (rec?.RngSht ?? '?');
  const rm = (rec?.RngMed ?? '?');
  const rl = (rec?.RngLng ?? '?');

  return {
    d: String(rec?.ActualName || fallbackName || 'Arma'),
    h: Number.isFinite(heat) ? heat : 0,
    dm: dmg,
    r: `${rs}/${rm}/${rl}`
  };
}

export function weaponMiniAddAlias(alias: string, entry: any){
  const k = String(alias || '').trim();
  if(!k) return;

  const existing = MECH_WEAPON_DB[k];
  if(!existing){
    MECH_WEAPON_DB[k] = entry;
    return;
  }

  const exName = String(existing?.d || '');
  const nwName = String(entry?.d || '');
  const exProto = /prototype/i.test(exName);
  const nwProto = /prototype/i.test(nwName);
  if(exProto && !nwProto){
    MECH_WEAPON_DB[k] = entry;
  }
}

export function weaponMiniHydrateDatabase(data: any){
  if(!data || typeof data !== 'object') return;
  for(const [lookupName, rec] of Object.entries(data)){
    const entry = weaponMiniToDbEntry(rec, lookupName);
    const mega = String((rec as any)?.MegaMekName || '').trim();
    const actual = String((rec as any)?.ActualName || '').trim();
    const cleanLookup = String(lookupName || '')
      .replace(/^\((IS|CL|CLAN)\)\s*/i, '')
      .trim();

    weaponMiniAddAlias(lookupName, entry);
    weaponMiniAddAlias(cleanLookup, entry);
    weaponMiniAddAlias(mega, entry);
    weaponMiniAddAlias(actual, entry);
  }
}

// Initialize the DB
weaponMiniHydrateDatabase(WEAPONS_MIN_EMBEDDED);

export function mwLookup(name: string){
  if(!name)return null;
  const base = name.replace(/\s*\((R|Rear|T|Turret)\)\s*$/i,'').trim();
  if(MECH_WEAPON_DB[base])return MECH_WEAPON_DB[base];
  if(MECH_WEAPON_DB[name])return MECH_WEAPON_DB[name];
  const c=base.replace(/^\(IS\)\s*/i,'').replace(/^\(CL\)\s*/i,'').trim();
  if(MECH_WEAPON_DB[c])return MECH_WEAPON_DB[c];
  const n=c.replace(/\s+/g,'').replace(/\//g,'').replace(/-/g,'');
  for(const[k,v]of Object.entries(MECH_WEAPON_DB)){
    if(k.replace(/\s+/g,'').replace(/\//g,'').replace(/-/g,'').toLowerCase()===n.toLowerCase())return v;
  }
  return null;
}

export function mechAmmoFamilyFromWeaponName(name: string){
  const n=String(name||'').trim()
    .replace(/^@\s*/,'')
    .replace(/^\((IS|CL|CLAN)\)\s*/i,'')
    .replace(/^(IS|CL|CLAN)\s*/i,'')
    .replace(/^Ammo\s+/i,'')        // "IS Ammo LRM-10" → strip "Ammo " prefix
    .replace(/\bAMMO\b.*$/i,'')
    .replace(/\(.*?\)/g,'')
    .replace(/\bAuto\s*[Cc]annon\b/g,'AC')
    .replace(/\s+/g,' ')
    .trim();

  const m=n.match(/\b((?:Ultra\s*|LBX\s*|Light\s*)?AC\s*\/?\s*\d+|LRM[-\s/]?\d+|SRM[-\s/]?\d+|Streak\s*SRM[-\s/]?\d+|Gauss\s*Rifle|Heavy\s*Gauss|Light\s*Gauss|Heavy\s*Machine\s*Gun|Light\s*Machine\s*Gun|Machine\s*Gun|HMG|LMG|MG)\b/i);
  if(!m) return null;

  let f=m[1].replace(/\s+/g,' ').trim();
  f=f.replace(/^((?:Ultra|LBX|Light)\s*)?AC\s*\/?\s*(\d+)$/i,(_,pre,num)=>(pre?pre.trim()+' ':'')+'AC/'+num);
  f=f.replace(/^LRM[-\s/]?(\d+)$/i,'LRM-$1').replace(/^SRM[-\s/]?(\d+)$/i,'SRM-$1').replace(/^Streak\s*SRM[-\s/]?(\d+)$/i,'Streak SRM-$1');
  f=f.replace(/^Ultra\s*AC\/?(\d+)$/i,'Ultra AC/$1').replace(/^LBX\s*AC\/?(\d+)$/i,'LBX AC/$1').replace(/^Light\s*AC\/?(\d+)$/i,'Light AC/$1');
  f=f.replace(/^HMG$/i,'Heavy Machine Gun').replace(/^LMG$/i,'Light Machine Gun').replace(/^MG$/i,'Machine Gun');
  f=f.replace(/^Gauss\s*Rifle$/i,'Gauss Rifle').replace(/^Heavy\s*Gauss$/i,'Heavy Gauss').replace(/^Light\s*Gauss$/i,'Light Gauss').replace(/^Machine\s*Gun$/i,'Machine Gun');

  return f;
}

export function mechAmmoTechFromName(name: string){
  const n=String(name||'').trim();
  if(/^\(CL\)/i.test(n) || /\bCLAN\b/i.test(n)) return 'CL';
  if(/^\(IS\)/i.test(n) || /\bINNER\s*SPHERE\b/i.test(n)) return 'IS';
  return 'IS';
}

export function mechAmmoErTagFromName(name: string){
  return /\bER\b/i.test(String(name||'')) ? 'ER' : 'STD';
}

export function mechAmmoMetaForWeapon(w: any){
  const src = String(w?.rawName || w?.name || '');
  const fam = mechAmmoFamilyFromWeaponName(src);
  if(!fam) return { family:null, familyKey:null, perTon:null, use:0, usesAmmo:false };
  const tech = mechAmmoTechFromName(src);
  const er = mechAmmoErTagFromName(src);
  const perTon = MECH_AMMO_PER_TON[fam] || null;
  const familyKey = tech+ ':' + er + ':' + fam;
  return { family:fam, familyKey, perTon:perTon, use:1, usesAmmo:true };
}

export function mechNormEquipName(n: string){
  return String(n||'')
    .normalize('NFKD')
    .replace(/^\d+\.\s*/,'')
    .replace(/\s*\((R|Rear|T|Turret)\)\s*$/i,'')
    .replace(/^\(?(IS|CL|Clan)\)?\s*/i,'')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g,'');
}

export function mechIsAmmoCrit(name: string){
  const n = String(name||'');
  const nl = n.toLowerCase();
  if(nl.includes('ammo') || nl.includes('municion') || nl.includes('munición')) return true;
  if(n.includes('@')) return true;
  return false;
}
