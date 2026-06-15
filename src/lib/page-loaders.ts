// ═══════════════════════════════════════════════════════════════
// page-loaders.ts — Single source para lazy imports de pages.
// App.tsx envuelve con React.lazy. Sidebar usa preloadByPath
// para precargar chunk en hover.
// ═══════════════════════════════════════════════════════════════

export const pageLoaders = {
  '/portada':              () => import('@/pages/PortadaPage'),
  '/comision':             () => import('@/pages/ComisionPage'),
  '/reclutamiento':        () => import('@/pages/ReclutamientoPage'),
  '/barracones':           () => import('@/pages/BarraconesPage'),
  '/barracones-legacy':    () => import('@/pages/BarraconesPageLegacy'),
  '/hoja-servicio':        () => import('@/pages/HojaServicioPage'),
  '/hoja-servicio-legacy': () => import('@/pages/HojaServicioPageLegacy'),
  '/simulador':            () => import('@/pages/SimuladorPage'),
  '/finanzas':             () => import('@/pages/FinanzasPage'),
  '/taller':               () => import('@/pages/TallerPage'),
  '/hud':                  () => import('@/pages/HudTacticoPage'),
  '/ayudas':               () => import('@/pages/AyudasPage'),
  '/tro':                  () => import('@/pages/TROPage'),
  '/mapa':                 () => import('@/pages/MapaEstelarPage'),
  '/cronicas':             () => import('@/pages/CronicasPage'),
  '/logros':               () => import('@/pages/LogrosPage'),
} as const;

export type PagePath = keyof typeof pageLoaders;

/** Precarga chunk de la ruta sin renderizar. No-op si ya cargada. */
export function preloadByPath(path: string): void {
  const loader = (pageLoaders as Record<string, () => Promise<unknown>>)[path];
  if (loader) loader().catch(() => {/* silent */});
}
