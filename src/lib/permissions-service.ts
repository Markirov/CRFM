// src/lib/permissions-service.ts
// ═══════════════════════════════════════════════════════════════
//  Sistema de permisos por rol almacenados en Firestore.
//  Doc: config/permisos → { secciones: PermissionMatrix }
//
//  Cada sección tiene 3 niveles por rol: 'write' | 'read' | 'none'
//  Admin SIEMPRE tiene write en todo (no editable).
// ═══════════════════════════════════════════════════════════════

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebase-config';
import { useEffect, useRef, useState } from 'react';
import type { UserRole } from './store';

export type PermLevel = 'write' | 'read' | 'none';

export interface SectionPerm {
  id:     string;   // coincide con NavItem.id
  label:  string;
  dm:     PermLevel;
  pj:     PermLevel;
}

/** Permisos por defecto (primera carga / reset). Admin siempre write. */
export const DEFAULT_PERMISSIONS: SectionPerm[] = [
  { id: 'comision',      label: 'Comisión',                  dm: 'write', pj: 'read'  },
  { id: 'reclutamiento', label: 'Reclutamiento',             dm: 'write', pj: 'read'  },
  { id: 'finanzas',      label: 'Finanzas / Libro Mayor',    dm: 'read',  pj: 'none'  },
  { id: 'hangar',        label: 'Hangar',                    dm: 'write', pj: 'read'  },
  { id: 'barracones',    label: 'Barracones',                dm: 'write', pj: 'write' },
  { id: 'simulador',     label: 'Simulador',                 dm: 'write', pj: 'write' },
  { id: 'taller',        label: 'Taller',                    dm: 'write', pj: 'read'  },
  { id: 'hud',           label: 'HUD Táctico',               dm: 'write', pj: 'write' },
  { id: 'hoja',          label: 'Hoja de Servicio',          dm: 'write', pj: 'read'  },
  { id: 'ayudas',        label: 'Ayudas',                    dm: 'write', pj: 'write' },
  { id: 'tro',           label: 'Manual Técnico (TRO)',      dm: 'write', pj: 'write' },
  { id: 'mapa',          label: 'Navegación / Mapa Estelar', dm: 'write', pj: 'write' },
  { id: 'logros',        label: 'Logros',                    dm: 'write', pj: 'read'  },
  { id: 'cronicas',      label: 'Crónicas',                  dm: 'write', pj: 'read'  },
];

const PERMISOS_DOC = () => doc(db, 'config', 'permisos');

// ── Leer ────────────────────────────────────────────────────
export async function loadPermissions(): Promise<SectionPerm[]> {
  const snap = await getDoc(PERMISOS_DOC());
  if (!snap.exists()) return DEFAULT_PERMISSIONS;
  const data = snap.data();
  // Merge con defaults para secciones nuevas que no estén en Firestore
  const stored: SectionPerm[] = data.secciones ?? [];
  return DEFAULT_PERMISSIONS.map(def => {
    const found = stored.find(s => s.id === def.id);
    return found ?? def;
  });
}

// ── Guardar ─────────────────────────────────────────────────
export async function savePermissions(perms: SectionPerm[]): Promise<void> {
  await setDoc(PERMISOS_DOC(), { secciones: perms }, { merge: true });
}

// ── Hook reactivo ────────────────────────────────────────────
export function usePermissions(): {
  perms: SectionPerm[];
  loading: boolean;
} {
  const [perms, setPerms]     = useState<SectionPerm[]>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const prevPermsRef = useRef<SectionPerm[] | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const unsub = onSnapshot(PERMISOS_DOC(), snap => {
      let newPerms: SectionPerm[];
      if (!snap.exists()) {
        newPerms = DEFAULT_PERMISSIONS;
      } else {
        const stored: SectionPerm[] = snap.data().secciones ?? [];
        newPerms = DEFAULT_PERMISSIONS.map(def => {
          const found = stored.find(s => s.id === def.id);
          return found ?? def;
        });
      }

      // ── Detección de cambios y auto-logout ────────────────────
      // Solo verificar después de la carga inicial
      if (!initialLoadRef.current && prevPermsRef.current) {
        const user = auth.currentUser;
        if (user) {
          // Obtener rol del JWT cacheado
          user.getIdTokenResult(false).then(token => {
            const role = token.claims.role as UserRole;
            if (role && role !== 'admin') {
              // Verificar si algún permiso cambió para este rol
              const hasChanges = newPerms.some((newPerm, i) => {
                const oldPerm = prevPermsRef.current![i];
                if (!oldPerm) return true;
                return newPerm[role as 'dm' | 'pj'] !== oldPerm[role as 'dm' | 'pj'];
              });

              if (hasChanges) {
                console.log(`[permissions] Permisos cambiados para rol "${role}" — forzando re-login`);
                signOut(auth).catch(() => {});
              }
            }
          }).catch(() => {});
        }
      }

      prevPermsRef.current = newPerms;
      initialLoadRef.current = false;
      setPerms(newPerms);
      setLoading(false);
    }, (error) => {
      console.warn('[permissions] Cannot read permissions (guest or error):', error.message);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { perms, loading };
}

// ── Helper: nivel de permiso para el rol actual ──────────────
export function getPermLevel(perms: SectionPerm[], sectionId: string, role: UserRole): PermLevel {
  if (role === 'admin') return 'write';
  if (!role) {
    const PUBLIC_ROUTES = ['portada', 'tro', 'mapa', 'cronicas', 'simulador'];
    if (PUBLIC_ROUTES.includes(sectionId)) return sectionId === 'simulador' ? 'write' : 'read';
    return 'none';
  }
  const section = perms.find(p => p.id === sectionId);
  if (!section) return 'none';
  return section[role as 'dm' | 'pj'];
}

export function canWrite(perms: SectionPerm[], sectionId: string, role: UserRole): boolean {
  return getPermLevel(perms, sectionId, role) === 'write';
}

export function canRead(perms: SectionPerm[], sectionId: string, role: UserRole): boolean {
  const level = getPermLevel(perms, sectionId, role);
  return level === 'write' || level === 'read';
}
