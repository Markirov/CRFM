// ══════════════════════════════════════════════════════════════
//  MechSourcePicker — Selector unificado de mechs para TallerPage.
//  Inspirado en UnitSlots del simulador: botones cuadrados con
//  iniciales/número, agrupados por origen (Hangar / Sim).
// ══════════════════════════════════════════════════════════════

import { Warehouse, Crosshair } from 'lucide-react';
import type { MechSource } from '@/lib/taller-sources';

interface Props {
  sources:     MechSource[];
  selectedKey: string | null;
  onSelect:    (key: string | null) => void;
}

export function MechSourcePicker({ sources, selectedKey, onSelect }: Props) {
  const hangarSources = sources.filter(s => s.origin === 'hangar');
  const simSources    = sources.filter(s => s.origin === 'sim');

  if (sources.length === 0) {
    return (
      <p className="font-mono text-[10px] text-secondary/50 italic">
        Sin mechs disponibles. Compra uno en /hangar o carga uno en el simulador.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* HANGAR (campaña) */}
      {hangarSources.length > 0 && (
        <Group
          icon={<Warehouse size={10} />}
          label={`Hangar (${hangarSources.length})`}
          accent="amber"
        >
          {hangarSources.map(s => (
            <SourceButton key={s.key} source={s} active={selectedKey === s.key} onSelect={onSelect} />
          ))}
        </Group>
      )}

      {/* SIM (slots cargados en sesión) */}
      {simSources.length > 0 && (
        <Group
          icon={<Crosshair size={10} />}
          label={`Simulador (${simSources.length})`}
          accent="green"
        >
          {simSources.map(s => (
            <SourceButton key={s.key} source={s} active={selectedKey === s.key} onSelect={onSelect} />
          ))}
        </Group>
      )}

      {/* Etiqueta del seleccionado */}
      {selectedKey && (() => {
        const selected = sources.find(s => s.key === selectedKey);
        if (!selected) return null;
        return (
          <div className="mt-2 pt-2 border-t border-outline-variant/30 font-mono text-[10px]">
            <span className="text-secondary/60 uppercase tracking-widest text-[8px]">
              Seleccionado:
            </span>{' '}
            <span className="text-primary-container font-bold">{selected.label}</span>
            <span className="text-secondary/50 ml-2">{selected.tons}t</span>
            {selected.pilotShort && (
              <span className="text-amber-400 ml-2">· {selected.pilotShort}</span>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────

function Group({
  icon, label, accent, children,
}: {
  icon: React.ReactNode;
  label: string;
  accent: 'amber' | 'green';
  children: React.ReactNode;
}) {
  const colorClass = accent === 'amber'
    ? 'text-amber-400/70'
    : 'text-green-400/70';
  return (
    <div>
      <div className={`flex items-center gap-1 mb-1 font-mono text-[8px] uppercase tracking-widest ${colorClass}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1 bg-surface-container-low p-1 clip-chamfer">
        {children}
      </div>
    </div>
  );
}

function SourceButton({
  source, active, onSelect,
}: {
  source: MechSource;
  active: boolean;
  onSelect: (key: string | null) => void;
}) {
  const accentClasses = source.accent === 'amber'
    ? active
      ? 'bg-amber-400 text-on-primary border-amber-400'
      : 'border-amber-400/40 text-amber-400 hover:bg-amber-400/15'
    : active
      ? 'bg-green-400 text-on-primary border-green-400'
      : 'border-green-400/40 text-green-400 hover:bg-green-400/15';

  return (
    <button
      onClick={() => onSelect(active ? null : source.key)}
      title={`${source.label} · ${source.tons}t${source.pilotShort ? ` · ${source.pilotShort}` : ''}`}
      className={`relative w-9 h-9 flex items-center justify-center font-mono text-[11px] font-bold border transition-all ${accentClasses}`}
    >
      {source.shortLabel}
    </button>
  );
}
