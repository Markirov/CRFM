// Méritos / Deméritos hasta 6 slots cada uno con dropdowns no-duplicados.
import { useMemo } from 'react';
import { MERITS, DEMERITS, MERIT_BY_ID, DEMERIT_BY_ID } from '@/lib/recruitment/catalogs';
import { MAX_TRAITS, type Traits } from '@/lib/recruitment/types';

export function TraitsPicker({
  traits, onChange,
}: {
  traits: Traits;
  onChange: (t: Traits) => void;
}) {
  const meritSlots = useMemo(() => fillSlots(traits.meritIds, MAX_TRAITS), [traits.meritIds]);
  const demeritSlots = useMemo(() => fillSlots(traits.demeritIds, MAX_TRAITS), [traits.demeritIds]);

  const setMeritAt = (i: number, id: string) => {
    const next = [...meritSlots]; next[i] = id;
    onChange({ ...traits, meritIds: next.filter(Boolean) });
  };
  const setDemeritAt = (i: number, id: string) => {
    const next = [...demeritSlots]; next[i] = id;
    onChange({ ...traits, demeritIds: next.filter(Boolean) });
  };

  // Filtra opciones: oculta IDs ya elegidos en otros slots o concedidos por formación.
  const availableMerits = (currentId: string) => MERITS.filter(m => {
    if (m.id === currentId) return true;
    if (meritSlots.includes(m.id)) return false;
    if (traits.grantedMeritIds.includes(m.id)) return false;
    return true;
  });
  const availableDemerits = (currentId: string) => DEMERITS.filter(d => {
    if (d.id === currentId) return true;
    if (demeritSlots.includes(d.id)) return false;
    if (traits.grantedDemeritIds.includes(d.id)) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/70 mb-1">Méritos (máx {MAX_TRAITS})</div>
        {traits.grantedMeritIds.length > 0 && (
          <div className="mb-2 font-mono text-[10px] text-amber-400">
            Concedidos: {traits.grantedMeritIds.map(id => MERIT_BY_ID.get(id)?.label ?? id).join(', ')}
          </div>
        )}
        <div className="grid grid-cols-1 gap-1">
          {meritSlots.map((id, i) => (
            <select
              key={i}
              value={id}
              onChange={e => setMeritAt(i, e.target.value)}
              className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-cream"
            >
              <option value="">-- Ninguno --</option>
              {availableMerits(id).map(m => (
                <option key={m.id} value={m.id}>{m.label} ({m.cost} pts)</option>
              ))}
            </select>
          ))}
        </div>
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/70 mb-1">Deméritos (máx {MAX_TRAITS})</div>
        {traits.grantedDemeritIds.length > 0 && (
          <div className="mb-2 font-mono text-[10px] text-amber-400">
            Concedidos: {traits.grantedDemeritIds.map(id => DEMERIT_BY_ID.get(id)?.label ?? id).join(', ')}
          </div>
        )}
        <div className="grid grid-cols-1 gap-1">
          {demeritSlots.map((id, i) => (
            <select
              key={i}
              value={id}
              onChange={e => setDemeritAt(i, e.target.value)}
              className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-cream"
            >
              <option value="">-- Ninguno --</option>
              {availableDemerits(id).map(d => (
                <option key={d.id} value={d.id}>{d.label} (+{d.reward} pts)</option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </div>
  );
}

function fillSlots(ids: string[], n: number): string[] {
  const out = ids.slice(0, n);
  while (out.length < n) out.push('');
  return out;
}
