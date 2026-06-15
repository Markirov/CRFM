// ══════════════════════════════════════════════════════════════
//  HANGAR PAGE — Inventario de mechs propiedad de la unidad.
//  Tabs: Inventario / Comprar / Vender.
//  Compra crea HangarItem + asiento libro mayor (compra_mech).
//  Venta elimina HangarItem + asiento libro mayor (venta_mech).
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { commitLibroEntryAndTreasury, loadHangar, saveHangarItem, deleteHangarItem } from '@/lib/firebase-service';
import { newHangarItem, type HangarItem } from '@/lib/hangar-types';
import { useMechCatalog, type CatalogMech } from '@/hooks/useMechCatalog';

export function HangarPage() {
  const { activeSubTab, setActiveSubTab } = useAppStore();
  type View = 'inventario' | 'comprar' | 'vender';
  const view: View =
    activeSubTab === 'comprar' ? 'comprar'
    : activeSubTab === 'vender' ? 'vender'
    : 'inventario';

  useEffect(() => {
    if (!['inventario', 'comprar', 'vender'].includes(activeSubTab)) {
      setActiveSubTab('inventario');
    }
  }, [activeSubTab, setActiveSubTab]);

  // Estado compartido: lista hangar
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

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-6xl mx-auto">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-4">
        Hangar de la unidad
      </h1>

      {view === 'inventario' && <InventarioTab items={items} loading={loading} refresh={refresh} />}
      {view === 'comprar'    && <ComprarTab refresh={refresh} />}
      {view === 'vender'     && <VenderTab items={items} loading={loading} refresh={refresh} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  INVENTARIO
// ══════════════════════════════════════════════════════════

function InventarioTab({ items, loading, refresh }: {
  items: HangarItem[]; loading: boolean; refresh: () => Promise<void>;
}) {
  const { campaign } = useAppStore();
  const fmt = (n: number) => n.toLocaleString('es-ES') + ' ₡';

  const handleAssign = async (item: HangarItem, pilotoIdx: number | undefined) => {
    // Caso: desasignar
    if (pilotoIdx === undefined) {
      await saveHangarItem({ ...item, pilotoIdx: undefined });
      void refresh();
      return;
    }

    const pilotName = campaign?.pilotNames?.[pilotoIdx] || `Piloto ${pilotoIdx + 1}`;

    // Conflicto: piloto ya tenía otro mech?
    const previo = items.find(it => it.pilotoIdx === pilotoIdx && it.id !== item.id);
    if (previo) {
      const ok = window.confirm(
        `${pilotName} ya tenía "${previo.chassis} ${previo.model}".\n\n` +
        `Reasignar a "${item.chassis} ${item.model}"? El anterior pasará a reserva.`
      );
      if (!ok) return;
      await saveHangarItem({ ...previo, pilotoIdx: undefined });
    }

    // Conflicto: este mech estaba con otro piloto?
    if (item.pilotoIdx !== undefined && item.pilotoIdx !== pilotoIdx) {
      const otroPiloto = campaign?.pilotNames?.[item.pilotoIdx] || `Piloto ${item.pilotoIdx + 1}`;
      const ok = window.confirm(
        `"${item.chassis} ${item.model}" estaba con ${otroPiloto}.\n\n` +
        `Reasignar a ${pilotName}?`
      );
      if (!ok) return;
    }

    await saveHangarItem({ ...item, pilotoIdx });
    void refresh();
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
        Mechs en hangar ({items.length})
      </h2>
      {loading && <p className="font-mono text-[10px] text-secondary/50 italic">Cargando…</p>}
      {!loading && items.length === 0 && (
        <p className="font-mono text-[10px] text-secondary/50 italic">
          Hangar vacío. Pestaña "Comprar" para añadir mechs.
        </p>
      )}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px]">
            <thead className="text-secondary/60 uppercase text-[8px] tracking-widest">
              <tr className="border-b border-outline-variant/30">
                <th className="text-left py-1 pr-2">Mech</th>
                <th className="text-right pr-2">Tons</th>
                <th className="text-right pr-2">BV</th>
                <th className="text-left pr-2">Asignado</th>
                <th className="text-right pr-2">Valor</th>
                <th className="text-left pr-2">Compra</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-b border-outline-variant/20 hover:bg-primary-container/5">
                  <td className="py-1 pr-2 text-on-surface">{it.chassis} {it.model}</td>
                  <td className="text-right pr-2 text-secondary">{it.tons}</td>
                  <td className="text-right pr-2 text-secondary">{it.bv ?? '—'}</td>
                  <td className="pr-2">
                    <select
                      value={it.pilotoIdx ?? ''}
                      onChange={e => handleAssign(it, e.target.value === '' ? undefined : Number(e.target.value))}
                      className="bg-surface-container border border-outline-variant/40 px-1 py-0.5 font-mono text-[10px] text-secondary"
                    >
                      <option value="">— Reserva —</option>
                      {(campaign?.pilotNames ?? []).map((n, i) => (
                        <option key={i} value={i}>{n || `Piloto ${i + 1}`}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right pr-2 text-primary-container">{fmt(it.valorActual)}</td>
                  <td className="pr-2 text-secondary/60 text-[9px]">{it.fechaCompra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════
//  COMPRAR
// ══════════════════════════════════════════════════════════

function ComprarTab({ refresh }: { refresh: () => Promise<void> }) {
  const { campaign, setActiveSubTab } = useAppStore();
  const { catalog } = useMechCatalog();
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  // Búsqueda catálogo
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogMech | null>(null);

  const suggestions = useMemo(() => {
    if (!catalog || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return catalog.mechs.filter(m => {
      const full = m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`;
      return full.toLowerCase().includes(q);
    }).slice(0, 12);
  }, [catalog, query]);

  // Compra
  const [precio, setPrecio] = useState(0);
  const [pilotoIdx, setPilotoIdx] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [commitState, setCommitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSelect = (m: CatalogMech) => {
    setSelected(m);
    setQuery(m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`.trim());
    setPrecio(m.cost ?? 0);
  };

  const handleClear = () => {
    setSelected(null); setQuery(''); setPrecio(0); setPilotoIdx(''); setNotas('');
  };

  const handleComprar = async () => {
    if (!selected || precio <= 0) return;
    setCommitState('sending');
    try {
      const item = newHangarItem({
        chassis:     selected.chassis,
        model:       selected.model,
        tons:        selected.tons,
        bv:          selected.bv2,
        era:         String(selected.era ?? ''),
        precioBase:  precio,
        fechaCompra: campaignDate,
        pilotoIdx:   pilotoIdx === '' ? undefined : pilotoIdx,
      });
      if (notas) item.notas = notas;

      await saveHangarItem(item);
      await commitLibroEntryAndTreasury({
        id:        genId('lm'),
        fecha:     campaignDate,
        concepto:  `Compra · ${item.chassis} ${item.model}`,
        cantidad:  precio,
        tipo:      'gasto',
        categoria: 'compra_mech',
        nota:      notas || `${item.tons}t · BV ${item.bv ?? '?'}`,
        jugador:   '',
      });

      setCommitState('done');
      await refresh();
      setTimeout(() => {
        setCommitState('idle');
        handleClear();
        setActiveSubTab('inventario');
      }, 1500);
    } catch {
      setCommitState('error');
      setTimeout(() => setCommitState('idle'), 3000);
    }
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer space-y-3">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase">
        Comprar mech
      </h2>

      {/* Buscador catálogo */}
      <div className="relative">
        <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
          Buscar en catálogo TRO
        </label>
        <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/40 px-2">
          <Search size={12} className="text-secondary/50" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Atlas AS7-D, Locust LCT-1V…"
            className="flex-1 bg-transparent px-1 py-1.5 font-mono text-[11px] text-on-surface focus:outline-none"
          />
          {selected && (
            <button onClick={handleClear} className="text-secondary/50 hover:text-error">
              <Trash2 size={12} />
            </button>
          )}
        </div>
        {!selected && suggestions.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface-container border border-outline-variant/40 custom-scrollbar">
            {suggestions.map(m => (
              <li key={m.file}>
                <button
                  onClick={() => handleSelect(m)}
                  className="w-full text-left px-2 py-1 font-mono text-[10px] text-on-surface hover:bg-primary-container/15 flex items-center justify-between gap-2"
                >
                  <span>{m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`}</span>
                  <span className="text-secondary/50 text-[9px]">{m.tons}t · BV {m.bv2}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="border border-primary-container/30 bg-primary-container/5 p-3 space-y-2">
          <div className="font-headline text-sm font-bold text-primary-container">
            {selected.chassis} {selected.model}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-secondary/70">
            <div>Tons: <span className="text-secondary">{selected.tons}</span></div>
            <div>BV: <span className="text-secondary">{selected.bv2}</span></div>
            <div>Era: <span className="text-secondary">{selected.era}</span></div>
            <div>Tech: <span className="text-secondary">{selected.techBase}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
                Precio (canon: {(selected.cost ?? 0).toLocaleString('es-ES')} ₡)
              </label>
              <input
                type="number" min={0}
                value={precio || ''}
                onFocus={e => e.target.select()}
                onChange={e => setPrecio(parseInt(e.target.value) || 0)}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
                Asignar a piloto (opcional)
              </label>
              <select
                value={pilotoIdx}
                onChange={e => setPilotoIdx(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              >
                <option value="">— Reserva —</option>
                {(campaign?.pilotNames ?? []).map((n, i) => (
                  <option key={i} value={i}>{n || `Piloto ${i + 1}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
              Notas
            </label>
            <input
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Vendedor, condición, etc."
              className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-secondary"
            />
          </div>

          <button
            onClick={handleComprar}
            disabled={precio <= 0 || commitState === 'sending'}
            className={`w-full py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
              precio <= 0
                ? 'border-outline-variant/30 text-secondary/30 cursor-not-allowed'
                : commitState === 'done'
                  ? 'border-primary bg-primary/20 text-primary'
                  : commitState === 'error'
                    ? 'border-error bg-error/20 text-error'
                    : 'border-primary-container bg-primary-container/15 text-primary-container hover:bg-primary-container/25'
            }`}
          >
            {commitState === 'sending' ? 'Registrando…'
              : commitState === 'done'  ? '✓ Mech añadido al hangar'
              : commitState === 'error' ? '✗ Error — reintenta'
              : `Comprar (${precio.toLocaleString('es-ES')} ₡)`}
          </button>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════
//  VENDER
// ══════════════════════════════════════════════════════════

function VenderTab({ items, loading, refresh }: {
  items: HangarItem[]; loading: boolean; refresh: () => Promise<void>;
}) {
  const { campaign, setActiveSubTab } = useAppStore();
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  const [selected, setSelected] = useState<HangarItem | null>(null);
  const [precio, setPrecio] = useState(0);
  const [estadoPct, setEstadoPct] = useState(100);
  const [notas, setNotas] = useState('');
  const [commitState, setCommitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSelect = (it: HangarItem) => {
    setSelected(it);
    setEstadoPct(it.estadoPct ?? 100);
    setPrecio(Math.round((it.valorActual ?? it.precioBase) * ((it.estadoPct ?? 100) / 100)));
    setNotas('');
  };

  // Recalcular precio cuando user cambia estadoPct
  useEffect(() => {
    if (!selected) return;
    setPrecio(Math.round((selected.valorActual ?? selected.precioBase) * (estadoPct / 100)));
  }, [estadoPct, selected]);

  const handleVender = async () => {
    if (!selected || precio <= 0) return;
    setCommitState('sending');
    try {
      await commitLibroEntryAndTreasury({
        id:        genId('lm'),
        fecha:     campaignDate,
        concepto:  `Venta · ${selected.chassis} ${selected.model}`,
        cantidad:  precio,
        tipo:      'ingreso',
        categoria: 'venta_mech',
        nota:      notas || `Estado ${estadoPct}% · ${selected.tons}t`,
        jugador:   '',
      });
      await deleteHangarItem(selected.id);

      setCommitState('done');
      await refresh();
      setTimeout(() => {
        setCommitState('idle');
        setSelected(null);
        setActiveSubTab('inventario');
      }, 1500);
    } catch {
      setCommitState('error');
      setTimeout(() => setCommitState('idle'), 3000);
    }
  };

  if (!selected) {
    return (
      <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
        <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3">
          Vender mech — selecciona del hangar
        </h2>
        {loading && <p className="font-mono text-[10px] text-secondary/50 italic">Cargando…</p>}
        {!loading && items.length === 0 && (
          <p className="font-mono text-[10px] text-secondary/50 italic">Hangar vacío.</p>
        )}
        <ul className="space-y-1.5">
          {items.map(it => (
            <li key={it.id}>
              <button
                onClick={() => handleSelect(it)}
                className="w-full text-left px-2 py-1.5 border border-outline-variant/40 hover:border-primary-container/60 hover:bg-primary-container/5 font-mono text-[10px] flex items-center gap-2"
              >
                <span className="text-on-surface flex-1">{it.chassis} {it.model}</span>
                <span className="text-secondary/60">{it.tons}t</span>
                <span className="text-primary-container">{(it.valorActual ?? it.precioBase).toLocaleString('es-ES')} ₡</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase">
          Vender: {selected.chassis} {selected.model}
        </h2>
        <button
          onClick={() => setSelected(null)}
          className="font-mono text-[9px] text-secondary/60 hover:text-error uppercase tracking-widest"
        >← Cambiar</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-secondary/70">
        <div>Tons: <span className="text-secondary">{selected.tons}</span></div>
        <div>BV: <span className="text-secondary">{selected.bv ?? '—'}</span></div>
        <div>Valor ref: <span className="text-secondary">{(selected.valorActual ?? selected.precioBase).toLocaleString('es-ES')} ₡</span></div>
        <div>Piloto: <span className="text-secondary">{selected.pilotoIdx !== undefined ? (campaign?.pilotNames?.[selected.pilotoIdx] || `Piloto ${selected.pilotoIdx + 1}`) : 'Reserva'}</span></div>
      </div>

      <div>
        <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
          Estado: <span className="text-primary-container font-bold">{estadoPct}%</span>
        </label>
        <input
          type="range" min={0} max={150} step={5}
          value={estadoPct}
          onChange={e => setEstadoPct(parseInt(e.target.value) || 0)}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
            Precio venta
          </label>
          <input
            type="number" min={0}
            value={precio || ''}
            onFocus={e => e.target.select()}
            onChange={e => setPrecio(parseInt(e.target.value) || 0)}
            className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
          />
        </div>
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
            Notas
          </label>
          <input
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Comprador, condiciones, etc."
            className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[10px] text-secondary"
          />
        </div>
      </div>

      <button
        onClick={handleVender}
        disabled={precio <= 0 || commitState === 'sending'}
        className={`w-full py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
          precio <= 0
            ? 'border-outline-variant/30 text-secondary/30 cursor-not-allowed'
            : commitState === 'done'
              ? 'border-primary bg-primary/20 text-primary'
              : commitState === 'error'
                ? 'border-error bg-error/20 text-error'
                : 'border-primary-container bg-primary-container/15 text-primary-container hover:bg-primary-container/25'
        }`}
      >
        {commitState === 'sending' ? 'Registrando…'
          : commitState === 'done'  ? '✓ Mech vendido'
          : commitState === 'error' ? '✗ Error — reintenta'
          : `Vender (${precio.toLocaleString('es-ES')} ₡)`}
      </button>
    </section>
  );
}
