// ══════════════════════════════════════════════════════════════
//  REPAIR PRIORITY ENGINE
//  Implementa spec_sistema_prioridades_reparacion.md
//  Tabla de tiempos derivada de Tech Manual (p.99-100) + CamOps (p.221).
// ══════════════════════════════════════════════════════════════

import type { MechRepairDamage, MechRepairConfig, RepairSystem } from './repair-engine';
import {
  costoActuador, costoBlindaje, costoCabina, costoEstructura, costoGyro,
  costoMiomero, costoRadiadores, costoReactor, costoRetros, costoSensores,
  costoSoporteVida, costoArmas,
  PRECIO_ACTUADOR,
} from './repair-engine';
import type { PersonalEntry, PersonalNivel } from './firebase-service';

// ── Constantes (spec sec 2) ───────────────────────────────────

export const MINUTOS_POR_DIA_NORMAL     = 480;  // 8h efectivas
export const MINUTOS_POR_DIA_EXTENDIDO  = 960;  // 16h turno extendido
export const MINUTOS_EXTRA_POR_TURNO    = MINUTOS_POR_DIA_EXTENDIDO - MINUTOS_POR_DIA_NORMAL; // 480

export const MINUTOS_POR_PUNTO_BLINDAJE = 5;

export type UnidadTiempo = 'horas' | 'dias' | 'semanas' | 'meses';

export const FACTOR_HORAS: Record<UnidadTiempo, number> = {
  horas:   1,
  dias:    24,
  semanas: 24 * 7,
  meses:   24 * 30,
};

// ── Tipos (spec sec 4) ────────────────────────────────────────

export type Categoria =
  | 'Movilidad'    // actuadores pierna, jump jets, motor
  | 'Armas'        // armas y equipo
  | 'Blindaje'     // por localizacion, divisible
  | 'Estructura'   // estructura interna por localizacion
  | 'Sensores'     // sensores, electronica
  | 'SoporteVital'; // gyro, soporte vital, sistemas criticos

export type Localizacion = 'HD' | 'CT' | 'LT' | 'RT' | 'LA' | 'RA' | 'LL' | 'RL';

export interface RepairItem {
  id:            string;
  nombre:        string;
  localizacion:  Localizacion;
  categoria:     Categoria;
  tiempoBase:    number;   // minutos
  divisible:     boolean;  // true solo para Blindaje
  puntosDanados?: number;  // solo si divisible
  costoBase:     number;   // ₡ a estadoFactPct=100%. 0 si daño parcial canon
}

export type EstadoItem = 'reparado' | 'parcial' | 'pendiente';

export interface ResultadoItem {
  item:            RepairItem;
  estado:          EstadoItem;
  minutosUsados:   number;
  puntosReparados?: number;
  riesgoFatiga:    boolean;
}

export interface ResultadoCalculo {
  minutosDisponibles: number;
  minutosBase:        number;
  minutosExtra:       number;
  resultados:         ResultadoItem[];
  minutosUsadosTotal: number;
  minutosSinUsar:     number;
  /** Suma costoBase items con estado != pendiente (sin aplicar estadoFactPct). */
  costoReparadoBruto: number;
  /** Suma costoBase items pendientes (o resto parcial blindaje). */
  costoPendiente:     number;
}

// ── Tabla tiempos por componente (Tech Manual p.99-100 + CamOps p.221) ──

/** Tiempo de reemplazo (minutos) por componente nombrado. */
export const TIEMPO_COMPONENTE = {
  // SoporteVital
  REACTOR_REPLACE:       360,
  REACTOR_CRIT:          200,
  GYRO_REPLACE:          240,
  GYRO_CRIT:             150,
  COCKPIT:               480,
  SOPORTE_VIDA:          100,
  // Sensores
  SENSORES_FULL:          75,
  SENSORES_PARCIAL:       30,
  // Movilidad - heat sinks + jump jets
  HEAT_SINK:              90,
  JUMP_JET:               90,
  // Movilidad - actuadores pierna (Hip/Knee/Ankle por punto BT)
  ACTUADOR_CADERA:       240,
  ACTUADOR_RODILLA:      150,
  ACTUADOR_TOBILLO:       50,
  // Brazo
  ACTUADOR_HOMBRO:       150,
  ACTUADOR_CODO:          60,
  ACTUADOR_MANO:          30,
  // Estructura per pt
  ESTRUCTURA_PER_PT:      30,
  // Armas (categoria por tonelaje aprox)
  ARMA_LIGERA:            60,   // <=2t  (MG, Small Laser, AC/2)
  ARMA_MEDIA:             90,   // 3-6t  (ML, LRM5, SRM4, AC/5)
  ARMA_PESADA:           120,   // 7-12t (LL, PPC, LRM15, AC/10)
  ARMA_ASALTO:           200,   // 13+t  (AC/20, Gauss, LRM20)
  ARMA_PARCIAL_RATIO:      0.5, // parcial = mitad del replace
  // Municion bin
  AMMO_BIN:               15,
} as const;

