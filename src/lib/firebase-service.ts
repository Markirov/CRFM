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
//
// API envelope: { success: boolean, data?: any, error?: string }
// Igual que sheets-service para compat 1:1 con código existente.
// ═══════════════════════════════════════════════════════════════

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, orderBy, limit as fsLimit,
} from 'firebase/firestore';
import { db } from './firebase-config';
import type { SimuladorSnapshot } from './simulador-persistence';

// ── Helpers envelope ────────────────────────────────────────────
type Envelope<T = any> = { success: boolean; data?: T; error?: string };

async function safe<T>(fn: () => Promise<T>): Promise<Envelope<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (e: any) {
    console.error('[firebase] error:', e);
    return { success: false, error: e?.message ?? String(e) };
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
  }
  // Por defecto: si trae 'jugador' sin action → loadPlayer
  if (params.jugador && !action) return await loadPlayer(params.jugador);
  console.warn('[firebase] sheetsGet sin handler:', params);
  return { success: false, error: `Acción no soportada en Firebase: ${action}` };
}

export async function sheetsPost(_body: Record<string, any>) {
  console.warn('[firebase] sheetsPost legacy llamado, no-op:', _body);
  return { success: false, error: 'sheetsPost legacy no soportado — usar funciones directas firebase-service' };
}

// ═══════════════════════════════════════════════════════════════
// CONFIG (doc único config/main)
// ═══════════════════════════════════════════════════════════════

const CONFIG_REF = () => doc(db, 'config', 'main');

export const loadConfig = async (): Promise<{ success: boolean; data?: { config: Record<string, any> }; error?: string }> => {
  try {
    const snap = await getDoc(CONFIG_REF());
    const config: Record<string, any> = snap.exists() ? (snap.data() as any) : {};
    return { success: true, data: { config } };
  } catch (e: any) {
    console.error('[firebase] loadConfig:', e);
    return { success: false, error: e?.message ?? String(e) };
  }
};

export const saveConfigBatch = (config: Record<string, string>) =>
  safe(async () => {
    await setDoc(CONFIG_REF(), config, { merge: true });
    return { saved: Object.keys(config).length };
  });

// ═══════════════════════════════════════════════════════════════
// PERSONAJES (PJ + PNJ)
// ═══════════════════════════════════════════════════════════════

const PERSONAJES_COL = () => collection(db, 'personajes');

/** Lee un jugador por nombre (= doc id). Devuelve envelope shape Apps Script. */
export const loadPlayer = (name: string): Promise<Envelope<any>> =>
  safe(async () => {
    const snap = await getDoc(doc(PERSONAJES_COL(), name));
    if (!snap.exists()) return { result: 'success', msg: '', personajes: [], jugador: name };
    const obj = { jugador: name, ...snap.data() };
    return { result: 'success', msg: '', personajes: [obj], ...obj };
  });

export const searchPilots = (name: string): Promise<Envelope<any>> => loadPlayer(name);

/** Hoja de unidad — col Q (mech asignado) + datos base. */
export const loadUnitSheet = (name: string): Promise<Envelope<any>> => loadPlayer(name);

export const savePlayer = (data: any): Promise<Envelope<any>> =>
  safe(async () => {
    const id = String(data.jugador ?? data.nombre ?? '').trim();
    if (!id) throw new Error('savePlayer: falta jugador/nombre');
    await setDoc(doc(PERSONAJES_COL(), id), data, { merge: true });
    return { id, result: 'success', msg: 'Guardado' };
  });

export const savePilot = (data: any): Promise<Envelope<any>> => savePlayer(data);

// ── Roster (derivado de collection personajes) ─────────────────

const CAMPAIGN_PILOT_ORDER = ['Jaime', 'Marcos', 'Joan', 'Alex', 'Erik', 'Zhao', 'Val', 'Tariq'];

function pickSkillLevel(extraSkills: any, names: string[]): number | null {
  if (!Array.isArray(extraSkills)) return null;
  for (const s of extraSkills) {
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
      const data = d.data() as any;
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
      };
    }).sort((a, b) => a.order - b.order);
    return { success: true, data: { roster } };
  } catch (e: any) {
    console.error('[firebase] loadRoster:', e);
    return { success: false, error: e?.message ?? String(e) };
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
  | 'sueldo_extra' | 'soborno' | 'mantenimiento_mensual'
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
    const snap = await getDocs(query(LIBRO_COL(), orderBy('fecha', 'desc')));
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
  state.setCampaign({ contratoValor: formatCzar(newVal).replace(' ₡', '') });
}

export async function deleteLibroEntryAndTreasury(entry: LibroMayorEntry): Promise<void> {
  const { useAppStore } = await import('./store');
  const { parseCurrencyValue, formatCzar } = await import('./currency-utils');
  const state = useAppStore.getState();

  await deleteLibroMayorEntry(entry.id);

  const cur = parseCurrencyValue(state.campaign.contratoValor) ?? 0;
  const delta = entry.tipo === 'ingreso' ? -entry.cantidad : entry.cantidad;
  const newVal = cur + delta;
  state.setCampaign({ contratoValor: formatCzar(newVal).replace(' ₡', '') });
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

const fuerzaKey = (slot: FuerzaSlot) => `FUERZA${slot}` as const;
const FUERZA_CAMPANA_KEY = 'FUERZACAMPAÑA';

async function readConfigField(key: string): Promise<string | null> {
  const snap = await getDoc(CONFIG_REF());
  if (!snap.exists()) return null;
  const v = (snap.data() as any)?.[key];
  return typeof v === 'string' ? v : null;
}

async function writeConfigField(key: string, value: string): Promise<void> {
  await setDoc(CONFIG_REF(), { [key]: value }, { merge: true });
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

export async function loadAllFuerzaConfigSlots(): Promise<Record<FuerzaSlot, FuerzaConfigEntry | null>> {
  const out: Record<FuerzaSlot, FuerzaConfigEntry | null> = { 1: null, 2: null, 3: null, 4: null, 5: null };
  const snap = await getDoc(CONFIG_REF());
  if (!snap.exists()) return out;
  const cfg = snap.data() as any;
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
  const snap = await getDoc(CONFIG_REF());
  if (!snap.exists()) return out;
  const cfg = snap.data() as any;
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

export const loadLogros = (): Promise<Envelope<any>> =>
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
