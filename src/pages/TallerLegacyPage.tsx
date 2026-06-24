// ══════════════════════════════════════════════════════════
//  TallerLegacyPage — vista antigua TallerModal (factura $)
//  Accesible vía SecretMenu → Diseño → Legacy. Preservada
//  para retrocompat / DM testing. NO usa pool tiempo ni almacén
//  granular ni recarga municion granular.
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewport } from '@/hooks/useViewport';
import { useMechCatalog, findMechByName, type CatalogMech } from '@/hooks/useMechCatalog';
import { useAppStore } from '@/lib/store';
import { loadLocalSnapshot, restoreMechSlotFull } from '@/lib/simulador-persistence';
import { commitLibroEntryAndTreasury, type LibroMayorEntry } from '@/lib/firebase-service';
import type { MechSlot } from '@/lib/combat-types';
import {
  emptyDamage, deriveDamageFromSession, configFromCatalog,
  calcRepairCostCanon, calcRepairCost, ESTADO_COLOR,
  type MechRepairConfig, type MechRepairDamage,
  type MunicionDetalleEntry,
} from '@/lib/repair-engine';
import {
  PRECIO_ACTUADOR, PRECIO_REACTOR, PRECIO_GYRO_BASE, GYRO_MULTIPLIER,
  PRECIO_MIOMERO, PRECIO_ESTRUCTURA, PRECIO_RETROS, PRECIO_RADIADORES,
  PRECIO_BLINDAJE, PRECIO_CABINA, PRECIO_SOPORTE_VIDA, PRECIO_SENSORES_BASE,
  ESTADO_FACTURA_PCT,
  type RepairSystem,
} from '@/lib/repair-engine';
import { sendTelegramNotif, getTelegramToggle } from '@/lib/telegram-service';
import { TelegramToggle } from '@/components/ui/TelegramToggle';
import { CostModifierSelector } from '@/components/ui/CostModifierSelector';
import { formatCzar } from '@/lib/currency-utils';
import { getCampaignDateISO, genId } from '@/pages/FinanzasPage';

const fmtMoney = (n: number) => formatCzar(n);

const T = {
  void:       '#0a0e14',
  surface:    '#10141a',
  surfaceLow: '#181c22',
  outlineV:   '#4e453a',
  gold:       '#ffd79b',
  bronze:     '#c79764',
  cream:      '#e8d5b8',
  creamHi:    '#fff1d6',
  bone:       '#d1c5b6',
  bloodLight: '#ffb4ab',
  greenDeep:  '#9bd28a',
  outline:    '#9a8f81',
};

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: '"Share Tech Mono", monospace',
      fontSize: 10, color: T.outline, letterSpacing: 2,
      textTransform: 'uppercase', marginBottom: 6,
    }}>{children}</div>
  );
}

function FacturaRow({ label, value, color, bold }: {
  label: string; value: number; color?: string; bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{
        fontFamily: bold ? '"Space Grotesk", sans-serif' : 'Inter, sans-serif',
        fontSize: bold ? 14 : 12,
        fontWeight: bold ? 800 : 500,
        color: color ?? T.cream,
      }}>{label}</span>
      <span style={{
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: bold ? 16 : 12,
        fontWeight: bold ? 800 : 700,
        color: color ?? (value > 0 ? T.creamHi : T.outline),
      }}>{value > 0 ? fmtMoney(value) : '—'}</span>
    </div>
  );
}

interface Props {
  initialSimSlotIdx?: number | null;
  onClose?: () => void;
  onCommit?: (total: number, concepto: string, mechName: string) => Promise<void>;
  onRestore?: () => void;
  inline?: boolean;
}

/**
 * Legacy TallerModal preservado. Vista factura $ standalone.
 * Sólo lectura/cálculo — NO descuenta almacén ni pool tiempo.
 * Recoge daños desde sim slot o entrada manual; calcula factura
 * canon (CamOps) o propio (TM) y graba asiento al libro mayor.
 */
