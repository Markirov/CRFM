// ════════════════════════════════════════════════════════════════
//  ReparacionTab — tab unificada Taller (Sprint Unificación)
//  Integra: factura $ canon + tiempos canon CamOps + recarga ammo granular
//  + asignación equipos del pool compartido + cola.
//
//  Reglas decididas (per user spec):
//   - Carga automática (NO edición manual daños)
//   - Selector mech sólo standalone (oculto si fromSimSlotIdx presente)
//   - Mech del hangar carga estado actual (damagePersist + sessionActiva)
//   - Coste municion sólo si stock 0 (forzar compra ton); siempre descuenta stock granular
//   - Recarga = descuenta tiempo + material
//   - 2 botones: Calcular (preview) + Confirmar
//   - Restaurar SIM = sólo lo reparado/recargado (no reset 100%)
//   - Sistema (canon/propio) de SecretMenu (house-rules), canon default
//   - Estado factura % per sesión (manual)
//   - Pool tiempo manual cada acción; pool equipos persiste cross-mech
//   - Si tiempo no cubre blindaje → prompt auto (dentro→afuera) o manual
//   - Items que no caben → cola separada
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Wrench, Database, Download, AlertTriangle, ArrowLeft, Calculator, CheckCircle2, RotateCcw, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '@/lib/store';
import { loadHangar, saveHangarItem, saveConfigBatch, loadPersonal, commitLibroEntryAndTreasury, type PersonalEntry, type PersonalNivel } from '@/lib/firebase-service';
import { loadLocalSnapshot, saveLocalSnapshot, type SimuladorSnapshot } from '@/lib/simulador-persistence';
import { buildMechSources, type MechSource } from '@/lib/taller-sources';
import { MechSourcePicker } from '@/components/taller/MechSourcePicker';
import { type HangarItem } from '@/lib/hangar-types';
import { type AmmoBin, type MechState, type MechSession } from '@/lib/combat-types';
import {
  emptyDamage, deriveDamageFromSession, configFromCatalog,
  calcRepairCostCanon, calcRepairCost, ESTADO_COLOR,
  type MechRepairConfig, type MechRepairDamage,
  type MunicionDetalleEntry,
} from '@/lib/repair-engine';
import { TelegramToggle } from '@/components/ui/TelegramToggle';
import { restoreMechSlotFull } from '@/lib/simulador-persistence';
import {
  calcularMinutosDisponibles, MINUTOS_EXTRA_POR_TURNO,
  mapearDamageARepairItemsConCoste, aplicarPreset, calcularReparaciones,
  PRESETS, MINUTOS_POR_PUNTO_BLINDAJE,
  agregarPersonal, bayMultiplier, aplicarMultiplierBay,
  type UnidadTiempo, type BayTeam, type RepairItem,
} from '@/lib/repair-priority';
import { useMechCatalog, findMechByName } from '@/hooks/useMechCatalog';
import {
  findAmmoStock, ammoKeyFromBin, roundsPerShot, roundsToFullRounds,
  consumeArmor, armorKey, familyKeyNormalize,
} from '@/lib/almacen-keys';
import { calcAmmoReloadTime, type TechSkill } from '@/lib/camops-canon';
import { useTallerShared, getMechCapacity, getPoolUsage } from '@/lib/taller-shared';
import { useHouseRules } from '@/lib/house-rules';
import { formatCzar } from '@/lib/currency-utils';
const fmtMoney = (n: number) => formatCzar(n);
const fmtMoneyExternal = (n: number) => formatCzar(n);
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';

type RepairSystemKind = 'canon' | 'propio';

/** Estilo común color border según estado item. */
function estadoColor(estado: string): string {
  return estado === 'reparado' ? 'border-emerald-400/60 text-emerald-400'
    : estado === 'parcial' ? 'border-amber-400/60 text-amber-400'
    : 'border-error/40 text-error/80';
}

/** Row item reparación sin drag (modo auto). */
function ItemRow({ item, estado, fmtMoney }: { item: RepairItem; estado: string; fmtMoney: (n: number) => string }) {
  return (
    <div className={`flex items-center justify-between p-2 border ${estadoColor(estado)} text-[10px] font-mono`}>
      <div className="flex-1">
        <span className="text-cream">{item.nombre}</span>
        <span className="text-secondary/40 ml-2">[{item.categoria}]</span>
      </div>
      <span className="text-secondary/60 mr-2">⏱ {item.tiempoBase}m</span>
      <span className="text-secondary/60 mr-2">{fmtMoney(item.costoBase)}</span>
      <span className="uppercase font-bold text-[9px]">{estado}</span>
    </div>
  );
}

