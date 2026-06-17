// src/hooks/usePerm.ts
// Hook rápido para verificar permisos del usuario actual en una sección.

import { useAppStore } from '@/lib/store';
import { usePermissions, canRead, canWrite, type PermLevel } from '@/lib/permissions-service';

export function usePerm(sectionId: string) {
  const userRole = useAppStore(s => s.userRole);
  const { perms, loading } = usePermissions();

  const readable = canRead(perms, sectionId, userRole);
  const writable = canWrite(perms, sectionId, userRole);
  const level: PermLevel = userRole === 'admin' ? 'write' : !userRole ? 'none' :
    perms.find(p => p.id === sectionId)?.[userRole as 'dm' | 'pj'] ?? 'none';

  return { readable, writable, loading, level };
}
