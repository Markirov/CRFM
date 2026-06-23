// ══════════════════════════════════════════════════════════════
//  taller-sources.ts — Combina mechs del simulador (slots cargados)
//  con mechs del hangar (inventario persistente) en un único array
//  de fuentes seleccionables desde TallerPage.
//
//  Concepto: un MechSource es lo que sea sobre lo que estamos
//  reparando o haciendo mantenimiento. Dos orígenes:
//    - 'sim'    → slot del simulador (efímero, en sesión actual)
//    - 'hangar' → item del hangar (persistente Firestore)
// ══════════════════════════════════════════════════════════════

import { configFromCatalog, deriveDamageFromSession, type MechRepairConfig, type MechRepairDamage } from './repair-engine';
import { emptyDamage, mergeDamage } from './maintenance-engine';
import { loadMechMaintenance, type SimuladorSnapshot } from './simulador-persistence';
import type { HangarItem } from './hangar-types';
import type { RosterEntry } from './roster';

export type SourceOrigin = 'sim' | 'hangar';

export interface MechSource {
  /** Clave única para selección. 'sim:N' o 'hangar:hng_xxx'. */
  key:       string;
  origin:    SourceOrigin;
  /** Nombre mostrado en el panel (chassis + model). */
  label:     string;
  /** Etiqueta corta para el botón (iniciales piloto, número slot, etc.). */
  shortLabel: string;
  /** Color de acento para el badge. */
  accent:    'amber' | 'green';
  /** Si está asignado a piloto (modo campaña), iniciales del PJ. */
  pilotShort?: string;
  pilotIdx?:  number;
  mechName:  string;
  /** Chasis solo (sin variant/model). Usado para chassis-locked armor pool. */
  chassis:   string;
  tons:      number;
  config:    MechRepairConfig;
  damage:    MechRepairDamage;
  /** Slot del simulador (solo si origin === 'sim'). */
  simSlotIdx?: number;
  /** ID del HangarItem (solo si origin === 'hangar'). */
  hangarId?:  string;
}

/** Iniciales 2-letras del nombre del piloto para badges. */
function pilotInitials(roster: RosterEntry[], idx: number | undefined): string | undefined {
  if (idx === undefined || !roster[idx]) return undefined;
  const r = roster[idx];
  const src = r.apodo || r.nombre || r.jugador;
  if (!src) return undefined;
  return src.slice(0, 2).toUpperCase();
}

/** WalkMP por tonelaje — fallback razonable si el HangarItem no
 *  tiene metadata completa. Usado solo para estimar engine rating. */
function defaultWalkMP(tons: number): number {
  if (tons <= 25) return 6;
  if (tons <= 55) return 5;
  if (tons <= 75) return 4;
  return 3;
}

/** Construye lista combinada de fuentes seleccionables en Taller.
 *  Orden: hangar (campaña) primero, sim slots después. */
export function buildMechSources(
  hangarItems: HangarItem[],
  snap: SimuladorSnapshot | null,
  roster: RosterEntry[],
): MechSource[] {
  const sources: MechSource[] = [];

  // ── HANGAR (campaña / persistente) ──
  for (const it of hangarItems) {
    // TODO: filtrar destruidos/desguazados cuando exista HangarItem.estado.

    const config = configFromCatalog({
      tons:      it.tons,
      walkMP:    defaultWalkMP(it.tons),
      armor:     { type: 'Standard' },
      engine:    { type: 'Fusion', rating: defaultWalkMP(it.tons) * it.tons },
      heatSinks: { type: 'Single' },
    });

    sources.push({
      key:        `hangar:${it.id}`,
      origin:     'hangar',
      label:      `${it.chassis} ${it.model}`,
      shortLabel: pilotInitials(roster, it.pilotoIdx) ?? '⌂',
      accent:     'amber',
      pilotShort: pilotInitials(roster, it.pilotoIdx),
      pilotIdx:   it.pilotoIdx,
      mechName:   `${it.chassis} ${it.model}`,
      chassis:    it.chassis,
      tons:       it.tons,
      config,
      damage:     it.damagePersist ?? emptyDamage(),
      hangarId:   it.id,
    });
  }

  // ── SIM (slots cargados en sesión actual) ──
  if (snap) {
    snap.mechSlots.forEach((slot, idx) => {
      if (!slot?.state || !slot?.session) return;
      const st = slot.state;
      const { damage } = deriveDamageFromSession(st, slot.session);
      const mant = loadMechMaintenance(idx);
      const merged = mant.extraDamage ? mergeDamage(damage, mant.extraDamage) : damage;

      const config: MechRepairConfig = configFromCatalog({
        tons:      st.tonnage,
        walkMP:    st.walkMP,
        armor:     { type: st.armorType || 'Standard' },
        engine:    { type: 'Fusion', rating: st.walkMP * st.tonnage },
        heatSinks: { type: st.hsDouble ? 'Double' : 'Single' },
      });

      sources.push({
        key:        `sim:${idx}`,
        origin:     'sim',
        label:      `${st.chassis} ${st.model}`,
        shortLabel: String(idx + 1),
        accent:     'green',
        mechName:   `${st.chassis} ${st.model}`,
        chassis:    st.chassis,
        tons:       st.tonnage,
        config,
        damage:     merged,
        simSlotIdx: idx,
      });
    });
  }

  return sources;
}
