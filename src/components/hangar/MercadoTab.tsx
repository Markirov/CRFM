import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Trash2, Loader, ArrowRightLeft, Shield, Package } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useMechCatalog, type CatalogMech } from '@/hooks/useMechCatalog';
import { parseSSWBasic } from '@/lib/ssw-basic';
import { saveHangarItem, commitLibroEntryAndTreasury, saveConfigBatch } from '@/lib/firebase-service';
import { newHangarItem, type HangarItem } from '@/lib/hangar-types';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { ALMACEN_CATALOG, type AlmacenCatalogItem } from '@/lib/almacen-catalog';

const fmt = (n: number) => Math.round(n).toLocaleString('es-ES') + ' ₡';

export function MercadoTab({ items, refresh }: { items: HangarItem[]; refresh: () => Promise<void> }) {
  const [mode, setMode] = useState<'mechs' | 'material'>('material');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-surface-container/50 rounded-lg w-fit">
        <button
          onClick={() => setMode('material')}
          className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-widest transition-colors rounded ${
            mode === 'material' ? 'bg-primary-container text-on-primary-container' : 'text-secondary/60 hover:text-secondary'
          }`}
        >
          Mercado de Piezas
        </button>
        <button
          onClick={() => setMode('mechs')}
          className={`px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-widest transition-colors rounded ${
            mode === 'mechs' ? 'bg-primary-container text-on-primary-container' : 'text-secondary/60 hover:text-secondary'
          }`}
        >
          Compraventa de Unidades
        </button>
      </div>

      {mode === 'material' && <MercadoMaterialTab />}
      {mode === 'mechs' && <MercadoMechsTab items={items} refresh={refresh} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MERCADO DE PIEZAS (ALMACÉN)
// ════════════════════════════════════════════════════════════

function MercadoMaterialTab() {
  const { campaign, setCampaign } = useAppStore();
  const almacen = campaign.almacen || {};
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AlmacenCatalogItem | null>(null);
  const [cantidadTons, setCantidadTons] = useState(1);
  const [commitState, setCommitState] = useState<'idle' | 'sending' | 'done'>('idle');

  const suggestions = useMemo(() => {
    if (query.trim().length < 1) return ALMACEN_CATALOG;
    const q = query.trim().toLowerCase();
    return ALMACEN_CATALOG.filter(c => c.nombre.toLowerCase().includes(q));
  }, [query]);

  const precioTotal = selected ? selected.costoBase * cantidadTons : 0;

  const handleComprar = async () => {
    if (!selected || cantidadTons <= 0 || precioTotal <= 0) return;
    setCommitState('sending');

    const yieldAmount = selected.yield ? selected.yield * cantidadTons : cantidadTons;
    const newAlmacen = { ...almacen };
    newAlmacen[selected.nombre] = (newAlmacen[selected.nombre] || 0) + yieldAmount;

    // Asiento contable
    await commitLibroEntryAndTreasury({
      id: genId('lm'),
      fecha: campaignDate,
      concepto: `Compra de material: ${selected.nombre} (x${cantidadTons}${selected.tons ? ' tons' : ' uds'})`,
      cantidad: precioTotal,
      tipo: 'gasto',
      categoria: 'repuestos',
      nota: `Sumados ${yieldAmount} unidades al almacén`,
      jugador: '',
    });

    setCampaign({ almacen: newAlmacen });
    await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });

    setCommitState('done');
    setTimeout(() => {
      setCommitState('idle');
      setSelected(null);
      setQuery('');
      setCantidadTons(1);
    }, 1500);
  };

  return (
    <div className="bg-surface-container-low border border-primary-container/30 p-4 rounded-xl space-y-4">
      <div>
        <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
          Buscar equipo, munición o blindaje
        </label>
        <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/40 px-2">
          <Search size={14} className="text-secondary/50" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Medium Laser, Ammo (LRM), Armor..."
            className="flex-1 bg-transparent px-2 py-2 font-mono text-sm text-on-surface focus:outline-none"
          />
          {selected && (
            <button onClick={() => { setSelected(null); setQuery(''); }} className="text-secondary/50 hover:text-error">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {!selected && (
        <div className="max-h-80 overflow-y-auto bg-surface border border-outline-variant/20 rounded">
          {suggestions.map(item => (
            <button
              key={item.nombre}
              onClick={() => { setSelected(item); setQuery(item.nombre); setCantidadTons(1); }}
              className="w-full text-left px-3 py-2 border-b border-outline-variant/10 hover:bg-primary-container/10 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                {item.tipo === 'blindaje' ? <Shield className="w-4 h-4 text-secondary/50" /> : <Package className="w-4 h-4 text-secondary/50" />}
                <span className="font-mono text-sm">{item.nombre}</span>
              </div>
              <div className="flex gap-4 font-mono text-[10px] text-secondary/60 text-right">
                <span>{fmt(item.costoBase)} / {item.tons ? 'ton' : 'ud'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-surface border border-primary-container/20 p-4 rounded space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-headline font-bold text-lg text-primary-container">{selected.nombre}</h3>
              <div className="font-mono text-xs text-secondary/70 uppercase tracking-widest">
                Tipo: {selected.tipo} · Coste base: {fmt(selected.costoBase)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">
                Cantidad a comprar ({selected.tons ? 'Toneladas' : 'Unidades'})
              </label>
              <input
                type="number"
                min="1"
                value={cantidadTons}
                onChange={e => setCantidadTons(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 bg-surface-container border border-outline-variant/40 px-2 py-1.5 font-mono text-sm"
              />
            </div>
            {selected.yield && (
              <div className="pt-4 font-mono text-xs text-secondary/80">
                → Recibirás <strong className="text-cream">{selected.yield * cantidadTons}</strong> {selected.tipo === 'blindaje' ? 'puntos' : 'rondas/misiles'}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
            <div className="font-mono text-xs text-secondary/80 uppercase">
              Coste Total: <span className="text-error font-bold text-base">{fmt(precioTotal)}</span>
            </div>
            <button
              onClick={handleComprar}
              disabled={commitState !== 'idle' || precioTotal <= 0}
              className="bg-primary-container text-on-primary-container px-6 py-2 rounded font-headline text-sm font-bold uppercase tracking-widest hover:bg-primary disabled:opacity-50"
            >
              {commitState === 'idle' ? 'Cargar a Tesorería' : commitState === 'done' ? '✓ Comprado' : 'Procesando...'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MERCADO DE UNIDADES (MECHS/VEHICULOS)
// ════════════════════════════════════════════════════════════

function MercadoMechsTab({ items, refresh }: { items: HangarItem[]; refresh: () => Promise<void> }) {
  const { campaign, setActiveSubTab, roster } = useAppStore();
  const { catalog } = useMechCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogMech | null>(null);
  const [loadingSsw, setLoadingSsw] = useState(false);
  const [chassis, setChassis] = useState('');
  const [model, setModel] = useState('');
  const [tons, setTons] = useState(0);
  const [hasJumpJets, setHasJumpJets] = useState(false);
  const [hasAmmo, setHasAmmo] = useState(false);
  const [precio, setPrecio] = useState(0);
  const [factorPct, setFactorPct] = useState(100);
  const [pilotoIdx, setPilotoIdx] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [commitState, setCommitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const precioFinal = Math.round(precio * (factorPct / 100));

  const suggestions = useMemo(() => {
    if (!catalog || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return catalog.mechs.filter(m => {
      const label = m.name || m.fullName || `${m.chassis ?? ''} ${m.model ?? ''}`;
      return label.toLowerCase().includes(q);
    }).slice(0, 12);
  }, [catalog, query]);

  const loadSswDetail = async (m: CatalogMech) => {
    setLoadingSsw(true);
    try {
      const base = import.meta.env.BASE_URL;
      const res = await fetch(`${base}assets/mechs/${encodeURIComponent(m.file)}`);
      if (!res.ok) throw new Error('No se pudo cargar el fichero');
      const text = await res.text();
      const p = parseSSWBasic(text);

      const fallback = m.name || `${m.chassis ?? ''} ${m.model ?? ''}`.trim();
      setChassis(p.chassis || (fallback.split(' ')[0] ?? ''));
      setModel(p.model || fallback.split(' ').slice(1).join(' '));
      setTons(p.tons ?? m.tons ?? 0);
      setPrecio(Math.round(p.cost ?? m.cost ?? 0));
      setHasJumpJets(p.hasJumpJets);
      setHasAmmo(p.hasAmmo);
    } catch {
      setChassis(m.chassis ?? m.name?.split(' ')[0] ?? '');
      setModel(m.model ?? m.name?.split(' ').slice(1).join(' ') ?? '');
      setTons(m.tons ?? 0);
      setPrecio(Math.round(m.cost ?? 0));
      setHasJumpJets(false);
      setHasAmmo(false);
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
    setHasJumpJets(false); setHasAmmo(false);
  };

  useEffect(() => {
    const buyFile = searchParams.get('buy');
    if (!buyFile || !catalog || selected) return;
    const m = catalog.mechs.find(x => x.file === buyFile);
    if (m) {
      handleSelect(m);
      searchParams.delete('buy');
      setSearchParams(searchParams, { replace: true });
    }
  }, [catalog, searchParams]);

  const handleComprar = async () => {
    if (!selected || precioFinal < 0 || !chassis || tons <= 0) return;
    setCommitState('sending');
    try {
      const item = newHangarItem({
        chassis,
        model,
        tons,
        bv:          selected.bv2,
        era:         selected.year ? String(selected.year) : (selected.era ? String(selected.era) : ''),
        sourceFile:  selected.file,
        hasJumpJets,
        hasAmmo,
        precioBase:  precio,
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
        setActiveSubTab('unidades');
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
              <input value={chassis} onChange={e => setChassis(e.target.value)} className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary" />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Modelo</label>
              <input value={model} onChange={e => setModel(e.target.value)} className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary" />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Tonelaje</label>
              <input type="number" value={tons} onChange={e => setTons(parseFloat(e.target.value)||0)} className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Base canon (₡)</label>
              <input type="number" value={precio} onChange={e => setPrecio(parseInt(e.target.value)||0)} className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary" />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Multiplicador (%)</label>
              <div className="flex gap-1">
                <input type="number" value={factorPct} onChange={e => setFactorPct(parseInt(e.target.value)||0)} className="w-16 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary text-right" />
                <button onClick={() => setFactorPct(100)} className="px-2 bg-surface-container hover:bg-outline-variant/20 border border-outline-variant/40 text-[9px] font-mono text-secondary/60">100%</button>
                <button onClick={() => setFactorPct(200)} className="px-2 bg-surface-container hover:bg-outline-variant/20 border border-outline-variant/40 text-[9px] font-mono text-secondary/60">200%</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Piloto (opcional)</label>
              <select
                value={pilotoIdx}
                onChange={e => setPilotoIdx(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary"
              >
                <option value="">[A reserva]</option>
                {roster.map((r, i) => <option key={i} value={i}>{r.apodo || r.nombre || `Piloto ${i+1}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-secondary/60 mb-1">Notas contables</label>
              <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: Compra mercado negro" className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-secondary" />
            </div>
          </div>
          <div className="pt-2 border-t border-primary-container/20 flex justify-between items-end mt-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-secondary/60">Total a pagar</div>
              <div className="font-headline text-lg font-black text-error">{fmt(precioFinal)}</div>
            </div>
            <button
              onClick={handleComprar}
              disabled={commitState !== 'idle' || precioFinal < 0}
              className={`px-4 py-1.5 font-headline text-xs font-bold tracking-widest uppercase transition-colors clip-chamfer ${
                commitState === 'idle'
                  ? 'bg-primary-container text-on-primary-container hover:bg-primary'
                  : commitState === 'sending' ? 'bg-secondary/40 text-secondary'
                  : commitState === 'done' ? 'bg-greenDeep text-cream'
                  : 'bg-error text-on-error'
              }`}
            >
              {commitState === 'idle' ? 'Comprar'
               : commitState === 'sending' ? 'Añadiendo...'
               : commitState === 'done' ? 'Adquirido'
               : 'Error'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
