// ══════════════════════════════════════════════════════════════
//  TALLER PAGE — Página standalone (sidebar). 3 subtabs:
//  Reparación (unificada), Mantenimiento (chequeo mensual), Cola.
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { getCampaignDateISO } from '@/pages/FinanzasPage';
import { useAppStore } from '@/lib/store';
import { usePerm } from '@/hooks/usePerm';
import { loadHangar, saveHangarItem } from '@/lib/firebase-service';
import { DEFAULT_MAINTENANCE_STATE } from '@/lib/maintenance-engine';
import { parseSSWBasic } from '@/lib/ssw-basic';
import type { HangarItem } from '@/lib/hangar-types';
import { buildMechSources, type MechSource } from '@/lib/taller-sources';
import { MechSourcePicker } from '@/components/taller/MechSourcePicker';
import { useTallerShared, getMechCapacity } from '@/lib/taller-shared';
import {
  mergeDamage, emptyDamage, calcularTNMantenimiento, resolverMaintenanceCheck,
  roll2D6, tirarDanoAleatorio, aplicarDamagePatches, describirDamagePatch,
  clasePorTonelaje, TIEMPO_MANTENIMIENTO,
  TN_BASE_EXPERIENCIA,
  type ExperienciaEquipo, type MechMaintenanceState,
  type DamagePatch, type ResultadoMaintenanceCheck, type MaintenanceLogEntry,
} from '@/lib/maintenance-engine';
import {
  calcularMinutosDisponibles, MINUTOS_EXTRA_POR_TURNO,
} from '@/lib/repair-priority';
import { ColaTab } from '@/components/taller/ColaTab';
import { ReparacionTab } from '@/components/taller/ReparacionTab';

export function TallerPage() {
  const activeSubTab = useAppStore(s => s.activeSubTab);
  const setActiveSubTab = useAppStore(s => s.setActiveSubTab);
  const campaign = useAppStore(s => s.campaign);
  const setCampaign = useAppStore(s => s.setCampaign);
  const { readable, writable, loading: permLoading } = usePerm('taller');
  type View = 'reparacion' | 'mantenimiento' | 'cola';
  const view: View =
    activeSubTab === 'mantenimiento' ? 'mantenimiento'
    : activeSubTab === 'cola' ? 'cola'
    : 'reparacion';

  useEffect(() => {
    if (!['reparacion', 'mantenimiento', 'cola'].includes(activeSubTab)) {
      setActiveSubTab('reparacion');
    }
  }, [activeSubTab, setActiveSubTab]);

  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  // Bloqueo de lectura
  if (!permLoading && !readable) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="font-headline text-lg text-primary-container uppercase tracking-widest">Acceso restringido</div>
          <div className="font-mono text-[11px] text-secondary/60 mt-2">No tienes permisos para ver el Taller</div>
        </div>
      </div>
    );
  }

  if (view === 'reparacion')    return <ReparacionTab />;
  if (view === 'mantenimiento') return <MantenimientoTab />;
  if (view === 'cola')          return <ColaTab />;

  return <ReparacionTab />;
}

const QUALITY_COLOR: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-primary',
  C: 'text-amber-400',
  D: 'text-primary-container',
  E: 'text-primary',
  F: 'text-primary',
};

