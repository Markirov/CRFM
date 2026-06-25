// ══════════════════════════════════════════════════════════════
//  RecruitmentRequestsTab — Solicitudes de nuevo PJ (Admin/DM)
//
//  Flujo:
//   1. PJ envía draft → recruitmentPending status='pending'.
//   2. Admin aprueba → elige PNJ a sustituir → vuelca personaje:
//       · personajes/{pnjJugador} reemplazado totalmente por nuevo PJ.
//       · PNJ anterior pasa a estado 'reserva' (otro doc espejo `pnj_<jugador>_reserva`).
//       · request status='applied'.
//   3. Admin puede rechazar con motivo → status='rejected'.
//   4. Admin puede revertir un PJ aplicado → PJ pasa a 'reserva',
//       PNJ original se restaura desde su espejo.
// ══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { Check, X, RotateCcw, Loader, UserPlus, AlertCircle } from 'lucide-react';
import { usePerm } from '@/hooks/usePerm';
import {
  loadAllRequests, approveRecruitmentRequest, rejectRecruitmentRequest,
  markRequestApplied, type RecruitmentRequest,
} from '@/lib/recruitment-requests-service';
import { loadRoster, type RosterEntry } from '@/lib/roster';
import { savePlayer, loadPlayer, loadReservas, deletePlayer } from '@/lib/firebase-service';
import { Archive, ArrowUp } from 'lucide-react';
import { draftToPersonaje } from '@/lib/recruitment/draft-to-personaje';
import { pnjCandidatesForReplacement } from '@/lib/recruitment/pj-pnj-helpers';

