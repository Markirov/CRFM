import { useState, useEffect } from 'react';
import type { Pilot } from '@/lib/barracones-types';
import { T } from '@/lib/theme';
import { ShieldAlert, Info, DollarSign } from 'lucide-react';
import { CalculadoraProgresionRPG } from './CalculadoraProgresionRPG';
import { useAppStore } from '@/lib/store';
function SecondaryBtn({ children, onClick, style }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', background: 'transparent',
        border: `1px solid ${T.outlineV}`, color: T.outline,
        fontFamily: '"Share Tech Mono", monospace', fontSize: 13,
        letterSpacing: 1.5, textTransform: 'uppercase',
        cursor: 'pointer', ...style
      }}
      onMouseOver={e => { e.currentTarget.style.color = T.cream; e.currentTarget.style.borderColor = T.cream; }}
      onMouseOut={e => { e.currentTarget.style.color = T.outline; e.currentTarget.style.borderColor = T.outlineV; }}
    >{children}</button>
  );
}

function PrimaryBtn({ children, onClick, disabled, style }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '6px 14px', background: disabled ? T.surfaceLow : T.surface,
        border: `1px solid ${disabled ? T.outlineV : T.cream}`,
        color: disabled ? T.outline : T.cream,
        fontFamily: '"Share Tech Mono", monospace', fontSize: 13,
        letterSpacing: 1.5, textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 0 10px ${T.cream}20`,
        ...style
      }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 0 15px ${T.cream}40`; }}
      onMouseOut={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 0 10px ${T.cream}20`; }}
    >{children}</button>
  );
}
interface FinanzasPanelProps {
  pilot: Pilot;
  onSetPatrimonio?: (v: number) => void;
  onSetEquipoPersonal?: (v: string) => void;
  onSetRpgFinanzas?: (v: Partial<NonNullable<Pilot['rpgFinanzas']>>) => void;
  onSaveFirebase?: (p: Pilot) => void;
}

export function FinanzasPanel({ pilot, onSetPatrimonio, onSetEquipoPersonal, onSetRpgFinanzas, onSaveFirebase }: FinanzasPanelProps) {
  const [patrimonio, setPatrimonio] = useState(pilot.patrimonio?.toString() || '0');
  const [equipo, setEquipo] = useState(pilot.equipoPersonal || '');
  const [saving, setSaving] = useState(false);
  const userRole = useAppStore(s => s.userRole);
  const canEditFinanzas = userRole === 'admin' || userRole === 'dm';

  // Sync state if pilot changes externally
  useEffect(() => {
    setPatrimonio(pilot.patrimonio?.toString() || '0');
    setEquipo(pilot.equipoPersonal || '');
  }, [pilot.id, pilot.patrimonio, pilot.equipoPersonal]);

  const handleSave = () => {
    setSaving(true);
    const parsedPatrimonio = parseInt(patrimonio.replace(/\D/g, ''), 10) || 0;
    if (onSetPatrimonio) onSetPatrimonio(parsedPatrimonio);
    if (onSetEquipoPersonal) onSetEquipoPersonal(equipo);
    
    if (onSaveFirebase) {
      const updatedPilot = { ...pilot, patrimonio: parsedPatrimonio, equipoPersonal: equipo };
      onSaveFirebase(updatedPilot);
    }
    
    setTimeout(() => setSaving(false), 600);
  };

  const fmtCbills = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    return new Intl.NumberFormat('es-ES').format(num) + ' ₡';
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeInUp_0.3s_ease]">
      {/* Disclaimer / Info */}
      <div className="flex gap-4 p-4 rounded bg-surface-container border border-outline-variant/30">
        <Info size={24} color={T.gold} className="shrink-0 mt-1" />
        <div className="text-[13px] text-secondary/90 font-sans leading-relaxed">
          <strong className="text-primary-container">Finanzas y Patrimonio Personal.</strong> Este panel es exclusivo para llevar el control del dinero y equipo privado del comandante o piloto. 
          Estos fondos <strong>no se restan ni suman a la Tesorería de la Unidad</strong>. Úsalo para gestionar la cuenta de ahorro personal, beneficios del 25%, y cualquier mech o equipo adquirido a título individual.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patrimonio en C-Bills */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="font-headline text-[11px] font-bold text-outline uppercase tracking-[2px]">
            Cuenta Personal
          </div>
          <div className="flex items-center gap-3 bg-[#111] border border-outline-variant/50 px-4 py-3 rounded">
            <DollarSign size={20} color={T.greenDeep} />
            <input
              type="text"
              value={fmtCbills(patrimonio)}
              disabled={!canEditFinanzas}
              onChange={(e) => {
                setPatrimonio(e.target.value);
                const parsed = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                if (onSetPatrimonio) onSetPatrimonio(parsed);
              }}
              className={`bg-transparent border-none text-2xl font-mono ${canEditFinanzas ? 'text-green-400' : 'text-green-400/50'} font-bold outline-none w-full text-right`}
            />
          </div>
          <div className="text-[10px] text-outline font-mono text-right mt-1">
            (C-Bills personales)
          </div>
        </div>

        {/* Equipo Personal */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="font-headline text-[11px] font-bold text-outline uppercase tracking-[2px]">
            Inventario y Notas del Comandante
          </div>
          <textarea
            value={equipo}
            onChange={(e) => {
              setEquipo(e.target.value);
              if (onSetEquipoPersonal) onSetEquipoPersonal(e.target.value);
            }}
            placeholder="Ej: 
- 1x BattleMech Privado (Centurion CN9-A)
- Equipo de enfriamiento personal
- Contactos en el mercado negro"
            className="w-full h-48 bg-[#111] border border-outline-variant/50 rounded p-4 text-[13px] text-cream-hi font-mono leading-relaxed outline-none focus:border-gold/50 transition-colors resize-y"
          />
        </div>
      </div>

      {onSetRpgFinanzas && (
        <div className="relative">
          {!canEditFinanzas && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="flex flex-col items-center bg-surface-container/90 border border-outline-variant/30 p-4 rounded text-center">
                <ShieldAlert size={24} color={T.outline} className="mb-2" />
                <div className="text-[12px] text-secondary font-mono">Panel RPG bloqueado</div>
                <div className="text-[10px] text-outline mt-1 max-w-[200px]">Solo el DM puede modificar los ingresos canon.</div>
              </div>
            </div>
          )}
          <CalculadoraProgresionRPG 
            pilot={pilot} 
            onUpdateFinanzas={onSetRpgFinanzas} 
            onAddPatrimonio={(amount) => {
              const current = parseInt(patrimonio.replace(/\D/g, ''), 10) || 0;
              const nuevoTotal = current + amount;
              setPatrimonio(nuevoTotal.toString());
              if (onSetPatrimonio) onSetPatrimonio(nuevoTotal);
              
              if (onSaveFirebase) {
                onSaveFirebase({ ...pilot, patrimonio: nuevoTotal });
              }
            }} 
          />
        </div>
      )}

      {/* Botonera Guardar */}
      {canEditFinanzas && (
        <div className="flex justify-end pt-4 border-t border-outline-variant/20">
          <PrimaryBtn onClick={handleSave} disabled={saving}>
            {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS FINANCIEROS'}
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}