export function TallerLegacyPage({ initialSimSlotIdx, onClose, onCommit, onRestore, inline }: Props = {}) {
  const navigate = useNavigate();
  const { isTabletDown, isMobile } = useViewport();
  const { catalog } = useMechCatalog();
  const campaign = useAppStore(s => s.campaign);
  const campaignDate = useMemo(
    () => getCampaignDateISO(campaign?.campaignYear, campaign?.campaignMonth),
    [campaign?.campaignYear, campaign?.campaignMonth],
  );

  const [mechQuery, setMechQuery] = useState('');
  const [selected, setSelected] = useState<CatalogMech | null>(null);
  const [showSugg, setShowSugg] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [config, setConfig] = useState<MechRepairConfig | null>(null);
  const [damage, setDamage] = useState<MechRepairDamage>(emptyDamage);
  const [estadoPct, setEstadoPct] = useState(100);
  const [pctDañoTotal, setPctDañoTotal] = useState(0);
  const [system, setSystem] = useState<RepairSystem>('canon');

  const [showSimPicker, setShowSimPicker] = useState(false);
  const [municionDetalle, setMunicionDetalle] = useState<MunicionDetalleEntry[]>([]);
  const [simSlotIdx, setSimSlotIdx] = useState<number | null>(null);

  const simSlots: { slot: MechSlot; idx: number }[] = useMemo(() => {
    const snap = loadLocalSnapshot();
    if (!snap) return [];
    return snap.mechSlots
      .map((s, i) => ({ slot: s, idx: i }))
      .filter(({ slot }) => slot?.state && slot?.session);
  }, [showSimPicker]);

  const loadFromSimSlot = (mechSlot: MechSlot, slotIdx: number) => {
    if (!mechSlot.state || !mechSlot.session) return;
    const st = mechSlot.state;
    const { damage: derivedDmg, pctDañoTotal: pct, municionDetalle: detalle } = deriveDamageFromSession(st, mechSlot.session);
    setMunicionDetalle(detalle);
    const catMatch = catalog
      ? findMechByName(catalog.mechs, `${st.chassis} ${st.model}`)
      : null;
    const derivedConfig: MechRepairConfig = catMatch
      ? configFromCatalog(catMatch)
      : {
          tons:           st.tonnage,
          walkMP:         st.walkMP,
          reactorType:    'Fusion',
          gyroType:       'Estandar',
          miomeroType:    'Estandar',
          estructuraType: 'Estandar',
          retroType:      'Estandar',
          radType:        st.hsDouble ? 'Dobles' : 'Normales',
          blindajeType:   'Estandar',
        };
    setConfig(derivedConfig);
    setDamage(derivedDmg);
    setPctDañoTotal(pct);
    setMechQuery(`${st.chassis} ${st.model}`);
    setSelected(catMatch ?? null);
    setShowSimPicker(false);
    setSimSlotIdx(slotIdx);
  };

  useEffect(() => {
    if (initialSimSlotIdx === null || initialSimSlotIdx === undefined) return;
    if (!catalog) return;
    const snap = loadLocalSnapshot();
    if (!snap) return;
    const slot = snap.mechSlots[initialSimSlotIdx];
    if (slot?.state && slot?.session) loadFromSimSlot(slot, initialSimSlotIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  const suggestions = useMemo(() => {
    if (!catalog || mechQuery.trim().length < 2) return [];
    const q = mechQuery.trim().toLowerCase();
    return catalog.mechs
      .filter(m => {
        const label = m.fullName || m.name || `${m.chassis ?? ''} ${m.model ?? ''}`;
        return label.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [catalog, mechQuery]);

  const handleSelectMech = (m: CatalogMech) => {
    setSelected(m);
    setConfig(configFromCatalog(m));
    setDamage(emptyDamage());
    setPctDañoTotal(0);
    setMunicionDetalle([]);
    setMechQuery(m.fullName || m.name || '');
    setShowSugg(false);
  };

  const factura = useMemo(() => {
    if (!config) return null;
    return system === 'canon'
      ? calcRepairCostCanon(config, damage, estadoPct, pctDañoTotal)
      : calcRepairCost(config, damage, estadoPct);
  }, [config, damage, estadoPct, pctDañoTotal, system]);

  const handleConfirmar = async () => {
    if (!config || !factura || committing) return;
    setCommitting(true);
    const mechName = selected
      ? (selected.fullName || selected.name || `${selected.chassis ?? ''} ${selected.model ?? ''}`)
      : 'Mech';
    const concepto = `Reparación · ${mechName}`;
    try {
      if (onCommit) {
        await onCommit(factura.total, concepto, mechName);
      } else {
        const entry: LibroMayorEntry = {
          id: genId('lm'),
          fecha: campaignDate,
          concepto,
          cantidad: Math.round(factura.total),
          tipo: 'gasto',
          categoria: 'repuestos',
          nota: `Taller Legacy · ${system === 'canon' ? 'Canon' : 'Propio'} · est ${estadoPct}%`,
          jugador: '',
        };
        await commitLibroEntryAndTreasury(entry);
        if (getTelegramToggle('taller')) {
          await sendTelegramNotif('libro_mayor_relevante', { entry, totalTesoreria: 0 }).catch(() => {});
        }
      }
    } finally {
      setCommitting(false);
      if (onClose) onClose();
    }
  };

  const handleRestore = () => {
    if (simSlotIdx === null) return;
    restoreMechSlotFull(simSlotIdx);
    if (onRestore) onRestore();
  };

  const content = (
    <div style={{
      width: '100%', maxWidth: 1100, margin: '0 auto',
      padding: isMobile ? 12 : 20,
      background: T.surface, border: `1px solid ${T.outlineV}`,
      borderTop: `4px solid ${T.bronze}`,
      fontFamily: 'Inter, sans-serif', color: T.cream,
    }}>
      <div style={{
        marginBottom: 12, padding: '8px 12px',
        background: T.bronze + '20', border: `1px solid ${T.bronze}`,
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
        color: T.bronze, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        ⚠ Vista Legacy — sólo factura. NO descuenta almacén, pool tiempo ni recarga granular.
      </div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <SmallLabel>Taller · Legacy</SmallLabel>
          <h2 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 22, fontWeight: 900, color: T.creamHi, margin: 0 }}>
            Reparación (Factura)
          </h2>
        </div>
        <button
          onClick={() => navigate('/taller')}
          style={{
            padding: '6px 12px', background: T.gold + '20',
            border: `1px solid ${T.gold}`, color: T.gold,
            fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
            letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >← Volver al Taller Moderno</button>
      </div>

      <div style={{ marginBottom: 12, position: 'relative' }}>
        <SmallLabel>Mech a reparar (catálogo SSW)</SmallLabel>
        <input
          type="text" value={mechQuery}
          onChange={e => { setMechQuery(e.target.value); setShowSugg(true); }}
          onFocus={() => setShowSugg(true)}
          placeholder="Buscar mech…"
          style={{
            width: '100%', padding: '10px 12px', background: T.surfaceLow,
            border: `1px solid ${T.outlineV}`, color: T.cream,
            fontFamily: 'Inter, sans-serif', fontSize: 13,
          }}
        />
        {showSugg && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: T.surface, border: `1px solid ${T.outlineV}`,
            maxHeight: 220, overflowY: 'auto', zIndex: 10,
          }}>
            {suggestions.map((m, i) => (
              <div
                key={i}
                onClick={() => handleSelectMech(m)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.outlineV}`,
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 11, color: T.bone,
                }}
              >{m.fullName || m.name || `${m.chassis ?? ''} ${m.model ?? ''}`}</div>
            ))}
          </div>
        )}
      </div>

      {simSlots.length > 0 && (
        <button
          onClick={() => setShowSimPicker(s => !s)}
          style={{
            marginBottom: 12, padding: '8px 14px',
            background: T.gold + '15', border: `1px solid ${T.gold}`,
            color: T.gold, fontFamily: '"Share Tech Mono", monospace',
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >🔧 Cargar desde Simulador ({simSlots.length})</button>
      )}

      {showSimPicker && (
        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {simSlots.map(({ slot, idx }) => (
            <button
              key={idx}
              onClick={() => loadFromSimSlot(slot, idx)}
              style={{
                padding: '8px 12px', background: T.surfaceLow,
                border: `1px solid ${T.outlineV}`, color: T.bone,
                fontFamily: '"Share Tech Mono", monospace', fontSize: 11, cursor: 'pointer',
              }}
            >
              Slot {idx + 1}: {slot.state?.chassis} {slot.state?.model}
            </button>
          ))}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isTabletDown ? '1fr' : '1fr 1fr',
        gap: 16,
      }}>
        <div>
          <SmallLabel>Estado factura</SmallLabel>
          <CostModifierSelector value={estadoPct} onChange={setEstadoPct} />
          <div style={{ marginTop: 16 }}>
            <SmallLabel>Sistema de cálculo</SmallLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['propio', 'canon'] as RepairSystem[]).map(s => (
                <button
                  key={s} onClick={() => setSystem(s)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: system === s ? T.gold + '30' : T.surfaceLow,
                    border: `1px solid ${system === s ? T.gold : T.outlineV}`,
                    color: system === s ? T.gold : T.outline,
                    fontFamily: '"Share Tech Mono", monospace', fontSize: 11,
                    letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >{s === 'propio' ? 'Propio (House)' : 'Canon (CamOps p.205)'}</button>
              ))}
            </div>
          </div>
          {config && (
            <div style={{
              marginTop: 16, padding: 12, background: T.surfaceLow,
              border: `1px solid ${T.outlineV}`,
              fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
              color: T.outline, lineHeight: 1.6,
            }}>
              <div>Reactor: <span style={{ color: T.bone }}>{config.reactorType}</span> · Gyro: <span style={{ color: T.bone }}>{config.gyroType}</span></div>
              <div>Miomero: <span style={{ color: T.bone }}>{config.miomeroType}</span> · Estructura: <span style={{ color: T.bone }}>{config.estructuraType}</span></div>
              <div>Blindaje: <span style={{ color: T.bone }}>{config.blindajeType}</span> · Radiadores: <span style={{ color: T.bone }}>{config.radType}</span></div>
              <div>Peso: <span style={{ color: T.bone }}>{config.tons}t</span> · Walk: <span style={{ color: T.bone }}>{config.walkMP}</span></div>
            </div>
          )}
        </div>

        <div>
          <SmallLabel>Factura desglosada</SmallLabel>
          {factura && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FacturaRow label="Reactor"      value={factura.reactor} />
              <FacturaRow label="Gyro"         value={factura.gyro} />
              <FacturaRow label="Cabina"       value={factura.cabina} />
              <FacturaRow label="Soporte vida" value={factura.soporteVida} />
              <FacturaRow label="Sensores"     value={factura.sensores} />
              <FacturaRow label="Estructura"   value={factura.estructura} />
              <FacturaRow label="Blindaje"     value={factura.blindaje} />
              <FacturaRow label="Miomero"      value={factura.miomero} />
              <FacturaRow label="Actuadores"   value={factura.actuadores} />
              <FacturaRow label="Retros"       value={factura.retros} />
              <FacturaRow label="Radiadores"   value={factura.radiadores} />
              <FacturaRow label="Armas"        value={factura.armas} />
              <FacturaRow label="Munición"     value={factura.municion} />
              {municionDetalle.length > 0 && (
                <div style={{
                  marginLeft: 12, padding: '4px 8px',
                  borderLeft: `2px solid ${T.outlineV}`,
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: T.outline,
                }}>
                  {municionDetalle.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{d.family} ({d.spent} disp · {d.tons}t)</span>
                      <span style={{ color: T.bone }}>{fmtMoney(d.cost)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: `1px solid ${T.outlineV}`, paddingTop: 8, marginTop: 6 }}>
                <FacturaRow label="Subtotal" value={factura.subtotal} color={T.gold} bold />
              </div>
              <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 10, color: T.outline, padding: '4px 0' }}>
                Estado factura: {factura.estadoFacturaPct}%
              </div>
              <div style={{
                marginTop: 6, padding: '8px 12px',
                background: `${ESTADO_COLOR[factura.estadoMech]}15`,
                border: `1px solid ${ESTADO_COLOR[factura.estadoMech]}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: T.outline, letterSpacing: 2 }}>
                  ESTADO MECH
                </span>
                <span style={{
                  fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 800,
                  color: ESTADO_COLOR[factura.estadoMech], letterSpacing: 1.5,
                }}>{factura.estadoMech}</span>
              </div>
              <div style={{ borderTop: `2px solid ${T.gold}`, paddingTop: 10, marginTop: 8 }}>
                <FacturaRow label="TOTAL" value={factura.total} color={T.gold} bold />
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TelegramToggle context="taller" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px 14px',
                  background: T.surfaceLow, border: `1px solid ${T.outlineV}`, color: T.outline,
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >Cancelar</button>
            )}
            <button
              onClick={handleConfirmar}
              disabled={!factura || committing}
              style={{
                flex: 2, padding: '10px 14px',
                background: T.gold, border: `1px solid ${T.gold}`, color: T.void,
                fontFamily: '"Share Tech Mono", monospace', fontSize: 11, fontWeight: 800,
                letterSpacing: 2, textTransform: 'uppercase',
                cursor: factura ? 'pointer' : 'not-allowed', opacity: factura ? 1 : 0.5,
              }}
            >{committing ? 'Procesando…' : (simSlotIdx !== null ? 'Cargar + Restaurar SIM' : 'Cobrar reparación')}</button>
          </div>
          {simSlotIdx !== null && (
            <button
              onClick={handleRestore}
              style={{
                width: '100%', marginTop: 8, padding: '8px 14px',
                background: T.surfaceLow, border: `1px solid ${T.bronze}`, color: T.bronze,
                fontFamily: '"Share Tech Mono", monospace', fontSize: 10,
                letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >Restaurar mech a 100% (sin cobrar)</button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 12, zIndex: 100, overflowY: 'auto',
    }}>{content}</div>
  );
}