// ── Categorizacion ────────────────────────────────────────────

function categoriaDeActuador(): Categoria {
  return 'Movilidad';
}

/** Estimacion tonelaje del arma para asignar tiempo. */
function tiempoArmaByName(weaponName: string, mechTons?: number): number {
  const n = (weaponName || '').toLowerCase();
  // Hatchet/Sword/Mace son tonelaje variable
  if (n.includes('hatchet') || n.includes('hacha')) {
    const tons = mechTons ? Math.ceil(mechTons / 15) : 5;
    return tons >= 7 ? TIEMPO_COMPONENTE.ARMA_ASALTO : tons >= 3 ? TIEMPO_COMPONENTE.ARMA_PESADA : TIEMPO_COMPONENTE.ARMA_MEDIA;
  }
  if (n.includes('sword') || n.includes('espada')) {
    const tons = mechTons ? Math.ceil(mechTons / 20) : 4;
    return tons >= 6 ? TIEMPO_COMPONENTE.ARMA_PESADA : TIEMPO_COMPONENTE.ARMA_MEDIA;
  }
  if (n.includes('gauss'))                 return TIEMPO_COMPONENTE.ARMA_ASALTO;
  if (n.includes('ac/20') || n.includes('autocannon/20')) return TIEMPO_COMPONENTE.ARMA_ASALTO;
  if (n.includes('ac/10') || n.includes('autocannon/10')) return TIEMPO_COMPONENTE.ARMA_PESADA;
  if (n.includes('ac/5')  || n.includes('autocannon/5'))  return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('ac/2')  || n.includes('autocannon/2'))  return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('ultra ac/20') || n.includes('uac/20'))  return TIEMPO_COMPONENTE.ARMA_ASALTO;
  if (n.includes('ultra ac/10') || n.includes('uac/10'))  return TIEMPO_COMPONENTE.ARMA_PESADA;
  if (n.includes('ultra ac/5')  || n.includes('uac/5'))   return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('ultra ac/2')  || n.includes('uac/2'))   return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('lb 20') || n.includes('lb-20'))         return TIEMPO_COMPONENTE.ARMA_ASALTO;
  if (n.includes('lb 10') || n.includes('lb-10'))         return TIEMPO_COMPONENTE.ARMA_PESADA;
  if (n.includes('lb 5')  || n.includes('lb-5'))          return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('lb 2')  || n.includes('lb-2'))          return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('lrm 20') || n.includes('lrm20'))        return TIEMPO_COMPONENTE.ARMA_ASALTO;
  if (n.includes('lrm 15') || n.includes('lrm15'))        return TIEMPO_COMPONENTE.ARMA_PESADA;
  if (n.includes('lrm 10') || n.includes('lrm10'))        return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('lrm 5')  || n.includes('lrm5'))         return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('srm 6'))                                 return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('srm 4'))                                 return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('srm 2'))                                 return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('streak'))                                return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('ppc'))                                   return TIEMPO_COMPONENTE.ARMA_PESADA;
  if (n.includes('large') && n.includes('laser'))          return TIEMPO_COMPONENTE.ARMA_PESADA;
  if (n.includes('medium') && n.includes('laser'))         return TIEMPO_COMPONENTE.ARMA_MEDIA;
  if (n.includes('small') && n.includes('laser'))          return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('flamer'))                                return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('mg') || n.includes('machine gun'))       return TIEMPO_COMPONENTE.ARMA_LIGERA;
  if (n.includes('arrow'))                                 return TIEMPO_COMPONENTE.ARMA_ASALTO;
  return TIEMPO_COMPONENTE.ARMA_MEDIA;
}

// ── Conversion tiempo → minutos disponibles (spec sec 3) ──────

export interface ConfiguracionTiempo {
  valor:            number;
  unidad:           UnidadTiempo;
  turnosExtendidos: number; // 0..turnosMax
}

