import { Upload, Lock } from 'lucide-react';

interface Props {
  slotNames:    string[];
  slotCount:    number;
  activeIndex:  number;
  onSelectIndex: (i: number) => void;
  onFileUpload:  (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Labels cortos (1-3 chars) para mostrar dentro del boton.
   *  Si undefined o vacio en idx, se muestra idx+1. */
  shortLabels?: (string | undefined)[];
  /** Slots bloqueados (modo campaña con mech del hangar fijado). */
  lockedSlots?: boolean[];
  /** Índices específicos a mostrar (para ocultar slots vacíos) */
  visibleIndices?: number[];
  /** Acción para añadir un slot (modo libre) */
  onAddSlot?: () => void;
  /** Límite de slots para ocultar el botón + */
  maxSlots?: number;
}

export function UnitSlots({ slotNames, slotCount, activeIndex, onSelectIndex, onFileUpload, shortLabels, lockedSlots, visibleIndices, onAddSlot, maxSlots }: Props) {
  const activeLocked = lockedSlots?.[activeIndex] === true;
  
  const indices = visibleIndices ?? Array.from({ length: slotCount }, (_, i) => i);
  // Dividir slots en 2 grupos para wrap controlado en tablet portrait
  const half = Math.ceil(indices.length / 2);
  const groupA = indices.slice(0, half);
  const groupB = indices.slice(half);

  const slotBtn = (idx: number) => {
    const locked = lockedSlots?.[idx] === true;
    return (
      <button key={idx} onClick={() => onSelectIndex(idx)}
        className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-mono text-[10px] sm:text-xs transition-all relative group shrink-0 ${
          activeIndex === idx ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-secondary/20'
        }`}
      >
        {shortLabels?.[idx] || idx + 1}
        {locked && (
          <Lock size={8} className="absolute -top-0.5 -right-0.5 text-amber-400" strokeWidth={3} />
        )}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface-container-highest text-primary px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-primary/20 shadow-xl">
          {slotNames[idx]}{locked ? ' · 🔒 hangar' : ''}
        </div>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">

      {/* Grupo A */}
      {groupA.length > 0 && (
        <div className="flex bg-surface-container-low p-0.5 sm:p-1 clip-chamfer gap-0.5 sm:gap-1 shrink-0">
          {groupA.map(slotBtn)}
        </div>
      )}

      {/* Grupo B */}
      {groupB.length > 0 && (
        <div className="flex bg-surface-container-low p-0.5 sm:p-1 clip-chamfer gap-0.5 sm:gap-1 shrink-0">
          {groupB.map(slotBtn)}
        </div>
      )}

      {/* Botón Añadir */}
      {onAddSlot && (!maxSlots || slotCount < maxSlots) && (
        <button
          onClick={onAddSlot}
          className="w-6 h-6 sm:w-8 sm:h-8 bg-surface-container-low hover:bg-surface-container-high text-primary-container clip-chamfer flex items-center justify-center font-mono transition-all shrink-0"
          title="Añadir Slot"
        >
          +
        </button>
      )}

      {/* Upload */}
      <label
        className={`p-1 sm:p-2 transition-all shrink-0 ${
          activeLocked
            ? 'text-outline-variant/40 cursor-not-allowed'
            : 'text-primary-container hover:bg-primary-container/10 cursor-pointer'
        }`}
        title={activeLocked ? 'Slot bloqueado — mech del hangar' : 'Cargar archivo'}
      >
        {activeLocked
          ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
          : <Upload className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />}
        <input
          type="file"
          accept=".ssw,.mtf,.saw"
          className="hidden"
          disabled={activeLocked}
          onChange={onFileUpload}
        />
      </label>
    </div>
  );
}
