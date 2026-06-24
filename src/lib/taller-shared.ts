// ═══════════════════════════════════════════════════════════════
//  taller-shared.ts — Pool tiempo + equipos compartido entre subtabs
//  (Sprint Integración refino — pool global Taller).
//
//  Reglas (per user spec):
//   · Tiempo es GLOBAL: 3 días → todos los mechs tienen 3 días en paralelo.
//   · Equipos es POOL FINITO compartido: distribuir entre mechs según
//     queden disponibles. Cada equipo = 1 Tech + 6 AsTechs. Max 3 per mech.
//   · AsTechs sobrantes pueden trabajar paralelo en otra tarea del mismo
//     mech (ej: ammo recarga mientras techs reparan).
//   · Turnos extendidos: PER MECH.
//   · Cola persistente: items que quedan pendientes (mech sin equipos
//     asignados) persisten entre sesiones (localStorage + Firestore future).
//   · Cada equipo trabaja sus 8h/día paralelo — N equipos = N× capacidad.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UnidadTiempo, BayTeam } from './repair-priority';

/** Item en cola pendiente — minutos pendientes a futuro. */
export interface ColaItem {
  id:            string;
  mechKey:       string;
  componenteName: string;
  minutosBase:    number;
  /** Categoría libre para UI (Armas, Blindaje, Munición, etc.). */
  categoria:      string;
  /** ISO timestamp creación. */
  createdAt:      string;
}

/** Asignación per mech. */
export interface MechAssignment {
  teams:           BayTeam[];      // 0-3 equipos
  turnosExt:       number;         // turnos extendidos per mech
  minutosUsados:   number;         // descuento acumulado todas las acciones
}

interface TallerSharedState {
  /** Tiempo global aplicable a TODOS los mechs. */
  tiempoGlobal: {
    valor:     number;
    unidad:    UnidadTiempo;
  };
  setTiempoGlobal: (valor: number, unidad: UnidadTiempo) => void;

  /** Asignaciones per mech (key = MechSource.key ej 'sim:0' | 'hangar:hng_xx'). */
  asignaciones: Record<string, MechAssignment>;
  setMechAssignment: (mechKey: string, teams: BayTeam[]) => void;
  setMechTurnosExt:  (mechKey: string, turnosExt: number) => void;
  consumeMechTime:   (mechKey: string, minutos: number) => void;
  resetMech:         (mechKey: string) => void;
  /** Resetea minutosUsados de TODOS los mechs (cierra periodo, abre uno nuevo). */
  resetAllMechTimes: () => void;

  /** Cola pendientes per mech. */
  cola: Record<string, ColaItem[]>;
  addToCola:      (item: Omit<ColaItem, 'id' | 'createdAt'>) => void;
  removeFromCola: (mechKey: string, itemId: string) => void;
  clearCola:      (mechKey: string) => void;
}

function ensureAssignment(state: TallerSharedState, mechKey: string): MechAssignment {
  return state.asignaciones[mechKey] ?? { teams: [], turnosExt: 0, minutosUsados: 0 };
}

