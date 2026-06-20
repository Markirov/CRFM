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
  summary: TurnSummary;
  onConfirm: () => void;
}

export function EndTurnSummaryModal({ summary, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container border-2 border-primary w-full max-w-md shadow-[0_0_40px_rgba(223,186,116,0.3)]">
        
        {/* Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-primary/30 bg-primary/10">
          <h3 className="font-headline font-bold text-primary tracking-widest uppercase">Resumen del Turno</h3>
        </div>
        
        {/* Body */}
        <div className="p-4 space-y-4">
          
          {/* Daño Total y Pilotaje */}
          <div className="bg-surface-container-high p-3 border border-outline-variant/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-secondary/70 uppercase tracking-widest font-mono">Daño Recibido Total</span>
              <span className="font-bold font-mono text-primary">{summary.totalDamage} pts</span>
            </div>
            
            {summary.pilotingCheck && (
              <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-error bg-error/10 p-2 border border-error/50">
                <AlertTriangle size={14} className="shrink-0" />
                <span><strong className="uppercase">+20 Daños:</strong> ¡Chequeo de Pilotaje requerido!</span>
              </div>
            )}
            {!summary.pilotingCheck && summary.totalDamage > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-secondary/50">
                <Info size={12} className="shrink-0" />
                <span>No se requiere chequeo de pilotaje por daño.</span>
              </div>
            )}
          </div>

          {/* Tiradas de Críticos */}
          {Object.keys(summary.critRolls).length > 0 && (
            <div className="bg-surface-container-high p-3 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <AlertTriangle size={14} />
                <span className="text-[10px] uppercase tracking-widest font-mono font-bold">Posibles Críticos</span>
              </div>
              <div className="space-y-1">
                {Object.entries(summary.critRolls).map(([loc, count]) => (
                  <div key={loc} className="flex justify-between items-center text-[11px] font-mono border-b border-outline-variant/10 pb-1">
                    <span className="text-on-surface">{LOC_LABEL[loc] || loc}</span>
                    <span className="text-amber-400">{count} tirada{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Componentes Destruidos */}
          {summary.destroyedLocs.length > 0 && (
            <div className="bg-surface-container-high p-3 border border-error/30">
              <div className="flex items-center gap-2 mb-2 text-error">
                <AlertTriangle size={14} />
                <span className="text-[10px] uppercase tracking-widest font-mono font-bold">Destrucciones</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {summary.destroyedLocs.map((log, i) => (
                  <li key={i} className="text-[10px] font-mono text-error/90">{log.replace('> ', '')}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Calor Final */}
          <div className="bg-surface-container-high p-3 border border-outline-variant/30 flex justify-between items-center">
            <span className="text-[10px] text-secondary/70 uppercase tracking-widest font-mono">Calor al Finalizar</span>
            <span className={`font-bold font-mono ${summary.heat > 0 ? 'text-amber-500' : 'text-primary'}`}>
              {summary.heat} ({summary.heatDelta > 0 ? '+' : ''}{summary.heatDelta})
            </span>
          </div>

          {/* Info general si nada pasó */}
          {summary.totalDamage === 0 && Object.keys(summary.critRolls).length === 0 && summary.destroyedLocs.length === 0 && (
            <p className="text-center text-[10px] font-mono text-secondary/50 py-2">
              Sin eventos críticos o daño recibido en este turno.
            </p>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={onConfirm}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-headline font-bold uppercase tracking-widest py-3 clip-chamfer transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} /> Confirmar y Aplicar Turno
          </button>
        </div>
      </div>
    </div>
  );
}
