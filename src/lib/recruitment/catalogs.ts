// ══════════════════════════════════════════════════════════════
//  recruitment/catalogs.ts — Catálogos canónicos
//
//  Toda entrada usa ID estable (kebab-case). Textos visibles en
//  `label` para traducción. Alias legacy → ID en LEGACY_ALIASES.
//
//  Fuente: legacy index Enorme.html L1546–1622 + spec §10, §6, §8, §9.
// ══════════════════════════════════════════════════════════════

import type { AttributeId, EducationId } from './types';

// ── Origin catalog ────────────────────────────────────────────
export interface OriginDef {
  id:    string;
  label: string;
}

export const ORIGINS: readonly OriginDef[] = [
  { id: 'alianza-mundos-exteriores', label: 'Alianza de Mundos Exteriores' },
  { id: 'coalicion-auriga',          label: 'Coalición Auriga' },
  { id: 'concordato-tauro',          label: 'Concordato de Tauro' },
  { id: 'condominio-draconis',       label: 'Condominio Draconis' },
  { id: 'confederacion-capella',     label: 'Confederación de Capella' },
  { id: 'confederacion-oberon',      label: 'Confederación de Oberon' },
  { id: 'federacion-circinus',       label: 'Federación de Circinus' },
  { id: 'federacion-soles',          label: 'Federación de Soles' },
  { id: 'hegemonia-mariana',         label: 'Hegemonía Mariana' },
  { id: 'liga-mundos-libres',        label: 'Liga de Mundos Libres' },
  { id: 'magistratura-canopus',      label: 'Magistratura de Canopus' },
  { id: 'mancomunidad-lirana',       label: 'Mancomunidad Lirana' },
] as const;

// ── Affiliation catalog ──────────────────────────────────────
export interface AffiliationDef {
  id:                string;
  label:             string;          // texto mostrado canónico
  legacyValue:       string;          // valor exacto persistido en legacy
  /** Origen sugerido (no obliga). */
  defaultOriginId?:  string;
}

export const AFFILIATIONS: readonly AffiliationDef[] = [
  { id: 'casa-avellar',   label: 'Casa Avellar',   legacyValue: 'Casa Avellar (Alianza de Mundos Exteriores)', defaultOriginId: 'alianza-mundos-exteriores' },
  { id: 'casa-arano',     label: 'Casa Arano',     legacyValue: 'Casa Arano (Coalición Auriga)',               defaultOriginId: 'coalicion-auriga' },
  { id: 'casa-calderon',  label: 'Casa Calderón',  legacyValue: 'Casa Calderon (Concordato de Tauro)',         defaultOriginId: 'concordato-tauro' },
  { id: 'casa-kurita',    label: 'Casa Kurita',    legacyValue: 'Casa Kurita (Condominio Draconis)',           defaultOriginId: 'condominio-draconis' },
  { id: 'casa-liao',      label: 'Casa Liao',      legacyValue: 'Casa Liao (Confederación de Capella)',        defaultOriginId: 'confederacion-capella' },
  { id: 'casa-grimm',     label: 'Casa Grimm',     legacyValue: 'Casa Grimm (Confederación de Oberon)',        defaultOriginId: 'confederacion-oberon' },
  { id: 'casa-mcintyre',  label: 'Casa McIntyre',  legacyValue: 'Casa McIntyre (Federación de Circinus)',      defaultOriginId: 'federacion-circinus' },
  { id: 'casa-davion',    label: 'Casa Davion',    legacyValue: 'Casa Davion (Federacion de Soles)',           defaultOriginId: 'federacion-soles' },
  { id: 'casa-oreilly',   label: "Casa O'Reilly",  legacyValue: "Casa O'Reilly (Hegemonía Mariana)",           defaultOriginId: 'hegemonia-mariana' },
  { id: 'casa-marik',     label: 'Casa Marik',     legacyValue: 'Casa Marik (Liga de Mundos Libres)',          defaultOriginId: 'liga-mundos-libres' },
  { id: 'casa-centrella', label: 'Casa Centrella', legacyValue: 'Casa Centrella (Magistratura de Canopus)',    defaultOriginId: 'magistratura-canopus' },
  { id: 'casa-steiner',   label: 'Casa Steiner',   legacyValue: 'Casa Steiner (Mancomunidad de Lira)',         defaultOriginId: 'mancomunidad-lirana' },
  { id: 'mercenario',     label: 'Mercenario',     legacyValue: 'Mercenario (Unidad Mercenaria)' },
] as const;

