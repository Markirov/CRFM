// ════════════════════════════════════════════════════════════════
//  custom-mechs-service.ts — Diseños SSW privados per-user
//
//  Path Firestore: customMechs/{safeEmail}/items/{designId}
//  - Owner read+write
//  - Sender puede crear en items de otro user (regla doc.sentBy = self)
//  - Admin lectura ilimitada
//  - Límite 25 designs per non-admin user; admin sin límite
//
//  Rules sugeridas (deploy manual):
//
//    match /customMechs/{ownerEmail}/items/{designId} {
//      allow read: if isAuthenticated() && (
//        getSafeEmail(request.auth.token.email) == ownerEmail || isAdmin()
//      );
//      allow create, update: if isAuthenticated() && (
//        getSafeEmail(request.auth.token.email) == ownerEmail ||
//        // sender clone path: sender escribe en ajeno con sentBy=self
//        (resource == null && request.resource.data.sentBy ==
//          getSafeEmail(request.auth.token.email))
//      );
//      allow delete: if isAuthenticated() && (
//        getSafeEmail(request.auth.token.email) == ownerEmail || isAdmin()
//      );
//    }
// ════════════════════════════════════════════════════════════════

import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc,
  serverTimestamp, query, orderBy, limit as fbLimit,
} from 'firebase/firestore';
import { db, auth } from './firebase-config';
import { getSafeEmail } from './firebase-service';

export interface CustomMechDesign {
  id:        string;
  name:      string;       // "Crusader CRD-3R KKK Mod"
  chassis:   string;
  model:     string;
  tons:      number;
  bv?:       number;
  era?:      string;
  sswRaw:    string;       // XML completo
  notes?:    string;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  /** safeEmail del sender si recibido. Undefined si lo creó owner. */
  sentBy?:   string;
}

export const CUSTOM_MECHS_LIMIT_DEFAULT = 25;
export const CUSTOM_MECHS_LIMIT_ADMIN = Infinity;

function ownerEmailFromAuth(): string {
  return getSafeEmail(auth.currentUser?.email ?? '');
}

function customMechsCol(ownerSafeEmail: string) {
  return collection(db, 'customMechs', ownerSafeEmail, 'items');
}

/** Carga todos los designs del usuario actual. */
export async function loadMyCustomMechs(): Promise<CustomMechDesign[]> {
  const owner = ownerEmailFromAuth();
  if (!owner) return [];
  try {
    const q = query(customMechsCol(owner), orderBy('updatedAt', 'desc'), fbLimit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as Omit<CustomMechDesign, 'id'>), id: d.id }));
  } catch (e) {
    console.warn('[custom-mechs] load failed', e);
    return [];
  }
}

/** Guarda design en el espacio del usuario actual. Devuelve id. */
export async function saveMyCustomMech(
  design: Omit<CustomMechDesign, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<string> {
  const owner = ownerEmailFromAuth();
  if (!owner) throw new Error('No auth');
  const id = design.id || `mech_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const ref = doc(customMechsCol(owner), id);
  const now = new Date().toISOString();
  const existing = await getDoc(ref);
  const createdAt = existing.exists() ? (existing.data().createdAt as string) ?? now : now;
  await setDoc(ref, {
    ...design,
    createdAt,
    updatedAt: now,
  }, { merge: true });
  return id;
}

/** Elimina design del usuario actual. */
export async function deleteMyCustomMech(designId: string): Promise<void> {
  const owner = ownerEmailFromAuth();
  if (!owner) throw new Error('No auth');
  await deleteDoc(doc(customMechsCol(owner), designId));
}

/**
 * Envía copia a otro usuario (Inbox del destinatario).
 * Sender escribe en customMechs/{targetSafeEmail}/items/{newId} con
 * sentBy=mi safeEmail. Receiver verá el design en su lista con badge.
 */
export async function sendCustomMechToUser(
  targetSafeEmail: string,
  design: CustomMechDesign,
): Promise<void> {
  const sender = ownerEmailFromAuth();
  if (!sender) throw new Error('No auth');
  if (sender === targetSafeEmail) throw new Error('No te puedes enviar a ti mismo');
  const newId = `mech_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  await setDoc(doc(customMechsCol(targetSafeEmail), newId), {
    name:    design.name,
    chassis: design.chassis,
    model:   design.model,
    tons:    design.tons,
    bv:      design.bv ?? null,
    era:     design.era ?? null,
    sswRaw:  design.sswRaw,
    notes:   design.notes ?? null,
    createdAt: now,
    updatedAt: now,
    sentBy:  sender,
  });
}

/** Conteo actual del owner. Usado para enforce límite. */
export async function countMyCustomMechs(): Promise<number> {
  const owner = ownerEmailFromAuth();
  if (!owner) return 0;
  const snap = await getDocs(customMechsCol(owner));
  return snap.size;
}

/** Resuelve límite per role. Admin → Infinity. */
export function customMechsLimitForRole(role: string | null | undefined): number {
  if (role === 'admin') return CUSTOM_MECHS_LIMIT_ADMIN;
  return CUSTOM_MECHS_LIMIT_DEFAULT;
}

/** True si user puede guardar uno más. */
export function canSaveMoreCustomMechs(currentCount: number, role: string | null | undefined): boolean {
  return currentCount < customMechsLimitForRole(role);
}
