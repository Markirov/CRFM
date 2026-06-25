import { useAppStore } from '@/lib/store';
import { BarraconesPage } from './BarraconesPage';
import { ReclutamientoPage } from './ReclutamientoPage';
import { LogrosPage } from './LogrosPage';
import { PersonalTab } from './FinanzasPage';
import { RecruitmentRequestsTab } from '@/components/rrhh/RecruitmentRequestsTab';

export function RecursosHumanosPage() {
  const activeSubTab = useAppStore(s => s.activeSubTab);
  const campaign = useAppStore(s => s.campaign);

  if (activeSubTab === 'reclutamiento') return <ReclutamientoPage />;
  if (activeSubTab === 'solicitudes') return <div className="p-4 sm:p-6 max-w-4xl mx-auto"><RecruitmentRequestsTab /></div>;
  if (activeSubTab === 'barracones') return <BarraconesPage />;
  if (activeSubTab === 'logros') return <LogrosPage />;

  return <PersonalTab campaignDate={`${campaign.campaignYear}-${String(campaign.campaignMonth).padStart(2, '0')}-01`} />;
}
