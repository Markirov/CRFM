import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { saveConfigBatch, commitLibroEntryAndTreasury } from '@/lib/firebase-service';
import { Package, Trash2, Shield, Flame, Crosshair, DollarSign } from 'lucide-react';
import { usePerm } from '@/hooks/usePerm';
import { tWeapon } from '@/lib/translator';
import { weaponPriceFromName } from '@/lib/weapon-prices';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';

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

  /** Vender stock (canon CamOps salvage = 30% precio nuevo). */
  const handleSell = async (item: string, qty: number) => {
    if (!writable) return;
    const cat = itemCategory(item);
    // Precio sugerido: solo armas (canon weapon prices ×30%). Resto = manual.
    let priceSugerido = 0;
    if (cat === 'weapon') {
      const basePrice = weaponPriceFromName(item);
      priceSugerido = Math.round(basePrice * 0.3 * qty);
    }
    const qtyStr = window.prompt(`Vender ${displayName(item)} — Cantidad (max ${qty}):`, qty.toString());
    if (!qtyStr) return;
    const cantidad = parseInt(qtyStr, 10);
    if (isNaN(cantidad) || cantidad <= 0 || cantidad > qty) return;
    const adjPrice = cat === 'weapon' ? Math.round(weaponPriceFromName(item) * 0.3 * cantidad) : priceSugerido;
    const totalStr = window.prompt(`Precio venta total (₡):`, adjPrice.toString());
    if (!totalStr) return;
    const total = parseInt(totalStr, 10);
    if (isNaN(total) || total < 0) return;
    if (!window.confirm(`Vender ${cantidad}× ${displayName(item)} por ${total.toLocaleString('es-ES')} ₡?`)) return;

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
                              onClick={() => handleSell(name, qty)}
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
    </div>
  );
}
