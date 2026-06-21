import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { saveConfigBatch } from '@/lib/firebase-service';
import { Package, Trash2, Shield } from 'lucide-react';
import { usePerm } from '@/hooks/usePerm';

export function MaterialTab() {
  const { campaign, setCampaign } = useAppStore();
  const { writable } = usePerm('hangar');
  const almacen = campaign.almacen || {};

  const handleRemove = async (item: string) => {
    if (!writable) return;
    const ok = window.confirm(`¿Descartar todo el stock de ${item}?`);
    if (!ok) return;

    const newAlmacen = { ...almacen };
    delete newAlmacen[item];

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
  };

  const getIcon = (item: string) => {
    if (item.toLowerCase().includes('armor') || item.toLowerCase().includes('blindaje')) return <Shield className="w-4 h-4 text-primary-container" />;
    if (item.toLowerCase().includes('ammo') || item.toLowerCase().includes('municion')) return <div className="w-4 h-4 rounded-full border-2 border-primary-container flex items-center justify-center text-[8px] font-black">A</div>;
    return <Package className="w-4 h-4 text-secondary/60" />;
  };

  const entries = Object.entries(almacen).filter(([_, qty]) => qty > 0);

  return (
    <div className="space-y-6">
      <div className="bg-surface/50 border border-outline-variant/30 rounded-xl overflow-hidden p-4">
        <h2 className="font-headline text-lg text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventario Físico
        </h2>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-secondary/60 font-mono text-sm">
            El almacén está vacío. Compra material en el Mercado o extrae munición de unidades salvadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.sort((a,b) => a[0].localeCompare(b[0])).map(([name, qty]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-surface border border-outline-variant/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {getIcon(name)}
                  <div>
                    <div className="font-mono text-sm text-cream">{name}</div>
                    <div className="font-mono text-[10px] text-secondary/70 uppercase">
                      {name.toLowerCase().includes('armor') ? 'Puntos' : 
                       name.toLowerCase().includes('ammo') ? 'Rondas/Misiles' : 'Unidades'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-mono text-lg font-black text-primary-container">{qty.toLocaleString('es-ES')}</div>
                  {writable && (
                    <button onClick={() => handleRemove(name)} className="p-1.5 hover:bg-error/10 text-error/60 hover:text-error rounded transition-colors" title="Descartar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
