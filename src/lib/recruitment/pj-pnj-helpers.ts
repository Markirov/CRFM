// ══════════════════════════════════════════════════════════════
//  pj-pnj-helpers.ts — Discriminador PJ vs PNJ
//
//  Heurística:
//   1. Si doc tiene `pnj:true` → PNJ explícito.
//   2. Si doc tiene `pnj:false` → PJ explícito.
//   3. Si undefined → fallback legacy: nombre en PNJ_PRESETS o
//      jugador no en LISTA_PJ_HUMANOS_LEGACY.
// ══════════════════════════════════════════════════════════════

import type { RosterEntry } from '@/lib/roster';
import { PNJ_PRESETS } from '@/lib/barracones-data';

// PJ humanos confirmados (legacy). Editar si la unidad cambia.
const LEGACY_PJ_HUMANOS = ['Jaime', 'Marcos', 'Joan'];

export function isPNJ(r: RosterEntry): boolean {
  if (typeof r.pnj === 'boolean') return r.pnj;
  // Legacy fallback
  if (PNJ_PRESETS[r.nombre]) return true;
  if (!LEGACY_PJ_HUMANOS.includes(r.jugador)) return true;
  return false;
}

export function isPJ(r: RosterEntry): boolean {
  return !isPNJ(r);
}

/** Candidatos a sustituir: PNJs no-reserva no-baja-permanente. */
export function pnjCandidatesForReplacement(roster: RosterEntry[]): RosterEntry[] {
  return roster.filter(r =>
    isPNJ(r) &&
    r.estado !== 'reserva' &&
    r.estado !== 'kia' &&
    r.estado !== 'mia' &&
    r.estado !== 'retirado'
  );
}
