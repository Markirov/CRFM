import { X } from 'lucide-react';
import type { FuerzaSlot } from '@/lib/firebase-service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot: (slot: FuerzaSlot | null) => void;
  title?: string;
  message?: string;
}

export function SaveSlotModal({ isOpen, onClose, onSelectSlot, title = 'Guardar partida en curso', message = 'Tienes cambios sin guardar. ¿En qué slot deseas guardar la partida actual antes de continuar?' }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container-high border border-outline-variant/40 shadow-2xl w-full max-w-sm clip-chamfer animate-[fadeInUp_0.2s_ease]">
        <div className="flex justify-between items-center p-3 border-b border-outline-variant/20 bg-surface-container-highest">
          <h2 className="font-headline text-primary-container text-sm uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-secondary/60 hover:text-error transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="font-mono text-[11px] text-secondary/80 leading-relaxed">
            {message}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as FuerzaSlot[]).map(slot => (
              <button
                key={slot}
                onClick={() => onSelectSlot(slot)}
                className="py-3 border border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/30 text-amber-400 font-headline font-bold text-lg clip-chamfer transition-colors"
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-outline-variant/20 mt-4">
            <button
              onClick={() => onSelectSlot(null)}
              className="flex-1 py-2 font-mono text-[10px] uppercase tracking-widest text-error border border-error/40 hover:bg-error/10 transition-colors"
            >
              Descartar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
