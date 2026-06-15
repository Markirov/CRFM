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
}

export function UnitSlots({ slotNames, slotCount, activeIndex, onSelectIndex, onFileUpload, shortLabels, lockedSlots }: Props) {
  const activeLocked = lockedSlots?.[activeIndex] === true;
  // Dividir slots en 2 grupos para wrap controlado en tablet portrait
  // Grupo A: 1..mitad ; Grupo B: mitad+1..N
  const half = Math.ceil(slotCount / 2);
  const groupA = Array.from({ length: half }, (_, i) => i);
  const groupB = Array.from({ length: slotCount - half }, (_, i) => i + half);

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

      {/* Grupo A: slots 1..half */}
      <div className="flex bg-surface-container-low p-0.5 sm:p-1 clip-chamfer gap-0.5 sm:gap-1 shrink-0">
        {groupA.map(slotBtn)}
      </div>

      {/* Grupo B: slots half+1..N */}
      {groupB.length > 0 && (
        <div className="flex bg-surface-container-low p-0.5 sm:p-1 clip-chamfer gap-0.5 sm:gap-1 shrink-0">
          {groupB.map(slotBtn)}
        </div>
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
