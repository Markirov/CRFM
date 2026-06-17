// src/hooks/usePerm.ts
// Hook rápido para verificar permisos del usuario actual en una sección.
// Lee del store de Zustand (ya poblado por App.tsx via usePermissions).

import { useAppStore } from '@/lib/store';
import { canRead, canWrite, type PermLevel } from '@/lib/permissions-service';

export function usePerm(sectionId: string) {
  const userRole = useAppStore(s => s.userRole);
  const perms = useAppStore(s => s.perms);
  const permsLoading = useAppStore(s => s.permsLoading);

  const readable = canRead(perms, sectionId, userRole);
  const writable = canWrite(perms, sectionId, userRole);
  const level: PermLevel = userRole === 'admin' ? 'write' : !userRole ? 'none' :
    perms.find(p => p.id === sectionId)?.[userRole as 'dm' | 'pj'] ?? 'none';

  return { readable, writable, loading: permsLoading, level };
}
