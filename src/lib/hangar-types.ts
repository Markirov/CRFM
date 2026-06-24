// ══════════════════════════════════════════════════════════════
//  hangar-types.ts — Inventario persistente de mechs propiedad
//  de la compañía. Distinto de `fuerzas/` (snapshots de simulador
//  para combates concretos). Aquí: 1 doc por mech físico que la
//  unidad posee, con asignación opcional a piloto + precio + estado.
//
//  Collection Firestore: hangar/{id}
//  Manipulación: src/lib/firebase-service.ts (load/save/delete).
// ══════════════════════════════════════════════════════════════

import type { QualityRating, MaintenanceLogEntry } from './maintenance-engine';
import type { MechRepairDamage } from './repair-engine';

/** Un mech físico del hangar. */
export interface HangarItem {
  /** ID estable; prefijo "hng_" para distinguir en logs. */
  id:           string;

  // ── Identidad mech ──
  chassis:      string;   // "Atlas"
  model:        string;   // "AS7-D"
  tons:         number;
  bv?:          number;
  era?:         string;
  techRating?:  string;   // 'A'..'F' (alimenta MechMaintenanceState)
  /** Nombre del .ssw en public/assets/mechs/ (clave para fetch en Simulador). */
  sourceFile?:  string;
  /** XML modificado y serializado del Mech, si ha sido editado por el usuario in-app. 
   * Tiene precedencia sobre sourceFile. */
  sswRaw?:      string;
  /** True si el mech tiene jump jets (afecta 'Mech Damage Status Table). */
  hasJumpJets?: boolean;
  /** True si el mech tiene armas con munición (afecta 'Mech Damage Status Table). */
  hasAmmo?:     boolean;

  // ── Económico ──
  /** Precio canon/TRO del mech nuevo (referencia). */
  precioBase:   number;
  /** Valor actual; arranca = precioBase, se ajusta por estado/depreciación. */
  valorActual:  number;
  /** Fecha de compra en formato campaña (ISO yyyy-mm-dd). */
  fechaCompra:  string;

  // ── Asignación ──
  /** Índice de piloto 0..5 (1..6 UI). undefined = sin asignar (reserva). */
  pilotoIdx?:   number;

  // ── Estado persistente ──
  /** Operativo, dañado, destruido, o desguazado. */
  estado?:       'operativo' | 'danado' | 'destruido' | 'desguazado';
  /** 0..100. Espejo de campaign.estadoMechs para este mech. */
  estadoPct?:    number;
  /** Quality rating actual (sigue MechMaintenanceState). */
  qualityRating?: QualityRating;
  /** Daño acumulado que persiste fuera del simulador
   *  (por mantenimiento fallido, combate offline narrativo, etc.). */
  damagePersist?: MechRepairDamage;
  /** Historial de chequeos de mantenimiento (más reciente primero, cap 50). */
  maintenanceHistory?: MaintenanceLogEntry[];
  /** Snapshot ligero de la sesión de combate para conservar armadura/IS/críticos exactos. */
  sessionActiva?: {
    armor: Record<string, number>;
    is: Record<string, number>;
    crits: Record<string, any[]>;
    ammoBins: any[];
    destroyed: boolean;
    destroyedReason?: string;
  };

  // ── Modificación pendiente ──
  /** Solicitud de modificación del loadout. El mech sigue operando con el sswRaw
   *  anterior hasta que DM/Admin apruebe y Taller termine la categoría 'Modificación'.
   *  Status: 'pending' (esperando DM/Admin), 'approved' (aprobada, en taller),
   *  'rejected' (rechazada, devuelta al PJ), 'applied' (taller terminó, sswRaw actualizado). */
  modificacionPendiente?: {
    sswRawNew:      string;
    requestedBy?:   string;   // safeEmail del PJ que la pidió
    requestedAt:    number;   // epoch ms
    status:         'pending' | 'approved' | 'rejected' | 'applied';
    reviewedBy?:    string;   // safeEmail del DM/Admin
    reviewedAt?:    number;
    comment?:       string;   // motivo de rechazo / nota
  };

  // ── Meta ──
  notas?:       string;
  createdAt:    string;   // ISO timestamp
  updatedAt:    string;   // ISO timestamp
}

/** Crea un HangarItem nuevo con defaults; el caller rellena lo demás. */
export function newHangarItem(input: {
  chassis:     string;
  model:       string;
  tons:        number;
  precioBase:  number;
  fechaCompra: string;
  bv?:         number;
  era?:        string;
  techRating?: string;
  pilotoIdx?:  number;
  sourceFile?: string;
  hasJumpJets?: boolean;
  hasAmmo?:     boolean;
}): HangarItem {
  const now = new Date().toISOString();
  return {
    id:          `hng_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    chassis:     input.chassis,
    model:       input.model,
    tons:        input.tons,
    bv:          input.bv,
    era:         input.era,
    techRating:  input.techRating,
    sourceFile:  input.sourceFile,
    hasJumpJets: input.hasJumpJets,
    hasAmmo:     input.hasAmmo,
    precioBase:  input.precioBase,
    valorActual: input.precioBase,
    fechaCompra: input.fechaCompra,
    pilotoIdx:   input.pilotoIdx,
    estadoPct:   100,
    createdAt:   now,
    updatedAt:   now,
  };
}
