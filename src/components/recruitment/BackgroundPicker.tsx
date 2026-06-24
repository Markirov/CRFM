// Origen + Afiliación + Formación + nobleSkill (si Tutores Nobles).
import { useMemo } from 'react';
import type { Background, CampaignId } from '@/lib/recruitment/types';
import { ORIGINS, AFFILIATIONS, EDUCATIONS } from '@/lib/recruitment/catalogs';

export function BackgroundPicker({
  background, campaignId, intValue, onChange,
}: {
  background: Background;
  campaignId: CampaignId;
  intValue:   number | null;
  onChange:   (b: Background) => void;
}) {
  const educationsAvailable = useMemo(() =>
    EDUCATIONS.map(e => ({ ...e, enabled: intValue !== null && intValue >= e.minInt })),
    [intValue],
  );

  const elhLocked = campaignId === 'ELH';
  const affiliationValue = elhLocked ? 'mercenario' : (background.affiliationId ?? '');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Origen</span>
        <select
          value={background.originId ?? ''}
          onChange={e => onChange({ ...background, originId: e.target.value || null })}
          className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
        >
          <option value="">-- Selecciona --</option>
          {ORIGINS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">
          Afiliación {elhLocked && <span className="text-amber-400">(ELH: Mercenario fijo)</span>}
        </span>
        <select
          value={affiliationValue}
          disabled={elhLocked}
          onChange={e => onChange({ ...background, affiliationId: e.target.value || null })}
          className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream disabled:opacity-50"
        >
          <option value="">-- Selecciona --</option>
          {AFFILIATIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">
          Formación {intValue === null && <span className="text-amber-400">(elige INT primero)</span>}
        </span>
        <select
          value={background.educationId ?? ''}
          disabled={intValue === null}
          onChange={e => {
            const id = (e.target.value || null) as Background['educationId'];
            const next: Background = { ...background, educationId: id };
            // Limpia nobleSkill si cambias a formación que no la requiere
            if (id !== 'tutores-nobles') next.nobleSkillId = null;
            onChange(next);
          }}
          className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream disabled:opacity-50"
        >
          <option value="">-- Selecciona formación --</option>
          {educationsAvailable.map(e => (
            <option key={e.id} value={e.id} disabled={!e.enabled}>
              {e.label} ({e.cost} pts){!e.enabled ? ` · req. INT ${e.minInt}` : ''}
            </option>
          ))}
        </select>
      </label>

      {background.educationId === 'tutores-nobles' && (
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400">Habilidad de tutor noble</span>
          <select
            value={background.nobleSkillId ?? ''}
            onChange={e => onChange({ ...background, nobleSkillId: (e.target.value || null) as any })}
            className="bg-surface-container border border-amber-400/40 px-2 py-1 font-mono text-[11px] text-cream"
          >
            <option value="">-- Elige --</option>
            <option value="espada">Espada</option>
            <option value="equitacion">Equitación</option>
          </select>
        </label>
      )}
    </div>
  );
}
