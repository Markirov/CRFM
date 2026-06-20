import React from 'react';
import { AlertTriangle, Check, Info } from 'lucide-react';
import type { TurnSummary } from '@/lib/combat-types';

const LOC_LABEL: Record<string, string> = {
  HD: 'Cabeza', CT: 'Torso Central', LT: 'Torso Izquierdo', RT: 'Torso Derecho',
  LA: 'Brazo Izquierdo', RA: 'Brazo Derecho', LL: 'Pierna Izquierda', RL: 'Pierna Derecha',
  CTf: 'Torso Central (F)', LTf: 'Torso Izquierdo (F)', RTf: 'Torso Derecho (F)',
  CTr: 'Torso Central (P)', LTr: 'Torso Izquierdo (P)', RTr: 'Torso Derecho (P)',
};

interface Props {
  mechUpdates: { idx: number; summary: TurnSummary }[];
  vehicleUpdates: { idx: number; summary: TurnSummary }[];
  onConfirm: () => void;
}

function SummaryCard({ summary }: { summary: TurnSummary }) {
  const hasEvents = summary.totalDamage > 0 || Object.keys(summary.critRolls).length > 0 || summary.destroyedLocs.length > 0 || summary.heatDelta !== 0;

  return (
    <div className="bg-surface-container-high border border-outline-variant/30 clip-chamfer p-3 mb-3">
      <h4 className="font-headline font-bold text-primary mb-2 border-b border-outline-variant/20 pb-1">{summary.unitName}</h4>
      
      {!hasEvents ? (
        <div className="text-[10px] font-mono text-secondary/50 italic">Sin eventos este turno.</div>
      ) : (
        <div className="space-y-2">
          {/* Daño */}
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-secondary/70">Daño Recibido:</span>
            <span className="font-bold text-primary">{summary.totalDamage} pts</span>
          </div>

          {/* Pilotaje */}
          {summary.pilotingCheck && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-error bg-error/10 p-1.5 border border-error/50">
              <AlertTriangle size={12} className="shrink-0" />
              <span>+20 Daños: ¡Chequeo de Pilotaje!</span>
            </div>
          )}

          {/* Críticos */}
          {Object.keys(summary.critRolls).length > 0 && (
            <div className="border border-amber-500/30 p-2">
              <div className="flex items-center gap-1 mb-1 text-amber-400">
                <AlertTriangle size={12} />
                <span className="text-[9px] uppercase font-mono font-bold">Posibles Críticos</span>
              </div>
              {Object.entries(summary.critRolls).map(([loc, count]) => (
                <div key={loc} className="flex justify-between text-[10px] font-mono text-amber-400/90">
                  <span>{LOC_LABEL[loc] || loc}</span>
                  <span>{count} tirada{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Destrucciones */}
          {summary.destroyedLocs.length > 0 && (
            <div className="border border-error/30 p-2">
              <div className="flex items-center gap-1 mb-1 text-error">
                <AlertTriangle size={12} />
                <span className="text-[9px] uppercase font-mono font-bold">Destrucciones</span>
              </div>
              {summary.destroyedLocs.map((log, i) => (
                <div key={i} className="text-[9px] font-mono text-error/90">{log.replace('> ', '')}</div>
              ))}
            </div>
          )}

          {/* Calor */}
          <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-outline-variant/10">
            <span className="text-secondary/70">Calor Final:</span>
            <span className={summary.heat > 0 ? 'text-amber-500 font-bold' : 'text-primary'}>
              {summary.heat} ({summary.heatDelta > 0 ? '+' : ''}{summary.heatDelta})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GlobalEndTurnSummaryModal({ mechUpdates, vehicleUpdates, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container border-2 border-primary w-full max-w-lg shadow-[0_0_40px_rgba(223,186,116,0.3)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-center px-4 py-4 border-b border-primary/30 bg-primary/10 shrink-0">
          <h3 className="font-headline font-bold text-primary tracking-widest uppercase text-lg">Resumen Global del Turno</h3>
        </div>
        
        {/* Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {mechUpdates.map(u => <SummaryCard key={`mech_${u.idx}`} summary={u.summary} />)}
          {vehicleUpdates.map(u => <SummaryCard key={`veh_${u.idx}`} summary={u.summary} />)}
          
          {mechUpdates.length === 0 && vehicleUpdates.length === 0 && (
            <div className="text-center text-secondary/50 font-mono text-xs py-8">No hay unidades activas en combate.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 shrink-0 border-t border-outline-variant/20">
          <button
            onClick={onConfirm}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-headline font-bold uppercase tracking-widest py-3 clip-chamfer transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} /> Confirmar Todo y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
