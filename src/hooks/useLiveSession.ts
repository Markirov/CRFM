import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, getDocs, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase-config';
import { useSimulador } from './useSimulador';
import { useAppStore } from '@/lib/store';

export interface LiveUnit {
  id: string; // e.g. "mech_0" o "vehicle_1"
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
}

export interface LiveSession {
  id: string;
  playerName: string;
  updatedAt: number;
  units: LiveUnit[];
  incomingDamage: IncomingDamage[];
}

const LIVE_COL = 'live_sessions';

export function useLiveSession(sim: ReturnType<typeof useSimulador>) {
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('liveSessionId'));
  const [playerName, setPlayerName] = useState<string>('');
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [mySession, setMySession] = useState<LiveSession | null>(null);
  const [isLive, setIsLive] = useState<boolean>(!!sessionStorage.getItem('liveSessionId'));

  const { roster } = useAppStore();

  // Inicializa playerName basado en el usuario logueado o un nombre por defecto
  useEffect(() => {
    if (!playerName) {
      const email = auth.currentUser?.email;
      const pj = roster.find(r => r.jugador && email && r.jugador.toLowerCase() === email.split('@')[0].toLowerCase());
      if (pj) setPlayerName(pj.nombre || pj.jugador || 'Comandante');
      else setPlayerName(auth.currentUser?.displayName || 'Piloto Local');
    }
  }, [roster, playerName]);

  // Genera las unidades a partir del estado local de Simulador
  const buildUnits = useCallback(() => {
    const units: LiveUnit[] = [];
    sim.mechSlots.forEach((s, i) => {
      if (s.state && s.session) {
        const ms = s.state; const ss = s.session;
        const armorLocs = ['HD','CTf','CTr','LTf','LTr','RTf','RTr','LA','RA','LL','RL'];
        const isLocs    = ['HD','CT','LT','RT','LA','RA','LL','RL'];
        const armorMax = armorLocs.reduce((acc,k) => acc + (((ms.armor as Record<string, number>) || {})[k] ?? 0), 0);
        const armorCur = armorLocs.reduce((acc,k) => acc + (((ss.armor as Record<string, number>) || {})[k] ?? 0), 0);
        const isMax    = isLocs.reduce((acc,k) => acc + (((ms.is as Record<string, number>) || {})[k] ?? 0), 0);
        const isCur    = isLocs.reduce((acc,k) => acc + (((ss.is as Record<string, number>) || {})[k] ?? 0), 0);
        const total = armorMax + isMax;
        const pct = ss.destroyed || total <= 0 ? 0 : Math.round(((armorCur + isCur) / total) * 100);

        units.push({
          id: `mech_${i}`,
          name: `${ms.chassis} ${ms.model}`,
          pilot: ss.pilot.name || `Slot ${i + 1}`,
          hpPercent: pct,
          isDestroyed: ss.destroyed,
        });
      }
    });

    sim.vehicleSlots.forEach((s, i) => {
      if (s.state && s.session) {
        const ms = s.state; const ss = s.session;
        const armorLocs = Object.keys(ms.locations || {});
        const armorMax = armorLocs.reduce((acc,k) => acc + ((ms.locations.find((l:any) => l.key === k)?.maxArmor) ?? 0), 0);
        const armorCur = armorLocs.reduce((acc,k) => acc + ((ss.armor || {})[k] ?? 0), 0);
        const isMax    = armorLocs.reduce((acc,k) => acc + ((ms.locations.find((l:any) => l.key === k)?.maxIS) ?? 0), 0);
        const isCur    = armorLocs.reduce((acc,k) => acc + ((ss.is || {})[k] ?? 0), 0);
        const total = armorMax + isMax;
        const pct = ss.destroyed || total <= 0 ? 0 : Math.round(((armorCur + isCur) / total) * 100);

        units.push({
          id: `vehicle_${i}`,
          name: ms.name,
          pilot: ss.pilot.name || `Vehículo ${i + 1}`,
          hpPercent: pct,
          isDestroyed: ss.destroyed,
        });
      }
    });
    return units;
  }, [sim.mechSlots, sim.vehicleSlots]);

  // Actualiza Firebase con nuestro estado actual
  const pushState = useCallback(async () => {
    if (!isLive || !sessionId) return;
    const units = buildUnits();
    try {
      await setDoc(doc(db, LIVE_COL, sessionId), {
        id: sessionId,
        playerName,
        updatedAt: Date.now(),
        units,
        // No sobrescribimos incomingDamage entero para no borrar lo que nos mandan
      }, { merge: true });
    } catch (e) {
      console.error("Error pushing live state", e);
    }
  }, [isLive, sessionId, playerName, buildUnits]);

  const toggleLive = useCallback(async () => {
    if (isLive) {
      if (sessionId) {
        try { await deleteDoc(doc(db, LIVE_COL, sessionId)); } catch {}
      }
      setIsLive(false);
      setSessionId(null);
      sessionStorage.removeItem('liveSessionId');
    } else {
      const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      setSessionId(newId);
      sessionStorage.setItem('liveSessionId', newId);
      setIsLive(true);
    }
  }, [isLive, sessionId]);

  // Push state cada vez que cambian los slots localmente
  useEffect(() => {
    if (isLive) pushState();
  }, [isLive, pushState, sim.mechSlots, sim.vehicleSlots]);

  // Suscribirse a las sesiones
  useEffect(() => {
    if (!isLive) {
      setSessions([]);
      setMySession(null);
      return;
    }
    const unsub = onSnapshot(collection(db, LIVE_COL), (snap) => {
      const all: LiveSession[] = [];
      const now = Date.now();
      snap.forEach(docSnap => {
        const data = docSnap.data() as LiveSession;
        // Ignorar sesiones muy viejas (> 4 horas)
        if (now - data.updatedAt < 4 * 60 * 60 * 1000) {
          all.push(data);
        }
      });
      setSessions(all.filter(s => s.id !== sessionId));
      setMySession(all.find(s => s.id === sessionId) || null);
    });
    return () => unsub();
  }, [isLive, sessionId]);

  // Limpiar sesión al desmontar
  useEffect(() => {
    const handleUnload = () => {
      if (isLive && sessionId) {
        // Fallback síncrono al descargar
        const data = new Blob([JSON.stringify({ delete: true })], { type: 'application/json' });
        navigator.sendBeacon(`https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/${LIVE_COL}/${sessionId}?currentDocument.exists=true`, data);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (isLive && sessionId) {
        deleteDoc(doc(db, LIVE_COL, sessionId)).catch(() => {});
      }
    };
  }, [isLive, sessionId]);

  // Enviar ataque a otro
  const sendAttack = useCallback(async (targetSessionId: string, targetUnitId: string, sourceUnitName: string, weaponName: string, damage: number) => {
    try {
      const attackId = `atk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const payload: IncomingDamage = {
        id: attackId,
        sourceSessionName: playerName,
        sourceUnitName,
        targetUnitId,
        weaponName,
        damage,
        timestamp: Date.now(),
      };
      await updateDoc(doc(db, LIVE_COL, targetSessionId), {
        incomingDamage: arrayUnion(payload)
      });
    } catch (e) {
      console.error("Error sending attack", e);
    }
  }, [playerName]);

  // Resolver ataque recibido
  const resolveAttack = useCallback(async (attack: IncomingDamage) => {
    if (!sessionId) return;
    try {
      await updateDoc(doc(db, LIVE_COL, sessionId), {
        incomingDamage: arrayRemove(attack)
      });
    } catch (e) {
      console.error("Error resolving attack", e);
    }
  }, [sessionId]);

  return {
    isLive,
    toggleLive,
    playerName,
    setPlayerName,
    sessions,
    mySession,
    sendAttack,
    resolveAttack,
  };
}