export function RecruitmentRequestsTab() {
  const { writable, loading: permLoading } = usePerm('rrhh');
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [reservas, setReservas] = useState<Array<Record<string, any> & { id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [replaceJugador, setReplaceJugador] = useState<string>('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [reqs, r, res] = await Promise.all([loadAllRequests(), loadRoster(), loadReservas()]);
      setRequests(reqs);
      setRoster(r);
      const lst = (res?.success && Array.isArray(res?.data?.reservas)) ? res.data.reservas : [];
      setReservas(lst);
    } finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);

  const pendientes = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const aprobadas  = useMemo(() => requests.filter(r => r.status === 'approved'), [requests]);
  const rechazadas = useMemo(() => requests.filter(r => r.status === 'rejected'), [requests]);
  const aplicadas  = useMemo(() => requests.filter(r => r.status === 'applied'), [requests]);

  // Solo PNJs (heurística pnj:true OR legacy fallback) excluyendo reserva/baja.
  const npcCandidates = useMemo(() => pnjCandidatesForReplacement(roster), [roster]);

  if (permLoading) return <div className="p-4 text-secondary/60 text-xs">Cargando…</div>;
  if (!writable) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">🔒</div>
        <div className="font-mono text-[11px] text-secondary/60">Solo Admin/DM.</div>
      </div>
    );
  }

  const handleApprove = async (req: RecruitmentRequest) => {
    if (!replaceJugador) { alert('Elige primero a qué PNJ sustituye.'); return; }
    if (!confirm(`Sustituir PNJ "${replaceJugador}" por nuevo PJ "${req.createdByPlayer}"?\n\nEl PNJ pasará a reserva.`)) return;
    try {
      // 1. Aprobamos
      await approveRecruitmentRequest(req, replaceJugador);

      // 2. Backup del PNJ a 'reserva' — guardamos copia con estado='reserva' y nuevo doc id <jugador>_reserva
      const prevRes = await loadPlayer(replaceJugador);
      const prev: any = (prevRes as any)?.personajes?.[0];
      if (prev) {
        const reservaId = `${replaceJugador}__reserva_${Date.now().toString(36)}`;
        await savePlayer({
          ...prev,
          jugador: reservaId,
          estado: 'reserva',
          pnj: true,
          replacedByRequestId: req.id,
          replacedByPlayer:    req.createdByPlayer,
          archivedAt:          new Date().toISOString(),
        });
      }

      // 3. Volcamos draft → personajes/{replaceJugador} (sobreescribe doc)
      const personaje = draftToPersonaje(req.draft, replaceJugador, req.id);
      await savePlayer(personaje as unknown as Record<string, unknown>);

      // 4. Marca request aplicada
      await markRequestApplied({ ...req, replacesJugador: replaceJugador });

      setApproving(null);
      setReplaceJugador('');
      void refresh();
      alert('Sustitución aplicada.');
    } catch (e) {
      console.error(e);
      alert('Error aplicando sustitución: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleReject = async (req: RecruitmentRequest) => {
    if (!comment.trim()) { if (!confirm('¿Rechazar sin motivo?')) return; }
    await rejectRecruitmentRequest(req, comment.trim());
    setRejecting(null);
    setComment('');
    void refresh();
  };

  const handleRestoreReserva = async (reserva: Record<string, any> & { id: string }) => {
    // Doc id ej: "Zhao__reserva_xyz" o "Zhao__pj_reserva_xyz"
    const m = reserva.id.match(/^(.+?)__(?:reserva|pj_reserva)_/);
    const slotOriginal = m ? m[1] : (reserva.jugador as string);
    if (!slotOriginal) { alert('No se puede inferir el slot original.'); return; }
    if (!confirm(`Restaurar "${reserva.nombre ?? slotOriginal}" al slot "${slotOriginal}"?\n\nSi hay alguien ocupando ese slot, será archivado a su propia reserva.`)) return;

    try {
      // 1. Si slot ocupado → archivar ocupante actual
      const cur = await loadPlayer(slotOriginal);
      const curData: any = (cur as any)?.personajes?.[0];
      const exists = curData && Object.keys(curData).length > 1;
      if (exists) {
        const isPj = curData.pnj === false;
        const archiveId = `${slotOriginal}__${isPj ? 'pj_reserva' : 'reserva'}_${Date.now().toString(36)}`;
        await savePlayer({
          ...curData,
          jugador:    archiveId,
          estado:     'reserva',
          archivedAt: new Date().toISOString(),
        });
      }

      // 2. Restaurar reserva → slot original (estado activo)
      const restored: Record<string, any> = {
        ...reserva,
        jugador:    slotOriginal,
        estado:     'activo',
      };
      delete restored.id;
      delete restored.archivedAt;
      delete restored.replacedByRequestId;
      delete restored.replacedByPlayer;
      delete restored.revertedFromRequestId;
      await savePlayer(restored);

      // 3. Borra el doc espejo
      await deletePlayer(reserva.id);

      void refresh();
      alert('Restaurado.');
    } catch (e) {
      console.error(e);
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDeleteReserva = async (reserva: Record<string, any> & { id: string }) => {
    if (!confirm(`BORRAR definitivamente la reserva "${reserva.nombre ?? reserva.id}"? No se puede deshacer.`)) return;
    try {
      await deletePlayer(reserva.id);
      void refresh();
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleRevert = async (req: RecruitmentRequest) => {
    if (!req.replacesJugador) return;
    if (!confirm(`Revertir? El PJ "${req.createdByPlayer}" pasará a reserva. ¿Restaurar PNJ original "${req.replacesJugador}"?`)) return;
    try {
      // 1. El PJ actual en doc {replacesJugador} → archivar a reserva
      const cur = await loadPlayer(req.replacesJugador);
      const curData: any = (cur as any)?.personajes?.[0];
      if (curData) {
        const reservaId = `${req.replacesJugador}__pj_reserva_${Date.now().toString(36)}`;
        await savePlayer({
          ...curData,
          jugador: reservaId,
          estado:  'reserva',
          pnj:     false,
          archivedAt: new Date().toISOString(),
          revertedFromRequestId: req.id,
        });
      }
      // 2. (Manual) Admin debe restaurar PNJ desde el doc *_reserva creado al sustituir.
      //    Aquí sólo marcamos el request como 'rejected' con comentario para historial.
      await rejectRecruitmentRequest({ ...req, status: 'applied' }, 'Revertido: PJ pasó a reserva.');
      void refresh();
      alert('PJ archivado en reserva. Restaura el PNJ desde su doc espejo manualmente si procede.');
    } catch (e) {
      console.error(e);
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3 flex items-center gap-2">
        <UserPlus size={14} /> Solicitudes de Reclutamiento
        {loading && <Loader className="w-3 h-3 animate-spin" />}
      </h2>

      <Section title={`Pendientes (${pendientes.length})`} color="amber">
        {pendientes.length === 0 && <Empty>Sin solicitudes pendientes.</Empty>}
        {pendientes.map(req => (
          <RequestCard
            key={req.id}
            req={req}
            isApproving={approving === req.id}
            isRejecting={rejecting === req.id}
            replaceJugador={replaceJugador}
            setReplaceJugador={setReplaceJugador}
            npcCandidates={npcCandidates}
            comment={comment}
            setComment={setComment}
            onApproveStart={() => { setApproving(req.id); setRejecting(null); }}
            onApproveConfirm={() => handleApprove(req)}
            onRejectStart={() => { setRejecting(req.id); setApproving(null); }}
            onRejectConfirm={() => handleReject(req)}
            onCancel={() => { setApproving(null); setRejecting(null); setComment(''); setReplaceJugador(''); }}
          />
        ))}
      </Section>

      {aprobadas.length > 0 && (
        <Section title={`Aprobadas sin aplicar (${aprobadas.length})`} color="cyan">
          {aprobadas.map(req => (
            <div key={req.id} className="font-mono text-[10px] p-2 bg-surface border-l-2 border-cyan-500/50">
              <span className="font-bold text-on-surface">{req.draft.identity.name}</span> → {req.replacesJugador}
            </div>
          ))}
        </Section>
      )}

      {aplicadas.length > 0 && (
        <Section title={`Aplicadas (${aplicadas.length})`} color="green">
          {aplicadas.map(req => (
            <div key={req.id} className="flex items-center justify-between font-mono text-[10px] p-2 bg-surface border-l-2 border-green-500/50">
              <span>
                <span className="font-bold text-on-surface">{req.draft.identity.name}</span> ocupa slot <span className="text-amber-400">{req.replacesJugador}</span>
              </span>
              <button
                onClick={() => handleRevert(req)}
                className="px-2 py-0.5 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                title="PJ → reserva. Admin debe restaurar PNJ original manualmente desde su doc espejo."
              >
                <RotateCcw size={10} /> Revertir
              </button>
            </div>
          ))}
        </Section>
      )}

      {rechazadas.length > 0 && (
        <Section title={`Rechazadas (${rechazadas.length})`} color="red">
          {rechazadas.map(req => (
            <div key={req.id} className="font-mono text-[10px] p-2 bg-surface border-l-2 border-red-500/50">
              <span className="font-bold text-on-surface">{req.draft.identity.name}</span>
              {req.comment && <div className="text-secondary/60 text-[9px]">{req.comment}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* ── Reservas (espejos PJ archivado o PNJ desplazado) ── */}
      <div className="mt-6 pt-4 border-t border-outline-variant/30">
        <h3 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase mb-3 flex items-center gap-2">
          <Archive size={14} /> Reservas ({reservas.length})
        </h3>
        {reservas.length === 0
          ? <Empty>Sin archivados.</Empty>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {reservas.map(r => {
                const isPj = r.pnj === false;
                const slotInfer = r.id.match(/^(.+?)__/)?.[1] ?? r.jugador;
                return (
                  <div key={r.id} className={`font-mono text-[10px] p-2 bg-surface border-l-2 ${isPj ? 'border-cyan-500/50' : 'border-amber-500/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-bold text-on-surface">{r.nombre ?? slotInfer}</span>
                        <span className="text-secondary/60"> · slot original: <b>{slotInfer}</b></span>
                      </div>
                      <span className={`text-[9px] px-1 ${isPj ? 'text-cyan-400 border border-cyan-500/40' : 'text-amber-400 border border-amber-500/40'}`}>
                        {isPj ? 'PJ' : 'PNJ'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRestoreReserva(r)}
                        className="flex items-center gap-1 px-2 py-0.5 border border-green-500/60 text-green-400 hover:bg-green-500/10 text-[9px]"
                      >
                        <ArrowUp size={10} /> Restaurar al slot
                      </button>
                      <button
                        onClick={() => handleDeleteReserva(r)}
                        className="flex items-center gap-1 px-2 py-0.5 border border-red-500/60 text-red-400 hover:bg-red-500/10 text-[9px]"
                      >
                        <X size={10} /> Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </section>
  );
}

function Section({ title, color, children }: { title: string; color: 'amber' | 'green' | 'red' | 'cyan'; children: React.ReactNode }) {
  const cls =
    color === 'amber' ? 'border-amber-500/40 text-amber-400' :
    color === 'green' ? 'border-green-500/40 text-green-400' :
    color === 'red'   ? 'border-red-500/40 text-red-400'     :
                        'border-cyan-500/40 text-cyan-400';
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

function RequestCard({
  req, isApproving, isRejecting, replaceJugador, setReplaceJugador, npcCandidates,
  comment, setComment, onApproveStart, onApproveConfirm, onRejectStart, onRejectConfirm, onCancel,
}: {
  req: RecruitmentRequest;
  isApproving: boolean;
  isRejecting: boolean;
  replaceJugador: string;
  setReplaceJugador: (s: string) => void;
  npcCandidates: RosterEntry[];
  comment: string;
  setComment: (s: string) => void;
  onApproveStart: () => void;
  onApproveConfirm: () => void;
  onRejectStart: () => void;
  onRejectConfirm: () => void;
  onCancel: () => void;
}) {
  const fecha = new Date(req.createdAt).toLocaleString();
  const d = req.draft;
  return (
    <div className="font-mono text-[10px] p-2 bg-surface border-l-2 border-amber-500/50">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="font-bold text-on-surface text-[11px]">{d.identity.name}</span>
          <span className="text-secondary/60"> · jugador: {d.identity.playerName} · {d.campaign.id}</span>
        </div>
        <div className="text-secondary/60 text-[9px]">{fecha}</div>
      </div>
      <div className="grid grid-cols-4 gap-1 text-[9px] text-on-surface/80 mb-2">
        <span>FUE {d.attributes.FUE ?? '?'}</span>
        <span>DES {d.attributes.DES ?? '?'}</span>
        <span>INT {d.attributes.INT ?? '?'}</span>
        <span>CAR {d.attributes.CAR ?? '?'}</span>
      </div>
      <div className="text-[9px] text-secondary/70 mb-2">
        Mech: <span className="text-amber-400">{d.assignedMech.model ?? '—'} ({d.assignedMech.tons ?? '?'}t)</span>
      </div>

      {!isApproving && !isRejecting && (
        <div className="flex gap-2">
          <button onClick={onApproveStart} className="flex items-center gap-1 px-2 py-1 border border-green-500/60 text-green-400 hover:bg-green-500/10">
            <Check size={12} /> Aprobar y sustituir
          </button>
          <button onClick={onRejectStart} className="flex items-center gap-1 px-2 py-1 border border-red-500/60 text-red-400 hover:bg-red-500/10">
            <X size={12} /> Rechazar
          </button>
        </div>
      )}

      {isApproving && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest text-secondary/70">Sustituir a PNJ (slot)</span>
            <select
              value={replaceJugador}
              onChange={e => setReplaceJugador(e.target.value)}
              className="bg-surface-container border border-outline-variant/40 px-2 py-1 text-[10px] text-cream"
            >
              <option value="">-- Elige --</option>
              {npcCandidates.map(c => (
                <option key={c.jugador} value={c.jugador}>{c.jugador} — {c.nombre} ({c.apodo || '—'}) · {c.estado}</option>
              ))}
            </select>
          </label>
          <div className="flex items-start gap-2 text-amber-400/80 text-[9px]">
            <AlertCircle size={11} className="mt-0.5" />
            <span>El PNJ se archivará en un doc espejo con estado='reserva'. El nuevo PJ ocupará el slot {replaceJugador || '—'}.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onApproveConfirm} disabled={!replaceJugador} className="px-2 py-1 border border-green-500/60 text-green-400 hover:bg-green-500/10 disabled:opacity-40">
              Confirmar
            </button>
            <button onClick={onCancel} className="px-2 py-1 border border-outline-variant/40 text-secondary/70 hover:bg-surface-container">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isRejecting && (
        <div className="flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Motivo (opcional)"
            rows={2}
            className="bg-surface-container border border-outline-variant/40 px-2 py-1 text-[10px] text-cream"
          />
          <div className="flex gap-2">
            <button onClick={onRejectConfirm} className="px-2 py-1 border border-red-500/60 text-red-400 hover:bg-red-500/10">
              Confirmar rechazo
            </button>
            <button onClick={onCancel} className="px-2 py-1 border border-outline-variant/40 text-secondary/70 hover:bg-surface-container">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
