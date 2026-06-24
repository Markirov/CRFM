// Habilidades extra: slots según INT, niveles 1..8.
import { useMemo } from 'react';
import type { ExtraSkillEntry } from '@/lib/recruitment/types';
import { SKILLS, EXTRA_SKILLS_LEGACY_IDS, SKILL_BY_ID } from '@/lib/recruitment/catalogs';
import { SKILL_BUY_COSTS } from '@/lib/recruitment/costs';

function intSlots(intValue: number | null): number {
  if (intValue === null || intValue < 7) return 0;
  if (intValue === 7) return 1;
  if (intValue === 8) return 2;
  return 3;
}

export function ExtraSkillsPicker({
  extras, intValue, grantedSkillIds, onChange,
}: {
  extras: ExtraSkillEntry[];
  intValue: number | null;
  grantedSkillIds: string[];
  onChange: (e: ExtraSkillEntry[]) => void;
}) {
  const slots = intSlots(intValue);
  const filled = useMemo(() => {
    const arr: ExtraSkillEntry[] = [...extras];
    while (arr.length < slots) arr.push({ skillId: '', level: 0 });
    return arr.slice(0, slots);
  }, [extras, slots]);

  const setSlot = (i: number, patch: Partial<ExtraSkillEntry>) => {
    const next = [...filled];
    next[i] = { ...next[i], ...patch };
    onChange(next.filter(s => s.skillId || s.level > 0));
  };

  const availableForSlot = (currentId: string) => {
    const chosen = new Set(filled.map(s => s.skillId).filter(id => id !== currentId));
    return SKILLS
      .filter(s => EXTRA_SKILLS_LEGACY_IDS.includes(s.id))
      .filter(s => !chosen.has(s.id))
      .filter(s => !grantedSkillIds.includes(s.id) || s.id === currentId);
  };

  if (slots === 0) {
    return <div className="font-mono text-[10px] text-secondary/50 italic">INT ≥ 7 desbloquea habilidades extra.</div>;
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Habilidades extra ({slots} disponibles · INT {intValue})</div>
      {filled.map((s, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-1 items-center">
          <select
            value={s.skillId}
            onChange={e => setSlot(i, { skillId: e.target.value })}
            className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-cream"
          >
            <option value="">-- Habilidad --</option>
            {availableForSlot(s.skillId).map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label} [{opt.governingAttribute}]</option>
            ))}
          </select>
          <select
            value={s.level || ''}
            onChange={e => setSlot(i, { level: e.target.value ? parseInt(e.target.value) : 0 })}
            disabled={!s.skillId}
            className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-cream disabled:opacity-40"
          >
            <option value="">Nivel</option>
            {Object.entries(SKILL_BUY_COSTS).map(([lvl, cost]) => (
              <option key={lvl} value={lvl}>{lvl} ({cost} pts)</option>
            ))}
          </select>
          <span className="font-mono text-[10px] text-secondary/60 w-12 text-right tabular-nums">
            {s.skillId && SKILL_BY_ID.get(s.skillId)?.governingAttribute}
          </span>
        </div>
      ))}
    </div>
  );
}
