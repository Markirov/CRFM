import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { saveConfigBatch, commitLibroEntryAndTreasury } from '@/lib/firebase-service';
import { Package, Shield, Flame, Crosshair, DollarSign, X, Star, ShoppingCart, Tag } from 'lucide-react';
import { usePerm } from '@/hooks/usePerm';
import { tWeapon } from '@/lib/translator';
import { weaponPriceFromName } from '@/lib/weapon-prices';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { PRECIO_BLINDAJE } from '@/lib/repair-engine';

type TradeMode = 'buy' | 'sell';

/** Modal compra+venta granular item del almacén. */
function TradeModal({ item, displayName, currentQty, isWeapon, isArmor, isAmmo, isFavorite, onToggleFavorite, onClose, onConfirm }: {
  item: string;
  displayName: string;
  currentQty: number;
  isWeapon: boolean;
  isArmor: boolean;
  isAmmo: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onConfirm: (mode: TradeMode, cantidad: number, total: number) => Promise<void>;
}) {
  const [mode, setMode] = useState<TradeMode>(currentQty > 0 ? 'sell' : 'buy');
  const [cantidad, setCantidad] = useState<number>(mode === 'sell' ? currentQty : 1);
  const [editado, setEditado] = useState(false);
  const [committing, setCommitting] = useState(false);

  // Precio canon/unit (compra). Para armor: usa Estandar (10000/ton, ~16 pts/ton → ~625/pt).
  // Para armas: weaponPriceFromName. Para ammo: manual (depende family).
  const pricePerUnitFull = isWeapon ? weaponPriceFromName(item)
    : isArmor ? Math.round((PRECIO_BLINDAJE['Estandar'] ?? 10000) / 16)
    : 0;
  // Venta = 30% del precio canon
  const pricePerUnitSell = Math.round(pricePerUnitFull * 0.3);
  const pricePerUnit = mode === 'buy' ? pricePerUnitFull : pricePerUnitSell;

  const sugerido = pricePerUnit * cantidad;
  const [precioTotal, setPrecioTotal] = useState<number>(sugerido);

  const maxQty = mode === 'sell' ? currentQty : 9999;

  // Re-sync precio sugerido al cambiar cantidad o mode si user no editó
  const handleCantidad = (n: number) => {
    const c = Math.max(1, Math.min(maxQty, Math.floor(n)));
    setCantidad(c);
    if (!editado) setPrecioTotal(pricePerUnit * c);
  };

  const switchMode = (m: TradeMode) => {
    setMode(m);
    setEditado(false);
    const newPricePerUnit = m === 'buy' ? pricePerUnitFull : pricePerUnitSell;
    const newMaxQty = m === 'sell' ? currentQty : 9999;
    const c = Math.max(1, Math.min(newMaxQty, cantidad));
    setCantidad(c);
    setPrecioTotal(newPricePerUnit * c);
  };

  const handleSubmit = async () => {
    if (committing || cantidad <= 0 || precioTotal < 0) return;
    if (mode === 'sell' && cantidad > currentQty) return;
    setCommitting(true);
    try {
      await onConfirm(mode, cantidad, precioTotal);
    } finally {
      setCommitting(false);
    }
  };

  const modeColor = mode === 'sell' ? 'emerald-400' : 'amber-400';
  const modeLabel = mode === 'sell' ? 'Vender' : 'Comprar';
  const modeSign = mode === 'sell' ? '+' : '−';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={() => { if (!committing) onClose(); }}
    >
      <div
        className={`bg-surface-container border-2 border-${modeColor}/60 clip-chamfer max-w-md w-full p-5 shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header: título item grande + favorito + cerrar */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-outline-variant/30 gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-secondary/60 text-[10px] uppercase tracking-widest mb-1 font-mono">Material</div>
            <h3 className="font-headline text-lg text-cream font-bold leading-tight break-words">
              {displayName}
            </h3>
            <div className="text-[10px] text-secondary/60 mt-1 font-mono">
              Stock: <span className="text-primary-container font-bold">{currentQty}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded transition-colors ${
                isFavorite
                  ? 'text-amber-400 hover:bg-amber-400/10'
                  : 'text-secondary/40 hover:text-amber-400/60 hover:bg-amber-400/5'
              }`}
              title={isFavorite ? 'Quitar favorito' : 'Marcar favorito (aparece aunque stock=0)'}
            >
              <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="text-secondary hover:text-error p-1.5">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs Compra / Venta */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => switchMode('sell')}
            disabled={currentQty === 0}
            className={`flex-1 py-2 border font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'sell'
                ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400'
                : 'border-outline-variant/40 text-secondary/60 hover:bg-surface-container-high disabled:opacity-30'
            }`}
            title={currentQty === 0 ? 'Sin stock para vender' : ''}
          >
            <Tag size={12} /> Vender ({currentQty})
          </button>
          <button
            onClick={() => switchMode('buy')}
            className={`flex-1 py-2 border font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'buy'
                ? 'border-amber-400 bg-amber-400/20 text-amber-400'
                : 'border-outline-variant/40 text-secondary/60 hover:bg-surface-container-high'
            }`}
          >
            <ShoppingCart size={12} /> Comprar
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">Cantidad</label>
            <div className="flex items-center gap-2">
              {mode === 'sell' ? (
                <input
                  type="range" min={1} max={maxQty} value={cantidad}
                  onChange={e => handleCantidad(parseInt(e.target.value))}
                  className={`flex-1 accent-${modeColor}`}
                />
              ) : null}
              <input
                type="number" min={1} max={maxQty} value={cantidad}
                onChange={e => handleCantidad(parseInt(e.target.value) || 1)}
                className="w-24 bg-surface-container-high border border-outline-variant/40 px-2 py-1 font-mono text-sm text-cream"
              />
              {mode === 'sell' && (
                <button
                  onClick={() => handleCantidad(currentQty)}
                  disabled={cantidad === currentQty}
                  className="px-2 py-1 border border-emerald-400/60 text-emerald-400 hover:bg-emerald-400/20 font-mono text-[9px] uppercase tracking-widest disabled:opacity-30"
                >
                  Todo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">
              Precio total (₡)
              {pricePerUnitFull > 0 && (
                <span className="ml-2 text-[9px] text-secondary/50 normal-case">
                  Canon{mode === 'sell' && ' (salvage 30%)'}: {pricePerUnit.toLocaleString('es-ES')} ₡/unit
                </span>
              )}
              {pricePerUnitFull === 0 && (isAmmo || (!isWeapon && !isArmor)) && (
                <span className="ml-2 text-[9px] text-secondary/50 normal-case">
                  Sin precio canon — manual
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} value={precioTotal}
                onChange={e => { setEditado(true); setPrecioTotal(parseInt(e.target.value) || 0); }}
                className="flex-1 bg-surface-container-high border border-outline-variant/40 px-2 py-1.5 font-mono text-sm text-cream"
              />
              {pricePerUnitFull > 0 && editado && (
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

        <div className={`bg-${modeColor}/10 border border-${modeColor}/40 p-3 mb-4`}>
          <div className="flex items-center justify-between font-mono text-[10px] text-secondary/60 uppercase tracking-widest">
            <span>{mode === 'sell' ? 'Ingreso' : 'Gasto'} al libro mayor</span>
          </div>
          <div className={`font-mono text-2xl font-black text-${modeColor} mt-1`}>
            {modeSign}{precioTotal.toLocaleString('es-ES')} ₡
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
            className={`flex-1 py-2 bg-${modeColor}/30 border border-${modeColor} text-${modeColor} hover:bg-${modeColor}/50 font-mono text-[11px] uppercase tracking-widest font-bold disabled:opacity-30`}
          >
            {committing ? 'Procesando…' : `Confirmar ${modeLabel}`}
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

  // Trade modal state
  const [tradeModal, setTradeModal] = useState<{ item: string; qty: number } | null>(null);

  // Favoritos
  const favoritos = campaign.inventarioFavoritos ?? [];
  const toggleFavorito = async (item: string) => {
    if (!writable) return;
    const next = favoritos.includes(item)
      ? favoritos.filter(k => k !== item)
      : [...favoritos, item];
    setCampaign({ inventarioFavoritos: next });
    await saveConfigBatch({ ALMACEN_FAVORITOS_JSON: JSON.stringify(next) });
  };

  const handleConfirmTrade = async (mode: TradeMode, cantidad: number, total: number) => {
    if (!tradeModal || !writable) return;
    const item = tradeModal.item;
    const newAlmacen = { ...almacen };

    if (mode === 'sell') {
      newAlmacen[item] = Math.max(0, (newAlmacen[item] ?? 0) - cantidad);
      if (newAlmacen[item] === 0 && !favoritos.includes(item)) delete newAlmacen[item];
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
    } else {
      newAlmacen[item] = (newAlmacen[item] ?? 0) + cantidad;
      await commitLibroEntryAndTreasury({
        id: genId('lm'),
        fecha: campaignDate,
        concepto: `Compra ${cantidad}× ${displayName(item)}`,
        cantidad: total,
        tipo: 'gasto',
        categoria: 'repuestos',
        nota: `Mercado · compra rápida desde almacén`,
        jugador: '',
      });
    }

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });
    setTradeModal(null);
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

  // Entries = stock>0 + favoritos (incluso con qty=0 para acceso rápido)
  const entriesMap = new Map<string, number>();
  for (const [k, v] of Object.entries(almacen)) {
    if (v > 0) entriesMap.set(k, v);
  }
  for (const fav of favoritos) {
    if (!entriesMap.has(fav)) entriesMap.set(fav, 0);
  }
  const entries = Array.from(entriesMap.entries());

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
                    <button
                      key={name}
                      onClick={() => writable && setTradeModal({ item: name, qty })}
                      disabled={!writable}
                      className="flex items-center justify-between p-3 bg-surface border border-outline-variant/20 rounded-lg w-full text-left hover:border-primary-container/60 hover:bg-primary-container/5 transition-colors disabled:cursor-default disabled:hover:border-outline-variant/20 disabled:hover:bg-surface"
                      title={writable ? 'Click para comprar/vender' : ''}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getIcon(name)}
                        <div className="min-w-0">
                          <div className="font-mono text-sm text-cream truncate flex items-center gap-1.5">
                            {favoritos.includes(name) && (
                              <Star className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" />
                            )}
                            <span>{displayName(name)}</span>
                          </div>
                          <div className="font-mono text-[10px] text-secondary/70 uppercase">
                            {unitLabel(name)}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono text-lg font-black shrink-0 ml-3 ${qty > 0 ? 'text-primary-container' : 'text-secondary/30'}`}>
                        {qty.toLocaleString('es-ES')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tradeModal && (
        <TradeModal
          item={tradeModal.item}
          displayName={displayName(tradeModal.item)}
          currentQty={tradeModal.qty}
          isWeapon={itemCategory(tradeModal.item) === 'weapon'}
          isArmor={itemCategory(tradeModal.item) === 'armor'}
          isAmmo={itemCategory(tradeModal.item) === 'ammo'}
          isFavorite={favoritos.includes(tradeModal.item)}
          onToggleFavorite={() => toggleFavorito(tradeModal.item)}
          onClose={() => setTradeModal(null)}
          onConfirm={handleConfirmTrade}
        />
      )}
    </div>
  );
}
