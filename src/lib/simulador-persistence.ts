// ═══════════════════════════════════════════════════════════════
// SIMULADOR PERSISTENCE — localStorage snapshot + sync con Fuerzas
// ═══════════════════════════════════════════════════════════════
import type { MechSlot, VehicleSlot, InfantrySlot, BASlot } from './combat-types';

export const SNAPSHOT_SCHEMA = 1 as const;
export const SNAPSHOT_KEY = 'kk_simulador_session_v1';

export interface SimuladorSnapshot {
  schemaVersion: typeof SNAPSHOT_SCHEMA;
  updatedAt: string; // ISO
  activeTab: 'mechs' | 'vehicles';
  currentMechIdx: number;
  currentVehicleIdx: number;
  activeInfantryIdx: number;
  activeBAIdx: number;
  mechSlots: MechSlot[];
  vehicleSlots: VehicleSlot[];
  infantrySlots: InfantrySlot[];
  baSlots: BASlot[];
}

/** Lee snapshot local. Devuelve null si no existe o schema cambió. */
export function loadLocalSnapshot(): SimuladorSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== SNAPSHOT_SCHEMA) {
      console.warn(`[simulador] snapshot schema mismatch (${parsed?.schemaVersion} vs ${SNAPSHOT_SCHEMA}), descartado`);
      return null;
    }
    return parsed as SimuladorSnapshot;
  } catch (e) {
    console.error('[simulador] error leyendo snapshot:', e);
    return null;
  }
}

/** Escribe snapshot a localStorage. Sin debounce — cambios discretos. */
export function saveLocalSnapshot(snap: Omit<SimuladorSnapshot, 'schemaVersion' | 'updatedAt'>): void {
  try {
    const full: SimuladorSnapshot = {
      schemaVersion: SNAPSHOT_SCHEMA,
      updatedAt: new Date().toISOString(),
      ...snap,
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(full));
  } catch (e) {
    console.error('[simulador] error guardando snapshot:', e);
  }
}

/** Borra snapshot local (útil al cerrar misión). */
export function clearLocalSnapshot(): void {
  localStorage.removeItem(SNAPSHOT_KEY);
}

/**
 * Restaura totalmente un mech slot del simulador a estado nuevo:
 *  - armor → state.armor (máximo)
 *  - is    → state.is (máximo)
 *  - crits hit=false
 *  - ammoBins[].current = max
 *  - heat=0, wounds=0, destroyed=false
 *
 * Usado tras pagar reparación completa en TallerModal.
 * Si slotIdx fuera de rango o slot sin state/session → no-op.
 * Devuelve true si se aplicó cambio.
 */
export function restoreMechSlotFull(slotIdx: number): boolean {
  const snap = loadLocalSnapshot();
  if (!snap) return false;
  const slot = snap.mechSlots[slotIdx];
  if (!slot?.state || !slot?.session) return false;

  const st = slot.state;
  const se = slot.session;

  // Armor + IS al máximo desde state
  se.armor = { ...(st.armor as Record<string, number>) };
  se.is    = { ...(st.is    as Record<string, number>) };

  // Crits limpios
  for (const loc of Object.keys(se.crits || {})) {
    se.crits[loc] = se.crits[loc].map(c => ({ ...c, hit: false }));
  }

  // Ammo refill (bins + grupos agregados)
  se.ammoBins = (se.ammoBins || []).map(b => ({ ...b, current: b.max }));
  se.ammoGroups = {};
  se.ammoGroupMax = {};
  for (const b of se.ammoBins) {
    const key = `${b.loc}::${b.familyKey}`;
    se.ammoGroups[key]    = (se.ammoGroups[key]    || 0) + b.current;
    se.ammoGroupMax[key]  = (se.ammoGroupMax[key]  || 0) + b.max;
  }
  // Limpia shots pendientes + activeShots
  se.activeShots = {};
  se.shotSpend = {};

  // Reset combat
  se.heat = 0;
  se.wounds = 0;
  se.destroyed = false;
  se.destroyedReason = '';
  se.weaponMods = {};
  se.critMods = {};
  se.logs = ['> RESTAURADO TRAS REPARACIÓN COMPLETA (Taller)', ...(se.logs || [])].slice(0, 50);

  saveLocalSnapshot({
    activeTab:         snap.activeTab,
    currentMechIdx:    snap.currentMechIdx,
    currentVehicleIdx: snap.currentVehicleIdx,
    activeInfantryIdx: snap.activeInfantryIdx,
    activeBAIdx:       snap.activeBAIdx,
    mechSlots:         snap.mechSlots,
    vehicleSlots:      snap.vehicleSlots,
    infantrySlots:     snap.infantrySlots,
    baSlots:           snap.baSlots,
  });
  return true;
}

