import { useState, useMemo } from 'react';
import { BY_LOOKUP, AMMO_BY_LOOKUP } from '@/lib/weapons';
import type { WeaponRule, AmmoRule } from '@/lib/weapons-types';

interface Props {
  techBase: string; // para filtrar (ej. baseMech.techBase)
  onAddEquipment: (item: { name: string; type: string; crits: number }) => void;
}

export function EquipmentPicker({ techBase, onAddEquipment }: Props) {
  const [filter, setFilter] = useState('');
  const [cat, setCat] = useState<'All' | 'Energy' | 'Ballistic' | 'Missile' | 'Ammunition'>('All');

  const items = useMemo(() => {
    const list: Array<{ name: string; type: string; crits: number; tons: number; tech: string; cat: string }> = [];
    
    // Armas y Equipo
    for (const w of Object.values(BY_LOOKUP) as WeaponRule[]) {
      if (techBase !== 'Mixed' && w.techBase !== techBase && (w.techBase as string) !== 'Mixed') continue; // Simplificación
      list.push({
        name: w.lookupName,
        type: w.weaponClass?.toLowerCase() || 'equipment',
        crits: w.numCrits,
        tons: w.tonnage,
        tech: w.techBase,
        cat: w.category
      });
    }

    // Munición
    for (const a of Object.values(AMMO_BY_LOOKUP) as AmmoRule[]) {
      if (techBase !== 'Mixed' && a.techBase !== techBase && (a.techBase as string) !== 'Mixed') continue;
      list.push({
        name: a.lookupName,
        type: 'ammunition',
        crits: 1, // Ammo general rule (algunas raras son más, ignorado para refits básicos)
        tons: a.tonnage,
        tech: a.techBase,
        cat: 'Ammunition'
      });
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [techBase]);

  const filtered = useMemo(() => {
    let f = items;
    if (cat !== 'All') f = f.filter(x => x.cat === cat || (cat === 'Ammunition' && x.type === 'ammunition'));
    if (filter) {
      const q = filter.toLowerCase();
      f = f.filter(x => x.name.toLowerCase().includes(q));
    }
    return f;
  }, [items, cat, filter]);

  return (
    <div className="flex flex-col h-full text-[10px]">
      <div className="flex flex-col gap-2 mb-3 shrink-0">
        <input 
          type="text" 
          placeholder="Buscar equipo..." 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-black/50 border border-cyan-800/50 px-2 py-1 text-cyan-400 outline-none focus:border-cyan-500 w-full"
        />
        <div className="flex flex-wrap gap-1">
          {['All', 'Energy', 'Ballistic', 'Missile', 'Ammunition'].map(c => (
            <button 
              key={c}
              onClick={() => setCat(c as any)}
              className={`px-2 py-1 border transition-colors ${
                cat === c ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-black/30 border-cyan-800/40 text-cyan-600 hover:bg-cyan-900/20'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
        {filtered.map(it => (
          <div key={it.name} className="flex flex-col bg-cyan-900/10 border border-cyan-800/30 p-1 hover:border-cyan-500/50 transition-colors group">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-300 truncate pr-2" title={it.name}>{it.name}</span>
              <button 
                onClick={() => onAddEquipment(it)}
                className="bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-800"
              >
                Añadir
              </button>
            </div>
            <div className="flex justify-between text-[9px] text-cyan-600 mt-1">
              <span>{it.tons}t</span>
              <span>{it.crits} crits</span>
              <span className="uppercase text-[8px] border border-cyan-800/40 px-1">{it.tech}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
