// House rules toggles globales.
// Cada regla canon que altera comportamiento debe consultarse aquí antes de aplicarse.
// Persistencia: localStorage (per-cliente, no Firestore). Se podría sincronizar al
// SecretMenu config en el futuro si interesa estado compartido entre DMs.

import { useEffect, useState } from 'react';

export interface HouseRules {
  /** Agrupador de daño misiles (secuencia 5/6/4/3/2/1). Por arma cluster. */
  damage_grouper: boolean;
  /** RAC casa: tirada cadencia separada, drop tier en 2. */
  rac_cadence_drop: boolean;
  /** Inferno SRM + Flamer heat mode: 1d6 calor al target (en vez de +2 fijo). */
  inferno_flamer_d6: boolean;
}

const STORAGE_KEY = 'kk_house_rules';

const DEFAULTS: HouseRules = {
  damage_grouper: true,
  rac_cadence_drop: true,
  inferno_flamer_d6: true,
};

let cached: HouseRules | null = null;
const listeners = new Set<(r: HouseRules) => void>();

function load(): HouseRules {
  if (cached) return cached;
  let next: HouseRules;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    next = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    next = { ...DEFAULTS };
  }
  cached = next;
  return next;
}

function save(rules: HouseRules) {
  cached = { ...rules };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cached)); } catch {}
  listeners.forEach(fn => fn(cached!));
}

export function getHouseRules(): HouseRules {
  return load();
}

export function setHouseRule<K extends keyof HouseRules>(key: K, value: HouseRules[K]) {
  save({ ...load(), [key]: value });
}

export function resetHouseRules() {
  save({ ...DEFAULTS });
}

/** Hook React reactivo a cambios. */
export function useHouseRules(): [HouseRules, <K extends keyof HouseRules>(k: K, v: HouseRules[K]) => void] {
  const [r, setR] = useState<HouseRules>(load());
  useEffect(() => {
    const onChange = (rules: HouseRules) => setR(rules);
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);
  const set = <K extends keyof HouseRules>(k: K, v: HouseRules[K]) => setHouseRule(k, v);
  return [r, set];
}

/** Metadata para UI (label + descripción). */
export const HOUSE_RULES_META: Array<{
  key: keyof HouseRules;
  label: string;
  description: string;
}> = [
  {
    key: 'damage_grouper',
    label: 'Agrupador daño misiles',
    description: 'Reparte daño cluster en grupos preferentes 5/6/4/3/2/1 (residuo 1 se absorbe en 5→6). Solo armas cluster. Por arma individual.',
  },
  {
    key: 'rac_cadence_drop',
    label: 'RAC drop cadencia en 2',
    description: 'Rotary AC: tirada de cadencia separada (2d6). Si natural 2 + cadencia >1 → baja un tier (6→4, 4→2, 2→1). Reemplaza el jam canon.',
  },
  {
    key: 'inferno_flamer_d6',
    label: 'Inferno + Flamer = 1d6 calor',
    description: 'Inferno SRM y Flamer en modo heat tiran 1d6 de calor al target por ataque (en vez de +2 fijo canon).',
  },
];

/** Tirada 1d6. */
export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}
