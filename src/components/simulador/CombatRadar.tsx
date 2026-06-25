import { useState } from 'react';
import { Crosshair, Radio, ShieldAlert, Dices, ChevronDown, ChevronRight } from 'lucide-react';
import { useSimulador } from '@/hooks/useSimulador';
import { useLiveSession, type IncomingDamage, type LiveRoomId } from '@/hooks/useLiveSession';
import { useAutorollPrefs, AUTOROLL_META, type AutorollPrefs } from '@/lib/autoroll-prefs';
import { rollHitLocation, rollPiloting, rollInitiative, rollAmmoExplosionAvoid, rollCritical, locKeyToCritArea, type AttackDirection } from '@/lib/dice-helpers';

function locKeyToArmorKey(locKey: string, rearArmor: boolean): string {
  if (locKey === 'CT') return rearArmor ? 'CTr' : 'CTf';
  if (locKey === 'LT') return rearArmor ? 'LTr' : 'LTf';
  if (locKey === 'RT') return rearArmor ? 'RTr' : 'RTf';
  return locKey;
}

interface Props {
  sim: ReturnType<typeof useSimulador>;
  live: ReturnType<typeof useLiveSession>;
}

export function ComputadoraCombate({ sim, live }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [autorollOpen, setAutorollOpen] = useState(false);
  const [autorollPrefs, setAutorollPref] = useAutorollPrefs();
  const anyAutoroll = (Object.keys(autorollPrefs) as Array<keyof AutorollPrefs>).some(k => autorollPrefs[k]);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const pushLog = (msg: string) => setActionLog(prev => [msg, ...prev].slice(0, 5));

  const doInitiative = () => {
    const r = rollInitiative();
    pushLog(`🎲 Init: yo ${r.myRoll.sum} vs op ${r.opponentRoll.sum} → ${r.tie ? 'EMPATE' : r.iWon ? 'GANO (actúa último)' : 'PIERDO (actúo primero)'}`);
  };

  const doPiloting = () => {
    const target = sim.pilotingTotal ?? 5;
    const r = rollPiloting(target);
    pushLog(`🎲 Pilot ${r.roll.d1}+${r.roll.d2}=${r.roll.sum} vs ${target}+ → ${r.success ? 'PASA' : 'CAE'}`);
  };

  const doAmmoExplosion = () => {
    const heat = sim.mechSession?.heat ?? 0;
    const r = rollAmmoExplosionAvoid(heat);
    if (!r) { pushLog(`Heat ${heat} < 19 → sin riesgo`); return; }
    pushLog(`🎲 Avoid Boom heat ${heat}: ${r.roll.sum} vs ${r.threshold}+ → ${r.exploded ? '💥 EXPLOTA' : 'SAFE'}`);
  };

  const doCrit = () => {
    const sel = sim.selectedSection;
    if (!sel) { pushLog('Selecciona loc primero (ArmorDiagram)'); return; }
    // Strip front/rear suffix: CTf/CTr → CT
    const baseLoc = sel.replace(/[fr]$/, '');
    const area = locKeyToCritArea(baseLoc);
    const r = rollCritical(area);
    pushLog(`🎲 Crit ${baseLoc} (${area}) ${r.roll.sum} → ${r.effect}`);
  };

  return (
    <div className="relative group">
      {/* Botón Principal */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border transition-all font-mono text-[10px] uppercase tracking-widest clip-chamfer ${
          live.isLive 
            ? 'border-error/60 bg-error/10 text-error hover:bg-error/20' 
            : 'border-outline-variant/40 hover:border-primary-container text-secondary/60 hover:text-primary-container bg-surface-container-low'
        }`}
      >
        <Radio size={14} className={live.isLive ? 'animate-pulse' : ''} /> 
        Computadora de Combate
      </button>

      {/* Panel Desplegable */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-surface-container/95 backdrop-blur-md border border-outline-variant/30 shadow-2xl z-50 clip-chamfer">
          
          {/* Header del Panel con los Switches */}
          <div className="p-3 border-b border-outline-variant/30 flex flex-col gap-2 bg-surface-container-low">
            <span className="font-headline text-[10px] uppercase tracking-widest text-primary-container flex items-center gap-2 mb-1">
              <Crosshair size={12} /> Ajustes
            </span>
            <input
              type="text"
              value={live.playerName}
              onChange={event => live.setPlayerName(event.target.value.slice(0, 40))}
              disabled={live.isLive}
              maxLength={40}
              placeholder="Nombre en el radar"
              className="w-full bg-background/50 border border-outline-variant/30 px-2 py-1 font-mono text-[9px] text-secondary focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <div className="grid grid-cols-3 gap-1">
              {live.rooms.map(room => {
                const selected = live.activeRoomId === room.id ||
                  (!live.activeRoomId && live.selectedRoomId === room.id);
                return (
                  <div key={room.id} className="flex flex-col gap-1">
                    <button
                      onClick={() => live.setSelectedRoomId(room.id as LiveRoomId)}
                      disabled={live.isLive}
                      className={`px-1 py-1 border font-mono text-[8px] uppercase tracking-wider transition-colors ${
                        selected
                          ? 'border-primary text-primary bg-primary/15'
                          : 'border-outline-variant/30 text-secondary/60'
                      } disabled:cursor-default`}
                    >
                      {room.id}
                      <span className={`block text-[7px] ${
                        room.status === 'active' ? 'text-emerald-400' : 'text-secondary/30'
                      }`}>
                        {room.status === 'active' ? 'activa' : 'cerrada'}
                      </span>
                    </button>
                    {live.canManageRooms && (
                      room.status === 'active' ? (
                        <button
                          onClick={() => live.closeRoom(room.id)}
                          disabled={live.busy}
                          className="border border-error/30 text-error/70 font-mono text-[7px] uppercase py-0.5 hover:bg-error/10 disabled:opacity-40"
                        >
                          Cerrar
                        </button>
                      ) : (
                        <button
                          onClick={() => live.openRoom(room.id)}
                          disabled={live.busy}
                          className="border border-emerald-400/30 text-emerald-400/80 font-mono text-[7px] uppercase py-0.5 hover:bg-emerald-400/10 disabled:opacity-40"
                        >
                          Abrir
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={live.toggleLive}
                disabled={live.busy || (!live.isLive && live.rooms.find(r => r.id === live.selectedRoomId)?.status !== 'active')}
                className={`flex-1 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest clip-chamfer transition-colors border ${
                  live.isLive 
                    ? 'bg-error/20 border-error/50 text-error hover:bg-error/40' 
                    : 'bg-primary/20 border-primary/50 text-primary hover:bg-primary/40'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {live.busy ? 'Conectando…' : live.isLive
                  ? `Salir de ${live.activeRoomId}`
                  : `Entrar en ${live.selectedRoomId}`}
              </button>
              <button
                onClick={() => sim.setIsSimultaneousCombat(!sim.isSimultaneousCombat)}
                className={`flex-1 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest clip-chamfer transition-colors border flex items-center justify-center gap-1 ${
                  sim.isSimultaneousCombat 
                    ? 'bg-primary/20 text-primary border-primary hover:bg-primary/30' 
                    : 'bg-outline-variant/20 text-secondary border-outline-variant hover:bg-outline-variant/30'
                }`}
                title={sim.isSimultaneousCombat ? "Combate Simultáneo Activado (Daño diferido)" : "Combate Clásico (Daño instantáneo)"}
              >
                {sim.isSimultaneousCombat ? 'Simultáneo: ON' : 'Simultáneo: OFF'}
              </button>
            </div>
            {live.error && (
              <div className="font-mono text-[8px] text-error border border-error/30 bg-error/10 px-2 py-1">
                {live.error}
              </div>
            )}
          </div>

          {/* ── Tiradas Auto (per-user prefs) ── */}
          <div className="border-b border-outline-variant/30 bg-surface-container-low/60">
            <button
              onClick={() => setAutorollOpen(!autorollOpen)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-surface-container-high/40 transition-colors"
            >
              <span className="font-headline text-[10px] uppercase tracking-widest text-primary-container flex items-center gap-2">
                <Dices size={12} /> Tiradas Auto
                {anyAutoroll && (
                  <span className="px-1 py-px text-[8px] font-mono border border-primary/60 text-primary">ON</span>
                )}
              </span>
              {autorollOpen ? <ChevronDown size={12} className="text-secondary/60" /> : <ChevronRight size={12} className="text-secondary/60" />}
            </button>
            {autorollOpen && (
              <div className="px-3 pb-3 space-y-1.5">
                {(['combat','damage','pilot'] as const).map(cat => (
                  <div key={cat} className="space-y-1">
                    <div className="font-mono text-[8px] uppercase tracking-widest text-secondary/50 pt-1">
                      {cat === 'combat' ? 'Combate' : cat === 'damage' ? 'Daño' : 'Piloto'}
                    </div>
                    {AUTOROLL_META.filter(m => m.category === cat).map(m => (
                      <label
                        key={m.key}
                        className="flex items-start gap-2 cursor-pointer hover:bg-surface-container-high/40 px-1.5 py-1 transition-colors"
                        title={m.description}
                      >
                        <input
                          type="checkbox"
                          checked={autorollPrefs[m.key]}
                          onChange={(e) => setAutorollPref(m.key, e.target.checked)}
                          className="mt-0.5 accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[10px] text-secondary/90 uppercase tracking-wide">{m.label}</div>
                          <div className="font-mono text-[8px] text-secondary/50 leading-tight">{m.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Acciones Auto (botones visibles según prefs ON) ── */}
          {(autorollPrefs.initiative || autorollPrefs.piloting || autorollPrefs.ammoExplosion || autorollPrefs.crit) && (
            <div className="px-3 py-2 border-b border-outline-variant/30 bg-surface-container-low/40 space-y-2">
              <span className="font-headline text-[10px] uppercase tracking-widest text-primary-container flex items-center gap-2">
                <Dices size={12} /> Acciones
              </span>
              <div className="flex gap-1 flex-wrap">
                {autorollPrefs.initiative && (
                  <button onClick={doInitiative} className="px-2 py-1 text-[9px] font-mono uppercase border border-primary/60 text-primary hover:bg-primary/20">
                    Init
                  </button>
                )}
                {autorollPrefs.piloting && (
                  <button onClick={doPiloting} disabled={!sim.mechSession} className="px-2 py-1 text-[9px] font-mono uppercase border border-primary/60 text-primary hover:bg-primary/20 disabled:opacity-30">
                    Pilot
                  </button>
                )}
                {autorollPrefs.ammoExplosion && (
                  <button onClick={doAmmoExplosion} disabled={!sim.mechSession} className="px-2 py-1 text-[9px] font-mono uppercase border border-error/60 text-error hover:bg-error/20 disabled:opacity-30">
                    Avoid Boom
                  </button>
                )}
                {autorollPrefs.crit && (
                  <button onClick={doCrit} disabled={!sim.selectedSection} className="px-2 py-1 text-[9px] font-mono uppercase border border-amber-400/60 text-amber-400 hover:bg-amber-400/20 disabled:opacity-30" title="Roll crit en loc seleccionada (ArmorDiagram)">
                    Crit
                  </button>
                )}
              </div>
              {actionLog.length > 0 && (
                <div className="space-y-px max-h-24 overflow-y-auto custom-scrollbar">
                  {actionLog.map((l, i) => (
                    <div key={i} className="font-mono text-[9px] text-secondary/80 leading-tight">{l}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto p-2 space-y-3 custom-scrollbar">
            {!live.isLive ? (
              <div className="text-center font-mono text-[10px] text-secondary/40 py-6 italic">
                Radar desconectado.<br/><br/>Selecciona una sala activa para compartir telemetría.
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
  const [autorollPrefs] = useAutorollPrefs();
  const [direction, setDirection] = useState<Record<string, AttackDirection>>({});
  const [hitRoll, setHitRoll] = useState<Record<string, { locLabel: string; sum: number }>>({});

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

            {/* ── Variant + heat target badge (Inferno SRM / Flamer heat) ── */}
            {(atk.ammoVariant || atk.heatToTarget) && (
              <div className="mt-1 flex gap-1 flex-wrap">
                {atk.ammoVariant && (
                  <span className="px-1 py-px text-[9px] font-mono border border-cyan-400/60 text-cyan-400">
                    {atk.ammoVariant}
                  </span>
                )}
                {atk.heatToTarget && atk.heatToTarget > 0 && (
                  <span className="px-1 py-px text-[9px] font-mono border border-amber-400/60 text-amber-400" title="Calor adicional al target — se aplica al pulsar Aplicar Impacto">
                    +{atk.heatToTarget}🔥 calor
                  </span>
                )}
              </div>
            )}

            {/* ── Direction + hit location autoroll preview ── */}
            {autorollPrefs.hitLocation && mechIdx >= 0 && (
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                <span className="text-[8px] font-mono text-secondary/60 uppercase">Dir:</span>
                {(['front','left','right','rear'] as AttackDirection[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDirection(prev => ({ ...prev, [atk.id]: d }))}
                    className={`px-1 py-px text-[8px] font-mono uppercase border ${
                      (direction[atk.id] ?? 'front') === d
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-outline-variant/40 text-secondary/60 hover:border-primary/40'
                    }`}
                  >{d}</button>
                ))}
                {hitRoll[atk.id] && (
                  <span className="px-1 py-px text-[8px] font-mono border border-cyan-400/60 text-cyan-400">
                    🎲{hitRoll[atk.id].sum} → {hitRoll[atk.id].locLabel}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  if (sim.pendingIncomingAttack && sim.pendingIncomingAttack.id !== atk.id) {
                    alert('Debes aplicar el impacto pendiente en el diagrama de armadura antes de recibir otro.');
                    return;
                  }
                  // Pre-seleccionar el slot correcto
                  if (mechIdx >= 0) {
                    sim.setActiveTab('mechs');
                    sim.setCurrentMechIdx(mechIdx);
                  } else if (vehIdx >= 0) {
                    sim.setActiveTab('vehicles');
                    sim.setCurrentVehicleIdx(vehIdx);
                  }
                  // Heat al target (Inferno / Flamer heat mode) — aplica auto al mech activo
                  if (atk.heatToTarget && atk.heatToTarget > 0 && mechIdx >= 0) {
                    sim.adjustHeat(atk.heatToTarget);
                  }
                  sim.setDamageAmount(atk.damage);
                  sim.setDamageSource(atk.sourceSessionName);
                  sim.setPendingIncomingAttack(atk);
                  // ── Autoroll hit location: pre-selecciona loc en ArmorDiagram ──
                  if (autorollPrefs.hitLocation && mechIdx >= 0) {
                    const dir = direction[atk.id] ?? 'front';
                    const res = rollHitLocation(dir);
                    const armorKey = locKeyToArmorKey(res.locKey, res.rearArmor);
                    sim.setSelectedSection(armorKey);
                    setHitRoll(prev => ({ ...prev, [atk.id]: { locLabel: res.locLabel, sum: res.roll.sum } }));
                  }
                }}
                disabled={sim.pendingIncomingAttack && sim.pendingIncomingAttack.id !== atk.id}
                className={`w-full py-2 border font-mono text-[10px] uppercase font-bold transition-colors ${
                  sim.pendingIncomingAttack?.id === atk.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                    : 'border-error bg-error/20 hover:bg-error/40 text-error disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {sim.pendingIncomingAttack?.id === atk.id ? 'Asignando en Diagrama...' : 'Aplicar Impacto'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
