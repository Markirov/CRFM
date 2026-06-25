// ═══════════════════════════════════════════════════════════════
// FIREBASE/FIRESTORE SERVICE — espejo de sheets-service.ts
// Mantiene firmas idénticas. Reemplaza Apps Script por Firestore.
// ═══════════════════════════════════════════════════════════════
//
// Estructura Firestore:
//
//   config/main                       — doc único key/value (CONTRATO_VALOR,
//                                       FUERZA1..5, FUERZACAMPAÑA,
//                                       ENEMIGO1..5, ESTADOMECHS, etc.)
//   personajes/{nombre}               — PJ/PNJ (cols A-Q Personajes)
//   personal/{id}                     — techs, astechs, medicos, etc.
//   libroMayor/{id}                   — transacciones tesorería
//   fuerzas/{id}                      — snapshots simulador
//   cronicas/{id}                     — narrativa campaña
//   ordenDia/{id}                     — órdenes diarias
//   parteDiario/{id}                  — partes diarios
//   historial/{id}                    — registros mision (Hoja Servicio)
//   logros/{id}                       — logros pilotos
//   mejoras/{id}                      — XP gastado en subidas
//   gastosXP/{id}                     — gastos XP varios
//   hangar/{id}                       — inventario de mechs (HangarItem)
//
// API envelope: { success: boolean, data?: any, error?: string }
// Igual que sheets-service para compat 1:1 con código existente.
// ═══════════════════════════════════════════════════════════════

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  deleteField,
  query, orderBy, limit as fsLimit,
} from 'firebase/firestore';
import { db, auth } from './firebase-config';
import type { SimuladorSnapshot } from './simulador-persistence';

// ── Helpers envelope ────────────────────────────────────────────
type Envelope<T = unknown> = { success: boolean; data?: T; error?: string };