export interface CalculoTiempo {
  horasTotales:        number;
  minutosBase:         number;
  minutosExtra:        number;
  minutosDisponibles:  number;
  turnosMax:           number;
  turnosExtendidos:    number;
}

export function calcularMinutosDisponibles(cfg: ConfiguracionTiempo): CalculoTiempo {
  const horasTotales = Math.max(0, cfg.valor) * FACTOR_HORAS[cfg.unidad];

  // 'horas' = horas activas de trabajo (×60). Otras unidades = elapsed clock
  // → 8h/24h efectivo (×20). Turnos extendidos solo aplican a elapsed.
  const esElapsed = cfg.unidad !== 'horas';
  const minutosBase = esElapsed
    ? Math.round(horasTotales * (MINUTOS_POR_DIA_NORMAL / 24)) // 8h/24h
    : Math.round(horasTotales * 60);                            // 60 min/hora activa

  const turnosMax = esElapsed ? Math.max(1, Math.floor(horasTotales / 24)) : 0;
  const turnosExtendidos = Math.min(turnosMax, Math.max(0, Math.floor(cfg.turnosExtendidos)));
  const minutosExtra = turnosExtendidos * MINUTOS_EXTRA_POR_TURNO;
  return {
    horasTotales,
    minutosBase,
    minutosExtra,
    minutosDisponibles: minutosBase + minutosExtra,
    turnosMax,
    turnosExtendidos,
  };
}

// ── Presets (spec sec 5) ──────────────────────────────────────

export type OrdenSecundario = 'asc' | 'desc' | 'manual';

export interface Preset {
  id:              string;
  nombre:          string;
  ordenCategorias: Categoria[];
}

export const PRESETS: Preset[] = [
  {
    id: 'persecucion',
    nombre: 'Persecución',
    ordenCategorias: ['Movilidad', 'SoporteVital', 'Sensores', 'Armas', 'Estructura', 'Blindaje'],
  },
  {
    id: 'defensa',
    nombre: 'Defensa de base',
    ordenCategorias: ['Blindaje', 'Armas', 'Estructura', 'SoporteVital', 'Sensores', 'Movilidad'],
  },
  { id: 'manual', nombre: 'Manual', ordenCategorias: [] },
];

export function aplicarPreset(
  items: RepairItem[],
  preset: Preset,
  orden: OrdenSecundario,
): RepairItem[] {
  if (preset.id === 'manual') return items;

  const grupos = new Map<Categoria, RepairItem[]>();
  for (const it of items) {
    const arr = grupos.get(it.categoria) ?? [];
    arr.push(it);
    grupos.set(it.categoria, arr);
  }
  const sortFn = (a: RepairItem, b: RepairItem) =>
    orden === 'asc' ? a.tiempoBase - b.tiempoBase
    : orden === 'desc' ? b.tiempoBase - a.tiempoBase
    : 0;

  const out: RepairItem[] = [];
  for (const cat of preset.ordenCategorias) {
    const grupo = grupos.get(cat) ?? [];
    if (orden !== 'manual') grupo.sort(sortFn);
    out.push(...grupo);
    grupos.delete(cat);
  }
  // Categorias no listadas al final, en orden de aparicion original
  for (const grupo of grupos.values()) out.push(...grupo);
  return out;
}

// ── Algoritmo asignacion (spec sec 6) ─────────────────────────

