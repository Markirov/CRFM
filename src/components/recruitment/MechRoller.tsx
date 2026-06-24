// Roll BattleMech inicial: modificador + tirada + clamp + selección modelo.
import type { AssignedMech, CampaignId } from '@/lib/recruitment/types';
import {
  rollMech, clearMechAssignment, ALLOWED_MODIFIERS, getISGroupModels, pickModelFromGroup,
} from '@/lib/recruitment/mech-assignment';

export function MechRoller({
  campaignId, assigned, onChange,
}: {
  campaignId: CampaignId;
  assigned:   AssignedMech;
  onChange:   (a: AssignedMech) => void;
}) {
  const mods = ALLOWED_MODIFIERS[campaignId];
  const groupModels = campaignId === 'IS' ? getISGroupModels(assigned.finalRoll) : [];
  const needsPick = campaignId === 'IS' && groupModels.length > 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr] gap-2 items-end">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Modificador (coste)</span>
        <select
          value={assigned.modifier}
          onChange={e => {
            const m = parseInt(e.target.value);
            onChange(clearMechAssignment(m));
          }}
          className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
        >
          {mods.map(m => (
            <option key={m} value={m}>{m > 0 ? `+${m}` : m} ({m * 10 > 0 ? `-${m * 10}` : `+${-m * 10}`} pts)</option>
          ))}
        </select>
      </label>
      <button
        onClick={() => onChange(rollMech(campaignId, assigned.modifier))}
        className="px-4 py-1.5 font-headline text-xs font-bold tracking-widest uppercase border border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
      >
        🎲 Tirar
      </button>
      <div className="font-mono text-[11px] text-cream bg-surface-container border border-outline-variant/40 px-2 py-1 min-h-[28px] flex items-center">
        {assigned.rawRoll === null
          ? <span className="opacity-50">Sin tirada…</span>
          : (
            <span>
              Raw {assigned.rawRoll} {assigned.modifier !== 0 ? `${assigned.modifier > 0 ? '+' : ''}${assigned.modifier}` : ''} = <b>{assigned.finalRoll}</b>
              {assigned.model && <> → <span className="text-amber-400">{assigned.model} ({assigned.tons}t)</span></>}
            </span>
          )
        }
      </div>
      {needsPick && (
        <label className="flex flex-col gap-1 md:col-span-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400">Elige modelo del grupo</span>
          <select
            value={assigned.model ?? ''}
            onChange={e => onChange(pickModelFromGroup(assigned, e.target.value))}
            className="bg-surface-container border border-amber-400/40 px-2 py-1 font-mono text-[11px] text-cream"
          >
            {groupModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
