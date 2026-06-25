// ══════════════════════════════════════════════════════════════
//  ReclutamientoPage — Generador de personajes MechWarrior
//
//  Implementa spec docs/personajes_y_pilotos_rpg/
//                  especificacion-generador-personajes-legacy.md
//
//  Estado único en useRecruitment (CharacterDraft).
//  Validación + costes live. Persistencia y ficha-preview en
//  iteraciones siguientes.
// ══════════════════════════════════════════════════════════════

import { Users, RotateCcw, FileCheck2 } from 'lucide-react';
import { useRecruitment } from '@/hooks/useRecruitment';
import { CostSummary } from '@/components/recruitment/CostSummary';
import { AttributePicker } from '@/components/recruitment/AttributePicker';
import { BackgroundPicker } from '@/components/recruitment/BackgroundPicker';
import { TraitsPicker } from '@/components/recruitment/TraitsPicker';
import { ExtraSkillsPicker } from '@/components/recruitment/ExtraSkillsPicker';
import { MechRoller } from '@/components/recruitment/MechRoller';
import { PhysicalRoller } from '@/components/recruitment/PhysicalRoller';
import { IssuesList } from '@/components/recruitment/IssuesList';
import { EDUCATION_BY_ID } from '@/lib/recruitment/catalogs';
import { useMemo, useState } from 'react';
import type { CampaignId } from '@/lib/recruitment/types';
import { createRecruitmentRequest } from '@/lib/recruitment-requests-service';

export function ReclutamientoPage() {
  const r = useRecruitment();
  const { draft, costs, issues, hasErrors } = r;

  // Habilidades concedidas por formación + noble skill (para filtrar ExtraSkillsPicker).
  const grantedSkillIds = useMemo(() => {
    const edu = draft.background.educationId ? EDUCATION_BY_ID.get(draft.background.educationId) : null;
    const ids = (edu?.grantedSkills.map(g => g.skillId) ?? []);
    if (draft.background.nobleSkillId) ids.push(draft.background.nobleSkillId);
    return ids;
  }, [draft.background.educationId, draft.background.nobleSkillId]);

  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');

  const handleGenerar = async () => {
    if (hasErrors) return;
    if (!confirm('Enviar solicitud al Admin? El personaje quedará pendiente hasta que el Admin elija qué PNJ sustituye.')) return;
    setSubmitState('sending');
    setSubmitError('');
    try {
      await createRecruitmentRequest(draft);
      setSubmitState('done');
      setTimeout(() => { r.reset(); setSubmitState('idle'); }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : String(err));
      setSubmitState('error');
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase flex items-center gap-2">
          <Users size={20} /> Reclutamiento · Generador de Personajes
        </h1>
        <button
          onClick={() => { if (confirm('¿Vaciar formulario?')) r.reset(); }}
          className="px-3 py-1.5 border border-outline-variant/40 text-secondary/80 hover:bg-surface-container-high font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
        >
          <RotateCcw size={12} /> Reiniciar
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* ── Form principal ── */}
        <div className="space-y-4">
          <Section title="Identidad">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <LabeledInput
                label="Nombre del Personaje"
                value={draft.identity.name}
                onChange={v => r.setIdentity({ name: v })}
              />
              <LabeledInput
                label="Jugador"
                value={draft.identity.playerName}
                onChange={v => r.setIdentity({ playerName: v })}
              />
            </div>
          </Section>

          <Section title="Configuración de Campaña">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Campaña</span>
                <select
                  value={draft.campaign.id}
                  onChange={e => r.setCampaign({ id: e.target.value as CampaignId })}
                  className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
                >
                  <option value="ELH">Eridani Light Horse (ELH)</option>
                  <option value="IS">Esfera Interior (IS)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Década base</span>
                <select
                  value={draft.campaign.baseDecade}
                  onChange={e => r.setCampaign({ baseDecade: parseInt(e.target.value) })}
                  className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
                >
                  {[2990, 3000, 3010, 3020, 3030, 3040].map(d => <option key={d} value={d}>{d}s</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">Año (dígito)</span>
                <select
                  value={draft.campaign.yearDigit}
                  onChange={e => r.setCampaign({ yearDigit: parseInt(e.target.value) })}
                  className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-cream"
                >
                  {[0,1,2,3,4,5,6,7,8,9].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            </div>
          </Section>

          <Section title="Atributos (coste variable)">
            <AttributePicker attributes={draft.attributes} onChange={r.setAttribute} />
          </Section>

          <Section title="Origen, Afiliación y Formación">
            <BackgroundPicker
              background={draft.background}
              campaignId={draft.campaign.id}
              intValue={draft.attributes.INT}
              onChange={r.setBackground}
            />
          </Section>

          <Section title="Méritos y Deméritos (máx 6 cada uno)">
            <TraitsPicker traits={draft.traits} onChange={r.setTraits} />
          </Section>

          <Section title="Habilidades extra (según INT)">
            <ExtraSkillsPicker
              extras={draft.extraSkills}
              intValue={draft.attributes.INT}
              grantedSkillIds={grantedSkillIds}
              onChange={r.setExtraSkills}
            />
          </Section>

          <Section title="Asignación de BattleMech">
            <MechRoller
              campaignId={draft.campaign.id}
              assigned={draft.assignedMech}
              onChange={r.setMech}
            />
          </Section>

          <Section title="Datos físicos">
            <PhysicalRoller
              physical={draft.physical}
              campaign={draft.campaign}
              onChange={r.setPhysical}
            />
          </Section>

          <Section title="Validación">
            <IssuesList issues={issues} />
            {issues.length === 0 && (
              <div className="font-mono text-[10px] text-green-400">✓ Sin avisos. Listo para generar ficha.</div>
            )}
          </Section>

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-outline-variant/30">
            {submitState === 'done' && (
              <span className="font-mono text-[11px] text-green-400">✓ Solicitud enviada. Admin notificado.</span>
            )}
            {submitState === 'error' && (
              <span className="font-mono text-[11px] text-error">Error: {submitError || 'al enviar'}</span>
            )}
            <button
              onClick={handleGenerar}
              disabled={hasErrors || submitState === 'sending' || submitState === 'done'}
              className="px-4 py-2 font-headline text-xs font-bold tracking-widest uppercase border-2 clip-chamfer flex items-center gap-2
                bg-primary-container text-on-primary-container hover:bg-primary
                disabled:bg-error/20 disabled:text-error disabled:border-error/40 disabled:cursor-not-allowed border-primary"
            >
              <FileCheck2 size={14} />
              {hasErrors ? 'Corrige errores'
                : submitState === 'sending' ? 'Enviando...'
                : submitState === 'done' ? 'Enviada ✓'
                : 'Enviar solicitud'}
            </button>
          </div>
        </div>

        {/* ── Sidebar costes ── */}
        <aside>
          <CostSummary costs={costs} />
        </aside>
      </div>
    </div>
  );
}

// ── Helpers UI ──────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-2">{title}</h2>
      {children}
    </section>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/70">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
      />
    </label>
  );
}
