// ══════════════════════════════════════════════════════════════
//  useRecruitment — Hook de estado del generador de personajes
//
//  Mantiene CharacterDraft único + sincroniza:
//   · grantedSkills/Merits/Demerits según formación seleccionada
//   · nobleSkillId añade habilidad concedida dinámica
//   · cambio campaña/INT puede invalidar selecciones (UI tags errores)
// ══════════════════════════════════════════════════════════════

import { useCallback, useMemo, useState } from 'react';
import {
  type CharacterDraft, type ValidationIssue, type CostBreakdown,
  emptyCharacterDraft, type AttributeId, type Background, type Traits,
  type ExtraSkillEntry, type AssignedMech, type PhysicalData, type CampaignSetting,
  type CampaignStatus,
} from '@/lib/recruitment/types';
import { calculateCreationCosts } from '@/lib/recruitment/costs';
import { validateDraft } from '@/lib/recruitment/validation';
import { EDUCATION_BY_ID } from '@/lib/recruitment/catalogs';

export interface UseRecruitment {
  draft:    CharacterDraft;
  costs:    CostBreakdown;
  issues:   ValidationIssue[];
  hasErrors: boolean;
  setIdentity:   (patch: Partial<CharacterDraft['identity']>) => void;
  setCampaign:   (patch: Partial<CampaignSetting>) => void;
  setAttribute:  (a: AttributeId, v: number | null) => void;
  setBackground: (b: Background) => void;
  setTraits:     (t: Traits) => void;
  setExtraSkills: (e: ExtraSkillEntry[]) => void;
  setMech:       (m: AssignedMech) => void;
  setPhysical:   (p: PhysicalData) => void;
  setStatus:     (s: Partial<CampaignStatus>) => void;
  reset:         () => void;
}

/** Recalcula grantedMeritIds/grantedDemeritIds + habilidades por nobleSkill. */
function syncGrantsFromEducation(draft: CharacterDraft): CharacterDraft {
  const eduId = draft.background.educationId;
  const edu = eduId ? EDUCATION_BY_ID.get(eduId) : null;
  const gM = edu?.grantedMeritIds ?? [];
  const gD = edu?.grantedDemeritIds ?? [];
  const cleanedMerits = draft.traits.meritIds.filter(id => !gM.includes(id));
  const cleanedDemerits = draft.traits.demeritIds.filter(id => !gD.includes(id));
  return {
    ...draft,
    traits: {
      ...draft.traits,
      meritIds:          cleanedMerits,
      demeritIds:        cleanedDemerits,
      grantedMeritIds:   gM,
      grantedDemeritIds: gD,
    },
  };
}

/** Aplica reglas de campaña (ELH fuerza Mercenario; KKK libre). */
function syncCampaignRules(draft: CharacterDraft): CharacterDraft {
  if (draft.campaign.id === 'ELH') {
    return { ...draft, background: { ...draft.background, affiliationId: 'mercenario' } };
  }
  // IS, KKK: afiliación libre
  return draft;
}

/** Limpia formación si INT baja del mínimo. */
function syncEducationVsInt(draft: CharacterDraft): CharacterDraft {
  const edu = draft.background.educationId ? EDUCATION_BY_ID.get(draft.background.educationId) : null;
  if (edu && draft.attributes.INT !== null && draft.attributes.INT < edu.minInt) {
    return { ...draft, background: { ...draft.background, educationId: null, nobleSkillId: null } };
  }
  return draft;
}

export function useRecruitment(initial?: CharacterDraft): UseRecruitment {
  const [draft, setDraft] = useState<CharacterDraft>(() => initial ?? emptyCharacterDraft());

  const update = useCallback((patch: (d: CharacterDraft) => CharacterDraft) => {
    setDraft(d => syncGrantsFromEducation(syncCampaignRules(syncEducationVsInt(patch(d)))));
  }, []);

  const costs = useMemo(() => calculateCreationCosts(draft), [draft]);
  const issues = useMemo(() => validateDraft(draft), [draft]);
  const hasErrors = issues.some(i => i.severity === 'error');

  return {
    draft, costs, issues, hasErrors,
    setIdentity:   patch => update(d => ({ ...d, identity: { ...d.identity, ...patch } })),
    setCampaign:   patch => update(d => ({ ...d, campaign: { ...d.campaign, ...patch } })),
    setAttribute:  (a, v) => update(d => ({ ...d, attributes: { ...d.attributes, [a]: v } })),
    setBackground: b => update(d => ({ ...d, background: b })),
    setTraits:     t => update(d => ({ ...d, traits: { ...t, grantedMeritIds: d.traits.grantedMeritIds, grantedDemeritIds: d.traits.grantedDemeritIds } })),
    setExtraSkills: e => update(d => ({ ...d, extraSkills: e })),
    setMech:       m => update(d => ({ ...d, assignedMech: m })),
    setPhysical:   p => update(d => ({ ...d, physical: p })),
    setStatus:     patch => update(d => ({ ...d, campaignStatus: { ...d.campaignStatus, ...patch } })),
    reset:         () => setDraft(emptyCharacterDraft()),
  };
}
