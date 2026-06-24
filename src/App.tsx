import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { Sidebar } from '@/components/shell/Sidebar';
import { Header } from '@/components/shell/Header';
import { SectionTabs } from '@/components/shell/SectionTabs';
import { RouteErrorBoundary } from '@/components/shell/RouteErrorBoundary';
import { useAppStore } from '@/lib/store';
import { getPaletteForPath, getNavItemByPath } from '@/lib/navigation';
import { loadConfig, saveConfigBatch } from '@/lib/firebase-service';
import { loadRoster } from '@/lib/roster';
import { usePermissions } from '@/lib/permissions-service';
import { useTallerSharedSync } from '@/hooks/useTallerSharedSync';
import { migrateAlmacenKeys } from '@/lib/almacen-keys';
import { AuthGate } from '@/components/shell/AuthGate';

import { pageLoaders } from '@/lib/page-loaders';

const ComisionPage          = lazy(() => pageLoaders['/comision']().then(m => ({ default: m.ComisionPage })));
const ReclutamientoPage     = lazy(() => pageLoaders['/reclutamiento']().then(m => ({ default: m.ReclutamientoPage })));
const BarraconesPage        = lazy(() => pageLoaders['/barracones']().then(m => ({ default: m.BarraconesPage })));
const BarraconesPageLegacy  = lazy(() => pageLoaders['/barracones-legacy']().then(m => ({ default: m.BarraconesPageLegacy })));
const HojaServicioPage      = lazy(() => pageLoaders['/hoja-servicio']().then(m => ({ default: m.HojaServicioPage })));
const HojaServicioPageLegacy= lazy(() => pageLoaders['/hoja-servicio-legacy']().then(m => ({ default: m.HojaServicioPageLegacy })));
const SimuladorPage         = lazy(() => pageLoaders['/simulador']().then(m => ({ default: m.SimuladorPage })));
const FinanzasPage          = lazy(() => pageLoaders['/finanzas']().then(m => ({ default: m.FinanzasPage })));
const HangarPage            = lazy(() => pageLoaders['/hangar']().then(m => ({ default: m.HangarPage })));
const TallerPage            = lazy(() => pageLoaders['/taller']().then(m => ({ default: m.TallerPage })));
const TallerLegacyPage      = lazy(() => pageLoaders['/taller-legacy']().then(m => ({ default: m.TallerLegacyPage })));
const HudTacticoPage        = lazy(() => pageLoaders['/hud']().then(m => ({ default: m.HudTacticoPage })));
const AyudasPage            = lazy(() => pageLoaders['/ayudas']().then(m => ({ default: m.AyudasPage })));
const TROPage               = lazy(() => pageLoaders['/tro']().then(m => ({ default: m.TROPage })));
const WikiPage              = lazy(() => pageLoaders['/wiki']().then(m => ({ default: m.WikiPage })));
const MapaEstelarPage       = lazy(() => pageLoaders['/mapa']().then(m => ({ default: m.MapaEstelarPage })));
const CronicasPage          = lazy(() => pageLoaders['/cronicas']().then(m => ({ default: m.CronicasPage })));
const LogrosPage            = lazy(() => pageLoaders['/logros']().then(m => ({ default: m.LogrosPage })));
const MandoPage             = lazy(() => pageLoaders['/mando']().then(m => ({ default: m.MandoPage })));
const RecursosHumanosPage   = lazy(() => pageLoaders['/rrhh']().then(m => ({ default: m.RecursosHumanosPage })));
const SuministrosPage       = lazy(() => pageLoaders['/suministros']().then(m => ({ default: m.SuministrosPage })));
const PortadaPage           = lazy(() => pageLoaders['/portada']().then(m => ({ default: m.PortadaPage })));
const CommandCenterPage     = lazy(() => import('@/pages/CommandCenterPage').then(m => ({ default: m.CommandCenterPage })));

function RouteSpinner() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader size={28} className="animate-spin text-primary-container" />
    </div>
  );
}

