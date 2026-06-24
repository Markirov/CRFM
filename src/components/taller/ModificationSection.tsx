// ══════════════════════════════════════════════════════════════
//  ModificationSection — Sección de mods aprobadas en Reparación
//
//  Aparece en ReparacionTab cuando hay HangarItem con
//  modificacionPendiente.status === 'approved'. Muestra diff
//  loadout, tiempo y coste, y permite aplicar (atómico):
//   · sswRaw := sswRawNew
//   · status := 'applied'
//   · almacén += equipo desmontado (tech split)
//   · almacén -= equipo instalado; faltante → compras factura
//   · libro mayor 1 asiento "Modificación · <mech>"
//   · pool tiempo descuenta diff.timeMin
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Loader } from 'lucide-react';
import {
  loadHangar, saveHangarItem, saveConfigBatch, commitLibroEntryAndTreasury,
} from '@/lib/firebase-service';
import type { HangarItem } from '@/lib/hangar-types';
import { diffSswLoadouts, applyModToAlmacen, type ModificationDiff } from '@/lib/modification-engine';
import { formatCzar } from '@/lib/currency-utils';
import { genId, getCampaignDateISO } from '@/pages/FinanzasPage';
import { useTallerShared } from '@/lib/taller-shared';
import { useAppStore } from '@/lib/store';

const fmt = (n: number) => formatCzar(n);

export function ModificationSection() {
  const [items, setItems] = useState<HangarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const consumeMechTime = useTallerShared(s => s.consumeMechTime);
  const campYear  = useAppStore(s => s.campaign.campaignYear);
  const campMonth = useAppStore(s => s.campaign.campaignMonth);

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

  const aprobados = useMemo(() =>
    items.filter(it => it.modificacionPendiente && it.modificacionPendiente.status === 'approved'),
    [items]
  );

  if (aprobados.length === 0) return null;

  const handleAplicar = async (it: HangarItem) => {
    if (!it.modificacionPendiente) return;
    const rawOld = it.sswRaw || '';
    const rawNew = it.modificacionPendiente.sswRawNew;
    if (!rawOld || !rawNew) {
      alert('Falta SSW para diff. Aborto.');
      return;
    }
    const diff = diffSswLoadouts(rawOld, rawNew);

    const confirm = window.confirm(
      `Aplicar modificación a ${it.chassis} ${it.model}?\n\n` +
      `Tiempo: ${diff.timeMin} min\n` +
      `Coste: ${fmt(diff.costoDiff)}\n` +
      `Desmonta: ${diff.removed.length}  ·  Instala: ${diff.added.length}  ·  Mueve: ${diff.moved.length}`
    );
    if (!confirm) return;

    setApplying(it.id);
    try {
      // 1. Almacén
      const { loadConfig } = await import('@/lib/firebase-service');
      const cfg = await loadConfig();
      const cfgMap = (cfg?.data?.config ?? {}) as Record<string, any>;
      const almacenOld: Record<string, number> = cfgMap.ALMACEN_JSON
        ? (typeof cfgMap.ALMACEN_JSON === 'string' ? JSON.parse(cfgMap.ALMACEN_JSON) : cfgMap.ALMACEN_JSON)
        : {};
      const { newAlmacen, comprasNecesarias } = applyModToAlmacen(almacenOld, diff);

      // 2. Compras necesarias → factura adicional (1₡ x precio canon estimado del item)
      // Compras quedan registradas en concepto del asiento. Coste base ya incluido en diff.costoDiff.
      const conceptoCompras = comprasNecesarias.length > 0
        ? ` · compras: ${comprasNecesarias.map(c => `${c.name}×${c.count}`).join(', ')}`
        : '';

      // 3. Libro mayor 1 asiento (gasto)
      await commitLibroEntryAndTreasury({
        id: genId('mod'),
        fecha: getCampaignDateISO(campYear, campMonth),
        concepto: `Modificación · ${it.chassis} ${it.model}${conceptoCompras}`,
        cantidad: diff.costoDiff,
        tipo: 'gasto',
        categoria: 'repuestos',
        nota: '',
        jugador: '',
      });

      // 4. Persiste almacén
      await saveConfigBatch({ ALMACEN_JSON: JSON.stringify(newAlmacen) });

      // 5. HangarItem: aplicar mod
      await saveHangarItem({
        ...it,
        sswRaw: rawNew,
        modificacionPendiente: {
          ...it.modificacionPendiente,
          status: 'applied',
        },
        updatedAt: new Date().toISOString(),
      });

      // 6. Pool tiempo: descuenta del mech-key = hangarId
      if (diff.timeMin > 0) consumeMechTime(`hangar_${it.id}`, diff.timeMin);

      void refresh();
    } catch (err) {
      console.error(err);
      alert('Error aplicando modificación. Revisa consola.');
    } finally {
      setApplying(null);
    }
  };

  return (
    <section className="mb-4 border-2 border-amber-500/50 bg-amber-950/10 p-3">
      <h3 className="font-headline text-xs font-bold text-amber-400 tracking-widest uppercase mb-2 flex items-center gap-2">
        <Wrench size={14} /> Modificaciones aprobadas ({aprobados.length})
        {loading && <Loader className="w-3 h-3 animate-spin" />}
      </h3>
      <div className="flex flex-col gap-2">
        {aprobados.map(it => (
          <ModRow key={it.id} it={it} applying={applying === it.id} onAplicar={() => handleAplicar(it)} />
        ))}
      </div>
    </section>
  );
}

