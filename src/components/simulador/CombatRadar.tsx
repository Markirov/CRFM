import { useState } from 'react';
import { Crosshair, Radio, ShieldAlert } from 'lucide-react';
import { useSimulador } from '@/hooks/useSimulador';
import { useLiveSession, type LiveSession, type LiveUnit, type IncomingDamage } from '@/hooks/useLiveSession';

interface Props {
  sim: ReturnType<typeof useSimulador>;
  live: ReturnType<typeof useLiveSession>;
}

export function CombatRadar({ sim, live }: Props) {
  const [targetSession, setTargetSession] = useState<LiveSession | null>(null);
  const [targetUnit, setTargetUnit] = useState<LiveUnit | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<{name: string, dmg: number} | null>(null);
  const [dmgOverride, setDmgOverride] = useState<number>(0);
  const [customWeaponName, setCustomWeaponName] = useState<string>('');

  const handleOpenAttack = (session: LiveSession, unit: LiveUnit) => {
    setTargetSession(session);
    setTargetUnit(unit);
    setSelectedWeapon(null);
    setDmgOverride(0);
    setCustomWeaponName('');
  };

  const handleSendAttack = () => {
    if (!targetSession || !targetUnit) return;
    const wName = selectedWeapon ? selectedWeapon.name : (customWeaponName || 'Ataque Genérico');
    const dmg = selectedWeapon ? (dmgOverride > 0 ? dmgOverride : selectedWeapon.dmg) : dmgOverride;
    
    if (dmg <= 0) return;

    // Obtener nombre de la unidad atacante actual
    let sourceName = 'Unidad Local';
    if (sim.activeTab === 'mechs' && sim.mechState) {
      sourceName = `${sim.mechState.chassis} ${sim.mechState.model}`;
    } else if (sim.activeTab === 'vehicles' && sim.vehicleState) {
      sourceName = sim.vehicleState.name;
    }

    live.sendAttack(targetSession.id, targetUnit.id, sourceName, wName, dmg);
    
    // Feedback visual simple
    setTargetSession(null);
    setTargetUnit(null);
  };

  if (!live.isLive) {
    return (
      <button 
        onClick={live.toggleLive}
        className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant/40 hover:border-primary-container text-secondary/60 hover:text-primary-container transition-all font-mono text-[10px] uppercase tracking-widest bg-surface-container-low clip-chamfer"
      >
        <Radio size={14} /> Radar OFF
      </button>
    );
  }

  const myWeapons = (sim.activeTab === 'mechs' && sim.mechState) ? sim.mechState.weapons : 
                    (sim.activeTab === 'vehicles' && sim.vehicleState) ? sim.vehicleState.weapons : [];

  return (
    <>
      {/* Botón Radar Activo */}
      <div className="relative group">
        <button 
          onClick={live.toggleLive}
          className="flex items-center gap-2 px-3 py-1.5 border border-error/60 bg-error/10 text-error hover:bg-error/20 transition-all font-mono text-[10px] uppercase tracking-widest clip-chamfer"
        >
          <Radio size={14} className="animate-pulse" /> Radar ON
        </button>
      </div>

      {/* Lista de Radares (Contactos) */}
      <div className="fixed top-20 right-6 w-64 bg-surface-container/95 backdrop-blur-md border border-error/30 shadow-2xl z-40 clip-chamfer hidden md:block">
        <div className="bg-error/10 p-2 border-b border-error/30 flex items-center justify-between">
          <span className="font-headline text-[10px] uppercase tracking-widest text-error">Contactos Radar</span>
          <span className="font-mono text-[9px] text-error/60">{live.sessions.length} señales</span>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-3">
          {live.sessions.length === 0 && (
            <div className="text-center font-mono text-[10px] text-secondary/40 py-4 italic">Buscando señales...</div>
          )}
          {live.sessions.map(sess => (
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
                      <button 
                        onClick={() => handleOpenAttack(sess, u)}
                        className="text-error hover:text-on-error hover:bg-error p-1 transition-colors"
                        title="Fijar Blanco"
                      >
                        <Crosshair size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Ataque */}
      {targetSession && targetUnit && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-error/60 clip-chamfer p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-headline text-sm text-error font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <Crosshair size={16} /> Fijar Blanco
            </h3>
            <div className="font-mono text-[11px] text-secondary mb-4 border-b border-outline-variant/40 pb-2">
              Atacando a <span className="text-primary-container">{targetUnit.name}</span> ({targetSession.playerName})
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block font-mono text-[9px] text-secondary/60 uppercase mb-1">Arma Seleccionada</label>
                <div className="max-h-32 overflow-y-auto border border-outline-variant/40 bg-surface-container-low">
                  {myWeapons.map((w: any) => {
                    // Parse damage to number for base dmg
                    const baseDmg = parseInt(w.dmg) || 0;
                    return (
                      <button
                        key={w.id}
                        onClick={() => { setSelectedWeapon({ name: w.name, dmg: baseDmg }); setDmgOverride(baseDmg); setCustomWeaponName(''); }}
                        className={`w-full text-left p-2 font-mono text-[10px] flex justify-between hover:bg-error/10 ${selectedWeapon?.name === w.name ? 'bg-error/20 text-error' : 'text-secondary'}`}
                      >
                        <span>{w.name}</span>
                        <span>{w.dmg} dmg</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setSelectedWeapon(null); setDmgOverride(0); }}
                    className={`w-full text-left p-2 font-mono text-[10px] flex justify-between hover:bg-error/10 ${!selectedWeapon ? 'bg-error/20 text-error' : 'text-secondary'}`}
                  >
                    <span className="italic">Ataque Físico / Otro</span>
                  </button>
                </div>
              </div>

              {!selectedWeapon && (
                <div>
                  <label className="block font-mono text-[9px] text-secondary/60 uppercase mb-1">Nombre Arma / Ataque</label>
                  <input
                    type="text"
                    value={customWeaponName}
                    onChange={(e) => setCustomWeaponName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 px-2 py-1.5 font-mono text-[11px] text-primary-container focus:outline-none focus:border-primary"
                    placeholder="Ej. Patada, Caída, Campo minado..."
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[9px] text-secondary/60 uppercase mb-1">Daño a infligir</label>
                <input
                  type="number"
                  min="1"
                  value={dmgOverride || ''}
                  onChange={(e) => setDmgOverride(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 px-2 py-1.5 font-mono text-[14px] text-error font-bold text-center focus:outline-none focus:border-error"
                />
                <p className="font-mono text-[8px] text-secondary/40 text-center mt-1">Ajusta si es ataque en racimo (misiles) o parcial</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTargetSession(null)}
                className="flex-1 px-3 py-2 border border-outline-variant/40 hover:border-outline-variant text-secondary/60 hover:text-secondary font-mono text-[10px] uppercase tracking-widest transition-colors"
              >Cancelar</button>
              <button
                onClick={handleSendAttack}
                disabled={dmgOverride <= 0}
                className="flex-1 px-3 py-2 border border-error bg-error/20 hover:bg-error/40 text-error font-mono text-[10px] uppercase tracking-widest font-bold transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
              ><Crosshair size={12} /> Disparar</button>
            </div>
          </div>
        </div>
      )}
    </>
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
