// functions/src/index.ts
// ═══════════════════════════════════════════════════════════════
//  Cloud Functions CRFM
//  - setUserRole          — callable, admin asigna rol a otro usuario
//  - sendTelegramNotif    — callable, manda mensaje a grupo Telegram
//  - tgWebhook            — HTTPS público, recibe updates Telegram + ejecuta comandos
//
//  Deploy: firebase deploy --only functions
//
//  Secrets requeridos (configurar UNA vez):
//    firebase functions:secrets:set TELEGRAM_BOT_TOKEN
//    firebase functions:secrets:set TELEGRAM_CHAT_ID
//    firebase functions:secrets:set TELEGRAM_WEBHOOK_SECRET  (random string)
//    firebase functions:secrets:set TG_AUTHORIZED_IDS        (CSV user_ids autorizados, admin+DM)
// ═══════════════════════════════════════════════════════════════

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';

initializeApp();

const TELEGRAM_BOT_TOKEN       = defineSecret('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID         = defineSecret('TELEGRAM_CHAT_ID');
const TELEGRAM_WEBHOOK_SECRET  = defineSecret('TELEGRAM_WEBHOOK_SECRET');
const TG_AUTHORIZED_IDS        = defineSecret('TG_AUTHORIZED_IDS');

const VALID_ROLES = ['admin', 'dm', 'pj'] as const;
type Role = typeof VALID_ROLES[number];

const LIVE_ROOM_IDS = ['alpha', 'beta', 'delta'] as const;
type LiveRoomId = typeof LIVE_ROOM_IDS[number];
const LIVE_ROOM_TTL_MS = 60 * 60 * 1000;
const LIVE_CALLABLE_CORS = [
  'https://battletechalicante.es',
  'https://legadometalico.com',
  'https://crfm-dc873.web.app',
  'https://crfm-dc873.firebaseapp.com',
  /localhost:\d+$/,
];

interface LiveUnitPayload {
  id: string;
  name: string;
  pilot: string;
  hpPercent: number;
  isDestroyed: boolean;
}

function parseLiveRoomId(value: unknown): LiveRoomId {
  if (typeof value !== 'string' || !LIVE_ROOM_IDS.includes(value as LiveRoomId)) {
    throw new HttpsError('invalid-argument', 'Sala inválida. Usa alpha, beta o delta.');
  }
  return value as LiveRoomId;
}

function requireLiveUser(request: { auth?: { uid: string; token: Record<string, unknown> } | null }): string {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Se requiere una identidad Firebase.');
  }
  return request.auth.uid;
}

function hasCampaignRole(token: Record<string, unknown> | undefined): boolean {
  const role = token?.role;
  const founder = token?.email === 'marcosfenollar@gmail.com' && token?.email_verified === true;
  return founder || role === 'admin' || role === 'dm' || role === 'pj';
}

function requireCampaignRole(request: { auth?: { uid: string; token: Record<string, unknown> } | null }): string {
  const uid = requireLiveUser(request);
  if (!hasCampaignRole(request.auth?.token)) {
    throw new HttpsError('permission-denied', 'Solo un usuario con rol puede gestionar salas Live.');
  }
  return uid;
}

function validateLiveUnits(value: unknown): LiveUnitPayload[] {
  if (!Array.isArray(value) || value.length > 12) {
    throw new HttpsError('invalid-argument', 'La sesión admite un máximo de 12 unidades.');
  }
  return value.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new HttpsError('invalid-argument', `Unidad ${index + 1} inválida.`);
    }
    const unit = raw as Record<string, unknown>;
    const id = typeof unit.id === 'string' ? unit.id.trim() : '';
    const name = typeof unit.name === 'string' ? unit.name.trim() : '';
    const pilot = typeof unit.pilot === 'string' ? unit.pilot.trim() : '';
    const hpPercent = unit.hpPercent;
    if (!/^(mech|vehicle)_\d{1,2}$/.test(id) || name.length < 1 || name.length > 80 ||
        pilot.length < 1 || pilot.length > 80 || !Number.isInteger(hpPercent) ||
        Number(hpPercent) < 0 || Number(hpPercent) > 100 || typeof unit.isDestroyed !== 'boolean') {
      throw new HttpsError('invalid-argument', `Datos inválidos en la unidad ${index + 1}.`);
    }
    return {
      id,
      name,
      pilot,
      hpPercent: Number(hpPercent),
      isDestroyed: unit.isDestroyed,
    };
  });
}

