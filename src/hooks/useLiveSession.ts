import { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '@/lib/firebase-config';
import { useSimulador } from './useSimulador';
import { useAppStore } from '@/lib/store';

export type LiveRoomId = 'alpha' | 'beta' | 'delta';
export const LIVE_ROOM_IDS: LiveRoomId[] = ['alpha', 'beta', 'delta'];

export interface LiveRoom {
  id: LiveRoomId;
  status: 'active' | 'closed' | 'missing';
  generation: string | null;
  expiresAt: number | null;
}

export interface LiveUnit {
  id: string;
  name: string;
  pilot: string;
  hpPercent: number;
  isDestroyed: boolean;
}

export interface IncomingDamage {
  id: string;
  sourceSessionName: string;
  sourceUnitName: string;
  targetUnitId: string;
  weaponName: string;
  damage: number;
  timestamp: number;
  ammoVariant?: string;
  heatToTarget?: number;
}

interface LiveAttack extends IncomingDamage {
  senderUid: string;
  targetUid: string;
  status: 'pending' | 'resolved' | 'cancelled';
  generation: string;
}

export interface LiveSession {
  id: string;
  playerName: string;
  updatedAt: number;
  units: LiveUnit[];
  incomingDamage: IncomingDamage[];
  generation: string;
}

const functions = getFunctions();
const callOpenRoom = httpsCallable<{ roomId: LiveRoomId }, { generation: string }>(functions, 'openLiveRoom');
const callCloseRoom = httpsCallable<{ roomId: LiveRoomId }, unknown>(functions, 'closeLiveRoom');
const callUpsertSession = httpsCallable<
  { roomId: LiveRoomId; playerName: string; units: LiveUnit[] },
  { generation: string }
>(functions, 'upsertLiveSession');
const callLeaveRoom = httpsCallable<{ roomId: LiveRoomId }, unknown>(functions, 'leaveLiveRoom');
const callSendAttack = httpsCallable(functions, 'sendLiveAttack');
const callResolveAttack = httpsCallable<{ roomId: LiveRoomId; attackId: string }, unknown>(functions, 'resolveLiveAttack');
const callCancelAttack = httpsCallable<{ roomId: LiveRoomId; attackId: string }, unknown>(functions, 'cancelLiveAttack');

function timestampMillis(value: unknown): number {
  return value && typeof (value as Timestamp).toMillis === 'function'
    ? (value as Timestamp).toMillis()
    : 0;
}

function roomStorageValue(): LiveRoomId {
  const value = sessionStorage.getItem('liveRoomId');
  return LIVE_ROOM_IDS.includes(value as LiveRoomId) ? value as LiveRoomId : 'alpha';
}

function liveErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  if (code === 'auth/admin-restricted-operation') {
    return 'El acceso Live todavía no está habilitado en Firebase Auth.';
  }
  if (code.includes('failed-precondition')) return 'La sala no está activa o acaba de caducar.';
  if (code.includes('permission-denied')) return 'No tienes permiso para realizar esta acción Live.';
  if (code.includes('unauthenticated')) return 'No se pudo crear la identidad temporal para Live.';
  return error instanceof Error ? error.message : String(error);
}

