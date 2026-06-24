// ════════════════════════════════════════════════════════════════
//  CustomMechsTab — Diseños SSW privados per-user
//
//  Subtab Hangar /hangar?tab=disenos. CRUD designs personalizados
//  guardados en Firestore customMechs/{safeEmail}/items.
//  - Upload SSW + parse metadata + validar
//  - Enviar a otro usuario (mismo pattern fuerzas)
//  - Cargar al Hangar (crea HangarItem con sswRaw)
//  - Editar abre EditorPage
//  - Eliminar
//  - Admin: botón "Cargar a memoria general" → mensaje/instrucción
//    (necesita Solaris sync para hot-deploy real)
// ════════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Send, Trash2, Download, Edit3, Plus, AlertTriangle, Star, FolderOpen, Server,
} from 'lucide-react';
import {
  loadMyCustomMechs, saveMyCustomMech, deleteMyCustomMech,
  sendCustomMechToUser, customMechsLimitForRole, canSaveMoreCustomMechs,
  type CustomMechDesign,
} from '@/lib/custom-mechs-service';
import { saveHangarItem } from '@/lib/firebase-service';
import { newHangarItem } from '@/lib/hangar-types';
import { parseSSWBasic } from '@/lib/ssw-basic';
import { getPublicRoles, type PublicRoleEntry } from '@/lib/role-service';
import { EditorPage } from '@/pages/EditorPage';

