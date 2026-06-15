// ══════════════════════════════════════════════════════════════
//  MechAssignmentBar — Asigna un mech del hangar al piloto activo.
//  Dropdown con items del hangar. Si hay discrepancias (piloto ya
//  tenía otro mech / mech ya estaba asignado a otro piloto),
//  pregunta antes de aplicar.
//
//  Source of truth: collection hangar/ en Firestore.
// ══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { loadHangar, saveHangarItem } from '@/lib/firebase-service';
import type { HangarItem } from '@/lib/hangar-types';

export function MechAssignmentBar({ pilotIdx }: { pilotIdx: number }) {
  const { roster } = useAppStore();
  const pilotEntry = roster[pilotIdx];
  const pilotName = pilotEntry?.apodo || pilotEntry?.nombre || `Piloto ${pilotIdx + 1}`;

  const [items, setItems] = useState<HangarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await loadHangar();
      if (res.success && Array.isArray(res.data?.items)) {
        setItems(res.data.items as HangarItem[]);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [pilotIdx]);

  const current = items.find(it => it.pilotoIdx === pilotIdx) ?? null;

  const handleChange = async (newId: string) => {
    setErr(null);
    if (saving) return;

    const target = newId === '' ? null : items.find(it => it.id === newId) ?? null;

    // Caso 1: deseleccionar — desasignar mech actual
    if (!target) {
      if (!current) return;
      const ok = window.confirm(
        `Desasignar "${current.chassis} ${current.model}" de ${pilotName}?\n` +
        `Pasará a reserva (sin piloto).`
      );
      if (!ok) return;
      setSaving(true);
      try {
        await saveHangarItem({ ...current, pilotoIdx: undefined });
        await refresh();
      } catch (e: any) { setErr(e?.message ?? 'Error al guardar'); }
      finally { setSaving(false); }
      return;
    }

    // Caso 2: ya estaba asignado a este piloto — no-op
    if (target.id === current?.id) return;

    // Caso 3: target ya tenía otro piloto → preguntar
    if (target.pilotoIdx !== undefined && target.pilotoIdx !== pilotIdx) {
      const otroR = roster[target.pilotoIdx];
      const otroPiloto = otroR?.apodo || otroR?.nombre || `Piloto ${target.pilotoIdx + 1}`;
      const ok = window.confirm(
        `"${target.chassis} ${target.model}" ya está asignado a ${otroPiloto}.\n\n` +
        `Reasignar a ${pilotName}? ${otroPiloto} se quedará sin mech.`
      );
      if (!ok) return;
    }

    // Caso 4: este piloto ya tenía otro mech → preguntar qué hacer con el anterior
    if (current && current.id !== target.id) {
      const ok = window.confirm(
        `${pilotName} ya tenía "${current.chassis} ${current.model}".\n\n` +
        `Cambiar a "${target.chassis} ${target.model}"? El anterior pasará a reserva.`
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const ops: Promise<unknown>[] = [];
      // Libera mech anterior del piloto (si era distinto)
      if (current && current.id !== target.id) {
        ops.push(saveHangarItem({ ...current, pilotoIdx: undefined }));
      }
      // Asigna el target a este piloto (sobrescribe pilotoIdx anterior)
      ops.push(saveHangarItem({ ...target, pilotoIdx: pilotIdx }));
      await Promise.all(ops);
      await refresh();
    } catch (e: any) { setErr(e?.message ?? 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mb-3 bg-surface-container-low border-l-2 border-primary-container/30 p-2.5 flex items-center gap-3 clip-chamfer">
      <Wrench size={14} className="text-primary-container/70 shrink-0" />
      <label className="font-mono text-[9px] uppercase tracking-widest text-secondary/70 shrink-0">
        Mech asignado:
      </label>
      <select
        value={current?.id ?? ''}
        onChange={e => handleChange(e.target.value)}
        disabled={loading || saving}
        className="flex-1 bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[11px] text-on-surface disabled:opacity-50"
      >
        <option value="">— Sin mech (reserva) —</option>
        {items.map(it => {
          const taken = it.pilotoIdx !== undefined && it.pilotoIdx !== pilotIdx;
          const otroR = taken ? roster[it.pilotoIdx!] : null;
          const otroPiloto = taken ? (otroR?.apodo || otroR?.nombre || `P${it.pilotoIdx! + 1}`) : '';
          return (
            <option key={it.id} value={it.id}>
              {it.chassis} {it.model} · {it.tons}t{taken ? ` · ⚠ ${otroPiloto}` : ''}
            </option>
          );
        })}
      </select>
      {saving && <span className="font-mono text-[9px] text-secondary/60">Guardando…</span>}
      {err && <span className="font-mono text-[9px] text-error">{err}</span>}
    </div>
  );
}