function roomIsActive(data: Record<string, unknown> | undefined, now: Timestamp): boolean {
  return data?.status === 'active' &&
    data.expiresAt instanceof Timestamp &&
    data.expiresAt.toMillis() > now.toMillis();
}

export const openLiveRoom = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    const openedByUid = requireCampaignRole(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    const db = getFirestore();
    const roomRef = db.collection('live_rooms').doc(roomId);
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + LIVE_ROOM_TTL_MS);
    const generation = randomUUID();

    // Una reapertura inicia una ejecución limpia y elimina subcolecciones antiguas.
    await db.recursiveDelete(roomRef);
    await roomRef.set({
      roomId,
      generation,
      status: 'active',
      openedByUid,
      createdAt: now,
      lastAttackAt: null,
      expiresAt,
    });

    return { roomId, generation, expiresAt: expiresAt.toMillis() };
  },
);

export const cleanupExpiredLiveRooms = onSchedule('every 15 minutes', async () => {
  const db = getFirestore();
  const now = Timestamp.now();
  for (const roomId of LIVE_ROOM_IDS) {
    const roomRef = db.collection('live_rooms').doc(roomId);
    const snap = await roomRef.get();
    if (!snap.exists) continue;
    const data = snap.data() as Record<string, unknown>;
    if (data.expiresAt instanceof Timestamp && data.expiresAt.toMillis() <= now.toMillis()) {
      await db.recursiveDelete(roomRef);
    }
  }
});

export const closeLiveRoom = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    requireCampaignRole(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    const roomRef = getFirestore().collection('live_rooms').doc(roomId);
    const snap = await roomRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'La sala no existe.');
    await roomRef.update({ status: 'closed', expiresAt: Timestamp.now() });
    return { roomId, closed: true };
  },
);

export const upsertLiveSession = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    const uid = requireLiveUser(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    const playerName = typeof request.data?.playerName === 'string' ? request.data.playerName.trim() : '';
    if (playerName.length < 1 || playerName.length > 40) {
      throw new HttpsError('invalid-argument', 'El nombre debe tener entre 1 y 40 caracteres.');
    }
    const units = validateLiveUnits(request.data?.units);
    const db = getFirestore();
    const roomRef = db.collection('live_rooms').doc(roomId);
    const sessionRef = roomRef.collection('sessions').doc(uid);
    const now = Timestamp.now();

    const generation = await db.runTransaction(async tx => {
      const roomSnap = await tx.get(roomRef);
      const roomData = roomSnap.data() as Record<string, unknown> | undefined;
      if (!roomSnap.exists || !roomIsActive(roomData, now) || typeof roomData?.generation !== 'string') {
        throw new HttpsError('failed-precondition', 'La sala no está activa.');
      }
      tx.set(sessionRef, {
        ownerUid: uid,
        generation: roomData.generation,
        playerName,
        updatedAt: now,
        expiresAt: roomData.expiresAt,
        units,
      });
      return roomData.generation;
    });

    return { roomId, generation };
  },
);

export const leaveLiveRoom = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    const uid = requireLiveUser(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    await getFirestore().collection('live_rooms').doc(roomId).collection('sessions').doc(uid).delete();
    return { roomId, left: true };
  },
);