// ── Education / Formación ────────────────────────────────────
export interface EducationDef {
  id:           EducationId;
  label:        string;
  cost:         number;
  minInt:       number;
  /** Habilidades concedidas {skillId, level}. */
  grantedSkills: Array<{ skillId: string; level: number }>;
  grantedMeritIds?:   string[];
  grantedDemeritIds?: string[];
  /** Si true, requiere elegir nobleSkillId (espada|equitacion). */
  requiresNobleSkill?: boolean;
}

export const EDUCATIONS: readonly EducationDef[] = [
  {
    id: 'academia-oficiales',
    label: 'Academia de Oficiales',
    cost: 100,
    minInt: 8,
    grantedSkills: [
      { skillId: 'pilotar-mech',    level: 2 },
      { skillId: 'disparo-mech',    level: 2 },
      { skillId: 'tecnica-mech',    level: 2 },
      { skillId: 'pistola',         level: 1 },
      { skillId: 'tacticas',        level: 2 },
      { skillId: 'rifle',           level: 1 },
      { skillId: 'astronavegacion', level: 1 },
    ],
  },
  {
    id: 'academia-combate',
    label: 'Academia de Combate',
    cost: 75,
    minInt: 6,
    grantedSkills: [
      { skillId: 'pilotar-mech',  level: 2 },
      { skillId: 'disparo-mech',  level: 2 },
      { skillId: 'tecnica-mech',  level: 2 },
      { skillId: 'pistola',       level: 1 },
      { skillId: 'liderazgo',     level: 1 },
      { skillId: 'supervivencia', level: 1 },
    ],
  },
  {
    id: 'tutores-nobles',
    label: 'Tutores Nobles',
    cost: 85,
    minInt: 6,
    grantedSkills: [
      { skillId: 'pilotar-mech',    level: 3 },
      { skillId: 'disparo-mech',    level: 2 },
      { skillId: 'tecnica-mech',    level: 1 },
      { skillId: 'pistola',         level: 1 },
      { skillId: 'admin-de-feudo',  level: 2 },
      // nobleSkillId añade espada o equitacion lvl 1 dinámicamente
    ],
    grantedMeritIds: ['nobleza-baja'],
    requiresNobleSkill: true,
  },
  {
    id: 'autodidacta',
    label: 'Autodidacta',
    cost: 65,
    minInt: 5,
    grantedSkills: [
      { skillId: 'pilotar-mech',   level: 3 },
      { skillId: 'disparo-mech',   level: 1 },
      { skillId: 'tecnica-mech',   level: 2 },
      { skillId: 'rifle',          level: 1 },
      { skillId: 'supervivencia',  level: 1 },
    ],
    // Decisión spec §6.4: ID canónico 'ineptitud-natural' (mismo del catálogo deméritos).
    // El demérito se concede sin coste/recompensa (granted).
    grantedDemeritIds: ['ineptitud-natural'],
  },
] as const;

// ── Merits ───────────────────────────────────────────────────
export interface MeritDef {
  id:       string;
  label:    string;
  cost:     number;
  /** ID de familia excluyente (uno por familia máximo). */
  family?:  string;
}

