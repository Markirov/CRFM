// ══════════════════════════════════════════════════════════════
//  recruitment/legacy-adapter.ts — JSON legacy → CharacterDraft
//
//  Convierte el formato del HTML "index Enorme" al canónico.
//  Soporta alias ortográficos de origen/afiliación (spec §10).
//  Sanitiza strings, normaliza "180 cm" → 180, "90.7 kg" → 90.7.
// ══════════════════════════════════════════════════════════════

import {
  type CharacterDraft, emptyCharacterDraft, RECRUITMENT_SCHEMA_VERSION,
  type AttributeId, type CampaignId, type EducationId, ATTRIBUTES,
} from './types';
import {
  LEGACY_ORIGIN_ALIASES, LEGACY_AFFILIATION_ALIASES,
  ORIGIN_BY_ID, AFFILIATION_BY_ID, ORIGINS, AFFILIATIONS,
  EDUCATIONS, MERITS, DEMERITS, SKILLS,
} from './catalogs';

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const m = v.match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  return null;
}

function str(v: unknown): string {
  return (v ?? '').toString().trim();
}

function findLabel<T extends { id: string; label: string }>(arr: readonly T[], label: string): T | undefined {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const target = norm(label);
  return arr.find(x => norm(x.label) === target);
}

function originLegacyToCanonical(legacyText: string): string | null {
  if (!legacyText) return null;
  if (ORIGIN_BY_ID.has(legacyText)) return legacyText; // ya canónico
  const alias = LEGACY_ORIGIN_ALIASES[legacyText];
  if (alias) return alias;
  const byLabel = findLabel(ORIGINS, legacyText);
  return byLabel?.id ?? null;
}

function affiliationLegacyToCanonical(legacyText: string): string | null {
  if (!legacyText) return null;
  if (AFFILIATION_BY_ID.has(legacyText)) return legacyText;
  const alias = LEGACY_AFFILIATION_ALIASES[legacyText];
  if (alias) return alias;
  const byLabel = findLabel(AFFILIATIONS, legacyText);
  return byLabel?.id ?? null;
}

function educationLegacyToCanonical(legacyText: string): EducationId | null {
  if (!legacyText) return null;
  const byLabel = findLabel(EDUCATIONS, legacyText);
  return (byLabel?.id ?? null) as EducationId | null;
}

function meritLegacyToCanonical(label: string): string | null {
  if (!label) return null;
  const byLabel = findLabel(MERITS, label);
  return byLabel?.id ?? null;
}
function demeritLegacyToCanonical(label: string): string | null {
  if (!label) return null;
  const byLabel = findLabel(DEMERITS, label);
  return byLabel?.id ?? null;
}
function skillLegacyToCanonical(label: string): string | null {
  if (!label) return null;
  const byLabel = findLabel(SKILLS, label);
  return byLabel?.id ?? null;
}

export interface LegacyCharacterJson {
  campaign?:  string;
  decade?:    string | number;
  year?:      string | number;
  nombre?:    string;
  jugador?:   string;
  str?:       string | number;
  dex?:       string | number;
  int?:       string | number;
  cha?:       string | number;
  origen?:    string;
  afiliacion?: string;
  estudios?:  string;
  nobleSkill?: string;
  merits?:    string[];
  demerits?:  string[];
  extraSkills?: Array<{ skill?: string; level?: string | number }>;
  mechMod?:   string | number;
  mechRoll?:  string | number;
  mechModel?: string;
  mechTons?:  string | number;
  ageRoll?:   string | number;
  altura?:    string | number;
  peso?:      string | number;
  pelo?:      string;
  sexo?:      string;
  ojos?:      string;
  cbills?:    string | number;
  dinero?:    string | number;
  salary?:    string | number;
  sueldo?:    string | number;
  xpTotal?:   string | number;
  xpAvail?:   string | number;
  xpBase?:    string | number;
}

export function legacyToDraft(input: LegacyCharacterJson): CharacterDraft {
  const draft = emptyCharacterDraft();
  draft.schemaVersion = RECRUITMENT_SCHEMA_VERSION;

  // Campaign
  const campRaw = str(input.campaign).toUpperCase();
  draft.campaign.id = (campRaw === 'ELH' || campRaw === 'IS') ? (campRaw as CampaignId) : 'ELH';
  const decade = num(input.decade);
  if (decade !== null) draft.campaign.baseDecade = decade;
  const yearDigit = num(input.year);
  if (yearDigit !== null) draft.campaign.yearDigit = yearDigit;

  // Identity
  draft.identity.name = str(input.nombre);
  draft.identity.playerName = str(input.jugador);

  // Attributes
  draft.attributes.FUE = num(input.str);
  draft.attributes.DES = num(input.dex);
  draft.attributes.INT = num(input.int);
  draft.attributes.CAR = num(input.cha);

  // Background
  draft.background.originId      = originLegacyToCanonical(str(input.origen));
  draft.background.affiliationId = affiliationLegacyToCanonical(str(input.afiliacion));
  draft.background.educationId   = educationLegacyToCanonical(str(input.estudios));
  const noble = str(input.nobleSkill).toLowerCase();
  if (noble === 'espada' || noble === 'equitacion' || noble === 'equitación') {
    draft.background.nobleSkillId = noble === 'espada' ? 'espada' : 'equitacion';
  }

  // Traits
  draft.traits.meritIds   = (input.merits   ?? []).map(meritLegacyToCanonical).filter((x): x is string => !!x);
  draft.traits.demeritIds = (input.demerits ?? []).map(demeritLegacyToCanonical).filter((x): x is string => !!x);

  // Extra skills
  draft.extraSkills = (input.extraSkills ?? [])
    .map(e => {
      const skillId = skillLegacyToCanonical(str(e.skill));
      const level   = num(e.level) ?? 0;
      return skillId && level > 0 ? { skillId, level } : null;
    })
    .filter((x): x is { skillId: string; level: number } => !!x);

  // Mech
  draft.assignedMech.modifier  = num(input.mechMod) ?? 0;
  draft.assignedMech.rawRoll   = num(input.mechRoll);
  draft.assignedMech.model     = str(input.mechModel) || null;
  draft.assignedMech.tons      = num(input.mechTons);
  draft.assignedMech.finalRoll = draft.assignedMech.rawRoll === null
    ? null
    : draft.assignedMech.rawRoll + draft.assignedMech.modifier;

  // Physical
  draft.physical.ageAdjustmentRoll = num(input.ageRoll);
  draft.physical.heightCm = num(input.altura);
  draft.physical.weightKg = num(input.peso);
  draft.physical.hair = str(input.pelo) || null;
  draft.physical.sex  = str(input.sexo) || null;
  draft.physical.eyes = str(input.ojos) || null;
  if (draft.campaign.baseDecade && draft.physical.ageAdjustmentRoll !== null) {
    draft.physical.birthYear = draft.campaign.baseDecade + draft.campaign.yearDigit + draft.physical.ageAdjustmentRoll;
  }

  // Campaign status
  draft.campaignStatus.cbills      = num(input.cbills) ?? num(input.dinero) ?? 0;
  draft.campaignStatus.salary      = num(input.salary) ?? num(input.sueldo) ?? 0;
  draft.campaignStatus.xpTotal     = num(input.xpTotal) ?? 0;
  draft.campaignStatus.xpAvailable = num(input.xpAvail) ?? 0;
  const xpBase = num(input.xpBase);
  if (xpBase !== null) draft.campaignStatus.xpBase = xpBase;

  void ATTRIBUTES; // unused suppression
  return draft;
}
