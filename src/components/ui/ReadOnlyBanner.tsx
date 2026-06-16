// src/components/ui/ReadOnlyBanner.tsx
// ═══════════════════════════════════════════════════════════════
//  Banner que aparece en la parte superior de una página
//  cuando el usuario tiene solo lectura en esa sección.
//
//  Uso:
//    <ReadOnlyBanner readOnly={readOnly} />
// ═══════════════════════════════════════════════════════════════

import { EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const ROLE_LABEL: Record<string, string> = {
  dm: 'Director',
  pj: 'Piloto',
};

interface Props {
  readOnly: boolean;
  sectionLabel?: string;
}

export function ReadOnlyBanner({ readOnly, sectionLabel }: Props) {
  const { userRole } = useAppStore();
  if (!readOnly) return null;

  const roleLabel = userRole ? (ROLE_LABEL[userRole] ?? userRole) : 'Sin rol';

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/5 border-b border-amber-400/20 font-mono text-[10px] text-amber-400 uppercase tracking-widest shrink-0">
      <EyeOff size={11} className="shrink-0" />
      <span>
        Modo lectura
        {sectionLabel ? ` · ${sectionLabel}` : ''}
        {' · '}Rol: {roleLabel}
        {' · '}Los cambios no se guardan
      </span>
    </div>
  );
}
