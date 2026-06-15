// ══════════════════════════════════════════════════════════════
//  HANGAR PAGE — Inventario de mechs propiedad de la unidad.
//  Tabs: Inventario / Comprar / Vender.
//  Compra crea HangarItem + asiento libro mayor (compra_mech).
//  Venta elimina HangarItem + asiento libro mayor (venta_mech).
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Trash2, Loader } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { commitLibroEntryAndTreasury, loadHangar, saveHangarItem, deleteHangarItem } from '@/lib/firebase-service';
import { newHangarItem, type HangarItem } from '@/lib/hangar-types';
import { useMechCatalog, type CatalogMech } from '@/hooks/useMechCatalog';
import { parseSSWBasic } from '@/lib/ssw-basic';

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

function pilotLabel(roster: { apodo: string; nombre: string }[], idx: number): string {
  const r = roster[idx];
  if (!r) return `Piloto ${idx + 1}`;
  return r.apodo || r.nombre || `Piloto ${idx + 1}`;
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      style={{ textAlign: align }}
      className="px-2 py-2 font-mono text-[8px] uppercase tracking-widest text-secondary/60 border-b border-outline-variant/40"
    >
      {children}
    </th>
  );
}

/** Mapea year canon → era de BattleTech. */
function eraLabel(year: number): string {
  if (year >= 3151)             return 'IlClan';
  if (year >= 3132)             return 'Oscuro';
  if (year >= 3081)             return 'Republica';
  if (year >= 3068)             return 'Jihad';
  if (year >= 3050)             return 'Invasion Clan';
  if (year >= 3020)             return 'Sucesion 3';
  if (year >= 2860)             return 'Sucesion 2';
  if (year >= 2786)             return 'Sucesion 1';
  if (year >= 2570)             return 'Edad Estrella';
  if (year >= 2350)             return 'Edad Guerra';
  return 'Antiguo';
}

