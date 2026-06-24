// Selector de atributos 2..12 con coste live.
import { ATTRIBUTES, type AttributeId, type AttributeMap, MIN_ATTR, MAX_ATTR } from '@/lib/recruitment/types';
import { ATTRIBUTE_COSTS } from '@/lib/recruitment/costs';

const LABEL: Record<AttributeId, string> = {
  FUE: 'Fuerza (FUE)',
  DES: 'Destreza (DES)',
  INT: 'Inteligencia (INT)',
  CAR: 'Carisma (CAR)',
};

export function AttributePicker({
  attributes, onChange,
}: {
  attributes: AttributeMap;
  onChange: (a: AttributeId, v: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {ATTRIBUTES.map(a => {
        const v = attributes[a];
        const cost = v === null ? 0 : ATTRIBUTE_COSTS[a][v] ?? 0;
        const sign = cost > 0 ? `-${cost}` : cost < 0 ? `+${-cost}` : '0';
        const color = cost > 0 ? 'text-error' : cost < 0 ? 'text-green-400' : 'text-secondary/60';
        return (
          <label key={a} className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">{LABEL[a]}</span>
            <select
              value={v ?? ''}
              onChange={e => onChange(a, e.target.value === '' ? null : parseInt(e.target.value))}
              className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
            >
              <option value="">--</option>
              {Array.from({ length: MAX_ATTR - MIN_ATTR + 1 }, (_, i) => MIN_ATTR + i).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className={`font-mono text-[10px] tabular-nums ${color}`}>{sign} pts</span>
          </label>
        );
      })}
    </div>
  );
}
