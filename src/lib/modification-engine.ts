// ══════════════════════════════════════════════════════════════
//  modification-engine.ts — Diff de loadout (mod aprobada → aplicar)
//
//  Entrada: dos SSW (anterior y nuevo).
//  Salida: lista de operaciones almacenables (remover/instalar/mover)
//  + tiempo total + coste total (canon diff).
//
//  Reglas (canon CamOps + reglas de la casa):
//   · 240 min por arma desmontada o instalada (120 desmontar + 120 montar).
//   · Mover de loc → 240 min (cuenta como 1 desmonte + 1 montaje).
//   · Coste = max(0, costeCanonNuevo - costeCanonAntiguo) por componente.
//   · Equipo desmontado → almacén tech split key.
//   · Equipo instalado → consume almacén; si no hay stock → compra ton extra.
// ══════════════════════════════════════════════════════════════

import { mechParseSSW } from './parsers';
import { getWeaponStatsLogged, AMMO_BY_LOOKUP } from './weapons';
import { equipmentKey, type EquipTech } from './almacen-keys';

const MIN_PER_INSTALL = 120;
const MIN_PER_UNINSTALL = 120;
const MIN_PER_MOVE = 240;

export interface ModSlot {
  name:      string;
  location:  string;
  type?:     string;
}

export interface ModificationDiff {
  removed:   ModSlot[];   // estaban antes, no están ahora
  added:     ModSlot[];   // estaban ahora, no antes
  moved:     Array<{ name: string; from: string; to: string }>;
  timeMin:   number;
  costoDiff: number;      // ₡ (suma diferencias canon)
  techBase:  EquipTech;
}

function inferTech(raw: string): EquipTech {
  const m = /<techbase>([^<]+)<\/techbase>/i.exec(raw);
  if (!m) return 'Any';
  const v = m[1].toLowerCase();
  if (v.startsWith('clan')) return 'CL';
  if (v.startsWith('inner')) return 'IS';
  return 'Any';
}

function extractEquipment(raw: string): ModSlot[] {
  const out: ModSlot[] = [];
  try {
    const doc = new DOMParser().parseFromString(raw, 'text/xml');
    const root = doc.querySelector('mech');
    const nodes = root?.querySelectorAll(':scope > equipment, :scope > baseloadout > equipment') || [];
    nodes.forEach(n => {
      const name = n.querySelector('name')?.textContent?.trim() || '';
      const loc  = n.querySelector('location')?.textContent?.trim() || 'CT';
      const tp   = n.querySelector('type')?.textContent?.trim() || undefined;
      if (name) out.push({ name, location: loc, type: tp });
    });
  } catch {
    // Fallback: parser de mech estándar
    try {
      const parsed = mechParseSSW(raw);
      const weapons = parsed?.weapons || [];
      weapons.forEach((w: any) => {
        out.push({ name: w.name || w.lookupName || '', location: w.location || 'CT', type: 'weapon' });
      });
    } catch { /* swallow */ }
  }
  return out;
}

function canonPrice(name: string): number {
  const w = getWeaponStatsLogged(name);
  if (w && typeof (w as any).cost === 'number') return (w as any).cost;
  const ammo = Object.values(AMMO_BY_LOOKUP).find(a => a.lookupName === name);
  if (ammo && typeof (ammo as any).cost === 'number') return (ammo as any).cost;
  return 0;
}