export function useLiveSession(sim: ReturnType<typeof useSimulador>) {
  const [playerName, setPlayerName] = useState('');
  const [rooms, setRooms] = useState<LiveRoom[]>(LIVE_ROOM_IDS.map(id => ({
    id, status: 'missing', generation: null, expiresAt: null,
  })));
  const [selectedRoomId, setSelectedRoomIdState] = useState<LiveRoomId>(roomStorageValue);
  const [activeRoomId, setActiveRoomId] = useState<LiveRoomId | null>(
    () => sessionStorage.getItem('liveJoined') === '1' ? roomStorageValue() : null,
  );
  const [activeGeneration, setActiveGeneration] = useState<string | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [mySession, setMySession] = useState<LiveSession | null>(null);
  const [incomingAttacks, setIncomingAttacks] = useState<LiveAttack[]>([]);
  const [outgoingAttacks, setOutgoingAttacks] = useState<LiveAttack[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roster = useAppStore(s => s.roster);
  const userRole = useAppStore(s => s.userRole);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureIdentity = useCallback(async () => {
    if (auth.currentUser) return auth.currentUser;
    return (await signInAnonymously(auth)).user;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        setAuthReady(true);
        return;
      }
      try {
        await signInAnonymously(auth);
      } catch (e) {
        setError(liveErrorMessage(e));
        setAuthReady(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!playerName) {
      const email = auth.currentUser?.email;
      const pj = roster.find(r => r.jugador && email &&
        r.jugador.toLowerCase() === email.split('@')[0].toLowerCase());
      setPlayerName(pj?.nombre || pj?.jugador || auth.currentUser?.displayName || 'Piloto Local');
    }
  }, [roster, playerName]);

  const buildUnits = useCallback((): LiveUnit[] => {
    const units: LiveUnit[] = [];
    sim.mechSlots.forEach((slot, index) => {
      if (!slot.state || !slot.session) return;
      const state = slot.state;
      const session = slot.session;
      const armorLocs = ['HD','CTf','CTr','LTf','LTr','RTf','RTr','LA','RA','LL','RL'];
      const isLocs = ['HD','CT','LT','RT','LA','RA','LL','RL'];
      const armorMax = armorLocs.reduce((sum, key) => sum + ((state.armor as Record<string, number>)[key] ?? 0), 0);
      const armorCur = armorLocs.reduce((sum, key) => sum + ((session.armor as Record<string, number>)[key] ?? 0), 0);
      const isMax = isLocs.reduce((sum, key) => sum + ((state.is as Record<string, number>)[key] ?? 0), 0);
      const isCur = isLocs.reduce((sum, key) => sum + ((session.is as Record<string, number>)[key] ?? 0), 0);
      const total = armorMax + isMax;
      units.push({
        id: `mech_${index}`,
        name: `${state.chassis} ${state.model}`.trim().slice(0, 80),
        pilot: (session.pilot.name || `Slot ${index + 1}`).slice(0, 80),
        hpPercent: session.destroyed || total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(((armorCur + isCur) / total) * 100))),
        isDestroyed: session.destroyed,
      });
    });
    sim.vehicleSlots.forEach((slot, index) => {
      if (!slot.state || !slot.session) return;
      const state = slot.state;
      const session = slot.session;
      const locations = Array.isArray(state.locations) ? state.locations : [];
      const armorMax = locations.reduce((sum, loc) => sum + (loc.maxArmor ?? 0), 0);
      const armorCur = locations.reduce((sum, loc) => sum + ((session.armor ?? {})[loc.key] ?? 0), 0);
      const isMax = locations.reduce((sum, loc) => sum + (loc.maxIS ?? 0), 0);
      const isCur = locations.reduce((sum, loc) => sum + ((session.is ?? {})[loc.key] ?? 0), 0);
      const total = armorMax + isMax;
      units.push({
        id: `vehicle_${index}`,
        name: state.name.slice(0, 80),
        pilot: (session.pilot.name || `Vehículo ${index + 1}`).slice(0, 80),
        hpPercent: session.destroyed || total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(((armorCur + isCur) / total) * 100))),
        isDestroyed: session.destroyed,
      });
    });
    return units;
  }, [sim.mechSlots, sim.vehicleSlots]);

  useEffect(() => {
    if (!authReady) return;
    const unsubs = LIVE_ROOM_IDS.map(roomId => onSnapshot(doc(db, 'live_rooms', roomId), snap => {
      const data = snap.data();
      const expiresAt = timestampMillis(data?.expiresAt) || null;
      const expired = expiresAt !== null && expiresAt <= Date.now();
      setRooms(prev => prev.map(room => room.id === roomId ? {
        id: roomId,
        status: snap.exists() && data?.status === 'active' && !expired ? 'active'
          : snap.exists() ? 'closed' : 'missing',
        generation: typeof data?.generation === 'string' ? data.generation : null,
        expiresAt,
      } : room));
    }, e => setError(e.message)));
    return () => unsubs.forEach(unsub => unsub());
  }, [authReady]);

  const pushState = useCallback(async () => {
    if (!activeRoomId) return;
    try {
      const user = await ensureIdentity();
      const result = await callUpsertSession({
        roomId: activeRoomId,
        playerName: playerName.trim().slice(0, 40) || `Piloto ${user.uid.slice(0, 6)}`,
        units: buildUnits(),
      });
      setActiveGeneration(result.data.generation);
      setError(null);
    } catch (e) {
      setError(liveErrorMessage(e));
    }
  }, [activeRoomId, playerName, buildUnits, ensureIdentity]);

  const joinRoom = useCallback(async (roomId: LiveRoomId = selectedRoomId) => {
    setBusy(true);
    setError(null);
    try {
      await ensureIdentity();
      const result = await callUpsertSession({
        roomId,
        playerName: playerName.trim().slice(0, 40) || 'Piloto Local',
        units: buildUnits(),
      });
      setSelectedRoomIdState(roomId);
      setActiveRoomId(roomId);
      setActiveGeneration(result.data.generation);
      sessionStorage.setItem('liveRoomId', roomId);
      sessionStorage.setItem('liveJoined', '1');
    } catch (e) {
      setError(liveErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [selectedRoomId, playerName, buildUnits, ensureIdentity]);

  const leaveRoom = useCallback(async () => {
    if (!activeRoomId) return;
    setBusy(true);
    try {
      await callLeaveRoom({ roomId: activeRoomId });
    } catch (e) {
      setError(liveErrorMessage(e));
    } finally {
      setActiveRoomId(null);
      setActiveGeneration(null);
      setSessions([]);
      setMySession(null);
      setIncomingAttacks([]);
      setOutgoingAttacks([]);
      sessionStorage.removeItem('liveJoined');
      setBusy(false);
    }
  }, [activeRoomId]);

  const toggleLive = useCallback(async () => {
    if (activeRoomId) await leaveRoom();
    else await joinRoom();
  }, [activeRoomId, joinRoom, leaveRoom]);

  const setSelectedRoomId = useCallback((roomId: LiveRoomId) => {
    if (activeRoomId) return;
    setSelectedRoomIdState(roomId);
    sessionStorage.setItem('liveRoomId', roomId);
  }, [activeRoomId]);

  const openRoom = useCallback(async (roomId: LiveRoomId) => {
    if (!userRole) return;
    setBusy(true);
    try {
      await callOpenRoom({ roomId });
      setSelectedRoomId(roomId);
      setError(null);
    } catch (e) {
      setError(liveErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [userRole, setSelectedRoomId]);

  const closeRoom = useCallback(async (roomId: LiveRoomId) => {
    if (!userRole) return;
    setBusy(true);
    try {
      await callCloseRoom({ roomId });
      if (activeRoomId === roomId) await leaveRoom();
      setError(null);
    } catch (e) {
      setError(liveErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [userRole, activeRoomId, leaveRoom]);

  useEffect(() => {
    if (!activeRoomId) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => void pushState(), 300);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [activeRoomId, pushState, sim.mechSlots, sim.vehicleSlots]);

  useEffect(() => {
    if (!activeRoomId || !activeGeneration || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const sessionsQuery = query(
      collection(db, 'live_rooms', activeRoomId, 'sessions'),
      where('generation', '==', activeGeneration),
    );
    return onSnapshot(sessionsQuery, snap => {
      const all = snap.docs.map(item => {
        const data = item.data();
        return {
          id: item.id,
          playerName: String(data.playerName ?? 'Piloto'),
          updatedAt: timestampMillis(data.updatedAt),
          units: Array.isArray(data.units) ? data.units as LiveUnit[] : [],
          incomingDamage: [],
          generation: String(data.generation ?? ''),
        } satisfies LiveSession;
      });
      setSessions(all.filter(session => session.id !== uid));
      setMySession(all.find(session => session.id === uid) ?? null);
    }, e => setError(e.message));
  }, [activeRoomId, activeGeneration]);

  useEffect(() => {
    if (!activeRoomId || !activeGeneration || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const incomingQuery = query(
      collection(db, 'live_rooms', activeRoomId, 'attacks'),
      where('generation', '==', activeGeneration),
      where('targetUid', '==', uid),
      where('status', '==', 'pending'),
    );
    const outgoingQuery = query(
      collection(db, 'live_rooms', activeRoomId, 'attacks'),
      where('generation', '==', activeGeneration),
      where('senderUid', '==', uid),
      where('status', '==', 'pending'),
    );
    const mapAttack = (item: { id: string; data: () => Record<string, unknown> }): LiveAttack => {
      const data = item.data();
      return {
        id: item.id,
        senderUid: String(data.senderUid ?? ''),
        targetUid: String(data.targetUid ?? ''),
        sourceSessionName: String(data.sourceSessionName ?? 'Piloto'),
        sourceUnitName: String(data.sourceUnitName ?? ''),
        targetUnitId: String(data.targetUnitId ?? ''),
        weaponName: String(data.weaponName ?? ''),
        damage: Number(data.damage ?? 0),
        timestamp: timestampMillis(data.createdAt),
        ammoVariant: typeof data.ammoVariant === 'string' ? data.ammoVariant : undefined,
        heatToTarget: Number(data.heatToTarget ?? 0) || undefined,
        status: 'pending',
        generation: String(data.generation ?? ''),
      };
    };
    const unsubIncoming = onSnapshot(incomingQuery, snap => setIncomingAttacks(snap.docs.map(mapAttack)), e => setError(e.message));
    const unsubOutgoing = onSnapshot(outgoingQuery, snap => setOutgoingAttacks(snap.docs.map(mapAttack)), e => setError(e.message));
    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [activeRoomId, activeGeneration]);

  useEffect(() => {
    setMySession(current => current ? { ...current, incomingDamage: incomingAttacks } : current);
  }, [incomingAttacks]);

  useEffect(() => {
    if (!activeRoomId) return;
    const room = rooms.find(item => item.id === activeRoomId);
    if (room && (
      room.status !== 'active' ||
      (activeGeneration !== null && room.generation !== null && room.generation !== activeGeneration)
    )) {
      void leaveRoom();
    }
  }, [rooms, activeRoomId, activeGeneration, leaveRoom]);

  const sendAttack = useCallback(async (
    targetSessionId: string,
    targetUnitId: string,
    sourceUnitName: string,
    weaponName: string,
    damage: number,
    opts?: { ammoVariant?: string; heatToTarget?: number },
  ) => {
    if (!activeRoomId) return;
    try {
      await callSendAttack({
        roomId: activeRoomId,
        targetUid: targetSessionId,
        targetUnitId,
        sourceUnitName,
        weaponName,
        damage,
        ammoVariant: opts?.ammoVariant,
        heatToTarget: opts?.heatToTarget ?? 0,
      });
      setError(null);
    } catch (e) {
      setError(liveErrorMessage(e));
    }
  }, [activeRoomId]);

  const resolveAttack = useCallback(async (attack: IncomingDamage) => {
    if (!activeRoomId) return;
    try {
      await callResolveAttack({ roomId: activeRoomId, attackId: attack.id });
    } catch (e) {
      setError(liveErrorMessage(e));
    }
  }, [activeRoomId]);

  const revokeMyAttacks = useCallback(async (sourceUnitName: string) => {
    if (!activeRoomId) return;
    const matches = outgoingAttacks.filter(attack => attack.sourceUnitName === sourceUnitName);
    await Promise.all(matches.map(attack =>
      callCancelAttack({ roomId: activeRoomId, attackId: attack.id }).catch(e => {
        setError(liveErrorMessage(e));
      })
    ));
  }, [activeRoomId, outgoingAttacks]);

  return {
    isLive: activeRoomId !== null,
    toggleLive,
    joinRoom,
    leaveRoom,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    activeRoomId,
    openRoom,
    closeRoom,
    canManageRooms: userRole !== null,
    busy,
    error,
    playerName,
    setPlayerName,
    sessions,
    mySession,
    sendAttack,
    resolveAttack,
    revokeMyAttacks,
  };
}