export const sendLiveAttack = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    const senderUid = requireLiveUser(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    const targetUid = typeof request.data?.targetUid === 'string' ? request.data.targetUid : '';
    const targetUnitId = typeof request.data?.targetUnitId === 'string' ? request.data.targetUnitId : '';
    const sourceUnitName = typeof request.data?.sourceUnitName === 'string' ? request.data.sourceUnitName.trim() : '';
    const weaponName = typeof request.data?.weaponName === 'string' ? request.data.weaponName.trim() : '';
    const ammoVariant = typeof request.data?.ammoVariant === 'string' ? request.data.ammoVariant.trim() : '';
    const damage = Number(request.data?.damage);
    const heatToTarget = Number(request.data?.heatToTarget ?? 0);

    if (!targetUid || !/^(mech|vehicle)_\d{1,2}$/.test(targetUnitId) ||
        sourceUnitName.length < 1 || sourceUnitName.length > 80 ||
        weaponName.length < 1 || weaponName.length > 80 ||
        ammoVariant.length > 40 || !Number.isInteger(damage) || damage < 0 || damage > 1000 ||
        !Number.isInteger(heatToTarget) || heatToTarget < 0 || heatToTarget > 100 ||
        (damage === 0 && heatToTarget === 0)) {
      throw new HttpsError('invalid-argument', 'Datos de ataque inválidos.');
    }

    const db = getFirestore();
    const roomRef = db.collection('live_rooms').doc(roomId);
    const senderRef = roomRef.collection('sessions').doc(senderUid);
    const targetRef = roomRef.collection('sessions').doc(targetUid);
    const attackRef = roomRef.collection('attacks').doc(randomUUID());
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + LIVE_ROOM_TTL_MS);

    await db.runTransaction(async tx => {
      const [roomSnap, senderSnap, targetSnap] = await Promise.all([
        tx.get(roomRef),
        tx.get(senderRef),
        tx.get(targetRef),
      ]);
      const room = roomSnap.data() as Record<string, unknown> | undefined;
      const sender = senderSnap.data() as Record<string, unknown> | undefined;
      const target = targetSnap.data() as Record<string, unknown> | undefined;
      if (!roomSnap.exists || !roomIsActive(room, now) || typeof room?.generation !== 'string') {
        throw new HttpsError('failed-precondition', 'La sala no está activa.');
      }
      if (!senderSnap.exists || sender?.generation !== room.generation ||
          !targetSnap.exists || target?.generation !== room.generation) {
        throw new HttpsError('failed-precondition', 'Remitente u objetivo no pertenece a la sala activa.');
      }
      const senderUnits = Array.isArray(sender?.units) ? sender.units as LiveUnitPayload[] : [];
      const targetUnits = Array.isArray(target?.units) ? target.units as LiveUnitPayload[] : [];
      if (!senderUnits.some(unit => unit.name === sourceUnitName) ||
          !targetUnits.some(unit => unit.id === targetUnitId && !unit.isDestroyed)) {
        throw new HttpsError('failed-precondition', 'La unidad atacante u objetivo ya no está disponible.');
      }

      tx.create(attackRef, {
        generation: room.generation,
        senderUid,
        targetUid,
        sourceSessionName: String(sender?.playerName ?? 'Piloto'),
        sourceUnitName,
        targetUnitId,
        weaponName,
        damage,
        ammoVariant: ammoVariant || null,
        heatToTarget,
        status: 'pending',
        createdAt: now,
        expiresAt,
      });
      tx.update(roomRef, { lastAttackAt: now, expiresAt });
      tx.update(senderRef, { expiresAt, updatedAt: now });
      tx.update(targetRef, { expiresAt });
    });

    return { id: attackRef.id, timestamp: now.toMillis(), expiresAt: expiresAt.toMillis() };
  },
);

export const resolveLiveAttack = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    const uid = requireLiveUser(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    const attackId = typeof request.data?.attackId === 'string' ? request.data.attackId : '';
    if (!attackId) throw new HttpsError('invalid-argument', 'attackId requerido.');
    const ref = getFirestore().collection('live_rooms').doc(roomId).collection('attacks').doc(attackId);
    const snap = await ref.get();
    if (!snap.exists) return { resolved: true };
    const attack = snap.data();
    if (attack?.targetUid !== uid) throw new HttpsError('permission-denied', 'Solo el objetivo puede resolver el ataque.');
    if (attack?.status === 'pending') await ref.update({ status: 'resolved', resolvedAt: Timestamp.now() });
    return { resolved: true };
  },
);

export const cancelLiveAttack = onCall(
  { cors: LIVE_CALLABLE_CORS },
  async (request) => {
    const uid = requireLiveUser(request);
    const roomId = parseLiveRoomId(request.data?.roomId);
    const attackId = typeof request.data?.attackId === 'string' ? request.data.attackId : '';
    if (!attackId) throw new HttpsError('invalid-argument', 'attackId requerido.');
    const ref = getFirestore().collection('live_rooms').doc(roomId).collection('attacks').doc(attackId);
    const snap = await ref.get();
    if (!snap.exists) return { cancelled: true };
    const attack = snap.data();
    if (attack?.senderUid !== uid) throw new HttpsError('permission-denied', 'Solo el remitente puede cancelar el ataque.');
    if (attack?.status === 'pending') await ref.update({ status: 'cancelled', cancelledAt: Timestamp.now() });
    return { cancelled: true };
  },
);

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
  const callerEmail = request.auth?.token?.email;
  if (callerRole !== 'admin' && callerEmail !== 'marcosfenollar@gmail.com') {
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
  }, { merge: true });

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

