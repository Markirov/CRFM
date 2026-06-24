// ══════════════════════════════════════════════════════════════
//  recruitment/types.ts — Modelo canónico CharacterDraft
//
//  Spec: docs/personajes_y_pilotos_rpg/especificacion-generador-
//        personajes-legacy.md  §3
//
//  Reglas:
//   · IDs estables (no usar texto traducido como clave).
//   · Atributos enteros 2–12.
//   · Presupuesto base = 150. Coste positivo gasta, negativo devuelve.
// ══════════════════════════════════════════════════════════════

export type CampaignId = 'ELH' | 'IS';
export type AttributeId = 'FUE' | 'DES' | 'INT' | 'CAR';

export const ATTRIBUTES: readonly AttributeId[] = ['FUE', 'DES', 'INT', 'CAR'];
export const CREATION_BUDGET = 150;
export const MAX_TRAITS = 6;
export const MIN_ATTR = 2;
export const MAX_ATTR = 12;

export interface CharacterIdentity {
  name:       string;
  playerName: string;
}

export interface CampaignSetting {
  id:         CampaignId;
  baseDecade: number;   // ej. 3020
  yearDigit:  number;   // 0..9
}

export type AttributeMap = Record<AttributeId, number | null>;

export interface Background {
  originId:      string | null;
  affiliationId: string | null;
  educationId:   EducationId | null;
  /** Solo aplica si educationId='tutores-nobles'. */
  nobleSkillId:  'espada' | 'equitacion' | null;
}

export type EducationId =
  | 'academia-oficiales'
  | 'academia-combate'
  | 'tutores-nobles'
  | 'autodidacta';

export interface Traits {
  meritIds:           string[];
  demeritIds:         string[];
  /** Méritos concedidos por formación (no cuentan en coste). */
  grantedMeritIds:    string[];
  /** Deméritos concedidos por formación (no devuelven puntos). */
  grantedDemeritIds:  string[];
}

export interface ExtraSkillEntry {
  skillId: string;
  level:   number;     // 1..8 (coste sube exponencial)
}

export interface AssignedMech {
  modifier:  number;
  rawRoll:   number | null;
  finalRoll: number | null;
  model:     string | null;
  tons:      number | null;
}

export interface PhysicalData {
  ageAdjustmentRoll: number | null;   // 1d6
  birthYear:         number | null;
  heightCm:          number | null;
  weightKg:          number | null;
  hair:              string | null;
  sex:               string | null;
  eyes:              string | null;
}

export interface CampaignStatus {
  cbills:       number;
  salary:       number;
  xpTotal:      number;
  xpAvailable:  number;
  xpBase?:      number;
}

export interface CharacterDraft {
  schemaVersion: number;
  identity:      CharacterIdentity;
  campaign:      CampaignSetting;
  attributes:    AttributeMap;
  background:    Background;
  traits:        Traits;
  extraSkills:   ExtraSkillEntry[];
  assignedMech:  AssignedMech;
  physical:      PhysicalData;
  campaignStatus: CampaignStatus;
}

export const RECRUITMENT_SCHEMA_VERSION = 1;

/** Crea draft vacío con defaults canónicos. */
export function emptyCharacterDraft(): CharacterDraft {
  return {
    schemaVersion: RECRUITMENT_SCHEMA_VERSION,
    identity:      { name: '', playerName: '' },
    campaign:      { id: 'ELH', baseDecade: 3020, yearDigit: 0 },
    attributes:    { FUE: null, DES: null, INT: null, CAR: null },
    background:    { originId: null, affiliationId: null, educationId: null, nobleSkillId: null },
    traits:        { meritIds: [], demeritIds: [], grantedMeritIds: [], grantedDemeritIds: [] },
    extraSkills:   [],
    assignedMech:  { modifier: 0, rawRoll: null, finalRoll: null, model: null, tons: null },
    physical:      { ageAdjustmentRoll: null, birthYear: null, heightCm: null, weightKg: null, hair: null, sex: null, eyes: null },
    campaignStatus: { cbills: 0, salary: 0, xpTotal: 0, xpAvailable: 0 },
  };
}

export interface CostBreakdown {
  budget:        number;
  attributes:    number;
  education:     number;
  merits:        number;
  demeritCredit: number;
  extraSkills:   number;
  mechModifier:  number;
  spent:         number;
  remaining:     number;
}

export interface ValidationIssue {
  code:     string;
  path:     string;
  severity: 'error' | 'warning';
  message:  string;
}