export function calcularReparaciones(
  items: RepairItem[],
  minutosDisponibles: number,
  minutosBase: number,
  config?: MechRepairConfig,
): ResultadoCalculo & { pendientesBlindaje: RepairItem[] } {
  let minutosRestantes = minutosDisponibles;
  const resultados: ResultadoItem[] = [];
  const pendientesBlindaje: RepairItem[] = [];

  const esTurnoExt = (usadosAntes: number, usadosEnEste: number) =>
    (usadosAntes + usadosEnEste) > minutosBase;

  for (const item of items) {
    if (item.tiempoBase === 0) {
      resultados.push({ item, estado: 'reparado', minutosUsados: 0, riesgoFatiga: false });
      continue;
    }
    if (!item.divisible) {
      if (item.tiempoBase <= minutosRestantes) {
        const usados = item.tiempoBase;
        const usadosAntes = minutosDisponibles - minutosRestantes;
        resultados.push({
          item, estado: 'reparado', minutosUsados: usados,
          riesgoFatiga: esTurnoExt(usadosAntes, usados),
        });
        minutosRestantes -= usados;
      } else {
        resultados.push({ item, estado: 'pendiente', minutosUsados: 0, riesgoFatiga: false });
      }
    } else {
      // Blindaje
      if (item.tiempoBase <= minutosRestantes) {
        const usados = item.tiempoBase;
        const usadosAntes = minutosDisponibles - minutosRestantes;
        resultados.push({
          item, estado: 'reparado', minutosUsados: usados,
          puntosReparados: item.puntosDanados,
          riesgoFatiga: esTurnoExt(usadosAntes, usados),
        });
        minutosRestantes -= usados;
      } else if (minutosRestantes > 0) {
        pendientesBlindaje.push(item);
        resultados.push({ item, estado: 'pendiente', minutosUsados: 0, riesgoFatiga: false });
      } else {
        resultados.push({ item, estado: 'pendiente', minutosUsados: 0, riesgoFatiga: false });
      }
    }
  }

  const { costoReparadoBruto, costoPendiente } = agregarCostes(resultados, config);

  return {
    minutosDisponibles,
    minutosBase,
    minutosExtra: minutosDisponibles - minutosBase,
    resultados,
    minutosUsadosTotal: minutosDisponibles - minutosRestantes,
    minutosSinUsar:     minutosRestantes,
    costoReparadoBruto,
    costoPendiente,
    pendientesBlindaje,
  };
}

/** Aplica asignacion manual de blindaje sobre un resultado previo.
 *  asignaciones: { itemId: puntosAsignados }. Mutates safe-copy. */
export function aplicarAsignacionBlindaje(
  base: ReturnType<typeof calcularReparaciones>,
  asignaciones: Record<string, number>,
  config?: MechRepairConfig,
): ResultadoCalculo {
  const minutosBase = base.minutosBase;
  const resultados = base.resultados.map(r => ({ ...r }));
  let minutosRestantes = base.minutosSinUsar;

  for (const r of resultados) {
    if (!r.item.divisible) continue;
    const asig = asignaciones[r.item.id] ?? 0;
    if (asig <= 0) continue;
    const minutosUsar = Math.min(asig, r.item.puntosDanados ?? 0) * MINUTOS_POR_PUNTO_BLINDAJE;
    if (minutosUsar <= 0 || minutosUsar > minutosRestantes) continue;
    const usadosAntes = base.minutosDisponibles - minutosRestantes;
    const allReparado = asig >= (r.item.puntosDanados ?? 0);
    r.estado = allReparado ? 'reparado' : 'parcial';
    r.minutosUsados = minutosUsar;
    r.puntosReparados = Math.min(asig, r.item.puntosDanados ?? 0);
    r.riesgoFatiga = (usadosAntes + minutosUsar) > minutosBase;
    minutosRestantes -= minutosUsar;
  }

  const { costoReparadoBruto, costoPendiente } = agregarCostes(resultados, config);

  return {
    minutosDisponibles: base.minutosDisponibles,
    minutosBase,
    minutosExtra: base.minutosExtra,
    resultados,
    minutosUsadosTotal: base.minutosDisponibles - minutosRestantes,
    minutosSinUsar:     minutosRestantes,
    costoReparadoBruto,
    costoPendiente,
  };
}

// ── Agregados de coste (spec 1.4) ─────────────────────────────

/** Coste de un resultado individual.
 *  - Pendiente → 0
 *  - Reparado (no divisible) → costoBase entero
 *  - Reparado (divisible/blindaje) → costoBlindaje(config, puntosReparados) si hay config; si no costoBase
 *  - Parcial → coste proporcional puntosReparados (solo blindaje) */
function costoDeResultado(r: ResultadoItem, config?: MechRepairConfig): number {
  if (r.estado === 'pendiente') return 0;
  if (r.item.divisible && config) {
    const pts = r.puntosReparados ?? 0;
    return costoBlindaje(config, pts);
  }
  if (r.estado === 'reparado') return r.item.costoBase;
  // Parcial sin config: estimación lineal
  const pts = r.puntosReparados ?? 0;
  const total = r.item.puntosDanados ?? 0;
  return total > 0 ? Math.round(r.item.costoBase * pts / total) : 0;
}

