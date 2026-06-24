import { useAppStore } from '@/lib/store';
import { MercadoTab } from '../components/hangar/MercadoTab';
import { ViajesTab } from '../components/logistica/ViajesTab';
import { MaterialTab } from '../components/hangar/MaterialTab';

export function SuministrosPage() {
  const activeSubTab = useAppStore(s => s.activeSubTab);

  if (activeSubTab === 'viajes') {
    return <ViajesTab />;
  }
  if (activeSubTab === 'almacen') {
    return <MaterialTab />;
  }

  // Por defecto, Mercado
  return <MercadoTab />;
}
