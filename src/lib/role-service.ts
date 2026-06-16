// src/lib/role-service.ts
// ═══════════════════════════════════════════════════════════════
//  Helpers para gestión de roles desde el cliente.
//  - getRoles()     → lee espejo Firestore (collection `roles/`)
//  - setRole()      → llama Cloud Function setUserRole
// ═══════════════════════════════════════════════════════════════

import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
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

// ── Cambiar rol vía Cloud Function ──────────────────────────
export async function setRole(email: string, role: NonNullable<UserRole>): Promise<void> {
  const fn = httpsCallable(getFunctions(), 'setUserRole');
  await fn({ email, role });
}