/** Suma agregada: bruto reparado vs pendiente. */
export function agregarCostes(
  resultados: ResultadoItem[],
  config?: MechRepairConfig,
): { costoReparadoBruto: number; costoPendiente: number } {
  let costoReparadoBruto = 0;
  let costoPendiente = 0;
  for (const r of resultados) {
    const usado = costoDeResultado(r, config);
    costoReparadoBruto += usado;
    costoPendiente += Math.max(0, r.item.costoBase - usado);
  }
  return { costoReparadoBruto, costoPendiente };
}

/** Coste final aplicando estadoFactPct (mismo criterio que Factura). */
export function costoFinal(costoReparadoBruto: number, estadoFactPct: number): number {
  return Math.round(costoReparadoBruto * (estadoFactPct / 100));
}

// ── Mapeo MechRepairDamage → RepairItem[] (spec sec 9) ────────

let _idCounter = 0;
const nextId = (prefix: string) => `${prefix}_${++_idCounter}`;

/** Construye lista de RepairItem desde damage declarado + tonelaje mech.
 *  Cada componente dañado se traduce a uno o varios items. */
export function mapearDamageARepairItems(
  damage: MechRepairDamage,
  mechTons?: number,
): RepairItem[] {
  const items: RepairItem[] = [];

  // Reactor (1-2 crits parciales; 3 = destruido total)
  if (damage.reactor > 0) {
    const tiempo = damage.reactor >= 3
      ? TIEMPO_COMPONENTE.REACTOR_REPLACE
      : TIEMPO_COMPONENTE.REACTOR_CRIT * damage.reactor;
    items.push({
      id: nextId('reactor'), nombre: `Reactor (${damage.reactor}/3)`,
      localizacion: 'CT', categoria: 'SoporteVital',
      tiempoBase: tiempo, divisible: false, costoBase: 0,
    });
  }

  // Gyro
  if (damage.gyro > 0) {
    const tiempo = damage.gyro >= 2
      ? TIEMPO_COMPONENTE.GYRO_REPLACE
      : TIEMPO_COMPONENTE.GYRO_CRIT;
    items.push({
      id: nextId('gyro'), nombre: `Giroscopio (${damage.gyro}/2)`,
      localizacion: 'CT', categoria: 'SoporteVital',
      tiempoBase: tiempo, divisible: false, costoBase: 0,
    });
  }

  // Cabina
  if (damage.cabinaDañada) {
    items.push({
      id: nextId('cabina'), nombre: 'Cabina',
      localizacion: 'HD', categoria: 'SoporteVital',
      tiempoBase: TIEMPO_COMPONENTE.COCKPIT, divisible: false, costoBase: 0,
    });
  }

  // Soporte vida
  if (damage.soporteVida > 0) {
    items.push({
      id: nextId('soporte'), nombre: 'Soporte vital',
      localizacion: 'HD', categoria: 'SoporteVital',
      tiempoBase: TIEMPO_COMPONENTE.SOPORTE_VIDA, divisible: false, costoBase: 0,
    });
  }

  // Sensores
  if (damage.sensores > 0) {
    const tiempo = damage.sensores >= 2 ? TIEMPO_COMPONENTE.SENSORES_FULL : TIEMPO_COMPONENTE.SENSORES_PARCIAL;
    items.push({
      id: nextId('sensores'), nombre: `Sensores x${damage.sensores}`,
      localizacion: 'HD', categoria: 'Sensores',
      tiempoBase: tiempo, divisible: false, costoBase: 0,
    });
  }

  // Radiadores (heat sinks)
  if (damage.radiadores > 0) {
    items.push({
      id: nextId('rads'), nombre: `Radiadores x${damage.radiadores}`,
      localizacion: 'CT', categoria: 'Movilidad',
      tiempoBase: TIEMPO_COMPONENTE.HEAT_SINK * damage.radiadores, divisible: false, costoBase: 0,
    });
  }

  // Retros (jump jets)
  if (damage.retros > 0) {
    items.push({
      id: nextId('jumps'), nombre: `Jump jets x${damage.retros}`,
      localizacion: 'CT', categoria: 'Movilidad',
      tiempoBase: TIEMPO_COMPONENTE.JUMP_JET * damage.retros, divisible: false, costoBase: 0,
    });
  }

  // Actuadores
  const actuadoresMap: Record<string, number> = {
    'Hombro':  TIEMPO_COMPONENTE.ACTUADOR_HOMBRO,
    'Codo':    TIEMPO_COMPONENTE.ACTUADOR_CODO,
    'Mano':    TIEMPO_COMPONENTE.ACTUADOR_MANO,
    'Cadera':  TIEMPO_COMPONENTE.ACTUADOR_CADERA,
    'Rodilla': TIEMPO_COMPONENTE.ACTUADOR_RODILLA,
    'Tobillo': TIEMPO_COMPONENTE.ACTUADOR_TOBILLO,
  };
  for (const [act, qty] of Object.entries(damage.actuadores ?? {})) {
    if (!qty || qty <= 0) continue;
    const tiempoUnit = actuadoresMap[act] ?? 60;
    items.push({
      id: nextId('act'), nombre: `Actuador ${act} x${qty}`,
      localizacion: 'LL', categoria: categoriaDeActuador(),
      tiempoBase: tiempoUnit * qty, divisible: false, costoBase: 0,
    });
  }

  // Estructura interna (per pt)
  if (damage.estructura > 0) {
    items.push({
      id: nextId('is'), nombre: `Estructura interna (${damage.estructura} pts)`,
      localizacion: 'CT', categoria: 'Estructura',
      tiempoBase: TIEMPO_COMPONENTE.ESTRUCTURA_PER_PT * damage.estructura, divisible: false, costoBase: 0,
    });
  }

  // Armas
  for (const arma of (damage.armas ?? [])) {
    const tBase = tiempoArmaByName(arma.name, mechTons);
    const tFinal = arma.status === 'parcial'
      ? Math.round(tBase * TIEMPO_COMPONENTE.ARMA_PARCIAL_RATIO)
      : tBase;
    items.push({
      id: nextId('arma'), nombre: `${arma.name}${arma.status === 'parcial' ? ' (parcial)' : ''}`,
      localizacion: (arma.loc as Localizacion) || 'CT',
      categoria: 'Armas',
      tiempoBase: tFinal, divisible: false, costoBase: 0,
    });
  }

  // Blindaje (divisible)
  if (damage.blindaje > 0) {
    items.push({
      id: nextId('armor'), nombre: `Blindaje (${damage.blindaje} pts)`,
      localizacion: 'CT', categoria: 'Blindaje',
      tiempoBase: damage.blindaje * MINUTOS_POR_PUNTO_BLINDAJE, divisible: true,
      puntosDanados: damage.blindaje, costoBase: 0,
    });
  }

  return items;
}

