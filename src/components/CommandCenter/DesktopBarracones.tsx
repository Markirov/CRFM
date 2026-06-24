import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { User, Crosshair, Shield, Activity, TrendingUp } from 'lucide-react';

export function DesktopBarracones() {
  const roster = useAppStore(s => s.roster);
  const [selectedPilot, setSelectedPilot] = useState(roster[0] || null);

  return (
    <div className="flex-1 bg-[#050f14] border-2 border-cyan-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      {/* Esquinas marco */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="bg-cyan-950/40 border-b border-cyan-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: BARRACKS</div>
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">ROSTER: {roster.length}</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          RECURSOS HUMANOS
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-2 gap-2">
        {/* Left: Lista de Pilotos */}
        <div className="w-1/3 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col custom-scrollbar overflow-y-auto">
          {roster.map(p => (
            <div 
              key={p.nombre} 
              onClick={() => setSelectedPilot(p)}
              className={`p-2 border-b border-cyan-900/30 flex items-center gap-3 cursor-pointer transition-colors ${selectedPilot?.nombre === p.nombre ? 'bg-cyan-900/40 border-l-2 border-l-cyan-400' : 'hover:bg-cyan-900/20'}`}
            >
              <div className="w-10 h-10 bg-black border border-cyan-800 flex items-center justify-center">
                <User size={20} className={selectedPilot?.nombre === p.nombre ? 'text-cyan-400' : 'text-slate-500'} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-200">{p.apodo || p.nombreDisplay || p.nombre}</div>
                <div className="text-[10px] text-cyan-500 font-mono">Mech: {p.mech || 'Desasignado'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-orange-400">{p.disparoMech || 5}/{p.pilotajeMech || 6}</div>
                <div className="text-[8px] text-slate-500">G/P</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detalle del Piloto */}
        {selectedPilot ? (
          <div className="flex-1 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col p-4 relative">
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 border-2 border-cyan-600 bg-black flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <User size={64} className="text-cyan-800" />
                <div className="absolute bottom-0 w-full bg-cyan-900/50 text-center text-[10px] py-1 border-t border-cyan-600 text-cyan-100 font-mono">{selectedPilot.estado}</div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] mb-1">
                  {selectedPilot.nombreDisplay || selectedPilot.nombre}
                </h2>
                <div className="text-orange-400 font-mono text-sm mb-4">CALLSIGN: "{selectedPilot.apodo || 'UNKNOWN'}"</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-800 p-2 bg-black/50">
                    <div className="text-[10px] text-slate-500 font-mono mb-1 flex items-center gap-1"><Crosshair size={10}/> DISPARO / PILOTAJE</div>
                    <div className="text-xl font-bold text-slate-200">{selectedPilot.disparoMech || 5} / {selectedPilot.pilotajeMech || 6}</div>
                  </div>
                  <div className="border border-slate-800 p-2 bg-black/50">
                    <div className="text-[10px] text-slate-500 font-mono mb-1 flex items-center gap-1"><Shield size={10}/> MECH ASIGNADO</div>
                    <div className="text-sm font-bold text-cyan-300 mt-1 truncate">{selectedPilot.mech || 'NINGUNO'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border border-slate-800 p-3 bg-black/50">
               <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center gap-1"><TrendingUp size={10}/> EXPERIENCIA Y RANGOS</div>
               <div className="flex items-center gap-2 mb-2">
                 <div className="flex-1 h-2 bg-slate-900 border border-slate-700">
                   <div 
                     className="h-full bg-orange-500 transition-all duration-500" 
                     style={{ width: `${selectedPilot.xpTotal > 0 ? ((selectedPilot.xpTotal - selectedPilot.xpDisponible) / selectedPilot.xpTotal) * 100 : 0}%` }}
                   ></div>
                 </div>
                 <div className="text-xs font-mono text-orange-400">
                   {selectedPilot.xpDisponible} / {selectedPilot.xpTotal} XP LIBRES
                 </div>
               </div>
               <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center p-2 border border-slate-800 hover:border-cyan-500 cursor-pointer transition-colors bg-slate-900/30">
                    <div className="text-cyan-400 font-bold text-xs">S1</div>
                    <div className="text-[8px] text-slate-500">HABILIDAD</div>
                  </div>
                  <div className="text-center p-2 border border-orange-500/50 bg-orange-900/20 cursor-pointer transition-colors">
                    <div className="text-orange-400 font-bold text-xs">S2</div>
                    <div className="text-[8px] text-orange-500">DESBLOQUEADO</div>
                  </div>
                  <div className="text-center p-2 border border-slate-800 hover:border-cyan-500 cursor-pointer transition-colors bg-slate-900/30">
                    <div className="text-cyan-400 font-bold text-xs">G1</div>
                    <div className="text-[8px] text-slate-500">HABILIDAD</div>
                  </div>
                  <div className="text-center p-2 border border-slate-800 hover:border-cyan-500 cursor-pointer transition-colors bg-slate-900/30">
                    <div className="text-cyan-400 font-bold text-xs">G2</div>
                    <div className="text-[8px] text-slate-500">HABILIDAD</div>
                  </div>
               </div>
            </div>
            
            <div className="absolute bottom-4 right-4 text-[10px] text-cyan-900 font-mono">
              [ BARRACKS_SYS_V2.1 ]
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-cyan-900 font-mono">
            SELECCIONA UN PILOTO
          </div>
        )}
      </div>
    </div>
  );
}
