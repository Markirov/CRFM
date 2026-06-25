import type { PermLevel } from './permissions-service';

export const PUBLIC_SECTION_ACCESS: Readonly<Record<string, PermLevel>> = {
  portada: 'read',
  simulador: 'write',
  ayudas: 'read',
  wiki: 'read',
  tro: 'read',
  mapa: 'read',
};

export function getPublicAccess(sectionId: string): PermLevel | null {
  return PUBLIC_SECTION_ACCESS[sectionId] ?? null;
}

export function isPublicSection(sectionId: string): boolean {
  return getPublicAccess(sectionId) !== null;
}
