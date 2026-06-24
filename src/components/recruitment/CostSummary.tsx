// CostSummary — desglose live de los 150 pts.
import type { CostBreakdown } from '@/lib/recruitment/types';

export function CostSummary({ costs }: { costs: CostBreakdown }) {
  const negative = costs.remaining < 0;
  const color = negative
    ? 'border-error/60 text-error bg-error/10'
    : 'border-green-500/60 text-green-400 bg-green-500/10';
  return (
    <div className={`sticky top-4 p-3 border-2 ${color} clip-chamfer`}>
      <div className="font-headline text-[10px] uppercase tracking-widest opacity-70 mb-1">Puntos restantes</div>
      <div className="font-headline text-3xl font-black tabular-nums">{costs.remaining}</div>
      <div className="font-mono text-[9px] mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 opacity-90">
        <span>Atributos:</span> <span className="text-right tabular-nums">{costs.attributes}</span>
        <span>Formación:</span> <span className="text-right tabular-nums">{costs.education}</span>
        <span>Méritos:</span> <span className="text-right tabular-nums">{costs.merits}</span>
        <span>Deméritos:</span> <span className="text-right tabular-nums">-{costs.demeritCredit}</span>
        <span>Habilidades:</span> <span className="text-right tabular-nums">{costs.extraSkills}</span>
        <span>Mod. Mech:</span> <span className="text-right tabular-nums">{costs.mechModifier}</span>
        <span className="font-bold border-t border-current/40 pt-0.5">Gastado:</span>
        <span className="text-right tabular-nums font-bold border-t border-current/40 pt-0.5">{costs.spent}</span>
      </div>
    </div>
  );
}
