// ══════════════════════════════════════════════════════════════
//  recruitment/draft-to-personaje.ts
//  Convierte CharacterDraft canónico → doc personajes/{jugador}
//  shape legacy compat con `roster.ts` + `loadRosterAsEnvelope`.
//
//  Decisiones (user spec):
//   · Reset stats (no hereda XP/dinero/mech del PNJ sustituido).
//   · NO asigna mech del Hangar; sólo registra modelo+tons del draft.
//   · pnj = false (es PJ activo).
//   · estado = 'activo'.
// ══════════════════════════════════════════════════════════════

import type { CharacterDraft } from './types';
import {
  ORIGIN_BY_ID, AFFILIATION_BY_ID, EDUCATION_BY_ID,
  MERIT_BY_ID, DEMERIT_BY_ID, SKILL_BY_ID,
} from './catalogs';

export interface PersonajeDoc {
  // ── Identidad ──
  jugador:        string;          // doc id legacy
  nombre:         string;
  nombreDisplay?: string;
  apodo?:         string;
  origen?:        string;
  afiliacion?:    string;
  // ── Campaña ──
  campaign?:      string;          // 'ELH' | 'IS'
  decade?:        number;
  yearDigit?:     number;
  birthYear?:     number;
  // ── Atributos (compat dual: legacy str/dex/cha + canon fue/des/car) ──
  str?:  number; dex?: number; int?: number; cha?: number;
  fue?:  number; des?: number; car?: number;
  // ── Formación + traits ──
  estudios?:      string;
  nobleSkill?:    string | null;
  merits?:        string[];        // labels human
  demerits?:      string[];
  meritIds?:      string[];        // IDs canónicos
  demeritIds?:    string[];
  // ── Habilidades ──
  extraSkills:    Array<{ name: string; level: number; attr?: string }>;
  /** Para roster: niveles TN cacheados (admin puede editar manual luego). */
  disparoMech?:   number | null;
  pilotajeMech?:  number | null;
  // ── Mech ──
  mech?:          string;          // texto modelo legacy
  mechTons?:      number;
  // ── Físicos ──
  altura?:        number | null;
  peso?:          number | null;
  pelo?:          string | null;
  sexo?:          string | null;
  ojos?:          string | null;
  // ── Estado economía ──
  xpTotal:        number;
  xpDisponible:   number;
  cbills:         number;
  dinero:         number;
  sueldo:         number;
  // ── Estado meta ──
  estado:         'activo';
  pnj:            false;
  lanza?:         string;
  /** Trazabilidad. */
  createdFromRequestId?: string;
  createdAt:      string;
  updatedAt:      string;
}

/** TN BattleTech (skill) cacheado para roster. */
function pickSkillLevel(skills: Array<{ skillId: string; level: number }>, targetId: string): number | null {
  const s = skills.find(x => x.skillId === targetId);
  return s ? s.level : null;
}

/**
 * Convierte draft válido + jugador destino → doc completo personaje PJ.
 * El jugador será el doc id de la collection `personajes/`.
 */
export function draftToPersonaje(
  draft: CharacterDraft,
  jugadorDestino: string,
  requestId?: string,
): PersonajeDoc {
  const now = new Date().toISOString();

  const origenLabel = draft.background.originId
    ? ORIGIN_BY_ID.get(draft.background.originId)?.label ?? ''
    : '';
  const afiliacionLabel = draft.background.affiliationId
    ? AFFILIATION_BY_ID.get(draft.background.affiliationId)?.label ?? ''
    : '';
  const estudiosLabel = draft.background.educationId
    ? EDUCATION_BY_ID.get(draft.background.educationId)?.label ?? ''
    : '';

  // Méritos y deméritos: combina elegidos + concedidos.
  const allMeritIds   = [...draft.traits.meritIds, ...draft.traits.grantedMeritIds];
  const allDemeritIds = [...draft.traits.demeritIds, ...draft.traits.grantedDemeritIds];
  const meritLabels   = allMeritIds.map(id => MERIT_BY_ID.get(id)?.label ?? id);
  const demeritLabels = allDemeritIds.map(id => DEMERIT_BY_ID.get(id)?.label ?? id);

  // Habilidades: concedidas por formación + nobleSkill + compradas.
  const edu = draft.background.educationId ? EDUCATION_BY_ID.get(draft.background.educationId) : null;
  const grantedSkills: Array<{ skillId: string; level: number }> = [...(edu?.grantedSkills ?? [])];
  if (draft.background.nobleSkillId) {
    grantedSkills.push({ skillId: draft.background.nobleSkillId, level: 1 });
  }
  const purchased = draft.extraSkills.map(e => ({ skillId: e.skillId, level: e.level }));
  const allSkills = [...grantedSkills, ...purchased];

  const extraSkills = allSkills.map(s => ({
    name:  SKILL_BY_ID.get(s.skillId)?.label ?? s.skillId,
    level: s.level,
    attr:  SKILL_BY_ID.get(s.skillId)?.governingAttribute,
  }));

  const disparoLevel  = pickSkillLevel(allSkills, 'disparo-mech');
  const pilotajeLevel = pickSkillLevel(allSkills, 'pilotar-mech');

  const a = draft.attributes;
  return {
    jugador:       jugadorDestino,
    nombre:        draft.identity.name,
    nombreDisplay: draft.identity.name,
    apodo:         '',                        // RPG luego puede añadirlo
    origen:        origenLabel,
    afiliacion:    afiliacionLabel,
    campaign:      draft.campaign.id,
    decade:        draft.campaign.baseDecade,
    yearDigit:     draft.campaign.yearDigit,
    birthYear:     draft.physical.birthYear ?? undefined,
    // Dual atributos
    str: a.FUE ?? 0,
    dex: a.DES ?? 0,
    int: a.INT ?? 0,
    cha: a.CAR ?? 0,
    fue: a.FUE ?? 0,
    des: a.DES ?? 0,
    car: a.CAR ?? 0,
    estudios:      estudiosLabel,
    nobleSkill:    draft.background.nobleSkillId,
    merits:        meritLabels,
    demerits:      demeritLabels,
    meritIds:      allMeritIds,
    demeritIds:    allDemeritIds,
    extraSkills,
    disparoMech:   disparoLevel,
    pilotajeMech:  pilotajeLevel,
    mech:          draft.assignedMech.model ?? '',
    mechTons:      draft.assignedMech.tons ?? undefined,
    altura:        draft.physical.heightCm,
    peso:          draft.physical.weightKg,
    pelo:          draft.physical.hair,
    sexo:          draft.physical.sex,
    ojos:          draft.physical.eyes,
    // Reset stats:
    xpTotal:       0,
    xpDisponible:  0,
    cbills:        0,
    dinero:        0,
    sueldo:        0,
    estado:        'activo',
    pnj:           false,
    lanza:         '',
    createdFromRequestId: requestId,
    createdAt:     now,
    updatedAt:     now,
  };
}