// ── tgWebhook ────────────────────────────────────────────────
// HTTPS público. Telegram POSTea aquí cada update tras setWebhook.
// Verifica X-Telegram-Bot-Api-Secret-Token. Comandos soportados:
//   /roster · /tesoreria · /cronica · /parte · /whoami · /help
// Whitelist: TG_AUTHORIZED_IDS (CSV user_ids).
//
// setWebhook (una vez):
//   POST https://api.telegram.org/bot<TOKEN>/setWebhook
//   { url: '<FUNCTION_URL>', secret_token: '<TELEGRAM_WEBHOOK_SECRET>' }

interface TgUpdate {
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string };
    chat:   { id: number; type: string };
    text?:  string;
    date:   number;
  };
}

async function tgReply(token: string, chatId: number, text: string, replyTo?: number): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_to_message_id: replyTo,
      }),
    });
  } catch (e) {
    console.warn('[tgWebhook] reply failed', e);
  }
}

function parseAuthorized(csv: string | undefined): Set<number> {
  if (!csv) return new Set();
  return new Set(csv.split(/[,;\s]+/).map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n)));
}

async function cmdRoster(): Promise<string> {
  const db = getFirestore();
  const cfgSnap = await db.collection('config').doc('main').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() ?? {} : {};
  const fechaCampana = `${cfg['MES_CAMPANA'] ?? '?'}/${cfg['AÑO_CAMPANA'] ?? '?'}`;

  const personajesSnap = await db.collection('personajes').get();
  const lines = ['🪖 <b>ROSTER</b> · ' + fechaCampana];
  for (const doc of personajesSnap.docs) {
    const p = doc.data();
    const estado = String(p.estado ?? 'activo').toLowerCase();
    if (estado !== 'activo' && estado !== 'herido') continue;
    const apodo  = p.apodo || p.nombre || doc.id;
    const mech   = p.mech || '—';
    const xp     = p.xpTotal ?? 0;
    const heridoFlag = estado === 'herido' ? ' 🩸' : '';
    lines.push(`• <b>${apodo}</b>${heridoFlag} — ${mech} · XP ${xp}`);
  }
  if (lines.length === 1) lines.push('(sin pilotos activos)');
  return lines.join('\n');
}

async function cmdTesoreria(): Promise<string> {
  const db = getFirestore();
  const cfgSnap = await db.collection('config').doc('main').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() ?? {} : {};
  const saldo = String(cfg['CONTRATO_VALOR'] ?? '0');

  // Últimos 5 movimientos por fecha desc
  const libroSnap = await db.collection('libroMayor')
    .orderBy('fecha', 'desc').limit(5).get();

  const lines = ['💰 <b>TESORERÍA</b>', `Saldo: ${saldo} ₡`, '', '<b>Últimos 5 movimientos:</b>'];
  for (const doc of libroSnap.docs) {
    const e = doc.data();
    const signo = e.tipo === 'ingreso' ? '+' : '-';
    const cant  = (Number(e.cantidad) || 0).toLocaleString('es-ES');
    const fecha = String(e.fecha ?? '').slice(5); // mm-dd
    lines.push(`${fecha} ${signo}${cant} · ${e.concepto ?? '—'}`);
  }
  if (libroSnap.empty) lines.push('(sin movimientos)');
  return lines.join('\n');
}

async function cmdCronica(): Promise<string> {
  const db = getFirestore();
  const snap = await db.collection('cronicas')
    .orderBy('fechaCampaign', 'desc').limit(3).get().catch(() => null);
  // fallback sin orderBy si falla index
  const docs = snap?.docs ?? (await db.collection('cronicas').limit(3).get()).docs;

  const lines = ['📖 <b>ÚLTIMAS CRÓNICAS</b>'];
  for (const doc of docs) {
    const c = doc.data();
    const titulo = c.titulo ?? '(sin título)';
    const autor  = c.autorNombre ?? c.autor ?? '—';
    const fecha  = c.fechaCampaign ?? c.fecha ?? '';
    const cuerpo = String(c.cuerpo ?? c.texto ?? '').slice(0, 150);
    lines.push('');
    lines.push(`<b>${titulo}</b> · ${fecha}`);
    lines.push(`— ${autor}`);
    if (cuerpo) lines.push(cuerpo + (String(c.cuerpo ?? c.texto ?? '').length > 150 ? '…' : ''));
  }
  if (docs.length === 0) lines.push('(sin crónicas)');
  return lines.join('\n');
}