function ModRow({ it, applying, onAplicar }: { it: HangarItem; applying: boolean; onAplicar: () => void }) {
  const mp = it.modificacionPendiente!;
  const diff: ModificationDiff | null = useMemo(() => {
    try {
      return diffSswLoadouts(it.sswRaw || '', mp.sswRawNew);
    } catch {
      return null;
    }
  }, [it.sswRaw, mp.sswRawNew]);

  if (!diff) {
    return (
      <div className="font-mono text-[10px] p-2 bg-surface border-l-2 border-error/60">
        <AlertTriangle className="inline w-3 h-3 mr-1 text-error" />
        {it.chassis} {it.model}: error parseando diff (SSW inválido).
      </div>
    );
  }

  return (
    <div className="font-mono text-[10px] p-2 bg-surface border-l-2 border-amber-500/60">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-on-surface text-[11px]">{it.chassis} {it.model}</div>
        <div className="flex items-center gap-2 text-[9px] text-secondary/70">
          <span>{diff.timeMin}min</span>
          <span>·</span>
          <span className="text-amber-400">{fmt(diff.costoDiff)}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <Col color="red" title={`Desmontar (${diff.removed.length})`} items={diff.removed.map(s => `${s.name} @${s.location}`)} />
        <Col color="green" title={`Instalar (${diff.added.length})`} items={diff.added.map(s => `${s.name} @${s.location}`)} />
        <Col color="cyan" title={`Mover (${diff.moved.length})`} items={diff.moved.map(m => `${m.name} ${m.from}→${m.to}`)} />
      </div>
      <button
        onClick={onAplicar}
        disabled={applying}
        className="flex items-center gap-1 px-2 py-1 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
      >
        {applying ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle2 size={12} />}
        Aplicar modificación
      </button>
    </div>
  );
}

function Col({ color, title, items }: { color: 'red' | 'green' | 'cyan'; title: string; items: string[] }) {
  const cls =
    color === 'red'   ? 'border-red-500/40 text-red-400'   :
    color === 'green' ? 'border-green-500/40 text-green-400' :
                        'border-cyan-500/40 text-cyan-400';
  return (
    <div className={`border-l-2 pl-2 ${cls}`}>
      <div className="text-[9px] uppercase tracking-widest mb-1">{title}</div>
      {items.length === 0
        ? <div className="text-[9px] text-secondary/40 italic">—</div>
        : items.map((s, i) => <div key={i} className="text-[9px] text-on-surface/80 truncate" title={s}>{s}</div>)
      }
    </div>
  );
}
