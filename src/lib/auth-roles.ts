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

export function useAuthRole() {
  const setUserRole = useAppStore(s => s.setUserRole);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        setUserRole(null);
        return;
      }
      // forceRefresh=false: usa el JWT cacheado.
      // Si acabas de asignar un claim nuevo, el usuario debe
      // haber cerrado sesión y vuelto a entrar para que esté aquí.
      const token = await user.getIdTokenResult(false);
      setUserRole((token.claims.role as UserRole) ?? null);
    });
    return unsub;
  }, [setUserRole]);
}
