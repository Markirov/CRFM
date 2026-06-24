import { useState, useMemo, useEffect } from 'react';
import { mechParseSSW } from '@/lib/parsers';
import { getWeaponStatsLogged, BY_LOOKUP, AMMO_BY_LOOKUP, mwLookup } from '@/lib/weapons';
import type { MechEditorState } from '@/lib/ssw-serializer';

export function useMechEditor(initialSswXml: string) {
  // 1. Cargar estado base (inmutable)
  const baseMech = useMemo(() => {
    return mechParseSSW(initialSswXml);
  }, [initialSswXml]);

  // 2. Extraer estado editable desde el XML original para prepoblar
  const [state, setState] = useState<MechEditorState>(() => {
    const doc = new DOMParser().parseFromString(initialSswXml, 'text/xml');
    const root = doc.querySelector('mech');

    // Armor
    const armorEl = root?.querySelector('armor');
    const armor = {
      HD: parseInt(armorEl?.querySelector('hd')?.textContent || '0'),
      CTf: parseInt(armorEl?.querySelector('ct')?.textContent || '0'),
      CTr: parseInt(armorEl?.querySelector('ctr')?.textContent || '0'),
      LTf: parseInt(armorEl?.querySelector('lt')?.textContent || '0'),
      LTr: parseInt(armorEl?.querySelector('ltr')?.textContent || '0'),
      RTf: parseInt(armorEl?.querySelector('rt')?.textContent || '0'),
      RTr: parseInt(armorEl?.querySelector('rtr')?.textContent || '0'),
      LA: parseInt(armorEl?.querySelector('la')?.textContent || '0'),
      RA: parseInt(armorEl?.querySelector('ra')?.textContent || '0'),
      LL: parseInt(armorEl?.querySelector('ll')?.textContent || '0'),
      RL: parseInt(armorEl?.querySelector('rl')?.textContent || '0'),
    };
    
    const armorType = armorEl?.querySelector('type')?.textContent || 'Standard Armor';

    // Heatsinks
    const hsEl = root?.querySelector('heatsinks');
    const hsLocations: { loc: string; count: number }[] = [];
    const locNodes = hsEl?.querySelectorAll('location') || [];
    locNodes.forEach(n => {
      const loc = n.textContent?.trim();
      if (!loc) return;
      const existing = hsLocations.find(l => l.loc === loc);
      if (existing) existing.count++;
      else hsLocations.push({ loc, count: 1 });
    });

    const heatsinks = {
      count: parseInt(hsEl?.getAttribute('number') || '10'),
      type: hsEl?.querySelector('type')?.textContent || 'Single',
      locations: hsLocations
    };

    // Equipment
    const equipment: MechEditorState['equipment'] = [];
    const eqNodes = root?.querySelectorAll(':scope > equipment, :scope > baseloadout > equipment') || [];
    eqNodes.forEach(n => {
      equipment.push({
        name: n.querySelector('name')?.textContent || '',
        type: n.querySelector('type')?.textContent || '',
        location: n.querySelector('location')?.textContent || 'CT'
      });
    });

    return { armor, armorType, heatsinks, equipment };
  });

  const [originalEqTons] = useState(() => {
    let t = 0;
    for (const eq of state.equipment) {
      const stats = getWeaponStatsLogged(eq.name) || Object.values(AMMO_BY_LOOKUP).find(a => a.lookupName === eq.name);
      const legacyStats = !stats ? mwLookup(eq.name) : null;
      if (stats) t += stats.tonnage;
      else if (legacyStats && 't' in legacyStats) t += legacyStats.t;
      else if (eq.type === 'ammunition') t += 1; // Fallback para ammo
    }
    return t;
  });

  const [originalEqCritsPerLoc] = useState(() => {
    const locs: Record<string, number> = { HD:0, CT:0, LT:0, RT:0, LA:0, RA:0, LL:0, RL:0 };
    for (const eq of state.equipment) {
      const stats = getWeaponStatsLogged(eq.name) || Object.values(AMMO_BY_LOOKUP).find(a => a.lookupName === eq.name);
      const legacyStats = !stats ? mwLookup(eq.name) : null;
      let crits = 1;
      if (stats && 'numCrits' in stats) crits = stats.numCrits;
      else if (legacyStats && 'c' in legacyStats) crits = legacyStats.c;
      
      if (locs[eq.location] !== undefined) locs[eq.location] += crits;
    }
    return locs;
  });

  const [originalEmptyCrits] = useState(() => {
    const locs: Record<string, number> = { HD:0, CT:0, LT:0, RT:0, LA:0, RA:0, LL:0, RL:0 };
    for (const loc of Object.keys(locs)) {
      const critsArray = baseMech?.crits?.[loc] || [];
      locs[loc] = critsArray.filter((s: string) => s === '-' || s === 'Empty').length;
    }
    return locs;
  });

  const currentEqTons = useMemo(() => {
    let t = 0;
    for (const eq of state.equipment) {
      const stats = getWeaponStatsLogged(eq.name) || Object.values(AMMO_BY_LOOKUP).find(a => a.lookupName === eq.name);
      const legacyStats = !stats ? mwLookup(eq.name) : null;
      if (stats) t += stats.tonnage;
      else if (legacyStats && 't' in legacyStats) t += legacyStats.t;
      else if (eq.type === 'ammunition') t += 1;
    }
    return t;
  }, [state.equipment]);

  const currentEqCritsPerLoc = useMemo(() => {
    const locs: Record<string, number> = { HD:0, CT:0, LT:0, RT:0, LA:0, RA:0, LL:0, RL:0 };
    for (const eq of state.equipment) {
      const stats = getWeaponStatsLogged(eq.name) || Object.values(AMMO_BY_LOOKUP).find(a => a.lookupName === eq.name);
      const legacyStats = !stats ? mwLookup(eq.name) : null;
      let crits = 1;
      if (stats && 'numCrits' in stats) crits = stats.numCrits;
      else if (legacyStats && 'c' in legacyStats) crits = legacyStats.c;
      
      if (locs[eq.location] !== undefined) locs[eq.location] += crits;
    }
    return locs;
  }, [state.equipment]);

  const freeCritsPerLoc = useMemo(() => {
    const locs: Record<string, number> = { HD:0, CT:0, LT:0, RT:0, LA:0, RA:0, LL:0, RL:0 };
    for (const loc of Object.keys(locs)) {
      locs[loc] = originalEmptyCrits[loc] + originalEqCritsPerLoc[loc] - currentEqCritsPerLoc[loc];
    }
    return locs;
  }, [originalEmptyCrits, originalEqCritsPerLoc, currentEqCritsPerLoc]);

  // Armor Tonnage Delta
  const [originalArmorPts] = useState(() => {
    return Object.values(state.armor).reduce((a, b) => a + b, 0);
  });
  
  const currentArmorPts = useMemo(() => {
    return Object.values(state.armor).reduce((a, b) => a + b, 0);
  }, [state.armor]);
  
  const armorTonsDelta = useMemo(() => {
    const isFF = state.armorType.includes('Ferro-Fibrous');
    const isClan = baseMech?.techBase === 'CL';
    const ptsPerTon = isFF ? (isClan ? 19.2 : 17.92) : 16;
    
    // Tonnage in SSW is rounded to nearest 0.5 tons (ceil)
    const originalTons = Math.ceil(originalArmorPts / ptsPerTon * 2) / 2;
    const currentTons = Math.ceil(currentArmorPts / ptsPerTon * 2) / 2;
    return currentTons - originalTons;
  }, [originalArmorPts, currentArmorPts, state.armorType, baseMech?.techBase]);

  const tonnageDelta = originalEqTons - currentEqTons - armorTonsDelta;

  return { baseMech, state, setState, tonnageDelta, freeCritsPerLoc };
}
