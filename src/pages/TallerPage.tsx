// ══════════════════════════════════════════════════════════════
//  TALLER PAGE — Pagina standalone (sidebar). Hospeda TallerModal
//  como contenido principal (tab Factura) y sistema priorizacion
//  de reparaciones por tiempo (tab Prioridades).
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { TallerModal, genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { commitLibroEntryAndTreasury, loadPersonal, type PersonalEntry, type PersonalNivel } from '@/lib/firebase-service';
import { useAppStore } from '@/lib/store';
import { usePerm } from '@/hooks/usePerm';
import { loadLocalSnapshot, loadMechMaintenance, saveMechMaintenance } from '@/lib/simulador-persistence';
import { loadHangar } from '@/lib/firebase-service';
import type { HangarItem } from '@/lib/hangar-types';
import { buildMechSources, type MechSource } from '@/lib/taller-sources';
import { MechSourcePicker } from '@/components/taller/MechSourcePicker';
import {
  deriveDamageFromSession, configFromCatalog,
  type MechRepairConfig, type RepairSystem,
} from '@/lib/repair-engine';
import {
  mergeDamage, emptyDamage, calcularTNMantenimiento, resolverMaintenanceCheck,
  roll2D6, tirarDanoAleatorio, aplicarDamagePatches, describirDamagePatch,
  calcularCosteMantenimiento, clasePorTonelaje, TIEMPO_MANTENIMIENTO,
  TN_BASE_EXPERIENCIA,
  type QualityRating, type ExperienciaEquipo, type MechMaintenanceState,
  type DamagePatch, type ResultadoMaintenanceCheck, type MaintenanceLogEntry,
} from '@/lib/maintenance-engine';
import {
  PRESETS, calcularMinutosDisponibles, aplicarPreset, calcularReparaciones,
  mapearDamageARepairItemsConCoste, MINUTOS_POR_PUNTO_BLINDAJE, costoFinal,
  agregarPersonal, bayMultiplier, aplicarMultiplierBay, listarBays,
  type Preset, type OrdenSecundario, type RepairItem, type ResultadoItem,
  type UnidadTiempo,
} from '@/lib/repair-priority';

export function TallerPage() {
  const { activeSubTab, setActiveSubTab, campaign } = useAppStore();
  const { readable, writable, loading: permLoading } = usePerm('taller');
  type View = 'factura' | 'prioridades' | 'mantenimiento';
  const view: View =
    activeSubTab === 'factura'       ? 'factura'
    : activeSubTab === 'mantenimiento' ? 'mantenimiento'
    : 'prioridades';

  useEffect(() => {
    if (activeSubTab !== 'factura' && activeSubTab !== 'prioridades' && activeSubTab !== 'mantenimiento') {
      setActiveSubTab('prioridades');
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

  if (view === 'prioridades')   return <PrioridadesTab />;
  if (view === 'mantenimiento') return <MantenimientoTab />;

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease]">
      <TallerInlineWrapper campaignDate={campaignDate} />
    </div>
  );
}

function TallerInlineWrapper({ campaignDate }: { campaignDate: string }) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <TallerModal
      key={resetKey}
      inline
      campaignDate={campaignDate}
      onClose={() => setResetKey(k => k + 1)}
      onCommit={async (total, concepto, mechName) => {
        await commitLibroEntryAndTreasury({
          id: genId('lm'),
          fecha: campaignDate,
          concepto,
          cantidad: Math.round(total),
          tipo: 'gasto',
          categoria: 'repuestos',
          nota: `Reparación ${mechName} · Taller`,
          jugador: '',
        });
        setResetKey(k => k + 1);
      }}
    />
  );
}

// ══════════════════════════════════════════════════════════
//  TAB PRIORIDADES
// ══════════════════════════════════════════════════════════

