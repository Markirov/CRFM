import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { loadHangar, saveConfigBatch, saveHangarItem } from '@/lib/firebase-service';
import { loadLocalSnapshot, saveLocalSnapshot, type SimuladorSnapshot } from '@/lib/simulador-persistence';
import { buildMechSources, type MechSource } from '@/lib/taller-sources';
import { MechSourcePicker } from '@/components/taller/MechSourcePicker';
import { type HangarItem } from '@/lib/hangar-types';
import { type AmmoBin } from '@/lib/combat-types';
import { Database, Download, Upload, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { findAmmoStock, ammoKeyFromBin, roundsPerShot, roundsToFullRounds, familyKeyNormalize } from '@/lib/almacen-keys';
import { calcAmmoReloadTime, type TechSkill } from '@/lib/camops-canon';
import { useTallerShared, getMechCapacity } from '@/lib/taller-shared';
import { calcularMinutosDisponibles, MINUTOS_EXTRA_POR_TURNO } from '@/lib/repair-priority';

export function MunicionTab() {
  const campaign = useAppStore(s => s.campaign);
  const setCampaign = useAppStore(s => s.setCampaign);
  const roster = useAppStore(s => s.roster);
  const almacen = campaign.almacen || {};

  const [hangarItems, setHangarItems] = useState<HangarItem[]>([]);
  const [snapVersion, setSnapVersion] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // CamOps recarga: skill técnico + battlefield. Default regular, no battlefield.
  // teams ahora vienen del pool compartido per mech.
  const [techSkill, setTechSkill] = useState<TechSkill>('regular');
  const [onBattlefield, setOnBattlefield] = useState<boolean>(false);

  // ── Pool tiempo + equipos compartido ──
  const tiempoGlobal = useTallerShared(s => s.tiempoGlobal);
  const asignaciones = useTallerShared(s => s.asignaciones);
  const consumeMechTime = useTallerShared(s => s.consumeMechTime);
  const addToCola = useTallerShared(s => s.addToCola);
  const cola = useTallerShared(s => s.cola);
  const removeFromCola = useTallerShared(s => s.removeFromCola);

  const tiempoCalc = useMemo(
    () => calcularMinutosDisponibles({ ...tiempoGlobal, turnosExtendidos: 0 }),
    [tiempoGlobal],
  );

  useEffect(() => {
    loadHangar().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.items)) {
        setHangarItems((res.data as any).items as HangarItem[]);
      }
    }).catch(() => {});
  }, []);

  const snap = useMemo(() => loadLocalSnapshot(), [snapVersion]);

  const sources = useMemo<MechSource[]>(() => {
    return buildMechSources(hangarItems, snap, roster);
  }, [hangarItems, snap, roster]);

  const selectedSource = useMemo(() => sources.find(s => s.key === selectedKey), [sources, selectedKey]);

  // ── Capacidad y equipos: depende de selectedSource ──
  const mechKey = selectedSource?.key ?? '';
  const mechAssignment = mechKey ? asignaciones[mechKey] : undefined;
  const capacity = useMemo(
    () => getMechCapacity(mechAssignment, tiempoCalc.minutosBase, MINUTOS_EXTRA_POR_TURNO),
    [mechAssignment, tiempoCalc.minutosBase],
  );
  // teams para CamOps mults — count desde asignación
  const teams = Math.max(1, capacity.teamsCount);

  // Munición: soporta tanto sim como hangar (si tiene sessionActiva)
  const isSimSlot = selectedSource?.origin === 'sim';
  const simSlotIdx = selectedSource?.simSlotIdx;

  // AmmoBins: del sim slot o del hangarItem.sessionActiva
  const ammoBins = useMemo<AmmoBin[]>(() => {
    if (isSimSlot && simSlotIdx !== undefined && snap) {
      return (snap.mechSlots[simSlotIdx]?.session?.ammoBins || []) as AmmoBin[];
    }
    // Hangar: leer sessionActiva.ammoBins si existe
    if (selectedSource?.origin === 'hangar' && selectedSource.hangarId) {
      const item = hangarItems.find(h => h.id === selectedSource.hangarId);
      if (item?.sessionActiva?.ammoBins) {
        return item.sessionActiva.ammoBins as AmmoBin[];
      }
    }
    return [];
  }, [isSimSlot, simSlotIdx, snap, selectedSource, hangarItems]);

  const canManageAmmo = ammoBins.length > 0;

  /** Tiempo total estimado para recargar TODOS los bins disponibles (skill+teams+battlefield). */
  const tiempoTotalRecargaMin = useMemo(() => {
    let total = 0;
    for (const bin of ammoBins) {
      const faltante = Math.max(0, (bin.max || 0) - (bin.current || 0));
      if (faltante <= 0) continue;
      const rps = roundsPerShot(bin.familyKey);
      const cargable = roundsToFullRounds(faltante, bin.familyKey);
      const { stock } = findAmmoStock(almacen, bin);
      const cantidad = Math.min(cargable, roundsToFullRounds(stock, bin.familyKey));
      if (cantidad <= 0 || !bin.max) continue;
      const tons = cantidad / bin.max;
      total += calcAmmoReloadTime(tons, techSkill, teams, onBattlefield);
    }
    return total;
  }, [ammoBins, almacen, techSkill, teams, onBattlefield]);

  /** Recarga un bin usando rondas completas desde el almacén. */
  const handleRecargarBin = async (binIdx: number) => {
    const bin = ammoBins[binIdx];
    if (!bin) return;

    const faltante = Math.max(0, (bin.max || 0) - (bin.current || 0));
    if (faltante <= 0) return;

    // Sin equipos asignados → ir a cola pendiente
    if (!capacity.canWork) {
      const ok = confirm(`No hay equipos asignados a ${selectedSource?.mechName || 'este mech'}.\n¿Añadir recarga de ${bin.family || 'Munición'}${bin.variant ? ` (${bin.variant})` : ''} a la cola pendiente?`);
      if (!ok) return;
      addToCola({
        mechKey,
        componenteName: `Recarga ${bin.family || 'Munición'} (${bin.loc})`,
        minutosBase: 30,
        categoria: 'Munición',
      });
      return;
    }

    // Redondear a rondas completas
    const rps = roundsPerShot(bin.familyKey);
    const cargable = roundsToFullRounds(faltante, bin.familyKey);
    if (cargable <= 0) {
      alert(`Faltan ${faltante} misiles pero una ronda completa necesita ${rps}. No se puede cargar una ronda parcial.`);
      return;
    }

    // Buscar stock
    const { key: ammoKey, stock } = findAmmoStock(almacen, bin);
    if (stock < cargable) {
      const rondasDisponibles = roundsToFullRounds(stock, bin.familyKey);
      if (rondasDisponibles <= 0) {
        alert(`No hay suficiente ${familyKeyNormalize(bin.familyKey)} ${bin.variant || 'Standard'} en el almacén.\nNecesitas al menos ${rps} (1 ronda). Stock actual: ${stock}.`);
        return;
      }
      // Cargar lo que se pueda
      const ok = confirm(`Solo hay ${stock} misiles de ${familyKeyNormalize(bin.familyKey)} en stock.\nSe cargarán ${rondasDisponibles} (${rondasDisponibles / rps} rondas completas).\n\n¿Continuar?`);
      if (!ok) return;
      await doRecargar(binIdx, rondasDisponibles, ammoKey);
    } else {
      await doRecargar(binIdx, cargable, ammoKey);
    }
  };

  /** Ejecuta la recarga real. */
  const doRecargar = async (binIdx: number, cantidad: number, ammoKey: string) => {
    // Calcular tiempo consumido CamOps según skill+teams+battlefield
    const bin = ammoBins[binIdx];
    const binMax = bin?.max || 1;
    const tons = cantidad / binMax;
    const tiempoMin = calcAmmoReloadTime(tons, techSkill, teams, onBattlefield);

    // Si excede tiempo restante → ofrecer cola
    if (tiempoMin > capacity.minutosRestantes) {
      const ok = confirm(
        `Recarga necesita ${tiempoMin} min pero solo quedan ${capacity.minutosRestantes} min.\n¿Añadir a cola pendiente del mech?`,
      );
      if (!ok) return;
      addToCola({
        mechKey,
        componenteName: `Recarga ${bin?.family || 'Munición'} ×${cantidad}`,
        minutosBase: tiempoMin,
        categoria: 'Munición',
      });
      return;
    }

    const newAlmacen = { ...almacen };
    newAlmacen[ammoKey] = Math.max(0, (newAlmacen[ammoKey] || 0) - cantidad);

    // Descuenta tiempo del pool del mech
    if (mechKey && tiempoMin > 0) consumeMechTime(mechKey, tiempoMin);

    if (isSimSlot && simSlotIdx !== undefined && snap) {
      // Sim slot: actualizar snapshot local
      const newSnap = { ...snap };
      if (!newSnap.mechSlots[simSlotIdx].session) return;
      const newBins = [...(newSnap.mechSlots[simSlotIdx].session!.ammoBins || [])] as AmmoBin[];
      newBins[binIdx] = { ...newBins[binIdx], current: Math.min(newBins[binIdx].max, (newBins[binIdx].current || 0) + cantidad) };
      newSnap.mechSlots[simSlotIdx].session!.ammoBins = newBins;
      saveLocalSnapshot(newSnap);
    } else if (selectedSource?.origin === 'hangar' && selectedSource.hangarId) {
      // Hangar: actualizar sessionActiva
      const item = hangarItems.find(h => h.id === selectedSource.hangarId);
      if (item?.sessionActiva?.ammoBins) {
        const newBins = [...item.sessionActiva.ammoBins] as AmmoBin[];
        newBins[binIdx] = { ...newBins[binIdx], current: Math.min(newBins[binIdx].max, (newBins[binIdx].current || 0) + cantidad) };
        item.sessionActiva.ammoBins = newBins;
        await saveHangarItem(item);
        setHangarItems(prev => prev.map(h => h.id === item.id ? { ...item } : h));
      }
    }

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    setSnapVersion(v => v + 1);
  };

  /** Vacía un bin al fondo común del almacén. */
  const handleVaciarBin = async (binIdx: number) => {
    const bin = ammoBins[binIdx];
    if (!bin || !bin.current || bin.current <= 0) return;

    const qty = bin.current;
    const ammoKey = ammoKeyFromBin(bin);

    const newAlmacen = { ...almacen };
    newAlmacen[ammoKey] = (newAlmacen[ammoKey] || 0) + qty;

    if (isSimSlot && simSlotIdx !== undefined && snap) {
      const newSnap = { ...snap };
      if (!newSnap.mechSlots[simSlotIdx].session) return;
      const newBins = [...(newSnap.mechSlots[simSlotIdx].session!.ammoBins || [])] as AmmoBin[];
      newBins[binIdx] = { ...newBins[binIdx], current: 0 };
      newSnap.mechSlots[simSlotIdx].session!.ammoBins = newBins;
      saveLocalSnapshot(newSnap);
    } else if (selectedSource?.origin === 'hangar' && selectedSource.hangarId) {
      const item = hangarItems.find(h => h.id === selectedSource.hangarId);
      if (item?.sessionActiva?.ammoBins) {
        const newBins = [...item.sessionActiva.ammoBins] as AmmoBin[];
        newBins[binIdx] = { ...newBins[binIdx], current: 0 };
        item.sessionActiva.ammoBins = newBins;
        await saveHangarItem(item);
        setHangarItems(prev => prev.map(h => h.id === item.id ? { ...item } : h));
      }
    }

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    setSnapVersion(v => v + 1);
  };

  /** Vacía todos los bins al fondo común. */
  const handleVaciarTodo = async () => {
    if (ammoBins.every(b => !b.current || b.current <= 0)) return;

    const newAlmacen = { ...almacen };
    const newBinsArr: AmmoBin[] = ammoBins.map(bin => {
      if (!bin || !bin.current || bin.current <= 0) return bin;
      const ammoKey = ammoKeyFromBin(bin);
      newAlmacen[ammoKey] = (newAlmacen[ammoKey] || 0) + bin.current;
      return { ...bin, current: 0 };
    });

    if (isSimSlot && simSlotIdx !== undefined && snap) {
      const newSnap = { ...snap };
      if (!newSnap.mechSlots[simSlotIdx].session) return;
      newSnap.mechSlots[simSlotIdx].session!.ammoBins = newBinsArr;
      saveLocalSnapshot(newSnap);
    } else if (selectedSource?.origin === 'hangar' && selectedSource.hangarId) {
      const item = hangarItems.find(h => h.id === selectedSource.hangarId);
      if (item?.sessionActiva) {
        item.sessionActiva.ammoBins = newBinsArr;
        await saveHangarItem(item);
        setHangarItems(prev => prev.map(h => h.id === item.id ? { ...item } : h));
      }
    }

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    setSnapVersion(v => v + 1);
  };

  return (
    <div className="space-y-4">
      <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2">
          Seleccionar Mech
        </label>
        <MechSourcePicker
          sources={sources}
          selectedKey={selectedKey}
          onSelect={key => setSelectedKey(key)}
        />
      </section>

      {selectedSource && !canManageAmmo && (
        <div className="bg-surface border border-outline-variant/20 p-4 rounded text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-sm text-amber-400">Sin datos de munición</span>
          </div>
          <p className="font-mono text-xs text-secondary/70">
            Este mech no tiene datos de munición guardados.
            {selectedSource.origin === 'hangar' && ' Entra al Simulador en modo campaña para generar los datos de combate.'}
          </p>
        </div>
      )}

      {selectedSource && canManageAmmo && (
        <div className="bg-surface-container-low border border-primary-container/30 p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="font-headline font-bold text-lg text-primary-container flex items-center gap-2">
                <Database className="w-5 h-5" /> Compartimentos de Munición
              </h3>
              <p className="font-mono text-xs text-secondary/60 uppercase tracking-widest mt-1">
                {selectedSource.mechName}
                <span className="ml-2 text-secondary/40">
                  ({selectedSource.origin === 'sim' ? 'Simulador' : 'Hangar'})
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {ammoBins.some(b => (b.current || 0) > 0) && (
                <button
                  onClick={handleVaciarTodo}
                  className="flex items-center gap-2 bg-surface-container hover:bg-error/20 text-error/80 px-3 py-1.5 rounded border border-error/30 font-mono text-xs uppercase transition-colors"
                  title="Transferir toda la munición restante al almacén (fondo común)"
                >
                  <Upload className="w-3 h-3" />
                  Vaciar Mech
                </button>
              )}
            </div>
          </div>

          {/* ── CamOps recarga: skill + battlefield (teams desde pool compartido) ── */}
          <div className="flex flex-wrap items-center gap-3 p-2 border-y border-outline-variant/20 bg-surface/40">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary/60">Recarga CamOps:</span>
            <label className="font-mono text-[10px] text-secondary/80 flex items-center gap-1">
              Skill:
              <select
                value={techSkill}
                onChange={e => setTechSkill(e.target.value as TechSkill)}
                className="bg-surface-container border border-outline-variant/40 text-[10px] font-mono text-cream px-1 py-0.5"
              >
                <option value="green">Green ×1.5</option>
                <option value="regular">Regular ×1.0</option>
                <option value="veteran">Veteran ×0.75</option>
                <option value="elite">Elite ×0.5</option>
              </select>
            </label>
            <label className="font-mono text-[10px] text-secondary/80 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={onBattlefield}
                onChange={e => setOnBattlefield(e.target.checked)}
                className="accent-error"
              />
              Campo batalla ×2
            </label>
            {/* Capacidad pool del mech */}
            <div className="ml-auto flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest">
              <span className="text-secondary/60">Pool {selectedSource?.mechName || 'mech'}:</span>
              <span className={capacity.canWork ? 'text-primary' : 'text-error'}>
                {capacity.teamsCount} eq · {capacity.astechsCount} astech
              </span>
              <span className="text-amber-400" title="Minutos restantes pool mech">
                {capacity.minutosRestantes}/{capacity.minutosDisponibles} min
              </span>
            </div>
          </div>
          {!capacity.canWork && (
            <div className="px-2 py-1 bg-error/10 border-l-2 border-error font-mono text-[9px] text-error">
              ⚠ Sin equipos asignados — recarga irá a cola pendiente. Asigna en pestaña Prioridades.
            </div>
          )}

          {ammoBins.length === 0 ? (
            <p className="font-mono text-sm text-secondary/60 text-center py-4">Este mech no tiene compartimentos de munición.</p>
          ) : (
            <div className="space-y-2">
              {ammoBins.map((bin, idx) => {
                const current = bin.current || 0;
                const max = bin.max || 0;
                const pct = max > 0 ? (current / max) * 100 : 0;
                const faltante = max - current;
                const rps = roundsPerShot(bin.familyKey);
                const rondasCargables = faltante > 0 ? Math.floor(faltante / rps) : 0;
                const sobrante = faltante > 0 ? faltante % rps : 0;
                const { stock } = findAmmoStock(almacen, bin);
                const variantLabel = bin.variant && bin.variant !== 'Standard'
                  ? ` (${bin.variant})`
                  : '';
                // Tons cargables = misiles cargables / misiles_por_ton (asumiendo 1 ton lleva max bin)
                const tonsCargables = rondasCargables > 0 && max > 0 ? (rondasCargables * rps) / max : 0;
                const tiempoRecargaMin = calcAmmoReloadTime(tonsCargables, techSkill, teams, onBattlefield);

                return (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-surface border border-outline-variant/20 rounded">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-sm text-cream font-bold">
                          {bin.family || 'Munición'}{variantLabel}
                        </span>
                        <span className="font-mono text-xs text-secondary/80">Loc: {bin.loc}</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${pct > 50 ? 'bg-primary-container' : pct > 20 ? 'bg-amber-400' : 'bg-error'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-mono text-[10px] text-secondary/60">{current} / {max} misiles</span>
                        <span className="font-mono text-[10px] text-secondary/40">
                          {rps > 1 ? `${rps} por ronda` : '1 por disparo'}
                          {rondasCargables > 0 && ` · ${rondasCargables} rondas cargables`}
                          {sobrante > 0 && ` (${sobrante} sobran)`}
                        </span>
                      </div>
                      {/* Stock del almacén */}
                      <div className="font-mono text-[9px] text-secondary/40 mt-0.5 flex justify-between">
                        <span>Almacén: <span className={stock > 0 ? 'text-primary' : 'text-error'}>{stock}</span> disponibles</span>
                        {tiempoRecargaMin > 0 && (
                          <span className="text-amber-400" title="Tiempo CamOps con skill/teams/battlefield">
                            ⏱ {tiempoRecargaMin} min
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVaciarBin(idx)}
                        disabled={current <= 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase border border-outline-variant/40 rounded hover:bg-surface-container disabled:opacity-30 transition-colors"
                        title="Vaciar al almacén (fondo común)"
                      >
                        <Upload className="w-3 h-3 text-secondary" /> Vaciar
                      </button>
                      <button
                        onClick={() => handleRecargarBin(idx)}
                        disabled={faltante <= 0 || rondasCargables <= 0 || stock < rps}
                        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase border border-primary-container/40 rounded hover:bg-primary-container/10 disabled:opacity-30 transition-colors text-primary-container"
                        title={`Recargar ${rondasCargables} rondas completas (${rondasCargables * rps} misiles) desde el almacén`}
                      >
                        <Download className="w-3 h-3" /> Recargar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tiempoTotalRecargaMin > 0 && (
            <div className="flex items-center justify-between p-2 mt-3 border-t border-outline-variant/30 bg-surface/40">
              <span className="font-mono text-[10px] uppercase tracking-widest text-secondary/60">
                Tiempo total recarga (todos los bins):
              </span>
              <span className="font-mono text-xs text-amber-400 font-bold" title="Suma tiempo CamOps recarga aplicada a stock disponible">
                ⏱ {tiempoTotalRecargaMin} min ({(tiempoTotalRecargaMin / 60).toFixed(1)} h)
              </span>
            </div>
          )}

          {/* ── Cola pendiente del mech ── */}
          {mechKey && cola[mechKey] && cola[mechKey].length > 0 && (
            <div className="mt-3 border-t border-amber-400/30 pt-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-2">
                Cola pendiente ({cola[mechKey].length})
              </div>
              <div className="space-y-1">
                {cola[mechKey].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-amber-400/5 border border-amber-400/30 text-[10px] font-mono">
                    <div className="flex-1">
                      <span className="text-cream">{item.componenteName}</span>
                      <span className="ml-2 text-secondary/60">[{item.categoria}]</span>
                    </div>
                    <span className="text-amber-400 mr-2">⏱ {item.minutosBase} min</span>
                    <button
                      onClick={() => removeFromCola(mechKey, item.id)}
                      className="text-error/60 hover:text-error px-1"
                      title="Quitar de la cola"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
