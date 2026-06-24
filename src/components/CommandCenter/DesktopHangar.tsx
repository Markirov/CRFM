import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Shield, Crosshair, Zap, Navigation, Info, Settings, ShieldAlert } from 'lucide-react';
import { loadHangar } from '@/lib/firebase-service';
import type { HangarItem } from '@/lib/hangar-types';
import { classifyMechWeight } from '@/lib/asset-prices';

export function DesktopHangar() {
  const roster = useAppStore(s => s.roster);
  const [items, setItems] = useState<HangarItem[]>([]);
  const [selectedMech, setSelectedMech] = useState<HangarItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHangar() {
      const res = await loadHangar();
      if (res.success && Array.isArray(res.data?.items)) {
        setItems(res.data.items as HangarItem[]);
        if (res.data.items.length > 0) {
          setSelectedMech(res.data.items[0] as HangarItem);
        }
      }
      setLoading(false);
    }
    fetchHangar();
  }, []);

  // Helper for status
  const getStatus = (m: HangarItem) => m.estado === 'operativo' || (m.estadoPct ?? 100) > 80 ? 'OPERATIVO' : (m.estadoPct ?? 0) === 0 ? 'DESTRUIDO' : 'EN REPARACIÓN';
  const getPilotName = (m: HangarItem) => {
    if (m.pilotoIdx === undefined || !roster[m.pilotoIdx]) return 'No Asignado';
    return roster[m.pilotoIdx].apodo || roster[m.pilotoIdx].nombre;
  };

  return (
    <div className="flex-1 bg-[#050f14] border-2 border-cyan-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

      <div className="bg-cyan-950/40 border-b border-cyan-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: HANGAR_OVERVIEW</div>
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">BAY CAPACITY: 4/12</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          HANGAR PRINCIPAL
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-2 gap-2">
        {/* Left: Lista de Bahías */}
        <div className="w-1/3 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col custom-scrollbar overflow-y-auto">
          {loading && <div className="p-4 text-cyan-500 font-mono text-xs">Cargando inventario...</div>}
          {!loading && items.length === 0 && <div className="p-4 text-slate-500 font-mono text-xs">Hangar vacío.</div>}
          {items.map((m, idx) => {
            const isSelected = selectedMech?.id === m.id;
            const status = getStatus(m);
            return (
              <div 
                key={m.id} 
                onClick={() => setSelectedMech(m)}
                className={`p-2 border-b border-cyan-900/30 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-cyan-900/40 border-l-2 border-l-cyan-400' : 'hover:bg-cyan-900/20'}`}
              >
                <div className="w-10 h-10 border border-cyan-800 bg-black flex flex-col items-center justify-center">
                  <div className="text-[8px] text-cyan-600 font-mono">BAY</div>
                  <div className={`text-sm font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>0{idx + 1}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-200">{m.chassis} {m.model}</div>
                  <div className="text-[10px] text-cyan-500 font-mono">{m.tons}T | {classifyMechWeight(m.tons)}</div>
                </div>
                <div className="text-right">
                  {status === 'OPERATIVO' ? (
                    <div className="text-[10px] font-bold text-green-400">OPERATIVO</div>
                  ) : (
                    <div className="text-[10px] font-bold text-orange-400">{status}</div>
                  )}
                  <div className="text-[8px] text-slate-500">BV: {m.bv || 'N/A'}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Mech View */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Top Panel: Mech Rendering (Mock) */}
          <div className="flex-[1.5] border border-cyan-900/50 bg-[#02050a]/80 relative flex items-center justify-center overflow-hidden">
             {/* Abstract Mech Rendering */}
             <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-50 scale-150">
               <div className="absolute top-0 w-3/4 h-32 bg-gradient-to-b from-cyan-900/20 to-transparent"></div>
               <div className="absolute bottom-0 w-full h-16 bg-cyan-900/10" style={{ transform: 'perspective(100px) rotateX(45deg)' }}></div>
               <div className="relative flex flex-col items-center mt-12">
                  <div className="flex gap-12 mb-[-10px] z-0">
                     <div className="w-12 h-16 bg-[#1a202c] border border-[#2d3748] rounded-sm"></div>
                     <div className="w-12 h-16 bg-[#1a202c] border border-[#2d3748] rounded-sm"></div>
                  </div>
                  <div className="w-24 h-20 bg-gradient-to-b from-[#2d3748] to-[#1a202c] border-2 border-[#4a5568] rounded-xl flex items-center justify-center z-10 relative">
                     <div className="w-12 h-6 bg-cyan-900 border border-cyan-400 rounded-full shadow-[0_0_15px_rgba(8,145,178,0.5)]"></div>
                  </div>
                  <div className="flex gap-8 mt-[-5px] z-0">
                     <div className="w-6 h-32 bg-gradient-to-b from-[#2d3748] to-[#11141a] border border-[#4a5568]"></div>
                     <div className="w-6 h-32 bg-gradient-to-b from-[#2d3748] to-[#11141a] border border-[#4a5568]"></div>
                  </div>
               </div>
             </div>

             {selectedMech && (
               <div className="absolute top-4 left-4 z-10">
                 <h2 className="text-4xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{selectedMech.chassis}</h2>
                 <div className="text-[10px] text-cyan-500 font-mono mt-1 px-2 border border-cyan-800 bg-cyan-900/20 inline-block">
                   ASIGNADO A: <span className="text-cyan-300">{getPilotName(selectedMech)}</span>
                 </div>
               </div>
             )}
             
             {selectedMech && getStatus(selectedMech) !== 'OPERATIVO' && (
                <div className="absolute top-4 right-4 z-10 border border-red-500 bg-red-900/40 px-3 py-1 flex items-center gap-2 animate-pulse">
                  <ShieldAlert size={16} className="text-red-400" />
                  <span className="text-red-400 font-bold text-[10px]">{getStatus(selectedMech)}</span>
                </div>
             )}
          </div>

          {/* Bottom Panel: Loadout & Stats */}
          <div className="flex-1 flex gap-2">
            <div className="w-1/2 border border-cyan-900/50 bg-[#02050a]/80 p-3 flex flex-col">
              <div className="text-[10px] text-cyan-500 font-mono mb-2 flex items-center gap-1 border-b border-cyan-900/50 pb-1">
                <Crosshair size={12} /> SISTEMAS DE ARMAMENTO
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 mt-1">
                {selectedMech ? (
                  <div className="text-xs text-slate-400 font-mono bg-cyan-950/20 border border-cyan-900/30 px-2 py-2 italic text-center mt-4">
                    [DATOS CLASIFICADOS - REQUIERE SINCRONIZACIÓN SSW]
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="w-1/2 border border-cyan-900/50 bg-[#02050a]/80 p-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-cyan-500 font-mono mb-2 flex items-center gap-1 border-b border-cyan-900/50 pb-1">
                  <Info size={12} /> ESPECIFICACIONES
                </div>
                {selectedMech && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                     <div className="border border-slate-800 p-2 bg-black/50 text-center">
                        <div className="text-[8px] text-slate-500 uppercase">Clase</div>
                        <div className="text-sm font-bold text-cyan-400">{classifyMechWeight(selectedMech.tons)}</div>
                     </div>
                     <div className="border border-slate-800 p-2 bg-black/50 text-center">
                        <div className="text-[8px] text-slate-500 uppercase">Tonelaje</div>
                        <div className="text-sm font-bold text-cyan-400">{selectedMech.tons}T</div>
                     </div>
                     <div className="border border-slate-800 p-2 bg-black/50 text-center col-span-2">
                        <div className="text-[8px] text-slate-500 uppercase">Battle Value (BV)</div>
                        <div className="text-xl font-bold text-orange-400">{selectedMech.bv || 'N/A'}</div>
                     </div>
                  </div>
                )}
              </div>
              
              <button className="w-full bg-cyan-900/20 border-2 border-cyan-600 text-cyan-400 text-[10px] py-2 hover:bg-cyan-600 hover:text-black transition-colors font-bold tracking-widest mt-2 flex justify-center items-center gap-2">
                <Settings size={14} /> ENVIAR AL TALLER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
