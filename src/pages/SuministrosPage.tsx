import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { MercadoTab } from '../components/hangar/MercadoTab';
import { ViajesTab } from '../components/logistica/ViajesTab';
import { loadHangar } from '@/lib/firebase-service';
import type { HangarItem } from '@/types/campaign';

export function SuministrosPage() {
  const { activeSubTab } = useAppStore();
  const [items, setItems] = useState<HangarItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await loadHangar();
      if (res.success && Array.isArray(res.data?.items)) {
        setItems(res.data.items as HangarItem[]);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  if (activeSubTab === 'viajes') {
    return <ViajesTab />;
  }

  // Por defecto, Mercado
  return <MercadoTab items={items} refresh={refresh} />;
}
