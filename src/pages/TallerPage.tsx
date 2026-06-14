// ══════════════════════════════════════════════════════════════
//  TALLER PAGE — Pagina standalone (sidebar). Hospeda TallerModal
//  como contenido principal (tab Factura) y placeholder para tab
//  Prioridades (sistema priorizacion reparaciones por tiempo).
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { TallerModal, genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { commitLibroEntryAndTreasury } from '@/lib/sheets-service';
import { useAppStore } from '@/lib/store';

export function TallerPage() {
  const { activeSubTab, setActiveSubTab, campaign } = useAppStore();
  const view: 'factura' | 'prioridades' = activeSubTab === 'prioridades' ? 'prioridades' : 'factura';

  // Forzar tab activo a 'factura' si la actual no pertenece a Taller.
  useEffect(() => {
    if (activeSubTab !== 'factura' && activeSubTab !== 'prioridades') {
      setActiveSubTab('factura');
    }
  }, [activeSubTab, setActiveSubTab]);

  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  if (view === 'prioridades') {
    return <PrioridadesPlaceholder />;
  }

  // Factura — embebe TallerModal en modo pagina (no overlay).
  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease]">
      <TallerInlineWrapper campaignDate={campaignDate} />
    </div>
  );
}

// ── Wrapper: usa TallerModal sin onClose porque vive como pagina ──

function TallerInlineWrapper({ campaignDate }: { campaignDate: string }) {
  // Trigger remount tras commit para limpiar estado interno del modal.
  const [resetKey, setResetKey] = useState(0);
  return (
    <TallerModal
      key={resetKey}
      campaignDate={campaignDate}
      onClose={() => setResetKey(k => k + 1)}
      onCommit={async (total, concepto, mechName) => {
        await commitLibroEntryAndTreasury({
          id: genId('lm'),
          fecha: campaignDate,
          concepto,
          cantidad: Math.round(total),
          tipo: 'gasto',
          categoria: 'repuestos',
          nota: `Reparación ${mechName} · Taller`,
          jugador: '',
        });
        setResetKey(k => k + 1);
      }}
    />
  );
}

// ── Placeholder prioridades ──

function PrioridadesPlaceholder() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-[fadeInUp_0.3s_ease]">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-3">
        Prioridades de reparación
      </h1>
      <div className="font-mono text-[11px] text-secondary/70 leading-relaxed space-y-3">
        <p>
          Sistema en construcción. Permitirá ordenar reparaciones por arrastre con
          presupuesto de tiempo (horas / días / semanas), turnos extendidos y
          presets de contexto (Persecución / Defensa de base / Manual).
        </p>
        <p>
          Próxima sesión: componentes TimeInputPanel, PresetSelector, BudgetBar,
          RepairItemList, ArmorOfferPanel, ResultsSummary.
        </p>
      </div>
    </div>
  );
}
