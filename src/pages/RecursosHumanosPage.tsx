import { useAppStore } from '@/lib/store';
import { BarraconesPage } from './BarraconesPage';
import { ReclutamientoPage } from './ReclutamientoPage';
import { LogrosPage } from './LogrosPage';
import { PersonalTab } from './FinanzasPage';

export function RecursosHumanosPage() {
  const activeSubTab = useAppStore(s => s.activeSubTab);
  const campaign = useAppStore(s => s.campaign);

  if (activeSubTab === 'reclutamiento') return <ReclutamientoPage />;
  if (activeSubTab === 'barracones') return <BarraconesPage />;
  if (activeSubTab === 'logros') return <LogrosPage />;
  
  return <PersonalTab campaignDate={`${campaign.campaignYear}-${String(campaign.campaignMonth).padStart(2, '0')}-01`} />;
}
