import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { saveConfigBatch, commitLibroEntryAndTreasury } from '@/lib/firebase-service';
import { Package, Trash2, Shield, Flame, Crosshair, DollarSign, X } from 'lucide-react';
import { usePerm } from '@/hooks/usePerm';
import { tWeapon } from '@/lib/translator';
import { weaponPriceFromName } from '@/lib/weapon-prices';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';

/** Modal venta granular item del almacén. */
function SellModal({ item, displayName, maxQty, isWeapon, onClose, onConfirm }: {
  item: string;
  displayName: string;
  maxQty: number;
  isWeapon: boolean;
  onClose: () => void;
  onConfirm: (cantidad: number, total: number) => Promise<void>;
}) {
  const [cantidad, setCantidad] = useState<number>(maxQty);
  const [committing, setCommitting] = useState(false);

  const pricePerUnit = isWeapon ? Math.round(weaponPriceFromName(item) * 0.3) : 0;
  const sugerido = pricePerUnit * cantidad;
  const [precioTotal, setPrecioTotal] = useState<number>(sugerido);

  // Re-sync precio sugerido al cambiar cantidad si user no editó
  const [editado, setEditado] = useState(false);
  const handleCantidad = (n: number) => {
    const c = Math.max(1, Math.min(maxQty, Math.floor(n)));
    setCantidad(c);
    if (!editado) setPrecioTotal(pricePerUnit * c);
  };

  const handleSubmit = async () => {
    if (committing || cantidad <= 0 || precioTotal < 0) return;
    setCommitting(true);
    try {
      await onConfirm(cantidad, precioTotal);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container border-2 border-emerald-400/60 clip-chamfer max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/30">
          <h3 className="font-headline text-lg text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={18} /> Vender material
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-error">
            <X size={18} />
          </button>
        </div>

        <div className="font-mono text-sm text-cream mb-4">
          <div className="text-secondary/60 text-[10px] uppercase tracking-widest mb-1">Item</div>
          <div className="font-bold">{displayName}</div>
          <div className="text-[10px] text-secondary/60 mt-1">Stock disponible: <span className="text-primary-container">{maxQty}</span></div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">Cantidad</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={1} max={maxQty} value={cantidad}
                onChange={e => handleCantidad(parseInt(e.target.value))}
                className="flex-1 accent-emerald-400"
              />
              <input
                type="number" min={1} max={maxQty} value={cantidad}
                onChange={e => handleCantidad(parseInt(e.target.value) || 1)}
                className="w-20 bg-surface-container-high border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
              />
              <button
                onClick={() => handleCantidad(maxQty)}
                disabled={cantidad === maxQty}
                className="px-2 py-1 border border-emerald-400/60 text-emerald-400 hover:bg-emerald-400/20 font-mono text-[9px] uppercase tracking-widest disabled:opacity-30"
              >
                Todo
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">
              Precio total (₡)
              {isWeapon && (
                <span className="ml-2 text-[9px] text-secondary/50 normal-case">
                  Sugerido canon CamOps salvage: 30% × {pricePerUnit.toLocaleString('es-ES')} ₡/unit
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} value={precioTotal}
                onChange={e => { setEditado(true); setPrecioTotal(parseInt(e.target.value) || 0); }}
                className="flex-1 bg-surface-container-high border border-outline-variant/40 px-2 py-1.5 font-mono text-sm text-cream"
              />
              {isWeapon && editado && (
                <button
                  onClick={() => { setEditado(false); setPrecioTotal(pricePerUnit * cantidad); }}
                  className="px-2 py-1 border border-outline-variant/40 text-secondary text-[9px] uppercase tracking-widest hover:bg-surface-container-high"
                  title="Restaurar precio sugerido"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/40 p-3 mb-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-secondary/60 uppercase tracking-widest">
            <span>Ingreso al libro mayor</span>
          </div>
          <div className="font-mono text-2xl font-black text-emerald-400 mt-1">
            +{precioTotal.toLocaleString('es-ES')} ₡
          </div>
          <div className="font-mono text-[9px] text-secondary/60 mt-1">
            {cantidad}× {displayName} {precioTotal > 0 && `· ${Math.round(precioTotal / cantidad).toLocaleString('es-ES')} ₡/unit`}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={committing}
            className="flex-1 py-2 border border-outline-variant/40 text-secondary hover:bg-surface-container-high font-mono text-[11px] uppercase tracking-widest disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={committing || cantidad <= 0 || precioTotal < 0}
            className="flex-1 py-2 bg-emerald-400/30 border border-emerald-400 text-emerald-400 hover:bg-emerald-400/50 font-mono text-[11px] uppercase tracking-widest font-bold disabled:opacity-30"
          >
            {committing ? 'Vendiendo…' : 'Confirmar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Convierte clave granular del almacén a nombre legible para UI. */
function displayName(key: string): string {
  // Ammo_LRM_Standard → "Munición LRM (Estándar)"
  // Ammo_SRM_Inferno → "Munición SRM (Inferno)"
  // Armor_Standard → "Blindaje (Estándar)"
  // Armor_Ferro-Fibrous → "Blindaje (Ferro-Fibroso)"
  if (key.startsWith('Ammo_')) {
    const rest = key.slice(5); // "LRM_Standard"
    const parts = rest.split('_');
    const family = parts[0] || 'Desconocida';
    const variant = parts.slice(1).join('_') || 'Standard';
    const variantLabel = variant === 'Standard' ? 'Estándar' 
      : variant === 'Inferno' ? 'Inferno'
      : variant === 'Armor-Piercing' ? 'AP'
      : variant === 'Fragmentation' ? 'Fragmentación'
      : variant === 'Semi-Guided' ? 'Semi-Guiada'
      : variant === 'Incendiary' ? 'Incendiaria'
      : variant === 'Cluster' ? 'Cluster'
      : variant;
    return `Munición ${family} (${variantLabel})`;
  }
  if (key.startsWith('ArmorChassis_')) {
    // ArmorChassis_griffin_Standard → "Blindaje Griffin (Estándar)"
    const rest = key.slice('ArmorChassis_'.length);
    const parts = rest.split('_');
    const chassis = (parts[0] || '').replace(/\b\w/g, c => c.toUpperCase());
    const type = parts.slice(1).join('_') || 'Standard';
    const label = type === 'Standard' ? 'Estándar'
      : type === 'Ferro-Fibrous' ? 'Ferro-Fibroso'
      : type === 'Stealth' ? 'Sigilo'
      : type;
    return `Blindaje ${chassis} (${label}) — sólo chasis`;
  }
  if (key.startsWith('Armor_')) {
    const type = key.slice(6);
    const label = type === 'Standard' ? 'Estándar'
      : type === 'Ferro-Fibrous' ? 'Ferro-Fibroso'
      : type === 'Stealth' ? 'Sigilo'
      : type;
    return `Blindaje (${label})`;
  }
  // Legacy o armas/equipo: traducir
  return tWeapon(key);
}

/** Categoría visual para agrupar items. */
function itemCategory(key: string): 'ammo' | 'armor' | 'weapon' | 'equip' {
  if (key.startsWith('Ammo_') || key.toLowerCase().includes('ammo')) return 'ammo';
  if (key.startsWith('Armor_') || key.startsWith('ArmorChassis_') || key.toLowerCase().includes('armor') || key.toLowerCase().includes('blindaje')) return 'armor';
  if (['Heat Sink', 'Double Heat Sink', 'Jump Jet', 'Anti-Missile System', 'Guardian ECM Suite', 'Beagle Active Probe'].some(e => key.includes(e))) return 'equip';
  return 'weapon';
}

/** Unidad de medida. */
function unitLabel(key: string): string {
  const cat = itemCategory(key);
  if (cat === 'ammo') return 'Disparos';
  if (cat === 'armor') return 'Puntos';
  return 'Unidades';
}

export function MaterialTab() {
  const campaign = useAppStore(s => s.campaign);
  const setCampaign = useAppStore(s => s.setCampaign);
  const { writable } = usePerm('hangar');
  const almacen = campaign.almacen || {};

  const campaignDate = getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth);

  const handleRemove = async (item: string) => {
    if (!writable) return;
    const ok = window.confirm(`¿Descartar todo el stock de ${displayName(item)}?`);
    if (!ok) return;

    const newAlmacen = { ...almacen };
    delete newAlmacen[item];

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
  };

  // Sell modal state
  const [sellModal, setSellModal] = useState<{ item: string; qty: number } | null>(null);

  const handleConfirmSell = async (cantidad: number, total: number) => {
    if (!sellModal || !writable) return;
    const item = sellModal.item;
    const newAlmacen = { ...almacen };
    newAlmacen[item] = Math.max(0, (newAlmacen[item] ?? 0) - cantidad);
    if (newAlmacen[item] === 0) delete newAlmacen[item];

    await commitLibroEntryAndTreasury({
      id: genId('lm'),
      fecha: campaignDate,
      concepto: `Venta ${cantidad}× ${displayName(item)}`,
      cantidad: total,
      tipo: 'ingreso',
      categoria: 'ingreso_misc',
      nota: `Mercado · venta inventario`,
      jugador: '',
    });

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    setSellModal(null);
  };

  const getIcon = (key: string) => {
    const cat = itemCategory(key);
    if (cat === 'armor') return <Shield className="w-4 h-4 text-primary-container" />;
    if (cat === 'ammo') {
      // Munición especial: icono diferente
      if (key.includes('Inferno') || key.includes('Incendiary')) return <Flame className="w-4 h-4 text-error" />;
      if (key.includes('Armor-Piercing') || key.includes('AP')) return <Crosshair className="w-4 h-4 text-amber-400" />;
      return <div className="w-4 h-4 rounded-full border-2 border-primary-container flex items-center justify-center text-[8px] font-black">A</div>;
    }
    return <Package className="w-4 h-4 text-secondary/60" />;
  };

  const entries = Object.entries(almacen).filter(([_, qty]) => qty > 0);

  // Agrupar por categoría
  const armorEntries = entries.filter(([k]) => itemCategory(k) === 'armor');
  const grouped = {
    ammo: entries.filter(([k]) => itemCategory(k) === 'ammo').sort((a, b) => a[0].localeCompare(b[0])),
    armorGlobal: armorEntries.filter(([k]) => !k.startsWith('ArmorChassis_')).sort((a, b) => a[0].localeCompare(b[0])),
    armorChassis: armorEntries.filter(([k]) => k.startsWith('ArmorChassis_')).sort((a, b) => a[0].localeCompare(b[0])),
    weapon: entries.filter(([k]) => itemCategory(k) === 'weapon').sort((a, b) => a[0].localeCompare(b[0])),
    equip: entries.filter(([k]) => itemCategory(k) === 'equip').sort((a, b) => a[0].localeCompare(b[0])),
  };

  const sections: { key: string; label: string; items: [string, number][] }[] = [
    { key: 'ammo', label: '🔴 Munición', items: grouped.ammo },
    { key: 'armorGlobal', label: '🛡️ Blindaje (Global)', items: grouped.armorGlobal },
    { key: 'armorChassis', label: '🛡️ Blindaje (Chasis-Locked — canibalizado)', items: grouped.armorChassis },
    { key: 'weapon', label: '⚔️ Armas', items: grouped.weapon },
    { key: 'equip', label: '⚙️ Equipo', items: grouped.equip },
  ].filter(s => s.items.length > 0);

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
          <div className="space-y-4">
            {sections.map(section => (
              <div key={section.key}>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-2 border-b border-outline-variant/20 pb-1">
                  {section.label} ({section.items.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.items.map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-surface border border-outline-variant/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getIcon(name)}
                        <div>
                          <div className="font-mono text-sm text-cream">{displayName(name)}</div>
                          <div className="font-mono text-[10px] text-secondary/70 uppercase">
                            {unitLabel(name)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-lg font-black text-primary-container">{qty.toLocaleString('es-ES')}</div>
                        {writable && (
                          <>
                            <button
                              onClick={() => setSellModal({ item: name, qty })}
                              className="p-1.5 hover:bg-emerald-400/10 text-emerald-400/60 hover:text-emerald-400 rounded transition-colors"
                              title="Vender (canon 30% si arma; manual resto)"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemove(name)} className="p-1.5 hover:bg-error/10 text-error/60 hover:text-error rounded transition-colors" title="Descartar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sellModal && (
        <SellModal
          item={sellModal.item}
          displayName={displayName(sellModal.item)}
          maxQty={sellModal.qty}
          isWeapon={itemCategory(sellModal.item) === 'weapon'}
          onClose={() => setSellModal(null)}
          onConfirm={handleConfirmSell}
        />
      )}
    </div>
  );
}