export function CustomMechsTab() {
  const userRole = useAppStore(s => s.userRole);
  const navigate = useNavigate();

  const [designs, setDesigns] = useState<CustomMechDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PublicRoleEntry[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<CustomMechDesign | null>(null);

  const limit = customMechsLimitForRole(userRole);
  const limitLabel = limit === Infinity ? '∞' : String(limit);
  const canAddMore = canSaveMoreCustomMechs(designs.length, userRole);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await loadMyCustomMechs();
      setDesigns(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    getPublicRoles().then(setUsers).catch(() => setUsers([]));
  }, []);

  const handleDelete = async (d: CustomMechDesign) => {
    if (!confirm(`¿Eliminar "${d.name}"?`)) return;
    await deleteMyCustomMech(d.id);
    void refresh();
  };

  const handleLoadToHangar = async (d: CustomMechDesign) => {
    const item = newHangarItem({
      chassis:     d.chassis,
      model:       d.model,
      tons:        d.tons,
      precioBase:  0,
      fechaCompra: new Date().toISOString().slice(0, 10),
      bv:          d.bv,
      era:         d.era,
    });
    const itemWithSsw = { ...item, sswRaw: d.sswRaw };
    await saveHangarItem(itemWithSsw);
    alert(`"${d.name}" cargado en el Hangar (sin precio).`);
    navigate('/hangar?tab=unidades');
  };

  const handleSendToUser = async (d: CustomMechDesign, targetSafeEmail: string) => {
    if (!targetSafeEmail) return;
    try {
      await sendCustomMechToUser(targetSafeEmail, d);
      alert(`"${d.name}" enviado.`);
    } catch (e) {
      alert('Error envío: ' + String(e));
    }
  };

  const handleDownload = (d: CustomMechDesign) => {
    const blob = new Blob([d.sswRaw], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.chassis} ${d.model}.ssw`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleTroVisible = async (d: CustomMechDesign) => {
    if (userRole !== 'admin') return;
    await saveMyCustomMech({
      id: d.id,
      name: d.name,
      chassis: d.chassis,
      model: d.model,
      tons: d.tons,
      bv: d.bv,
      era: d.era,
      sswRaw: d.sswRaw,
      notes: d.notes,
      sentBy: d.sentBy,
      troVisible: !d.troVisible,
    });
    void refresh();
  };

  const handleLoadToGeneral = (d: CustomMechDesign) => {
    if (userRole !== 'admin') return;
    // No hay endpoint deploy hot, instruyo
    alert(
      `[ADMIN] Para añadir "${d.chassis} ${d.model}" al catálogo general:\n\n` +
      `1. Descarga el .ssw con el botón Descargar.\n` +
      `2. Cópialo a public/assets/mechs/\n` +
      `3. Ejecuta el script Solaris sync para regenerar el index.json\n` +
      `4. Push + deploy.`,
    );
  };

  if (editing) {
    return (
      <EditorPage
        initialSswXml={editing.sswRaw}
        mode="libre"
        strictTech={false}
        allowHangarSave={false}
        allowPersonalSave={true}
        onSave={async (newXml) => {
          const parsed = parseSSWBasic(newXml);
          await saveMyCustomMech({
            id:       editing.id,
            name:     editing.name,
            chassis:  parsed.chassis ?? editing.chassis,
            model:    parsed.model   ?? editing.model,
            tons:     parsed.tons ?? editing.tons,
            bv:       parsed.cost ?? editing.bv,
            era:      parsed.era ?? editing.era,
            sswRaw:   newXml,
            notes:    editing.notes,
          });
          setEditing(null);
          void refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <section className="bg-surface-container-low border-l-2 border-primary-container/30 p-3 clip-chamfer">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-headline text-xs font-bold text-primary-container tracking-widest uppercase flex items-center gap-2">
          <FolderOpen size={14} /> Diseños Personalizados ({designs.length}/{limitLabel})
        </h2>
        <button
          onClick={() => setUploadOpen(true)}
          disabled={!canAddMore}
          className="px-3 py-1.5 border border-primary-container text-primary-container bg-primary-container/10 hover:bg-primary-container/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-30"
          title={canAddMore ? 'Subir nuevo SSW' : `Límite ${limitLabel} alcanzado`}
        >
          <Plus size={12} /> Subir SSW
        </button>
      </div>

      {!canAddMore && (
        <div className="mb-3 p-2 border-l-2 border-amber-400 bg-amber-400/10 font-mono text-[10px] text-amber-400 flex items-center gap-2">
          <AlertTriangle size={12} /> Límite {limitLabel} alcanzado. Elimina o sustituye uno antes de subir más.
        </div>
      )}

      {loading ? (
        <p className="font-mono text-[10px] text-secondary/50 italic">Cargando…</p>
      ) : designs.length === 0 ? (
        <p className="font-mono text-[10px] text-secondary/50 italic">
          Sin diseños guardados. Pulsa "Subir SSW" para añadir.
        </p>
      ) : (
        <div className="space-y-2">
          {designs.map(d => (
            <DesignRow
              key={d.id}
              design={d}
              users={users}
              isAdmin={userRole === 'admin'}
              onDelete={() => handleDelete(d)}
              onEdit={() => setEditing(d)}
              onLoadHangar={() => handleLoadToHangar(d)}
              onDownload={() => handleDownload(d)}
              onSend={(target) => handleSendToUser(d, target)}
              onLoadGeneral={() => handleLoadToGeneral(d)}
              onToggleTroVisible={() => handleToggleTroVisible(d)}
            />
          ))}
        </div>
      )}

      {uploadOpen && (
        <UploadSswModal
          onClose={() => setUploadOpen(false)}
          onSaved={() => { setUploadOpen(false); void refresh(); }}
        />
      )}
    </section>
  );
}

// ─── Row ─────────────────────────────────────────────────────────

function DesignRow({ design, users, isAdmin, onDelete, onEdit, onLoadHangar, onDownload, onSend, onLoadGeneral, onToggleTroVisible }: {
  design: CustomMechDesign;
  users: PublicRoleEntry[];
  isAdmin: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onLoadHangar: () => void;
  onDownload: () => void;
  onSend: (target: string) => void;
  onLoadGeneral: () => void;
  onToggleTroVisible: () => void;
}) {
  const [sendTarget, setSendTarget] = useState('');
  return (
    <div className="p-3 bg-surface border border-outline-variant/30 clip-chamfer">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-mono text-sm text-cream font-bold flex items-center gap-2">
            {design.sentBy && (
              <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
            )}
            <span>{design.name}</span>
          </div>
          <div className="font-mono text-[9px] text-secondary/60 mt-0.5">
            {design.chassis} {design.model} · {design.tons}t
            {design.era && ` · ${design.era}`}
            {design.bv && ` · BV ${design.bv.toLocaleString('es-ES')}`}
            {design.sentBy && (
              <span className="text-amber-400 ml-2">· Recibido de {design.sentBy}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={onLoadHangar} className="px-2 py-1 border border-emerald-400/60 text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 font-mono text-[9px] uppercase tracking-widest" title="Crear HangarItem desde este diseño">
            → Hangar
          </button>
          <button onClick={onEdit} className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10" title="Editar (EditorPage)">
            <Edit3 size={12} />
          </button>
          <button onClick={onDownload} className="p-1.5 border border-outline-variant/40 text-secondary hover:bg-surface-container-high" title="Descargar .ssw">
            <Download size={12} />
          </button>
          <button onClick={onDelete} className="p-1.5 border border-error/40 text-error/80 hover:bg-error/10" title="Eliminar">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={sendTarget}
          onChange={e => setSendTarget(e.target.value)}
          className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-mono text-[9px] text-secondary"
        >
          <option value="">— Enviar a usuario —</option>
          {users.map(u => (
            <option key={u.safeEmail} value={u.safeEmail}>{u.alias || u.safeEmail} ({u.role})</option>
          ))}
        </select>
        <button
          onClick={() => { onSend(sendTarget); setSendTarget(''); }}
          disabled={!sendTarget}
          className="px-2 py-1 border border-primary/60 text-primary bg-primary/10 hover:bg-primary/20 font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 disabled:opacity-30"
        >
          <Send size={10} /> Enviar
        </button>
        {isAdmin && (
          <>
            <button
              onClick={onToggleTroVisible}
              className={`ml-auto px-2 py-1 border font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 ${
                design.troVisible
                  ? 'border-cyan-400/60 text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20'
                  : 'border-outline-variant/40 text-secondary hover:bg-surface-container-high'
              }`}
              title="Admin: marcar visible en catálogo TRO con badge 🛠 Custom"
            >
              {design.troVisible ? '🛠 TRO Visible' : 'Ocultar TRO'}
            </button>
            <button
              onClick={onLoadGeneral}
              className="px-2 py-1 border border-amber-400/60 text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 font-mono text-[9px] uppercase tracking-widest flex items-center gap-1"
              title="Solo admin: cargar al catálogo general del proyecto"
            >
              <Server size={10} /> A Memoria General
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Upload Modal ────────────────────────────────────────────────

function UploadSswModal({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [xml, setXml] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  const parsed = useMemo(() => {
    if (!xml) return null;
    try {
      return parseSSWBasic(xml);
    } catch (e) {
      console.warn('[upload] parse error', e);
      return null;
    }
  }, [xml]);

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const text = await f.text();
      const p = parseSSWBasic(text);
      if (!p.chassis || !p.tons) {
        setParseError('SSW inválido: falta chassis o tons');
        setXml('');
        return;
      }
      setXml(text);
      setName(`${p.chassis} ${p.model ?? ''}`.trim());
    } catch (e) {
      setParseError('No se pudo leer el archivo: ' + String(e));
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!xml || !parsed?.chassis || !parsed?.tons) return;
    setCommitting(true);
    try {
      await saveMyCustomMech({
        name:    name || `${parsed.chassis} ${parsed.model ?? ''}`.trim(),
        chassis: parsed.chassis,
        model:   parsed.model ?? '',
        tons:    parsed.tons,
        bv:      parsed.cost ?? undefined,
        era:     parsed.era ?? undefined,
        sswRaw:  xml,
        notes:   notes || undefined,
      });
      onSaved();
    } catch (e) {
      alert('Error guardando: ' + String(e));
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={() => !committing && onClose()}
    >
      <div
        className="bg-surface-container border-2 border-primary-container/60 clip-chamfer max-w-lg w-full p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-headline text-lg text-primary-container font-bold uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3">
          <Upload size={18} /> Subir Diseño SSW
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">Archivo .ssw</label>
            <input
              type="file" accept=".ssw,.xml,application/xml,text/xml"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1.5 font-mono text-[10px] text-cream file:mr-2 file:border-0 file:bg-primary/20 file:text-primary file:px-2 file:py-1"
            />
            {parsing && <div className="font-mono text-[9px] text-secondary/60 mt-1">Parseando…</div>}
            {parseError && <div className="font-mono text-[9px] text-error mt-1">{parseError}</div>}
          </div>

          {parsed && (
            <div className="p-2 bg-emerald-400/5 border border-emerald-400/30 font-mono text-[10px] space-y-0.5">
              <div className="text-emerald-400 uppercase tracking-widest text-[9px] mb-1">Detectado</div>
              <div className="text-cream">{parsed.chassis} {parsed.model}</div>
              <div className="text-secondary/60">
                {parsed.tons}t · {parsed.era || 'sin era'} · BV {parsed.cost?.toLocaleString('es-ES') || '?'}
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">Nombre</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre custom (ej: Crusader KKK Modificado)"
              className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1.5 font-mono text-sm text-cream"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-secondary/60 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Cambios, comentarios…"
              className="w-full bg-surface-container-high border border-outline-variant/40 px-2 py-1.5 font-mono text-[10px] text-cream resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-outline-variant/30">
          <button
            onClick={onClose}
            disabled={committing}
            className="flex-1 py-2 border border-outline-variant/40 text-secondary font-mono text-[11px] uppercase tracking-widest disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={committing || !xml || !!parseError || !parsed?.chassis || !parsed?.tons}
            className="flex-1 py-2 bg-primary-container/30 border border-primary-container text-primary-container hover:bg-primary-container/50 font-mono text-[11px] uppercase tracking-widest font-bold disabled:opacity-30"
          >
            {committing ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