function MantenimientoTab() {
  const campaign = useAppStore(s => s.campaign);
  const roster = useAppStore(s => s.roster);
  const consumeMechTime = useTallerShared(s => s.consumeMechTime);
  const asignaciones = useTallerShared(s => s.asignaciones);
  const tiempoGlobal = useTallerShared(s => s.tiempoGlobal);
  const addToCola = useTallerShared(s => s.addToCola);

  // ── Selector mech: solo unidades de campaña (hangar + piloto asignado) ──
  const [hangarItems, setHangarItems] = useState<HangarItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const reloadHangar = () => {
    loadHangar().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.items)) {
        setHangarItems((res.data as any).items as HangarItem[]);
      }
    }).catch(() => {});
  };
  useEffect(() => { reloadHangar(); }, []);

  // Fuentes filtradas: solo hangar con pilotoIdx (mechs de la campaña)
  const sources = useMemo<MechSource[]>(() => {
    const onlyCampaign = hangarItems.filter(it => it.pilotoIdx !== undefined);
    return buildMechSources(onlyCampaign, null, roster);
  }, [hangarItems, roster]);

  const selectedSource = useMemo(
    () => sources.find(s => s.key === selectedKey) ?? null,
    [sources, selectedKey],
  );

  const selectedHangarItem = useMemo(
    () => selectedSource ? hangarItems.find(it => it.id === selectedSource.hangarId) ?? null : null,
    [selectedSource, hangarItems],
  );

  // ── Estado mantenimiento del mech ──
  // qualityRating + techRating viven en HangarItem (persistente Firestore).
  // experienciaEquipo + historial son session-only por ahora (TODO: extender HangarItem).
  const [mant, setMantState] = useState<MechMaintenanceState | null>(null);

  useEffect(() => {
    if (!selectedHangarItem) { setMantState(null); return; }
    setMantState({
      qualityRating:     selectedHangarItem.qualityRating ?? DEFAULT_MAINTENANCE_STATE.qualityRating,
      techRating:        selectedHangarItem.techRating    ?? DEFAULT_MAINTENANCE_STATE.techRating,
      experienciaEquipo: DEFAULT_MAINTENANCE_STATE.experienciaEquipo,
      historial:         selectedHangarItem.maintenanceHistory ?? [],
      extraDamage:       selectedHangarItem.damagePersist,
    });
  }, [selectedHangarItem]);

  // ── Lazy detect hasJumpJets/hasAmmo en items antiguos (pre-feature) ──
  useEffect(() => {
    if (!selectedHangarItem) return;
    if (selectedHangarItem.hasJumpJets !== undefined && selectedHangarItem.hasAmmo !== undefined) return;
    if (!selectedHangarItem.sourceFile) return;
    const base = import.meta.env.BASE_URL;
    const itemId = selectedHangarItem.id;
    fetch(`${base}assets/mechs/${encodeURIComponent(selectedHangarItem.sourceFile)}`)
      .then(r => r.ok ? r.text() : null)
      .then(text => {
        if (!text) return;
        const p = parseSSWBasic(text);
        const updated: HangarItem = {
          ...selectedHangarItem,
          hasJumpJets: p.hasJumpJets,
          hasAmmo:     p.hasAmmo,
        };
        void saveHangarItem(updated);
        setHangarItems(prev => prev.map(it => it.id === itemId ? updated : it));
      })
      .catch(() => {});
  }, [selectedHangarItem]);

  // ── Datos del mech ──
  const mechInfo = useMemo(() => {
    if (!selectedHangarItem) return null;
    return {
      mechName:    `${selectedHangarItem.chassis} ${selectedHangarItem.model}`,
      tons:        selectedHangarItem.tons,
      hayJumpJets: selectedHangarItem.hasJumpJets ?? false,
      hayMunicion: selectedHangarItem.hasAmmo ?? false,
    };
  }, [selectedHangarItem]);

  // ── Inputs flow ──
  const [modCondiciones, setModCondiciones] = useState(0);
  const [rollManual, setRollManual] = useState<number | ''>('');
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoMaintenanceCheck | null>(null);
  const [patchesPendientes, setPatchesPendientes] = useState<DamagePatch[]>([]);
  const [tiradasRestantes, setTiradasRestantes] = useState(0);

  // Reset flow al cambiar mech
  useEffect(() => {
    setLastRoll(null); setResultado(null); setPatchesPendientes([]); setTiradasRestantes(0);
    setRollManual(''); setModCondiciones(0);
  }, [selectedKey]);

  // ── Calcs ──
  const tn = useMemo(() => {
    if (!mant) return 0;
    return calcularTNMantenimiento(mant.experienciaEquipo, mant.techRating, mant.qualityRating, modCondiciones);
  }, [mant, modCondiciones]);

  // Mantenimiento rutinario: 0 ₡ canon (los daños fallidos van a Prioridades).
  const tiempo = mechInfo ? TIEMPO_MANTENIMIENTO[clasePorTonelaje(mechInfo.tons)] : 0;

  // ── Persistir cambios ──
  // qualityRating/techRating/extraDamage/historial → HangarItem (Firestore).
  // experienciaEquipo → session-only.
  const updateMant = async (patch: Partial<MechMaintenanceState>) => {
    if (!mant || !selectedHangarItem) return;
    const next = { ...mant, ...patch };
    setMantState(next);
    // Persistir solo los campos que viven en HangarItem
    const itemPatch: Partial<HangarItem> = {};
    if ('qualityRating' in patch) itemPatch.qualityRating      = patch.qualityRating;
    if ('techRating'    in patch) itemPatch.techRating         = patch.techRating;
    if ('extraDamage'   in patch) itemPatch.damagePersist      = patch.extraDamage;
    if ('historial'     in patch) itemPatch.maintenanceHistory = patch.historial;
    if (Object.keys(itemPatch).length > 0) {
      const updated = { ...selectedHangarItem, ...itemPatch };
      await saveHangarItem(updated);
      // Refresca lista local
      setHangarItems(prev => prev.map(it => it.id === updated.id ? updated : it));
    }
  };

  // ── Acciones flow ──
  const handleTirar = () => {
    const r = roll2D6();
    setLastRoll(r);
    setRollManual(r);
  };

  const handleResolver = () => {
    if (!mant) return;
    const r = typeof rollManual === 'number' ? rollManual : (lastRoll ?? 0);
    if (r < 2 || r > 12) return;
    const res = resolverMaintenanceCheck(r, tn, mant.qualityRating);
    setResultado(res);
    setTiradasRestantes(res.tiradasDano ?? 0);
    setPatchesPendientes([]);
  };

  const handleTirarDano = () => {
    if (!mechInfo) return;
    const newPatches = tirarDanoAleatorio(mechInfo.hayJumpJets, mechInfo.hayMunicion);
    setPatchesPendientes(p => [...p, ...newPatches]);
    setTiradasRestantes(t => Math.max(0, t - 1));
  };

  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  const handleAplicarTodo = async () => {
    if (!mant || !resultado || !selectedHangarItem) return;
    const baseExtra = mant.extraDamage ?? emptyDamage();
    const nuevoExtra = aplicarDamagePatches(baseExtra, patchesPendientes);
    const entry: MaintenanceLogEntry = {
      fecha:          campaignDate,
      tn:             resultado.tn,
      roll:           resultado.roll,
      resultado:      resultado.mos > 0 ? 'MoS' : 'MoF',
      margen:         resultado.mos > 0 ? resultado.mos : resultado.mof,
      cambioQuality:  resultado.cambioQuality,
      danosGenerados: patchesPendientes.map(describirDamagePatch),
      costo:          0,
    };
    await updateMant({
      qualityRating: resultado.cambioQuality ?? mant.qualityRating,
      extraDamage:   nuevoExtra,
      historial:     [entry, ...mant.historial].slice(0, 50),
    });

    // ── Descuenta tiempo del pool del mech ──
    if (selectedSource && tiempo > 0) {
      const mechKey = selectedSource.key;
      const tiempoBaseGlobal = calcularMinutosDisponibles({ ...tiempoGlobal, turnosExtendidos: 0 }).minutosBase;
      const cap = getMechCapacity(asignaciones[mechKey], tiempoBaseGlobal, MINUTOS_EXTRA_POR_TURNO);
      if (!cap.canWork) {
        addToCola({
          mechKey,
          componenteName: `Mantenimiento rutinario ${selectedSource.mechName}`,
          minutosBase: tiempo,
          categoria: 'Mantenimiento',
        });
      } else if (tiempo > cap.minutosRestantes) {
        addToCola({
          mechKey,
          componenteName: `Mantenimiento ${selectedSource.mechName} (excede pool)`,
          minutosBase: tiempo,
          categoria: 'Mantenimiento',
        });
      } else {
        consumeMechTime(mechKey, tiempo);
      }
    }

    // Reset flow
    setLastRoll(null); setResultado(null); setPatchesPendientes([]);
    setTiradasRestantes(0); setRollManual('');
  };

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-6xl mx-auto">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-4">
        Mantenimiento rutinario
      </h1>

      {/* Selector mech: solo unidades de campaña (hangar + piloto) */}
      <section className="mb-4 bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">
          Mech de campaña
        </label>
        <MechSourcePicker
          sources={sources}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
      </section>

      {mant && mechInfo && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Estado + Config */}
          <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer space-y-3">
            <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase">
              Estado del mech
            </h2>
            <div className="flex items-center gap-3">
              <div className={`font-headline text-4xl font-black ${QUALITY_COLOR[mant.qualityRating]}`}>
                {mant.qualityRating}
              </div>
              <div className="font-mono text-[10px] text-secondary/70 space-y-0.5">
                <div>Clase: <span className="text-primary-container">{clasePorTonelaje(mechInfo.tons)}</span></div>
                <div>Tiempo: <span className="text-secondary">{tiempo} min</span> (informativo)</div>
                <div className="text-secondary/50 text-[9px] italic">
                  Sin coste directo · daños se reparan en Prioridades
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant/30 pt-3 space-y-2">
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60">
                Experiencia del equipo
              </label>
              <select
                value={mant.experienciaEquipo}
                onChange={e => updateMant({ experienciaEquipo: e.target.value as ExperienciaEquipo })}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              >
                {(Object.keys(TN_BASE_EXPERIENCIA) as ExperienciaEquipo[]).map(x => (
                  <option key={x} value={x}>{x} (TN base {TN_BASE_EXPERIENCIA[x]})</option>
                ))}
              </select>

              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60">
                Tech Rating del chasis
              </label>
              <select
                value={mant.techRating}
                onChange={e => updateMant({ techRating: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              >
                {['A','B','C','D','E','F'].map(x => <option key={x} value={x}>{x}</option>)}
              </select>

              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60">
                Modificador condiciones
              </label>
              <input
                type="number"
                value={modCondiciones}
                onChange={e => setModCondiciones(parseInt(e.target.value) || 0)}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              />
            </div>

          </section>

          {/* Flujo chequeo */}
          <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer space-y-3">
            <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase">
              Chequeo de mantenimiento
            </h2>

            <div className="border border-outline-variant/40 bg-surface-container p-2 font-mono text-[11px]">
              TN actual: <span className="text-primary-container font-bold text-base">{tn}</span>
              <span className="text-secondary/50 text-[9px] ml-2">
                (exp + tech + quality + cond)
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTirar}
                className="flex-1 py-1.5 border border-primary-container/40 text-primary-container font-mono text-[10px] uppercase tracking-widest hover:bg-primary-container/10"
              >Tirar 2D6</button>
              <input
                type="number" min={2} max={12} placeholder="o manual"
                value={rollManual}
                onChange={e => setRollManual(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-20 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary text-center"
              />
              <button
                onClick={handleResolver}
                disabled={typeof rollManual !== 'number' || rollManual < 2 || rollManual > 12}
                className="flex-1 py-1.5 border border-primary/40 text-primary font-mono text-[10px] uppercase tracking-widest hover:bg-primary/10 disabled:opacity-30"
              >Resolver</button>
            </div>

            {resultado && (
              <div className="border border-outline-variant/40 bg-surface-container p-2 font-mono text-[10px] text-secondary/80 space-y-1">
                <div>
                  Roll <span className="text-primary-container font-bold">{resultado.roll}</span> vs TN {resultado.tn} →{' '}
                  {resultado.mos > 0
                    ? <span className="text-primary font-bold">MoS {resultado.mos}{resultado.mos === 6 ? '+' : ''}</span>
                    : <span className="text-error font-bold">MoF {resultado.mof}{resultado.mof === 7 ? '+' : ''}</span>}
                </div>
                {resultado.cambioQuality && (
                  <div>Cambio Quality: <span className={`font-bold ${QUALITY_COLOR[resultado.cambioQuality]}`}>{mant.qualityRating} → {resultado.cambioQuality}</span></div>
                )}
                {resultado.experienciaExtra && (
                  <div className="text-amber-400">Equipo gana XP (no implementado aún)</div>
                )}
                {(resultado.tiradasDano ?? 0) > 0 && (
                  <div>Tiradas de daño: <span className="text-error font-bold">{resultado.tiradasDano}</span></div>
                )}
              </div>
            )}

            {tiradasRestantes > 0 && (
              <button
                onClick={handleTirarDano}
                className="w-full py-1.5 border border-error/50 text-error font-mono text-[10px] uppercase tracking-widest hover:bg-error/10"
              >
                Tirar daño ({tiradasRestantes} restantes)
              </button>
            )}

            {patchesPendientes.length > 0 && (
              <div className="border border-error/30 bg-error/5 p-2 font-mono text-[9px] text-secondary/80 space-y-0.5">
                <div className="text-error uppercase tracking-widest text-[8px] mb-1">Daños generados</div>
                {patchesPendientes.map((p, i) => (
                  <div key={i}>• {describirDamagePatch(p)}</div>
                ))}
              </div>
            )}

            {resultado && tiradasRestantes === 0 && (
              <button
                onClick={handleAplicarTodo}
                className="w-full py-2 border border-primary-container bg-primary-container/15 text-primary-container font-mono text-[10px] uppercase tracking-widest hover:bg-primary-container/25"
              >Aplicar todo (persistir)</button>
            )}
          </section>

          {/* Historial */}
          {mant.historial.length > 0 && (
            <section className="md:col-span-2 bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
              <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-2">
                Historial ({mant.historial.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[10px]">
                  <thead className="text-secondary/60 uppercase text-[8px] tracking-widest">
                    <tr className="border-b border-outline-variant/30">
                      <th className="text-left py-1 pr-2">Fecha</th>
                      <th className="text-right pr-2">Roll/TN</th>
                      <th className="text-left pr-2">Resultado</th>
                      <th className="text-left pr-2">Quality</th>
                      <th className="text-left pr-2">Daños</th>
                      <th className="text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mant.historial.map((h, i) => (
                      <tr key={i} className="border-b border-outline-variant/20">
                        <td className="py-1 pr-2 text-secondary/70">{h.fecha}</td>
                        <td className="text-right pr-2 text-secondary">{h.roll}/{h.tn}</td>
                        <td className={`pr-2 font-bold ${h.resultado === 'MoS' ? 'text-primary' : 'text-error'}`}>
                          {h.resultado} {h.margen}
                        </td>
                        <td className="pr-2">{h.cambioQuality ? <span className={QUALITY_COLOR[h.cambioQuality]}>→ {h.cambioQuality}</span> : '—'}</td>
                        <td className="pr-2 text-secondary/70 text-[9px]">
                          {(h.danosGenerados ?? []).length > 0 ? (h.danosGenerados ?? []).join(' · ') : '—'}
                        </td>
                        <td className="text-right text-primary-container">{h.costo.toLocaleString('es-ES')} ₡</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
