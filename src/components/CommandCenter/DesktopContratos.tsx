import React, { useState } from 'react';
import { Target, FileText, CheckCircle, AlertTriangle, Shield, Crosshair } from 'lucide-react';

const MOCK_CONTRACTS = [
  { id: 'c1', faction: 'FedSuns (Casa Davion)', employer: 'Duke Ian Hasek', type: 'Asalto Planetario', payout: '2,500,000 ₡', salvage: '50%', difficulty: 'Alta', target: 'Liao Outpost', duration: '3 Meses', status: 'DISPONIBLE' },
  { id: 'c2', faction: 'Magistrado de Canopus', employer: 'Magestrix Centrella', type: 'Escolta VIP', payout: '850,000 ₡', salvage: '10%', difficulty: 'Baja', target: 'Convoy Médico', duration: '1 Mes', status: 'DISPONIBLE' },
  { id: 'c3', faction: 'ComStar', employer: 'Precentor ROM', type: 'Recuperación (Covert)', payout: '1,200,000 ₡', salvage: '0% (Confidencial)', difficulty: 'Media', target: 'Lostech Cache', duration: '1 Semana', status: 'ACTIVO' },
];

export function DesktopContratos() {
  const [selectedContract, setSelectedContract] = useState(MOCK_CONTRACTS[0]);

  return (
    <div className="flex-1 bg-[#050f14] border-2 border-cyan-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 z-30 pointer-events-none"></div>

      <div className="bg-cyan-950/40 border-b border-cyan-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">MODULE: CONTRACT_DB</div>
          <div className="text-[10px] text-cyan-500 font-mono border border-cyan-800 px-2 py-0.5 bg-cyan-900/20">UPLINK: COMSTAR HPG SECURE</div>
        </div>
        <div className="text-xs text-orange-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
          TABLÓN DE CONTRATOS
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-2 gap-2">
        <div className="w-1/3 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col custom-scrollbar overflow-y-auto">
          {MOCK_CONTRACTS.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedContract(c)}
              className={`p-2 border-b border-cyan-900/30 flex items-center gap-3 cursor-pointer transition-colors ${selectedContract.id === c.id ? 'bg-orange-900/40 border-l-2 border-l-orange-400' : 'hover:bg-cyan-900/20'}`}
            >
              <div className={`w-10 h-10 border flex items-center justify-center ${selectedContract.id === c.id ? 'bg-orange-950 border-orange-500' : 'bg-black border-cyan-800'}`}>
                <Target size={20} className={selectedContract.id === c.id ? 'text-orange-400' : 'text-slate-500'} />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-bold ${selectedContract.id === c.id ? 'text-orange-200' : 'text-slate-200'}`}>{c.faction}</div>
                <div className="text-[10px] text-cyan-500 font-mono uppercase">{c.type}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-green-400">{c.payout}</div>
                <div className={`text-[8px] px-1 border ${c.status === 'ACTIVO' ? 'border-cyan-500 text-cyan-400' : 'border-slate-600 text-slate-500'}`}>{c.status}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 border border-cyan-900/50 bg-[#02050a]/80 flex flex-col p-4 relative">
          <div className="flex items-start gap-4 border-b border-cyan-900/50 pb-4 mb-4">
            <div className="w-32 h-32 border-2 border-orange-600 bg-orange-950/20 flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(234,88,12,0.1)]">
              <Shield size={48} className="text-orange-500 mb-2" />
              <div className="text-orange-300 font-mono text-[10px] text-center px-2">{selectedContract.faction}</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-cyan-500 font-mono mb-1 flex items-center gap-1">
                <FileText size={10} /> {selectedContract.id.toUpperCase()}-CLASS DOSSIER
              </div>
              <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] mb-1">
                {selectedContract.type}
              </h2>
              <div className="text-orange-400 font-mono text-sm">EMPLOYER: {selectedContract.employer}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-slate-800 p-3 bg-black/50">
              <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Compensación Base</div>
              <div className="text-2xl font-bold text-green-400">{selectedContract.payout}</div>
            </div>
            <div className="border border-slate-800 p-3 bg-black/50">
              <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Derechos de Salvamento</div>
              <div className="text-2xl font-bold text-orange-400">{selectedContract.salvage}</div>
            </div>
            <div className="border border-slate-800 p-3 bg-black/50">
              <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Nivel de Amenaza</div>
              <div className="text-xl font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} /> {selectedContract.difficulty.toUpperCase()}
              </div>
            </div>
            <div className="border border-slate-800 p-3 bg-black/50">
              <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Duración Estimada</div>
              <div className="text-xl font-bold text-cyan-300 flex items-center gap-2">
                {selectedContract.duration.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex-1 border border-slate-800 p-3 bg-black/50 overflow-auto custom-scrollbar">
            <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase flex items-center gap-2">
              <Crosshair size={12} /> Objetivos de Misión
            </div>
            <div className="text-sm text-slate-300 font-mono leading-relaxed">
              &gt; PRIMARY TARGET: {selectedContract.target}<br/><br/>
              &gt; INTELLIGENCE BRIEF:<br/>
              Las fuerzas enemigas consisten principalmente en Mechs de clase Media y Ligera. Se espera resistencia antiaérea moderada. Su misión es asegurar el perímetro y repeler cualquier contraataque durante al menos 72 horas estándar.<br/><br/>
              &gt; RULES OF ENGAGEMENT: Daño colateral aceptable. Autorizado el uso de artillería pesada.
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            {selectedContract.status === 'DISPONIBLE' ? (
              <>
                <button className="flex-1 bg-green-900/20 border-2 border-green-500 text-green-400 font-bold py-3 hover:bg-green-500 hover:text-black transition-colors flex justify-center items-center gap-2 uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  <CheckCircle size={18} /> Aceptar Contrato
                </button>
                <button className="flex-1 bg-red-900/20 border border-red-900 text-red-500 font-bold py-3 hover:bg-red-900/40 transition-colors uppercase tracking-widest">
                  Rechazar
                </button>
              </>
            ) : (
              <div className="flex-1 border-2 border-cyan-500 bg-cyan-900/20 text-cyan-400 font-bold py-3 flex justify-center items-center gap-2 uppercase tracking-widest text-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <CheckCircle size={18} /> CONTRATO EN CURSO
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
