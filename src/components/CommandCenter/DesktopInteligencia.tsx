import React, { useState } from 'react';
import { Book, FileText, Globe, Bookmark, Terminal, ChevronRight } from 'lucide-react';

const INTEL_DOCS = [
  { id: 'i1', category: 'Ayudas Rápidas', title: 'Secuencia de Turno', icon: Terminal, content: 'FASE 1: INICIATIVA\\n- Tirada 2D6 por bando.\\n- El ganador elige quién mueve primero.\\n\\nFASE 2: MOVIMIENTO\\n- Caminar: Coste base.\\n- Correr: +1 Calor, +2 Mod. Disparo.\\n- Saltar: +1 Calor por hexágono (Mín 3).\\n\\nFASE 3: REACCIÓN / ARMAS\\n- Declaración simultánea de ataques.\\n- Resolución de daños.' },
  { id: 'i2', category: 'Manual Técnico', title: 'Gestión de Calor', icon: Globe, content: 'ESCALA DE CALOR (HEAT SCALE)\\n\\n[+5] Movimiento reducido -1\\n[+8] Modificador de disparo +1\\n[+10] Movimiento reducido -2\\n[+13] Modificador de disparo +2\\n[+14] Posible apagado (Roll 4+)\\n[+19] Explosión de Munición (Roll 4+)' },
  { id: 'i3', category: 'Wiki de Reglas', title: 'Ataques Físicos', icon: Book, content: 'DAÑO CUERPO A CUERPO:\\n\\n- Puñetazo: Tonelaje / 10. Localización: Tabla Izq/Der (Parte Superior)\\n- Patada: Tonelaje / 5. Localización: Piernas.\\n- Carga (Charge): (Distancia * Tonelaje) / 10.\\n- Muerte desde Arriba (DFA): (Tonelaje / 10) * 3.' },
  { id: 'i4', category: 'Crónicas', title: 'Registro Stardate 3025.1', icon: Bookmark, content: 'REPORTE DE ACCIÓN:\\nLas tropas del Comandante Hanse Davion han iniciado maniobras en la frontera de Capella.\\nNuestra unidad ha sido contratada para realizar ataques quirúrgicos en instalaciones de suministro.\\n\\nBajas enemigas: 4 Mechs (1x Locust, 2x Wasp, 1x Phoenix Hawk).\\nBajas propias: Ninguna.' },
];

export function DesktopInteligencia() {
  const [selectedDoc, setSelectedDoc] = useState(INTEL_DOCS[0]);

  return (
    <div className="flex-1 bg-[#020d05] border-2 border-green-800 relative rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(34,197,94,0.05)]">
      <div className="absolute top-0 left-0 w-full h-full scanlines pointer-events-none z-20"></div>
      
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500/50 z-30 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-500/50 z-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-500/50 z-30 pointer-events-none"></div>

      <div className="bg-green-950/40 border-b border-green-800 p-2 flex justify-between items-center z-10">
        <div className="flex gap-4">
          <div className="text-[10px] text-green-500 font-mono border border-green-800 px-2 py-0.5 bg-green-900/20">MODULE: COMSTAR_ARCHIVE</div>
          <div className="text-[10px] text-green-500 font-mono border border-green-800 px-2 py-0.5 bg-green-900/20">NETWORK: SECURE</div>
        </div>
        <div className="text-xs text-green-400 font-bold uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">
          INTELIGENCIA Y ARCHIVOS
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden z-10 p-4 gap-4">
        {/* Left List */}
        <div className="w-1/3 flex flex-col gap-2 border border-green-900/50 bg-[#010a03]/80 p-2 custom-scrollbar overflow-y-auto text-green-500">
          <div className="text-[10px] font-mono border-b border-green-900/50 pb-2 mb-2">DIRECTORIO ROOT &gt;</div>
          
          {INTEL_DOCS.map(doc => {
            const Icon = doc.icon;
            return (
              <div 
                key={doc.id} 
                onClick={() => setSelectedDoc(doc)}
                className={`p-2 border border-green-900/30 flex items-center gap-3 cursor-pointer transition-colors ${selectedDoc.id === doc.id ? 'bg-green-900/40 border-l-4 border-l-green-400 text-green-300' : 'hover:bg-green-900/20 text-green-600'}`}
              >
                <Icon size={16} />
                <div className="flex-1">
                  <div className="text-xs font-mono font-bold uppercase">{doc.title}</div>
                  <div className="text-[8px] font-mono opacity-60">[{doc.category}]</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Content */}
        <div className="flex-1 border border-green-900/50 bg-[#010a03]/80 p-6 relative font-mono text-green-400">
           <div className="absolute top-2 right-2 flex gap-1">
             <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
             <div className="w-2 h-2 bg-green-900"></div>
             <div className="w-2 h-2 bg-green-900"></div>
           </div>

           <div className="text-sm font-bold border-b border-green-900 pb-2 mb-4 flex items-center gap-2">
             <ChevronRight size={16} />
             {selectedDoc.category.toUpperCase()} / {selectedDoc.title.toUpperCase()}
           </div>

           <pre className="text-xs whitespace-pre-wrap leading-relaxed font-mono">
             {selectedDoc.content}
           </pre>

           <div className="absolute bottom-4 left-4 text-[10px] opacity-50">
             (C) 3025 COMSTAR ARCHIVES - DO NOT DISTRIBUTE
           </div>
        </div>
      </div>
    </div>
  );
}
