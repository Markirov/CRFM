// ═══════════════════════════════════════════════════════════════
//  auth-roles.ts — Lee el Custom Claim 'role' del JWT de Firebase
//  y lo sincroniza con el store de Zustand.
//
//  Uso: llamar useAuthRole() UNA vez en AuthGate (ya autenticado).
//  El resto de la app lee userRole desde useAppStore().
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import { useAppStore, type UserRole } from '@/lib/store';

// Emails hardcodeados (solo admin bootstrap — el resto se gestiona via RolesPanel)
const HARDCODED_ADMIN = 'marcosfenollar@gmail.com';

function resolveRole(email: string | undefined, claimRole: string | undefined): UserRole {
  if (!email) return null;
  const e = email.toLowerCase();
  // Admin hardcoded tiene prioridad (bootstrap)
  if (e === HARDCODED_ADMIN) return 'admin';
  // Fallback a Custom Claim (gestionado via RolesPanel + Cloud Function)
  if (claimRole === 'admin' || claimRole === 'dm' || claimRole === 'pj') return claimRole;
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
      const token = await user.getIdTokenResult(false);
      const role = resolveRole(user.email ?? undefined, token.claims.role as string | undefined);
      setUserRole(role);
    });
    return unsub;
  }, [setUserRole]);
}
