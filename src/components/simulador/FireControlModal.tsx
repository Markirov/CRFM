import { useState, useEffect } from 'react';
import { Crosshair, Send } from 'lucide-react';
import { useSimulador } from '@/hooks/useSimulador';
import { useLiveSession } from '@/hooks/useLiveSession';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sim: ReturnType<typeof useSimulador>;
  live: ReturnType<typeof useLiveSession>;
}

export function FireControlModal({ isOpen, onClose, sim, live }: Props) {
  const [targets, setTargets] = useState<Record<number, { targetSessionId: string, targetUnitId: string, damage: number }>>({});

  const activeTab = sim.activeTab;
  const state = activeTab === 'mechs' ? sim.mechState : sim.vehicleState;
  const session = activeTab === 'mechs' ? sim.mechSession : sim.vehicleSession;

  useEffect(() => {
    if (isOpen && state && session) {
      // Inicializar el estado de daños
      const initialTargets: Record<number, { targetSessionId: string, targetUnitId: string, damage: number }> = {};
      state.weapons.forEach((w: any) => {
        if (session.activeShots[w.id]) {
          const baseDmg = parseInt(w.dmg) || 0;
          initialTargets[w.id] = { targetSessionId: '', targetUnitId: '', damage: baseDmg };
        }
      });
      setTargets(initialTargets);
    }
  }, [isOpen, state, session]);

  if (!isOpen || !state || !session) return null;

  const activeWeapons = state.weapons.filter((w: any) => session.activeShots[w.id]);

  if (activeWeapons.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-surface-container border border-error/60 clip-chamfer p-6 max-w-sm w-full shadow-2xl text-center">
          <Crosshair size={32} className="text-error mx-auto mb-3" />
          <h3 className="font-headline text-lg text-error font-bold uppercase tracking-widest mb-2">
            Sin Armas Activas
          </h3>
          <p className="font-mono text-xs text-secondary/60 mb-6">
            No has seleccionado ninguna arma para disparar. Haz clic en las armas de tu lista primero.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-outline-variant/40 hover:bg-surface-container-high text-secondary transition-colors font-mono uppercase text-xs"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const handleSendAttacks = async () => {
    let sourceName = 'Unidad Local';
    if (sim.activeTab === 'mechs' && sim.mechState) sourceName = `${sim.mechState.chassis} ${sim.mechState.model}`;
    else if (sim.activeTab === 'vehicles' && sim.vehicleState) sourceName = sim.vehicleState.name;

    // Retiramos los envíos previos de esta unidad este turno para no duplicar si se editan y reenvían
    await live.revokeMyAttacks(sourceName);

    activeWeapons.forEach((w: any) => {
      const t = targets[w.id];
      if (t && t.targetSessionId && t.targetUnitId && t.damage > 0) {
        live.sendAttack(t.targetSessionId, t.targetUnitId, sourceName, w.name, t.damage);
      }
    });

    onClose();
  };

  const hasAnyValidTarget = activeWeapons.some((w: any) => {
    const t = targets[w.id];
    return t && t.targetSessionId && t.targetUnitId && t.damage > 0;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container border-2 border-error/80 clip-chamfer p-5 max-w-2xl w-full shadow-[0_0_50px_-12px_rgba(255,0,0,0.3)]">
        <h3 className="font-headline text-xl text-error font-bold uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-error/30 pb-3">
          <Crosshair size={24} /> Fijar Blancos y Disparar
        </h3>
        
        <p className="font-mono text-[10px] text-secondary/60 mb-4 uppercase">
          Asigna un objetivo a cada arma. Puedes ajustar el daño final (para misiles o modificadores).
        </p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {activeWeapons.map((w: any) => {
            const t = targets[w.id] || { targetSessionId: '', targetUnitId: '', damage: 0 };
            
            return (
              <div key={w.id} className="bg-surface-container-low border border-error/30 p-3 clip-chamfer flex flex-col md:flex-row gap-3 items-start md:items-center">
                
                <div className="flex-1">
                  <div className="font-bold text-error uppercase font-mono text-xs">{w.name}</div>
                  <div className="text-[9px] text-secondary/50 font-mono uppercase">Original: {w.dmg} DMG</div>
                </div>

                <div className="flex-1 w-full">
                  {live.sessions.length === 0 ? (
                    <div className="text-[10px] font-mono text-secondary/40 italic p-2 border border-outline-variant/20">Sin contactos en radar</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {/* Botón de Fallo / Descarte (actúa como el objetivo nulo) */}
                      <button
                        onClick={() => {
                          setTargets(prev => ({
                            ...prev,
                            [w.id]: { 
                              ...prev[w.id], 
                              targetSessionId: '', 
                              targetUnitId: '' 
                            }
                          }));
                        }}
                        className={`px-3 py-1.5 font-mono text-[9px] uppercase border clip-chamfer transition-all text-left ${
                          (!t.targetSessionId && !t.targetUnitId)
                            ? 'bg-outline-variant/30 border-outline-variant text-secondary shadow-[0_0_10px_-2px_rgba(255,255,255,0.1)]' 
                            : 'bg-surface-container-high border-outline-variant/40 text-secondary/60 hover:border-secondary/60 hover:text-secondary'
                        }`}
                      >
                        <div className="font-bold">✕ Fallo / Nada</div>
                      </button>

                      {live.sessions.flatMap(sess => 
                        sess.units.map(u => {
                          if (u.isDestroyed) return null;
                          const isSelected = t.targetSessionId === sess.id && t.targetUnitId === u.id;
                          return (
                            <button
                              key={`${sess.id}-${u.id}`}
                              onClick={() => {
                                setTargets(prev => ({
                                  ...prev,
                                  [w.id]: { 
                                    ...prev[w.id], 
                                    targetSessionId: isSelected ? '' : sess.id, 
                                    targetUnitId: isSelected ? '' : u.id 
                                  }
                                }));
                              }}
                              className={`px-3 py-1.5 font-mono text-[9px] uppercase border clip-chamfer transition-all text-left ${
                                isSelected 
                                  ? 'bg-error/20 border-error text-error shadow-[0_0_10px_-2px_rgba(255,0,0,0.3)]' 
                                  : 'bg-surface-container-high border-outline-variant/40 text-secondary hover:border-error/40 hover:text-error'
                              }`}
                            >
                              <div className="font-bold">{u.name}</div>
                              <div className="text-[7px] opacity-60 mt-0.5">{sess.playerName}</div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-24">
                  <div className="flex items-center bg-surface-container-high border border-error/40">
                    <input 
                      type="number" 
                      min="0"
                      value={t.damage}
                      onChange={(e) => {
                        setTargets(prev => ({
                          ...prev,
                          [w.id]: { ...prev[w.id], damage: parseInt(e.target.value) || 0 }
                        }));
                      }}
                      className="w-full bg-transparent text-error font-bold text-center py-1 font-mono text-sm focus:outline-none"
                    />
                    <span className="text-[9px] font-mono text-error/60 pr-2">DMG</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-error/20">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant/40 hover:bg-surface-container-high text-secondary transition-colors font-mono uppercase tracking-widest text-[11px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendAttacks}
            disabled={!hasAnyValidTarget}
            className="flex-1 py-3 bg-error hover:bg-error/80 text-on-error transition-colors font-mono uppercase tracking-widest text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={16} /> Enviar Impactos
          </button>
        </div>

      </div>
    </div>
  );
}
