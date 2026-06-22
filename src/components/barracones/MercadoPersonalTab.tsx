import { useState } from 'react';
import type { Pilot } from '@/lib/barracones-types';
import { MERCADO_PERSONAL } from '@/lib/mercado-personal';
import { useAppStore } from '@/lib/store';
import { T } from '@/lib/theme';
import { ShoppingCart, DollarSign, Info } from 'lucide-react';
import { tPersonal } from '@/lib/translator';

interface MercadoPersonalTabProps {
  pilot: Pilot;
  onSetPatrimonio: (v: number) => void;
  onSetEquipoPersonal: (v: string) => void;
  onSaveFirebase?: (p: Pilot) => void;
}

export function MercadoPersonalTab({ pilot, onSetPatrimonio, onSetEquipoPersonal, onSaveFirebase }: MercadoPersonalTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Vestimenta');
  const [selectedLocation, setSelectedLocation] = useState<'Esfera Interior' | 'Clanes'>('Esfera Interior');
  const { campaign } = useAppStore();
  const currentYear = campaign?.campaignYear || 3025;
  
  const currentFunds = pilot.patrimonio || 0;
  const currentEquipo = pilot.equipoPersonal || '';

  const handleBuy = (itemId: string) => {
    const item = MERCADO_PERSONAL.find(i => i.id === itemId);
    if (!item) return;

    if (currentFunds < item.precio) {
      alert('Fondos insuficientes.');
      return;
    }

    if (!confirm(`¿Confirmas la compra de ${tPersonal(item.nombre)} por ${item.precio} ₡?`)) {
      return;
    }

    const newFunds = currentFunds - item.precio;
    const newEquipo = currentEquipo ? `${currentEquipo}\n- ${tPersonal(item.nombre)}` : `- ${tPersonal(item.nombre)}`;

    onSetPatrimonio(newFunds);
    onSetEquipoPersonal(newEquipo);

    if (onSaveFirebase) {
      onSaveFirebase({
        ...pilot,
        patrimonio: newFunds,
        equipoPersonal: newEquipo
      });
    }
    
    alert(`¡Has adquirido: ${tPersonal(item.nombre)}!`);
  };

  const fmtCbills = (val: number) => {
    return new Intl.NumberFormat('es-ES').format(val) + ' ₡';
  };

  // Agrupar y filtrar por año de campaña y locación (Facción)
  const availableItems = MERCADO_PERSONAL.filter(i => {
    // Filtro por año
    if (i.introYear && i.introYear > currentYear) return false;
    
    // Filtro por facción/tecnología
    if (i.faccion === 'General' || i.faccion === 'Liga Estelar') return true;
    if (i.faccion && i.faccion !== selectedLocation) return false;
    
    return true;
  });

  const categorias = Array.from(new Set(availableItems.map(i => i.categoria)));

  // Fallback si la categoría seleccionada se queda sin items
  if (!categorias.includes(selectedCategory as any) && categorias.length > 0) {
    setSelectedCategory(categorias[0]);
  }

  const itemsToShow = availableItems.filter(i => i.categoria === selectedCategory);

  return (
    <div className="flex flex-col gap-6 animate-[fadeInUp_0.3s_ease]">
      {/* Cabecera / Info */}
      <div className="flex gap-4 p-4 rounded bg-surface-container border border-outline-variant/30">
        <ShoppingCart size={24} color={T.gold} className="shrink-0 mt-1" />
        <div className="flex-1 text-[13px] text-secondary/90 font-sans leading-relaxed">
          <strong className="text-primary-container">Mercado Privado.</strong> Catálogo ajustado al año de campaña ({currentYear}) y al mercado local.
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-green-400 font-mono text-base">
              <DollarSign size={16} /> Fondos disponibles: <strong>{fmtCbills(currentFunds)}</strong>
            </div>
            {/* Selector de Mercado Local */}
            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4">
              <span className="text-outline text-[10px] uppercase tracking-wider font-headline">Mercado Local:</span>
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value as any)}
                className="bg-[#111] text-secondary text-[11px] font-mono p-1 rounded border border-outline-variant/30 focus:border-primary-container focus:outline-none"
              >
                <option value="Esfera Interior">Esfera Interior</option>
                <option value="Clanes">Espacio del Clan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Categorías (Tabs compactas) */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant/20 pb-2">
        {categorias.map(cat => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 font-headline text-[11px] uppercase tracking-widest transition-all rounded-t border-b-2 ${
              selectedCategory === cat 
                ? 'border-primary-container text-primary-container bg-primary-container/10' 
                : 'border-transparent text-outline hover:text-secondary hover:bg-surface-container-high'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catálogo (Lista filtrada) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemsToShow.map(item => (
          <div key={item.id} className="flex flex-col justify-between p-3 bg-[#111] border border-outline-variant/30 rounded relative group hover:border-primary-container/50 transition-colors h-full">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="font-headline text-[12px] text-primary-container uppercase tracking-wide leading-tight">
                  {tPersonal(item.nombre)}
                </div>
                <div className="font-mono text-[11px] text-green-400/90 whitespace-nowrap bg-green-900/20 px-1.5 py-0.5 rounded">
                  {fmtCbills(item.precio)}
                </div>
              </div>
              
              {/* Metadatos (Facción, Peso, Volumen) */}
              <div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] font-mono">
                {item.faccion && (
                  <span className={`px-1.5 py-[1px] rounded ${
                    item.faccion === 'Clanes' ? 'bg-primary-container/20 text-primary-container border border-primary-container/30' :
                    item.faccion === 'Liga Estelar' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    item.faccion === 'Esfera Interior' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-outline-variant/30 text-outline border border-outline-variant/40'
                  }`}>
                    {item.faccion}
                  </span>
                )}
                {item.peso !== undefined && (
                  <span className="text-secondary/60 bg-[#1a1a1a] px-1.5 py-[1px] rounded border border-outline-variant/20">
                    ⚖️ {item.peso} kg
                  </span>
                )}
                {item.volumen && (
                  <span className="text-secondary/60 bg-[#1a1a1a] px-1.5 py-[1px] rounded border border-outline-variant/20">
                    📦 {item.volumen}
                  </span>
                )}
              </div>

              <div className="text-[10px] text-secondary/70 font-sans leading-relaxed mb-3">
                {item.descripcion}
              </div>
            </div>
            <button 
              onClick={() => handleBuy(item.id)}
              disabled={currentFunds < item.precio}
              className={`py-1.5 w-full border font-mono text-[11px] tracking-widest uppercase transition-all mt-auto ${
                currentFunds >= item.precio 
                  ? 'border-outline-variant/30 text-outline hover:text-primary-container hover:border-primary-container/60 hover:bg-primary-container/10' 
                  : 'border-error/20 text-error/40 cursor-not-allowed'
              }`}
            >
              {currentFunds >= item.precio ? 'Comprar' : 'Fondos Insuficientes'}
            </button>
          </div>
        ))}
      </div>

      {/* Info extra */}
      <div className="flex items-center gap-2 text-[10px] text-outline/60 font-mono">
        <Info size={12} />
        <span>Las compras se deducen automáticamente de tu Patrimonio y se anotan en tu Inventario (Finanzas).</span>
      </div>
    </div>
  );
}
