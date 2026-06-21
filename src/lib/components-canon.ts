// Componentes "estructurales" canon que SSW define en Java source, no en JSON.
// Se completa la cobertura del catálogo (.ssw) con estos ítems. La fuente es
// SSW components/* (BSD).
//
// Schema mínimo: lo que el sim/hangar/TRO necesita para no romper.
// Stats completos canon van llegando según los necesitemos.

export interface ComponentRule {
  lookupName: string;
  actualName: string;
  category: 'Structural' | 'Module' | 'Array' | 'Storage';
  aliases?: string[];
  tonnage?: number;
  cost?: number;
  numCrits?: number;
  bvOffensive?: number;
  bvDefensive?: number;
  notes?: string;
}

export const COMPONENTS: ComponentRule[] = [
  // ── CASE / CASE II ───────────────────────────────────────────
  {
    lookupName: 'CASE',
    actualName: 'Cellular Ammunition Storage Equipment',
    category: 'Structural',
    tonnage: 0.5,
    cost: 50000,
    numCrits: 1,
    notes: 'Contiene explosión de munición a la localización afectada (IS).',
  },
  {
    lookupName: '(IS) CASE II',
    actualName: 'CASE II',
    category: 'Structural',
    tonnage: 1,
    cost: 175000,
    numCrits: 1,
    notes: 'Anula crit roll en explosión de munición (1 daño residual).',
  },
  {
    lookupName: '(CL) CASE II',
    actualName: 'CASE II',
    category: 'Structural',
    tonnage: 0.5,
    cost: 175000,
    numCrits: 1,
    notes: 'Anula crit roll en explosión de munición. Más ligero (Clan).',
  },

  // ── Targeting Computer ───────────────────────────────────────
  // SSW marca TCCapable en weapons.json. Stats del TC dependen del peso
  // total de armas TC-capables del mech (1 ton TC por cada 4 tons de armas).
  {
    lookupName: '(IS) Targeting Computer',
    actualName: 'Targeting Computer',
    category: 'Module',
    numCrits: 1,
    notes: 'Aplica -1 toHit en armas TCCapable. Tonelaje variable.',
  },
  {
    lookupName: '(CL) Targeting Computer',
    actualName: 'Targeting Computer',
    category: 'Module',
    numCrits: 1,
    notes: 'Aplica -1 toHit en armas TCCapable. Más ligero (Clan).',
  },

  // ── Supercharger / Motor variants ────────────────────────────
  {
    lookupName: 'Supercharger',
    actualName: 'Supercharger',
    category: 'Module',
    tonnage: 0,
    cost: 0,
    numCrits: 1,
    notes: 'MP boost temporal. Risk de daño al motor por uso.',
  },
  {
    lookupName: 'Extra Double Heat Sink (Freezers)',
    actualName: 'Extra Double Heat Sink (Freezers)',
    category: 'Module',
    notes: 'Heat sinks adicionales tipo "Freezer" (variante avanzada).',
  },
  {
    lookupName: 'Extended Fuel Tank',
    actualName: 'Extended Fuel Tank',
    category: 'Storage',
    notes: 'Capacidad fuel extendida (vehículos / aero).',
  },

  // ── Modular Armor / Talons ───────────────────────────────────
  {
    lookupName: 'Modular Armor',
    actualName: 'Modular Armor',
    category: 'Structural',
    notes: 'Armor adicional removible (5 puntos por crit).',
  },
  {
    lookupName: 'Talons',
    actualName: 'Talons',
    category: 'Module',
    notes: 'Garras en pies. Bonus a kick damage. Penalty Piloting.',
  },

  // ── PPC Capacitor compounds ──────────────────────────────────
  // El sim debe parsear "X + PPC Capacitor" y buscar X por separado + flag capacitor.
  {
    lookupName: '(IS) PPC + PPC Capacitor',
    actualName: 'PPC with Capacitor',
    category: 'Module',
    aliases: ['PPC + PPC Capacitor'],
    notes: 'PPC con capacitor: +5 daño al disparar, +5 calor adicional. Riesgo crit.',
  },
  {
    lookupName: '(IS) Light PPC + PPC Capacitor',
    actualName: 'Light PPC with Capacitor',
    category: 'Module',
  },
  {
    lookupName: '(IS) ER PPC + PPC Capacitor',
    actualName: 'ER PPC with Capacitor',
    category: 'Module',
  },
  {
    lookupName: '(IS) Heavy PPC + PPC Capacitor',
    actualName: 'Heavy PPC with Capacitor',
    category: 'Module',
  },
  {
    lookupName: '(IS) Snub-Nose PPC + PPC Capacitor',
    actualName: 'Snub-Nose PPC with Capacitor',
    category: 'Module',
  },
  {
    lookupName: '(CL) ER PPC + PPC Capacitor',
    actualName: 'ER PPC with Capacitor',
    category: 'Module',
  },

  // ── MG Array ─────────────────────────────────────────────────
  // Las arrays linkean N machine guns a un controlador. SSW las representa
  // como item compound. Sim debe linkear las MG individuales.
  {
    lookupName: '(IS) MG Array (3 Machine Gun)',
    actualName: 'MG Array (3x MG)',
    category: 'Array',
    notes: '3 Machine Gun linkadas. Dispara como cluster.',
  },
  {
    lookupName: '(IS) MG Array (4 Machine Gun)',
    actualName: 'MG Array (4x MG)',
    category: 'Array',
  },
  {
    lookupName: '(IS) MG Array (3 Light Machine Gun)',
    actualName: 'MG Array (3x Light MG)',
    category: 'Array',
  },
  {
    lookupName: '(IS) MG Array (4 Light Machine Gun)',
    actualName: 'MG Array (4x Light MG)',
    category: 'Array',
  },
  {
    lookupName: '(CL) MG Array (3 Machine Gun)',
    actualName: 'MG Array (3x MG)',
    category: 'Array',
  },
  {
    lookupName: '(CL) MG Array (4 Machine Gun)',
    actualName: 'MG Array (4x MG)',
    category: 'Array',
  },
  {
    lookupName: '(CL) MG Array (3 Light Machine Gun)',
    actualName: 'MG Array (3x Light MG)',
    category: 'Array',
  },
  {
    lookupName: '(CL) MG Array (4 Light Machine Gun)',
    actualName: 'MG Array (4x Light MG)',
    category: 'Array',
  },
  {
    lookupName: '(CL) MG Array (3 Heavy Machine Gun)',
    actualName: 'MG Array (3x Heavy MG)',
    category: 'Array',
  },
  {
    lookupName: '(CL) MG Array (4 Heavy Machine Gun)',
    actualName: 'MG Array (4x Heavy MG)',
    category: 'Array',
  },

  // ── Pulse Laser Insulated variants ───────────────────────────
  {
    lookupName: '(IS) Medium Pulse Laser (Insulated)',
    actualName: 'Medium Pulse Laser (Insulated)',
    category: 'Module',
    notes: 'Pulse + Insulator: reduce calor a costa de slots extra.',
  },
  {
    lookupName: '(IS) Medium Variable Speed Pulse Laser (Insulated)',
    actualName: 'Medium VSP Laser (Insulated)',
    category: 'Module',
  },

  // ── Otros componentes raros ──────────────────────────────────
  {
    lookupName: 'Drone Operating System',
    actualName: 'Drone Operating System',
    category: 'Module',
  },
  {
    lookupName: 'Vehicular Grenade Launcher',
    actualName: 'Vehicular Grenade Launcher',
    category: 'Module',
    notes: 'Lanzagranadas vehicular. Antiinfantería.',
  },
];

export const COMPONENTS_BY_LOOKUP: Record<string, ComponentRule> = {};
export const COMPONENTS_BY_ALIAS: Record<string, ComponentRule> = {};

for (const c of COMPONENTS) {
  COMPONENTS_BY_LOOKUP[c.lookupName] = c;
  COMPONENTS_BY_ALIAS[c.lookupName] = c;
  if (c.aliases) for (const a of c.aliases) COMPONENTS_BY_ALIAS[a] = c;
}

export function getComponent(name: string): ComponentRule | null {
  return COMPONENTS_BY_LOOKUP[name] ?? COMPONENTS_BY_ALIAS[name] ?? null;
}
