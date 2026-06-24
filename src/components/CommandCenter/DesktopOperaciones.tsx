import React from 'react';
import { Crosshair, Map, Zap, Target, Hexagon, ShieldAlert, Wifi, Swords } from 'lucide-react';
import { useSimulador } from '@/hooks/useSimulador';
import { canFire } from '@/lib/combat-data';

export function DesktopOperaciones() {
  const { mechSlots, currentMechIdx } = useSimulador();
  const activeMech = mechSlots[currentMechIdx];
  const weapons = activeMech?.state?.weapons || [];
  return (
    <div className="flex-1 bg-[#050f14] border-2 border-cyan-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

      <div className="bg-cyan-950/40 border-b border-cyan-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: TACTICAL_OPS</div>
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20 flex items-center gap-1"><Wifi size={10} /> SAT-LINK ACTIVE</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          OPERACIONES Y SIMULADOR
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-2 gap-2">
        {/* Simulador Hexagonal (Mapa Táctico) */}
        <div className="flex-[2] border border-cyan-900/50 bg-[#02050a]/80 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(circle, #00ffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="absolute top-4 left-4 text-[10px] text-cyan-500 font-mono flex items-center gap-2">
            <Map size={12} /> TACTICAL GRID MAP
          </div>
          
          {/* Mockup de un grid hexagonal isométrico */}
          <div className="grid grid-cols-6 gap-1 transform rotate-12 scale-150">
            {[...Array(36)].map((_, i) => (
              <div 
                key={i} 
                className={`w-10 h-12 border ${
                  i === 15 ? 'border-orange-500 bg-orange-900/50' : 
                  i === 20 ? 'border-red-500 bg-red-900/50' : 
                  i === 22 ? 'border-red-500 bg-red-900/50' : 
                  'border-cyan-800/30'
                } flex items-center justify-center`} 
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}
              >
                {i === 15 && <Hexagon size={16} className="text-orange-400 fill-orange-900" />}
                {(i === 20 || i === 22) && <Target size={16} className="text-red-500 animate-pulse" />}
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400"><div className="w-2 h-2 bg-orange-500"></div> FRIENDLY UNIT</div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400"><div className="w-2 h-2 bg-red-500"></div> HOSTILE BOGEY</div>
          </div>
        </div>

        {/* HUD de Seguimiento de Combate */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-[1.5] border border-cyan-900/50 bg-[#02050a]/80 p-4 flex flex-col">
            <div className="text-[10px] text-cyan-500 font-mono mb-2 flex items-center gap-1 border-b border-cyan-900/50 pb-1">
              <Crosshair size={12} /> SEGUIMIENTO DE COMBATE
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4 mt-2">
               <div className="text-cyan-500 font-mono text-xs text-center flex flex-col items-center gap-2">
                 <Swords size={24} className="text-cyan-800" />
                 NO TARGETS LOCKED
               </div>
            </div>
          </div>

          <div className="flex-1 border border-cyan-900/50 bg-[#02050a]/80 p-4 flex flex-col">
            <div className="text-[10px] text-cyan-500 font-mono mb-2 flex items-center gap-1 border-b border-cyan-900/50 pb-1">
              <Zap size={12} /> ESTADO DE SISTEMAS
            </div>
            
            <div className="flex flex-col gap-2 mt-2 custom-scrollbar overflow-y-auto">
               {weapons.length > 0 ? weapons.map((w, i) => {
                 const isOperational = !(w as any).destroyed;
                 const isFired = false;
                 return (
                   <div key={i} className="mb-2">
                     <div className="flex justify-between items-center text-xs font-mono">
                       <span className={isOperational ? "text-cyan-400" : "text-red-500"}>{w.name} ({w.loc || 'CT'})</span>
                       <span className={!isOperational ? "text-red-500" : isFired ? "text-orange-500" : "text-green-500"}>
                         {!isOperational ? 'DESTROYED' : isFired ? 'FIRED' : 'READY'}
                       </span>
                     </div>
                     <div className="w-full bg-slate-900 h-1">
                       <div className={`h-full ${!isOperational ? 'bg-red-500 w-full' : isFired ? 'bg-orange-500 w-[30%] animate-pulse' : 'bg-green-500 w-full'}`}></div>
                     </div>
                   </div>
                 );
               }) : (
                 <div className="text-cyan-500 font-mono text-xs italic">SISTEMAS OFENSIVOS OFFLINE</div>
               )}
            </div>
            
            <button className="mt-auto w-full bg-red-900/20 border-2 border-red-900 text-red-500 text-[10px] py-2 hover:bg-red-900/40 transition-colors font-bold tracking-widest flex justify-center items-center gap-2">
              <ShieldAlert size={14} /> SIMULADOR COMPLETO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
