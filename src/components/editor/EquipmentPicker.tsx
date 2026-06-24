import { useState, useMemo } from 'react';
import { BY_LOOKUP, AMMO_BY_LOOKUP } from '@/lib/weapons';
import type { WeaponRule, AmmoRule } from '@/lib/weapons-types';

interface Props {
  techBase: string; // baseMech.techBase: "Inner Sphere"|"Clan"|"Mixed"|"IS"|"CL"
  strictTech?: boolean; // true = solo techBase del mech; false = libre (todos)
  onAddEquipment: (item: { name: string; type: string; crits: number; location?: string }) => void;
}

// Normaliza "Inner Sphere"/"IS" → 'IS', "Clan"/"CL" → 'CL'
function normalizeTech(s: string): 'IS' | 'CL' | 'Mixed' | string {
  const t = (s || '').trim();
  if (t === 'IS' || t === 'CL' || t === 'Mixed') return t;
  const low = t.toLowerCase();
  if (low.startsWith('inner')) return 'IS';
  if (low === 'clan' || low.startsWith('clan')) return 'CL';
  if (low.startsWith('mix')) return 'Mixed';
  return t;
}

export function EquipmentPicker({ techBase, strictTech = true, onAddEquipment }: Props) {
  const [filter, setFilter] = useState('');
  const [cat, setCat] = useState<'All' | 'Energy' | 'Ballistic' | 'Missile' | 'Ammunition'>('All');

  const techN = normalizeTech(techBase);

  const items = useMemo(() => {
    const list: Array<{ name: string; type: string; crits: number; tons: number; tech: string; cat: string }> = [];

    const pass = (tb: string) => {
      if (!strictTech) return true;
      if (techN === 'Mixed') return true;
      return tb === techN;
    };

    // Armas y Equipo
    for (const w of Object.values(BY_LOOKUP) as WeaponRule[]) {
      if (!pass(w.techBase)) continue;
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
      if (!pass(a.techBase)) continue;
      list.push({
        name: a.lookupName,
        type: 'ammunition',
        crits: 1,
        tons: a.tonnage,
        tech: a.techBase,
        cat: 'Ammunition'
      });
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [techN, strictTech]);

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
        {filtered.length === 0 && (
          <div className="text-cyan-700 text-[10px] italic p-2 border border-cyan-900/30 bg-cyan-950/20">
            Sin resultados ({strictTech ? `filtro estricto ${techN}` : 'libre'}). Cambia búsqueda o categoría.
          </div>
        )}
        {filtered.map(it => (
          <ItemRow key={it.name} it={it} onAdd={onAddEquipment} />
        ))}
      </div>
    </div>
  );
}

const LOCS = ['HD','CT','LT','RT','LA','RA','LL','RL'] as const;

function ItemRow({ it, onAdd }: { it: { name: string; type: string; crits: number; tons: number; tech: string; cat: string }; onAdd: (item: { name: string; type: string; crits: number; location?: string }) => void }) {
  const [loc, setLoc] = useState<string>('CT');
  return (
    <div className="flex flex-col bg-cyan-900/10 border border-cyan-800/30 p-1 hover:border-cyan-500/50 transition-colors">
      <div className="flex justify-between items-start gap-1">
        <span className="font-bold text-slate-300 truncate pr-1 flex-1" title={it.name}>{it.name}</span>
        <select
          value={loc}
          onChange={e => setLoc(e.target.value)}
          className="bg-black/50 border border-cyan-800/50 text-cyan-400 text-[9px] px-1 py-0.5 outline-none focus:border-cyan-500"
        >
          {LOCS.map(L => <option key={L} value={L}>{L}</option>)}
        </select>
        <button
          onClick={() => onAdd({ name: it.name, type: it.type, crits: it.crits, location: loc })}
          className="bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 hover:bg-cyan-800"
        >
          +
        </button>
      </div>
      <div className="flex justify-between text-[9px] text-cyan-600 mt-1">
        <span>{it.tons}t</span>
        <span>{it.crits} crits</span>
        <span className="uppercase text-[8px] border border-cyan-800/40 px-1">{it.tech}</span>
      </div>
    </div>
  );
}
