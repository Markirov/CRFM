import { readFile } from 'node:fs/promises';
import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

const projectId = 'crfm-rules-test';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const now = Date.now();
    const expiresAt = Timestamp.fromMillis(now + 60 * 60 * 1000);
    await setDoc(doc(db, 'live_rooms', 'alpha'), {
      roomId: 'alpha',
      generation: 'gen-alpha',
      status: 'active',
      openedByUid: 'operator',
      createdAt: Timestamp.fromMillis(now),
      lastAttackAt: null,
      expiresAt,
    });
    await setDoc(doc(db, 'live_rooms', 'beta'), {
      roomId: 'beta',
      generation: 'gen-beta',
      status: 'closed',
      openedByUid: 'operator',
      createdAt: Timestamp.fromMillis(now),
      lastAttackAt: null,
      expiresAt: Timestamp.fromMillis(now - 1000),
    });
    await setDoc(doc(db, 'live_rooms', 'alpha', 'sessions', 'guest-a'), {
      ownerUid: 'guest-a',
      generation: 'gen-alpha',
      playerName: 'Guest A',
      updatedAt: Timestamp.fromMillis(now),
      expiresAt,
      units: [],
    });
    await setDoc(doc(db, 'live_rooms', 'alpha', 'sessions', 'guest-b'), {
      ownerUid: 'guest-b',
      generation: 'gen-alpha',
      playerName: 'Guest B',
      updatedAt: Timestamp.fromMillis(now),
      expiresAt,
      units: [],
    });
    await setDoc(doc(db, 'live_rooms', 'alpha', 'attacks', 'attack-1'), {
      generation: 'gen-alpha',
      senderUid: 'guest-a',
      targetUid: 'guest-b',
      sourceSessionName: 'Guest A',
      sourceUnitName: 'Atlas AS7-D',
      targetUnitId: 'mech_0',
      weaponName: 'AC/20',
      damage: 20,
      ammoVariant: null,
      heatToTarget: 0,
      status: 'pending',
      createdAt: Timestamp.fromMillis(now),
      expiresAt,
    });
  });
});

after(async () => {
  await env.cleanup();
});

test('un visitante sin identidad no puede leer salas Live', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'live_rooms', 'alpha')));
});

test('una identidad anónima puede consultar las tres salas fijas', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'live_rooms', 'alpha')));
  await assertSucceeds(getDoc(doc(db, 'live_rooms', 'beta')));
});

test('no puede consultarse una cuarta sala', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  await assertFails(getDoc(doc(db, 'live_rooms', 'omega')));
});

test('ningún cliente puede abrir o modificar directamente una sala', async () => {
  const db = env.authenticatedContext('operator', { role: 'admin' }).firestore();
  await assertFails(setDoc(doc(db, 'live_rooms', 'alpha'), { status: 'closed' }, { merge: true }));
});

test('un participante puede leer sesiones y ataques de su sala activa', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  const sessions = await assertSucceeds(getDocs(collection(db, 'live_rooms', 'alpha', 'sessions')));
  const attacks = await assertSucceeds(getDocs(collection(db, 'live_rooms', 'alpha', 'attacks')));
  assert.equal(sessions.size, 2);
  assert.equal(attacks.size, 1);
});

test('un usuario que no participa no puede enumerar sesiones ni ataques', async () => {
  const db = env.authenticatedContext('outsider').firestore();
  await assertFails(getDocs(collection(db, 'live_rooms', 'alpha', 'sessions')));
  await assertFails(getDocs(collection(db, 'live_rooms', 'alpha', 'attacks')));
});

test('un participante tampoco puede escribir directamente su sesión o ataques', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  await assertFails(setDoc(doc(db, 'live_rooms', 'alpha', 'sessions', 'guest-a'), {
    playerName: 'Alterado',
  }, { merge: true }));
  await assertFails(setDoc(doc(db, 'live_rooms', 'alpha', 'attacks', 'malicious'), {
    damage: 999999,
  }));
});

test('una sala cerrada no concede acceso a sus subcolecciones', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  await assertFails(getDocs(collection(db, 'live_rooms', 'beta', 'sessions')));
});

test('la colección Live legacy queda completamente cerrada', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  await assertFails(getDoc(doc(db, 'live_sessions', 'legacy')));
  await assertFails(setDoc(doc(db, 'live_sessions', 'legacy'), { public: true }));
});

test('una identidad anónima no obtiene acceso a datos de campaña', async () => {
  const db = env.authenticatedContext('guest-a').firestore();
  await assertFails(getDoc(doc(db, 'config', 'sim')));
  await assertFails(getDoc(doc(db, 'config', 'main')));
  await assertFails(getDocs(collection(db, 'hangar')));
});
