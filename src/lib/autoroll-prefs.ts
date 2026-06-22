// Per-user toggles para tiradas automáticas del simulador.
// Persistencia: Firestore `users/{uid}/prefs/autoroll`. Fallback localStorage
// hasta que el usuario tenga sesión Firebase activa.
//
// Default: TODO OFF. Cada usuario opt-in.

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase-config';

export interface AutorollPrefs {
  /** Tirada toHit (Gunnery) 2d6 ≥ target con mods. Auto-aplica hit/miss. */
  toHit: boolean;
  /** Cluster hits table (LRM/SRM/MRM): 2d6 → # misiles que impactan. */
  cluster: boolean;
  /** Hit location 2d6: front/rear/punch/kick tablas. Pre-selecciona loc en ArmorDiagram. */
  hitLocation: boolean;
  /** Crit roll cuando damage entra IS: 2d6 → grupo + 1d6 slot. */
  crit: boolean;
  /** Ammo explosion roll cuando crit en slot ammo. */
  ammoExplosion: boolean;
  /** Piloting Skill Roll 2d6 ≥ piloting + mods (fall, fire, damage 20+). */
  piloting: boolean;
  /** Tirada iniciativa 2d6 vs oponente. */
  initiative: boolean;
}

export const AUTOROLL_DEFAULTS: AutorollPrefs = {
  toHit: false,
  cluster: false,
  hitLocation: false,
  crit: false,
  ammoExplosion: false,
  piloting: false,
  initiative: false,
};

const LS_KEY = 'kk_autoroll_prefs';

// Cache + listeners para reactividad cross-componentes.
let cached: AutorollPrefs | null = null;
const listeners = new Set<(p: AutorollPrefs) => void>();

function loadLocal(): AutorollPrefs {
  if (cached) return cached;
  let next: AutorollPrefs;
  try {
    const raw = localStorage.getItem(LS_KEY);
    next = raw ? { ...AUTOROLL_DEFAULTS, ...JSON.parse(raw) } : { ...AUTOROLL_DEFAULTS };
  } catch {
    next = { ...AUTOROLL_DEFAULTS };
  }
  cached = next;
  return next;
}

function saveLocal(prefs: AutorollPrefs) {
  cached = { ...prefs };
  try { localStorage.setItem(LS_KEY, JSON.stringify(cached)); } catch {}
  listeners.forEach(fn => fn(cached!));
}

/** Carga desde Firestore al hacer login (sobrescribe cache local). */
export async function loadAutorollPrefsFromFirestore(uid: string): Promise<AutorollPrefs> {
  try {
    const ref = doc(db, 'users', uid, 'prefs', 'autoroll');
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() as Partial<AutorollPrefs> : {};
    const merged = { ...AUTOROLL_DEFAULTS, ...data };
    saveLocal(merged);
    return merged;
  } catch (e) {
    console.warn('[autoroll] Firestore load failed, fallback localStorage', e);
    return loadLocal();
  }
}

/** Guarda en Firestore (best-effort). Update local inmediato siempre. */
async function persistFirestore(prefs: AutorollPrefs) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const ref = doc(db, 'users', uid, 'prefs', 'autoroll');
    await setDoc(ref, prefs, { merge: true });
  } catch (e) {
    console.warn('[autoroll] Firestore save failed (local OK)', e);
  }
}

export function getAutorollPrefs(): AutorollPrefs {
  return loadLocal();
}

export function setAutorollPref<K extends keyof AutorollPrefs>(key: K, value: AutorollPrefs[K]) {
  const next = { ...loadLocal(), [key]: value };
  saveLocal(next);
  void persistFirestore(next);
}

/** Hook React reactivo. Carga Firestore on-mount si hay usuario. */
export function useAutorollPrefs(): [AutorollPrefs, <K extends keyof AutorollPrefs>(k: K, v: AutorollPrefs[K]) => void] {
  const [p, setP] = useState<AutorollPrefs>(loadLocal());

  useEffect(() => {
    const onChange = (next: AutorollPrefs) => setP(next);
    listeners.add(onChange);
    // Carga desde Firestore si hay usuario activo (sobrescribe cache local).
    const uid = auth.currentUser?.uid;
    if (uid) void loadAutorollPrefsFromFirestore(uid);
    return () => { listeners.delete(onChange); };
  }, []);

  const set = <K extends keyof AutorollPrefs>(k: K, v: AutorollPrefs[K]) => setAutorollPref(k, v);
  return [p, set];
}

/** Metadata UI: label + descripción + categoría. */
export const AUTOROLL_META: Array<{
  key: keyof AutorollPrefs;
  label: string;
  description: string;
  category: 'combat' | 'damage' | 'pilot';
}> = [
  { key: 'toHit',        label: 'Tirada de Impacto', description: 'Auto-roll 2d6 vs target number al disparar arma.',                                            category: 'combat' },
  { key: 'cluster',      label: 'Cluster Hits',      description: 'Auto-roll tabla cluster (LRM/SRM/MRM) tras hit confirmado en arma cluster.',                  category: 'combat' },
  { key: 'hitLocation',  label: 'Localización',      description: 'Auto-roll 2d6 → tabla front/rear/punch/kick. Pre-selecciona en ArmorDiagram.',                category: 'damage' },
  { key: 'crit',         label: 'Crítico (TAC)',     description: 'Cuando damage entra IS: auto-roll 2d6 + 1d6 slot. Aplica crits resultantes.',                 category: 'damage' },
  { key: 'ammoExplosion',label: 'Explosión munición', description: 'Crit en slot ammo: auto-roll ammo explosion (CASE intercepta).',                              category: 'damage' },
  { key: 'piloting',     label: 'Piloting Skill',    description: 'Tiradas piloting auto: fall, fire, damage 20+, kick miss, charge.',                          category: 'pilot' },
  { key: 'initiative',   label: 'Iniciativa',        description: 'Auto-roll 2d6 al inicio del turno, compara con oponente.',                                   category: 'pilot' },
];
