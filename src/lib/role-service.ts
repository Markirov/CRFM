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

// ── Cambiar rol ─────────────────────────────────────────────
// 1. Escribe en Firestore roles/ (inmediato, siempre funciona)
// 2. Intenta Cloud Function para Custom Claim (puede fallar si usuario no existe en Auth)
export async function setRole(email: string, role: NonNullable<UserRole>): Promise<void> {
  const emailKey = email.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // 1. Escribir directamente en Firestore (garantiza que AuthGate lo vea)
  await setDoc(doc(db, 'roles', emailKey), {
    uid: emailKey,
    email: email.toLowerCase(),
    role,
    updatedAt: new Date().toISOString(),
  });

  // 2. Intentar Cloud Function para Custom Claim (no bloqueante)
  try {
    const fn = httpsCallable(getFunctions(), 'setUserRole');
    await fn({ email, role });
  } catch (e) {
    console.warn('[role-service] Cloud Function setUserRole falló (usuario puede no existir en Auth aún):', e);
    // No lanzar error — el rol ya está en Firestore
  }
}

// ── Eliminar rol ────────────────────────────────────────────
export async function removeRole(email: string): Promise<void> {
  const emailKey = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  await deleteDoc(doc(db, 'roles', emailKey));
}
