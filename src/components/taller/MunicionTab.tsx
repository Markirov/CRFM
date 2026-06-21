import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { loadHangar, saveConfigBatch } from '@/lib/firebase-service';
import { loadLocalSnapshot, saveLocalSnapshot, type SimuladorSnapshot } from '@/lib/simulador-persistence';
import { buildMechSources, type MechSource } from '@/lib/taller-sources';
import { MechSourcePicker } from '@/components/taller/MechSourcePicker';
import { type HangarItem } from '@/lib/hangar-types';
import { type AmmoBin } from '@/lib/combat-types';
import { Database, Download, Upload } from 'lucide-react';

export function MunicionTab() {
  const { campaign, setCampaign, roster } = useAppStore();
  const almacen = campaign.almacen || {};

  const [hangarItems, setHangarItems] = useState<HangarItem[]>([]);
  const [snapVersion, setSnapVersion] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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

  // Munición solo se gestiona si el mech proviene del simulador (donde se guarda su estado de AmmoBins)
  const isSimSlot = selectedSource?.origin === 'sim';
  const simSlotIdx = selectedSource?.simSlotIdx;

  const ammoBins = useMemo<AmmoBin[]>(() => {
    if (!isSimSlot || simSlotIdx === undefined || !snap) return [];
    return (snap.mechSlots[simSlotIdx]?.session?.ammoBins || []) as AmmoBin[];
  }, [isSimSlot, simSlotIdx, snap]);

  const handleRecargarBin = async (binIdx: number) => {
    if (!isSimSlot || simSlotIdx === undefined || !snap) return;
    const bin = ammoBins[binIdx];
    if (!bin) return;

    const faltante = Math.max(0, (bin.max || 0) - (bin.current || 0));
    if (faltante <= 0) return;

    // Buscar tipo de munición en el almacén
    // Bin.family suele ser "LRM", "SRM", "AC/10", etc.
    const ammoKey = Object.keys(almacen).find(k => k.toLowerCase().includes('ammo') && k.toLowerCase().includes((bin.family || '').toLowerCase()));
    
    if (!ammoKey || !almacen[ammoKey] || almacen[ammoKey] < faltante) {
      alert(`No hay suficiente munición de tipo ${bin.family} en el almacén. Necesitas ${faltante} rondas/misiles.`);
      return;
    }

    // Descontar del almacén
    const newAlmacen = { ...almacen };
    newAlmacen[ammoKey] -= faltante;

    // Recargar bin
    const newSnap = { ...snap };
    if (!newSnap.mechSlots[simSlotIdx].session) return;
    const newBins = [...(newSnap.mechSlots[simSlotIdx].session!.ammoBins || [])] as AmmoBin[];
    newBins[binIdx] = { ...newBins[binIdx], current: newBins[binIdx].max };
    newSnap.mechSlots[simSlotIdx].session!.ammoBins = newBins;

    // Guardar
    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    saveLocalSnapshot(newSnap);
    setSnapVersion(v => v + 1);
  };

  const handleVaciarBin = async (binIdx: number) => {
    if (!isSimSlot || simSlotIdx === undefined || !snap) return;
    const bin = ammoBins[binIdx];
    if (!bin || !bin.current || bin.current <= 0) return;

    const qty = bin.current;

    // Buscar o crear tipo de munición en el almacén
    let ammoKey = Object.keys(almacen).find(k => k.toLowerCase().includes('ammo') && k.toLowerCase().includes((bin.family || '').toLowerCase()));
    if (!ammoKey) {
      ammoKey = `Ammo (${bin.family || 'Desconocida'})`;
    }

    const newAlmacen = { ...almacen };
    newAlmacen[ammoKey] = (newAlmacen[ammoKey] || 0) + qty;

    // Vaciar bin
    const newSnap = { ...snap };
    if (!newSnap.mechSlots[simSlotIdx].session) return;
    const newBins = [...(newSnap.mechSlots[simSlotIdx].session!.ammoBins || [])] as AmmoBin[];
    newBins[binIdx] = { ...newBins[binIdx], current: 0 };
    newSnap.mechSlots[simSlotIdx].session!.ammoBins = newBins;

    // Guardar
    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    saveLocalSnapshot(newSnap);
    setSnapVersion(v => v + 1);
  };

  const handleVaciarTodo = async () => {
    if (!isSimSlot || simSlotIdx === undefined || !snap) return;
    if (ammoBins.every(b => !b.current || b.current <= 0)) return;

    const newAlmacen = { ...almacen };
    const newSnap = { ...snap };
    if (!newSnap.mechSlots[simSlotIdx].session) return;
    const newBins = [...(newSnap.mechSlots[simSlotIdx].session!.ammoBins || [])] as AmmoBin[];

    for (let i = 0; i < newBins.length; i++) {
      const bin = newBins[i];
      if (!bin || !bin.current || bin.current <= 0) continue;
      const qty = bin.current;
      let ammoKey = Object.keys(newAlmacen).find(k => k.toLowerCase().includes('ammo') && k.toLowerCase().includes((bin.family || '').toLowerCase()));
      if (!ammoKey) ammoKey = `Ammo (${bin.family || 'Desconocida'})`;
      newAlmacen[ammoKey] = (newAlmacen[ammoKey] || 0) + qty;
      newBins[i] = { ...newBins[i], current: 0 };
    }

    newSnap.mechSlots[simSlotIdx].session!.ammoBins = newBins;

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    saveLocalSnapshot(newSnap);
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

      {selectedSource && !isSimSlot && (
        <div className="bg-surface border border-outline-variant/20 p-4 rounded text-center">
          <p className="font-mono text-sm text-secondary/70">
            La munición de los mechs en el hangar no se gestiona de forma individual. <br/>
            Carga el mech en el Simulador para gestionar sus compartimentos de munición.
          </p>
        </div>
      )}

      {selectedSource && isSimSlot && (
        <div className="bg-surface-container-low border border-primary-container/30 p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="font-headline font-bold text-lg text-primary-container flex items-center gap-2">
                <Database className="w-5 h-5" /> Compartimentos de Munición
              </h3>
              <p className="font-mono text-xs text-secondary/60 uppercase tracking-widest mt-1">
                {selectedSource.mechName}
              </p>
            </div>
            {ammoBins.some(b => (b.current || 0) > 0) && (
              <button
                onClick={handleVaciarTodo}
                className="flex items-center gap-2 bg-surface-container hover:bg-error/20 text-error/80 px-3 py-1.5 rounded border border-error/30 font-mono text-xs uppercase transition-colors"
                title="Transferir toda la munición restante al almacén"
              >
                <Upload className="w-3 h-3" />
                Vaciar Mech
              </button>
            )}
          </div>

          {ammoBins.length === 0 ? (
            <p className="font-mono text-sm text-secondary/60 text-center py-4">Este mech no tiene compartimentos de munición.</p>
          ) : (
            <div className="space-y-2">
              {ammoBins.map((bin, idx) => {
                const current = bin.current || 0;
                const max = bin.max || 0;
                const pct = max > 0 ? (current / max) * 100 : 0;
                const faltante = max - current;

                return (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-surface border border-outline-variant/20 rounded">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-sm text-cream font-bold">{bin.family || 'Munición'}</span>
                        <span className="font-mono text-xs text-secondary/80">Loc: {bin.loc}</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${pct > 50 ? 'bg-primary-container' : pct > 20 ? 'bg-amber-400' : 'bg-error'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-mono text-[10px] text-secondary/60">{current} / {max} rondas</span>
                        <span className="font-mono text-[10px] text-secondary/60">Crit: {bin.critIndex}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVaciarBin(idx)}
                        disabled={current <= 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase border border-outline-variant/40 rounded hover:bg-surface-container disabled:opacity-30 transition-colors"
                        title="Vaciar al almacén"
                      >
                        <Upload className="w-3 h-3 text-secondary" /> Vaciar
                      </button>
                      <button
                        onClick={() => handleRecargarBin(idx)}
                        disabled={faltante <= 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase border border-primary-container/40 rounded hover:bg-primary-container/10 disabled:opacity-30 transition-colors text-primary-container"
                        title={`Recargar ${faltante} rondas desde el almacén`}
                      >
                        <Download className="w-3 h-3" /> Recargar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
