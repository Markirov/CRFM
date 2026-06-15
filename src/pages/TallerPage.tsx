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
import { loadLocalSnapshot } from '@/lib/simulador-persistence';
import {
  deriveDamageFromSession, configFromCatalog,
  type MechRepairConfig, type RepairSystem,
} from '@/lib/repair-engine';
import {
  PRESETS, calcularMinutosDisponibles, aplicarPreset, calcularReparaciones,
  mapearDamageARepairItemsConCoste, MINUTOS_POR_PUNTO_BLINDAJE, costoFinal,
  agregarPersonal, bayMultiplier, aplicarMultiplierBay, listarBays,
  type Preset, type OrdenSecundario, type RepairItem, type ResultadoItem,
  type UnidadTiempo,
} from '@/lib/repair-priority';

export function TallerPage() {
  const { activeSubTab, setActiveSubTab, campaign } = useAppStore();
  const view: 'factura' | 'prioridades' = activeSubTab === 'factura' ? 'factura' : 'prioridades';

  useEffect(() => {
    if (activeSubTab !== 'factura' && activeSubTab !== 'prioridades') {
      setActiveSubTab('prioridades');
    }
  }, [activeSubTab, setActiveSubTab]);

  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  if (view === 'prioridades') return <PrioridadesTab />;

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
  const { campaign } = useAppStore();

  // ── Selector de mech (del simulador) ──
  const [simSlotIdx, setSimSlotIdx] = useState<number | null>(null);
  const simSlots = useMemo(() => {
    const snap = loadLocalSnapshot();
    if (!snap) return [];
    return snap.mechSlots
      .map((s, i) => ({ slot: s, idx: i }))
      .filter(({ slot }) => slot?.state && slot?.session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simSlotIdx]);

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

  const bayMult = useMemo(() => bayMultiplier(bayTechSkill, bayAstechs), [bayTechSkill, bayAstechs]);

  // ── Sistema de coste + factor estado factura ──
  const [system, setSystem] = useState<RepairSystem>('canon');
  const [estadoFactPct, setEstadoFactPct] = useState(100);

  // ── Mech seleccionado: nombre + config + damage (compartido) ──
  const mechCtx = useMemo(() => {
    if (simSlotIdx === null) return null;
    const snap = loadLocalSnapshot();
    const slot = snap?.mechSlots[simSlotIdx];
    if (!slot?.state || !slot?.session) return null;
    const st = slot.state;
    const { damage } = deriveDamageFromSession(st, slot.session);
    const config: MechRepairConfig = configFromCatalog({
      tons:   st.tonnage,
      walkMP: st.walkMP,
      armor:  { type: st.armorType || 'Standard' },
      engine: { type: 'Fusion', rating: st.walkMP * st.tonnage },
      heatSinks: { type: st.hsDouble ? 'Double' : 'Single' },
    });
    return {
      mechName: `${st.chassis} ${st.model}`,
      tons:     st.tonnage,
      config,
      damage,
    };
  }, [simSlotIdx]);

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
  useEffect(() => { setManualOrder([]); }, [simSlotIdx]);

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

      {/* Selector mech del simulador */}
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
            No hay mechs cargados en simulador. Carga uno primero.
          </p>
        )}
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
            <div className="text-secondary/50 text-[9px]">
              Canon: 1 Tech + 6 AsTech = ×1.00
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
