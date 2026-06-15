// ═══════════════════════════════════════════════════════════════
// sheets-service.ts — SHIM de compatibilidad
//
// El backend real ahora es Firestore (firebase-service.ts).
// Este archivo solo re-exporta para no romper call-sites antiguos.
//
// Eliminar este shim cuando todos los imports se hayan migrado
// directamente a '@/lib/firebase-service'.
//
// Backend Sheets/Apps Script archivado en:
//   herramientas/sheets-service.legacy.ts
// ═══════════════════════════════════════════════════════════════

export * from './firebase-service';