export const MERITS: readonly MeritDef[] = [
  { id: 'ambidiestro-indiferente', label: 'Ambidiestro Indiferente', cost: 20, family: 'ambidiestro' },
  { id: 'ambidiestro-ambas',       label: 'Ambidiestro Ambas',       cost: 40, family: 'ambidiestro' },
  { id: 'atractivo',               label: 'Atractivo',               cost: 10 },
  { id: 'valiente',                label: 'Valiente',                cost: 10 },
  { id: 'sexto-sentido',           label: 'Sexto sentido',           cost: 20 },
  { id: 'contactos-leves',         label: 'Contactos leves',         cost:  5, family: 'contactos' },
  { id: 'contactos-medios',        label: 'Contactos medios',        cost: 10, family: 'contactos' },
  { id: 'contactos-poderosos',     label: 'Contactos poderosos',     cost: 20, family: 'contactos' },
  { id: 'aptitud-natural',         label: 'Aptitud natural',         cost: 20 },
  { id: 'sentidos-agudos',         label: 'Sentidos agudos',         cost: 10 },
  { id: 'reputacion-leve',         label: 'Reputación leve',         cost:  5, family: 'reputacion' },
  { id: 'reputacion-media',        label: 'Reputación media',        cost: 10, family: 'reputacion' },
  { id: 'reputacion-elevada',      label: 'Reputación elevada',      cost: 20, family: 'reputacion' },
  { id: 'resistencia-al-dolor',    label: 'Resistencia al dolor',    cost: 10 },
  { id: 'resistencia-a-drogas',    label: 'Resistencia a las drogas', cost: 10 },
  { id: 'riqueza-leve',            label: 'Riqueza leve',            cost:  5, family: 'riqueza' },
  { id: 'riqueza-media',           label: 'Riqueza media',           cost: 10, family: 'riqueza' },
  { id: 'riqueza-elevada',         label: 'Riqueza elevada',         cost: 20, family: 'riqueza' },
  { id: 'nobleza-baja',            label: 'Nobleza baja',            cost:  5, family: 'nobleza' },
  { id: 'nobleza-media',           label: 'Nobleza media',           cost: 10, family: 'nobleza' },
  { id: 'nobleza-alta',            label: 'Nobleza alta',            cost: 20, family: 'nobleza' },
  { id: 'fuerte',                  label: 'Fuerte',                  cost: 20, family: 'fuerza' },
] as const;

// ── Demerits ─────────────────────────────────────────────────
export interface DemeritDef {
  id:       string;
  label:    string;
  /** Puntos devueltos al presupuesto (siempre positivo). */
  reward:   number;
  family?:  string;
}

export const DEMERITS: readonly DemeritDef[] = [
  { id: 'adiccion-leve',           label: 'Adicción leve',           reward: 10, family: 'adiccion' },
  { id: 'adiccion-fuerte',         label: 'Adicción fuerte',         reward: 20, family: 'adiccion' },
  { id: 'mala-reputacion-leve',    label: 'Mala reputación leve',    reward:  5, family: 'mala-reputacion' },
  { id: 'mala-reputacion-media',   label: 'Mala reputación media',   reward: 10, family: 'mala-reputacion' },
  { id: 'mala-reputacion-alta',    label: 'Mala reputación alta',    reward: 20, family: 'mala-reputacion' },
  { id: 'terror-combate-leve',     label: 'Terror de combate leve',  reward: 10, family: 'terror-combate' },
  { id: 'terror-combate-alto',     label: 'Terror de combate alto',  reward: 20, family: 'terror-combate' },
  { id: 'enemigo-debil',           label: 'Enemigo débil',           reward:  5, family: 'enemigo' },
  { id: 'enemigo-medio',           label: 'Enemigo medio',           reward: 10, family: 'enemigo' },
  { id: 'enemigo-poderoso',        label: 'Enemigo poderoso',        reward: 20, family: 'enemigo' },
  { id: 'sdt',                     label: 'SDT',                     reward: 10 },
  { id: 'deudas-leves',            label: 'Deudas leves',            reward:  5, family: 'deudas' },
  { id: 'deudas-medias',           label: 'Deudas medias',           reward: 10, family: 'deudas' },
  { id: 'deudas-elevadas',         label: 'Deudas elevadas',         reward: 20, family: 'deudas' },
  { id: 'ineptitud-natural',       label: 'Ineptitud natural',       reward: 20 },
  { id: 'repulsivo',               label: 'Repulsivo',               reward: 10 },
  { id: 'gafe',                    label: 'Gafe',                    reward: 10 },
  { id: 'debil',                   label: 'Débil',                   reward: 20, family: 'fuerza' },
] as const;

// ── Skills (extra-compra + concedidas por formación) ─────────
export interface SkillDef {
  id:                 string;
  label:              string;
  governingAttribute: AttributeId;
}