export function App() {
  const location = useLocation();
  const setActivePalette = useAppStore(s => s.setActivePalette);
  const setCampaign = useAppStore(s => s.setCampaign);
  const useLegacyDesigns = useAppStore(s => s.useLegacyDesigns);
  const setRoster = useAppStore(s => s.setRoster);
  const setRosterLoading = useAppStore(s => s.setRosterLoading);
  const userRole = useAppStore(s => s.userRole);
  const setPerms = useAppStore(s => s.setPerms);
  const setPermsLoading = useAppStore(s => s.setPermsLoading);

  // Sync taller-shared state ↔ Firestore (hidrata al inicio + auto-save debounced)
  useTallerSharedSync(true);

  // Permisos reactivos desde Firestore (onSnapshot)
  const { perms, loading: permsLoading } = usePermissions();
  useEffect(() => { setPerms(perms); }, [perms, setPerms]);
  useEffect(() => { setPermsLoading(permsLoading); }, [permsLoading, setPermsLoading]);

  // Cargar config de campaña desde Firestore al iniciar.
  useEffect(() => {
    loadConfig().then(res => {
      if (!res.success) return;
      const d: Record<string, any> = (res.data?.config ?? res.data ?? {}) as Record<string, any>;
      if (!d) return;
      const patch: Record<string, any> = {};
      const year  = parseInt(d['AÑO_CAMPANA'] ?? d['campaignYear']);
      const month = parseInt(d['MES_CAMPANA']  ?? d['campaignMonth']);
      if (year  && year > 0)  patch.campaignYear  = year;
      if (month && month > 0) patch.campaignMonth = month;
      if (d['COMPANIA_NOMBRE']) patch.unitName = d['COMPANIA_NOMBRE'];
      const pilotMechs = [1, 2, 3, 4, 5, 6].map(i => d[`PILOTO_${i}_MECH`] || '');
      if (pilotMechs.some(m => m)) patch.pilotMechs = pilotMechs;
      const pilotNames = [1, 2, 3, 4, 5, 6].map(i => d[`PILOTO_${i}_NOMBRE`] || '');
      if (pilotNames.some(n => n)) patch.pilotNames = pilotNames;
      const pilotApodos = [1, 2, 3, 4, 5, 6].map(i => d[`PILOTO_${i}_APODO`] || '');
      if (pilotApodos.some(a => a)) patch.pilotApodos = pilotApodos;
      if (d['CONTRATO_VALOR']) patch.contratoValor = d['CONTRATO_VALOR'];
      if (d['VALOR_UNIDAD'])   patch.valorUnidad   = d['VALOR_UNIDAD'];
      if (d['TOTAL_MECHS'])    patch.totalMechs    = d['TOTAL_MECHS'];
      if (d['PC_JUGADORES']) {
        patch.pcJugadores = String(d['PC_JUGADORES'])
          .split(',').map(s => s.trim()).filter(Boolean);
      }
      if (d['ESTADOMECHS']) {
        try {
          const map = JSON.parse(String(d['ESTADOMECHS']));
          if (map && typeof map === 'object') patch.estadoMechs = map;
        } catch {/* ignore */}
      }
      if (d['ALMACEN_JSON']) {
        try {
          const raw = JSON.parse(String(d['ALMACEN_JSON']));
          if (raw && typeof raw === 'object') {
            // Migra claves legacy ("Ammo (LRM)") → granulares ("Ammo_LRM_Standard")
            const migrated = migrateAlmacenKeys(raw);
            patch.almacen = migrated;
            // Persiste la migración solo si cambió algo
            const keysChanged = Object.keys(raw).some(k => !(k in migrated)) ||
                                Object.keys(migrated).some(k => !(k in raw));
            if (keysChanged) {
              saveConfigBatch({ ALMACEN_JSON: JSON.stringify(migrated) }).catch(() => {});
              console.info('[App] Almacén migrado a claves granulares', migrated);
            }
          }
        } catch {/* ignore */}
      }
      if (d['ALMACEN_LIMITE_TON'] !== undefined) {
        patch.almacenLímiteTon = parseInt(d['ALMACEN_LIMITE_TON']) || 0;
      }
      if (Object.keys(patch).length) setCampaign(patch);

      if (d['USE_LEGACY_DESIGNS'] !== undefined) {
        const useLegacy = String(d['USE_LEGACY_DESIGNS']) === '1';
        useAppStore.setState({ useLegacyDesigns: useLegacy });
        localStorage.setItem('useLegacyDesigns', useLegacy ? '1' : '0');
      }
    }).catch(() => {});
  }, [setCampaign]);

  // Cargar Roster al arrancar
  useEffect(() => {
    setRosterLoading(true);
    loadRoster()
      .then(setRoster)
      .catch(() => setRosterLoading(false));
  }, [setRoster, setRosterLoading]);

  // Sync palette to current route
  useEffect(() => {
    setActivePalette(getPaletteForPath(location.pathname));
  }, [location.pathname, setActivePalette]);

  const currentNav = getNavItemByPath(location.pathname);
  const hasTabs = currentNav?.tabs && currentNav.tabs.length > 0;

  return (
    <div
      className="h-screen overflow-hidden flex flex-col bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary"
      data-palette={getPaletteForPath(location.pathname)}
    >
      <div className="scanline-overlay" />
      <Sidebar />
      <Header />
      {hasTabs && <SectionTabs tabs={currentNav!.tabs!} />}

      <main
        style={hasTabs
          ? { marginTop: 'calc(48px + var(--tabs-h, 40px))', height: 'calc(100vh - 48px - var(--tabs-h, 40px))' }
          : undefined
        }
        className={`
          2xl:ml-[220px] overflow-y-auto custom-scrollbar
          ${hasTabs ? '' : 'mt-12 h-[calc(100vh-48px)]'}
        `}
      >
        <RouteErrorBoundary key={location.pathname}>
        <Suspense fallback={<RouteSpinner />}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/"               element={<Navigate to={window.__TAURI_INTERNALS__ ? "/mando-pc" : "/portada"} replace />} />
            <Route path="/portada"        element={<PortadaPage />} />
            <Route path="/mando-pc"       element={<CommandCenterPage />} />
            <Route path="/tro"            element={<TROPage />} />
            <Route path="/wiki"           element={<WikiPage />} />
            <Route path="/mapa"           element={<MapaEstelarPage />} />
            <Route path="/cronicas"       element={<CronicasPage />} />
            <Route path="/simulador"      element={<SimuladorPage />} />

            {/* Rutas Privadas (Requieren Auth y Roles) */}
            <Route element={<AuthGate />}>
              <Route path="/comision"       element={<ComisionPage />} />
              <Route path="/reclutamiento"  element={<ReclutamientoPage />} />
              <Route path="/barracones"     element={useLegacyDesigns ? <BarraconesPageLegacy /> : <BarraconesPage />} />
              <Route path="/barracones-legacy" element={<BarraconesPageLegacy />} />
              <Route path="/hoja-servicio"  element={useLegacyDesigns ? <HojaServicioPageLegacy /> : <HojaServicioPage />} />
              <Route path="/hoja-servicio-legacy" element={<HojaServicioPageLegacy />} />
              <Route path="/finanzas"       element={<FinanzasPage />} />
              <Route path="/hangar"         element={<HangarPage />} />
              <Route path="/taller"         element={<TallerPage />} />
              <Route path="/taller-legacy"  element={<TallerLegacyPage />} />
              <Route path="/hud"            element={<HudTacticoPage />} />
              <Route path="/ayudas"         element={<AyudasPage />} />
              <Route path="/logros"         element={<LogrosPage />} />
              <Route path="/mando"          element={<MandoPage />} />
              <Route path="/rrhh"           element={<RecursosHumanosPage />} />
              <Route path="/suministros"    element={<SuministrosPage />} />
            </Route>
          </Routes>
        </Suspense>
        </RouteErrorBoundary>
      </main>

      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-secondary)_0%,_transparent_70%)]" />
      </div>
    </div>
  );
}
