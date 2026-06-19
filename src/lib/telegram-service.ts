// ═══════════════════════════════════════════════════════════════
//  TELEGRAM SERVICE — Cliente wrapper para notificaciones salientes
//
//  Llama a Apps Script con action:'tgSend'. Drop silencioso si falla.
//  El backend valida TELEGRAM_ENABLED + token + chat_id.
//
//  Eventos soportados (ver TELEGRAM_SPEC.md):
//   - mision_cerrada
//   - libro_mayor_relevante  (umbral >10k₡ aplicado en cliente)
//   - tesoreria_grande       (umbral >100k₡ aplicado en cliente)
//   - cronica_nueva
//   - parte_nuevo
// ═══════════════════════════════════════════════════════════════

import { getFunctions, httpsCallable } from 'firebase/functions';

export type TelegramEvent =
  | 'mision_cerrada'
  | 'libro_mayor_relevante'
  | 'tesoreria_grande'
  | 'cronica_nueva'
  | 'parte_nuevo'
  | 'test';

export interface TelegramSendResult {
  success: boolean;
  error?: string;
}

/**
 * Envía notificación a Telegram vía Cloud Function `sendTelegramNotif`.
 * Drop silencioso si falla. Llamar awaited pero NUNCA bloquear UX.
 * Respeta toggle global TELEGRAM_ENABLED (localStorage).
 *
 * Backend: functions/src/index.ts. Secrets: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
 */
export async function sendTelegramNotif(
  event: TelegramEvent,
  data: Record<string, any>,
): Promise<TelegramSendResult> {
  if (!getTelegramEnabled()) {
    return { success: false, error: 'telegram disabled (global toggle)' };
  }
  try {
    const fn = httpsCallable(getFunctions(), 'sendTelegramNotif');
    const res = await fn({ event, data });
    const out = res.data as { success?: boolean; messageId?: number };
    if (out?.success) return { success: true };
    return { success: false, error: 'unknown' };
  } catch (e: any) {
    console.warn('[telegram] send failed (silent drop):', event, e?.message ?? e);
    return { success: false, error: String(e?.message ?? e) };
  }
}

// ── Toggle persistence ───────────────────────────────────────────

const TG_TOGGLE_PREFIX = 'kk_tg_toggle_';

/** Devuelve último valor del toggle UI para este contexto. Default true. */
export function getTelegramToggle(context: string): boolean {
  try {
    const raw = localStorage.getItem(TG_TOGGLE_PREFIX + context);
    if (raw === null) return true; // default ON
    return raw === '1';
  } catch {
    return true;
  }
}

/** Persiste último valor del toggle UI. */
export function setTelegramToggle(context: string, on: boolean): void {
  try {
    localStorage.setItem(TG_TOGGLE_PREFIX + context, on ? '1' : '0');
  } catch { /* ignore */ }
}

// ── Toggle global + umbrales (localStorage, editables desde SecretMenu) ──

const ENABLED_KEY    = 'kk_tg_enabled';
const UMBRAL_TES_KEY = 'kk_tg_umbral_tesoreria';
const UMBRAL_LIB_KEY = 'kk_tg_umbral_libro';
const UMBRAL_TES_DEFAULT = 100_000;
const UMBRAL_LIB_DEFAULT = 10_000;

export function getTelegramEnabled(): boolean {
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (raw === null) return true; // default ON (compat con comportamiento previo)
    return raw === '1';
  } catch { return true; }
}

export function setTelegramEnabled(on: boolean): void {
  try { localStorage.setItem(ENABLED_KEY, on ? '1' : '0'); } catch {}
}

export function getUmbralTesoreria(): number {
  try {
    const raw = localStorage.getItem(UMBRAL_TES_KEY);
    const n = raw === null ? UMBRAL_TES_DEFAULT : parseInt(raw);
    return Number.isFinite(n) && n > 0 ? n : UMBRAL_TES_DEFAULT;
  } catch { return UMBRAL_TES_DEFAULT; }
}

export function setUmbralTesoreria(n: number): void {
  try { localStorage.setItem(UMBRAL_TES_KEY, String(Math.max(0, Math.round(n)))); } catch {}
}

export function getUmbralLibroMayor(): number {
  try {
    const raw = localStorage.getItem(UMBRAL_LIB_KEY);
    const n = raw === null ? UMBRAL_LIB_DEFAULT : parseInt(raw);
    return Number.isFinite(n) && n > 0 ? n : UMBRAL_LIB_DEFAULT;
  } catch { return UMBRAL_LIB_DEFAULT; }
}

export function setUmbralLibroMayor(n: number): void {
  try { localStorage.setItem(UMBRAL_LIB_KEY, String(Math.max(0, Math.round(n)))); } catch {}
}

/** Devuelve true si la cantidad supera el umbral para notif "tesoreria_grande". */
export function exceedsTesoreriaUmbral(cantidad: number, umbral?: number): boolean {
  return Math.abs(cantidad) >= (umbral ?? getUmbralTesoreria());
}

/** Devuelve true si la cantidad supera el umbral para notif "libro_mayor_relevante". */
export function exceedsLibroMayorUmbral(cantidad: number, umbral?: number): boolean {
  return Math.abs(cantidad) >= (umbral ?? getUmbralLibroMayor());
}