async function safe<T>(fn: () => Promise<T>): Promise<Envelope<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (e: unknown) {
    console.error('[firebase] error:', e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Shims sheetsGet/sheetsPost ──────────────────────────────────
// Routean acciones legacy a sus equivalentes Firestore. Devuelven
// el mismo envelope para compat con call-sites antiguos (roster.ts,
// telegram-service.ts).

export async function sheetsGet(params: Record<string, string>) {
  const action = params.action;
  switch (action) {
    case 'getRoster':           return await loadRosterAsEnvelope();
    case 'getConfiguracion':    return await loadConfig();
    case 'getLogros':           return await loadLogros();
    case 'getHistorial':        return await loadHistorial();
    case 'getLibroMayor':       return await loadLibroMayor();
    case 'getPersonal':         return await loadPersonal();
    case 'getFuerzas':          return await loadFuerzas();
    case 'getCronicas':         return await loadCronicas();
    case 'getOrdenDia':         return await loadOrdenDia();
    case 'getParteDiario':      return await loadParteDiario();
    case 'getMovimientos':      return await loadMovimientos(Number(params.limit) || 5);
    case 'getHangar':           return await loadHangar();
  }
  // Por defecto: si trae 'jugador' sin action → loadPlayer
  if (params.jugador && !action) return await loadPlayer(params.jugador);
  console.warn('[firebase] sheetsGet sin handler:', params);
  return { success: false, error: `Acción no soportada en Firebase: ${action}` };
}

export async function sheetsPost(_body: Record<string, unknown>) {
  console.warn('[firebase] sheetsPost legacy llamado, no-op:', _body);
  return { success: false, error: 'sheetsPost legacy no soportado — usar funciones directas firebase-service' };
}

// ═══════════════════════════════════════════════════════════════
// CONFIG (split: config/main = admin-only; config/sim = PJ writable)
// ═══════════════════════════════════════════════════════════════
//
// SEGURIDAD: config/main rules = staff read / admin write. Contiene
// CONTRATO_VALOR, AÑO/MES, prompts IA, public_roles, etc. Datos
// sensibles que solo admin debería tocar.
//
// config/sim rules = hasAnyRole read+write. Contiene FUERZA_*,
// FUERZACAMPAÑA, ENEMIGO*, ESTADOMECHS, PILOTO_*_MECH. Necesario
// que PJ (simulador) y DM puedan escribir en su flujo de combate.
//
// loadConfig() lee ambos y mergea (sim sobrescribe a main si colisión).
// saveConfigBatch() reparte cada key a su doc según SIM_KEY_PREFIXES.

const CONFIG_MAIN_REF = () => doc(db, 'config', 'main');
const CONFIG_SIM_REF  = () => doc(db, 'config', 'sim');

// Mantener export por compat con código viejo que importe CONFIG_REF
// (apunta a main; SOLO usar para datos admin).
const CONFIG_REF = CONFIG_MAIN_REF;

/** Whitelist exacta de keys SIM. Resto va a config/main.
 *  Atención: `PILOTO_*_MECH` solo (asignación de mech). `PILOTO_*_NOMBRE`
 *  y `PILOTO_*_APODO` son datos editables solo por admin → config/main. */
function isSimKey(key: string): boolean {
  if (key.startsWith('FUERZA_'))      return true;   // FUERZA_<safeEmail>_<slot>
  if (key === 'FUERZACAMPAÑA')        return true;
  if (key === 'FUERZACAMPANA')        return true;   // sin-ñ defensivo
  if (/^ENEMIGO\d+$/.test(key))       return true;   // ENEMIGO1..N
  if (key === 'ESTADOMECHS')          return true;
  if (/^PILOTO_\d+_MECH$/.test(key))  return true;   // solo _MECH, no _NOMBRE/_APODO
  return false;
}

export const loadConfig = async (): Promise<{ success: boolean; data?: { config: Record<string, unknown> }; error?: string }> => {
  try {
    const [mainSnap, simSnap] = await Promise.all([getDoc(CONFIG_MAIN_REF()), getDoc(CONFIG_SIM_REF())]);
    const main: Record<string, unknown> = mainSnap.exists() ? (mainSnap.data() as Record<string, unknown>) : {};
    const sim:  Record<string, unknown> = simSnap.exists()  ? (simSnap.data()  as Record<string, unknown>) : {};
    // Defensa en profundidad: del doc sim solo aceptamos keys SIM_* o las
    // FUERZA_<email>_<slot> que matchean por prefijo. Si alguien escribe
    // CONTRATO_VALOR en config/sim por error/maliciosamente, lo ignoramos.
    const simFiltered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sim)) if (isSimKey(k)) simFiltered[k] = v;
    const config = { ...main, ...simFiltered };
    return { success: true, data: { config } };
  } catch (e: unknown) {
    console.error('[firebase] loadConfig:', e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
};

export const saveConfigBatch = (config: Record<string, string>) =>
  safe(async () => {
    const mainPatch: Record<string, string> = {};
    const simPatch:  Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) {
      (isSimKey(k) ? simPatch : mainPatch)[k] = v;
    }
    const ops: Promise<unknown>[] = [];
    if (Object.keys(mainPatch).length) ops.push(setDoc(CONFIG_MAIN_REF(), mainPatch, { merge: true }));
    if (Object.keys(simPatch).length)  ops.push(setDoc(CONFIG_SIM_REF(),  simPatch,  { merge: true }));
    await Promise.all(ops);
    return { saved: Object.keys(config).length };
  });

// ═══════════════════════════════════════════════════════════════
// PERSONAJES (PJ + PNJ)
// ═══════════════════════════════════════════════════════════════

const PERSONAJES_COL = () => collection(db, 'personajes');

/** Lee un jugador por nombre (= doc id). Devuelve envelope shape Apps Script. */
export const loadPlayer = (name: string): Promise<Envelope<unknown>> =>
  safe(async () => {
    const snap = await getDoc(doc(PERSONAJES_COL(), name));
    if (!snap.exists()) return { result: 'success', msg: '', personajes: [], jugador: name };
    const obj = { jugador: name, ...snap.data() };
    return { result: 'success', msg: '', personajes: [obj], ...obj };
  });

export const searchPilots = (name: string): Promise<Envelope<unknown>> => loadPlayer(name);

/** Hoja de unidad — col Q (mech asignado) + datos base. */
export const loadUnitSheet = (name: string): Promise<Envelope<unknown>> => loadPlayer(name);

export const savePlayer = (data: Record<string, unknown>): Promise<Envelope<unknown>> =>
  safe(async () => {
    const id = String(data.jugador ?? data.nombre ?? '').trim();
    if (!id) throw new Error('savePlayer: falta jugador/nombre');
    await setDoc(doc(PERSONAJES_COL(), id), data, { merge: true });
    return { id, result: 'success', msg: 'Guardado' };
  });

export const savePilot = (data: Record<string, unknown>): Promise<Envelope<unknown>> => savePlayer(data);

/** Lista todos los personajes archivados como reserva (PJ ó PNJ).
 *  Convención: doc id contiene "__reserva_" ó "__pj_reserva_". */
export const loadReservas = (): Promise<Envelope<{ reservas: Array<Record<string, unknown> & { id: string }> }>> =>
  safe(async () => {
    const snap = await getDocs(PERSONAJES_COL());
    const reservas = snap.docs
      .filter(d => d.id.includes('__reserva_') || d.id.includes('__pj_reserva_'))
      .map(d => ({ id: d.id, ...d.data() }));
    return { reservas };
  });

/** Borra doc personajes/{id}. Admin-only en rules. */
export const deletePlayer = (id: string): Promise<Envelope<{ id: string }>> =>
  safe(async () => {
    await deleteDoc(doc(PERSONAJES_COL(), id));
    return { id };
  });

/** Migración: borra mech asignado del piloto en config/main
 *  (PILOTO_N_MECH) y en cada doc de `personajes/` (campo `mech`).
 *  Hangar ahora es la fuente única; legacy se purga. */
export const resetLegacyMechAssignments = () =>
  safe(async () => {
    // 1) Borra PILOTO_1_MECH..PILOTO_6_MECH (SIM keys → config/sim).
    //    saveConfigBatch enruta automáticamente.
    //    Esta función solo la invoca admin desde SecretMenu, por lo que
    //    además podemos limpiar la copia legacy en config/main.
    const cfgPatch: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) cfgPatch[`PILOTO_${i}_MECH`] = '';
    await saveConfigBatch(cfgPatch);
    await setDoc(CONFIG_MAIN_REF(), cfgPatch, { merge: true }).catch(() => {});

    // 2) Borra `mech` de todos los personajes
    const snap = await getDocs(PERSONAJES_COL());
    const ops: Promise<unknown>[] = [];
    let touched = 0;
    snap.forEach(d => {
      const data = d.data() as Record<string, unknown>;
      if (data?.mech) {
        ops.push(setDoc(doc(PERSONAJES_COL(), d.id), { mech: '' }, { merge: true }));
        touched++;
      }
    });
    await Promise.all(ops);
    return { configCleared: 6, personajesCleared: touched };
  });

