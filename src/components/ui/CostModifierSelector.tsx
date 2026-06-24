import { ESTADO_FACTURA_PCT } from '@/lib/repair-engine';

interface CostModifierSelectorProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}

export function CostModifierSelector({
  value,
  onChange,
  label = 'Estado factura (%)',
}: CostModifierSelectorProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">{label}</label>
        <select
          value={value}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            onChange(Number.isFinite(v) ? v : 100);
          }}
          className="w-32 bg-surface-container border border-outline-variant/40 px-2 py-1.5 font-mono text-[11px] text-secondary outline-none focus:border-primary-container/60"
        >
          {ESTADO_FACTURA_PCT.map(p => (
            <option key={p} value={p}>{p}%</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Quick %</label>
        <div className="flex gap-1">
          {[0, 25, 50, 75, 100].map(p => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-3 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                value === p
                  ? 'bg-primary-container/15 border-primary-container text-primary-container'
                  : 'bg-surface-container hover:bg-outline-variant/20 border-outline-variant/40 text-primary'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
