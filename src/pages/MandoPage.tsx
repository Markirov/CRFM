import { useAppStore } from '@/lib/store';
import { ComisionPage } from './ComisionPage';
import { HojaServicioPage } from './HojaServicioPage';

export function MandoPage() {
  const { activeSubTab } = useAppStore();

  if (activeSubTab === 'hoja') {
    return <HojaServicioPage />;
  }

  return <ComisionPage />;
}