// ── Roster (derivado de collection personajes) ─────────────────

const CAMPAIGN_PILOT_ORDER = ['Jaime', 'Marcos', 'Joan', 'Alex', 'Erik', 'Zhao', 'Val', 'Tariq'];

function pickSkillLevel(extraSkills: unknown, names: string[]): number | null {
  if (!Array.isArray(extraSkills)) return null;
  for (const s of extraSkills as Record<string, unknown>[]) {
    if (!s?.name) continue;
    const n = String(s.name).toLowerCase();
    if (names.some(target => n === target.toLowerCase())) {
      const lvl = Number(s.level);
      return Number.isFinite(lvl) ? lvl : null;
    }
  }
  return null;
}

async function loadRosterAsEnvelope() {
  try {
    const snap = await getDocs(PERSONAJES_COL());
    const roster = snap.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      const jugador = String(data.jugador ?? d.id);
      const orderIdx = CAMPAIGN_PILOT_ORDER.indexOf(jugador);
      return {
        order:         orderIdx >= 0 ? orderIdx + 1 : 99,
        fila:          0,
        nombre:        data.nombre ?? '',
        nombreDisplay: data.nombreDisplay ?? data.nombre ?? '',
        jugador,
        apodo:         data.apodo ?? '',
        origen:        data.origen ?? '',
        afiliacion:    data.afiliacion ?? '',
        mech:          data.mech ?? '',
        xpTotal:       Number(data.xpTotal) || 0,
        xpDisponible:  Number(data.xpDisponible ?? data.xpTotal) || 0,
        sueldo:        data.sueldo ?? '',
        dinero:        data.cbills ?? data.dinero ?? '',
        estado:        data.estado ?? 'activo',
        lanza:         data.lanza ?? '',
        disparoMech:   data.disparoMech ?? pickSkillLevel(data.extraSkills, ['Disparo Mech', 'Disparar Mech']),
        pilotajeMech:  data.pilotajeMech ?? pickSkillLevel(data.extraSkills, ['Pilotar Mech', 'Pilotaje Mech']),
        pnj:           typeof data.pnj === 'boolean' ? data.pnj : undefined,
        patrimonio:      data.patrimonio ?? 0,
        equipoPersonal:  data.equipoPersonal ?? '',
        rpgFinanzas:     data.rpgFinanzas ?? {},
      };
    }).sort((a, b) => a.order - b.order);
    return { success: true, data: { roster } };
  } catch (e: unknown) {
    console.error('[firebase] loadRoster:', e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Borra mech asignado (col Q) de un jugador. */
export const removeMechFromUnit = (jugador: string) =>
  safe(async () => {
    await setDoc(doc(PERSONAJES_COL(), jugador), { unidad: '' }, { merge: true });
    return { jugador };
  });

// ═══════════════════════════════════════════════════════════════
// PERSONAL (techs, astechs, médicos…)
// ═══════════════════════════════════════════════════════════════

export type PersonalRol =
  | 'mech_tech' | 'astech' | 'medico' | 'representante' | 'seguridad'
  | 'administrativo' | 'infanteria' | 'tripulacion_vehiculo'
  | 'tripulacion_nave' | 'piloto_aerospace' | 'battle_armor'
  | 'quartermaster' | 'oficial_radio' | 'comstar_liaison'
  | 'ingeniero_combate' | 'intel_officer' | 'chaplain' | 'otros';

export type PersonalNivel = 'green' | 'regular' | 'veteran' | 'elite';
export type PersonalEstado = 'activo' | 'baja' | 'kia' | 'retirado';

export interface PersonalEntry {
  id:         string;
  rol:        PersonalRol;
  nombre:     string;
  nivel:      PersonalNivel;
  sueldoMes:  number;
  fechaAlta:  string;
  estado:     PersonalEstado;
  nota:       string;
  cantidad:   number;
}

const PERSONAL_COL = () => collection(db, 'personal');

export const loadPersonal = () =>
  safe(async () => {
    const snap = await getDocs(PERSONAL_COL());
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PersonalEntry[];
    return { entries, personal: entries };
  });

export const savePersonalEntry = (e: PersonalEntry) =>
  safe(async () => {
    const id = e.id || newId();
    await setDoc(doc(PERSONAL_COL(), id), { ...e, id }, { merge: true });
    return { id };
  });

export const deletePersonalEntry = (id: string) =>
  safe(async () => {
    await deleteDoc(doc(PERSONAL_COL(), id));
    return { id };
  });

// ═══════════════════════════════════════════════════════════════
// LIBRO MAYOR
// ═══════════════════════════════════════════════════════════════

export type LibroMayorTipo = 'ingreso' | 'gasto';
export type LibroMayorCategoria =
  | 'contrato_secundario' | 'compra_mech' | 'venta_mech' | 'repuestos'
  | 'sueldo_extra' | 'soborno' | 'mantenimiento_mensual' | 'transporte'
  | 'gasto_misc' | 'ingreso_misc';

export interface LibroMayorEntry {
  id:        string;
  fecha:     string;
  concepto:  string;
  cantidad:  number;
  tipo:      LibroMayorTipo;
  categoria: LibroMayorCategoria;
  nota:      string;
  jugador:   string;
}

const LIBRO_COL = () => collection(db, 'libroMayor');

export const loadLibroMayor = () =>
  safe(async () => {
    const snap = await getDocs(query(LIBRO_COL(), orderBy('fecha', 'desc'), fsLimit(30)));
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LibroMayorEntry[];
    return { entries, libro: entries };
  });

export const saveLibroMayorEntry = (e: LibroMayorEntry) =>
  safe(async () => {
    const id = e.id || newId();
    await setDoc(doc(LIBRO_COL(), id), { ...e, id }, { merge: true });
    return { id };
  });

export const deleteLibroMayorEntry = (id: string) =>
  safe(async () => {
    await deleteDoc(doc(LIBRO_COL(), id));
    return { id };
  });

/** Wrapper: persiste entry + actualiza store optimista. CONTRATO_VALOR
 *  era fórmula en Sheets; en Firestore se calcula al leer libro completo
 *  (no se persiste explícitamente). */
export async function commitLibroEntryAndTreasury(
  entry: LibroMayorEntry,
  prevEntry?: LibroMayorEntry | null,
): Promise<void> {
  const { useAppStore } = await import('./store');
  const { parseCurrencyValue, formatCzar } = await import('./currency-utils');
  const state = useAppStore.getState();

  await saveLibroMayorEntry(entry);

  const cur = parseCurrencyValue(state.campaign.contratoValor) ?? 0;
  let delta = entry.tipo === 'ingreso' ? entry.cantidad : -entry.cantidad;
  if (prevEntry) {
    delta -= prevEntry.tipo === 'ingreso' ? prevEntry.cantidad : -prevEntry.cantidad;
  }
  const newVal = cur + delta;
  const newContratoValor = formatCzar(newVal).replace(' ₡', '');
  state.setCampaign({ contratoValor: newContratoValor });
  await saveConfigBatch({ CONTRATO_VALOR: newContratoValor });
}

export async function deleteLibroEntryAndTreasury(entry: LibroMayorEntry): Promise<void> {
  const { useAppStore } = await import('./store');
  const { parseCurrencyValue, formatCzar } = await import('./currency-utils');
  const state = useAppStore.getState();

  await deleteLibroMayorEntry(entry.id);

  const cur = parseCurrencyValue(state.campaign.contratoValor) ?? 0;
  const delta = entry.tipo === 'ingreso' ? -entry.cantidad : entry.cantidad;
  const newVal = cur + delta;
  const newContratoValor = formatCzar(newVal).replace(' ₡', '');
  state.setCampaign({ contratoValor: newContratoValor });
  await saveConfigBatch({ CONTRATO_VALOR: newContratoValor });
}

// ═══════════════════════════════════════════════════════════════
// FUERZAS — slots fijos en config/main (FUERZA1..5, FUERZACAMPAÑA)
// ═══════════════════════════════════════════════════════════════

export type FuerzaSlot = 1 | 2 | 3 | 4 | 5;

export interface FuerzaConfigEntry {
  nombre:    string;
  bv:        number;
  updatedAt: string;
  snapshot:  SimuladorSnapshot;
}

export interface FuerzaEntry {
  id: string;
  nombre: string;
  fecha: string;
  bv: number;
  snapshot: SimuladorSnapshot;
}

export function getSafeEmail(email?: string | null): string {
  if (!email) return 'anonymous';
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

const fuerzaKey = (slot: FuerzaSlot) => `FUERZA_${getSafeEmail(auth?.currentUser?.email)}_${slot}`;
const FUERZA_CAMPANA_KEY = 'FUERZACAMPAÑA';

async function readConfigField(key: string): Promise<string | null> {
  // Lee del doc correcto según key (sim vs main). Fallback al otro si vacío.
  const primary  = isSimKey(key) ? CONFIG_SIM_REF() : CONFIG_MAIN_REF();
  const fallback = isSimKey(key) ? CONFIG_MAIN_REF() : CONFIG_SIM_REF();
  const snap = await getDoc(primary);
  const v = snap.exists() ? (snap.data() as Record<string, unknown>)?.[key] : undefined;
  if (typeof v === 'string') return v;
  // Fallback al otro doc (compat con datos legacy pre-split)
  const fb = await getDoc(fallback);
  const fv = fb.exists() ? (fb.data() as Record<string, unknown>)?.[key] : undefined;
  return typeof fv === 'string' ? fv : null;
}

async function writeConfigField(key: string, value: string): Promise<void> {
  const ref = isSimKey(key) ? CONFIG_SIM_REF() : CONFIG_MAIN_REF();
  await setDoc(ref, { [key]: value }, { merge: true });
}

export async function saveFuerzaConfigSlot(
  slot: FuerzaSlot,
  payload: { nombre: string; bv: number; snapshot: SimuladorSnapshot },
) {
  return safe(async () => {
    const entry: FuerzaConfigEntry = {
      nombre:    payload.nombre,
      bv:        payload.bv,
      updatedAt: new Date().toISOString(),
      snapshot:  payload.snapshot,
    };
    await writeConfigField(fuerzaKey(slot), JSON.stringify(entry));
    return { slot };
  });
}

export async function loadFuerzaConfigSlot(slot: FuerzaSlot): Promise<FuerzaConfigEntry | null> {
  const raw = await readConfigField(fuerzaKey(slot));
  if (!raw) return null;
  try { return JSON.parse(raw) as FuerzaConfigEntry; } catch { return null; }
}

export async function sendFuerzaToUser(
  targetEmail: string,
  payload: { nombre: string; bv: number; snapshot: SimuladorSnapshot }
) {
  return safe(async () => {
    const entry: FuerzaConfigEntry = {
      nombre:    payload.nombre,
      bv:        payload.bv,
      updatedAt: new Date().toISOString(),
      snapshot:  payload.snapshot,
    };
    const targetKey = `FUERZA_${getSafeEmail(targetEmail)}_5`;
    await writeConfigField(targetKey, JSON.stringify(entry));
    return true;
  });
}

export async function loadAllFuerzaConfigSlots(): Promise<Record<FuerzaSlot, FuerzaConfigEntry | null>> {
  const out: Record<FuerzaSlot, FuerzaConfigEntry | null> = { 1: null, 2: null, 3: null, 4: null, 5: null };
  // FUERZA_* vive en config/sim. Fallback a config/main por compat legacy.
  const [simSnap, mainSnap] = await Promise.all([getDoc(CONFIG_SIM_REF()), getDoc(CONFIG_MAIN_REF())]);
  const cfg = { ...(mainSnap.exists() ? mainSnap.data() as Record<string, unknown> : {}), ...(simSnap.exists() ? simSnap.data() as Record<string, unknown> : {}) };
  ([1, 2, 3, 4, 5] as FuerzaSlot[]).forEach(s => {
    const raw = cfg?.[fuerzaKey(s)];
    if (typeof raw === 'string' && raw) {
      try { out[s] = JSON.parse(raw) as FuerzaConfigEntry; } catch {}
    }
  });
  return out;
}

export async function clearFuerzaConfigSlot(slot: FuerzaSlot) {
  return safe(async () => {
    await writeConfigField(fuerzaKey(slot), '');
    return { slot };
  });
}

export async function saveFuerzaCampana(
  payload: { nombre: string; bv: number; snapshot: SimuladorSnapshot },
) {
  return safe(async () => {
    const entry: FuerzaConfigEntry = {
      nombre:    payload.nombre,
      bv:        payload.bv,
      updatedAt: new Date().toISOString(),
      snapshot:  payload.snapshot,
    };
    await writeConfigField(FUERZA_CAMPANA_KEY, JSON.stringify(entry));
    return { ok: true };
  });
}

export async function loadFuerzaCampana(): Promise<FuerzaConfigEntry | null> {
  const raw = await readConfigField(FUERZA_CAMPANA_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as FuerzaConfigEntry; } catch { return null; }
}

// ── Fuerzas (colección dedicada, snapshots libres) ─────────────
const FUERZAS_COL = () => collection(db, 'fuerzas');

export const loadFuerzas = () =>
  safe(async () => {
    const snap = await getDocs(query(FUERZAS_COL(), orderBy('fecha', 'desc')));
    const fuerzas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as FuerzaEntry[];
    return { fuerzas };
  });

export const saveFuerza = (data: {
  id?: string;
  nombre: string;
  bv: number;
  snapshot: SimuladorSnapshot;
}) =>
  safe(async () => {
    const id = data.id || newId();
    const entry: FuerzaEntry = {
      id,
      nombre:   data.nombre,
      fecha:    new Date().toISOString(),
      bv:       data.bv,
      snapshot: data.snapshot,
    };
    await setDoc(doc(FUERZAS_COL(), id), entry, { merge: true });
    return { id };
  });

// ═══════════════════════════════════════════════════════════════
// HANGAR — inventario de mechs propiedad de la compañía
// (distinto de fuerzas/: aquellas son snapshots de simulador,
// hangar son mechs físicos con asignación a piloto + valor + estado)
// ═══════════════════════════════════════════════════════════════

import type { HangarItem } from './hangar-types';

const HANGAR_COL = () => collection(db, 'hangar');

export const loadHangar = () =>
  safe(async () => {
    const snap = await getDocs(query(HANGAR_COL(), orderBy('createdAt', 'asc')));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as HangarItem[];
    return { items };
  });

/** Sanitiza objeto para Firestore:
 *  - undefined en top-level → deleteField() (borra el campo del doc)
 *  - undefined anidado → omitido del objeto
 *  Firestore no acepta undefined, solo null o ausencia. */
function sanitizeForFirestore(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) {
      out[k] = deleteField();
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = stripUndefinedDeep(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function stripUndefinedDeep(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = stripUndefinedDeep(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const saveHangarItem = (item: HangarItem) =>
  safe(async () => {
    const id = item.id;
    const payload = sanitizeForFirestore({ ...item, id, updatedAt: new Date().toISOString() });
    await setDoc(doc(HANGAR_COL(), id), payload, { merge: true });
    return { id };
  });

export const deleteHangarItem = (id: string) =>
  safe(async () => {
    await deleteDoc(doc(HANGAR_COL(), id));
    return { id };
  });

/** Asigna piloto (idx 0..5) o desasigna (pasar undefined). */
export const assignPilotToHangar = (id: string, pilotoIdx: number | undefined) =>
  safe(async () => {
    const patch = sanitizeForFirestore({
      pilotoIdx,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(HANGAR_COL(), id), patch, { merge: true });
    return { id, pilotoIdx };
  });

// ═══════════════════════════════════════════════════════════════
// ENEMIGOS HUD — slots fijos ENEMIGO1..5 en config/main
// ═══════════════════════════════════════════════════════════════

export type EnemigoSlot = 1 | 2 | 3 | 4 | 5;

export interface EnemigoUnitMinimal {
  name:  string;
  xp:    number;
  color: string;
}

export interface EnemigoConfigEntry {
  nombre:    string;
  count:     number;
  totalBV:   number;
  updatedAt: string;
  enemies:   EnemigoUnitMinimal[];
}

const enemigoKey = (slot: EnemigoSlot) => `ENEMIGO${slot}` as const;

export async function saveEnemigoConfigSlot(
  slot: EnemigoSlot,
  payload: { nombre: string; enemies: EnemigoUnitMinimal[] },
) {
  return safe(async () => {
    const totalBV = payload.enemies.reduce((s, e) => s + (e.xp || 0), 0);
    const entry: EnemigoConfigEntry = {
      nombre:    payload.nombre,
      count:     payload.enemies.length,
      totalBV,
      updatedAt: new Date().toISOString(),
      enemies:   payload.enemies,
    };
    await writeConfigField(enemigoKey(slot), JSON.stringify(entry));
    return { slot };
  });
}

export async function loadAllEnemigoConfigSlots(): Promise<Record<EnemigoSlot, EnemigoConfigEntry | null>> {
  const out: Record<EnemigoSlot, EnemigoConfigEntry | null> = { 1: null, 2: null, 3: null, 4: null, 5: null };
  // ENEMIGO* vive en config/sim. Fallback a config/main por compat legacy.
  const [simSnap, mainSnap] = await Promise.all([getDoc(CONFIG_SIM_REF()), getDoc(CONFIG_MAIN_REF())]);
  const cfg = { ...(mainSnap.exists() ? mainSnap.data() as Record<string, unknown> : {}), ...(simSnap.exists() ? simSnap.data() as Record<string, unknown> : {}) };
  ([1, 2, 3, 4, 5] as EnemigoSlot[]).forEach(s => {
    const raw = cfg?.[enemigoKey(s)];
    if (typeof raw === 'string' && raw) {
      try { out[s] = JSON.parse(raw) as EnemigoConfigEntry; } catch {}
    }
  });
  return out;
}

export async function clearEnemigoConfigSlot(slot: EnemigoSlot) {
  return safe(async () => {
    await writeConfigField(enemigoKey(slot), '');
    return { slot };
  });
}

// ═══════════════════════════════════════════════════════════════
// HISTORIAL / LOGROS / MEJORAS / GASTOS XP
// ═══════════════════════════════════════════════════════════════

const HISTORIAL_COL = () => collection(db, 'historial');
const LOGROS_COL    = () => collection(db, 'logros');
const MEJORAS_COL   = () => collection(db, 'mejoras');
const GASTOS_COL    = () => collection(db, 'gastosXP');

export const loadHistorial = () =>
  safe(async () => {
    const snap = await getDocs(query(HISTORIAL_COL(), orderBy('ts', 'desc'), fsLimit(200)));
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { entries, historial: entries };
  });

export const loadLogros = (): Promise<Envelope<unknown>> =>
  safe(async () => {
    const snap = await getDocs(LOGROS_COL());
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { entries, logros: entries, msg: '' };
  });

/** Compat: registrarMejora simple. */
export const registerImprovement = (jugador: string, xpGastado: number, mejora: string) =>
  safe(async () => {
    const id = newId();
    await setDoc(doc(MEJORAS_COL(), id), {
      id,
      ts: Date.now(),
      jugador,
      xpGastado: -Math.abs(xpGastado),
      mejora,
      tipo: 'Subidas',
      fechaHora: new Date().toLocaleString('es-ES'),
    });
    return { id };
  });

export const registerXPExpense = (jugador: string, cantidad: number, descripcion: string) =>
  safe(async () => {
    const id = newId();
    await setDoc(doc(GASTOS_COL(), id), {
      id,
      ts: Date.now(),
      jugador,
      cantidad,
      descripcion,
    });
    return { id };
  });

// ── Historial granular (mision completa) ───────────────────────
export interface MissionFullPayload {
  missionId:     string;
  fecha:         string;
  codUnidad:     string;
  oficial:       string;
  missionType:   string;
  duration:      string;
  xpMap:         Record<string, number>;
  chequeosMap:   Record<string, number>;
  rerollsMap:    Record<string, number>;
  pago:          number;
  salvamento:    number;
  extrasHaber:   number;
  reparacion:    number;
  municion:      number;
  blindaje:      number;
  extrasDebe:    number;
  totalHaber:    number;
  totalDebe:     number;
  balance:       number;
  bitacoraNote:  string;
}

export const registerMission = (xp: Record<string, number>, dinero: number, gastos: number) =>
  safe(async () => {
    const id = newId();
    await setDoc(doc(HISTORIAL_COL(), id), {
      id,
      ts: Date.now(),
      xpMap: xp,
      dineroGanado: dinero,
      gastos,
    });
    return { id };
  });

export const registerMissionFull = (p: MissionFullPayload) =>
  safe(async () => {
    const id = p.missionId || newId();
    await setDoc(doc(HISTORIAL_COL(), id), {
      id,
      ts: Date.now(),
      ...p,
    });
    return { id };
  });

// ═══════════════════════════════════════════════════════════════
// CRÓNICAS / ORDEN DÍA / PARTE DIARIO
// ═══════════════════════════════════════════════════════════════

export interface CronicaRemote {
  id:            string;
  ts:            number;
  campaignYear:  number;
  campaignMonth: number;
  campaignDay:   number;
  autor:         string;
  autorNombre:   string;
  tag:           string;
  titulo:        string;
  cuerpo:        string;
}

const CRONICAS_COL = () => collection(db, 'cronicas');

export const loadCronicas = () =>
  safe(async () => {
    const snap = await getDocs(query(CRONICAS_COL(), orderBy('ts', 'desc')));
    const cronicas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CronicaRemote[];
    return { cronicas };
  });

export const saveCronicaRemote = (c: CronicaRemote) =>
  safe(async () => {
    await setDoc(doc(CRONICAS_COL(), c.id), c, { merge: true });
    return { id: c.id };
  });

export const deleteCronicaRemote = (id: string) =>
  safe(async () => {
    await deleteDoc(doc(CRONICAS_COL(), id));
    return { id };
  });

export interface OrdenDiaRemote {
  id:    string;
  ts:    number;
  pilot: string;
  tipo:  string;
  desc:  string;
}

const ORDEN_COL = () => collection(db, 'ordenDia');

export const loadOrdenDia = () =>
  safe(async () => {
    const snap = await getDocs(query(ORDEN_COL(), orderBy('ts', 'desc')));
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as OrdenDiaRemote[];
    return { entries, ordenDia: entries };
  });

export const saveOrdenDiaRemote = (o: OrdenDiaRemote) =>
  safe(async () => {
    await setDoc(doc(ORDEN_COL(), o.id), o, { merge: true });
    return { id: o.id };
  });

export const deleteOrdenDiaRemote = (id: string) =>
  safe(async () => {
    await deleteDoc(doc(ORDEN_COL(), id));
    return { id };
  });

export interface ParteDiarioRemote {
  id:   string;
  ts:   number;
  text: string;
  tone: string;
}

const PARTE_COL = () => collection(db, 'parteDiario');

export const loadParteDiario = () =>
  safe(async () => {
    const snap = await getDocs(query(PARTE_COL(), orderBy('ts', 'desc')));
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ParteDiarioRemote[];
    return { entries, partes: entries };
  });

export const saveParteDiarioRemote = (p: ParteDiarioRemote) =>
  safe(async () => {
    await setDoc(doc(PARTE_COL(), p.id), p, { merge: true });
    return { id: p.id };
  });

export const deleteParteDiarioRemote = (id: string) =>
  safe(async () => {
    await deleteDoc(doc(PARTE_COL(), id));
    return { id };
  });

// ═══════════════════════════════════════════════════════════════
// MOVIMIENTOS — últimas N entradas del libro mayor
// ═══════════════════════════════════════════════════════════════

export interface MovimientoEntry {
  fecha:       string;
  dinero:      number;
  gastos:      number;
  tipo:        string;
  descripcion: string;
}

export const loadMovimientos = (lim = 5) =>
  safe(async () => {
    const snap = await getDocs(query(LIBRO_COL(), orderBy('fecha', 'desc'), fsLimit(lim)));
    const movimientos: MovimientoEntry[] = snap.docs.map(d => {
      const e = d.data() as LibroMayorEntry;
      return {
        fecha:       e.fecha,
        dinero:      e.tipo === 'ingreso' ? e.cantidad : 0,
        gastos:      e.tipo === 'gasto'   ? e.cantidad : 0,
        tipo:        e.categoria,
        descripcion: e.concepto,
      };
    });
    return { movimientos };
  });
