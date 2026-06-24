// ════════════════════════════════════════════════════════════════
//  ColaTab — Vista cola pendiente cross-mech (Sprint Integración refino)
//
//  Agrupa items pendientes per mech. Permite ejecutar (descontar tiempo
//  + sacar de cola) o cancelar. Items persisten en taller-shared store
//  (localStorage zustand persist).
// ════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { loadHangar } from '@/lib/firebase-service';
import { useEffect, useState } from 'react';
import { type HangarItem } from '@/lib/hangar-types';
import { loadLocalSnapshot, type SimuladorSnapshot } from '@/lib/simulador-persistence';
import { buildMechSources, type MechSource } from '@/lib/taller-sources';
import {
  useTallerShared,
  getMechCapacity,
  getPoolUsage,
} from '@/lib/taller-shared';
import {
  calcularMinutosDisponibles,
  MINUTOS_EXTRA_POR_TURNO,
} from '@/lib/repair-priority';
import { Clock, Play, Trash2, AlertTriangle, Users } from 'lucide-react';

export function ColaTab() {
  const roster = useAppStore(s => s.roster);
  const [hangarItems, setHangarItems] = useState<HangarItem[]>([]);
  const [snap, setSnap] = useState<SimuladorSnapshot | null>(null);

  useEffect(() => {
    loadHangar().then(res => {
      if (res?.success && Array.isArray((res.data as any)?.items)) {
        setHangarItems((res.data as any).items as HangarItem[]);
      }
    }).catch(() => {});
    setSnap(loadLocalSnapshot());
  }, []);

  const sources = useMemo<MechSource[]>(() => {
    return buildMechSources(hangarItems, snap, roster);
  }, [hangarItems, snap, roster]);

  const sourceByKey = useMemo(() => {
    const m = new Map<string, MechSource>();
    for (const s of sources) m.set(s.key, s);
    return m;
  }, [sources]);

  const tiempoGlobal = useTallerShared(s => s.tiempoGlobal);
  const asignaciones = useTallerShared(s => s.asignaciones);
  const cola = useTallerShared(s => s.cola);
  const consumeMechTime = useTallerShared(s => s.consumeMechTime);
  const removeFromCola = useTallerShared(s => s.removeFromCola);
  const clearCola = useTallerShared(s => s.clearCola);

  const tiempoCalc = useMemo(
    () => calcularMinutosDisponibles({ ...tiempoGlobal, turnosExtendidos: 0 }),
    [tiempoGlobal],
  );

  const poolUsage = useMemo(() => getPoolUsage(asignaciones), [asignaciones]);

  // Mechs que tienen cola
  const mechKeysConCola = useMemo(
    () => Object.entries(cola).filter(([_, items]) => items.length > 0).map(([k]) => k),
    [cola],
  );

  const handleEjecutar = (mechKey: string, itemId: string, minutos: number) => {
    consumeMechTime(mechKey, minutos);
    removeFromCola(mechKey, itemId);
  };

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-6xl mx-auto">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-1 flex items-center gap-2">
        <Clock size={20} /> Cola Pendiente
      </h1>
      <p className="font-mono text-[10px] text-secondary/60 mb-4 uppercase tracking-widest">
        Items persisten entre sesiones. Asigna equipos al mech en Prioridades antes de ejecutar.
      </p>

      {/* Resumen pool global */}
      <div className="mb-4 p-3 bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center gap-4 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-amber-400" />
          <span className="text-secondary/70">Tiempo global:</span>
          <span className="text-amber-400 font-bold">{tiempoGlobal.valor} {tiempoGlobal.unidad}</span>
          <span className="text-secondary/50">({tiempoCalc.minutosBase} min base)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-primary-container" />
          <span className="text-secondary/70">Pool en uso:</span>
          <span className="text-primary-container font-bold">{poolUsage.teamsUsed} eq · {poolUsage.astechsUsed} astech</span>
        </div>
      </div>

      {mechKeysConCola.length === 0 ? (
        <div className="text-center py-12 text-secondary/40 font-mono text-sm italic">
          Sin items pendientes. Cuando recargas munición o mantenimiento y no hay
          equipos asignados, los items aparecen aquí.
        </div>
      ) : (
        <div className="space-y-4">
          {mechKeysConCola.map(mechKey => {
            const items = cola[mechKey] ?? [];
            const source = sourceByKey.get(mechKey);
            const cap = getMechCapacity(asignaciones[mechKey], tiempoCalc.minutosBase, MINUTOS_EXTRA_POR_TURNO);
            const totalPending = items.reduce((s, i) => s + i.minutosBase, 0);

            return (
              <div key={mechKey} className="bg-surface-container border border-outline-variant/30 p-3 clip-chamfer">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-2">
                  <div className="font-headline text-sm font-bold text-cream uppercase tracking-wider">
                    {source?.mechName ?? mechKey}
                    <span className="ml-2 text-[9px] font-mono text-secondary/50 normal-case">
                      ({source?.origin === 'sim' ? 'Simulador' : 'Hangar'})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    <span className={cap.canWork ? 'text-primary' : 'text-error'}>
                      {cap.teamsCount} eq · {cap.astechsCount} astech
                    </span>
                    <span className="text-amber-400" title="Minutos restantes pool">
                      {cap.minutosRestantes}/{cap.minutosDisponibles} min
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`¿Borrar toda la cola de ${source?.mechName ?? mechKey}?`)) {
                          clearCola(mechKey);
                        }
                      }}
                      className="text-error/60 hover:text-error"
                      title="Borrar cola completa"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {!cap.canWork && (
                  <div className="px-2 py-1 mb-2 bg-error/10 border-l-2 border-error font-mono text-[9px] text-error flex items-center gap-1">
                    <AlertTriangle size={10} /> Sin equipos asignados — no se puede ejecutar.
                  </div>
                )}

                <div className="space-y-1">
                  {items.map(item => {
                    const overTime = item.minutosBase > cap.minutosRestantes;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 border text-[10px] font-mono ${
                          overTime ? 'border-error/40 bg-error/5' : 'border-outline-variant/30 bg-surface'
                        }`}
                      >
                        <div className="flex-1">
                          <span className="text-cream">{item.componenteName}</span>
                          <span className="ml-2 text-secondary/60">[{item.categoria}]</span>
                          <span className="ml-2 text-secondary/40 text-[9px]">
                            {item.createdAt.slice(0, 10)}
                          </span>
                        </div>
                        <span className={`mr-3 ${overTime ? 'text-error' : 'text-amber-400'}`}>
                          ⏱ {item.minutosBase} min
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEjecutar(mechKey, item.id, item.minutosBase)}
                            disabled={!cap.canWork || overTime}
                            className="px-2 py-0.5 border border-primary/60 text-primary text-[9px] uppercase hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                            title={overTime ? 'Excede tiempo restante' : 'Ejecutar — descuenta del pool'}
                          >
                            <Play size={10} /> Ejecutar
                          </button>
                          <button
                            onClick={() => removeFromCola(mechKey, item.id)}
                            className="text-error/60 hover:text-error px-1"
                            title="Cancelar item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-2 pt-2 border-t border-outline-variant/20 font-mono text-[10px]">
                  <span className="text-secondary/60">Total cola:</span>
                  <span className="text-amber-400 font-bold">⏱ {totalPending} min</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
