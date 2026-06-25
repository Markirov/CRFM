// ══════════════════════════════════════════════════════════════
//  recruitment-requests-service.ts
//  Cola de solicitudes de personaje nuevo creadas en Reclutamiento.
//
//  Path Firestore: recruitmentPending/{requestId}
//
//  Reglas sugeridas (deploy manual):
//   match /recruitmentPending/{id} {
//     allow create: if isAuthenticated();
//     allow read:   if isAuthenticated() &&
//                   (request.auth.token.email == resource.data.createdByEmail
//                    || isAdmin());
//     allow update, delete: if isAdmin();
//   }
// ══════════════════════════════════════════════════════════════

import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, orderBy, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase-config';
import { getSafeEmail } from './firebase-service';
import type { CharacterDraft } from './recruitment/types';

export type RecruitmentStatus = 'pending' | 'approved' | 'rejected' | 'applied';

export interface RecruitmentRequest {
  id:               string;
  createdAt:        number;
  createdByEmail:   string;        // safeEmail del solicitante
  createdByPlayer:  string;        // nombre jugador (campo draft.identity.playerName)
  draft:            CharacterDraft;
  status:           RecruitmentStatus;
  reviewedByEmail?: string;
  reviewedAt?:      number;
  comment?:         string;        // motivo rechazo o nota
  replacesJugador?: string;        // PNJ sustituido al aplicar (doc id personajes/)
  appliedAt?:       number;
}

const REQUESTS_COL = () => collection(db, 'recruitmentPending');

function newRequestId(): string {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Cualquier autenticado crea solicitud. */
export async function createRecruitmentRequest(draft: CharacterDraft): Promise<string> {
  const email = getSafeEmail(auth.currentUser?.email ?? '');
  if (!email) throw new Error('No authenticated user');
  const id = newRequestId();
  const req: RecruitmentRequest = {
    id,
    createdAt:       Date.now(),
    createdByEmail:  email,
    createdByPlayer: draft.identity.playerName,
    draft,
    status:          'pending',
  };
  await setDoc(doc(REQUESTS_COL(), id), req);
  return id;
}

export async function loadAllRequests(): Promise<RecruitmentRequest[]> {
  try {
    const snap = await getDocs(query(REQUESTS_COL(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => d.data() as RecruitmentRequest);
  } catch (e) {
    console.warn('[recruitment-requests] loadAll failed', e);
    return [];
  }
}

/** Suscripción reactiva para badge sidebar + tab. */
export function subscribePendingRequests(cb: (n: number, list: RecruitmentRequest[]) => void): Unsubscribe {
  return onSnapshot(
    query(REQUESTS_COL(), orderBy('createdAt', 'desc')),
    snap => {
      const list = snap.docs.map(d => d.data() as RecruitmentRequest);
      const pending = list.filter(r => r.status === 'pending').length;
      cb(pending, list);
    },
    err => {
      console.warn('[recruitment-requests] snapshot error', err);
      cb(0, []);
    },
  );
}

/** Admin acepta solicitud + registra PNJ sustituido. NO aplica los datos aún. */
export async function approveRecruitmentRequest(
  req: RecruitmentRequest,
  replacesJugador: string,
): Promise<void> {
  const email = getSafeEmail(auth.currentUser?.email ?? '');
  await setDoc(doc(REQUESTS_COL(), req.id), {
    ...req,
    status:          'approved',
    reviewedByEmail: email,
    reviewedAt:      Date.now(),
    replacesJugador,
  });
}

/** Admin rechaza con motivo. */
export async function rejectRecruitmentRequest(
  req: RecruitmentRequest,
  comment: string,
): Promise<void> {
  const email = getSafeEmail(auth.currentUser?.email ?? '');
  await setDoc(doc(REQUESTS_COL(), req.id), {
    ...req,
    status:          'rejected',
    reviewedByEmail: email,
    reviewedAt:      Date.now(),
    comment,
  });
}

/** Marca como applied tras volcar al personaje real. */
export async function markRequestApplied(req: RecruitmentRequest): Promise<void> {
  await setDoc(doc(REQUESTS_COL(), req.id), {
    ...req,
    status:    'applied',
    appliedAt: Date.now(),
  });
}

export async function deleteRequest(id: string): Promise<void> {
  await deleteDoc(doc(REQUESTS_COL(), id));
}
