// ══════════════════════════════════════════════════════════════
//  maintenance-engine.ts — Mantenimiento rutinario por Quality Rating.
//  Spec: herramientas/MD/spec_unificado_y_mantenimiento.md §2.
//
//  Calcula TN, resuelve Maintenance Check Table (MoS/MoF), tira en
//  'Mech Damage Status Table → DamagePatch[], y aplica patches sobre
//  un MechRepairDamage para alimentar el flujo de Prioridades.
// ══════════════════════════════════════════════════════════════

import type { MechRepairDamage } from './repair-engine';

// ── Tipos base ────────────────────────────────────────────────

export type QualityRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Cost Modifier canon por Quality Rating (compra/venta, y mantenimiento). */
export const QUALITY_COST_MOD: Record<QualityRating, number> = {
  A: 0.8, B: 0.9, C: 0.95, D: 1.0, E: 1.1, F: 1.3,
};

/** Modificador al TN de Maintenance Check según Quality Rating actual. */
export const QUALITY_TN_MOD: Record<QualityRating, number> = {
  A: 3, B: 2, C: 1, D: 0, E: -1, F: -2,
};

/** Modificador al TN según Tech Rating del chasis (A-F). */
export const TECH_RATING_TN_MOD: Record<string, number> = {
  A: -4, B: -2, C: 0, D: 1, E: 2, F: 3,
};

export const TN_BASE_EXPERIENCIA = {
  Green: 8, Regular: 7, Veteran: 6, Elite: 5,
} as const;
export type ExperienciaEquipo = keyof typeof TN_BASE_EXPERIENCIA;

export type ClaseMech = 'UltraLigero' | 'Ligero' | 'Medio' | 'Pesado' | 'Asalto';

export function clasePorTonelaje(tons: number): ClaseMech {
  if (tons <= 20) return 'UltraLigero';
  if (tons <= 35) return 'Ligero';
  if (tons <= 55) return 'Medio';
  if (tons <= 75) return 'Pesado';
  return 'Asalto';
}

/** Tiempo de mantenimiento rutinario (informativo; NO compite con Prioridades). */
export const TIEMPO_MANTENIMIENTO: Record<ClaseMech, number> = {
  UltraLigero: 30, Ligero: 45, Medio: 60, Pesado: 75, Asalto: 90,
};

/** Coste base de mantenimiento por ciclo, antes de aplicar QUALITY_COST_MOD. */
export const COSTE_MANTENIMIENTO_BASE: Record<ClaseMech, number> = {
  UltraLigero: 5_000, Ligero: 10_000, Medio: 20_000, Pesado: 35_000, Asalto: 50_000,
};

export function calcularCosteMantenimiento(tons: number, quality: QualityRating): number {
  const clase = clasePorTonelaje(tons);
  return Math.round(COSTE_MANTENIMIENTO_BASE[clase] * QUALITY_COST_MOD[quality]);
}

export function calcularTNMantenimiento(
  experiencia: ExperienciaEquipo,
  techRating: string,
  quality: QualityRating,
  modCondiciones = 0,
): number {
  return TN_BASE_EXPERIENCIA[experiencia]
    + (TECH_RATING_TN_MOD[techRating] ?? 0)
    + QUALITY_TN_MOD[quality]
    + modCondiciones;
}

export function roll2D6(): number {
  return 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6);
}

export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

// ── Maintenance Check Table (matrices MoS/MoF) ────────────────

export interface ResultadoCelda {
  cambioQuality?: QualityRating;
  tiradasDano?: number;
  experienciaExtra?: boolean; // solo F + MoS6+
}

const VACIO: ResultadoCelda = {};

