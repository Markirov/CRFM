// ════════════════════════════════════════════════════════════════
//  useTallerSharedSync — bidirectional sync taller-shared ↔ Firestore
//  Almacena snapshot serializado en config/main.TALLER_SHARED_JSON.
// ════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { loadConfig, saveConfigBatch } from '@/lib/firebase-service';
import {
  useTallerShared,
  serializeTaller,
  hydrateTaller,
} from '@/lib/taller-shared';

const CONFIG_KEY = 'TALLER_SHARED_JSON';
const DEBOUNCE_MS = 800;

/** Monta una vez en App.tsx. Hidrata al inicio, debounce save al cambiar. */
export function useTallerSharedSync(enabled: boolean) {
  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // ── Hydrate al inicio (sólo una vez per sesión) ──
  useEffect(() => {
    if (!enabled || hydratedRef.current) return;
    hydratedRef.current = true;
    loadConfig().then(res => {
      if (!res?.success) return;
      const raw = (res.data?.config as Record<string, unknown> | undefined)?.[CONFIG_KEY];
      if (typeof raw === 'string') {
        const ok = hydrateTaller(raw);
        if (ok) lastSavedRef.current = raw;
      }
    }).catch(() => { /* silent fail */ });
  }, [enabled]);

  // ── Subscribe + debounce save ──
  useEffect(() => {
    if (!enabled) return;
    const unsub = useTallerShared.subscribe(() => {
      if (!hydratedRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const serialized = serializeTaller();
        if (serialized === lastSavedRef.current) return;
        lastSavedRef.current = serialized;
        saveConfigBatch({ [CONFIG_KEY]: serialized }).catch(e => {
          console.warn('[taller-shared] save failed', e);
        });
      }, DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled]);
}
