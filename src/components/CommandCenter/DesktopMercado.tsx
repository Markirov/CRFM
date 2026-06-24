import React, { useState } from 'react';
import { ShoppingCart, Package, Info, ShieldAlert, Cpu } from 'lucide-react';
import { useMechCatalog } from '@/hooks/useMechCatalog';
import { getAcquisitionPrice, classifyMechWeight } from '@/lib/asset-prices';

export function DesktopMercado() {
  const { catalog, loading } = useMechCatalog();
  const isReady = !loading;
  const isIndexing = loading;
  const filteredMechs = catalog?.mechs || [];
  const displayMechs = filteredMechs.slice(0, 15); // Show first 15 mechs in market
  
  const [selectedItem, setSelectedItem] = useState(displayMechs[0] || null);

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
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: BLACK_MARKET</div>
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">VENDOR: OUTREACH EXPORTS</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          MERCADO NEGRO Y SUMINISTROS
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-2 gap-2">
        <div className="w-1/3 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col custom-scrollbar overflow-y-auto">
          {!isReady && <div className="p-4 text-cyan-500 font-mono text-xs">Conectando con ComStar...</div>}
          {isIndexing && <div className="p-4 text-cyan-500 font-mono text-xs">Indexando catálogo...</div>}
          {isReady && displayMechs.length === 0 && <div className="p-4 text-slate-500 font-mono text-xs">Mercado vacío.</div>}
          {displayMechs.map((item: any) => {
            const isSelected = selectedItem?.file === item.file;
            const price = getAcquisitionPrice('mech_new', 'regular', classifyMechWeight(item.tons));
            return (
              <div 
                key={item.file} 
                onClick={() => setSelectedItem(item)}
                className={`p-2 border-b border-cyan-900/30 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-orange-900/40 border-l-2 border-l-orange-400' : 'hover:bg-cyan-900/20'}`}
              >
                <div className={`w-10 h-10 border flex items-center justify-center ${isSelected ? 'bg-orange-950 border-orange-500' : 'bg-black border-cyan-800'}`}>
                  <Package size={20} className={isSelected ? 'text-orange-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-bold ${isSelected ? 'text-orange-200' : 'text-slate-200'}`}>{item.chassis} {item.model}</div>
                  <div className="text-[10px] text-cyan-500 font-mono">{item.tons}T | {classifyMechWeight(item.tons)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-orange-400">{fmtMoney(price)}</div>
                  <div className="text-[8px] text-slate-500">STOCK: 1</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col p-4 relative">
          {selectedItem ? (() => {
            const priceInfo = getAcquisitionPrice('mech_new', 'regular', classifyMechWeight(selectedItem.tons));
            return (
            <>
              <div className="flex items-start gap-4 border-b border-cyan-900/50 pb-4 mb-4">
                <div className="w-32 h-32 border-2 border-cyan-600 bg-black flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                   <Cpu size={64} className="text-cyan-800" />
                   <div className="absolute bottom-0 w-full bg-cyan-900/50 text-center text-[10px] py-1 border-t border-cyan-600 text-cyan-100 font-mono uppercase">{classifyMechWeight(selectedItem.tons)} CLASS</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-cyan-500 font-mono mb-1 flex items-center gap-1">
                    <Info size={10} /> ITEM SPECIFICATION
                  </div>
                  <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] mb-1">
                    {selectedItem.chassis} {selectedItem.model}
                  </h2>
                  <div className="text-orange-400 font-mono text-sm">UBICACIÓN: MERCADO GENERAL</div>
                  <div className="text-[10px] text-slate-500 mt-1">BV: {(selectedItem as any).bv || 'N/A'} | ERA: {(selectedItem as any).era || 'N/A'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-slate-800 p-3 bg-black/50">
                  <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Costo de Adquisición</div>
                  <div className="text-2xl font-bold text-orange-400">{fmtMoney(priceInfo)}</div>
                </div>
                <div className="border border-slate-800 p-3 bg-black/50">
                  <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Tonelaje Estándar</div>
                  <div className="text-2xl font-bold text-cyan-300">{selectedItem.tons} TONELADAS</div>
                </div>
              </div>
              
              <div className="border border-slate-800 p-3 bg-black/50 mb-4">
                 <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Estado del Chasis</div>
                 <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
                   <ShieldAlert size={16} className="text-green-500"/>
                   ESTÁNDAR MERCENARIO (REGULAR)
                 </div>
              </div>

              <div className="mt-auto flex gap-4">
                <button className="flex-1 bg-orange-900/20 border-2 border-orange-500 text-orange-400 font-bold py-3 hover:bg-orange-500 hover:text-black transition-colors flex justify-center items-center gap-2 uppercase tracking-widest shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  <ShoppingCart size={18} /> Adquirir Activo
                </button>
                <button className="flex-1 bg-cyan-900/20 border border-cyan-800 text-cyan-500 font-bold py-3 hover:bg-cyan-900/40 transition-colors uppercase tracking-widest flex justify-center items-center gap-2">
                  Negociar Precio
                </button>
              </div>
            </>
            );
          })() : (
            <div className="flex-1 flex items-center justify-center text-cyan-900 font-mono">SELECCIONE UN PRODUCTO</div>
          )}
        </div>
      </div>
    </div>
  );
}
