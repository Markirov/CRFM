// src/hooks/useReadOnly.ts
// ═══════════════════════════════════════════════════════════════
//  Hook para saber si el usuario actual tiene solo lectura
//  en una sección concreta.
//
//  Uso en cualquier página o componente:
//    const readOnly = useReadOnly('finanzas');
//    <button disabled={readOnly}>Guardar</button>
//
//  También acepta el prop readOnly pasado desde App.tsx
//  como override (para compat con páginas que ya lo reciben).
// ═══════════════════════════════════════════════════════════════

import { useAppStore } from '@/lib/store';

export function useReadOnly(sectionId: string, propOverride?: boolean): boolean {
  const userRole = useAppStore(s => s.userRole);
  const perms = useAppStore(s => s.perms);

  // Si App.tsx ya calculó y pasó el prop, úsalo directamente
  if (propOverride !== undefined) return propOverride;

  // Admin nunca es readOnly
  if (userRole === 'admin') return false;

  // Sin rol = readOnly
  if (!userRole) return true;

  const perm = perms.find(p => p.id === sectionId);
  if (!perm) return true;

  return perm[userRole as 'dm' | 'pj'] !== 'write';
}

/** Devuelve true si el usuario puede ver la sección (read o write). */
export function useCanRead(sectionId: string): boolean {
  const userRole = useAppStore(s => s.userRole);
  const perms = useAppStore(s => s.perms);
  if (userRole === 'admin') return true;
  if (!userRole) return false;
  const perm = perms.find(p => p.id === sectionId);
  if (!perm) return false;
  const level = perm[userRole as 'dm' | 'pj'];
  return level === 'write' || level === 'read';
}
