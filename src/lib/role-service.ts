// src/lib/role-service.ts
// ═══════════════════════════════════════════════════════════════
//  Helpers para gestión de roles desde el cliente.
//  - getRoles()     → lee espejo Firestore (collection `roles/`)
//  - setRole()      → llama Cloud Function setUserRole + escribe en Firestore
// ═══════════════════════════════════════════════════════════════

import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import type { UserRole } from './store';

export interface RoleEntry {
  uid:       string;
  email:     string;
  role:      UserRole;
  updatedAt: string;
}

// ── Leer roles actuales desde Firestore ─────────────────────
export async function getRoles(): Promise<RoleEntry[]> {
  const snap = await getDocs(collection(db, 'roles'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as RoleEntry));
}

/** Calcula docId estable desde email (legacy: docs antiguos pueden tener
 *  otros id formats — siempre que sea posible, pasar `docId` explícito
 *  del doc existente para evitar duplicados). */
function emailToDocId(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// ── Cambiar rol ─────────────────────────────────────────────
// 1. Escribe en Firestore roles/ (inmediato, siempre funciona)
// 2. Intenta Cloud Function para Custom Claim (puede fallar si usuario no existe en Auth)
// Si docId se pasa, actualiza el doc existente (compat con docs legacy
// cuyo id no coincide con emailKey). Si no, usa emailKey.
export async function setRole(
  email: string,
  role: NonNullable<UserRole>,
  docId?: string,
): Promise<void> {
  const targetId = docId ?? emailToDocId(email);

  try {
    await setDoc(doc(db, 'roles', targetId), {
      uid:       targetId,
      email:     email.toLowerCase(),
      role,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[role-service] setDoc roles/', targetId, 'falló:', e);
    throw e;
  }

  // 2. Intentar Cloud Function para Custom Claim (no bloqueante)
  try {
    const fn = httpsCallable(getFunctions(), 'setUserRole');
    await fn({ email, role });
  } catch (e) {
    console.warn('[role-service] Cloud Function setUserRole falló (usuario puede no existir en Auth aún):', e);
    // No lanzar — rol ya está en Firestore
  }
}

// ── Eliminar rol ────────────────────────────────────────────
// Si docId se pasa, borra ese doc. Si no, asume emailKey (puede no
// match docs legacy → caller debería pasar entry.uid del listado).
export async function removeRole(email: string, docId?: string): Promise<void> {
  const targetId = docId ?? emailToDocId(email);
  try {
    await deleteDoc(doc(db, 'roles', targetId));
  } catch (e) {
    console.error('[role-service] deleteDoc roles/', targetId, 'falló:', e);
    throw e;
  }
}