/** Row sortable item armor (modo manual). */
function SortableItemRow({ id, item, estado, fmtMoney }: { id: string; item: RepairItem; estado: string; fmtMoney: (n: number) => string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-2 border ${estadoColor(estado)} text-[10px] font-mono cursor-grab active:cursor-grabbing`}>
      <button {...attributes} {...listeners} className="mr-2 text-secondary/40 hover:text-secondary touch-none" title="Arrastra para reordenar">
        <GripVertical size={12} />
      </button>
      <div className="flex-1">
        <span className="text-cream">{item.nombre}</span>
        <span className="text-secondary/40 ml-2">[{item.categoria}]</span>
      </div>
      <span className="text-secondary/60 mr-2">⏱ {item.tiempoBase}m</span>
      <span className="text-secondary/60 mr-2">{fmtMoney(item.costoBase)}</span>
      <span className="uppercase font-bold text-[9px]">{estado}</span>
    </div>
  );
}

/** Línea factura: izq label, der valor. Color/bold opcional. */
function FacturaRow({ label, value, color, bold }: { label: string; value: number; color?: 'amber' | 'default'; bold?: boolean }) {
  const valueClass = color === 'amber' ? 'text-amber-400' : value > 0 ? 'text-cream' : 'text-secondary/40';
  const valueText = value > 0 ? fmtMoneyExternal(value) : '—';
  return (
    <div className={`flex justify-between items-center py-0.5 ${bold ? 'text-[12px]' : ''}`}>
      <span className="text-secondary/70">{label}</span>
      <span className={`${valueClass} ${bold ? 'font-bold' : ''}`}>{valueText}</span>
    </div>
  );
}

interface Props {
  /** Si presente, auto-carga slot del sim y oculta picker. */
  fromSimSlotIdx?: number | null;
  /** Si abierto desde sim, mostrar banner "Volver al Simulador". */
  showReturnToSim?: boolean;
}

export function ReparacionTab({ fromSimSlotIdx, showReturnToSim }: Props = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const campaign = useAppStore(s => s.campaign);
  const setCampaign = useAppStore(s => s.setCampaign);
  const roster = useAppStore(s => s.roster);
  const almacen = campaign.almacen || {};

  // Query param ?fromSim=N override
  const fromSimParam = searchParams.get('fromSim');
  const effectiveFromSim = fromSimSlotIdx ?? (fromSimParam !== null ? parseInt(fromSimParam) : null);
  const effectiveShowReturn = showReturnToSim ?? effectiveFromSim !== null;

  // ── Sources (hangar + sim) ──
  const [hangarItems, setHangarItems] = useState<HangarItem[]>([]);
  const [snap, setSnap] = useState<SimuladorSnapshot | null>(() => loadLocalSnapshot());
  const [snapVersion, setSnapVersion] = useState(0);

  useEffect(() => {
    loadHangar().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.items)) {
        setHangarItems((res.data as any).items as HangarItem[]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { setSnap(loadLocalSnapshot()); }, [snapVersion]);

  const sources = useMemo<MechSource[]>(
    () => buildMechSources(hangarItems, snap, roster),
    [hangarItems, snap, roster],
  );

  // ── Selección mech ──
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Auto-select cuando fromSim presente y snap cargado
  useEffect(() => {
    if (effectiveFromSim === null) return;
    const key = `sim:${effectiveFromSim}`;
    if (sources.some(s => s.key === key)) setSelectedKey(key);
  }, [effectiveFromSim, sources]);

  const selectedSource = useMemo(
    () => sources.find(s => s.key === selectedKey) ?? null,
    [sources, selectedKey],
  );

  // ── Catalog para configFromCatalog ──
  const { catalog } = useMechCatalog();

  // ── Daño + config + municion auto-load ──
  const autoLoaded = useMemo(() => {
    if (!selectedSource) {
      return {
        config: null as MechRepairConfig | null,
        damage: emptyDamage(),
        pctDañoTotal: 0,
        municionDetalle: [] as MunicionDetalleEntry[],
        state: null as MechState | null,
        session: null as MechSession | null,
      };
    }

    let state: MechState | null = null;
    let session: MechSession | null = null;

    if (selectedSource.origin === 'sim' && selectedSource.simSlotIdx !== undefined && snap) {
      const slot = snap.mechSlots[selectedSource.simSlotIdx];
      state = slot?.state ?? null;
      session = slot?.session ?? null;
    }

    let damage = emptyDamage();
    let pctDañoTotal = 0;
    let municionDetalle: MunicionDetalleEntry[] = [];

    if (state && session) {
      const derived = deriveDamageFromSession(state, session);
      damage = derived.damage;
      pctDañoTotal = derived.pctDañoTotal;
      municionDetalle = derived.municionDetalle;
    } else {
      // Hangar sin sessionActiva → usar damagePersist
      damage = selectedSource.damage;
    }

    // Config: catálogo si existe, fallback desde state
    const catMatch = catalog
      ? findMechByName(catalog.mechs, selectedSource.mechName)
      : null;
    const config: MechRepairConfig = catMatch
      ? configFromCatalog(catMatch)
      : selectedSource.config;

    return { config, damage, pctDañoTotal, municionDetalle, state, session };
  }, [selectedSource, snap, catalog]);

  // ── House rules ── system (canon | propio)
  const [houseRules] = useHouseRules();
  const system: RepairSystemKind = houseRules.repair_system;

  // ── Estado factura % (per sesión, manual) ──
  const [estadoFactPct, setEstadoFactPct] = useState(100);

  // ── Pool tiempo + equipos compartido ──
  const tiempoGlobal = useTallerShared(s => s.tiempoGlobal);
  const setTiempoGlobalShared = useTallerShared(s => s.setTiempoGlobal);
  const asignacionesShared = useTallerShared(s => s.asignaciones);
  const setMechAssignmentShared = useTallerShared(s => s.setMechAssignment);
  const setMechTurnosExtShared = useTallerShared(s => s.setMechTurnosExt);
  const consumeMechTimeShared = useTallerShared(s => s.consumeMechTime);
  const addToCola = useTallerShared(s => s.addToCola);
  const resetAllMechTimes = useTallerShared(s => s.resetAllMechTimes);

  const valor = tiempoGlobal.valor;
  const unidad = tiempoGlobal.unidad;
  const setValor = (v: number) => setTiempoGlobalShared(v, unidad);
  const setUnidad = (u: UnidadTiempo) => setTiempoGlobalShared(valor, u);

  const mechKey = selectedSource?.key ?? '';
  const mechAssignment = mechKey ? asignacionesShared[mechKey] : undefined;
  const turnosExt = mechAssignment?.turnosExt ?? 0;
  const setTurnosExt = (n: number) => { if (mechKey) setMechTurnosExtShared(mechKey, n); };

  const tiempoCalc = useMemo(
    () => calcularMinutosDisponibles({ valor, unidad, turnosExtendidos: turnosExt }),
    [valor, unidad, turnosExt],
  );

  const capacity = useMemo(
    () => getMechCapacity(mechAssignment, tiempoCalc.minutosBase, MINUTOS_EXTRA_POR_TURNO),
    [mechAssignment, tiempoCalc.minutosBase],
  );

  // ── Personal + asignación BayTeams ──
  const [personal, setPersonal] = useState<PersonalEntry[]>([]);
  useEffect(() => {
    loadPersonal().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.entries)) {
        setPersonal((res.data as any).entries as PersonalEntry[]);
      }
    }).catch(() => {});
  }, []);

  const personalAgg = useMemo(() => agregarPersonal(personal), [personal]);
  const poolUsage = useMemo(() => getPoolUsage(asignacionesShared), [asignacionesShared]);

  const bayTeams = mechAssignment?.teams ?? [];
  const bayMult = useMemo(() => bayMultiplier(bayTeams), [bayTeams]);

  const techsRestantes = (skill: PersonalNivel) => {
    let usadosOtros = 0;
    for (const [k, a] of Object.entries(asignacionesShared)) {
      if (k === mechKey) continue;
      usadosOtros += a.teams.filter(t => t.skill === skill).length;
    }
    const usadosEste = bayTeams.filter(t => t.skill === skill).length;
    return Math.max(0, (personalAgg.techsBySkill[skill] ?? 0) - usadosOtros - usadosEste);
  };
  const astechsRestantes = () => {
    let usadosOtros = 0;
    for (const [k, a] of Object.entries(asignacionesShared)) {
      if (k === mechKey) continue;
      usadosOtros += a.teams.reduce((s, t) => s + t.astechs, 0);
    }
    const usadosEste = bayTeams.reduce((s, t) => s + t.astechs, 0);
    return Math.max(0, personalAgg.totalAstechs - usadosOtros - usadosEste);
  };

  const addTeam = () => {
    if (!mechKey || bayTeams.length >= 3) return;
    const skill: PersonalNivel = (['elite', 'veteran', 'regular', 'green'] as PersonalNivel[])
      .find(s => techsRestantes(s) > 0) ?? 'regular';
    if (techsRestantes(skill) === 0) return;
    const astechs = Math.min(6, astechsRestantes());
    setMechAssignmentShared(mechKey, [...bayTeams, { skill, astechs }]);
  };

  const removeTeam = (idx: number) => {
    if (!mechKey) return;
    setMechAssignmentShared(mechKey, bayTeams.filter((_, i) => i !== idx));
  };

  // ── Items reparación con tiempos canon ──
  const baseItems = useMemo<RepairItem[]>(() => {
    if (!autoLoaded.config) return [];
    return mapearDamageARepairItemsConCoste(
      autoLoaded.damage,
      autoLoaded.config,
      system,
      selectedSource?.tons,
    );
  }, [autoLoaded, system, selectedSource?.tons]);

  const itemsAjustados = useMemo(
    () => aplicarMultiplierBay(baseItems, bayMult),
    [baseItems, bayMult],
  );

  // ── Preset ordering (default persecucion ASC tiempo) ──
  const [presetId, setPresetId] = useState<string>('persecucion');
  const preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[0];
  // Política blindaje incompleto: 'auto' (dentro→afuera CT/IS primero) | 'manual' (drag-reorder)
  const [armorPolicy, setArmorPolicy] = useState<'auto' | 'manual'>('auto');
  // Manual: orden custom guardado per-mech (sólo items Blindaje)
  const [manualOrder, setManualOrder] = useState<string[]>([]);

  // Reset manualOrder cuando cambian items base
  useEffect(() => {
    if (armorPolicy !== 'manual') return;
    const armorIds = itemsAjustados.filter(i => i.categoria === 'Blindaje').map(i => i.id);
    setManualOrder(prev => {
      // Preserva orden existente, añade nuevos al final
      const kept = prev.filter(id => armorIds.includes(id));
      const newIds = armorIds.filter(id => !kept.includes(id));
      return [...kept, ...newIds];
    });
  }, [itemsAjustados, armorPolicy]);

  const orderedItems = useMemo(() => {
    const sorted = aplicarPreset(itemsAjustados, preset, 'asc');
    const armorItems = sorted.filter(i => i.categoria === 'Blindaje');
    const others = sorted.filter(i => i.categoria !== 'Blindaje');

    if (armorPolicy === 'manual') {
      // Reordenar armor según manualOrder
      const armorSorted = [...armorItems].sort((a, b) => {
        const ia = manualOrder.indexOf(a.id);
        const ib = manualOrder.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
      return [...armorSorted, ...others];
    }

    // Auto: orden inverso transferencia daño canónico BattleTech
    // CT > HD > LT/RT > LA/RA > LL/RL ; front-before-rear sub-orden
    const ARMOR_PRIO: Record<string, number> = {
      CT: 1, HD: 2, LT: 3, RT: 3, LA: 4, RA: 4, LL: 5, RL: 5,
    };
    const armorSorted = armorItems.sort((a, b) => {
      const pa = ARMOR_PRIO[a.localizacion] ?? 99;
      const pb = ARMOR_PRIO[b.localizacion] ?? 99;
      if (pa !== pb) return pa - pb;
      const aRear = a.nombre.includes('Trasero') ? 1 : 0;
      const bRear = b.nombre.includes('Trasero') ? 1 : 0;
      return aRear - bRear;
    });
    return [...armorSorted, ...others];
  }, [itemsAjustados, preset, armorPolicy, manualOrder]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setManualOrder(prev => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  // Resultado simulación reparación según tiempo restante del pool
  const resultadoReparacion = useMemo(() => {
    const minutosAplicables = capacity.minutosRestantes;
    return calcularReparaciones(orderedItems, minutosAplicables, 0);
  }, [orderedItems, capacity.minutosRestantes]);

  // ── Recarga munición — lista por bin ──
  const ammoBins = useMemo<AmmoBin[]>(() => {
    if (selectedSource?.origin === 'sim' && selectedSource.simSlotIdx !== undefined && snap) {
      return (snap.mechSlots[selectedSource.simSlotIdx]?.session?.ammoBins || []) as AmmoBin[];
    }
    if (selectedSource?.origin === 'hangar' && selectedSource.hangarId) {
      const it = hangarItems.find(h => h.id === selectedSource.hangarId);
      if (it?.sessionActiva?.ammoBins) return it.sessionActiva.ammoBins as AmmoBin[];
    }
    return [];
  }, [selectedSource, snap, hangarItems]);

  const [techSkillAmmo, setTechSkillAmmo] = useState<TechSkill>('regular');
  const [onBattlefield, setOnBattlefield] = useState(false);
  // teams para CamOps multipliers de recarga = max(1, asignados)
  const teamsForAmmo = Math.max(1, capacity.teamsCount);

  // Recarga seleccionada per bin (binIdx → cantidad rondas a cargar)
  const [recargaSelecc, setRecargaSelecc] = useState<Record<number, number>>({});

  // Auto-init: por defecto rellenar al máximo posible per bin
  useEffect(() => {
    if (ammoBins.length === 0) { setRecargaSelecc({}); return; }
    const init: Record<number, number> = {};
    ammoBins.forEach((bin, idx) => {
      const faltante = Math.max(0, (bin.max || 0) - (bin.current || 0));
      const cargable = roundsToFullRounds(faltante, bin.familyKey);
      const { stock } = findAmmoStock(almacen, bin);
      const max = Math.min(cargable, roundsToFullRounds(stock, bin.familyKey));
      // Si no hay stock, marcar cantidad faltante = forzará compra ton
      init[idx] = max > 0 ? max : cargable;
    });
    setRecargaSelecc(init);
    // ESLint: depender de identidad estable de ammoBins (no del array)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ammoBins.length, selectedSource?.key]);

  // ── Cálculo coste municion en factura (sólo si stock 0 → comprar ton) ──
  const costeMunicionFactura = useMemo(() => {
    let total = 0;
    const detalles: Array<{ binIdx: number; family: string; tonsComprar: number; cost: number }> = [];
    ammoBins.forEach((bin, idx) => {
      const cargar = recargaSelecc[idx] ?? 0;
      if (cargar <= 0) return;
      const { stock } = findAmmoStock(almacen, bin);
      const deficit = Math.max(0, cargar - stock);
      if (deficit <= 0) return;
      // Compra por toneladas: 1 ton = bin.max misiles (asumido)
      const tonsComprar = bin.max ? Math.ceil(deficit / bin.max) : 1;
      // Precio canon: usar slugPrice del municionDetalle si match family
      const detalleMatch = autoLoaded.municionDetalle.find(d => d.family === bin.family);
      const pricePerTon = detalleMatch?.slugPrice ?? 1000; // fallback
      const cost = tonsComprar * pricePerTon;
      total += cost;
      detalles.push({ binIdx: idx, family: bin.family || familyKeyNormalize(bin.familyKey), tonsComprar, cost });
    });
    return { total, detalles };
  }, [ammoBins, recargaSelecc, almacen, autoLoaded.municionDetalle]);

  // Tiempo recarga total
  const tiempoRecargaTotal = useMemo(() => {
    let total = 0;
    ammoBins.forEach((bin, idx) => {
      const cargar = recargaSelecc[idx] ?? 0;
      if (cargar <= 0 || !bin.max) return;
      const tons = cargar / bin.max;
      total += calcAmmoReloadTime(tons, techSkillAmmo, teamsForAmmo, onBattlefield);
    });
    return total;
  }, [ammoBins, recargaSelecc, techSkillAmmo, teamsForAmmo, onBattlefield]);

  // ── Factura $ ──
  const facturaRepair = useMemo(() => {
    if (!autoLoaded.config) return { breakdown: null, total: 0 };
    const breakdown = system === 'canon'
      ? calcRepairCostCanon(autoLoaded.config, autoLoaded.damage, estadoFactPct, autoLoaded.pctDañoTotal)
      : calcRepairCost(autoLoaded.config, autoLoaded.damage, estadoFactPct);
    return { breakdown, total: breakdown.total };
  }, [autoLoaded, system, estadoFactPct]);

  const facturaTotal = useMemo(
    () => facturaRepair.total + Math.round(costeMunicionFactura.total * (estadoFactPct / 100)),
    [facturaRepair.total, costeMunicionFactura.total, estadoFactPct],
  );

  // ── Confirmar ──
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  const [stage, setStage] = useState<'editing' | 'previewed' | 'committing' | 'done' | 'error'>('editing');

  const handleCalcular = () => setStage('previewed');

  const handleConfirmar = async () => {
    if (!selectedSource || !autoLoaded.config) return;
    setStage('committing');
    try {
      // 1. Descontar almacén granular: armor + armas reparadas + ammo descontada del stock
      let newAlmacen: Record<string, number> = { ...almacen };
      const chassis = selectedSource.chassis;

      // Armor reparado (de orderedItems con minutosAplicables actuales)
      for (const r of resultadoReparacion.resultados) {
        if (r.estado !== 'reparado' && r.estado !== 'parcial') continue;
        const cat = r.item.categoria;
        const qty = cat === 'Blindaje' ? (r.puntosReparados || 0) : 1;
        if (cat === 'Blindaje') {
          const armorType = autoLoaded.config.blindajeType || 'Standard';
          if (chassis && qty > 0) {
            const cons = consumeArmor(newAlmacen, chassis, armorType, qty);
            newAlmacen = cons.newAlmacen;
          } else {
            const k = armorKey(armorType);
            if (newAlmacen[k] && newAlmacen[k] >= qty) newAlmacen[k] -= qty;
          }
        } else {
          // Armas / heat sink / jump jet
          let nombre = r.item.nombre;
          if (nombre.toLowerCase().includes('heat sink')) nombre = 'Heat Sink';
          else if (nombre.toLowerCase().includes('jump jet')) nombre = 'Jump Jet';
          if (newAlmacen[nombre] && newAlmacen[nombre] >= qty) newAlmacen[nombre] -= qty;
        }
      }

      // 2. Recarga ammo granular (descuenta stock + compra ton si deficit)
      let mechAmmoBinsUpdated: AmmoBin[] = [...ammoBins];
      ammoBins.forEach((bin, idx) => {
        const cargar = recargaSelecc[idx] ?? 0;
        if (cargar <= 0) return;
        const { key: ammoKey, stock } = findAmmoStock(newAlmacen, bin);
        // Compra ton si deficit
        const deficit = Math.max(0, cargar - stock);
        if (deficit > 0 && bin.max) {
          const tonsComprar = Math.ceil(deficit / bin.max);
          newAlmacen[ammoKey] = (newAlmacen[ammoKey] ?? 0) + tonsComprar * bin.max;
        }
        // Descontar del stock
        newAlmacen[ammoKey] = Math.max(0, (newAlmacen[ammoKey] ?? 0) - cargar);
        // Cargar en el bin
        mechAmmoBinsUpdated[idx] = {
          ...bin,
          current: Math.min(bin.max, (bin.current || 0) + cargar),
        };
      });

      // 3. Persistir cambios mech (sessionActiva del hangar o snap sim)
      if (selectedSource.origin === 'sim' && selectedSource.simSlotIdx !== undefined && snap) {
        const newSnap = { ...snap };
        const slotIdx = selectedSource.simSlotIdx;
        const slot = newSnap.mechSlots[slotIdx];
        if (slot?.session && slot.state) {
          slot.session.ammoBins = mechAmmoBinsUpdated;

          // Aplica reparaciones al sim per loc (canon BattleTech)
          const stateArmor = slot.state.armor as Record<string, number>;
          const stateIs = slot.state.is as Record<string, number>;
          const sessArmor = { ...(slot.session.armor as Record<string, number>) };
          const sessIs = { ...(slot.session.is as Record<string, number>) };

          // Helper: deriva armor key con sufijo f/r del nombre del item
          const armorKeyFromItem = (item: { localizacion: string; nombre: string }): string => {
            const loc = item.localizacion;
            if (loc === 'CT' || loc === 'LT' || loc === 'RT') {
              return item.nombre.includes('Trasero') ? `${loc}r` : `${loc}f`;
            }
            return loc;
          };

          for (const r of resultadoReparacion.resultados) {
            if (r.estado !== 'reparado' && r.estado !== 'parcial') continue;
            const cat = r.item.categoria;
            const pts = r.puntosReparados ?? 0;
            if (cat === 'Blindaje' && pts > 0) {
              const armorK = armorKeyFromItem(r.item);
              const cap = stateArmor[armorK] ?? Infinity;
              sessArmor[armorK] = Math.min(cap, (sessArmor[armorK] ?? 0) + pts);
            } else if (r.item.id.startsWith('is') && pts > 0) {
              // Estructura interna per loc base (HD/CT/LT/RT/LA/RA/LL/RL)
              const loc = r.item.localizacion;
              const cap = stateIs[loc] ?? Infinity;
              sessIs[loc] = Math.min(cap, (sessIs[loc] ?? 0) + pts);
            }
            // Armas + sistemas críticos: marcar slot crit hit=false en la loc
            // del arma. Búsqueda por nombre del slot.
            if (r.estado === 'reparado' && (r.item.id.startsWith('arma') || r.item.id.startsWith('reactor') || r.item.id.startsWith('gyro') || r.item.id.startsWith('sensores'))) {
              const itemName = r.item.nombre.replace(/\s*\(.*\)$/, '').trim();
              for (const locKey of Object.keys(slot.session.crits ?? {})) {
                const slotsLoc = (slot.session.crits as Record<string, Array<{ name?: string; hit?: boolean }>>)[locKey];
                if (!Array.isArray(slotsLoc)) continue;
                for (const sl of slotsLoc) {
                  if (sl?.hit && sl?.name && itemName.toLowerCase().includes(sl.name.toLowerCase())) {
                    sl.hit = false;
                  }
                }
              }
            }
          }

          slot.session.armor = sessArmor;
          slot.session.is = sessIs;

          // Si CT/HD IS restaurado y mech estaba destroyed por esa razón, despertar
          // (chequeo simple: si todo HD/CT IS > 0 ahora → no destroyed)
          if (slot.session.destroyed && (sessIs.HD ?? 0) > 0 && (sessIs.CT ?? 0) > 0) {
            slot.session.destroyed = false;
            slot.session.destroyedReason = '';
          }

          saveLocalSnapshot(newSnap);
        }
      } else if (selectedSource.origin === 'hangar' && selectedSource.hangarId) {
        const it = hangarItems.find(h => h.id === selectedSource.hangarId);
        if (it) {
          if (!it.sessionActiva) {
            it.sessionActiva = {
              armor: {}, is: {}, crits: {}, ammoBins: mechAmmoBinsUpdated, destroyed: false,
            };
          } else {
            it.sessionActiva.ammoBins = mechAmmoBinsUpdated;
          }

          // Reduce damagePersist per loc según items reparados (mech sin sim activo)
          if (it.damagePersist) {
            const dp = { ...it.damagePersist };
            const blindajePerLoc = dp.blindajePerLoc ? { ...dp.blindajePerLoc } : undefined;
            const estructuraPerLoc = dp.estructuraPerLoc ? { ...dp.estructuraPerLoc } : undefined;
            let totalBlindajeReducido = 0;
            let totalEstructuraReducida = 0;

            const armorKeyFromItem = (item: { localizacion: string; nombre: string }): string => {
              const loc = item.localizacion;
              if (loc === 'CT' || loc === 'LT' || loc === 'RT') {
                return item.nombre.includes('Trasero') ? `${loc}r` : `${loc}f`;
              }
              return loc;
            };

            for (const r of resultadoReparacion.resultados) {
              if (r.estado !== 'reparado' && r.estado !== 'parcial') continue;
              const pts = r.puntosReparados ?? 0;
              if (r.item.categoria === 'Blindaje' && pts > 0 && blindajePerLoc) {
                const k = armorKeyFromItem(r.item);
                blindajePerLoc[k] = Math.max(0, (blindajePerLoc[k] ?? 0) - pts);
                if (blindajePerLoc[k] === 0) delete blindajePerLoc[k];
                totalBlindajeReducido += pts;
              } else if (r.item.id.startsWith('is') && pts > 0 && estructuraPerLoc) {
                const k = r.item.localizacion;
                estructuraPerLoc[k] = Math.max(0, (estructuraPerLoc[k] ?? 0) - pts);
                if (estructuraPerLoc[k] === 0) delete estructuraPerLoc[k];
                totalEstructuraReducida += pts;
              }
            }

            dp.blindaje = Math.max(0, (dp.blindaje ?? 0) - totalBlindajeReducido);
            dp.estructura = Math.max(0, (dp.estructura ?? 0) - totalEstructuraReducida);
            dp.blindajePerLoc = blindajePerLoc && Object.keys(blindajePerLoc).length > 0 ? blindajePerLoc : undefined;
            dp.estructuraPerLoc = estructuraPerLoc && Object.keys(estructuraPerLoc).length > 0 ? estructuraPerLoc : undefined;
            it.damagePersist = dp;
          }

          await saveHangarItem(it);
          setHangarItems(prev => prev.map(h => h.id === it.id ? { ...it } : h));
        }
      }

      // 4. Asiento libro mayor (gasto reparación)
      const totalFinal = Math.round(facturaTotal);
      if (totalFinal > 0) {
        await commitLibroEntryAndTreasury({
          id:        genId('lm'),
          fecha:     campaignDate,
          concepto:  `Reparación · ${selectedSource.mechName}`,
          cantidad:  totalFinal,
          tipo:      'gasto',
          categoria: 'repuestos',
          nota:      `Taller unificado · ${system === 'canon' ? 'Canon CamOps' : 'Propio'} · est ${estadoFactPct}%`,
          jugador:   '',
        });
      }

      // 5. Persistir almacén
      setCampaign({ almacen: newAlmacen });
      await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });

      // 6. Descontar tiempo del pool del mech
      const tiempoTotalUsado = resultadoReparacion.minutosUsadosTotal + tiempoRecargaTotal;
      if (tiempoTotalUsado > 0) consumeMechTimeShared(mechKey, tiempoTotalUsado);

      // 7. Pendientes (lo que no cabe) → cola
      for (const r of resultadoReparacion.resultados) {
        if (r.estado === 'pendiente' || r.estado === 'parcial' && r.minutosUsados < r.item.tiempoBase) {
          // Marca en cola lo que queda
          const minutosResto = r.item.tiempoBase - (r.minutosUsados || 0);
          if (minutosResto > 0) {
            addToCola({
              mechKey,
              componenteName: r.item.nombre,
              minutosBase: minutosResto,
              categoria: r.item.categoria,
            });
          }
        }
      }

      setStage('done');
      setSnapVersion(v => v + 1);
      setTimeout(() => setStage('editing'), 2500);
    } catch (e) {
      console.error('[ReparacionTab] confirmar failed', e);
      setStage('error');
      setTimeout(() => setStage('editing'), 3000);
    }
  };

  // ── Render ──

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase flex items-center gap-2">
          <Wrench size={20} /> Taller · Reparación Unificada
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!confirm('¿Cerrar periodo? Resetea minutosUsados de TODOS los mechs a 0. No afecta asignaciones de equipos ni cola.')) return;
              resetAllMechTimes();
            }}
            title="Cierra el periodo actual y abre uno nuevo. Reset minutos usados de todos los mechs."
            className="px-3 py-1.5 border border-amber-400/60 text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
          >
            <RotateCcw size={12} /> Nuevo Periodo
          </button>
          {effectiveShowReturn && (
            <button
              onClick={() => navigate('/simulador')}
              className="px-3 py-1.5 border border-primary text-primary bg-primary/10 hover:bg-primary/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
            >
              <ArrowLeft size={12} /> Volver al Simulador
            </button>
          )}
        </div>
      </div>

      {/* Selector mech standalone (oculto si fromSim) */}
      {effectiveFromSim === null && (
        <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">
            Mech a Reparar
          </label>
          <MechSourcePicker
            sources={sources}
            selectedKey={selectedKey}
            onSelect={key => setSelectedKey(key)}
          />
        </section>
      )}

      {!selectedSource ? (
        <div className="bg-surface-container border border-outline-variant/20 p-8 rounded text-center font-mono text-sm text-secondary/60">
          Selecciona un mech del Hangar o del Simulador para empezar.
        </div>
      ) : (
        <>
          {/* Header pool: tiempo + asignación equipos + sistema */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-surface-container border border-outline-variant/30 p-3 clip-chamfer">
              <div className="font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">Tiempo Disponible</div>
              <div className="flex gap-2 mb-2">
                <input
                  type="number" min={0} value={valor || ''}
                  onChange={e => setValor(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
                />
                <select
                  value={unidad}
                  onChange={e => setUnidad(e.target.value as UnidadTiempo)}
                  className="bg-surface-container-high border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-cream"
                >
                  <option value="horas">horas</option>
                  <option value="dias">días</option>
                  <option value="semanas">semanas</option>
                </select>
              </div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mt-2 mb-1">
                Turnos extendidos (8h)
              </label>
              <input
                type="number" min={0} max={tiempoCalc.turnosMax} value={turnosExt || ''}
                onChange={e => setTurnosExt(Math.min(tiempoCalc.turnosMax, parseInt(e.target.value) || 0))}
                className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
              />
              <div className="font-mono text-[9px] text-secondary/60 mt-2 space-y-0.5">
                <div>Base: <span className="text-primary">{tiempoCalc.minutosBase}</span> min</div>
                <div>Extra: <span className="text-primary">{tiempoCalc.minutosExtra}</span> min</div>
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant/30 p-3 clip-chamfer">
              <div className="font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">Equipos {selectedSource.mechName}</div>
              <div className="font-mono text-[9px] text-secondary/60 mb-2">
                Pool global usado: <span className="text-primary">{poolUsage.teamsUsed}/{personalAgg.totalTechs}</span> eq · <span className="text-primary">{poolUsage.astechsUsed}/{personalAgg.totalAstechs}</span> astech
              </div>
              <div className="space-y-1 mb-2">
                {bayTeams.map((team, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1 bg-surface text-[10px] font-mono">
                    <span className="text-cream">{team.skill} · {team.astechs}A</span>
                    <button onClick={() => removeTeam(idx)} className="text-error/60 hover:text-error">✕</button>
                  </div>
                ))}
              </div>
              <button
                onClick={addTeam}
                disabled={bayTeams.length >= 3 || techsRestantes('regular') === 0 && techsRestantes('green') === 0 && techsRestantes('veteran') === 0 && techsRestantes('elite') === 0}
                className="w-full px-2 py-1 border border-outline-variant/40 text-[10px] font-mono uppercase text-secondary hover:bg-surface-container-high disabled:opacity-30"
              >
                + Añadir equipo ({bayTeams.length}/3)
              </button>
              <div className="font-mono text-[9px] text-amber-400 mt-2">
                Capacidad: {capacity.minutosRestantes}/{capacity.minutosDisponibles} min
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant/30 p-3 clip-chamfer">
              <div className="font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">Sistema Coste</div>
              <div className="font-mono text-sm text-cream font-bold uppercase">{system === 'canon' ? 'Canon CamOps' : 'Propio (House)'}</div>
              <div className="font-mono text-[9px] text-secondary/50 mt-1">Cambiar en SecretMenu · Reglas Casa</div>
              <div className="mt-3">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Estado factura %</label>
                <input
                  type="number" min={0} max={200} value={estadoFactPct}
                  onChange={e => setEstadoFactPct(Math.max(0, Math.min(200, parseInt(e.target.value) || 100)))}
                  className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
                />
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant/30 p-3 clip-chamfer">
              <div className="font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">Política Blindaje Parcial</div>
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-mono text-[10px] text-cream cursor-pointer">
                  <input type="radio" checked={armorPolicy === 'auto'} onChange={() => setArmorPolicy('auto')} />
                  Auto (CT/IS primero)
                </label>
                <label className="flex items-center gap-2 font-mono text-[10px] text-cream cursor-pointer">
                  <input type="radio" checked={armorPolicy === 'manual'} onChange={() => setArmorPolicy('manual')} />
                  Manual (orden preset)
                </label>
              </div>
              <div className="font-mono text-[9px] text-secondary/50 mt-2">Preset: <span className="text-cream">{preset.nombre}</span></div>
              <select
                value={presetId}
                onChange={e => setPresetId(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1 mt-1 font-mono text-[10px] text-cream"
              >
                {PRESETS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </section>

          {/* Cuerpo: Reparaciones izq · Factura desglosada der */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* IZQ: items reparación con tiempos canon + estado */}
            <div className="bg-surface-container border border-outline-variant/30 p-4 clip-chamfer">
              <h3 className="font-headline text-sm font-bold text-cream uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database size={14} /> Reparaciones ({orderedItems.length})
              </h3>
              {orderedItems.length === 0 ? (
                <div className="font-mono text-xs text-secondary/40 text-center py-4 italic">
                  Sin daños registrados. {autoLoaded.state ? '' : 'Mech sin combate previo en sim.'}
                </div>
              ) : armorPolicy === 'manual' ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={orderedItems.filter(i => i.categoria === 'Blindaje').map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                      {orderedItems.map(item => {
                        const res = resultadoReparacion.resultados.find(r => r.item.id === item.id);
                        const estado = res?.estado ?? 'pendiente';
                        const isArmor = item.categoria === 'Blindaje';
                        return isArmor ? (
                          <SortableItemRow key={item.id} id={item.id} item={item} estado={estado} fmtMoney={fmtMoney} />
                        ) : (
                          <ItemRow key={item.id} item={item} estado={estado} fmtMoney={fmtMoney} />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                  {orderedItems.map(item => {
                    const res = resultadoReparacion.resultados.find(r => r.item.id === item.id);
                    const estado = res?.estado ?? 'pendiente';
                    return <ItemRow key={item.id} item={item} estado={estado} fmtMoney={fmtMoney} />;
                  })}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-outline-variant/20 font-mono text-[10px] flex justify-between">
                <span className="text-secondary/60">Min usados: <span className="text-primary">{resultadoReparacion.minutosUsadosTotal}</span></span>
                <span className="text-secondary/60">Subtotal reparación: <span className="text-amber-400">{fmtMoney(facturaRepair.total)}</span></span>
              </div>
            </div>

            {/* DER: Factura desglosada completa (paridad con TallerModal antigua) */}
            <div className="bg-surface-container border border-outline-variant/30 p-4 clip-chamfer">
              <h3 className="font-headline text-sm font-bold text-cream uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calculator size={14} /> Factura Desglosada
              </h3>
              {facturaRepair.breakdown ? (
                <div className="space-y-1 font-mono text-[10px] max-h-96 overflow-y-auto custom-scrollbar">
                  <FacturaRow label="Reactor"      value={facturaRepair.breakdown.reactor} />
                  <FacturaRow label="Gyro"         value={facturaRepair.breakdown.gyro} />
                  <FacturaRow label="Cabina"       value={facturaRepair.breakdown.cabina} />
                  <FacturaRow label="Soporte vida" value={facturaRepair.breakdown.soporteVida} />
                  <FacturaRow label="Sensores"     value={facturaRepair.breakdown.sensores} />
                  <FacturaRow label="Estructura"   value={facturaRepair.breakdown.estructura} />
                  <FacturaRow label="Blindaje"     value={facturaRepair.breakdown.blindaje} />
                  <FacturaRow label="Miomero"      value={facturaRepair.breakdown.miomero} />
                  <FacturaRow label="Actuadores"   value={facturaRepair.breakdown.actuadores} />
                  <FacturaRow label="Retros"       value={facturaRepair.breakdown.retros} />
                  <FacturaRow label="Radiadores"   value={facturaRepair.breakdown.radiadores} />
                  <FacturaRow label="Armas"        value={facturaRepair.breakdown.armas} />
                  {(autoLoaded.damage.armas?.length ?? 0) > 0 && (
                    <div className="ml-3 pl-2 border-l-2 border-outline-variant/40 text-[9px] text-secondary/60 space-y-0.5">
                      {(autoLoaded.damage.armas ?? []).map((a, i) => (
                        <div key={i} className="flex justify-between">
                          <span className={a.status === 'destruida' ? 'text-error' : 'text-cream'}>
                            {a.name} <span className="text-secondary/40">[{a.loc} {a.slotsHit}/{a.slotsTotal}]</span>
                          </span>
                          <span>{fmtMoney(a.cost)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <FacturaRow label="Munición consumida (combate)" value={facturaRepair.breakdown.municion} />
                  {autoLoaded.municionDetalle.length > 0 && (
                    <div className="ml-3 pl-2 border-l-2 border-outline-variant/40 text-[9px] text-secondary/60 space-y-0.5">
                      {autoLoaded.municionDetalle.map((d, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{d.family} ({d.spent} disp · {d.tons}t)</span>
                          <span>{fmtMoney(d.cost)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {costeMunicionFactura.total > 0 && (
                    <>
                      <FacturaRow label="Compra ton (recarga)" value={costeMunicionFactura.total} />
                      <div className="ml-3 pl-2 border-l-2 border-amber-400/40 text-[9px] text-amber-400/80 space-y-0.5">
                        {costeMunicionFactura.detalles.map(d => (
                          <div key={d.binIdx} className="flex justify-between">
                            <span>{d.family} ×{d.tonsComprar} ton</span>
                            <span>{fmtMoney(d.cost)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="border-t border-outline-variant/40 pt-2 mt-2">
                    <FacturaRow label="Subtotal" value={facturaRepair.breakdown.subtotal + costeMunicionFactura.total} color="amber" bold />
                  </div>
                  <div className="text-[9px] text-secondary/60 py-1">
                    Estado factura: {estadoFactPct}%
                  </div>
                  {/* Badge estado mech */}
                  <div
                    className="mt-2 px-3 py-2 flex items-center justify-between border"
                    style={{
                      background: `${ESTADO_COLOR[facturaRepair.breakdown.estadoMech]}15`,
                      borderColor: ESTADO_COLOR[facturaRepair.breakdown.estadoMech],
                    }}
                  >
                    <span className="text-[9px] text-secondary/60 uppercase tracking-widest">Estado Mech</span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: ESTADO_COLOR[facturaRepair.breakdown.estadoMech] }}
                    >
                      {facturaRepair.breakdown.estadoMech}
                    </span>
                  </div>
                  {facturaRepair.breakdown.destruido && (
                    <div className="mt-2 px-2 py-1 border-l-2 border-error bg-error/10 text-[9px] text-error">
                      ⚠ Reactor=3 → mech destruido. Reparación parcial sólo restaura componentes individuales.
                    </div>
                  )}
                </div>
              ) : (
                <div className="font-mono text-xs text-secondary/40 text-center py-4 italic">
                  Sin config — selecciona un mech para calcular factura.
                </div>
              )}
            </div>
          </section>

          {/* Recarga ammo (full width abajo) */}
          <section className="bg-surface-container border border-outline-variant/30 p-4 clip-chamfer">
            <h3 className="font-headline text-sm font-bold text-cream uppercase tracking-wider mb-3 flex items-center gap-2">
              <Download size={14} /> Recarga Munición Granular ({ammoBins.length})
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-surface/40 border-y border-outline-variant/20 font-mono text-[10px]">
              <label className="flex items-center gap-1">
                Skill:
                <select
                  value={techSkillAmmo}
                  onChange={e => setTechSkillAmmo(e.target.value as TechSkill)}
                  className="bg-surface-container-high border border-outline-variant/40 text-[10px] px-1 py-0.5 text-cream"
                >
                  <option value="green">Green</option>
                  <option value="regular">Regular</option>
                  <option value="veteran">Veteran</option>
                  <option value="elite">Elite</option>
                </select>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={onBattlefield} onChange={e => setOnBattlefield(e.target.checked)} />
                Campo batalla ×2
              </label>
              <span className="ml-auto text-secondary/60">
                Tiempo recarga: <span className="text-amber-400">⏱ {tiempoRecargaTotal}m</span>
                {' · '}
                Coste compra ton: <span className="text-amber-400">{fmtMoney(costeMunicionFactura.total)}</span>
              </span>
            </div>
            {ammoBins.length === 0 ? (
              <div className="font-mono text-xs text-secondary/40 text-center py-4 italic">Sin compartimentos de munición.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ammoBins.map((bin, idx) => {
                  const cur = bin.current || 0;
                  const max = bin.max || 0;
                  const faltante = max - cur;
                  const rps = roundsPerShot(bin.familyKey);
                  const cargableMax = roundsToFullRounds(faltante, bin.familyKey);
                  const { stock } = findAmmoStock(almacen, bin);
                  const cargarActual = recargaSelecc[idx] ?? 0;
                  const variantLabel = bin.variant && bin.variant !== 'Standard' ? ` (${bin.variant})` : '';
                  return (
                    <div key={idx} className="p-2 bg-surface border border-outline-variant/20 text-[10px] font-mono">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-cream font-bold">{bin.family || 'Munición'}{variantLabel}</span>
                        <span className="text-secondary/60">[{bin.loc}] {cur}/{max}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0} max={cargableMax} step={rps}
                          value={cargarActual}
                          onChange={e => setRecargaSelecc(prev => ({ ...prev, [idx]: parseInt(e.target.value) }))}
                          className="flex-1 accent-primary"
                        />
                        <span className="text-primary w-20 text-right">{cargarActual} disp</span>
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] text-secondary/60">
                        <span>Stock: <span className={stock > 0 ? 'text-primary' : 'text-error'}>{stock}</span></span>
                        {cargarActual > stock && (
                          <span className="text-amber-400">⚠ compra {Math.ceil((cargarActual - stock) / Math.max(1, max))}t</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer: factura total + botones */}
          <section className="bg-surface-container-high border border-primary/40 p-4 clip-chamfer">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 font-mono text-[10px]">
              <div className="bg-surface border border-outline-variant/20 p-2">
                <div className="text-secondary/60 uppercase tracking-widest">Reparación</div>
                <div className="text-cream text-sm font-bold">{fmtMoney(facturaRepair.total)}</div>
              </div>
              <div className="bg-surface border border-outline-variant/20 p-2">
                <div className="text-secondary/60 uppercase tracking-widest">Compra Ton</div>
                <div className="text-cream text-sm font-bold">{fmtMoney(Math.round(costeMunicionFactura.total * (estadoFactPct / 100)))}</div>
              </div>
              <div className="bg-surface border border-outline-variant/20 p-2">
                <div className="text-secondary/60 uppercase tracking-widest">Tiempo Usado</div>
                <div className="text-amber-400 text-sm font-bold">⏱ {resultadoReparacion.minutosUsadosTotal + tiempoRecargaTotal}m</div>
              </div>
              <div className="bg-primary/20 border border-primary/60 p-2">
                <div className="text-primary/80 uppercase tracking-widest">Total</div>
                <div className="text-primary text-lg font-black">{fmtMoney(facturaTotal)}</div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-end">
              <TelegramToggle context="compras" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCalcular}
                disabled={stage === 'committing' || !autoLoaded.config}
                className="flex-1 py-3 border border-outline-variant/40 hover:bg-surface-container text-secondary font-mono uppercase tracking-widest text-[11px] disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <Calculator size={14} /> Calcular Preview
              </button>
              <button
                onClick={handleConfirmar}
                disabled={stage !== 'previewed' || !autoLoaded.config}
                className="flex-1 py-3 bg-primary/30 border border-primary text-primary hover:bg-primary/50 font-mono uppercase tracking-widest text-[11px] font-bold disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {stage === 'committing' ? <>Procesando…</>
                  : stage === 'done' ? <><CheckCircle2 size={14} /> Aplicado</>
                  : stage === 'error' ? <>Error — reintentar</>
                  : <><CheckCircle2 size={14} /> Confirmar y Aplicar</>}
              </button>
              {selectedSource?.origin === 'sim' && selectedSource.simSlotIdx !== undefined && (
                <button
                  onClick={() => {
                    if (selectedSource.simSlotIdx === undefined) return;
                    restoreMechSlotFull(selectedSource.simSlotIdx);
                    setSnapVersion(v => v + 1);
                  }}
                  disabled={stage === 'committing'}
                  title="Restaura el mech a 100% en el sim. NO asienta gasto. Útil sólo para reset rápido."
                  className="flex-1 py-3 border border-amber-400/60 text-amber-400 hover:bg-amber-400/10 font-mono uppercase tracking-widest text-[11px] disabled:opacity-30"
                >
                  Restaurar SIM (sólo aplicado)
                </button>
              )}
            </div>

            {!capacity.canWork && (
              <div className="mt-3 p-2 border-l-2 border-error bg-error/10 font-mono text-[10px] text-error flex items-center gap-2">
                <AlertTriangle size={12} /> Sin equipos asignados — todo el trabajo irá a la cola pendiente.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
