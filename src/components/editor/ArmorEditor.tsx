import type { MechEditorState } from '@/lib/ssw-serializer';

interface Props {
  baseMech: any;
  state: MechEditorState;
  onChangeArmor: (loc: keyof MechEditorState['armor'], value: number) => void;
}

export function ArmorEditor({ baseMech, state, onChangeArmor }: Props) {
  // Configuración de máximos basados en la estructura (Internal Structure)
  // Max Armor = IS * 2 (salvo cabeza que es siempre 9 de max armor para IS=3)
  const is = baseMech.is;
  
  const locs = [
    { key: 'HD', label: 'Cabeza', is: is.HD, max: 9, f: state.armor.HD },
    { key: 'CTf', label: 'Torso Central', is: is.CT, max: is.CT * 2, f: state.armor.CTf, r: state.armor.CTr },
    { key: 'LTf', label: 'Torso Izquierdo', is: is.LT, max: is.LT * 2, f: state.armor.LTf, r: state.armor.LTr },
    { key: 'RTf', label: 'Torso Derecho', is: is.RT, max: is.RT * 2, f: state.armor.RTf, r: state.armor.RTr },
    { key: 'LA', label: 'Brazo Izquierdo', is: is.LA, max: is.LA * 2, f: state.armor.LA },
    { key: 'RA', label: 'Brazo Derecho', is: is.RA, max: is.RA * 2, f: state.armor.RA },
    { key: 'LL', label: 'Pierna Izquierda', is: is.LL, max: is.LL * 2, f: state.armor.LL },
    { key: 'RL', label: 'Pierna Derecha', is: is.RL, max: is.RL * 2, f: state.armor.RL },
  ];

  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="bg-cyan-950/40 px-2 py-1 flex justify-between font-bold text-orange-400 uppercase tracking-widest border border-cyan-800/40">
        <span>Localización</span>
        <span>Armadura</span>
      </div>
      
      {locs.map(l => {
        const hasRear = l.r !== undefined;
        const totalArmor = l.f + (l.r || 0);
        const overMax = totalArmor > l.max;
        
        return (
          <div key={l.key} className={`border border-cyan-900/30 bg-black/30 px-2 py-1.5 flex flex-col gap-1 ${overMax ? 'bg-red-500/10 border-red-500/50' : ''}`}>
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-bold">{l.label}</span>
              <span className="text-[9px] text-cyan-600">IS: {l.is} / Max: {l.max}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 flex-1">
                {hasRear && <span className="text-cyan-600 w-3">F</span>}
                <input 
                  type="number" 
                  min="0" 
                  max={l.max}
                  value={l.f}
                  onChange={e => onChangeArmor(l.key as keyof MechEditorState['armor'], parseInt(e.target.value) || 0)}
                  className="w-full bg-cyan-900/20 border border-cyan-800/50 px-1 py-0.5 text-center font-mono focus:border-orange-500 outline-none text-cyan-400"
                />
              </div>
              
              {hasRear && (
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-cyan-600 w-3">R</span>
                  <input 
                    type="number" 
                    min="0" 
                    max={l.max}
                    value={l.r}
                    onChange={e => onChangeArmor(l.key.replace('f', 'r') as keyof MechEditorState['armor'], parseInt(e.target.value) || 0)}
                    className="w-full bg-cyan-900/20 border border-cyan-800/50 px-1 py-0.5 text-center font-mono focus:border-orange-500 outline-none text-cyan-400"
                  />
                </div>
              )}
            </div>
            {overMax && (
              <span className="text-red-500 text-[8px] uppercase tracking-wider text-right">¡Supera el máximo! ({totalArmor})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
