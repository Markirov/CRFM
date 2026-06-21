import type { NavSection, Palette } from './types';

// ═══════════════════════════════════════════════════════════════
// NAVIGATION — Section → Route → Palette mapping
//
// Palette assignment (from original Stitch design):
//   AMBER  → Civil:     Comisión, Reclutamiento, Barracones, Hoja, Crónicas
//   BLUE   → Tech/Intel: TRO, Ayudas
//   GREEN  → Military:   Simulador, HUD Táctico
// ═══════════════════════════════════════════════════════════════

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'MANDO Y LOGÍSTICA',
    items: [
      { id: 'mando', label: 'Mando & Contratos', icon: '🏛️', path: '/mando', palette: 'amber',
        tabs: [
          { id: 'comision', label: 'Comisión' },
          { id: 'hoja', label: 'Hoja de Servicio' },
        ],
      },
      { id: 'finanzas', label: 'Tesorería', icon: '💰', path: '/finanzas', palette: 'amber',
        tabs: [
          { id: 'home', label: 'Inicio' },
          { id: 'libro-mayor', label: 'Libro Mayor' },
        ],
      },
      { id: 'rrhh', label: 'Recursos Humanos', icon: '👥', path: '/rrhh', palette: 'amber',
        tabs: [
          { id: 'plantilla', label: 'Plantilla' },
          { id: 'reclutamiento', label: 'Reclutamiento' },
          { id: 'barracones', label: 'Barracones' },
          { id: 'logros', label: 'Logros' },
        ],
      },
      { id: 'suministros', label: 'Suministros', icon: '📦', path: '/suministros', palette: 'amber',
        tabs: [
          { id: 'mercado', label: 'Mercado' },
          { id: 'viajes', label: 'Viajes y Transporte' },
        ],
      },
    ],
  },
  {
    label: 'INGENIERÍA Y MANTENIMIENTO',
    items: [
      { id: 'hangar', label: 'Hangar', icon: '🛠️', path: '/hangar', palette: 'amber',
        tabs: [
          { id: 'unidades', label: 'Unidades' },
          { id: 'almacen', label: 'Almacén' },
        ],
      },
      { id: 'taller', label: 'Taller', icon: '🔧', path: '/taller', palette: 'amber',
        tabs: [
          { id: 'prioridades', label: 'Prioridades' },
          { id: 'mantenimiento', label: 'Mantenimiento' },
          { id: 'municion', label: 'Munición' },
        ],
      },
    ],
  },
  {
    label: 'OPERACIONES',
    items: [
      {
        id: 'simulador', label: 'Simulador', icon: '⚔️', path: '/simulador', palette: 'green',
        tabs: [
          { id: 'infanteria', label: 'Infantería' },
          { id: 'mechs', label: 'Mechs' },
          { id: 'vehiculos', label: 'Vehículos' },
        ],
      },
      { id: 'hud', label: 'Seguimiento de Combate', icon: '🎯', path: '/hud', palette: 'green' },
    ],
  },
  {
    label: 'INTELIGENCIA Y REGISTROS',
    items: [
      { id: 'ayudas', label: 'Ayudas Rápidas', icon: '📋', path: '/ayudas', palette: 'blue' },
      { id: 'tro',    label: 'Manual Técnico', icon: '📖', path: '/tro',    palette: 'blue' },
      { id: 'wiki',   label: 'Wiki de Reglas', icon: '📚', path: '/wiki',   palette: 'blue' },
      { id: 'mapa', label: 'Navegación', icon: '🌌', path: '/mapa', palette: 'blue',
        tabs: [
          { id: 'mapa-estelar', label: 'Mapa Estelar' },
          { id: 'saltos', label: 'Calculadora' },
        ],
      },
      { id: 'cronicas', label: 'Crónicas', icon: '📜', path: '/cronicas', palette: 'amber' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

export function getPaletteForPath(pathname: string): Palette {
  const item = ALL_NAV_ITEMS.find(i => i.path === pathname);
  return item?.palette ?? 'amber';
}

export function getNavItemByPath(pathname: string) {
  return ALL_NAV_ITEMS.find(i => i.path === pathname);
}

export function getSectionIdByPath(pathname: string): string {
  return ALL_NAV_ITEMS.find(i => i.path === pathname)?.id ?? 'comision';
}
