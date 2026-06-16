// functions/src/index.ts
// ═══════════════════════════════════════════════════════════════
//  Cloud Functions CRFM
//  setUserRole — callable desde SecretMenu (solo admin)
//
//  Deploy: firebase deploy --only functions
// ═══════════════════════════════════════════════════════════════

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

const VALID_ROLES = ['admin', 'dm', 'pj'] as const;
type Role = typeof VALID_ROLES[number];

// ── setUserRole ──────────────────────────────────────────────
// Caller debe ser admin (verificado por Custom Claim en el JWT).
// Input:  { email: string, role: 'admin' | 'dm' | 'pj' }
// Output: { uid: string, email: string, role: string }

export const setUserRole = onCall(async (request) => {
  // 1. Verificar que el caller es admin
  const callerRole = request.auth?.token?.role;
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo administradores pueden cambiar roles.');
  }

  // 2. Validar input
  const { email, role } = request.data as { email?: string; role?: string };

  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Email requerido.');
  }
  if (!role || !VALID_ROLES.includes(role as Role)) {
    throw new HttpsError('invalid-argument', `Rol inválido. Debe ser: ${VALID_ROLES.join(', ')}`);
  }

  // 3. Buscar usuario en Firebase Auth
  const auth = getAuth();
  let uid: string;
  try {
    const user = await auth.getUserByEmail(email);
    uid = user.uid;
  } catch {
    throw new HttpsError('not-found', `Usuario no encontrado: ${email}`);
  }

  // 4. Setear Custom Claim
  await auth.setCustomUserClaims(uid, { role });

  // 5. Guardar espejo en Firestore (legible desde UI sin Admin SDK)
  const db = getFirestore();
  await db.collection('roles').doc(uid).set({
    email,
    role,
    updatedAt: new Date().toISOString(),
  });

  return { uid, email, role };
});