// ── Mapeo CON coste por item (spec 1.3) ──────────────────────────

/** Igual que mapearDamageARepairItems pero rellena costoBase usando funcs
 *  per-componente de repair-engine, parametrizadas por system propio|canon.
 *  Añade item de munición si damage.municion > 0. */
export function mapearDamageARepairItemsConCoste(
  damage: MechRepairDamage,
  config: MechRepairConfig,
  system: RepairSystem,
  mechTons?: number,
): RepairItem[] {
  const items = mapearDamageARepairItems(damage, mechTons);

  // Index armas por nombre para asignar coste posicional cuando hay duplicados
  let armaIdx = 0;

  for (const item of items) {
    const prefix = item.id.split('_')[0];
    switch (prefix) {
      case 'reactor':
        item.costoBase = costoReactor(config, damage.reactor, system); break;
      case 'gyro':
        item.costoBase = costoGyro(config, damage.gyro, system); break;
      case 'cabina':
        item.costoBase = costoCabina(damage.cabinaDañada); break;
      case 'soporte':
        item.costoBase = costoSoporteVida(config, damage.soporteVida, system); break;
      case 'sensores':
        item.costoBase = costoSensores(config, damage.sensores, system); break;
      case 'rads':
        item.costoBase = costoRadiadores(config, damage.radiadores); break;
      case 'jumps':
        item.costoBase = costoRetros(config, damage.retros); break;
      case 'act': {
        // nombre "Actuador {Tipo} x{qty}"
        const m = item.nombre.match(/Actuador (\w+) x(\d+)/);
        if (m) {
          const tipo = m[1] as keyof typeof PRECIO_ACTUADOR;
          const qty = Number(m[2]);
          item.costoBase = costoActuador(tipo, qty, config);
        }
        break;
      }
      case 'is':
        item.costoBase = costoEstructura(config, damage.estructura, system); break;
      case 'arma': {
        const arma = (damage.armas ?? [])[armaIdx++];
        item.costoBase = arma?.cost ?? 0;
        // Canon: parcial = 0 ₡ (solo labor)
        if (system === 'canon' && arma?.status === 'parcial') item.costoBase = 0;
        break;
      }
      case 'armor':
        item.costoBase = costoBlindaje(config, damage.blindaje); break;
      default:
        item.costoBase = 0;
    }
  }

  // ── Blindaje per loc (inverso transferencia daño BattleTech) ──
  // Si damage.blindajePerLoc presente, reemplazar item agregado 'armor'
  // por N items separados per loc. Orden auto canónico:
  //   CT (front+rear) > HD > LT/RT (front+rear) > LA/RA > LL/RL
  // (loc más críticas = receptoras de transferencia primero).
  if (damage.blindajePerLoc && Object.keys(damage.blindajePerLoc).length > 0) {
    // Quita item armor agregado
    const armorIdx = items.findIndex(i => i.categoria === 'Blindaje');
    if (armorIdx >= 0) items.splice(armorIdx, 1);

    const LOC_ORDER = ['CTf', 'CTr', 'HD', 'LTf', 'LTr', 'RTf', 'RTr', 'LA', 'RA', 'LL', 'RL'] as const;
    const LOC_LABEL: Record<string, string> = {
      CTf: 'CT Frontal', CTr: 'CT Trasero', HD: 'Cabeza',
      LTf: 'LT Frontal', LTr: 'LT Trasero', RTf: 'RT Frontal', RTr: 'RT Trasero',
      LA: 'Brazo Izquierdo', RA: 'Brazo Derecho',
      LL: 'Pierna Izquierda', RL: 'Pierna Derecha',
    };
    const totalArmorPts = damage.blindaje || 0;
    const baseArmorCost = totalArmorPts > 0 ? costoBlindaje(config, totalArmorPts) : 0;

    // Normalize loc con sufijo f/r al loc base para campo Localizacion
    const baseLoc = (loc: string): Localizacion => {
      if (loc === 'CTf' || loc === 'CTr') return 'CT';
      if (loc === 'LTf' || loc === 'LTr') return 'LT';
      if (loc === 'RTf' || loc === 'RTr') return 'RT';
      return loc as Localizacion;
    };
    for (const loc of LOC_ORDER) {
      const pts = damage.blindajePerLoc[loc] ?? 0;
      if (pts <= 0) continue;
      // Coste proporcional al peso del loc en el total
      const costoLoc = totalArmorPts > 0
        ? Math.round(baseArmorCost * (pts / totalArmorPts))
        : 0;
      items.push({
        id: nextId('armor'),
        nombre: `Blindaje ${LOC_LABEL[loc] ?? loc} (${pts} pts)`,
        localizacion: baseLoc(loc),
        categoria: 'Blindaje',
        tiempoBase: pts * MINUTOS_POR_PUNTO_BLINDAJE,
        divisible: true,
        puntosDanados: pts,
        costoBase: costoLoc,
      });
    }
  }

  // Miomero: spec mapea pero la versión base no genera item. Añadir si hay daño.
  if (damage.miomero > 0) {
    items.push({
      id: nextId('miomero'), nombre: `Miomero x${damage.miomero}`,
      localizacion: 'CT', categoria: 'Movilidad',
      tiempoBase: TIEMPO_COMPONENTE.HEAT_SINK * damage.miomero, divisible: false,
      costoBase: costoMiomero(config, damage.miomero, system),
    });
  }

  // Armas suma global → si quisiéramos coste agregado canon
  void costoArmas; // mantén import válido por si fuera necesario

  // Munición: nuevo item si damage.municion > 0
  if ((damage.municion ?? 0) > 0) {
    items.push({
      id: nextId('ammo'), nombre: 'Reposición de munición',
      localizacion: 'CT', categoria: 'Armas',
      tiempoBase: TIEMPO_COMPONENTE.AMMO_BIN, divisible: false,
      costoBase: damage.municion ?? 0,
    });
  }

  return items;
}

