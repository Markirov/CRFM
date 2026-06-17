// ═══════════════════════════════════════════════════════════════
//  auth-roles.ts — Lee el rol del usuario desde:
//  1. Email hardcodeado (admin bootstrap)
//  2. Custom Claim 'role' del JWT
//  3. Colección roles/ de Firestore (fallback)
//
//  Uso: llamar useAuthRole() UNA vez en AuthGate (ya autenticado).
//  El resto de la app lee userRole desde useAppStore().
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import { useAppStore, type UserRole } from '@/lib/store';
import { getRoles } from '@/lib/role-service';

// Admin bootstrap (único email hardcodeado)
const HARDCODED_ADMIN = 'marcosfenollar@gmail.com';

async function resolveRole(email: string | undefined): Promise<UserRole> {
  if (!email) return null;
  const e = email.toLowerCase();

  // 1. Admin hardcoded (bootstrap)
  if (e === HARDCODED_ADMIN) return 'admin';

  // 2. Custom Claim del JWT
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdTokenResult(false);
      const claim = token.claims.role;
      if (claim === 'admin' || claim === 'dm' || claim === 'pj') return claim;
    }
  } catch { /* ignore */ }

  // 3. Firestore roles/ collection (fallback)
  try {
    const roles = await getRoles();
    const found = roles.find(r => r.email?.toLowerCase() === e);
    if (found?.role) return found.role;
  } catch { /* ignore */ }

  return null;
}

export function useAuthRole() {
  const setUserRole = useAppStore(s => s.setUserRole);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        setUserRole(null);
        return;
      }
      const role = await resolveRole(user.email ?? undefined);
      setUserRole(role);
    });
    return unsub;
  }, [setUserRole]);
}
