// src/components/shell/RolesPanel.tsx
// ═══════════════════════════════════════════════════════════════
//  Panel de gestión de roles + permisos editables por sección.
//  Solo visible/funcional para userRole === 'admin'.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Loader, RefreshCw, Save, X } from 'lucide-react';
import { getRoles, setRole, removeRole, type RoleEntry } from '@/lib/role-service';
import { loadPermissions, savePermissions, DEFAULT_PERMISSIONS, type SectionPerm, type PermLevel } from '@/lib/permissions-service';
import type { UserRole } from '@/lib/store';

const ROLE_LABELS: Record<NonNullable<UserRole>, string> = {
  admin: 'Admin',
  dm:    'Director',
  pj:    'Piloto (PJ)',
};

const ROLE_COLORS: Record<NonNullable<UserRole>, string> = {
  admin: 'text-red-400 border-red-400/40 bg-red-400/10',
  dm:    'text-amber-400 border-amber-400/40 bg-amber-400/10',
  pj:    'text-primary-container border-primary-container/40 bg-primary-container/10',
};

const PERM_CYCLE: PermLevel[] = ['write', 'read', 'none'];
const PERM_LABELS: Record<PermLevel, string> = { write: 'R+W', read: 'R', none: '–' };
const PERM_COLORS: Record<PermLevel, string> = {
  write: 'text-green-400 border-green-400/40 bg-green-400/10',
  read:  'text-amber-400 border-amber-400/40 bg-amber-400/10',
  none:  'text-outline border-outline-variant/20 bg-transparent',
};

function nextPerm(current: PermLevel): PermLevel {
  const idx = PERM_CYCLE.indexOf(current);
  return PERM_CYCLE[(idx + 1) % PERM_CYCLE.length];
}

