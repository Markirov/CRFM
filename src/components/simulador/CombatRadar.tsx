import { useState } from 'react';
import { Crosshair, Radio, ShieldAlert } from 'lucide-react';
import { useSimulador } from '@/hooks/useSimulador';
import { useLiveSession, type LiveSession, type LiveUnit, type IncomingDamage } from '@/hooks/useLiveSession';

interface Props {
  sim: ReturnType<typeof useSimulador>;
  live: ReturnType<typeof useLiveSession>;
}

export function CombatRadar({ sim, live }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      {/* Botón Radar (siempre visible, indica estado) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border transition-all font-mono text-[10px] uppercase tracking-widest clip-chamfer ${
          live.isLive 
            ? 'border-error/60 bg-error/10 text-error hover:bg-error/20' 
            : 'border-outline-variant/40 hover:border-primary-container text-secondary/60 hover:text-primary-container bg-surface-container-low'
        }`}
      >
        <Radio size={14} className={live.isLive ? 'animate-pulse' : ''} /> 
        Radar {live.isLive ? 'Activo' : 'Inactivo'}
      </button>

      {/* Panel Desplegable */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 md:w-72 bg-surface-container/95 backdrop-blur-md border border-outline-variant/30 shadow-2xl z-50 clip-chamfer">
          
          {/* Header del Panel con el Switch On/Off */}
          <div className="p-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
            <span className="font-headline text-[10px] uppercase tracking-widest text-primary-container flex items-center gap-2">
              <Crosshair size={12} /> Contactos
            </span>
            <button 
              onClick={live.toggleLive}
              className={`px-3 py-1 font-mono text-[9px] uppercase tracking-widest clip-chamfer transition-colors border ${
                live.isLive 
                  ? 'bg-error/20 border-error/50 text-error hover:bg-error/40' 
                  : 'bg-primary/20 border-primary/50 text-primary hover:bg-primary/40'
              }`}
            >
              {live.isLive ? 'Apagar Radar' : 'Encender Radar'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-3 custom-scrollbar">
            {!live.isLive ? (
              <div className="text-center font-mono text-[10px] text-secondary/40 py-6 italic">
                Radar desconectado.<br/><br/>Enciéndelo para compartir telemetría y ver unidades enemigas en red.
              </div>
            ) : live.sessions.length === 0 ? (
              <div className="text-center font-mono text-[10px] text-secondary/40 py-4 italic">Buscando señales...</div>
            ) : (
              live.sessions.map(sess => (
                <div key={sess.id} className="space-y-1">
                  <div className="font-mono text-[9px] text-primary-container uppercase border-b border-outline-variant/20 pb-0.5">
                    {sess.playerName}
                  </div>
                  {sess.units.map(u => (
                    <div key={u.id} className={`flex items-center justify-between p-1.5 text-[10px] font-mono border-l-2 ${u.isDestroyed ? 'opacity-30 border-secondary' : 'border-error/40 hover:bg-surface-container-high'}`}>
                      <div className="flex-1 truncate pr-2">
                        <span className={u.isDestroyed ? 'line-through' : ''}>{u.name}</span>
                        <span className="block text-[8px] text-secondary/60">{u.pilot}</span>
                      </div>
                      {!u.isDestroyed && (
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] ${u.hpPercent < 30 ? 'text-error' : u.hpPercent < 70 ? 'text-amber-400' : 'text-primary-container'}`}>
                            {u.hpPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente para recibir ataques
export function IncomingAttacks({ sim, live }: Props) {
  if (!live.isLive || !live.mySession || !live.mySession.incomingDamage?.length) return null;

  return (
    <div className="fixed bottom-24 right-6 w-72 z-40 space-y-2">
      {live.mySession.incomingDamage.map((atk: IncomingDamage) => {
        // Encontrar en qué slot está este ID
        const mechIdx = sim.mechSlots.findIndex((_, i) => `mech_${i}` === atk.targetUnitId);
        const vehIdx = sim.vehicleSlots.findIndex((_, i) => `vehicle_${i}` === atk.targetUnitId);
        
        let targetName = 'Desconocido';
        if (mechIdx >= 0) targetName = sim.mechSlots[mechIdx].state?.model || `Mech ${mechIdx+1}`;
        if (vehIdx >= 0) targetName = sim.vehicleSlots[vehIdx].state?.name || `Vehículo ${vehIdx+1}`;

        return (
          <div key={atk.id} className="bg-surface-container-high border-l-4 border-l-error shadow-xl p-3 animate-[fadeInUp_0.3s_ease]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-error font-headline text-[11px] uppercase tracking-widest">
                <ShieldAlert size={14} className="animate-pulse" />
                Impacto Entrante
              </div>
              <span className="font-mono text-[8px] text-secondary/40">
                {new Date(atk.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="mt-2 font-mono text-[11px] text-secondary/80">
              <span className="text-error font-bold">{atk.sourceSessionName}</span> impacta a <span className="text-primary-container font-bold">{targetName}</span>
            </div>
            <div className="mt-1 font-mono text-[12px] bg-error/10 p-1.5 border border-error/20 text-error">
              {atk.weaponName} <span className="float-right font-bold">{atk.damage} DMG</span>
            </div>

            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => live.resolveAttack(atk)}
                className="flex-1 py-1.5 border border-outline-variant/40 hover:bg-surface-container-highest text-secondary/60 hover:text-secondary font-mono text-[9px] uppercase transition-colors"
              >Ignorar / Fallo</button>
              <button 
                onClick={() => {
                  // Pre-seleccionar el slot correcto y fijar el amount de daño, para que el usuario solo clique en ArmorDiagram
                  if (mechIdx >= 0) {
                    sim.setActiveTab('mechs');
                    sim.setCurrentMechIdx(mechIdx);
                  } else if (vehIdx >= 0) {
                    sim.setActiveTab('vehicles');
                    sim.setCurrentVehicleIdx(vehIdx);
                  }
                  sim.setDamageAmount(atk.damage);
                  live.resolveAttack(atk);
                }}
                className="flex-1 py-1.5 border border-error bg-error/20 hover:bg-error/40 text-error font-mono text-[9px] uppercase font-bold transition-colors"
              >Asignar Daño</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