// ══════════════════════════════════════════════════════════════
//  EQUIPOS DE REPARACION (bays) — CamOps p.146-148
// ══════════════════════════════════════════════════════════════

/** Factor de tiempo segun N AsTechs en el bay. 6 = canon optimo (1.0x). */
export function astechFactor(astechs: number): number {
  const n = Math.max(0, Math.floor(astechs));
  if (n === 0) return 2.00;
  if (n === 1) return 1.80;
  if (n === 2) return 1.65;
  if (n === 3) return 1.50;
  if (n === 4) return 1.25;
  if (n === 5) return 1.10;
  if (n === 6) return 1.00;
  if (n === 7) return 0.95;
  return 0.92; // 8+
}

/** Factor de tiempo segun skill del tech principal del bay. */
export const TECH_SKILL_FACTOR: Record<PersonalNivel, number> = {
  green:   1.5,
  regular: 1.0,
  veteran: 0.85,
  elite:   0.70,
};

/** Un equipo de reparación: 1 tech + N astechs. */
export interface BayTeam {
  skill:   PersonalNivel;
  astechs: number;
}

/** Multiplier individual de un equipo (skill × astechs).
 *  ×1.0 canon = 1 Tech Regular + 6 AsTechs. */
export function teamMultiplier(team: BayTeam): number {
  return astechFactor(team.astechs) * TECH_SKILL_FACTOR[team.skill];
}

