import { useAppStore } from '@/lib/store';
import { ComisionPage } from './ComisionPage';
import { HojaServicioPage } from './HojaServicioPage';

export function MandoPage() {
  const activeSubTab = useAppStore(s => s.activeSubTab);

  if (activeSubTab === 'hoja') {
    return <HojaServicioPage />;
  }

  return <ComisionPage />;
}