export function RolesPanel() {
  // ── Usuarios ──
  const [roles, setRoles]           = useState<RoleEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newEmail, setNewEmail]     = useState('');
  const [newAlias, setNewAlias]     = useState('');
  const [newRole, setNewRole]       = useState<NonNullable<UserRole>>('pj');
  const [addBusy, setAddBusy]       = useState(false);
  const [addError, setAddError]     = useState<string | null>(null);

  // ── Permisos ──
  const [perms, setPerms]               = useState<SectionPerm[]>(DEFAULT_PERMISSIONS);
  const [permsLoading, setPermsLoading] = useState(true);
  const [permsSaving, setPermsSaving]   = useState(false);
  const [permsDirty, setPermsDirty]     = useState(false);
  const [permsError, setPermsError]     = useState<string | null>(null);

  const loadUsers = async () => {
    setUsersLoading(true); setUsersError(null);
    try { setRoles(await getRoles()); } catch (e: any) { setUsersError(e?.message ?? 'Error'); }
    setUsersLoading(false);
  };

  const loadPerms = async () => {
    setPermsLoading(true); setPermsError(null);
    try { setPerms(await loadPermissions()); } catch (e: any) { setPermsError(e?.message ?? 'Error'); }
    setPermsLoading(false); setPermsDirty(false);
  };

  useEffect(() => { loadUsers(); loadPerms(); }, []);

  const handleChangeRole = async (entry: RoleEntry, role: NonNullable<UserRole>) => {
    setSaving(entry.email); setUsersError(null);
    try {
      await setRole(entry.email, role, entry.uid, entry.alias);
      setRoles(prev => prev.map(r => r.uid === entry.uid ? { ...r, role } : r));
    } catch (e: any) { setUsersError(e?.message ?? 'Error'); }
    setSaving(null);
  };

  const handleChangeAlias = async (entry: RoleEntry) => {
    const alias = prompt(`Alias para ${entry.email}:`, entry.alias || '');
    if (alias === null || alias === entry.alias) return;
    setSaving(entry.email); setUsersError(null);
    try {
      await setRole(entry.email, entry.role, entry.uid, alias);
      setRoles(prev => prev.map(r => r.uid === entry.uid ? { ...r, alias } : r));
    } catch (e: any) { setUsersError(e?.message ?? 'Error actualizando alias'); }
    setSaving(null);
  };

  const handleDelete = async (entry: RoleEntry) => {
    if (!confirm(`¿Eliminar a ${entry.email}?`)) return;
    setSaving(entry.email); setUsersError(null);
    try {
      // entry.uid = doc.id real → borra el doc correcto aunque no coincida con emailKey
      await removeRole(entry.email, entry.uid);
      setRoles(prev => prev.filter(r => r.uid !== entry.uid));
    } catch (e: any) { setUsersError(e?.message ?? 'Error'); }
    setSaving(null);
  };

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAddBusy(true); setAddError(null);
    try {
      // Si ya existe entry con este email (con docId legacy distinto al emailKey),
      // reutiliza su docId para no crear duplicado.
      const existing = roles.find(r => r.email?.toLowerCase() === email);
      await setRole(email, newRole, existing?.uid, newAlias);
      setNewEmail('');
      setNewAlias('');
      await loadUsers();
    }
    catch (e: any) { setAddError(e?.message ?? 'Error'); }
    setAddBusy(false);
  };

  const handleTogglePerm = (sectionId: string, roleKey: 'dm' | 'pj') => {
    setPerms(prev => prev.map(p =>
      p.id === sectionId ? { ...p, [roleKey]: nextPerm(p[roleKey]) } : p
    ));
    setPermsDirty(true);
  };

  const handleSavePerms = async () => {
    setPermsSaving(true); setPermsError(null);
    try { await savePermissions(perms); setPermsDirty(false); }
    catch (e: any) { setPermsError(e?.message ?? 'Error guardando'); }
    setPermsSaving(false);
  };

  return (
    <div className="space-y-4">

      {/* ══ PERMISOS ═══════════════════════════════════════════ */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[10px] font-bold text-outline uppercase tracking-[2px]">Permisos por sección</div>
          <div className="flex gap-2">
            <button onClick={() => { setPerms(DEFAULT_PERMISSIONS); setPermsDirty(true); }}
              className="font-mono text-[9px] text-outline hover:text-on-surface uppercase tracking-wider underline">
              Reset
            </button>
            <button onClick={handleSavePerms} disabled={!permsDirty || permsSaving}
              className={`flex items-center gap-1 px-2 h-6 font-mono text-[9px] uppercase tracking-wider border transition-all disabled:opacity-40 ${
                permsDirty ? 'border-green-400 text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'border-outline-variant/20 text-outline'
              }`}>
              {permsSaving ? <Loader size={9} className="animate-spin" /> : <Save size={9} />}
              {permsDirty ? 'Guardar' : 'Guardado'}
            </button>
          </div>
        </div>

        {permsError && <div className="font-mono text-[9px] text-error border border-error/30 bg-error/10 px-2 py-1.5 mb-2">{permsError}</div>}

        {permsLoading ? (
          <div className="flex items-center gap-2 font-mono text-[9px] text-outline py-3">
            <Loader size={11} className="animate-spin" /> Cargando…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_72px_72px_72px] gap-1 mb-1">
              <div className="font-mono text-[9px] text-outline uppercase tracking-wider">Sección</div>
              <div className="font-mono text-[9px] text-red-400 uppercase tracking-wider text-center">Admin</div>
              <div className="font-mono text-[9px] text-amber-400 uppercase tracking-wider text-center">DM</div>
              <div className="font-mono text-[9px] text-primary-container uppercase tracking-wider text-center">PJ</div>
            </div>
            {perms.map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_72px_72px_72px] gap-1 py-0.5 border-b border-outline-variant/10 last:border-0 items-center">
                <span className="font-mono text-[9px] text-on-surface-variant">{p.label}</span>
                {/* Admin siempre write */}
                <div className="flex justify-center">
                  <span className={`px-2 h-5 font-mono text-[8px] uppercase border flex items-center justify-center ${PERM_COLORS['write']}`}>
                    {PERM_LABELS['write']}
                  </span>
                </div>
                {/* DM editable */}
                <div className="flex justify-center">
                  <button onClick={() => handleTogglePerm(p.id, 'dm')}
                    className={`px-2 h-5 font-mono text-[8px] uppercase border transition-all hover:opacity-80 ${PERM_COLORS[p.dm]}`}>
                    {PERM_LABELS[p.dm]}
                  </button>
                </div>
                {/* PJ editable */}
                <div className="flex justify-center">
                  <button onClick={() => handleTogglePerm(p.id, 'pj')}
                    className={`px-2 h-5 font-mono text-[8px] uppercase border transition-all hover:opacity-80 ${PERM_COLORS[p.pj]}`}>
                    {PERM_LABELS[p.pj]}
                  </button>
                </div>
              </div>
            ))}
            <div className="font-mono text-[8px] text-outline mt-2">Clic en celda DM/PJ para ciclar: R+W → R → – · Admin siempre R+W</div>
          </>
        )}
      </div>

      {/* ══ USUARIOS ═══════════════════════════════════════════ */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[10px] font-bold text-outline uppercase tracking-[2px]">Usuarios y roles</div>
          <button onClick={loadUsers} className="text-outline hover:text-primary-container transition-colors" title="Recargar">
            <RefreshCw size={12} />
          </button>
        </div>
        {usersError && <div className="font-mono text-[9px] text-error border border-error/30 bg-error/10 px-2 py-1.5 mb-2">{usersError}</div>}
        {usersLoading ? (
          <div className="flex items-center gap-2 font-mono text-[9px] text-outline py-3"><Loader size={11} className="animate-spin" /> Cargando…</div>
        ) : roles.length === 0 ? (
          <div className="font-mono text-[9px] text-outline py-3">No hay usuarios con rol asignado.</div>
        ) : (
          <div className="space-y-1.5">
            {roles.map(entry => (
              <div key={entry.uid} className="flex items-center gap-3 py-1.5 border-b border-outline-variant/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-on-surface truncate flex items-center gap-2">
                    {entry.email}
                    <button disabled={saving === entry.email} onClick={() => handleChangeAlias(entry)}
                      className="text-primary hover:underline text-[9px] uppercase opacity-70 hover:opacity-100 transition-opacity">
                      [Alias: {entry.alias || 'Ninguno'}]
                    </button>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(['admin', 'dm', 'pj'] as const).map(r => (
                    <button key={r} disabled={saving === entry.email} onClick={() => handleChangeRole(entry, r)}
                      className={`px-2 h-6 font-mono text-[9px] uppercase tracking-wider border transition-all disabled:opacity-40 ${
                        entry.role === r ? ROLE_COLORS[r] : 'text-outline border-outline-variant/20 bg-transparent hover:border-outline-variant'
                      }`}>
                      {saving === entry.email && entry.role !== r ? <Loader size={9} className="animate-spin inline" /> : ROLE_LABELS[r]}
                    </button>
                  ))}
                  <button disabled={saving === entry.email} onClick={() => handleDelete(entry)}
                    className="h-6 w-6 flex items-center justify-center text-outline hover:text-error border border-outline-variant/20 hover:border-error/40 transition-all disabled:opacity-40"
                    title="Eliminar usuario">
                    <X size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ AÑADIR USUARIO ════════════════════════════════════ */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 p-3">
        <div className="font-mono text-[10px] font-bold text-outline uppercase tracking-[2px] mb-2">Añadir / actualizar usuario</div>
        <div className="flex gap-2">
          <input type="email" placeholder="email@ejemplo.com" value={newEmail}
            onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 h-8 bg-background border border-outline-variant/25 px-2 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-container" />
          <input type="text" placeholder="Alias (Opcional)" value={newAlias}
            onChange={e => setNewAlias(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-28 h-8 bg-background border border-outline-variant/25 px-2 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-container" />
          <select value={newRole} onChange={e => setNewRole(e.target.value as NonNullable<UserRole>)}
            className="h-8 bg-background border border-outline-variant/25 px-2 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-container appearance-none cursor-pointer">
            <option value="pj">PJ</option>
            <option value="dm">DM</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAdd} disabled={addBusy || !newEmail.trim()}
            className="h-8 px-3 bg-primary-container/10 border border-primary-container text-primary-container font-mono text-[10px] uppercase tracking-widest hover:bg-primary-container/20 disabled:opacity-40 transition-all">
            {addBusy ? <Loader size={11} className="animate-spin" /> : 'Asignar'}
          </button>
        </div>
        {addError && <div className="font-mono text-[9px] text-error mt-1.5">{addError}</div>}
        <div className="font-mono text-[8px] text-outline mt-1.5">El usuario debe cerrar sesión y volver a entrar para que el rol se active.</div>
      </div>

    </div>
  );
}
