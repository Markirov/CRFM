// ══════════════════════════════════════════════════════════════
//  recruitment/validation.ts — validateDraft pure
//  Spec §14 errores + advertencias
// ══════════════════════════════════════════════════════════════

import {
  type CharacterDraft, type ValidationIssue, type AttributeId,
  ATTRIBUTES, MAX_TRAITS, MIN_ATTR, MAX_ATTR,
} from './types';
import { calculateCreationCosts } from './costs';
import {
  EDUCATION_BY_ID, MERIT_BY_ID, DEMERIT_BY_ID, SKILL_BY_ID,
  AFFILIATION_BY_ID, ORIGIN_BY_ID,
} from './catalogs';
import { ALLOWED_MODIFIERS, ROLL_BOUNDS } from './mech-assignment';

function intSkillSlots(intValue: number | null): number {
  if (intValue === null || intValue < 7) return 0;
  if (intValue === 7) return 1;
  if (intValue === 8) return 2;
  return 3; // 9..12
}

export function validateDraft(draft: CharacterDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (i: ValidationIssue) => issues.push(i);

  // ── Identidad ──
  if (!draft.identity.name.trim()) {
    push({ code: 'name-required', path: 'identity.name', severity: 'error', message: 'Falta nombre del personaje.' });
  }
  if (!draft.identity.playerName.trim()) {
    push({ code: 'player-required', path: 'identity.playerName', severity: 'error', message: 'Falta nombre del jugador.' });
  }

  // ── Atributos ──
  for (const a of ATTRIBUTES) {
    const v = draft.attributes[a];
    if (v === null) {
      push({ code: 'attr-missing', path: `attributes.${a}`, severity: 'error', message: `Falta atributo ${a}.` });
    } else if (v < MIN_ATTR || v > MAX_ATTR) {
      push({ code: 'attr-range', path: `attributes.${a}`, severity: 'error', message: `${a} fuera de rango ${MIN_ATTR}–${MAX_ATTR}.` });
    }
  }

  // ── Background ──
  if (!draft.background.originId) {
    push({ code: 'origin-required', path: 'background.originId', severity: 'error', message: 'Falta origen.' });
  } else if (!ORIGIN_BY_ID.has(draft.background.originId)) {
    push({ code: 'origin-unknown', path: 'background.originId', severity: 'error', message: 'Origen desconocido.' });
  }

  if (!draft.background.affiliationId) {
    push({ code: 'affiliation-required', path: 'background.affiliationId', severity: 'error', message: 'Falta afiliación.' });
  } else if (!AFFILIATION_BY_ID.has(draft.background.affiliationId)) {
    push({ code: 'affiliation-unknown', path: 'background.affiliationId', severity: 'error', message: 'Afiliación desconocida.' });
  }

  // ELH fuerza Mercenario (KKK no — afiliación libre)
  if (draft.campaign.id === 'ELH' && draft.background.affiliationId && draft.background.affiliationId !== 'mercenario') {
    push({ code: 'affiliation-elh', path: 'background.affiliationId', severity: 'error', message: 'En campaña ELH la afiliación debe ser Mercenario.' });
  }

  // ── Formación ──
  if (!draft.background.educationId) {
    push({ code: 'education-required', path: 'background.educationId', severity: 'error', message: 'Falta formación.' });
  } else {
    const edu = EDUCATION_BY_ID.get(draft.background.educationId);
    if (!edu) {
      push({ code: 'education-unknown', path: 'background.educationId', severity: 'error', message: 'Formación desconocida.' });
    } else {
      const int = draft.attributes.INT;
      if (int !== null && int < edu.minInt) {
        push({ code: 'education-int', path: 'background.educationId', severity: 'error', message: `${edu.label} requiere INT ≥ ${edu.minInt}.` });
      }
      if (edu.requiresNobleSkill && !draft.background.nobleSkillId) {
        push({ code: 'noble-skill-required', path: 'background.nobleSkillId', severity: 'error', message: 'Tutores Nobles: elige Espada o Equitación.' });
      }
    }
  }

  // ── Méritos ──
  if (draft.traits.meritIds.length > MAX_TRAITS) {
    push({ code: 'merits-overflow', path: 'traits.meritIds', severity: 'error', message: `Máximo ${MAX_TRAITS} méritos.` });
  }
  const meritSet = new Set<string>();
  const meritFamilies = new Set<string>();
  for (const id of draft.traits.meritIds) {
    if (!id) continue;
    if (meritSet.has(id)) {
      push({ code: 'merit-duplicate', path: 'traits.meritIds', severity: 'error', message: `Mérito duplicado: ${id}.` });
    }
    meritSet.add(id);
    const def = MERIT_BY_ID.get(id);
    if (!def) {
      push({ code: 'merit-unknown', path: 'traits.meritIds', severity: 'error', message: `Mérito desconocido: ${id}.` });
      continue;
    }
    if (def.family) {
      if (meritFamilies.has(def.family)) {
        push({ code: 'merit-family-conflict', path: 'traits.meritIds', severity: 'error', message: `Conflicto familia "${def.family}": dos méritos del mismo grupo.` });
      }
      meritFamilies.add(def.family);
    }
  }
  // Evita comprar mérito ya concedido por formación
  for (const id of draft.traits.meritIds) {
    if (draft.traits.grantedMeritIds.includes(id)) {
      push({ code: 'merit-already-granted', path: 'traits.meritIds', severity: 'error', message: `"${id}" ya viene concedido por formación.` });
    }
  }

  // ── Deméritos ──
  if (draft.traits.demeritIds.length > MAX_TRAITS) {
    push({ code: 'demerits-overflow', path: 'traits.demeritIds', severity: 'error', message: `Máximo ${MAX_TRAITS} deméritos.` });
  }
  const demeritSet = new Set<string>();
  const demeritFamilies = new Set<string>();
  for (const id of draft.traits.demeritIds) {
    if (!id) continue;
    if (demeritSet.has(id)) {
      push({ code: 'demerit-duplicate', path: 'traits.demeritIds', severity: 'error', message: `Demérito duplicado: ${id}.` });
    }
    demeritSet.add(id);
    const def = DEMERIT_BY_ID.get(id);
    if (!def) {
      push({ code: 'demerit-unknown', path: 'traits.demeritIds', severity: 'error', message: `Demérito desconocido: ${id}.` });
      continue;
    }
    if (def.family) {
      if (demeritFamilies.has(def.family)) {
        push({ code: 'demerit-family-conflict', path: 'traits.demeritIds', severity: 'error', message: `Conflicto familia "${def.family}": dos deméritos del mismo grupo.` });
      }
      demeritFamilies.add(def.family);
    }
  }

  // Familia 'fuerza': Fuerte (mérito) ↔ Débil (demérito) son excluyentes
  if (meritFamilies.has('fuerza') && demeritFamilies.has('fuerza')) {
    push({ code: 'fuerza-conflict', path: 'traits', severity: 'error', message: 'No puedes ser Fuerte y Débil a la vez.' });
  }

  // ── Habilidades extra ──
  const intValue: number | null = draft.attributes.INT;
  const maxSlots = intSkillSlots(intValue);
  const validExtras = draft.extraSkills.filter(e => e.skillId || e.level > 0);
  if (validExtras.length > maxSlots) {
    push({ code: 'extra-skills-overflow', path: 'extraSkills', severity: 'error', message: `Máx. ${maxSlots} habilidades extra para INT actual.` });
  }
  const extraIds = new Set<string>();
  for (const e of draft.extraSkills) {
    if (e.skillId && e.level === 0) {
      push({ code: 'extra-skill-level-missing', path: 'extraSkills', severity: 'error', message: `Habilidad "${e.skillId}" sin nivel.` });
    }
    if (!e.skillId && e.level > 0) {
      push({ code: 'extra-skill-name-missing', path: 'extraSkills', severity: 'error', message: 'Nivel comprado sin habilidad asignada.' });
    }
    if (e.skillId) {
      if (extraIds.has(e.skillId)) {
        push({ code: 'extra-skill-duplicate', path: 'extraSkills', severity: 'error', message: `Habilidad duplicada: ${e.skillId}.` });
      }
      extraIds.add(e.skillId);
      if (!SKILL_BY_ID.has(e.skillId)) {
        push({ code: 'extra-skill-unknown', path: 'extraSkills', severity: 'error', message: `Habilidad desconocida: ${e.skillId}.` });
      }
      // Ya concedida por formación
      const edu = draft.background.educationId ? EDUCATION_BY_ID.get(draft.background.educationId) : undefined;
      if (edu && edu.grantedSkills.some(g => g.skillId === e.skillId)) {
        push({ code: 'extra-skill-granted', path: 'extraSkills', severity: 'error', message: `"${e.skillId}" ya viene en formación.` });
      }
    }
  }

  // ── Tirada Mech ──
  const allowedMods = ALLOWED_MODIFIERS[draft.campaign.id];
  if (!allowedMods.includes(draft.assignedMech.modifier)) {
    push({ code: 'mech-mod-invalid', path: 'assignedMech.modifier', severity: 'error', message: `Modificador no permitido en ${draft.campaign.id}.` });
  }
  if (draft.assignedMech.rawRoll === null || draft.assignedMech.finalRoll === null) {
    push({ code: 'mech-roll-missing', path: 'assignedMech', severity: 'error', message: 'Falta realizar la tirada de Mech.' });
  } else {
    const b = ROLL_BOUNDS[draft.campaign.id];
    if (draft.assignedMech.finalRoll < b.min || draft.assignedMech.finalRoll > b.max) {
      push({ code: 'mech-roll-bounds', path: 'assignedMech.finalRoll', severity: 'error', message: `Tirada final fuera de límites [${b.min}, ${b.max}].` });
    }
    if (!draft.assignedMech.model) {
      push({ code: 'mech-model-missing', path: 'assignedMech.model', severity: 'error', message: 'Falta elegir modelo (grupos IS requieren selección).' });
    }
  }

  // ── Presupuesto ──
  const costs = calculateCreationCosts(draft);
  if (costs.remaining < 0) {
    push({ code: 'budget-negative', path: 'budget', severity: 'error', message: `Presupuesto negativo: ${costs.remaining} pts.` });
  } else if (costs.remaining > 0) {
    push({ code: 'budget-leftover', path: 'budget', severity: 'warning', message: `Sobran ${costs.remaining} pts sin gastar.` });
  }

  // ── Coherencia origen/afiliación (warning) ──
  if (draft.background.originId && draft.background.affiliationId) {
    const a = AFFILIATION_BY_ID.get(draft.background.affiliationId);
    if (a?.defaultOriginId && a.defaultOriginId !== draft.background.originId && draft.background.affiliationId !== 'mercenario') {
      push({ code: 'origin-affiliation-mismatch', path: 'background', severity: 'warning', message: 'Origen y afiliación no encajan típicamente.' });
    }
  }

  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some(i => i.severity === 'error');
}
