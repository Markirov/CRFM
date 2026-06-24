// ══════════════════════════════════════════════════════════════
//  HANGAR PAGE — Inventario de mechs propiedad de la unidad.
//  Tabs: Inventario / Comprar / Vender.
//  Compra crea HangarItem + asiento libro mayor (compra_mech).
//  Venta elimina HangarItem + asiento libro mayor (venta_mech).
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Trash2, Loader, AlertTriangle, Hammer, DollarSign } from 'lucide-react';
import { loadRoster } from '@/lib/roster';
import { EditorPage } from '@/pages/EditorPage';
import { useAppStore } from '@/lib/store';
import { usePerm } from '@/hooks/usePerm';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { commitLibroEntryAndTreasury, loadHangar, saveHangarItem, deleteHangarItem } from '@/lib/firebase-service';
import { newHangarItem, type HangarItem } from '@/lib/hangar-types';
import { useMechCatalog, type CatalogMech } from '@/hooks/useMechCatalog';
import { parseSSWBasic } from '@/lib/ssw-basic';
import { MercadoMechsTab } from '@/components/hangar/MercadoTab';
import { CustomMechsTab } from '@/components/hangar/CustomMechsTab';
import { SalvageModal } from '@/components/taller/SalvageModal';

export function HangarPage() {
  const activeSubTab = useAppStore(s => s.activeSubTab);
  const setActiveSubTab = useAppStore(s => s.setActiveSubTab);
  const { readable, writable, loading: permLoading } = usePerm('hangar');
  type View = 'unidades' | 'mercado-mechs' | 'disenos';

  const view: View =
    activeSubTab === 'mercado-mechs' ? 'mercado-mechs'
    : activeSubTab === 'disenos' ? 'disenos'
    : 'unidades';

  useEffect(() => {
    if (!['unidades', 'mercado-mechs', 'disenos'].includes(activeSubTab)) {
      setActiveSubTab('unidades');
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

  // Bloqueo de lectura
  if (!permLoading && !readable) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="font-headline text-lg text-primary-container uppercase tracking-widest">Acceso restringido</div>
          <div className="font-mono text-[11px] text-secondary/60 mt-2">No tienes permisos para ver el Hangar</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-[fadeInUp_0.3s_ease] max-w-6xl mx-auto">
      <h1 className="font-headline text-xl font-black text-primary-container tracking-tighter uppercase mb-4">
        Logística de la unidad
      </h1>

      {view === 'unidades' && <UnidadesTab items={items} loading={loading} refresh={refresh} />}
      {view === 'mercado-mechs' && <MercadoMechsTab items={items} refresh={refresh} />}
      {view === 'disenos' && <CustomMechsTab />}
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

function UnidadesTab({ items, loading, refresh }: {
  items: HangarItem[]; loading: boolean; refresh: () => Promise<void>;
}) {
  const roster = useAppStore(s => s.roster);
  const setActiveSubTab = useAppStore(s => s.setActiveSubTab);
  const { catalog } = useMechCatalog();
  const navigate = useNavigate();
  const fmt = (n: number) => Math.round(n).toLocaleString('es-ES') + ' ₡';

  // ── Filtros + búsqueda ──
  const [query, setQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'operativo' | 'danado' | 'destruido'>('todos');
  const [filterAsig, setFilterAsig] = useState<'todos' | 'asignados' | 'reserva'>('todos');
  const [filterClass, setFilterClass] = useState<'todos' | 'light' | 'medium' | 'heavy' | 'assault'>('todos');

  // Edición inline estadoPct
  const [editPctId, setEditPctId] = useState<string | null>(null);
  const [editPctVal, setEditPctVal] = useState<number>(100);

  const handleSetEstadoPct = async (item: HangarItem, pct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const newEstado: HangarItem['estado'] = clamped === 0 ? 'destruido' : clamped >= 100 ? 'operativo' : 'danado';
    await saveHangarItem({ ...item, estadoPct: clamped, estado: newEstado });
    setEditPctId(null);
    void refresh();
  };

  const classOf = (tons: number): 'light' | 'medium' | 'heavy' | 'assault' => {
    if (tons <= 35) return 'light';
    if (tons <= 55) return 'medium';
    if (tons <= 75) return 'heavy';
    return 'assault';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      if (q) {
        const pilotName = it.pilotoIdx !== undefined ? pilotLabel(roster, it.pilotoIdx).toLowerCase() : '';
        const hay = `${it.chassis} ${it.model} ${pilotName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterEstado !== 'todos') {
        const est = it.estado ?? (it.estadoPct === 0 ? 'destruido' : (it.estadoPct ?? 100) < 100 ? 'danado' : 'operativo');
        if (est !== filterEstado) return false;
      }
      if (filterAsig === 'asignados' && it.pilotoIdx === undefined) return false;
      if (filterAsig === 'reserva' && it.pilotoIdx !== undefined) return false;
      if (filterClass !== 'todos' && classOf(it.tons) !== filterClass) return false;
      return true;
    });
  }, [items, query, filterEstado, filterAsig, filterClass, roster]);

  const catalogMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!catalog) return map;
    for (const m of catalog.mechs) {
      if (m.chassis && m.model) {
        map.set(`${m.chassis} ${m.model}`, m.file);
      }
    }
    return map;
  }, [catalog]);

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

  const handleVenderRestos = async (item: HangarItem) => {
    const amountStr = window.prompt(`Valor actual estimado: ${fmt(item.valorActual)}.\nIntroduzca el valor de venta de los restos (₡):`, Math.round(item.valorActual * 0.2).toString());
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount < 0) return;
    
    if (!window.confirm(`¿Vender los restos de ${item.chassis} ${item.model} por ${fmt(amount)}?`)) return;
    
    // Asiento
    await commitLibroEntryAndTreasury({
      id: genId('lm'),
      tipo: 'ingreso',
      cantidad: amount,
      concepto: `Venta restos: ${item.chassis} ${item.model}`,
      categoria: 'venta_mech',
      fecha: getCampaignDateISO(useAppStore.getState().campaign?.campaignYear, useAppStore.getState().campaign?.campaignMonth),
      nota: '',
      jugador: ''
    });
    
    // Borrar hangar
    await deleteHangarItem(item.id);
    void refresh();
  };

  const handleVenderMech = async (item: HangarItem) => {
    const amountStr = window.prompt(`Valor actual estimado: ${fmt(item.valorActual)}.\nIntroduzca el valor de venta del mech (₡):`, Math.round(item.valorActual * 0.5).toString());
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount < 0) return;
    
    if (!window.confirm(`¿Vender el ${item.chassis} ${item.model} por ${fmt(amount)}?`)) return;
    
    // Asiento
    await commitLibroEntryAndTreasury({
      id: genId('lm'),
      tipo: 'ingreso',
      cantidad: amount,
      concepto: `Venta mech: ${item.chassis} ${item.model}`,
      categoria: 'venta_mech',
      fecha: getCampaignDateISO(useAppStore.getState().campaign?.campaignYear, useAppStore.getState().campaign?.campaignMonth),
      nota: '',
      jugador: ''
    });
    
    // Borrar hangar
    await deleteHangarItem(item.id);
    void refresh();
  };

  const [editingMech, setEditingMech] = useState<HangarItem | null>(null);
  const [editingXml, setEditingXml] = useState<string | null>(null);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [salvageMech, setSalvageMech] = useState<HangarItem | null>(null);
  const [salvageWeapons, setSalvageWeapons] = useState<string[] | undefined>(undefined);

  /** Carga .ssw (sswRaw o catálogo) + parsea weapons antes de abrir SalvageModal. */
  const openSalvage = async (it: HangarItem) => {
    setSalvageMech(it);
    setSalvageWeapons(undefined);
    try {
      let xml: string | null = null;
      if (it.sswRaw) {
        xml = it.sswRaw;
      } else {
        const sourceFile = it.sourceFile || catalogMap.get(`${it.chassis} ${it.model}`);
        if (sourceFile) {
          const res = await fetch(`/assets/mechs/${sourceFile}`);
          if (res.ok) xml = await res.text();
        }
      }
      if (xml) {
        const parsed = parseSSWBasic(xml);
        setSalvageWeapons(parsed.weapons);
      }
    } catch {
      // Falla silenciosa — SalvageModal usa fallback count slots
    }
  };

  const openEditor = async (it: HangarItem) => {
    if (it.sswRaw) {
      setEditingMech(it);
      setEditingXml(it.sswRaw);
      return;
    }
    const sourceFile = it.sourceFile || catalogMap.get(`${it.chassis} ${it.model}`);
    if (sourceFile) {
      setLoadingEditor(true);
      try {
        const res = await fetch(`/assets/mechs/${sourceFile}`);
        if (!res.ok) throw new Error('File not found');
        const xml = await res.text();
        setEditingMech(it);
        setEditingXml(xml);
      } catch (e) {
        alert('No se pudo cargar el archivo SSW original del catálogo.');
      } finally {
        setLoadingEditor(false);
      }
    }
  };

  const handleSaveEditor = async (originalItem: HangarItem, newSswXml: string, target: 'hangar' | 'personal' = 'hangar') => {
    if (target === 'personal') {
      // Copiar a customMechs personales sin tocar el Hangar
      try {
        const { saveMyCustomMech } = await import('@/lib/custom-mechs-service');
        const { parseSSWBasic } = await import('@/lib/ssw-basic');
        const parsed = parseSSWBasic(newSswXml);
        await saveMyCustomMech({
          id: `${originalItem.id}-mod-${Date.now()}`,
          name: `${originalItem.chassis} ${originalItem.model} (mod)`,
          chassis: parsed.chassis ?? originalItem.chassis,
          model: parsed.model ?? originalItem.model,
          tons: parsed.tons ?? originalItem.tons,
          bv: parsed.cost ?? undefined,
          era: parsed.era ?? undefined,
          sswRaw: newSswXml,
        });
        alert('Diseño guardado en tu espacio personal (Hangar → Diseños).');
      } catch (err) {
        console.error(err);
        alert('Error guardando diseño personal.');
      }
      setEditingMech(null);
      return;
    }
    // target === 'hangar' → solicita modificación pendiente (no aplica hasta aprobación + reparación)
    const updated: HangarItem = {
      ...originalItem,
      modificacionPendiente: {
        sswRawNew: newSswXml,
        requestedAt: Date.now(),
        status: 'pending',
      },
    };
    await saveHangarItem(updated);
    setEditingMech(null);
    void refresh();
  };

  const handleReparar = async (item: HangarItem) => {
    // Si queremos reparar todo, solo limpiamos el sessionActiva y resetamos damagePersist
    if (!window.confirm(`¿Marcar el ${item.chassis} ${item.model} como reparado en el inventario? (Recuerda pagar la reparación en Taller)`)) return;
    await saveHangarItem({
      ...item,
      estado: 'operativo',
      estadoPct: 100,
      damagePersist: undefined,
      sessionActiva: undefined,
    });
    void refresh();
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase">
          Mechs en hangar ({filtered.length}{filtered.length !== items.length ? ` de ${items.length}` : ''})
        </h2>
      </div>

      {/* Filtros + búsqueda */}
      {items.length > 0 && (
        <div className="mb-3 p-2 bg-surface border border-outline-variant/20 flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1">
            <Search className="w-3 h-3 text-secondary/50" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar chassis/model/piloto"
              className="bg-surface-container border border-outline-variant/40 px-2 py-1 text-[10px] text-cream w-48"
            />
          </div>
          <label className="flex items-center gap-1 text-secondary/60">
            Estado:
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value as any)}
              className="bg-surface-container border border-outline-variant/40 px-1 py-0.5 text-[10px] text-cream"
            >
              <option value="todos">Todos</option>
              <option value="operativo">Operativo</option>
              <option value="danado">Dañado</option>
              <option value="destruido">Destruido</option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-secondary/60">
            Asignación:
            <select
              value={filterAsig}
              onChange={e => setFilterAsig(e.target.value as any)}
              className="bg-surface-container border border-outline-variant/40 px-1 py-0.5 text-[10px] text-cream"
            >
              <option value="todos">Todos</option>
              <option value="asignados">Asignados</option>
              <option value="reserva">Reserva</option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-secondary/60">
            Clase:
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value as any)}
              className="bg-surface-container border border-outline-variant/40 px-1 py-0.5 text-[10px] text-cream"
            >
              <option value="todos">Todas</option>
              <option value="light">Ligero (≤35t)</option>
              <option value="medium">Medio (40-55t)</option>
              <option value="heavy">Pesado (60-75t)</option>
              <option value="assault">Asalto (80+t)</option>
            </select>
          </label>
          {(query || filterEstado !== 'todos' || filterAsig !== 'todos' || filterClass !== 'todos') && (
            <button
              onClick={() => { setQuery(''); setFilterEstado('todos'); setFilterAsig('todos'); setFilterClass('todos'); }}
              className="px-2 py-0.5 border border-outline-variant/40 text-secondary/60 hover:text-secondary hover:bg-surface-container-high uppercase tracking-widest"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {loading && <p className="font-mono text-[10px] text-secondary/50 italic">Cargando…</p>}
      {!loading && items.length === 0 && (
        <p className="font-mono text-[10px] text-secondary/50 italic">
          Hangar vacío. Pestaña "Comprar" para añadir mechs.
        </p>
      )}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <p className="font-mono text-[10px] text-secondary/50 italic py-3 text-center">
          Ningún mech coincide con los filtros.
        </p>
      )}
      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-surface-container">
                <Th>Nombre</Th>
                <Th align="center">Tipo</Th>
                <Th align="right">Tons</Th>
                <Th align="right">BV</Th>
                <Th align="right">Año</Th>
                <Th align="center">Estado</Th>
                <Th align="right">Valor</Th>
                <Th align="left">Asignado</Th>
                <Th align="left">Compra</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => {
                const taken = it.pilotoIdx !== undefined;
                const pilotName = taken ? pilotLabel(roster, it.pilotoIdx!) : null;
                return (
                  <tr key={it.id} className="border-b border-outline-variant/20 hover:bg-primary-container/5 group">
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-on-surface font-bold">
                      {it.modificacionPendiente && it.modificacionPendiente.status !== 'applied' && (
                        <span
                          title={`Modificación ${it.modificacionPendiente.status}: requiere aprobación + reparación`}
                          className="inline-block align-middle mr-1"
                        >
                          <AlertTriangle className="inline w-3.5 h-3.5 -mt-0.5 text-amber-400" />
                        </span>
                      )}
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
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-center">
                      {editPctId === it.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number" min={0} max={100} value={editPctVal}
                            onChange={e => setEditPctVal(parseInt(e.target.value) || 0)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') void handleSetEstadoPct(it, editPctVal);
                              if (e.key === 'Escape') setEditPctId(null);
                            }}
                            autoFocus
                            className="w-12 bg-surface-container border border-primary-container/60 px-1 text-[10px] text-cream font-mono"
                          />
                          <button
                            onClick={() => void handleSetEstadoPct(it, editPctVal)}
                            className="text-emerald-400 hover:text-emerald-300 text-[10px]"
                            title="Aplicar (Enter)"
                          >✓</button>
                          <button
                            onClick={() => setEditPctId(null)}
                            className="text-error/60 hover:text-error text-[10px]"
                            title="Cancelar (Esc)"
                          >✕</button>
                        </div>
                      ) : (() => {
                        if (it.estado === 'destruido' || it.estadoPct === 0) {
                          return (
                            <button
                              onClick={() => { setEditPctVal(it.estadoPct ?? 0); setEditPctId(it.id); }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[9px] tracking-widest text-error border-error/40 bg-error/5 hover:bg-error/10"
                              title="Click para editar"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span className="font-bold">DESTRUIDO</span>
                            </button>
                          );
                        }
                        const pct = it.estadoPct ?? 100;
                        const color = pct >= 75 ? 'text-green-400 border-green-400/40 bg-green-400/5 hover:bg-green-400/10'
                                     : pct >= 40 ? 'text-amber-400 border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/10'
                                     :             'text-error border-error/40 bg-error/5 hover:bg-error/10';
                        return (
                          <button
                            onClick={() => { setEditPctVal(pct); setEditPctId(it.id); }}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[9px] tracking-widest cursor-pointer ${color}`}
                            title="Click para editar"
                          >
                            <span className="font-bold">{pct}%</span>
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-right text-primary-container">{fmt(it.valorActual)}</td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20">
                      {(it.estado === 'destruido' || it.estadoPct === 0) ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => void openSalvage(it)} className="px-2 py-1 border border-amber-400/60 bg-surface-container hover:bg-amber-400/20 text-[9px] uppercase tracking-widest text-amber-400 transition-colors" title="Desguace fino con tiradas Technician">
                            Desguazar
                          </button>
                          <button onClick={() => handleVenderRestos(it)} className="px-2 py-1 border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-[9px] uppercase tracking-widest text-error transition-colors">
                            Vender Restos
                          </button>
                          <button onClick={() => handleReparar(it)} className="px-2 py-1 border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-[9px] uppercase tracking-widest text-green-400 transition-colors">
                            Limpiar Daño
                          </button>
                        </div>
                      ) : (
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
                          
                          <button
                            onClick={() => {
                              navigate(`/taller?mech=${it.id}`);
                            }}
                            className="ml-2 px-2 py-0.5 border border-secondary/40 bg-secondary/10 hover:bg-secondary/20 text-secondary text-[9px] uppercase tracking-widest transition-colors flex items-center gap-1"
                            title="Enviar a Taller para mantenimiento"
                          >
                            <Hammer className="w-2.5 h-2.5" />
                            Taller
                          </button>
                          
                          {(it.sswRaw || it.sourceFile || catalogMap.has(`${it.chassis} ${it.model}`)) && (
                            <button
                              onClick={() => openEditor(it)}
                              disabled={loadingEditor}
                              className="ml-1 px-2 py-0.5 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] uppercase tracking-widest transition-colors"
                              title="Modificar Loadout (Editor)"
                            >
                              Modificar
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleVenderMech(it)}
                            className="ml-1 px-2 py-0.5 border border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/10 text-amber-400 text-[9px] uppercase tracking-widest transition-colors flex items-center gap-1"
                            title="Vender mech operativo/dañado"
                          >
                            <DollarSign className="w-2.5 h-2.5" />
                            Vender
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 border-b border-outline-variant/20 text-secondary/60 text-[9px]">{it.fechaCompra}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {editingMech && editingXml && (
        <EditorPage
          initialSswXml={editingXml}
          mode="campaign"
          strictTech={true}
          allowHangarSave={true}
          allowPersonalSave={true}
          onSave={(newXml, target) => handleSaveEditor(editingMech, newXml, target)}
          onCancel={() => {
            setEditingMech(null);
            setEditingXml(null);
          }}
        />
      )}

      {salvageMech && (
        <SalvageModal
          mech={salvageMech}
          weapons={salvageWeapons}
          onClose={() => { setSalvageMech(null); setSalvageWeapons(undefined); }}
          onCommit={() => {
            setSalvageMech(null);
            setSalvageWeapons(undefined);
            void refresh();
          }}
        />
      )}
    </section>
  );
}