function InventarioTab({ items, loading, refresh }: {
  items: HangarItem[]; loading: boolean; refresh: () => Promise<void>;
}) {
  const { roster } = useAppStore();
  const fmt = (n: number) => n.toLocaleString('es-ES') + ' ₡';

  const handleAssign = async (item: HangarItem, pilotoIdx: number | undefined) => {
    // Caso: desasignar
    if (pilotoIdx === undefined) {
      await saveHangarItem({ ...item, pilotoIdx: undefined });
      void refresh();
      return;
    }

    const pilotName = pilotLabel(roster, pilotoIdx);

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
      const otroPiloto = pilotLabel(roster, item.pilotoIdx);
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
          <table className="w-full font-mono text-[10px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-surface-container">
                <Th>Nombre</Th>
                <Th align="center">Tipo</Th>
                <Th align="right">Tons</Th>
                <Th align="right">BV</Th>
                <Th align="right">Año</Th>
                <Th align="left">Era</Th>
                <Th align="right">Valor</Th>
                <Th align="left">Asignado</Th>
                <Th align="left">Compra</Th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => {
                const taken = it.pilotoIdx !== undefined;
                const pilotName = taken ? pilotLabel(roster, it.pilotoIdx!) : null;
                return (
                  <tr key={it.id} className="border-b border-outline-variant/20 hover:bg-primary-container/5 group">
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-on-surface font-bold">
                      {it.chassis} {it.model}
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-center">
                      <span className="inline-block px-1.5 py-0.5 border border-green-400/50 text-green-400 text-[8px] tracking-widest">
                        MECH
                      </span>
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-right text-amber-400">{it.tons}</td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-right text-secondary">{it.bv ?? '—'}</td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-right text-secondary">
                      {it.era || '—'}
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-secondary/70">
                      {(it.era && /^\d+$/.test(it.era)) ? eraLabel(parseInt(it.era)) : '—'}
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-right text-primary-container">{fmt(it.valorActual)}</td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${taken ? 'bg-green-400' : 'bg-outline-variant/40'}`} />
                        <select
                          value={it.pilotoIdx ?? ''}
                          onChange={e => handleAssign(it, e.target.value === '' ? undefined : Number(e.target.value))}
                          className={`bg-surface-container border px-1.5 py-0.5 font-mono text-[10px] ${
                            taken ? 'border-green-400/40 text-green-400' : 'border-outline-variant/40 text-secondary/60'
                          }`}
                          title={taken ? `Asignado a ${pilotName}` : 'Sin asignar (reserva)'}
                        >
                          <option value="">— Reserva —</option>
                          {roster.map((r, i) => (
                            <option key={i} value={i}>{r.apodo || r.nombre || `Piloto ${i + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-secondary/60 text-[9px]">{it.fechaCompra}</td>
                  </tr>
                );
              })}
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
  const { campaign, setActiveSubTab, roster } = useAppStore();
  const { catalog } = useMechCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  // Búsqueda catálogo
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogMech | null>(null);
  const [loadingSsw, setLoadingSsw] = useState(false);

  // Datos resueltos del .ssw (tons/chassis/model/cost) — el catálogo
  // solo trae name/bv2/file/year, todo lo demás viene del fichero
  const [chassis, setChassis] = useState('');
  const [model, setModel] = useState('');
  const [tons, setTons] = useState(0);

  const suggestions = useMemo(() => {
    if (!catalog || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return catalog.mechs.filter(m => {
      const label = m.name || m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`;
      return label.toLowerCase().includes(q);
    }).slice(0, 12);
  }, [catalog, query]);

  // Compra
  const [precio, setPrecio] = useState(0);     // precio canon detectado
  const [factorPct, setFactorPct] = useState(100); // descuento/markup 0-200%
  const [pilotoIdx, setPilotoIdx] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [commitState, setCommitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const precioFinal = Math.round(precio * (factorPct / 100));

  // Carga el .ssw para extraer tons/cost/chassis/model
  const loadSswDetail = async (m: CatalogMech) => {
    setLoadingSsw(true);
    try {
      const base = import.meta.env.BASE_URL;
      const res = await fetch(`${base}assets/mechs/${encodeURIComponent(m.file)}`);
      if (!res.ok) throw new Error('No se pudo cargar el fichero');
      const text = await res.text();
      const p = parseSSWBasic(text);

      // chassis/model: del .ssw, fallback al name del index
      const fallback = m.name || `${m.chassis ?? ''} ${m.model ?? ''}`.trim();
      setChassis(p.chassis || (fallback.split(' ')[0] ?? ''));
      setModel(p.model || fallback.split(' ').slice(1).join(' '));
      setTons(p.tons ?? m.tons ?? 0);
      setPrecio(p.cost ?? m.cost ?? 0);
    } catch {
      // Fallback: solo lo que viene del index
      setChassis(m.chassis ?? m.name?.split(' ')[0] ?? '');
      setModel(m.model ?? m.name?.split(' ').slice(1).join(' ') ?? '');
      setTons(m.tons ?? 0);
      setPrecio(m.cost ?? 0);
    } finally {
      setLoadingSsw(false);
    }
  };

  const handleSelect = (m: CatalogMech) => {
    setSelected(m);
    setQuery(m.name || m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`.trim());
    void loadSswDetail(m);
  };

  const handleClear = () => {
    setSelected(null); setQuery(''); setPrecio(0); setPilotoIdx(''); setNotas('');
    setChassis(''); setModel(''); setTons(0); setFactorPct(100);
  };

  // ── Prefill desde TRO: ?buy=<file.ssw> ──
  useEffect(() => {
    const buyFile = searchParams.get('buy');
    if (!buyFile || !catalog || selected) return;
    const m = catalog.mechs.find(x => x.file === buyFile);
    if (m) {
      handleSelect(m);
      // Limpia el param para no re-disparar
      searchParams.delete('buy');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, searchParams]);

  const handleComprar = async () => {
    if (!selected || precioFinal <= 0 || !chassis || tons <= 0) return;
    setCommitState('sending');
    try {
      const item = newHangarItem({
        chassis,
        model,
        tons,
        bv:          selected.bv2,
        era:         selected.year ? String(selected.year) : (selected.era ? String(selected.era) : ''),
        sourceFile:  selected.file,
        precioBase:  precioFinal,
        fechaCompra: campaignDate,
        pilotoIdx:   pilotoIdx === '' ? undefined : pilotoIdx,
      });
      const factorNote = factorPct !== 100 ? ` · factor ${factorPct}%` : '';
      if (notas || factorPct !== 100) item.notas = `${notas}${factorNote}`.trim();

      await saveHangarItem(item);
      await commitLibroEntryAndTreasury({
        id:        genId('lm'),
        fecha:     campaignDate,
        concepto:  `Compra · ${item.chassis} ${item.model}`,
        cantidad:  precioFinal,
        tipo:      'gasto',
        categoria: 'compra_mech',
        nota:      `${item.tons}t · BV ${item.bv ?? '?'}${factorNote}${notas ? ' · ' + notas : ''}`,
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
      <div>
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
      </div>
      {!selected && suggestions.length > 0 && (
        <ul className="mt-1 max-h-72 overflow-y-auto bg-surface-container-high border border-primary-container/30 custom-scrollbar">
          {suggestions.map(m => (
            <li key={m.file} className="border-b border-outline-variant/15 last:border-b-0">
              <button
                onClick={() => handleSelect(m)}
                className="w-full text-left px-3 py-2 font-mono text-[11px] text-on-surface hover:bg-primary-container/20 flex items-center justify-between gap-2"
              >
                <span>{m.name || m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`}</span>
                <span className="text-secondary/60 text-[9px]">
                  {m.bv2 ? `BV ${m.bv2}` : ''}{m.year ? ` · ${m.year}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="border border-primary-container/30 bg-primary-container/5 p-3 space-y-2">
          <div className="font-headline text-sm font-bold text-primary-container flex items-center gap-2">
            {chassis} {model}
            {loadingSsw && <Loader size={12} className="animate-spin text-secondary/50" />}
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-secondary/70">
            <div>BV: <span className="text-secondary">{selected.bv2 ?? '—'}</span></div>
            <div>Año: <span className="text-secondary">{selected.year ?? '—'}</span></div>
            <div>Archivo: <span className="text-secondary truncate inline-block max-w-[120px]" title={selected.file}>{selected.file}</span></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Chasis</label>
              <input
                value={chassis}
                onChange={e => setChassis(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Modelo</label>
              <input
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Tons</label>
              <input
                type="number" min={0}
                value={tons || ''}
                onFocus={e => e.target.select()}
                onChange={e => setTons(parseInt(e.target.value) || 0)}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
                Precio base canon
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
                {roster.map((r, i) => (
                  <option key={i} value={i}>{r.apodo || r.nombre || `Piloto ${i + 1}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Factor descuento/markup — análogo al estadoFactPct del Taller */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
              Factor compra: <span className="text-primary-container font-bold">{factorPct}%</span>
              <span className="text-secondary/50 ml-2">
                ({factorPct < 100 ? `−${100 - factorPct}% descuento`
                  : factorPct > 100 ? `+${factorPct - 100}% sobreprecio`
                  : 'canon'})
              </span>
            </label>
            <input
              type="range" min={0} max={200} step={5}
              value={factorPct}
              onChange={e => setFactorPct(parseInt(e.target.value) || 0)}
              className="w-full"
            />
            <div className="flex justify-between font-mono text-[9px] text-secondary/50 mt-0.5">
              <span>0%</span><span>50%</span><span>100%</span><span>150%</span><span>200%</span>
            </div>
          </div>

          <div className="border border-primary-container/40 bg-primary-container/5 p-2 font-mono text-[10px] grid grid-cols-3 gap-2">
            <div>
              <div className="text-secondary/60 uppercase tracking-widest text-[8px]">Canon</div>
              <div className="text-secondary">{precio.toLocaleString('es-ES')} ₡</div>
            </div>
            <div>
              <div className="text-secondary/60 uppercase tracking-widest text-[8px]">× Factor</div>
              <div className="text-secondary">{factorPct}%</div>
            </div>
            <div>
              <div className="text-primary-container uppercase tracking-widest text-[8px]">Final</div>
              <div className="text-primary-container font-bold text-sm">{precioFinal.toLocaleString('es-ES')} ₡</div>
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
            disabled={precioFinal <= 0 || tons <= 0 || !chassis || commitState === 'sending' || loadingSsw}
            className={`w-full py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
              precioFinal <= 0 || tons <= 0 || !chassis
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
              : `Comprar (${precioFinal.toLocaleString('es-ES')} ₡)`}
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
  const { campaign, setActiveSubTab, roster } = useAppStore();
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
        <div>Piloto: <span className="text-secondary">{selected.pilotoIdx !== undefined ? pilotLabel(roster, selected.pilotoIdx) : 'Reserva'}</span></div>
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