/** Filas índice 0..6 = MoF 1..7+ */
export const MAINTENANCE_CHECK_TABLE_MOF: Record<QualityRating, ResultadoCelda>[] = [
  /* MoF 1  */ { A: VACIO, B: VACIO, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoF 2  */ { A: { tiradasDano: 1 }, B: VACIO, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoF 3  */ { A: { tiradasDano: 1 }, B: { tiradasDano: 1 }, C: VACIO, D: VACIO, E: { cambioQuality: 'D' }, F: { cambioQuality: 'E' } },
  /* MoF 4  */ { A: { tiradasDano: 2 }, B: { tiradasDano: 1 }, C: { tiradasDano: 1 }, D: { cambioQuality: 'C' }, E: { cambioQuality: 'D' }, F: { cambioQuality: 'E' } },
  /* MoF 5  */ { A: { tiradasDano: 3 }, B: { tiradasDano: 1 }, C: { cambioQuality: 'B', tiradasDano: 1 }, D: { cambioQuality: 'C', tiradasDano: 1 }, E: { cambioQuality: 'D' }, F: { cambioQuality: 'E' } },
  /* MoF 6  */ { A: { tiradasDano: 3 }, B: { cambioQuality: 'A', tiradasDano: 1 }, C: { cambioQuality: 'B', tiradasDano: 1 }, D: { cambioQuality: 'C', tiradasDano: 1 }, E: { cambioQuality: 'D', tiradasDano: 1 }, F: { cambioQuality: 'E' } },
  /* MoF 7+ */ { A: { tiradasDano: 4 }, B: { cambioQuality: 'A', tiradasDano: 2 }, C: { cambioQuality: 'B', tiradasDano: 2 }, D: { cambioQuality: 'C', tiradasDano: 1 }, E: { cambioQuality: 'D', tiradasDano: 1 }, F: { cambioQuality: 'E', tiradasDano: 1 } },
];

/** Filas índice 0..6 = MoS 0..6+ */
export const MAINTENANCE_CHECK_TABLE_MOS: Record<QualityRating, ResultadoCelda>[] = [
  /* MoS 0 */ { A: VACIO, B: VACIO, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoS 1 */ { A: VACIO, B: VACIO, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoS 2 */ { A: VACIO, B: VACIO, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoS 3 */ { A: VACIO, B: VACIO, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoS 4 */ { A: { cambioQuality: 'B' }, B: { cambioQuality: 'C' }, C: VACIO, D: VACIO, E: VACIO, F: VACIO },
  /* MoS 5 */ { A: { cambioQuality: 'C' }, B: { cambioQuality: 'D' }, C: { cambioQuality: 'D' }, D: { cambioQuality: 'E' }, E: VACIO, F: VACIO },
  /* MoS 6+*/ { A: { cambioQuality: 'D' }, B: { cambioQuality: 'E' }, C: { cambioQuality: 'E' }, D: { cambioQuality: 'E' }, E: { cambioQuality: 'F' }, F: { experienciaExtra: true } },
];

export interface ResultadoMaintenanceCheck extends ResultadoCelda {
  roll: number;
  tn:   number;
  mos:  number; // 0 si fue MoF
  mof:  number; // 0 si fue MoS
}

export function resolverMaintenanceCheck(
  roll: number, tn: number, quality: QualityRating,
): ResultadoMaintenanceCheck {
  const diff = roll - tn;
  if (diff >= 0) {
    const mosIdx = Math.min(6, diff); // 0..6 (6 = "6+")
    return { ...MAINTENANCE_CHECK_TABLE_MOS[mosIdx][quality], roll, tn, mos: mosIdx, mof: 0 };
  }
  const mofIdx = Math.min(7, -diff); // 1..7 (7 = "7+")
  return { ...MAINTENANCE_CHECK_TABLE_MOF[mofIdx - 1][quality], roll, tn, mos: 0, mof: mofIdx };
}

// ── 'Mech Damage Status Table → DamagePatch ──────────────────

export interface DamagePatch {
  blindaje?:         number;  // puntos a sumar a damage.blindaje
  reactor?:          number;  // delta (clamp 0..3)
  gyro?:             number;  // delta (clamp 0..2)
  retros?:           number;
  radiadores?:       number;
  sensores?:         number;
  municionPerdida?:  boolean; // selector UI: qué bin
  actuadorAleatorio?: boolean; // crítico genérico sin slot claro
  nota?:             string;   // resultados 6/9: solo flavor/log
}

/** Devuelve descripción legible de un DamagePatch para historial/log. */
export function describirDamagePatch(p: DamagePatch): string {
  if (p.nota)              return p.nota;
  if (p.blindaje)          return `+${p.blindaje} pts blindaje perdidos (loc a elegir)`;
  if (p.reactor)           return `Reactor +${p.reactor} crit`;
  if (p.gyro)              return `Gyro +${p.gyro} crit`;
  if (p.retros)            return `+${p.retros} jump jet dañado`;
  if (p.radiadores)        return `+${p.radiadores} radiador dañado`;
  if (p.sensores)          return `+${p.sensores} sensor dañado`;
  if (p.municionPerdida)   return 'Munición consumida (elegir bin)';
  if (p.actuadorAleatorio) return 'Crítico aleatorio en actuador';
  return 'Sin efecto';
}

/** Resuelve UNA tirada en la 'Mech Damage Status Table.
 *  roll=2 tira dos veces (recursivo; re-tira si vuelve a salir 2). */
export function tirarDanoAleatorio(hayJumpJets: boolean, hayMunicion: boolean): DamagePatch[] {
  const roll = roll2D6();
  switch (roll) {
    case 2: {
      const a = tirarDanoAleatorio(hayJumpJets, hayMunicion);
      const b = tirarDanoAleatorio(hayJumpJets, hayMunicion);
      return [...a, ...b];
    }
    case 3:  return [ hayJumpJets ? { retros: 1 } : { blindaje: rollD6() } ];
    case 4:  return [ { reactor: 1 } ];
    case 5:  return [ hayMunicion ? { municionPerdida: true } : { actuadorAleatorio: true } ];
    case 6:  return [ { nota: '1 arma aleatoria genera +2 calor adicional' } ];
    case 7:  return [ { blindaje: rollD6() } ];
    case 8:  return [ { radiadores: rollD6() } ];
    case 9:  return [ { nota: '1 arma aleatoria falla con 9+ al disparar' } ];
    case 10: return [ { blindaje: rollD6() }, { blindaje: rollD6() } ];
    case 11: return [ { gyro: 1 } ];
    case 12: return [ { sensores: 1 } ];
    default: return [];
  }
}

/** Aplica patches sobre copia de damage, clamping reactor/gyro.
 *  municionPerdida/actuadorAleatorio se resuelven en UI antes de llamar. */
export function aplicarDamagePatches(damage: MechRepairDamage, patches: DamagePatch[]): MechRepairDamage {
  const out: MechRepairDamage = { ...damage, actuadores: { ...damage.actuadores } };
  for (const p of patches) {
    if (p.blindaje)   out.blindaje   = (out.blindaje ?? 0) + p.blindaje;
    if (p.reactor)    out.reactor    = Math.min(3, out.reactor + p.reactor);
    if (p.gyro)       out.gyro       = Math.min(2, out.gyro + p.gyro);
    if (p.retros)     out.retros     = (out.retros ?? 0) + p.retros;
    if (p.radiadores) out.radiadores = (out.radiadores ?? 0) + p.radiadores;
    if (p.sensores)   out.sensores   = (out.sensores ?? 0) + p.sensores;
  }
  return out;
}

// ── Persistencia ──────────────────────────────────────────────

export interface MaintenanceLogEntry {
  fecha:           string;
  tn:              number;
  roll:            number;
  resultado:       'MoS' | 'MoF';
  margen:          number;
  cambioQuality?:  QualityRating;
  danosGenerados?: string[];
  costo:           number;
}

export interface MechMaintenanceState {
  qualityRating:     QualityRating;     // default 'D'
  experienciaEquipo: ExperienciaEquipo; // default 'Regular'
  techRating:        string;            // 'A'..'F', default 'D'
  historial:         MaintenanceLogEntry[];
  /** Daño acumulado por tiradas fallidas de mantenimiento.
   *  Se suma al damage derivado del simulador en PrioridadesTab. */
  extraDamage?:      MechRepairDamage;
}

export const DEFAULT_MAINTENANCE_STATE: MechMaintenanceState = {
  qualityRating:     'D',
  experienciaEquipo: 'Regular',
  techRating:        'D',
  historial:         [],
};

/** Empty damage para inicializar extraDamage. */
export function emptyDamage(): MechRepairDamage {
  return {
    reactor: 0, gyro: 0, cabinaDañada: false, soporteVida: 0,
    sensores: 0, estructura: 0, blindaje: 0, miomero: 0,
    retros: 0, radiadores: 0, actuadores: {}, armas: [], municion: 0,
  };
}

/** Suma dos MechRepairDamage. Clamp reactor 0..3, gyro 0..2. */
export function mergeDamage(a: MechRepairDamage, b: MechRepairDamage): MechRepairDamage {
  return {
    reactor:      Math.min(3, (a.reactor ?? 0) + (b.reactor ?? 0)),
    gyro:         Math.min(2, (a.gyro ?? 0) + (b.gyro ?? 0)),
    cabinaDañada: a.cabinaDañada || b.cabinaDañada,
    soporteVida:  (a.soporteVida ?? 0) + (b.soporteVida ?? 0),
    sensores:     (a.sensores ?? 0) + (b.sensores ?? 0),
    estructura:   (a.estructura ?? 0) + (b.estructura ?? 0),
    blindaje:     (a.blindaje ?? 0) + (b.blindaje ?? 0),
    miomero:      (a.miomero ?? 0) + (b.miomero ?? 0),
    retros:       (a.retros ?? 0) + (b.retros ?? 0),
    radiadores:   (a.radiadores ?? 0) + (b.radiadores ?? 0),
    actuadores:   { ...(a.actuadores ?? {}), ...(b.actuadores ?? {}) },
    armas:        [...(a.armas ?? []), ...(b.armas ?? [])],
    municion:     (a.municion ?? 0) + (b.municion ?? 0),
  };
}