// ── Mantenimiento por slot ─────────────────────────────────

import { DEFAULT_MAINTENANCE_STATE, type MechMaintenanceState } from './maintenance-engine';

/** Lee MechMaintenanceState de un slot del simulador.
 *  Devuelve DEFAULT_MAINTENANCE_STATE si no existe (snapshot viejo). */
export function loadMechMaintenance(slotIdx: number): MechMaintenanceState {
  const snap = loadLocalSnapshot();
  const slot = snap?.mechSlots[slotIdx];
  if (!slot?.maintenance) return { ...DEFAULT_MAINTENANCE_STATE, historial: [] };
  return slot.maintenance;
}

/** Persiste MechMaintenanceState en el slot. No-op si snapshot/slot no existe. */
export function saveMechMaintenance(slotIdx: number, state: MechMaintenanceState): boolean {
  const snap = loadLocalSnapshot();
  if (!snap) return false;
  const slot = snap.mechSlots[slotIdx];
  if (!slot) return false;
  slot.maintenance = state;
  saveLocalSnapshot({
    activeTab:         snap.activeTab,
    currentMechIdx:    snap.currentMechIdx,
    currentVehicleIdx: snap.currentVehicleIdx,
    activeInfantryIdx: snap.activeInfantryIdx,
    activeBAIdx:       snap.activeBAIdx,
    mechSlots:         snap.mechSlots,
    vehicleSlots:      snap.vehicleSlots,
    infantrySlots:     snap.infantrySlots,
    baSlots:           snap.baSlots,
  });
  return true;
}

/** True si el snapshot tiene al menos una unidad cargada (state!=null en algún slot). */
export function snapshotHasUnits(snap: SimuladorSnapshot): boolean {
  return (
    snap.mechSlots.some(s => s?.state) ||
    snap.vehicleSlots.some(s => s?.state) ||
    snap.infantrySlots.some(s => s?.state) ||
    snap.baSlots.some(s => s?.state)
  );
}

// ── Sync status ─────────────────────────────────────────────────

export type SyncStatus = 'synced' | 'dirty' | 'pushing' | 'error' | 'offline';

/** Etiqueta humana para tooltip del indicador. */
export function syncStatusLabel(status: SyncStatus, lastSync?: string | null, error?: string | null): string {
  switch (status) {
    case 'synced': return lastSync ? `Sincronizado · ${new Date(lastSync).toLocaleTimeString('es-ES')}` : 'Sincronizado';
    case 'dirty':  return 'Cambios locales sin guardar';
    case 'pushing': return 'Guardando…';
    case 'error':  return `Error: ${error ?? 'desconocido'}`;
    case 'offline': return 'Sin sesión activa';
  }
}

// ── Integración Hangar ──────────────────────────────────────────────────

import type { MechSession, MechState } from './combat-types';
import type { MechRepairDamage } from './repair-engine';
import type { HangarItem } from './hangar-types';

