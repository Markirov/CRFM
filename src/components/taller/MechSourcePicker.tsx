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

  const selected = selectedKey ? sources.find(s => s.key === selectedKey) ?? null : null;

  return (
    <div className="space-y-2">
      {/* HANGAR ordenado como Simulador */}
      {hangarSources.length > 0 && (
        <Group
          icon={<Warehouse size={10} />}
          label={`Hangar (${hangarSources.length})`}
          accent="amber"
          selectedName={selected?.origin === 'hangar' ? selected.label : null}
          selectedTons={selected?.origin === 'hangar' ? selected.tons : null}
          selectedPilot={selected?.origin === 'hangar' ? selected.pilotShort : null}
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
          selectedName={selected?.origin === 'sim' ? selected.label : null}
          selectedTons={selected?.origin === 'sim' ? selected.tons : null}
          selectedPilot={selected?.origin === 'sim' ? selected.pilotShort : null}
        >
          {simSources.map(s => (
            <SourceButton key={s.key} source={s} active={selectedKey === s.key} onSelect={onSelect} />
          ))}
        </Group>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────

function Group({
  icon, label, accent, children, selectedName, selectedTons, selectedPilot,
}: {
  icon: React.ReactNode;
  label: string;
  accent: 'amber' | 'green';
  children: React.ReactNode;
  selectedName?: string | null;
  selectedTons?: number | null;
  selectedPilot?: string | null;
}) {
  const colorClass = accent === 'amber' ? 'text-amber-400/70' : 'text-green-400/70';
  const nameClass = accent === 'amber' ? 'text-amber-400' : 'text-green-400';
  return (
    <div>
      <div className={`flex items-center gap-1 mb-1 font-mono text-[8px] uppercase tracking-widest ${colorClass}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3 bg-surface-container-low p-1 clip-chamfer">
        <div className="flex flex-wrap gap-1 shrink-0">
          {children}
        </div>
        {selectedName && (
          <div className="flex-1 min-w-0 pl-2 border-l border-outline-variant/30">
            <div className={`font-headline text-lg font-black truncate ${nameClass}`}>
              {selectedName}
            </div>
            <div className="font-mono text-[10px] text-secondary/60 mt-0.5">
              {selectedTons}t{selectedPilot ? ` · ${selectedPilot}` : ''}
            </div>
          </div>
        )}
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
