import { useState, useEffect } from 'react';
import {
  X, Save, Loader, LogOut,
  CalendarDays, Coins, Users, Sparkles, Bell, Crosshair, Palette, ShieldCheck,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import { useAppStore } from '@/lib/store';
import { loadConfig, saveConfigBatch, savePilot } from '@/lib/firebase-service';
import { formatCzar, parseCurrencyValue } from '@/lib/currency-utils';
import { isActivo } from '@/lib/roster';
import {
  getTelegramEnabled, setTelegramEnabled,
  getUmbralTesoreria, setUmbralTesoreria,
  getUmbralLibroMayor, setUmbralLibroMayor,
} from '@/lib/telegram-service';
import { RolesPanel } from './RolesPanel';

// ─── Constants ───────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] as const;
const YEARS = Array.from({ length: 100 }, (_, i) => 3000 + i);

const COMBAT_DEFAULTS = {
  rangeShort: 0, rangeMedium: 2, rangeLong: 4,
  movStand: 0, movWalk: 1, movRun: 2, movJump: 3,
  movTargetStand: 0, movTargetWalk: 1, movTargetRun: 2, movTargetJump: 3,
};

type TabKey = 'campana' | 'tesoreria' | 'pilotos' | 'prompts' | 'telegram' | 'combate' | 'diseno' | 'roles';

interface TabDef { key: TabKey; label: string; icon: typeof CalendarDays }

const TABS: TabDef[] = [
  { key: 'campana',   label: 'Campaña',    icon: CalendarDays },
  { key: 'tesoreria', label: 'Tesorería',  icon: Coins },
  { key: 'pilotos',   label: 'Pilotos XP', icon: Users },
  { key: 'prompts',   label: 'Prompts IA', icon: Sparkles },
  { key: 'telegram',  label: 'Telegram',   icon: Bell },
  { key: 'combate',   label: 'Combate',    icon: Crosshair },
  { key: 'diseno',    label: 'Diseño',     icon: Palette },
  { key: 'roles',     label: 'Roles',      icon: ShieldCheck },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { open: boolean; onClose: () => void }

export function SecretMenu({ open, onClose }: Props) {
  const { setCampaign, useLegacyDesigns, setUseLegacyDesigns, userRole, roster } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>('campana');

  // XP editor por piloto
  const [pilotXP, setPilotXP] = useState<Record<string, { xpTotal: number; xpDisponible: number }>>({});
  const [pilotXPDirty, setPilotXPDirty] = useState<Set<string>>(new Set());

  // Form state
  const [month, setMonth]       = useState(1);
  const [year, setYear]         = useState(3028);
  const [company, setCompany]   = useState('');
  const [system, setSystem]     = useState('');
  const [faction, setFaction]   = useState('');
  const [treasury, setTreasury] = useState(0);
  const [combat, setCombat]     = useState(COMBAT_DEFAULTS);

  // Prompts IA
  const [promptInstr, setPromptInstr] = useState('');
  const [promptTono, setPromptTono]   = useState('');
  const [promptCron, setPromptCron]   = useState('');
  const [promptParte, setPromptParte] = useState('');

  // Telegram
  const [tgEnabled, setTgEnabled]       = useState(true);
  const [umbralTes, setUmbralTes]       = useState(100_000);
  const [umbralLib, setUmbralLib]       = useState(10_000);

  useEffect(() => {
    if (open && userRole === 'admin') loadData();
  }, [open, userRole]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await loadConfig();
      const cfg: Record<string, any> = (res.success ? (res.data?.config ?? res.data ?? {}) : {}) as Record<string, any>;

      setYear(parseInt(cfg['AÑO_CAMPANA']) || 3028);
      setMonth(parseInt(cfg['MES_CAMPANA']) || 1);
      setCompany(cfg['COMPANIA_NOMBRE'] || '');
      setSystem(cfg['SISTEMA_ACTUAL'] || '');
      setFaction(cfg['FACCION_ACTUAL'] || '');
      setTreasury(parseCurrencyValue(cfg['CONTRATO_VALOR']) ?? 0);

      setPromptInstr(cfg['PROMPT_INSTRUCCIONES'] || '');
      setPromptTono(cfg['PROMPT_TONO'] || '');
      setPromptCron(cfg['PROMPT_CRONICAS'] || '');
      setPromptParte(cfg['PROMPT_PARTE'] || '');

      let cc = COMBAT_DEFAULTS;
      try { cc = { ...COMBAT_DEFAULTS, ...JSON.parse(localStorage.getItem('combatConfig') || '{}') }; } catch {}
      setCombat(cc);

      // Telegram (localStorage)
      setTgEnabled(getTelegramEnabled());
      setUmbralTes(getUmbralTesoreria());
      setUmbralLib(getUmbralLibroMayor());

      // Init pilotXP desde roster activo
      const xpMap: Record<string, { xpTotal: number; xpDisponible: number }> = {};
      for (const r of roster) {
        if (!r.jugador || !isActivo(r)) continue;
        xpMap[r.jugador] = { xpTotal: r.xpTotal || 0, xpDisponible: r.xpDisponible || 0 };
      }
      setPilotXP(xpMap);
      setPilotXPDirty(new Set());
    } catch {}
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);

    const tesoreriaStr = formatCzar(treasury).replace(' ₡', '');
    const config: Record<string, string> = {
      'AÑO_CAMPANA':          String(year),
      'MES_CAMPANA':          String(month),
      'COMPANIA_NOMBRE':      company,
      'SISTEMA_ACTUAL':       system,
      'FACCION_ACTUAL':       faction,
      'PROMPT_INSTRUCCIONES': promptInstr,
      'PROMPT_TONO':          promptTono,
      'PROMPT_CRONICAS':      promptCron,
      'PROMPT_PARTE':         promptParte,
      'CONTRATO_VALOR':       tesoreriaStr,
    };
    try { await saveConfigBatch(config); } catch {}

    setCampaign({
      campaignYear:  year,
      campaignMonth: month,
      unitName:      company || undefined,
      contratoValor: tesoreriaStr,
    });

    localStorage.setItem('combatConfig', JSON.stringify(combat));
    localStorage.setItem('CAMPAIGN_YEAR',  String(year));
    localStorage.setItem('CAMPAIGN_MONTH', String(month));

    // Telegram (localStorage)
    setTelegramEnabled(tgEnabled);
    setUmbralTesoreria(umbralTes);
    setUmbralLibroMayor(umbralLib);

    // XP solo de pilotos editados
    for (const jugador of pilotXPDirty) {
      const v = pilotXP[jugador];
      if (!v) continue;
      try {
        await savePilot({ jugador, xpTotal: v.xpTotal, xpDisponible: v.xpDisponible });
      } catch {}
    }
    setPilotXPDirty(new Set());

    setSaving(false);
    onClose();
  };

  const updatePilotXP = (jugador: string, patch: Partial<{ xpTotal: number; xpDisponible: number }>) => {
    setPilotXP(prev => ({ ...prev, [jugador]: { ...prev[jugador], ...patch } }));
    setPilotXPDirty(prev => new Set(prev).add(jugador));
  };

  // Guardado solo XP — no cierra modal
  const [savingXP, setSavingXP] = useState(false);
  const [savedXPFlash, setSavedXPFlash] = useState(false);
  const saveXPOnly = async () => {
    if (pilotXPDirty.size === 0) return;
    setSavingXP(true);
    for (const jugador of pilotXPDirty) {
      const v = pilotXP[jugador];
      if (!v) continue;
      try {
        await savePilot({ jugador, xpTotal: v.xpTotal, xpDisponible: v.xpDisponible });
      } catch {}
    }
    setPilotXPDirty(new Set());
    setSavingXP(false);
    setSavedXPFlash(true);
    setTimeout(() => setSavedXPFlash(false), 1800);
  };

  const updateCombat = (key: string, val: string) => {
    setCombat(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  if (!open || userRole !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/92 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border-2 border-primary-container w-full max-w-[1100px] max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary-container/30 shrink-0">
          <h3 className="font-mono text-[12px] font-bold text-primary-container uppercase tracking-[2px]">
            Configuración unificada
          </h3>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-3 h-8 bg-green-400/10 border border-green-400 text-green-400 font-mono text-[10px] uppercase tracking-widest hover:bg-green-400/20 disabled:opacity-40 transition-all">
              {saving ? <Loader size={11} className="animate-spin" /> : <Save size={11} />} Guardar
            </button>
            <button onClick={() => signOut(auth)}
              className="flex items-center gap-1 px-3 h-8 border border-error/40 text-error font-mono text-[10px] uppercase tracking-widest hover:bg-error/10 transition-all"
              title={auth.currentUser?.email ?? ''}>
              <LogOut size={11} /> Salir
            </button>
            <button onClick={onClose}
              className="flex items-center gap-1 px-3 h-8 border border-primary-container/40 text-primary-container font-mono text-[10px] uppercase tracking-widest hover:bg-primary-container/10 transition-all">
              <X size={11} /> Cerrar
            </button>
          </div>
        </div>

        {/* Body con sidebar de tabs + contenido */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12 gap-2 font-mono text-[10px] text-outline">
              <Loader size={14} className="animate-spin" /> Cargando configuración…
            </div>
          ) : (
            <>
              {/* Sidebar tabs */}
              <nav className="w-44 shrink-0 border-r border-outline-variant/20 bg-surface-container-lowest overflow-y-auto custom-scrollbar p-2 space-y-0.5">
                {TABS.map(t => {
                  const Icon = t.icon;
                  const active = tab === t.key;
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)}
                      className={`w-full flex items-center gap-2 px-2 py-2 font-mono text-[10px] uppercase tracking-widest border-l-2 transition-all ${
                        active
                          ? 'border-primary-container bg-primary-container/10 text-primary-container'
                          : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container'
                      }`}>
                      <Icon size={12} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {tab === 'campana' && (
                  <PanelCampana
                    month={month} setMonth={setMonth}
                    year={year} setYear={setYear}
                    company={company} setCompany={setCompany}
                    system={system} setSystem={setSystem}
                    faction={faction} setFaction={setFaction}
                  />
                )}
                {tab === 'tesoreria' && (
                  <PanelTesoreria treasury={treasury} setTreasury={setTreasury} />
                )}
                {tab === 'pilotos' && (
                  <PanelPilotosXP
                    pilotXP={pilotXP}
                    pilotXPDirty={pilotXPDirty}
                    updatePilotXP={updatePilotXP}
                    saveXPOnly={saveXPOnly}
                    savingXP={savingXP}
                    savedXPFlash={savedXPFlash}
                  />
                )}
                {tab === 'prompts' && (
                  <PanelPrompts
                    promptInstr={promptInstr} setPromptInstr={setPromptInstr}
                    promptTono={promptTono} setPromptTono={setPromptTono}
                    promptCron={promptCron} setPromptCron={setPromptCron}
                    promptParte={promptParte} setPromptParte={setPromptParte}
                  />
                )}
                {tab === 'telegram' && (
                  <PanelTelegram
                    tgEnabled={tgEnabled} setTgEnabled={setTgEnabled}
                    umbralTes={umbralTes} setUmbralTes={setUmbralTes}
                    umbralLib={umbralLib} setUmbralLib={setUmbralLib}
                  />
                )}
                {tab === 'combate' && (
                  <PanelCombate combat={combat} updateCombat={updateCombat} />
                )}
                {tab === 'diseno' && (
                  <PanelDiseno useLegacyDesigns={useLegacyDesigns} setUseLegacyDesigns={setUseLegacyDesigns} />
                )}
                {tab === 'roles' && (
                  <div className="bg-red-400/5 border border-red-400/30 p-3 space-y-3">
                    <div className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-[2px]">Gestión de Roles</div>
                    <RolesPanel />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function PanelCampana(p: {
  month: number; setMonth: (n: number) => void;
  year: number; setYear: (n: number) => void;
  company: string; setCompany: (s: string) => void;
  system: string; setSystem: (s: string) => void;
  faction: string; setFaction: (s: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-primary-container/5 border border-primary-container/20 p-3 space-y-2">
        <div className="font-mono text-[10px] font-bold text-primary-container uppercase tracking-[2px]">Fecha campaña</div>
        <Label>Mes campaña</Label>
        <select value={p.month} onChange={e => p.setMonth(parseInt(e.target.value))}
          className="w-full h-9 bg-surface-container-lowest border border-outline-variant/25 px-2 font-mono text-[11px] text-green-400 focus:outline-none focus:border-primary-container appearance-none cursor-pointer">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m.toUpperCase()}</option>)}
        </select>
        <Label>Año campaña</Label>
        <select value={p.year} onChange={e => p.setYear(parseInt(e.target.value))}
          className="w-full h-9 bg-surface-container-lowest border border-outline-variant/25 px-2 font-mono text-[11px] text-green-400 focus:outline-none focus:border-primary-container appearance-none cursor-pointer">
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-primary-container/5 border border-primary-container/20 p-3 space-y-2">
        <div className="font-mono text-[10px] font-bold text-primary-container uppercase tracking-[2px]">Crónicas / Campaña</div>
        <Label>Compañía</Label>
        <Input value={p.company} onChange={p.setCompany} />
        <Label>Sistema</Label>
        <Input value={p.system} onChange={p.setSystem} />
        <Label>Facción</Label>
        <Input value={p.faction} onChange={p.setFaction} />
      </div>
    </div>
  );
}

function PanelTesoreria(p: { treasury: number; setTreasury: (n: number) => void }) {
  return (
    <div className="bg-red-400/5 border border-red-400/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-[2px]">Tesorería · Override directo</div>
        <div className="font-mono text-[8px] text-red-400/60 uppercase tracking-widest">
          ⚠ No crea asiento · No aparece en libro mayor
        </div>
      </div>
      <Label>Saldo actual (₡)</Label>
      <input
        type="number"
        value={p.treasury}
        onChange={e => p.setTreasury(parseInt(e.target.value) || 0)}
        onFocus={e => e.target.select()}
        className="w-full h-9 bg-surface-container-lowest border border-red-400/30 px-2 font-mono text-[12px] text-red-400 focus:outline-none focus:border-red-400"
      />
      <div className="font-mono text-[9px] text-outline">
        Equivalente formateado: {formatCzar(p.treasury)}
      </div>
    </div>
  );
}

function PanelPilotosXP(p: {
  pilotXP: Record<string, { xpTotal: number; xpDisponible: number }>;
  pilotXPDirty: Set<string>;
  updatePilotXP: (j: string, patch: Partial<{ xpTotal: number; xpDisponible: number }>) => void;
  saveXPOnly: () => Promise<void>;
  savingXP: boolean;
  savedXPFlash: boolean;
}) {
  return (
    <div className="bg-green-400/5 border border-green-400/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-bold text-green-400 uppercase tracking-[2px]">XP Pilotos · Override directo</div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-[8px] text-green-400/60 uppercase tracking-widest">
            {p.savedXPFlash ? '✓ Guardado' : p.pilotXPDirty.size > 0 ? `${p.pilotXPDirty.size} sin guardar` : 'Sincronizado'}
          </div>
          <button
            onClick={p.saveXPOnly}
            disabled={p.savingXP || p.pilotXPDirty.size === 0}
            className="flex items-center gap-1.5 px-2 h-7 bg-green-400/10 border border-green-400/60 text-green-400 font-mono text-[9px] uppercase tracking-widest hover:bg-green-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {p.savingXP ? <Loader size={10} className="animate-spin" /> : <Save size={10} />}
            Guardar XP
          </button>
        </div>
      </div>
      {Object.keys(p.pilotXP).length === 0 ? (
        <div className="font-mono text-[9px] text-outline italic">Sin pilotos activos en roster.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(p.pilotXP).map(([jugador, v]) => (
            <div key={jugador} className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 px-2 py-1.5">
              <span className="font-mono text-[10px] text-on-surface flex-1 truncate" title={jugador}>{jugador}</span>
              <label className="font-mono text-[8px] text-outline/60 uppercase tracking-widest">XP</label>
              <input
                type="number" min={0} value={v.xpTotal}
                onFocus={e => e.target.select()}
                onChange={e => p.updatePilotXP(jugador, { xpTotal: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-20 h-7 bg-surface-container-lowest border border-outline-variant/30 px-1 font-mono text-[10px] text-on-surface text-right focus:outline-none focus:border-green-400/60"
              />
              <label className="font-mono text-[8px] text-outline/60 uppercase tracking-widest">Disp</label>
              <input
                type="number" min={0} value={v.xpDisponible}
                onFocus={e => e.target.select()}
                onChange={e => p.updatePilotXP(jugador, { xpDisponible: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-20 h-7 bg-surface-container-lowest border border-green-400/20 px-1 font-mono text-[10px] text-green-400 text-right focus:outline-none focus:border-green-400/60"
              />
            </div>
          ))}
        </div>
      )}
      <div className="font-mono text-[8px] text-outline/50 italic">
        Botón "Guardar XP" persiste sin cerrar modal. No crea asiento ni log.
      </div>
    </div>
  );
}

function PanelPrompts(p: {
  promptInstr: string; setPromptInstr: (s: string) => void;
  promptTono: string; setPromptTono: (s: string) => void;
  promptCron: string; setPromptCron: (s: string) => void;
  promptParte: string; setPromptParte: (s: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="font-mono text-[8px] text-outline/60 italic">
        Prompts para IA narrativa (crónicas / partes / tono general). Persistidos en config Firestore.
      </div>
      <PromptField label="Instrucciones generales" hint="Base para toda IA narrativa" value={p.promptInstr} onChange={p.setPromptInstr} rows={4} />
      <PromptField label="Tono / voz" hint="Cómo escribe (formal, irónico, militar, etc.)" value={p.promptTono} onChange={p.setPromptTono} rows={3} />
      <PromptField label="Crónicas" hint="Plantilla específica generación crónica de misión" value={p.promptCron} onChange={p.setPromptCron} rows={4} />
      <PromptField label="Partes diarios" hint="Plantilla específica parte diario" value={p.promptParte} onChange={p.setPromptParte} rows={4} />
    </div>
  );
}

function PromptField(p: { label: string; hint: string; value: string; onChange: (s: string) => void; rows: number }) {
  return (
    <div className="bg-primary-container/5 border border-primary-container/20 p-3 space-y-1.5">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] font-bold text-primary-container uppercase tracking-[2px]">{p.label}</div>
        <div className="font-mono text-[8px] text-outline/60 italic">{p.hint}</div>
      </div>
      <textarea value={p.value} onChange={e => p.onChange(e.target.value)} rows={p.rows}
        className="w-full bg-surface-container-lowest border border-outline-variant/25 px-2 py-1.5 font-mono text-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container resize-none custom-scrollbar" />
    </div>
  );
}

function PanelTelegram(p: {
  tgEnabled: boolean; setTgEnabled: (b: boolean) => void;
  umbralTes: number; setUmbralTes: (n: number) => void;
  umbralLib: number; setUmbralLib: (n: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-amber-400/5 border border-amber-400/30 p-3 space-y-3">
        <div className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-[2px]">Notificaciones Telegram</div>
        <label className="flex items-center gap-3 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={p.tgEnabled}
            onChange={e => p.setTgEnabled(e.target.checked)}
            className="w-4 h-4 accent-amber-400 cursor-pointer"
          />
          <span className="font-mono text-[11px] text-on-surface">Notificaciones activas</span>
          <span className="font-mono text-[9px] text-outline ml-auto">
            {p.tgEnabled ? 'ON' : 'OFF'}
          </span>
        </label>
        <div className="font-mono text-[8px] text-outline italic">
          Toggle global cliente. Backend valida además TOKEN + CHAT_ID. Sin marca → drop silencioso.
        </div>
      </div>

      <div className="bg-amber-400/5 border border-amber-400/30 p-3 space-y-2">
        <div className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-[2px]">Umbrales</div>
        <Label>Umbral tesorería ("tesoreria_grande" ₡)</Label>
        <input
          type="number" min={0} value={p.umbralTes}
          onFocus={e => e.target.select()}
          onChange={e => p.setUmbralTes(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-9 bg-surface-container-lowest border border-amber-400/30 px-2 font-mono text-[11px] text-amber-400 focus:outline-none focus:border-amber-400"
        />
        <div className="font-mono text-[8px] text-outline italic">Equivalente: {formatCzar(p.umbralTes)}</div>

        <Label>Umbral libro mayor ("libro_mayor_relevante" ₡)</Label>
        <input
          type="number" min={0} value={p.umbralLib}
          onFocus={e => e.target.select()}
          onChange={e => p.setUmbralLib(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-9 bg-surface-container-lowest border border-amber-400/30 px-2 font-mono text-[11px] text-amber-400 focus:outline-none focus:border-amber-400"
        />
        <div className="font-mono text-[8px] text-outline italic">Equivalente: {formatCzar(p.umbralLib)}</div>
      </div>
    </div>
  );
}

function PanelCombate(p: { combat: typeof COMBAT_DEFAULTS; updateCombat: (k: string, v: string) => void }) {
  return (
    <div className="bg-secondary/5 border border-secondary/20 p-3 space-y-2">
      <div className="font-mono text-[10px] font-bold text-secondary uppercase tracking-[2px]">Combate (modificadores)</div>
      <div className="grid grid-cols-11 gap-1.5">
        {(Object.keys(COMBAT_DEFAULTS) as (keyof typeof COMBAT_DEFAULTS)[]).map(key => (
          <input key={key} type="number"
            value={p.combat[key]}
            onChange={e => p.updateCombat(key, e.target.value)}
            title={key}
            className="h-8 bg-surface-container-lowest border border-secondary/20 px-1 font-mono text-[11px] text-on-surface text-center focus:outline-none focus:border-secondary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        ))}
      </div>
      <div className="font-mono text-[8px] text-outline italic">
        Orden: rangeShort/Medium/Long · movStand/Walk/Run/Jump · movTargetStand/Walk/Run/Jump
      </div>
    </div>
  );
}

function PanelDiseno(p: { useLegacyDesigns: boolean; setUseLegacyDesigns: (b: boolean) => void }) {
  return (
    <div className="bg-amber-400/5 border border-amber-400/30 p-3 space-y-2">
      <div className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-[2px]">Diseño UI</div>
      <label className="flex items-center gap-3 cursor-pointer select-none py-2">
        <input
          type="checkbox"
          checked={p.useLegacyDesigns}
          onChange={e => p.setUseLegacyDesigns(e.target.checked)}
          className="w-4 h-4 accent-amber-400 cursor-pointer"
        />
        <span className="font-mono text-[11px] text-on-surface">
          Usar versiones legacy (Barracones · Hoja de Servicio)
        </span>
        <span className="font-mono text-[9px] text-outline ml-auto">
          {p.useLegacyDesigns ? 'LEGACY' : 'MODERNO'}
        </span>
      </label>
      <div className="font-mono text-[9px] text-outline">
        Off → diseños nuevos (P2 Medallón / P3 Two-Tone). On → versiones P1 originales.
      </div>
    </div>
  );
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[9px] text-outline uppercase tracking-widest mt-2">{children}</div>;
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      className="w-full h-8 bg-surface-container-lowest border border-outline-variant/25 px-2 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-container" />
  );
}