/** Genera diff legible entre dos SSW. */
export function diffSswLoadouts(rawOld: string, rawNew: string): ModificationDiff {
  const oldEq = extractEquipment(rawOld);
  const newEq = extractEquipment(rawNew);

  // Sets ponderados (mismo nombre repetido)
  const keyOf = (s: ModSlot) => `${s.name}@${s.location}`;
  const oldByKey = new Map<string, number>();
  oldEq.forEach(s => oldByKey.set(keyOf(s), (oldByKey.get(keyOf(s)) ?? 0) + 1));
  const newByKey = new Map<string, number>();
  newEq.forEach(s => newByKey.set(keyOf(s), (newByKey.get(keyOf(s)) ?? 0) + 1));

  // Detecta movimientos (mismo nombre, distinta loc, count balanceado)
  const oldByName = new Map<string, ModSlot[]>();
  oldEq.forEach(s => {
    const arr = oldByName.get(s.name) ?? [];
    arr.push(s);
    oldByName.set(s.name, arr);
  });
  const newByName = new Map<string, ModSlot[]>();
  newEq.forEach(s => {
    const arr = newByName.get(s.name) ?? [];
    arr.push(s);
    newByName.set(s.name, arr);
  });

  const moved: ModificationDiff['moved'] = [];
  const removed: ModSlot[] = [];
  const added: ModSlot[] = [];

  // Por cada nombre que aparece en ambos sets, empareja por loc → resto son movimientos
  const allNames = new Set([...oldByName.keys(), ...newByName.keys()]);
  for (const name of allNames) {
    const oldArr = [...(oldByName.get(name) ?? [])];
    const newArr = [...(newByName.get(name) ?? [])];
    // 1. Empareja por misma loc
    for (let i = oldArr.length - 1; i >= 0; i--) {
      const idx = newArr.findIndex(n => n.location === oldArr[i].location);
      if (idx >= 0) {
        oldArr.splice(i, 1);
        newArr.splice(idx, 1);
      }
    }
    // 2. Empareja restos como movimiento (mismo nombre, distinta loc)
    while (oldArr.length && newArr.length) {
      const o = oldArr.shift()!;
      const n = newArr.shift()!;
      moved.push({ name, from: o.location, to: n.location });
    }
    // 3. Restantes son remove/add
    removed.push(...oldArr);
    added.push(...newArr);
  }

  const timeMin =
    removed.length * MIN_PER_UNINSTALL +
    added.length * MIN_PER_INSTALL +
    moved.length * MIN_PER_MOVE;

  // Coste diff: suma precios canon de añadidos − suma canon removidos.
  // No descontar < 0; equipo recuperado va al almacén (valor reusable).
  const costAdded   = added.reduce((acc, s) => acc + canonPrice(s.name), 0);
  const costRemoved = removed.reduce((acc, s) => acc + canonPrice(s.name), 0);
  const costoDiff   = Math.max(0, costAdded - costRemoved);

  return {
    removed,
    added,
    moved,
    timeMin,
    costoDiff,
    techBase: inferTech(rawNew),
  };
}

/**
 * Calcula impactos en almacén al aplicar la mod:
 *   removed → stock+1 cada (tech-split key)
 *   added   → consume stock-1 si hay; si no, "compra" (factura aparte)
 */
export function applyModToAlmacen(
  almacen: Record<string, number>,
  diff: ModificationDiff,
): { newAlmacen: Record<string, number>; comprasNecesarias: Array<{ key: string; name: string; count: number }> } {
  const next = { ...almacen };
  const tech: EquipTech = diff.techBase === 'Any' ? 'Any' : diff.techBase;

  // Devolver desmontados al almacén
  for (const r of diff.removed) {
    const k = equipmentKey(r.name, tech);
    if (!k) continue;
    next[k] = (next[k] ?? 0) + 1;
  }

  // Consumir instalados; lo que falte → compra
  const compras = new Map<string, number>();
  for (const a of diff.added) {
    const k = equipmentKey(a.name, tech);
    if (!k) continue;
    const cur = next[k] ?? 0;
    if (cur > 0) {
      next[k] = cur - 1;
    } else {
      compras.set(k, (compras.get(k) ?? 0) + 1);
    }
  }

  const comprasNecesarias = Array.from(compras.entries()).map(([key, count]) => {
    const m = /^(.+?)\s*\((IS|CL)\)\s*$/i.exec(key);
    return { key, name: m ? m[1] : key, count };
  });

  return { newAlmacen: next, comprasNecesarias };
}