export const useTallerShared = create<TallerSharedState>()(
  persist(
    (set) => ({
      tiempoGlobal: { valor: 3, unidad: 'dias' },
      setTiempoGlobal: (valor, unidad) => set({ tiempoGlobal: { valor, unidad } }),

      asignaciones: {},
      setMechAssignment: (mechKey, teams) => set((s) => ({
        asignaciones: {
          ...s.asignaciones,
          [mechKey]: { ...ensureAssignment(s, mechKey), teams: teams.slice(0, 3) },
        },
      })),
      setMechTurnosExt: (mechKey, turnosExt) => set((s) => ({
        asignaciones: {
          ...s.asignaciones,
          [mechKey]: { ...ensureAssignment(s, mechKey), turnosExt: Math.max(0, Math.floor(turnosExt)) },
        },
      })),
      consumeMechTime: (mechKey, minutos) => set((s) => {
        const cur = ensureAssignment(s, mechKey);
        return {
          asignaciones: {
            ...s.asignaciones,
            [mechKey]: { ...cur, minutosUsados: Math.max(0, cur.minutosUsados + minutos) },
          },
        };
      }),
      resetMech: (mechKey) => set((s) => ({
        asignaciones: { ...s.asignaciones, [mechKey]: { teams: [], turnosExt: 0, minutosUsados: 0 } },
      })),
      resetAllMechTimes: () => set((s) => {
        const next: Record<string, MechAssignment> = {};
        for (const [k, a] of Object.entries(s.asignaciones)) {
          next[k] = { ...a, minutosUsados: 0 };
        }
        return { asignaciones: next };
      }),

      cola: {},
      addToCola: (item) => set((s) => {
        const full: ColaItem = {
          ...item,
          id: `cola_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        const existing = s.cola[item.mechKey] ?? [];
        return { cola: { ...s.cola, [item.mechKey]: [...existing, full] } };
      }),
      removeFromCola: (mechKey, itemId) => set((s) => ({
        cola: { ...s.cola, [mechKey]: (s.cola[mechKey] ?? []).filter(i => i.id !== itemId) },
      })),
      clearCola: (mechKey) => set((s) => {
        const next = { ...s.cola };
        delete next[mechKey];
        return { cola: next };
      }),
    }),
    {
      name: 'taller_shared_v1',
      // localStorage por defecto. Firestore sync TODO.
    },
  ),
);

/**
 * Calcula capacidad efectiva de un mech: minutos disponibles × parallelism
 * por equipos + extra por turnos extendidos.
 *
 * Si 0 equipos asignados → 0 trabajo posible (item queda en cola).
 *
 * @param minutosBaseGlobal minutos base del pool global (sin teams mult).
 *                          Calcular con calcularMinutosDisponibles({valor, unidad, turnosExtendidos:0}).
 */
export function getMechCapacity(
  assignment: MechAssignment | undefined,
  minutosBaseGlobal: number,
  minutosExtraPorTurno: number,
): {
  teamsCount:        number;
  astechsCount:      number;
  minutosBase:       number;
  minutosExtra:      number;
  minutosDisponibles: number;
  minutosUsados:     number;
  minutosRestantes:  number;
  canWork:           boolean;
} {
  const a = assignment ?? { teams: [], turnosExt: 0, minutosUsados: 0 };
  const teamsCount   = a.teams.length;
  const astechsCount = a.teams.reduce((s, t) => s + t.astechs, 0);
  // N equipos = N × capacidad paralelo (cada equipo trabaja sus 8h)
  const minutosBase  = teamsCount * minutosBaseGlobal;
  const minutosExtra = a.turnosExt * minutosExtraPorTurno * teamsCount;
  const minutosDisp  = minutosBase + minutosExtra;
  const minutosRest  = Math.max(0, minutosDisp - a.minutosUsados);
  return {
    teamsCount,
    astechsCount,
    minutosBase,
    minutosExtra,
    minutosDisponibles: minutosDisp,
    minutosUsados:      a.minutosUsados,
    minutosRestantes:   minutosRest,
    canWork:            teamsCount > 0,
  };
}

/** Suma equipos+astechs ya asignados across todos los mechs. */
export function getPoolUsage(
  asignaciones: Record<string, MechAssignment>,
): { teamsUsed: number; astechsUsed: number } {
  let teams = 0;
  let astechs = 0;
  for (const a of Object.values(asignaciones)) {
    teams += a.teams.length;
    astechs += a.teams.reduce((s, t) => s + t.astechs, 0);
  }
  return { teamsUsed: teams, astechsUsed: astechs };
}

/* ═══════════════════════════════════════════════════════════════
   Sync Firestore (config/main.TALLER_SHARED_JSON)
   ─────────────────────────────────────────────────────────────── */

export interface TallerSharedSnapshot {
  tiempoGlobal: TallerSharedState['tiempoGlobal'];
  asignaciones: TallerSharedState['asignaciones'];
  cola:         TallerSharedState['cola'];
}

export function serializeTaller(): string {
  const s = useTallerShared.getState();
  const snap: TallerSharedSnapshot = {
    tiempoGlobal: s.tiempoGlobal,
    asignaciones: s.asignaciones,
    cola:         s.cola,
  };
  return JSON.stringify(snap);
}

export function hydrateTaller(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const snap = JSON.parse(raw) as Partial<TallerSharedSnapshot>;
    useTallerShared.setState({
      ...(snap.tiempoGlobal ? { tiempoGlobal: snap.tiempoGlobal } : {}),
      ...(snap.asignaciones ? { asignaciones: snap.asignaciones } : {}),
      ...(snap.cola         ? { cola:         snap.cola         } : {}),
    });
    return true;
  } catch (e) {
    console.warn('[taller-shared] hydrate failed', e);
    return false;
  }
}