export const SKILLS: readonly SkillDef[] = [
  { id: 'admin-de-feudo',       label: 'Admin. de Feudo',       governingAttribute: 'INT' },
  { id: 'arco',                 label: 'Arco',                  governingAttribute: 'DES' },
  { id: 'astronavegacion',      label: 'Astronavegación',       governingAttribute: 'INT' },
  { id: 'astropilotaje',        label: 'AstroPilotaje',         governingAttribute: 'DES' },
  { id: 'atletismo',            label: 'Atletismo',             governingAttribute: 'FUE' },
  { id: 'callejeo',             label: 'Callejeo',              governingAttribute: 'CAR' },
  { id: 'conducir',             label: 'Conducir',              governingAttribute: 'DES' },
  { id: 'diplomacia',           label: 'Diplomacia',            governingAttribute: 'CAR' },
  { id: 'disparo-aeroespacial', label: 'Disparo Aeroespacial',  governingAttribute: 'DES' },
  { id: 'disparo-artilleria',   label: 'Disparo Artillería',    governingAttribute: 'DES' },
  { id: 'disparo-mech',         label: 'Disparo Mech',          governingAttribute: 'DES' },
  { id: 'equitacion',           label: 'Equitación',            governingAttribute: 'DES' },
  { id: 'espada',               label: 'Espada',                governingAttribute: 'DES' },
  { id: 'informatica',          label: 'Informática',           governingAttribute: 'INT' },
  { id: 'ingenieria',           label: 'Ingeniería',            governingAttribute: 'INT' },
  { id: 'interrogacion',        label: 'Interrogación',         governingAttribute: 'CAR' },
  { id: 'liderazgo',            label: 'Liderazgo',             governingAttribute: 'CAR' },
  { id: 'mecanica',             label: 'Mecánica',              governingAttribute: 'INT' },
  { id: 'pelea',                label: 'Pelea',                 governingAttribute: 'FUE' },
  { id: 'picaro',               label: 'Pícaro',                governingAttribute: 'DES' },
  { id: 'pilotar-aeroespacial', label: 'Pilotar Aeroespacial',  governingAttribute: 'DES' },
  { id: 'pilotar-mech',         label: 'Pilotar Mech',          governingAttribute: 'DES' },
  { id: 'pistola',              label: 'Pistola',               governingAttribute: 'DES' },
  { id: 'primeros-auxilios',    label: 'Primeros Auxilios',     governingAttribute: 'INT' },
  { id: 'rifle',                label: 'Rifle',                 governingAttribute: 'DES' },
  { id: 'supervivencia',        label: 'Supervivencia',         governingAttribute: 'INT' },
  { id: 'tacticas',             label: 'Tácticas',              governingAttribute: 'INT' },
  { id: 'tecnica-mech',         label: 'Técnica Mech',          governingAttribute: 'INT' },
] as const;

// ── Lookups por ID ───────────────────────────────────────────
export const ORIGIN_BY_ID:      Map<string, OriginDef>      = new Map(ORIGINS.map(o => [o.id, o]));
export const AFFILIATION_BY_ID: Map<string, AffiliationDef> = new Map(AFFILIATIONS.map(a => [a.id, a]));
export const EDUCATION_BY_ID:   Map<EducationId, EducationDef> = new Map(EDUCATIONS.map(e => [e.id, e]));
export const MERIT_BY_ID:       Map<string, MeritDef>       = new Map(MERITS.map(m => [m.id, m]));
export const DEMERIT_BY_ID:     Map<string, DemeritDef>     = new Map(DEMERITS.map(d => [d.id, d]));
export const SKILL_BY_ID:       Map<string, SkillDef>       = new Map(SKILLS.map(s => [s.id, s]));

// ── Legacy aliases → ID canónico ────────────────────────────
// Inputs legacy son textos del HTML antiguo; outputs son IDs del catálogo.
export const LEGACY_ORIGIN_ALIASES: Record<string, string> = {
  'Confederación de Capela':  'confederacion-capella',
  'Confederacion de Capela':  'confederacion-capella',
  'Federacion de Soles':      'federacion-soles',
  'Mancomunidad de Lira':     'mancomunidad-lirana',
};

export const LEGACY_AFFILIATION_ALIASES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const a of AFFILIATIONS) out[a.legacyValue] = a.id;
  return out;
})();

// ── Catálogo legacy "Extra Skills" (subset comprables) ───────
// Spec §7.3
export const EXTRA_SKILLS_LEGACY_IDS: readonly string[] = [
  'admin-de-feudo', 'arco', 'astronavegacion', 'astropilotaje', 'atletismo',
  'callejeo', 'conducir', 'diplomacia', 'disparo-aeroespacial',
  'disparo-artilleria', 'disparo-mech', 'espada', 'informatica', 'ingenieria',
  'interrogacion', 'liderazgo', 'mecanica', 'pelea', 'picaro',
  'pilotar-aeroespacial', 'pilotar-mech', 'pistola', 'primeros-auxilios',
  'rifle', 'supervivencia', 'tacticas', 'tecnica-mech',
];
