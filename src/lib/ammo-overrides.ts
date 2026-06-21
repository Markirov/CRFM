// Overrides canon para variants de munición que SSW ammunition.json no incluye
// como entry standalone (existen solo embebidos en MML wrappers o no aparecen).
//
// Source: Tech Manual + TacOps reglas canon BattleTech.
// Schema = subset de AmmoRule (damage + range + toHit + heatToTarget).
//
// Resolución parser:
//   1. Lookup en ammunition.json (SSW canon estándar)
//   2. Si miss → lookup en OVERRIDES por (parentWeapon, variant)
//   3. Si miss en ambos → bin Standard del weapon base

export interface AmmoOverride {
  // Override stats al disparar
  damageShort: number;
  damageMedium: number;
  damageLong: number;
  rangeMin?: number;
  rangeShort?: number;
  rangeMedium?: number;
  rangeLong?: number;
  toHit?: number;             // mod toHit por ammo
  heatToTarget?: number;      // calor al target por misil/proyectil impactado
  notes?: string;
}

// Key compound: `${parentWeaponPrefix}|${variant}`
//   parentWeaponPrefix = "(IS) SRM-6"  o  "(CL) SRM-6"  o  "SRM-N" (genérico)
// Si la entry no tiene prefijo IS/CL → aplica a ambas tech bases.

export const AMMO_OVERRIDES: Record<string, AmmoOverride> = {
  // ── SRM Inferno canon: 0 dmg + 2 calor al target por misil ──
  'SRM-2|Inferno': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    heatToTarget: 2,
    notes: 'Inferno SRM: 0 daño, +2 calor target por misil impactado. Inicia incendios.',
  },
  'SRM-4|Inferno': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    heatToTarget: 2,
    notes: 'Inferno SRM: 0 daño, +2 calor target por misil impactado.',
  },
  'SRM-6|Inferno': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    heatToTarget: 2,
    notes: 'Inferno SRM: 0 daño, +2 calor target por misil impactado.',
  },

  // ── SRM Smoke: 0 dmg, crea cobertura visual (2-3 hexes) ──
  'SRM-2|Smoke': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    notes: 'Smoke SRM: 0 daño. Cobertura visual smoke 2 hexes turno siguiente.',
  },
  'SRM-4|Smoke': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    notes: 'Smoke SRM: 0 daño. Cobertura smoke.',
  },
  'SRM-6|Smoke': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    notes: 'Smoke SRM: 0 daño. Cobertura smoke.',
  },

  // ── SRM Fragmentation: anti-infantry, 0 vs mech ──
  'SRM-2|Fragmentation': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    notes: 'Fragmentation SRM: 0 daño vs mech, daño x2 vs infantería convencional.',
  },
  'SRM-4|Fragmentation': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    notes: 'Fragmentation SRM: 0 daño vs mech, daño x2 vs infantería.',
  },
  'SRM-6|Fragmentation': {
    damageShort: 0, damageMedium: 0, damageLong: 0,
    notes: 'Fragmentation SRM: 0 daño vs mech, daño x2 vs infantería.',
  },

  // ── SRM Heat Seeking: -1 toHit en targets con high heat ──
  'SRM-2|Heat Seeking': {
    damageShort: 2, damageMedium: 2, damageLong: 2,
    notes: 'Heat Seeking SRM: -1 toHit vs targets con heat >9.',
  },
  'SRM-4|Heat Seeking': {
    damageShort: 2, damageMedium: 2, damageLong: 2,
    notes: 'Heat Seeking SRM: -1 toHit vs targets con heat >9.',
  },
  'SRM-6|Heat Seeking': {
    damageShort: 2, damageMedium: 2, damageLong: 2,
    notes: 'Heat Seeking SRM: -1 toHit vs targets con heat >9.',
  },
};

/**
 * Busca override de variant si SSW ammunition.json no lo tiene.
 * familyName e.g. "SRM-6", variant e.g. "Inferno".
 */
export function lookupAmmoOverride(family: string, variant: string): AmmoOverride | null {
  if (!variant || variant === 'Standard') return null;
  const key = `${family}|${variant}`;
  return AMMO_OVERRIDES[key] ?? null;
}
