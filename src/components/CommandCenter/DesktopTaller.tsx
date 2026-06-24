import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Wrench, Shield, Battery, Crosshair, Cpu, Settings, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useSimulador } from '@/hooks/useSimulador';
import type { MechSlot } from '@/lib/combat-types';

// Utility para contar slots críticos dañados en una localización
const getCriticalDamageCount = (slot: MechSlot, loc: string) => {
  if (!slot.state || !slot.session) return 0;
  const fLoc = ['CT', 'LT', 'RT'].includes(loc) ? loc + 'f' : loc;
  return (slot.session.armor as any)[fLoc] === 0 ? 1 : 0; // Fake it para la UI de diagnóstico
};

// Helper to calculate total armor damage percentage for a mech slot
const calculateDamagePct = (slot: MechSlot): number => {
  if (!slot.state || !slot.session) return 0;
  let totalMax = 0;
  let totalCurrent = 0;
  for (const loc of ['HD', 'CTf', 'CTr', 'LTf', 'LTr', 'RTf', 'RTr', 'LA', 'RA', 'LL', 'RL']) {
    totalMax += (slot.state.armor as any)[loc] || 0;
    totalCurrent += (slot.session.armor as any)[loc] || 0;
  }
  if (totalMax === 0) return 0;
  return Math.round(((totalMax - totalCurrent) / totalMax) * 100);
};

