// functions/src/index.ts
// ═══════════════════════════════════════════════════════════════
//  Cloud Functions CRFM
//  - setUserRole          — callable, admin asigna rol a otro usuario
//  - sendTelegramNotif    — callable, manda mensaje a grupo Telegram
//
//  Deploy: firebase deploy --only functions
//
//  Secrets requeridos (configurar UNA vez):
//    firebase functions:secrets:set TELEGRAM_BOT_TOKEN
//    firebase functions:secrets:set TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID   = defineSecret('TELEGRAM_CHAT_ID');

const VALID_ROLES = ['admin', 'dm', 'pj'] as const;
type Role = typeof VALID_ROLES[number];

// ── setUserRole ──────────────────────────────────────────────
// Caller debe ser admin (verificado por Custom Claim en el JWT).
// Input:  { email: string, role: 'admin' | 'dm' | 'pj' }
// Output: { uid: string, email: string, role: string }

export const setUserRole = onCall(
  {
    cors: [
      'https://battletechalicante.es',
      'https://legadometalico.com',
      'https://crfm-dc873.web.app',
      'https://crfm-dc873.firebaseapp.com',
      /localhost:\d+$/,
    ],
  },
  async (request) => {
  const callerRole = request.auth?.token?.role;
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo administradores pueden cambiar roles.');
  }

  const { email, role } = request.data as { email?: string; role?: string };

  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Email requerido.');
  }
  if (!role || !VALID_ROLES.includes(role as Role)) {
    throw new HttpsError('invalid-argument', `Rol inválido. Debe ser: ${VALID_ROLES.join(', ')}`);
  }

  const auth = getAuth();
  let uid: string;
  try {
    const user = await auth.getUserByEmail(email);
    uid = user.uid;
  } catch {
    throw new HttpsError('not-found', `Usuario no encontrado: ${email}`);
  }

  await auth.setCustomUserClaims(uid, { role });

  const db = getFirestore();
  await db.collection('roles').doc(uid).set({
    email,
    role,
    updatedAt: new Date().toISOString(),
  });

  return { uid, email, role };
},
);

// ── sendTelegramNotif ────────────────────────────────────────
// Callable. Requiere caller autenticado con rol asignado.
// Formatea mensaje según event + manda a Telegram Bot API.
//
// Input:  { event: TelegramEvent, data: Record<string, any> }
// Output: { success: true, messageId?: number } | HttpsError

type TelegramEvent =
  | 'mision_cerrada'
  | 'libro_mayor_relevante'
  | 'tesoreria_grande'
  | 'cronica_nueva'
  | 'parte_nuevo'
  | 'test';

const fmtCzar = (n: number): string => {
  if (!Number.isFinite(n)) return '0 ₡';
  return Math.round(n).toLocaleString('es-ES') + ' ₡';
};

function formatMessage(event: TelegramEvent, data: Record<string, any>): string {
  switch (event) {
    case 'mision_cerrada': {
      const balance = Number(data.balance) || 0;
      const emoji = balance >= 0 ? '📈' : '📉';
      return [
        `🛡️ <b>MISIÓN CERRADA</b> · ${data.fecha ?? ''}`,
        `Tipo: ${data.missionType ?? '—'}`,
        `Balance: ${fmtCzar(balance)} ${emoji}`,
        data.pjTopXP ? `Destacado: ${data.pjTopXP} (+${data.xp ?? 0} XP)` : null,
      ].filter(Boolean).join('\n');
    }
    case 'libro_mayor_relevante': {
      const cantidad = Number(data.cantidad) || 0;
      const tipoEmoji = data.tipo === 'ingreso' ? '🟢' : '🔴';
      return [
        `💰 ${tipoEmoji} <b>${data.concepto ?? '—'}</b>`,
        `Cantidad: ${fmtCzar(cantidad)}`,
        `Categoría: ${data.categoria ?? '—'}`,
        data.tesoreria != null ? `Saldo: ${fmtCzar(Number(data.tesoreria))}` : null,
      ].filter(Boolean).join('\n');
    }
    case 'tesoreria_grande': {
      const cantidad = Number(data.cantidad) || 0;
      const tipoEmoji = data.tipo === 'ingreso' ? '🟢' : '🔴';
      return [
        `⚠️ <b>MOVIMIENTO GRANDE</b>`,
        `${data.concepto ?? '—'}`,
        `${tipoEmoji} ${fmtCzar(cantidad)}`,
        data.tesoreria != null ? `Saldo: ${fmtCzar(Number(data.tesoreria))}` : null,
      ].filter(Boolean).join('\n');
    }
    case 'cronica_nueva': {
      const cuerpo = String(data.cuerpo ?? '').slice(0, 200);
      return [
        `📖 <b>NUEVA CRÓNICA</b> · ${data.fechaCampaign ?? ''}`,
        `<b>${data.titulo ?? '—'}</b>`,
        data.autorNombre ? `— por ${data.autorNombre}` : null,
        '',
        cuerpo + (String(data.cuerpo ?? '').length > 200 ? '…' : ''),
      ].filter(x => x !== null).join('\n');
    }
    case 'parte_nuevo': {
      const resumen = String(data.resumen ?? '').slice(0, 150);
      return [
        `📋 <b>PARTE DEL DÍA</b> · ${data.fechaCampaign ?? ''}`,
        `${data.autorNombre ?? '—'}: ${resumen}`,
      ].join('\n');
    }
    case 'test':
      return `✅ <b>Test CRFM</b>\n${data.msg ?? 'Notificación de prueba'}`;
    default:
      return `[${event}] ${JSON.stringify(data).slice(0, 200)}`;
  }
}

export const sendTelegramNotif = onCall(
  {
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    cors: [
      'https://battletechalicante.es',
      'https://legadometalico.com',
      'https://crfm-dc873.web.app',
      'https://crfm-dc873.firebaseapp.com',
      /localhost:\d+$/,
    ],
  },
  async (request) => {
    const callerRole = request.auth?.token?.role;
    if (callerRole !== 'admin' && callerRole !== 'dm' && callerRole !== 'pj') {
      throw new HttpsError('permission-denied', 'Requiere rol asignado.');
    }

    const { event, data } = request.data as { event?: TelegramEvent; data?: Record<string, any> };
    if (!event) throw new HttpsError('invalid-argument', 'event requerido.');

    const token  = TELEGRAM_BOT_TOKEN.value();
    const chatId = TELEGRAM_CHAT_ID.value();
    if (!token || !chatId) {
      throw new HttpsError('failed-precondition', 'TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados.');
    }

    const text = formatMessage(event, data ?? {});
    const url  = `https://api.telegram.org/bot${token}/sendMessage`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
    } catch (e: any) {
      console.warn('[telegram] fetch error', e?.message ?? e);
      throw new HttpsError('unavailable', 'Telegram API unreachable.');
    }

    const json = await res.json().catch(() => null) as any;
    if (!res.ok || !json?.ok) {
      console.warn('[telegram] sendMessage failed', res.status, json);
      throw new HttpsError('internal', `Telegram error: ${json?.description ?? res.statusText}`);
    }

    return { success: true, messageId: json.result?.message_id };
  },
);
