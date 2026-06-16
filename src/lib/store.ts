import { create } from 'zustand';
import type { CampaignConfig, Palette } from './types';
import { saveConfigBatch } from './firebase-service';
import type { RosterEntry } from './roster';
import type { SectionPerm } from './permissions-service';
import { DEFAULT_PERMISSIONS } from './permissions-service';

export type UserRole = 'admin' | 'dm' | 'pj' | null;

interface AppState {
  campaign: CampaignConfig;
  setCampaign: (patch: Partial<CampaignConfig>) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;

  activePalette: Palette;
  setActivePalette: (p: Palette) => void;

  activeSubTab: string;
  setActiveSubTab: (t: string) => void;

  simuladorPortada: boolean;
  setSimuladorPortada: (v: boolean) => void;

  barraconesPortada: boolean;
  setBarraconesPortada: (v: boolean) => void;

  useLegacyDesigns: boolean;
  setUseLegacyDesigns: (v: boolean) => void;

  roster: RosterEntry[];
  rosterLoading: boolean;
  setRoster: (r: RosterEntry[]) => void;
  setRosterLoading: (v: boolean) => void;

  /** Acción pendiente para portada Finanzas → Libro Mayor (abre modal al entrar). */
  finanzasPendingModal: 'taller' | 'compras' | 'projector' | null;
  setFinanzasPendingModal: (v: 'taller' | 'compras' | 'projector' | null) => void;

  /** Slot de simulador a auto-cargar cuando se abre TallerModal desde botón llave. */
  tallerAutoLoadSlot: number | null;
  setTallerAutoLoadSlot: (v: number | null) => void;

  /** Rol del usuario autenticado, leído del Custom Claim de Firebase Auth. */
  userRole: UserRole;
  setUserRole: (r: UserRole) => void;

  /** Matriz de permisos cargada desde Firestore (reactiva via onSnapshot). */
  perms: SectionPerm[];
  setPerms: (p: SectionPerm[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  campaign: {
    playerName: '',
    campaignYear: 3026,
    campaignMonth: 1,
    unitName: "King Karl's Kürassiers",
    pilotNames:  [],
    pilotApodos: [],
    pilotMechs:  [],
    contratoValor: '',
    valorUnidad:   '',
    totalMechs:    '',
    pcJugadores:   [],
  },
  setCampaign: (patch) => set((s) => ({ campaign: { ...s.campaign, ...patch } })),

  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  activePalette: 'amber',
  setActivePalette: (p) => set({ activePalette: p }),

  activeSubTab: 'mechs',
  setActiveSubTab: (t) => set({ activeSubTab: t }),

  simuladorPortada: true,
  setSimuladorPortada: (v) => set({ simuladorPortada: v }),

  barraconesPortada: true,
  setBarraconesPortada: (v) => set({ barraconesPortada: v }),

  // Cache local rápido para evitar flash al recargar; valor real llega de Sheets en App.tsx
  useLegacyDesigns: localStorage.getItem('useLegacyDesigns') === '1',
  setUseLegacyDesigns: (v) => {
    localStorage.setItem('useLegacyDesigns', v ? '1' : '0');
    set({ useLegacyDesigns: v });
    // Persistencia global compartida via celda USE_LEGACY_DESIGNS en Configuracion
    saveConfigBatch({ USE_LEGACY_DESIGNS: v ? '1' : '0' }).catch(() => {});
  },

  roster: [],
  rosterLoading: true,
  setRoster: (r) => set({ roster: r, rosterLoading: false }),
  setRosterLoading: (v) => set({ rosterLoading: v }),

  finanzasPendingModal: null,
  setFinanzasPendingModal: (v) => set({ finanzasPendingModal: v }),

  tallerAutoLoadSlot: null,
  setTallerAutoLoadSlot: (v) => set({ tallerAutoLoadSlot: v }),

  userRole: null,
  setUserRole: (r) => set({ userRole: r }),

  perms: DEFAULT_PERMISSIONS,
  setPerms: (p) => set({ perms: p }),
}));