/** Extrae el daño actual de la sesión a un formato persistible en el hangar. */
export function extractDamageFromSession(state: MechState, session: MechSession): {
  estadoPct: number;
  damagePersist: MechRepairDamage;
  sessionActiva: NonNullable<HangarItem['sessionActiva']>;
} {
  const armorLocs = ['HD','CTf','CTr','LTf','LTr','RTf','RTr','LA','RA','LL','RL'];
  const isLocs    = ['HD','CT','LT','RT','LA','RA','LL','RL'];

  let armorMax = 0, armorCur = 0;
  for (const k of armorLocs) {
    armorMax += (state.armor as any)[k] ?? 0;
    armorCur += session.armor[k] ?? 0;
  }

  let isMax = 0, isCur = 0;
  for (const k of isLocs) {
    isMax += (state.is as any)[k] ?? 0;
    isCur += session.is[k] ?? 0;
  }

  const total = armorMax + isMax;
  const estadoPct = session.destroyed ? 0 : (total > 0 ? Math.round(((armorCur + isCur) / total) * 100) : 100);

  // Contar críticos de reactor y gyro
  let engineHits = 0;
  let gyroHits = 0;
  let cockpitHit = false;
  let lifeSupportHits = 0;
  let sensorsHits = 0;

  for (const loc of Object.keys(session.crits || {})) {
    for (const c of session.crits[loc]) {
      if (c.hit) {
        const n = c.name.toLowerCase();
        if (n.includes('engine') || n.includes('reactor')) engineHits++;
        if (n.includes('gyro')) gyroHits++;
        if (n.includes('cockpit') || n.includes('cabina')) cockpitHit = true;
        if (n.includes('life support') || n.includes('soporte vital')) lifeSupportHits++;
        if (n.includes('sensors') || n.includes('sensores')) sensorsHits++;
      }
    }
  }

  const damagePersist: MechRepairDamage = {
    reactor: Math.min(3, engineHits),
    gyro: Math.min(2, gyroHits),
    cabinaDañada: cockpitHit,
    soporteVida: lifeSupportHits,
    sensores: sensorsHits,
    estructura: Math.max(0, isMax - isCur),
    blindaje: Math.max(0, armorMax - armorCur),
    miomero: 0,
    retros: 0,
    radiadores: 0,
    actuadores: {},
  };

  const sessionActiva = {
    armor: { ...session.armor },
    is: { ...session.is },
    crits: JSON.parse(JSON.stringify(session.crits)),
    ammoBins: JSON.parse(JSON.stringify(session.ammoBins)),
    destroyed: session.destroyed,
    destroyedReason: session.destroyedReason,
  };

  return { estadoPct, damagePersist, sessionActiva };
}

/** Aplica el daño guardado en el hangar a una sesión recién instanciada. */
export function applyDamageToSession(session: MechSession, item: HangarItem): void {
  if (!item.sessionActiva) return;
  const src = item.sessionActiva;
  
  // Copia profunda de los campos persistidos
  if (src.armor) session.armor = { ...src.armor };
  if (src.is) session.is = { ...src.is };
  if (src.crits) session.crits = JSON.parse(JSON.stringify(src.crits));
  if (src.ammoBins) {
    // Restaurar los consumos de munición
    for (let i = 0; i < src.ammoBins.length; i++) {
      if (session.ammoBins[i] && src.ammoBins[i]) {
        session.ammoBins[i].current = src.ammoBins[i].current;
      }
    }
    // Recalcular grupos
    session.ammoGroups = {};
    session.ammoGroupMax = {};
    for (const b of session.ammoBins) {
      const key = `${b.loc}::${b.familyKey}`;
      session.ammoGroups[key]   = (session.ammoGroups[key]   || 0) + b.current;
      session.ammoGroupMax[key] = (session.ammoGroupMax[key] || 0) + b.max;
    }
  }
  session.destroyed = src.destroyed || false;
  session.destroyedReason = src.destroyedReason || '';
}
