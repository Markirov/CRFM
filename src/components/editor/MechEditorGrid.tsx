import { useState } from 'react';
import type { MechEditorState } from '@/lib/ssw-serializer';
import { getWeaponStatsLogged, AMMO_BY_LOOKUP, mwLookup } from '@/lib/weapons';

interface Props {
  baseMech: any;
  state: MechEditorState;
  freeCritsPerLoc: Record<string, number>;
  onRemoveEquipment: (idx: number) => void;
}

const LOCS = [
  { key: 'LA', label: 'Brazo Izquierdo' },
  { key: 'HD', label: 'Cabeza' },
  { key: 'RA', label: 'Brazo Derecho' },
  { key: 'LT', label: 'Torso Izquierdo' },
  { key: 'CT', label: 'Torso Central' },
  { key: 'RT', label: 'Torso Derecho' },
  { key: 'LL', label: 'Pierna Izquierda' },
  { key: 'RL', label: 'Pierna Derecha' },
];

export function MechEditorGrid({ baseMech, state, freeCritsPerLoc, onRemoveEquipment }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {LOCS.map(loc => {
        // En SSW un slot normal de localización tiene 12 huecos, piernas y cabeza 6.
        const totalSlots = loc.key === 'HD' || loc.key === 'LL' || loc.key === 'RL' ? 6 : 12;
        
        // Extraemos qué equipo está en esta localización
        const items = state.equipment
          .map((eq, i) => ({ ...eq, idx: i }))
          .filter(eq => eq.location === loc.key);
          
        const free = freeCritsPerLoc[loc.key] ?? 0;
        const isOver = free < 0;
        
        return (
          <div key={loc.key} className={`border ${isOver ? 'border-red-500 bg-red-500/10' : 'border-cyan-900/40 bg-black/50'} flex flex-col text-[10px]`}>
            <div className={`font-headline font-bold uppercase tracking-widest px-2 py-1 border-b border-cyan-900/40 flex justify-between ${isOver ? 'bg-red-500/20 text-red-500' : 'bg-cyan-950/40 text-orange-400'}`}>
              <span>{loc.label}</span>
              <span className={isOver ? 'text-red-500 font-bold' : 'text-cyan-600'}>
                {free} libres
              </span>
            </div>
            
            <div className="p-1 flex-1 flex flex-col gap-1 min-h-[100px]">
              {items.length === 0 && <span className="text-cyan-600/40 italic p-1">Vacío</span>}
              {items.map(it => {
                const stats = getWeaponStatsLogged(it.name) || Object.values(AMMO_BY_LOOKUP).find(a => a.lookupName === it.name);
                const legacyStats = !stats ? mwLookup(it.name) : null;
                const isAmmo = it.type === 'ammunition';
                let crits = 1;
                if (stats && 'numCrits' in stats) crits = stats.numCrits;
                else if (legacyStats && 'c' in legacyStats) crits = legacyStats.c;
                
                return (
                  <div key={it.idx} className="flex items-center justify-between bg-cyan-900/20 border border-cyan-800/30 px-1.5 py-1">
                    <span className="truncate flex-1 font-mono text-cyan-400">{it.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-600 text-[8px] border border-cyan-800/20 px-1">[{crits}]</span>
                      <button 
                        onClick={() => onRemoveEquipment(it.idx)}
                        className="text-red-500/50 hover:text-red-400 transition-colors"
                        title="Desinstalar"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