function PrioridadesTab() {
  const { campaign, roster } = useAppStore();

  // ── Selector unificado mech: hangar (campaña) + sim slots ──
  const [hangarItems, setHangarItems] = useState<HangarItem[]>([]);
  const [snapVersion, setSnapVersion] = useState(0); // fuerza rebuild sources si sim cambia
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    loadHangar().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.items)) {
        setHangarItems((res.data as any).items as HangarItem[]);
      }
    }).catch(() => {});
  }, []);

  const sources = useMemo<MechSource[]>(() => {
    const snap = loadLocalSnapshot();
    return buildMechSources(hangarItems, snap, roster);
    // snapVersion para refrescar tras cambios externos
  }, [hangarItems, snapVersion, roster]);

  const selectedSource = useMemo(
    () => sources.find(s => s.key === selectedKey) ?? null,
    [sources, selectedKey],
  );

  // ── Tiempo disponible ──
  const [valor, setValor] = useState(3);
  const [unidad, setUnidad] = useState<UnidadTiempo>('dias');
  const [turnosExt, setTurnosExt] = useState(0);

  const tiempoCalc = useMemo(
    () => calcularMinutosDisponibles({ valor, unidad, turnosExtendidos: turnosExt }),
    [valor, unidad, turnosExt],
  );

  // ── Preset + orden ──
  const [presetId, setPresetId] = useState<string>('persecucion');
  const [ordenSec, setOrdenSec] = useState<OrdenSecundario>('asc');
  const preset: Preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[0];

  // ── Personal (techs + astechs) ──
  const [personal, setPersonal] = useState<PersonalEntry[]>([]);
  useEffect(() => {
    loadPersonal().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.entries)) {
        setPersonal((res.data as any).entries as PersonalEntry[]);
      }
    }).catch(() => {});
  }, []);

  const personalAgg = useMemo(() => agregarPersonal(personal), [personal]);
  const baysDisponibles = useMemo(() => listarBays(personal), [personal]);

  // Bay del mech actual: Techs asignados por nivel (varios a la vez) + AsTechs.
  const [bayTechsAssigned, setBayTechsAssigned] = useState<Record<PersonalNivel, number>>({
    green: 0, regular: 0, veteran: 0, elite: 0,
  });
  const [bayAstechs, setBayAstechs] = useState(6);

  useEffect(() => {
    // Por defecto: 1 tech del mejor skill disponible.
    const next: Record<PersonalNivel, number> = { green: 0, regular: 0, veteran: 0, elite: 0 };
    if (baysDisponibles.length > 0) {
      next[baysDisponibles[0].skill] = 1;
    }
    setBayTechsAssigned(next);
    setBayAstechs(Math.min(6, personalAgg.totalAstechs));
  }, [baysDisponibles, personalAgg.totalAstechs]);

  // Skill efectivo del bay = el MEJOR nivel con al menos 1 tech asignado (elite > veteran > regular > green).
  const bayTechSkill = useMemo<PersonalNivel>(() => {
    for (const skill of ['elite', 'veteran', 'regular', 'green'] as PersonalNivel[]) {
      if ((bayTechsAssigned[skill] ?? 0) > 0) return skill;
    }
    return 'regular';
  }, [bayTechsAssigned]);

  const bayTechsTotal = useMemo(
    () => (Object.values(bayTechsAssigned) as number[]).reduce((a, b) => a + b, 0),
    [bayTechsAssigned]
  );

  const bayMult = useMemo(
    () => bayMultiplier(bayTechSkill, bayAstechs, bayTechsTotal),
    [bayTechSkill, bayAstechs, bayTechsTotal],
  );

  // ── Sistema de coste + factor estado factura ──
  const [system, setSystem] = useState<RepairSystem>('canon');
  const [estadoFactPct, setEstadoFactPct] = useState(100);

  // ── Mech seleccionado: nombre + config + damage (compartido) ──
  const mechCtx = useMemo(() => {
    if (!selectedSource) return null;
    return {
      mechName: selectedSource.mechName,
      tons:     selectedSource.tons,
      config:   selectedSource.config,
      damage:   selectedSource.damage,
    };
  }, [selectedSource]);

  // ── Construir items desde mech seleccionado (con coste) ──
  const baseItems = useMemo<RepairItem[]>(() => {
    if (!mechCtx) return [];
    return mapearDamageARepairItemsConCoste(mechCtx.damage, mechCtx.config, system, mechCtx.tons);
  }, [mechCtx, system]);

  // Aplica multiplier de bay a los tiempos base.
  const itemsAjustados = useMemo(
    () => aplicarMultiplierBay(baseItems, bayMult),
    [baseItems, bayMult],
  );

  const orderedItems = useMemo(
    () => aplicarPreset(itemsAjustados, preset, ordenSec),
    [itemsAjustados, preset, ordenSec],
  );

  // Orden manual via drag/flechas. Cuando set -> presetId pasa a 'manual'.
  const [manualOrder, setManualOrder] = useState<string[]>([]);

  // Reset manual order al cambiar mech.
  useEffect(() => { setManualOrder([]); }, [selectedKey]);

  // Si user cambia preset a otro distinto de manual, limpiar orden manual.
  const setPresetIdSafe = (id: string) => {
    if (id !== 'manual') setManualOrder([]);
    setPresetId(id);
  };

  // displayItems: si presetId='manual' y manualOrder definido, ordenar por manualOrder.
  const displayItems = useMemo<RepairItem[]>(() => {
    if (presetId !== 'manual' || manualOrder.length === 0) return orderedItems;
    const byId = new Map(orderedItems.map(it => [it.id, it]));
    const out: RepairItem[] = [];
    for (const id of manualOrder) {
      const it = byId.get(id);
      if (it) { out.push(it); byId.delete(id); }
    }
    for (const it of byId.values()) out.push(it);
    return out;
  }, [orderedItems, manualOrder, presetId]);

  // Reordenar manualmente: switch a preset manual, set nuevo orden.
  const reorderManual = (newOrder: string[]) => {
    setPresetId('manual');
    setManualOrder(newOrder);
  };

  const resultado = useMemo(
    () => calcularReparaciones(
      displayItems, tiempoCalc.minutosDisponibles, tiempoCalc.minutosBase,
      mechCtx?.config,
    ),
    [displayItems, tiempoCalc.minutosDisponibles, tiempoCalc.minutosBase, mechCtx?.config],
  );

  // ── Commit gasto a tesorería ──
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );
  const totalAplicado = costoFinal(resultado.costoReparadoBruto, estadoFactPct);
  const [commitState, setCommitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const registrarGasto = async () => {
    if (!mechCtx || totalAplicado <= 0) return;
    setCommitState('sending');
    try {
      await commitLibroEntryAndTreasury({
        id:        genId('lm'),
        fecha:     campaignDate,
        concepto:  `Reparación parcial · ${mechCtx.mechName}`,
        cantidad:  totalAplicado,
        tipo:      'gasto',
        categoria: 'repuestos',
        nota:      `Taller priorizado · ${preset.nombre} · est ${estadoFactPct}%`,
        jugador:   '',
      });
      setCommitState('done');
      setTimeout(() => setCommitState('idle'), 2500);
    } catch {
      setCommitState('error');
      setTimeout(() => setCommitState('idle'), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-6xl mx-auto">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-4">
        Prioridades de reparación
      </h1>

      {/* Selector unificado: hangar (campaña) + sim slots */}
      <section className="mb-4 bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">
          Mech a reparar
        </label>
        <MechSourcePicker
          sources={sources}
          selectedKey={selectedKey}
          onSelect={key => { setSelectedKey(key); setSnapVersion(v => v + 1); }}
        />
      </section>

      <div className="grid md:grid-cols-4 gap-4">
        {/* Time Input */}
        <TimeInputPanel
          valor={valor} setValor={setValor}
          unidad={unidad} setUnidad={setUnidad}
          turnosExt={turnosExt} setTurnosExt={setTurnosExt}
          turnosMax={tiempoCalc.turnosMax}
          minutosBase={tiempoCalc.minutosBase}
          minutosExtra={tiempoCalc.minutosExtra}
          minutosDisponibles={tiempoCalc.minutosDisponibles}
        />

        {/* Bay (equipo reparacion) */}
        <BayPanel
          totalTechs={personalAgg.totalTechs}
          totalAstechs={personalAgg.totalAstechs}
          techsBySkill={personalAgg.techsBySkill}
          bayTechsAssigned={bayTechsAssigned} setBayTechsAssigned={setBayTechsAssigned}
          bayTechsTotal={bayTechsTotal}
          bayTechSkill={bayTechSkill}
          bayAstechs={bayAstechs} setBayAstechs={setBayAstechs}
          bayMult={bayMult}
        />

        {/* Preset Selector */}
        <PresetSelector
          presetId={presetId} setPresetId={setPresetIdSafe}
          ordenSec={ordenSec} setOrdenSec={setOrdenSec}
        />

        {/* Budget Bar */}
        <BudgetBar
          minutosBase={tiempoCalc.minutosBase}
          minutosExtra={tiempoCalc.minutosExtra}
          minutosUsadosTotal={resultado.minutosUsadosTotal}
        />
      </div>

      {/* Lista items + resultados */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <RepairItemList
          items={displayItems}
          resultados={resultado.resultados}
          onReorder={reorderManual}
        />
        <ResultsSummary
          resultado={resultado}
          system={system} setSystem={setSystem}
          estadoFactPct={estadoFactPct} setEstadoFactPct={setEstadoFactPct}
          totalAplicado={totalAplicado}
          mechName={mechCtx?.mechName ?? null}
          commitState={commitState}
          onRegistrarGasto={registrarGasto}
        />
      </div>
    </div>
  );
}

// ── TimeInputPanel ──

function TimeInputPanel(p: {
  valor: number; setValor: (v: number) => void;
  unidad: UnidadTiempo; setUnidad: (u: UnidadTiempo) => void;
  turnosExt: number; setTurnosExt: (n: number) => void;
  turnosMax: number;
  minutosBase: number; minutosExtra: number; minutosDisponibles: number;
}) {
  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Tiempo disponible
      </h2>
      <div className="flex gap-2 mb-2">
        <input
          type="number" min={0} value={p.valor || ''}
          onFocus={e => e.target.select()}
          onChange={e => p.setValor(parseInt(e.target.value) || 0)}
          className="flex-1 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-sm text-secondary"
        />
        <select
          value={p.unidad} onChange={e => p.setUnidad(e.target.value as UnidadTiempo)}
          className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
        >
          <option value="horas">horas</option>
          <option value="dias">días</option>
          <option value="semanas">semanas</option>
          <option value="meses">meses</option>
        </select>
      </div>
      <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
        Turnos extendidos (16h) — máx {p.turnosMax}
      </label>
      <input
        type="number" min={0} max={p.turnosMax}
        value={p.turnosExt || ''}
        onFocus={e => e.target.select()}
        onChange={e => p.setTurnosExt(Math.min(p.turnosMax, parseInt(e.target.value) || 0))}
        className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-sm text-secondary mb-2"
      />
      <div className="font-mono text-[10px] text-secondary/70 space-y-1">
        <div>Base: <span className="text-primary">{p.minutosBase}</span> min</div>
        <div>Extra: <span className="text-error">{p.minutosExtra}</span> min</div>
        <div className="pt-1 border-t border-outline-variant/30">
          Total: <span className="text-primary-container font-bold">{p.minutosDisponibles}</span> min
          <span className="text-secondary/50 ml-2">({Math.round(p.minutosDisponibles / 60)}h)</span>
        </div>
      </div>
    </section>
  );
}

// ── PresetSelector ──

function PresetSelector(p: {
  presetId: string; setPresetId: (id: string) => void;
  ordenSec: OrdenSecundario; setOrdenSec: (o: OrdenSecundario) => void;
}) {
  const isManual = p.presetId === 'manual';
  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Preset
      </h2>
      <div className="space-y-2 mb-3">
        {PRESETS.map(pr => (
          <button
            key={pr.id}
            onClick={() => p.setPresetId(pr.id)}
            className={`w-full text-left px-2 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
              p.presetId === pr.id
                ? 'border-primary-container bg-primary-container/15 text-primary-container'
                : 'border-outline-variant/40 text-secondary/70 hover:border-primary-container/60'
            }`}
          >{pr.nombre}</button>
        ))}
      </div>
      <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
        Orden secundario
      </label>
      <div className="grid grid-cols-3 gap-1">
        {(['asc', 'desc', 'manual'] as OrdenSecundario[]).map(o => (
          <button
            key={o}
            disabled={isManual}
            onClick={() => p.setOrdenSec(o)}
            className={`px-1.5 py-1 border font-mono text-[9px] uppercase transition-colors ${
              p.ordenSec === o
                ? 'border-amber-400 bg-amber-400/15 text-amber-400'
                : 'border-outline-variant/40 text-secondary/60 hover:border-amber-400/40'
            } disabled:opacity-30`}
          >{o === 'asc' ? '↑' : o === 'desc' ? '↓' : '='}</button>
        ))}
      </div>
    </section>
  );
}

// ── BudgetBar ──

// ── BayPanel ──

function BayPanel(p: {
  totalTechs: number;
  totalAstechs: number;
  techsBySkill: Record<PersonalNivel, number>;
  bayTechsAssigned: Record<PersonalNivel, number>;
  setBayTechsAssigned: (v: Record<PersonalNivel, number>) => void;
  bayTechsTotal: number;
  bayTechSkill: PersonalNivel;
  bayAstechs: number;
  setBayAstechs: (n: number) => void;
  bayMult: number;
}) {
  const noViable = p.totalTechs === 0;
  const multPct = Math.round((p.bayMult - 1) * 100);

  const setSkillQty = (skill: PersonalNivel, qty: number) => {
    const max = p.techsBySkill[skill] ?? 0;
    const clamped = Math.min(max, Math.max(0, qty));
    p.setBayTechsAssigned({ ...p.bayTechsAssigned, [skill]: clamped });
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Equipo Reparación
      </h2>
      {noViable ? (
        <p className="font-mono text-[10px] text-error italic">
          Sin Mech Techs activos. No se puede reparar.
        </p>
      ) : (
        <>
          <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
            Techs asignados ({p.bayTechsTotal} de {p.totalTechs})
          </label>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {(['green', 'regular', 'veteran', 'elite'] as PersonalNivel[]).map(n => {
              const disp = p.techsBySkill[n] ?? 0;
              return (
                <div key={n} className={disp === 0 ? 'opacity-30' : ''}>
                  <label className="block font-mono text-[8px] uppercase tracking-widest text-secondary/50 mb-0.5">
                    {n} ({disp} disp)
                  </label>
                  <input
                    type="number" min={0} max={disp}
                    value={p.bayTechsAssigned[n] || ''}
                    placeholder="0"
                    disabled={disp === 0}
                    onFocus={e => e.target.select()}
                    onChange={e => setSkillQty(n, parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary disabled:opacity-40"
                  />
                </div>
              );
            })}
          </div>
          <div className="font-mono text-[9px] text-secondary/50 mb-2">
            Skill efectivo del bay: <span className="text-primary-container font-bold">{p.bayTechSkill}</span> (el mejor asignado)
          </div>

          <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
            AsTechs asignados (de {p.totalAstechs})
          </label>
          <input
            type="number" min={0} max={p.totalAstechs}
            value={p.bayAstechs || ''}
            onFocus={e => e.target.select()}
            onChange={e => p.setBayAstechs(Math.min(p.totalAstechs, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-sm text-secondary mb-2"
          />

          <div className="font-mono text-[10px] text-secondary/70 space-y-1">
            <div>
              Multiplier:{' '}
              <span className={p.bayMult < 1 ? 'text-primary font-bold' : p.bayMult > 1.25 ? 'text-error font-bold' : 'text-amber-400'}>
                ×{p.bayMult.toFixed(2)}
              </span>
              <span className="text-secondary/50 ml-1">
                ({multPct > 0 ? `+${multPct}` : multPct}% tiempo)
              </span>
            </div>
            {p.bayTechsTotal > 1 && (
              <div className="text-primary text-[9px]">
                {p.bayTechsTotal} equipos en paralelo · {Math.floor(p.bayAstechs / p.bayTechsTotal)} astechs/team
              </div>
            )}
            <div className="text-secondary/50 text-[9px]">
              Canon: 1 Tech + 6 AsTech = ×1.00 · cada equipo extra divide tiempo
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function BudgetBar(p: { minutosBase: number; minutosExtra: number; minutosUsadosTotal: number }) {
  const total = p.minutosBase + p.minutosExtra;
  const pctBase = total > 0 ? Math.min(100, (Math.min(p.minutosUsadosTotal, p.minutosBase) / total) * 100) : 0;
  const pctExtra = total > 0 ? Math.min(100, (Math.max(0, p.minutosUsadosTotal - p.minutosBase) / total) * 100) : 0;
  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Presupuesto
      </h2>
      <div className="h-6 bg-surface-container border border-outline-variant/40 relative overflow-hidden mb-2">
        <div className="absolute top-0 bottom-0 bg-primary/70" style={{ left: 0, width: `${pctBase}%` }} />
        <div className="absolute top-0 bottom-0 bg-error/70" style={{ left: `${pctBase}%`, width: `${pctExtra}%` }} />
      </div>
      <div className="font-mono text-[10px] text-secondary/70 space-y-1">
        <div>Usados: <span className="text-primary-container font-bold">{p.minutosUsadosTotal}</span> min</div>
        <div>Restantes: <span className="text-secondary">{Math.max(0, total - p.minutosUsadosTotal)}</span> min</div>
      </div>
    </section>
  );
}

// ── RepairItemList ──

function RepairItemList({
  items, resultados, onReorder,
}: {
  items: RepairItem[];
  resultados: ResultadoItem[];
  onReorder: (newOrder: string[]) => void;
}) {
  const resultadoMap = new Map(resultados.map(r => [r.item.id, r]));
  const ids = items.map(it => it.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(ids, oldIdx, newIdx));
  };

  const moveBy = (id: string, delta: number) => {
    const idx = ids.indexOf(id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= ids.length) return;
    onReorder(arrayMove(ids, idx, target));
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Reparaciones ({items.length})
      </h2>
      {items.length === 0 && (
        <p className="font-mono text-[10px] text-secondary/50 italic">
          Sin daños registrados. Selecciona un mech con combate previo.
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1.5">
            {items.map((it, idx) => (
              <SortableRow
                key={it.id}
                item={it}
                resultado={resultadoMap.get(it.id)}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                onUp={() => moveBy(it.id, -1)}
                onDown={() => moveBy(it.id, +1)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableRow({
  item, resultado, isFirst, isLast, onUp, onDown,
}: {
  item: RepairItem;
  resultado: ResultadoItem | undefined;
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  const estado = resultado?.estado ?? 'pendiente';
  const bg =
    estado === 'reparado' ? 'border-primary/60 bg-primary/5' :
    estado === 'parcial'  ? 'border-amber-400/60 bg-amber-400/5' :
    'border-error/40 bg-error/5';

  return (
    <li ref={setNodeRef} style={style} className={`border ${bg} p-2 flex items-center gap-2`}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-secondary/40 hover:text-primary-container cursor-grab active:cursor-grabbing touch-none"
        title="Arrastrar para reordenar"
      >
        <GripVertical size={12} />
      </button>
      <span className="font-mono text-[9px] text-secondary/60 w-14 uppercase">{item.categoria}</span>
      <span className="font-mono text-[10px] text-secondary flex-1 truncate">{item.nombre}</span>
      <span className="font-mono text-[9px] text-secondary/60">{item.localizacion}</span>
      <span className="font-mono text-[10px] text-primary-container font-bold w-14 text-right">{item.tiempoBase}min</span>
      <span className={`font-mono text-[8px] uppercase tracking-widest w-12 text-right ${
        estado === 'reparado' ? 'text-primary' :
        estado === 'parcial'  ? 'text-amber-400' :
        'text-error'
      }`}>{estado.slice(0,4)}{resultado?.riesgoFatiga ? '⚠' : ''}</span>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onUp}
          disabled={isFirst}
          className="text-secondary/50 hover:text-primary-container disabled:opacity-20 disabled:cursor-not-allowed"
          title="Subir"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={isLast}
          className="text-secondary/50 hover:text-primary-container disabled:opacity-20 disabled:cursor-not-allowed"
          title="Bajar"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </li>
  );
}

// ── ResultsSummary ──

function ResultsSummary(p: {
  resultado: ReturnType<typeof calcularReparaciones>;
  system: RepairSystem; setSystem: (s: RepairSystem) => void;
  estadoFactPct: number; setEstadoFactPct: (n: number) => void;
  totalAplicado: number;
  mechName: string | null;
  commitState: 'idle' | 'sending' | 'done' | 'error';
  onRegistrarGasto: () => void;
}) {
  const { resultado } = p;
  const rep = resultado.resultados.filter(r => r.estado === 'reparado');
  const par = resultado.resultados.filter(r => r.estado === 'parcial');
  const pen = resultado.resultados.filter(r => r.estado === 'pendiente');
  const blindajePts = rep.filter(r => r.item.divisible).reduce((s, r) => s + (r.puntosReparados ?? 0), 0)
                   + par.filter(r => r.item.divisible).reduce((s, r) => s + (r.puntosReparados ?? 0), 0);

  const fmt = (n: number) => n.toLocaleString('es-ES') + ' ₡';
  const btnDisabled = !p.mechName || p.totalAplicado <= 0 || p.commitState === 'sending';

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Resumen
      </h2>
      <div className="grid grid-cols-3 gap-2 mb-3 font-mono text-[10px]">
        <div className="border border-primary/40 bg-primary/5 p-2">
          <div className="text-primary uppercase tracking-widest text-[8px]">Reparado</div>
          <div className="text-primary font-bold text-base">{rep.length}</div>
        </div>
        <div className="border border-amber-400/40 bg-amber-400/5 p-2">
          <div className="text-amber-400 uppercase tracking-widest text-[8px]">Parcial</div>
          <div className="text-amber-400 font-bold text-base">{par.length}</div>
        </div>
        <div className="border border-error/40 bg-error/5 p-2">
          <div className="text-error uppercase tracking-widest text-[8px]">Pendiente</div>
          <div className="text-error font-bold text-base">{pen.length}</div>
        </div>
      </div>
      <div className="font-mono text-[10px] text-secondary/70 space-y-1 mb-3">
        <div>Min usados: <span className="text-primary">{resultado.minutosUsadosTotal}</span></div>
        <div>Min libres: <span className="text-secondary">{resultado.minutosSinUsar}</span></div>
        {blindajePts > 0 && <div>Blindaje recuperado: <span className="text-primary-container">{blindajePts} pts</span></div>}
        {resultado.minutosSinUsar > 0 && resultado.pendientesBlindaje?.length > 0 && (
          <div className="text-amber-400 text-[9px]">
            Sobran {resultado.minutosSinUsar} min (~{Math.floor(resultado.minutosSinUsar / MINUTOS_POR_PUNTO_BLINDAJE)} pts blindaje).
          </div>
        )}
      </div>

      {/* Bloque coste + tesorería */}
      <div className="border-t border-outline-variant/30 pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <label className="font-mono text-[9px] uppercase tracking-widest text-secondary/60">Sistema:</label>
          <div className="grid grid-cols-2 gap-1 flex-1">
            {(['canon', 'propio'] as RepairSystem[]).map(s => (
              <button
                key={s}
                onClick={() => p.setSystem(s)}
                className={`px-2 py-1 border font-mono text-[9px] uppercase ${
                  p.system === s
                    ? 'border-primary-container bg-primary-container/15 text-primary-container'
                    : 'border-outline-variant/40 text-secondary/60 hover:border-primary-container/60'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
          <div className="border border-primary/40 bg-primary/5 p-2">
            <div className="text-primary uppercase tracking-widest text-[8px]">Reparado bruto</div>
            <div className="text-primary font-bold text-sm">{fmt(resultado.costoReparadoBruto)}</div>
          </div>
          <div className="border border-error/40 bg-error/5 p-2">
            <div className="text-error uppercase tracking-widest text-[8px]">Pendiente</div>
            <div className="text-error font-bold text-sm">{fmt(resultado.costoPendiente)}</div>
          </div>
        </div>

        <div>
          <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
            Estado factura: <span className="text-primary-container font-bold">{p.estadoFactPct}%</span>
          </label>
          <input
            type="range" min={0} max={150} step={5}
            value={p.estadoFactPct}
            onChange={e => p.setEstadoFactPct(parseInt(e.target.value) || 0)}
            className="w-full"
          />
        </div>

        <div className="border border-primary-container/40 bg-primary-container/5 p-2 font-mono text-[10px]">
          <div className="text-primary-container uppercase tracking-widest text-[8px]">Total aplicado</div>
          <div className="text-primary-container font-bold text-base">{fmt(p.totalAplicado)}</div>
        </div>

        <button
          onClick={p.onRegistrarGasto}
          disabled={btnDisabled}
          className={`w-full py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
            btnDisabled
              ? 'border-outline-variant/30 text-secondary/30 cursor-not-allowed'
              : p.commitState === 'done'
                ? 'border-primary bg-primary/20 text-primary'
                : p.commitState === 'error'
                  ? 'border-error bg-error/20 text-error'
                  : 'border-primary-container bg-primary-container/15 text-primary-container hover:bg-primary-container/25'
          }`}
        >
          {p.commitState === 'sending' ? 'Registrando…'
            : p.commitState === 'done' ? '✓ Gasto registrado'
            : p.commitState === 'error' ? '✗ Error — reintenta'
            : 'Registrar gasto en tesorería'}
        </button>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB MANTENIMIENTO
// ══════════════════════════════════════════════════════════

const QUALITY_COLOR: Record<QualityRating, string> = {
  A: 'text-error',
  B: 'text-amber-500',
  C: 'text-amber-400',
  D: 'text-primary-container',
  E: 'text-primary',
  F: 'text-primary',
};

function MantenimientoTab() {
  const { campaign } = useAppStore();

  // ── Selector mech ──
  const [simSlotIdx, setSimSlotIdx] = useState<number | null>(null);
  const simSlots = useMemo(() => {
    const snap = loadLocalSnapshot();
    if (!snap) return [];
    return snap.mechSlots
      .map((s, i) => ({ slot: s, idx: i }))
      .filter(({ slot }) => slot?.state && slot?.session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simSlotIdx]);

  // ── Estado mantenimiento del mech (persistido) ──
  const [mant, setMantState] = useState<MechMaintenanceState | null>(null);

  useEffect(() => {
    if (simSlotIdx === null) { setMantState(null); return; }
    setMantState(loadMechMaintenance(simSlotIdx));
  }, [simSlotIdx]);

  // ── Datos del mech (tons, jump jets, ammo) ──
  const mechInfo = useMemo(() => {
    if (simSlotIdx === null) return null;
    const snap = loadLocalSnapshot();
    const slot = snap?.mechSlots[simSlotIdx];
    if (!slot?.state) return null;
    const st = slot.state;
    return {
      mechName: `${st.chassis} ${st.model}`,
      tons:     st.tonnage,
      hayJumpJets: (st.jumpMP ?? 0) > 0,
      hayMunicion: (st.weapons ?? []).some(w => /ammo|mun/i.test(w.name || '')) ||
                   ((slot.session?.ammoBins ?? []).length > 0),
    };
  }, [simSlotIdx]);

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
  }, [simSlotIdx]);

  // ── Calcs ──
  const tn = useMemo(() => {
    if (!mant) return 0;
    return calcularTNMantenimiento(mant.experienciaEquipo, mant.techRating, mant.qualityRating, modCondiciones);
  }, [mant, modCondiciones]);

  // Mantenimiento rutinario: 0 ₡ canon (los daños fallidos van a Prioridades).
  const costo = 0;
  const tiempo = mechInfo ? TIEMPO_MANTENIMIENTO[clasePorTonelaje(mechInfo.tons)] : 0;

  // ── Persistir cambios al state ──
  const updateMant = (patch: Partial<MechMaintenanceState>) => {
    if (simSlotIdx === null || !mant) return;
    const next = { ...mant, ...patch };
    setMantState(next);
    saveMechMaintenance(simSlotIdx, next);
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

  const handleAplicarTodo = () => {
    if (!mant || !resultado || simSlotIdx === null) return;
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
      costo,
    };
    updateMant({
      qualityRating: resultado.cambioQuality ?? mant.qualityRating,
      extraDamage:   nuevoExtra,
      historial:     [entry, ...mant.historial].slice(0, 50),
    });
    // Reset flow
    setLastRoll(null); setResultado(null); setPatchesPendientes([]);
    setTiradasRestantes(0); setRollManual('');
  };

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-6xl mx-auto">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-4">
        Mantenimiento rutinario
      </h1>

      {/* Selector mech */}
      <section className="mb-4 bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">
          Mech del simulador
        </label>
        <select
          value={simSlotIdx ?? ''}
          onChange={e => setSimSlotIdx(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
        >
          <option value="">— Seleccionar —</option>
          {simSlots.map(({ slot, idx }) => (
            <option key={idx} value={idx}>
              SLOT {idx + 1}: {slot.state!.chassis} {slot.state!.model}
            </option>
          ))}
        </select>
        {simSlots.length === 0 && (
          <p className="font-mono text-[9px] text-secondary/50 mt-2 italic">
            No hay mechs cargados en simulador.
          </p>
        )}
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
