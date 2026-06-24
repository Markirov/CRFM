// ══════════════════════════════════════════════════════════════
//  ModificacionesTab.tsx — Modificaciones de loadout pendientes
//  Visible solo a DM/Admin. Listado de HangarItem con
//  modificacionPendiente.status !== 'applied'. Acciones:
//    - Aprobar  → status='approved' (Taller lo recoge en categoría 'Modificación')
//    - Rechazar → status='rejected' + comment (vuelve al PJ)
//  La aplicación final (sswRaw := sswRawNew) la hace Taller cuando
//  confirma la categoría 'Modificación'.
// ══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import { Check, X, Loader, AlertTriangle } from 'lucide-react';
import { loadHangar, saveHangarItem } from '@/lib/firebase-service';
import { usePerm } from '@/hooks/usePerm';
import type { HangarItem } from '@/lib/hangar-types';

export function ModificacionesTab() {
  const { writable, loading: permLoading } = usePerm('hangar');
  const [items, setItems] = useState<HangarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [comment, setComment] = useState('');

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

  const pendientes = useMemo(() => items.filter(it =>
    it.modificacionPendiente && it.modificacionPendiente.status === 'pending'
  ), [items]);

  const aprobadas = useMemo(() => items.filter(it =>
    it.modificacionPendiente && it.modificacionPendiente.status === 'approved'
  ), [items]);

  if (permLoading) return <div className="p-4 text-secondary/60 text-xs">Cargando…</div>;
  if (!writable) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">🔒</div>
        <div className="font-mono text-[11px] text-secondary/60">Solo DM/Admin pueden revisar modificaciones.</div>
      </div>
    );
  }

  const handleAprobar = async (it: HangarItem) => {
    if (!it.modificacionPendiente) return;
    await saveHangarItem({
      ...it,
      modificacionPendiente: {
        ...it.modificacionPendiente,
        status: 'approved',
        reviewedAt: Date.now(),
      },
    });
    void refresh();
  };

  const handleRechazar = async (it: HangarItem) => {
    if (!it.modificacionPendiente) return;
    await saveHangarItem({
      ...it,
      modificacionPendiente: {
        ...it.modificacionPendiente,
        status: 'rejected',
        reviewedAt: Date.now(),
        comment: comment.trim() || undefined,
      },
    });
    setRejecting(null);
    setComment('');
    void refresh();
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3 flex items-center gap-2">
        <AlertTriangle size={14} /> Modificaciones de loadout
        {loading && <Loader className="w-3 h-3 animate-spin" />}
      </h2>

      <Section title={`Pendientes (${pendientes.length})`} color="amber">
        {pendientes.length === 0 && <Empty>Sin solicitudes pendientes.</Empty>}
        {pendientes.map(it => (
          <Row
            key={it.id}
            it={it}
            isRejecting={rejecting === it.id}
            onAprobar={() => handleAprobar(it)}
            onRechazar={() => setRejecting(it.id)}
            onCancelarRechazo={() => { setRejecting(null); setComment(''); }}
            onConfirmarRechazo={() => handleRechazar(it)}
            comment={comment}
            setComment={setComment}
          />
        ))}
      </Section>

      <Section title={`Aprobadas en taller (${aprobadas.length})`} color="green">
        {aprobadas.length === 0 && <Empty>Sin modificaciones en taller.</Empty>}
        {aprobadas.map(it => (
          <div key={it.id} className="font-mono text-[10px] p-2 bg-surface border-l-2 border-green-500/50">
            <div className="font-bold text-on-surface">{it.chassis} {it.model}</div>
            <div className="text-secondary/60">Esperando Taller (categoría Modificación).</div>
          </div>
        ))}
      </Section>
    </section>
  );
}

function Section({ title, color, children }: { title: string; color: 'amber' | 'green'; children: React.ReactNode }) {
  const cls = color === 'amber' ? 'border-amber-500/40 text-amber-400' : 'border-green-500/40 text-green-400';
  return (
    <div className="mb-4">
      <div className={`font-mono text-[9px] uppercase tracking-widest border-l-2 pl-2 mb-2 ${cls}`}>{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10px] text-secondary/40 italic px-2 py-1">{children}</div>;
}

function Row({ it, isRejecting, onAprobar, onRechazar, onCancelarRechazo, onConfirmarRechazo, comment, setComment }: {
  it: HangarItem;
  isRejecting: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
  onCancelarRechazo: () => void;
  onConfirmarRechazo: () => void;
  comment: string;
  setComment: (s: string) => void;
}) {
  const mp = it.modificacionPendiente!;
  const fecha = new Date(mp.requestedAt).toLocaleDateString();
  return (
    <div className="font-mono text-[10px] p-2 bg-surface border-l-2 border-amber-500/50">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-on-surface">{it.chassis} {it.model}</div>
        <div className="text-secondary/60 text-[9px]">{fecha}{mp.requestedBy ? ` · ${mp.requestedBy}` : ''}</div>
      </div>
      {!isRejecting ? (
        <div className="flex gap-2 mt-2">
          <button onClick={onAprobar} className="flex items-center gap-1 px-2 py-1 border border-green-500/60 text-green-400 hover:bg-green-500/10">
            <Check size={12} /> Aprobar
          </button>
          <button onClick={onRechazar} className="flex items-center gap-1 px-2 py-1 border border-red-500/60 text-red-400 hover:bg-red-500/10">
            <X size={12} /> Rechazar
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Motivo (opcional, visible al PJ)"
            className="bg-surface-container border border-outline-variant/40 px-2 py-1 text-[10px] text-cream"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={onConfirmarRechazo} className="px-2 py-1 border border-red-500/60 text-red-400 hover:bg-red-500/10">
              Confirmar rechazo
            </button>
            <button onClick={onCancelarRechazo} className="px-2 py-1 border border-outline-variant/40 text-secondary/70 hover:bg-surface-container">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