/** Multiplier total cuando N equipos trabajan en paralelo (CamOps p.148).
 *  Cada equipo aporta throughput = 1/multIndividual. Throughput total
 *  es la suma; tiempo total = 1 / throughputTotal.
 *  Ejemplos:
 *  · 1 team (Reg 6 ast)    → ×1.00
 *  · 1 team (Vet 6 ast)    → ×0.85
 *  · 2 teams (Reg, Reg)    → ×0.50
 *  · 2 teams (Vet, Reg)    → 1 / (1/0.85 + 1/1.00) = ×0.459
 *  · 3 teams (Reg, Reg, Reg) → ×0.333
 *  Compat: si se pasa skill+astechs+numTeams se construye una lista
 *  homogénea (todos del mismo skill, astechs/numTeams cada uno). */
export function bayMultiplier(teams: BayTeam[]): number;
export function bayMultiplier(skill: PersonalNivel, astechs: number, numTeams?: number): number;
export function bayMultiplier(
  arg1: BayTeam[] | PersonalNivel,
  astechs?: number,
  numTeams: number = 1,
): number {
  let list: BayTeam[];
  if (Array.isArray(arg1)) {
    list = arg1;
  } else {
    const teams = Math.max(1, Math.floor(numTeams));
    const perTeam = Math.floor((astechs ?? 0) / teams);
    list = Array.from({ length: teams }, () => ({ skill: arg1, astechs: perTeam }));
  }
  if (list.length === 0) return 1;
  const throughput = list.reduce((sum, t) => sum + 1 / teamMultiplier(t), 0);
  if (throughput <= 0) return 1;
  return 1 / throughput;
}

/** Resumen agregado de personal de reparacion activo. */
export interface PersonalReparacion {
  techsBySkill: Record<PersonalNivel, number>;
  totalTechs:   number;
  totalAstechs: number;
}

/** Agrega entries personal -> conteos por rol/skill (solo estado=activo). */
export function agregarPersonal(personal: PersonalEntry[]): PersonalReparacion {
  const techsBySkill: Record<PersonalNivel, number> = { green: 0, regular: 0, veteran: 0, elite: 0 };
  let totalAstechs = 0;
  let totalTechs = 0;
  for (const e of personal ?? []) {
    if (e.estado !== 'activo') continue;
    const qty = Math.max(1, e.cantidad || 1);
    if (e.rol === 'mech_tech') {
      techsBySkill[e.nivel] += qty;
      totalTechs += qty;
    } else if (e.rol === 'astech') {
      totalAstechs += qty;
    }
  }
  return { techsBySkill, totalTechs, totalAstechs };
}

/** Lista techs activos como bays disponibles, ordenados por skill (elite primero). */
export function listarBays(personal: PersonalEntry[]): { skill: PersonalNivel }[] {
  const { techsBySkill } = agregarPersonal(personal);
  const out: { skill: PersonalNivel }[] = [];
  for (const skill of ['elite', 'veteran', 'regular', 'green'] as PersonalNivel[]) {
    for (let i = 0; i < techsBySkill[skill]; i++) out.push({ skill });
  }
  return out;
}

/** Aplica multiplier de bay a un array de RepairItem. Round at 1 min minimo. */
export function aplicarMultiplierBay(items: RepairItem[], multiplier: number): RepairItem[] {
  if (multiplier === 1) return items;
  return items.map(it => ({
    ...it,
    tiempoBase: Math.max(1, Math.round(it.tiempoBase * multiplier)),
  }));
}