async function cmdParte(args: string, fromName: string): Promise<string> {
  const texto = args.trim();
  if (!texto) return '⚠ Uso: <code>/parte &lt;texto&gt;</code>';

  const db = getFirestore();
  const cfgSnap = await db.collection('config').doc('main').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() ?? {} : {};
  const fechaCampaign = `${cfg['AÑO_CAMPANA'] ?? '?'}-${String(cfg['MES_CAMPANA'] ?? '?').padStart(2, '0')}`;

  const id = `tg_${Date.now()}`;
  await db.collection('parteDiario').doc(id).set({
    id,
    fecha:          new Date().toISOString().slice(0, 10),
    fechaCampaign,
    autorNombre:    fromName,
    resumen:        texto.slice(0, 200),
    texto,
    tone:           'neutro',
    source:         'telegram',
    createdAt:      new Date().toISOString(),
  });

  return `✅ <b>Parte guardado</b>\n— ${fromName}\n\n${texto.slice(0, 300)}`;
}

function cmdHelp(): string {
  return [
    '🤖 <b>Comandos disponibles</b>',
    '/roster — pilotos activos + mech + XP',
    '/tesoreria — saldo + últimos 5 movimientos',
    '/cronica — últimas 3 crónicas',
    '/parte &lt;texto&gt; — guarda parte diario',
    '/whoami — tu user_id (para autorizar)',
    '/help — esta lista',
  ].join('\n');
}

export const tgWebhook = onRequest(
  {
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TG_AUTHORIZED_IDS],
    cors: false, // Telegram POSTea directo, sin browser
  },
  async (req, res) => {
    // Solo POST
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // Verifica secret token header
    const expectedSecret = TELEGRAM_WEBHOOK_SECRET.value();
    const gotSecret = req.header('x-telegram-bot-api-secret-token');
    if (!expectedSecret || gotSecret !== expectedSecret) {
      console.warn('[tgWebhook] secret mismatch');
      res.status(401).send('unauthorized');
      return;
    }

    const update = req.body as TgUpdate;
    const msg = update?.message;
    if (!msg || !msg.text) {
      res.status(200).send('ignored');
      return;
    }

    const token  = TELEGRAM_BOT_TOKEN.value();
    const userId = msg.from?.id;
    const chatId = msg.chat.id;
    const text   = msg.text.trim();
    const fromName = msg.from?.username
      ? `@${msg.from.username}`
      : (msg.from?.first_name ?? `user:${userId}`);

    // Parsea comando (acepta /cmd y /cmd@BotName)
    const m = text.match(/^\/([a-z_]+)(?:@\w+)?\s*(.*)$/i);
    if (!m) { res.status(200).send('not a command'); return; }
    const cmd  = m[1].toLowerCase();
    const args = m[2] ?? '';

    // /whoami siempre disponible
    if (cmd === 'whoami') {
      await tgReply(token, chatId, `🆔 user_id: <code>${userId}</code>\n👤 ${fromName}`, msg.message_id);
      res.status(200).send('ok');
      return;
    }

    // Whitelist
    const authorized = parseAuthorized(TG_AUTHORIZED_IDS.value());
    if (!authorized.has(Number(userId))) {
      await tgReply(token, chatId, `🚫 No autorizado.\nTu user_id: <code>${userId}</code>\nPide al admin que te añada.`, msg.message_id);
      res.status(200).send('ok');
      return;
    }

    try {
      let reply: string;
      switch (cmd) {
        case 'roster':    reply = await cmdRoster(); break;
        case 'tesoreria': reply = await cmdTesoreria(); break;
        case 'cronica':   reply = await cmdCronica(); break;
        case 'parte':     reply = await cmdParte(args, fromName); break;
        case 'help':      reply = cmdHelp(); break;
        default:
          reply = `❓ Comando desconocido: /${cmd}\n/help para lista.`;
      }
      await tgReply(token, chatId, reply, msg.message_id);
    } catch (e: any) {
      console.error('[tgWebhook] cmd error', cmd, e);
      await tgReply(token, chatId, `✗ Error ejecutando /${cmd}`, msg.message_id);
    }

    res.status(200).send('ok');
  },
);
