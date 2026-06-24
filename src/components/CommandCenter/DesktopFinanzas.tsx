import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DollarSign, TrendingUp, BarChart2, Activity, PieChart } from 'lucide-react';
import { loadLibroMayor, type LibroMayorEntry } from '@/lib/firebase-service';

export function DesktopFinanzas() {
  const campaign = useAppStore(s => s.campaign);
  const [entries, setEntries] = useState<LibroMayorEntry[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinanzas() {
      const res = await loadLibroMayor();
      if (res.success && Array.isArray(res.data?.entries)) {
        const sorted = (res.data.entries as LibroMayorEntry[]).sort((a,b) => a.fecha.localeCompare(b.fecha));
        setEntries(sorted);
        // Calculate balance
        let b = 0;
        sorted.forEach(e => {
          if (e.tipo === 'ingreso') b += (e.cantidad || 0);
          else b -= (e.cantidad || 0);
        });
        setBalance(b);
      }
      setLoading(false);
    }
    fetchFinanzas();
  }, []);

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n)) + ' ₡';

  return (
    <div className="flex-1 bg-[#050f14] border-2 border-cyan-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

      <div className="bg-cyan-950/40 border-b border-cyan-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: FINANCE_SEC</div>
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">ACCESS: COMMANDER</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          TESORERÍA Y LIBRO MAYOR
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-4 gap-4">
        {/* Resumen Principal */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-[#02050a]/80 border border-cyan-900/50 p-4 relative flex flex-col items-center justify-center py-8 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
             <DollarSign size={48} className="text-green-500 absolute opacity-10" />
             <div className="text-[10px] text-cyan-500 font-mono mb-2">BALANCE ACTUAL (C-BILLS)</div>
             {loading ? (
               <div className="text-4xl font-black text-cyan-400 tracking-widest animate-pulse mt-2">--- ₡</div>
             ) : (
               <div className={`text-4xl font-black tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] ${balance >= 0 ? 'text-green-400' : 'text-red-500'} mt-2`}>
                 {fmtMoney(balance)}
               </div>
             )}
             <div className="text-xs text-green-500 font-mono mt-2 flex items-center gap-1"><TrendingUp size={12}/> +14.2% ESTE MES</div>
          </div>

          <div className="bg-[#02050a]/80 border border-cyan-900/50 p-4 flex-1 flex flex-col">
             <div className="text-[10px] text-orange-500 font-mono mb-4 border-b border-orange-900/50 pb-1">VALORACIÓN DE ACTIVOS</div>
             <div className="flex justify-between items-end mb-4">
               <div>
                 <div className="text-[10px] text-slate-500">Valor Estimado de Unidad</div>
                 <div className="text-xl font-bold text-orange-400">{campaign.valorUnidad || '45,000,000'} ₡</div>
               </div>
               <Activity size={24} className="text-orange-500/50" />
             </div>
             <div className="flex justify-between items-end">
               <div>
                 <div className="text-[10px] text-slate-500">Costo Operativo Mensual</div>
                 <div className="text-xl font-bold text-red-400">-320,000 ₡</div>
               </div>
               <BarChart2 size={24} className="text-red-500/50" />
             </div>
             
             <div className="mt-auto border-t border-cyan-900/50 pt-2 text-[10px] text-cyan-500 font-mono">
                HISTORIAL DE TRANSACCIONES
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 mt-2">
               {loading && <div className="text-cyan-500 text-xs font-mono">Cargando datos...</div>}
               {entries.slice().reverse().map(e => (
                 <div key={e.id} className="flex justify-between items-center bg-cyan-950/20 border border-cyan-900/30 p-2 text-[10px] font-mono">
                   <div>
                     <span className="text-cyan-600">{e.fecha.slice(0,10)}</span>
                     <span className="text-slate-300 ml-2">{e.concepto}</span>
                   </div>
                   <div className={`font-bold ${e.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                     {e.tipo === 'ingreso' ? '+' : '-'}{fmtMoney(e.cantidad)}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Gráficos y Detalles */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-[#02050a]/80 border border-cyan-900/50 p-4 relative">
             <div className="text-[10px] text-cyan-500 font-mono mb-4 border-b border-cyan-900/50 pb-1 flex justify-between">
               <span>PROYECCIÓN DE INGRESOS (ÚLTIMOS 6 MESES)</span>
               <PieChart size={12} />
             </div>
             {/* Gráfico estético mediante flex */}
             <div className="flex items-end h-48 gap-2 px-4 mt-8 border-b-2 border-l-2 border-cyan-900">
                {[40, 60, 30, 80, 50, 90, 45, 70, 85, 30, 55, 75, 40, 85, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <div 
                      className={`w-full transition-all duration-500 hover:opacity-100 ${i % 4 === 0 ? 'bg-orange-500 opacity-80' : 'bg-cyan-600 opacity-50'}`} 
                      style={{ height: `${h}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-cyan-500 text-[10px] text-cyan-300 px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                      {h}k
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="h-1/3 flex gap-4">
             <div className="flex-1 bg-black/40 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500 font-mono mb-2">PRÓXIMOS PAGOS</div>
                <div className="flex flex-col gap-1 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-300">Salarios MechWarriors</span><span className="text-red-400">-120,000 ₡</span></div>
                  <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-300">Mantenimiento Dropship</span><span className="text-red-400">-50,000 ₡</span></div>
                  <div className="flex justify-between"><span className="text-slate-300">Intereses ComStar</span><span className="text-red-400">-5,000 ₡</span></div>
                </div>
             </div>
             <div className="flex-1 bg-black/40 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500 font-mono mb-2">CONTRATOS ACTIVOS</div>
                <div className="flex flex-col gap-1 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-cyan-400">Escolta Magistrado</span><span className="text-green-400">+850,000 ₡</span></div>
                  <div className="flex justify-between"><span className="text-cyan-400">Bono de Salvamento</span><span className="text-green-400">Pendiente</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
