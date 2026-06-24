// ══════════════════════════════════════════════════════════════
//  recruitment/costs.ts — Tablas costes + cálculo presupuesto
//
//  Fórmula spec §4.2:
//    remaining = 150
//      - Σ attributeCost
//      - educationCost
//      - Σ meritCosts
//      + Σ demeritRewards
//      - Σ extraSkillCosts
//      - mechModifier * 10
// ══════════════════════════════════════════════════════════════

import {
  CREATION_BUDGET, type CharacterDraft, type CostBreakdown, type AttributeId,
} from './types';
import { MERIT_BY_ID, DEMERIT_BY_ID, EDUCATION_BY_ID } from './catalogs';

// ── Tablas costes atributos ──────────────────────────────────
export const ATTRIBUTE_COSTS: Record<AttributeId, Record<number, number>> = {
  FUE: { 2: -110, 3: -50, 4: -20, 5: -5, 6: 0, 7: 10, 8: 30, 9: 70, 10: 150, 11: 300, 12: 600 },
  DES: { 2: -135, 3: -65, 4: -30, 5: -10, 6: 0, 7: 15, 8: 45, 9: 95, 10: 195, 11: 395, 12: 795 },
  INT: { 2: -160, 3: -80, 4: -40, 5: -15, 6: 0, 7: 20, 8: 60, 9: 120, 10: 245, 11: 495, 12: 995 },
  CAR: { 2:  -95, 3: -45, 4: -20, 5:  -5, 6: 0, 7: 10, 8: 30, 9: 70, 10: 150, 11: 300, 12: 600 },
};

// ── Tabla coste compra habilidad extra (level → puntos) ──────
export const SKILL_BUY_COSTS: Record<number, number> = {
  1: 20, 2: 30, 3: 50, 4: 80, 5: 130, 6: 210, 7: 330, 8: 490,
};

// ── Helpers ───────────────────────────────────────────────────
export function attributeCost(attr: AttributeId, value: number | null): number {
  if (value === null) return 0;
  return ATTRIBUTE_COSTS[attr][value] ?? 0;
}

export function educationCost(educationId: string | null): number {
  if (!educationId) return 0;
  const e = EDUCATION_BY_ID.get(educationId as any);
  return e?.cost ?? 0;
}

export function meritCost(meritId: string): number {
  return MERIT_BY_ID.get(meritId)?.cost ?? 0;
}

export function demeritReward(demeritId: string): number {
  return DEMERIT_BY_ID.get(demeritId)?.reward ?? 0;
}

export function skillBuyCost(level: number): number {
  return SKILL_BUY_COSTS[level] ?? 0;
}

// ── Cálculo presupuesto completo ─────────────────────────────
export function calculateCreationCosts(draft: CharacterDraft): CostBreakdown {
  const a = draft.attributes;
  const attrSum =
    attributeCost('FUE', a.FUE) +
    attributeCost('DES', a.DES) +
    attributeCost('INT', a.INT) +
    attributeCost('CAR', a.CAR);

  const educ = educationCost(draft.background.educationId);
  const merits = draft.traits.meritIds.reduce((s, id) => s + meritCost(id), 0);
  const demeritCredit = draft.traits.demeritIds.reduce((s, id) => s + demeritReward(id), 0);
  const extra = draft.extraSkills.reduce(
    (s, e) => s + (e.skillId && e.level > 0 ? skillBuyCost(e.level) : 0), 0
  );
  const mechMod = draft.assignedMech.modifier * 10;

  const spent = attrSum + educ + merits + extra + mechMod - demeritCredit;
  const remaining = CREATION_BUDGET - spent;

  return {
    budget:        CREATION_BUDGET,
    attributes:    attrSum,
    education:     educ,
    merits,
    demeritCredit,
    extraSkills:   extra,
    mechModifier:  mechMod,
    spent,
    remaining,
  };
}
