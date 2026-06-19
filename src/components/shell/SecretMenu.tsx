import { useState, useEffect } from 'react';
import { X, Save, Loader, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import { useAppStore } from '@/lib/store';
import { loadConfig, saveConfigBatch, savePilot } from '@/lib/firebase-service';
import { formatCzar, parseCurrencyValue } from '@/lib/currency-utils';
import { isActivo } from '@/lib/roster';
import { RolesPanel } from './RolesPanel';

// ─── Constants ───────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] as const;
const YEARS = Array.from({ length: 100 }, (_, i) => 3000 + i);

const COMBAT_DEFAULTS = {
  rangeShort: 0, rangeMedium: 2, rangeLong: 4,
  movStand: 0, movWalk: 1, movRun: 2, movJump: 3,
  movTargetStand: 0, movTargetWalk: 1, movTargetRun: 2, movTargetJump: 3,
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { open: boolean; onClose: () => void }

export function SecretMenu({ open, onClose }: Props) {
  const { setCampaign, useLegacyDesigns, setUseLegacyDesigns, userRole, roster } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // XP editor por piloto: clave jugador → { xpTotal, xpDisponible }
  const [pilotXP, setPilotXP] = useState<Record<string, { xpTotal: number; xpDisponible: number }>>({});
  const [pilotXPDirty, setPilotXPDirty] = useState<Set<string>>(new Set());

  // Form state
  const [month, setMonth]       = useState(1);
  const [year, setYear]         = useState(3028);
  const [company, setCompany]   = useState('');
  const [system, setSystem]     = useState('');
  const [faction, setFaction]   = useState('');
  const [prompt, setPrompt]     = useState('');
  const [treasury, setTreasury] = useState(0);
  const [combat, setCombat]     = useState(COMBAT_DEFAULTS);

  // Load config on open (solo si es admin)
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
      setPrompt(cfg['PROMPT_INSTRUCCIONES'] || '');
      setTreasury(parseCurrencyValue(cfg['CONTRATO_VALOR']) ?? 0);

      let cc = COMBAT_DEFAULTS;
      try { cc = { ...COMBAT_DEFAULTS, ...JSON.parse(localStorage.getItem('combatConfig') || '{}') }; } catch {}
      setCombat(cc);

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
      'AÑO_CAMPANA': String(year),
      'MES_CAMPANA': String(month),
      'COMPANIA_NOMBRE': company,
      'SISTEMA_ACTUAL': system,
      'FACCION_ACTUAL': faction,
      'PROMPT_INSTRUCCIONES': prompt,
      'CONTRATO_VALOR': tesoreriaStr,
    };
    try { await saveConfigBatch(config); } catch {}

    setCampaign({
      campaignYear: year,
      campaignMonth: month,
      unitName: company || undefined,
      contratoValor: tesoreriaStr,
    });

    localStorage.setItem('combatConfig', JSON.stringify(combat));
    localStorage.setItem('CAMPAIGN_YEAR', String(year));
    localStorage.setItem('CAMPAIGN_MONTH', String(month));

    // Persistir XP solo de pilotos editados
    for (const jugador of pilotXPDirty) {
      const v = pilotXP[jugador];
      if (!v) continue;
      try {
        await savePilot({
          jugador,
          xpTotal:      v.xpTotal,
          xpDisponible: v.xpDisponible,
        });
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

  const updateCombat = (key: string, val: string) => {
    setCombat(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };


  // Solo admins. Para cualquier otro rol: no renderiza nada.
  if (!open || userRole !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/92 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border-2 border-primary-container w-full max-w-[1100px] max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* CONFIG */}
        <>
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary-container/30 shrink-0">
            <h3 className="font-mono text-[12px] font-bold text-primary-container uppercase tracking-[2px]">
              Configuracion unificada
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 font-mono text-[10px] text-outline">
                <Loader size={14} className="animate-spin" /> Cargando configuración…
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Database */}
                <div className="bg-primary-container/5 border border-primary-container/20 p-3 space-y-2">
                  <div className="font-mono text-[10px] font-bold text-primary-container uppercase tracking-[2px]">Database / Sistema</div>
                  <Label>Mes campaña</Label>
                  <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                    className="w-full h-9 bg-surface-container-lowest border border-outline-variant/25 px-2 font-mono text-[11px] text-green-400 focus:outline-none focus:border-primary-container appearance-none cursor-pointer">
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m.toUpperCase()}</option>)}
                  </select>
                  <Label>Año campaña</Label>
                  <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                    className="w-full h-9 bg-surface-container-lowest border border-outline-variant/25 px-2 font-mono text-[11px] text-green-400 focus:outline-none focus:border-primary-container appearance-none cursor-pointer">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Cronicas */}
                <div className="bg-primary-container/5 border border-primary-container/20 p-3 space-y-2">
                  <div className="font-mono text-[10px] font-bold text-primary-container uppercase tracking-[2px]">Crónicas / Campaña</div>
                  <Label>Compañía</Label>
                  <Input value={company} onChange={setCompany} />
                  <Label>Sistema</Label>
                  <Input value={system} onChange={setSystem} />
                  <Label>Facción</Label>
                  <Input value={faction} onChange={setFaction} />
                  <Label>Prompt instrucciones</Label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                    className="w-full bg-surface-container-lowest border border-outline-variant/25 px-2 py-1.5 font-mono text-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container resize-none custom-scrollbar" />
                </div>

                {/* Tesoreria */}
                <div className="lg:col-span-2 bg-red-400/5 border border-red-400/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-[2px]">
                      Tesorería · Override directo
                    </div>
                    <div className="font-mono text-[8px] text-red-400/60 uppercase tracking-widest">
                      ⚠ No crea asiento · No aparece en libro mayor
                    </div>
                  </div>
                  <Label>Saldo actual (₡)</Label>
                  <input
                    type="number"
                    value={treasury}
                    onChange={e => setTreasury(parseInt(e.target.value) || 0)}
                    onFocus={e => e.target.select()}
                    className="w-full h-9 bg-surface-container-lowest border border-red-400/30 px-2 font-mono text-[12px] text-red-400 focus:outline-none focus:border-red-400"
                  />
                  <div className="font-mono text-[9px] text-outline">
                    Equivalente formateado: {formatCzar(treasury)}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-amber-400/5 border border-amber-400/30 p-3 space-y-2">
                  <div className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-[2px]">Diseño UI</div>
                  <label className="flex items-center gap-3 cursor-pointer select-none py-2">
                    <input
                      type="checkbox"
                      checked={useLegacyDesigns}
                      onChange={e => setUseLegacyDesigns(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-on-surface">
                      Usar versiones legacy (Barracones · Hoja de Servicio)
                    </span>
                    <span className="font-mono text-[9px] text-outline ml-auto">
                      {useLegacyDesigns ? 'LEGACY' : 'MODERNO'}
                    </span>
                  </label>
                  <div className="font-mono text-[9px] text-outline">
                    Off → diseños nuevos (P2 Medallón / P3 Two-Tone). On → versiones P1 originales.
                  </div>
                </div>

                {/* XP Pilotos */}
                <div className="lg:col-span-2 bg-green-400/5 border border-green-400/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] font-bold text-green-400 uppercase tracking-[2px]">
                      XP Pilotos · Override directo
                    </div>
                    <div className="font-mono text-[8px] text-green-400/60 uppercase tracking-widest">
                      {pilotXPDirty.size > 0 ? `${pilotXPDirty.size} sin guardar` : 'Sincronizado'}
                    </div>
                  </div>
                  {Object.keys(pilotXP).length === 0 ? (
                    <div className="font-mono text-[9px] text-outline italic">Sin pilotos activos en roster.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(pilotXP).map(([jugador, v]) => (
                        <div key={jugador} className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 px-2 py-1.5">
                          <span className="font-mono text-[10px] text-on-surface flex-1 truncate" title={jugador}>{jugador}</span>
                          <label className="font-mono text-[8px] text-outline/60 uppercase tracking-widest">XP</label>
                          <input
                            type="number" min={0} value={v.xpTotal}
                            onFocus={e => e.target.select()}
                            onChange={e => updatePilotXP(jugador, { xpTotal: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-20 h-7 bg-surface-container-lowest border border-outline-variant/30 px-1 font-mono text-[10px] text-on-surface text-right focus:outline-none focus:border-green-400/60"
                          />
                          <label className="font-mono text-[8px] text-outline/60 uppercase tracking-widest">Disp</label>
                          <input
                            type="number" min={0} value={v.xpDisponible}
                            onFocus={e => e.target.select()}
                            onChange={e => updatePilotXP(jugador, { xpDisponible: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-20 h-7 bg-surface-container-lowest border border-green-400/20 px-1 font-mono text-[10px] text-green-400 text-right focus:outline-none focus:border-green-400/60"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="font-mono text-[8px] text-outline/50 italic">
                    Guarda con el botón Guardar de arriba. No crea asiento ni log.
                  </div>
                </div>

                {/* Roles extra */}
                <div className="lg:col-span-2 bg-red-400/5 border border-red-400/30 p-3 space-y-3">
                  <div className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-[2px]">Gestión de Roles</div>
                  <RolesPanel />
                </div>

                {/* Combate */}
                <div className="lg:col-span-2 bg-secondary/5 border border-secondary/20 p-3 space-y-2">
                  <div className="font-mono text-[10px] font-bold text-secondary uppercase tracking-[2px]">Combate (modificadores)</div>
                  <div className="grid grid-cols-11 gap-1.5">
                    {(Object.keys(COMBAT_DEFAULTS) as (keyof typeof COMBAT_DEFAULTS)[]).map(key => (
                      <input key={key} type="number"
                        value={combat[key]}
                        onChange={e => updateCombat(key, e.target.value)}
                        title={key}
                        className="h-8 bg-surface-container-lowest border border-secondary/20 px-1 font-mono text-[11px] text-on-surface text-center focus:outline-none focus:border-secondary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
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