// Helper to check criticals or structure damage (for diagnostic wireframe)
const getLocationStatus = (slot: MechSlot, loc: string) => {
  if (!slot.state || !slot.session) return { color: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-500', alert: false, text: 'OK' };
  
  const fLoc = ['CT', 'LT', 'RT'].includes(loc) ? loc + 'f' : loc;
  
  const max = (slot.state.armor as any)[fLoc] || 0;
  const current = (slot.session.armor as any)[fLoc] || 0;
  const maxIs = (slot.state.is as any)[loc] || 0;
  const currentIs = (slot.session.is as any)[loc] || 0;
  
  if (currentIs === 0 && maxIs > 0) return { color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500', alert: true, text: 'DESTROYED' };
  if (currentIs < maxIs) return { color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500', alert: true, text: 'BREACH' };
  if (current < max / 2) return { color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500', alert: true, text: 'WARNING' };
  if (current < max) return { color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500', alert: false, text: 'DMG' };
  return { color: 'text-green-400', bg: 'bg-cyan-900/30', border: 'border-cyan-500', alert: false, text: 'OK' };
};

// Mech Wireframe component that simulates a diagnostic view
const DiagnosticWireframe = ({ slot }: { slot: MechSlot | null }) => {
  if (!slot || !slot.state || !slot.session) return <div className="text-cyan-500 text-sm font-mono mt-8">NO DIAGNOSTIC DATA</div>;
  
  const locStatus = (loc: string) => getLocationStatus(slot, loc);
  const getArmorStr = (loc: string) => {
    const fLoc = ['CT', 'LT', 'RT'].includes(loc) ? loc + 'f' : loc;
    return `${(slot.session?.armor as any)[fLoc] || 0}/${(slot.state?.armor as any)[fLoc] || 0}`;
  };

  const hd = locStatus('HD');
  const la = locStatus('LA');
  const ct = locStatus('CT');
  const ra = locStatus('RA');
  const ll = locStatus('LL');
  const rl = locStatus('RL');

  return (
    <div className="flex flex-col items-center justify-center scale-125 my-8 relative">
      <div className="absolute inset-0 border border-cyan-900/30 grid grid-cols-4 grid-rows-4 z-0">
        {[...Array(16)].map((_, i) => <div key={i} className="border border-cyan-900/20"></div>)}
      </div>

      <div className={`w-12 h-12 border-2 ${hd.border} ${hd.bg} rounded-t-lg mb-2 relative z-10 flex items-center justify-center transition-colors`}>
        <div className={`text-[8px] ${hd.color} font-bold absolute top-1`}>HD</div>
        <div className={`text-[10px] ${hd.color}`}>{getArmorStr('HD')}</div>
      </div> 
      
      <div className="flex gap-2 mb-2 z-10">
        <div className={`w-12 h-28 border-2 ${la.border} ${la.bg} rounded-l-lg flex flex-col items-center justify-center relative transition-colors`}>
          <div className={`text-[8px] ${la.color} font-bold absolute top-1`}>LA</div>
          {la.alert && <AlertTriangle size={12} className={`${la.color} absolute top-4`} />}
          <div className={`text-[10px] ${la.color}`}>{getArmorStr('LA')}</div>
        </div> 
        
        <div className={`w-24 h-32 border-2 ${ct.border} ${ct.bg} relative flex flex-col items-center justify-center transition-colors`}>
          <div className={`text-[8px] ${ct.color} font-bold absolute top-1`}>CT</div>
          <div className={`text-[10px] ${ct.color} mb-4`}>{getArmorStr('CT')}</div>
          <div className="absolute inset-2 border border-cyan-500/50 flex flex-col items-center justify-end pb-2">
            <Cpu size={16} className={`${ct.color} mb-1`} />
            <div className={`text-[8px] ${ct.color}`}>{(slot.session.is as any).CT === 0 ? 'ENGINE: CRITICAL' : 'ENGINE: OK'}</div>
          </div>
        </div> 
        
        <div className={`w-12 h-28 border-2 ${ra.border} ${ra.bg} rounded-r-lg flex flex-col items-center justify-center relative transition-colors`}>
          <div className={`text-[8px] ${ra.color} font-bold absolute top-1`}>RA</div>
          {ra.alert && <ShieldAlert size={12} className={`${ra.color} absolute top-4 animate-pulse`} />}
          <div className={`text-[10px] ${ra.color} font-bold`}>{getArmorStr('RA')}</div>
          {ra.alert && <div className={`text-[8px] ${ra.color} absolute bottom-1`}>{ra.text}</div>}
        </div>
      </div>
      
      <div className="flex gap-4 z-10">
        <div className={`w-10 h-28 border-2 ${ll.border} ${ll.bg} flex flex-col items-center justify-center relative transition-colors`}>
          <div className={`text-[8px] ${ll.color} font-bold absolute top-1`}>LL</div>
          <div className={`text-[10px] ${ll.color}`}>{getArmorStr('LL')}</div>
        </div> 
        <div className={`w-10 h-28 border-2 ${rl.border} ${rl.bg} flex flex-col items-center justify-center relative transition-colors`}>
          <div className={`text-[8px] ${rl.color} font-bold absolute top-1`}>RL</div>
          <div className={`text-[10px] ${rl.color}`}>{getArmorStr('RL')}</div>
        </div> 
      </div>
    </div>
  );
};

export function DesktopTaller() {
  const { mechSlots } = useSimulador();
  const activeMechs = mechSlots.filter(s => s.state && s.session);
  const [selectedMechIdx, setSelectedMechIdx] = useState<number>(0);
  const selectedSlot = activeMechs[selectedMechIdx] || null;

  return (
    <div className="flex-1 bg-[#050f14] border-2 border-cyan-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

      <div className="bg-cyan-950/40 border-b border-cyan-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: MECH_BAY_MAINTENANCE</div>
          <div className="text-[10px] text-orange-500 font-mono border border-orange-800 px-2 py-0.5 bg-orange-900/20">CHIEF ENGINEER: ONLINE</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          TALLER / REPARACIONES
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-2 gap-2">
        {/* Left List */}
        <div className="w-1/3 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col custom-scrollbar overflow-y-auto">
          {activeMechs.length === 0 && (
            <div className="p-4 text-cyan-500 text-xs font-mono">No hay mechs activos en el Simulador.</div>
          )}
          {activeMechs.map((slot, idx) => {
            const isSelected = selectedMechIdx === idx;
            const dmgPct = calculateDamagePct(slot);
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedMechIdx(idx)}
                className={`p-2 border-b border-cyan-900/30 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-cyan-900/40 border-l-2 border-l-cyan-400' : 'hover:bg-cyan-900/20'}`}
              >
                <div className="w-10 h-10 bg-black border border-cyan-800 flex items-center justify-center">
                  <Wrench size={20} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-200">{slot.state?.chassis}</div>
                  <div className="text-secondary/60 uppercase tracking-widest text-[9px] mt-1">{slot.state?.tonnage}T</div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {dmgPct > 0 ? (
                    <div className="text-[10px] font-bold text-red-400 flex items-center gap-1"><AlertTriangle size={10}/> DMG: {dmgPct}%</div>
                  ) : (
                    <div className="text-[10px] font-bold text-green-400 flex items-center gap-1">DMG: 0%</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center/Right Diagnostic */}
        <div className="flex-1 flex gap-2">
          {/* Diagnostic View */}
          <div className="flex-1 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col p-4 relative items-center justify-center overflow-hidden">
             <div className="absolute top-2 left-2 text-[10px] text-cyan-500 font-mono uppercase">
               DIAGNOSTIC SCAN: {selectedSlot ? selectedSlot.state?.chassis : 'NONE'}
             </div>
             <DiagnosticWireframe slot={selectedSlot} />
          </div>
          
          {/* Work Orders */}
          <div className="w-1/3 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col">
            <div className="bg-cyan-900/20 border-b border-cyan-900 p-2 text-[10px] text-cyan-400 font-mono flex items-center gap-2">
              <Settings size={12} /> ÓRDENES DE TRABAJO
            </div>
            
            <div className="flex-1 p-2 flex flex-col gap-2 custom-scrollbar overflow-y-auto">
              {selectedSlot && calculateDamagePct(selectedSlot) > 0 ? (
                <div className="border border-red-900/50 bg-red-950/20 p-2 flex flex-col gap-2">
                  <div className="text-[10px] text-red-400 font-bold flex items-center gap-1"><ShieldAlert size={10} /> REPARACIONES DE BLINDAJE</div>
                  <div className="text-[10px] text-slate-400 font-mono">Daño Detectado: {calculateDamagePct(selectedSlot)}%</div>
                  <button className="w-full bg-red-900/40 border border-red-500 text-red-200 text-[10px] py-1 hover:bg-red-500 hover:text-black transition-colors uppercase font-bold mt-1">
                    AUTORIZAR EN TALLER
                  </button>
                </div>
              ) : (
                <div className="text-xs font-mono text-cyan-600 mt-2 text-center italic">No hay daños estructurales</div>
              )}
              
              <div className="border border-cyan-900/50 bg-cyan-950/20 p-2 flex flex-col gap-2 mt-auto">
                <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1"><Settings size={10} /> REPARACIÓN INTEGRAL</div>
                <div className="text-[10px] text-slate-400 font-mono">Envíe unidad al taller para un diagnóstico completo de críticos y motor.</div>
                <button className="w-full bg-cyan-900/40 border border-cyan-500 text-cyan-200 text-[10px] py-1 hover:bg-cyan-500 hover:text-black transition-colors uppercase font-bold mt-1">
                  ABRIR TALLER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
