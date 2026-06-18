# CLAUDE.md — Contexto del Proyecto para Claude Code

## Proyecto
**CRFM — Comisión de Revisión y Fianza de Mercenarios**
App de gestión de campaña BattleTech. React + TS + Tailwind v4 + Vite + Firebase.
Repo: `https://github.com/Markirov/CRFM`
Deploy: `https://crfm-dc873.web.app` + custom `https://legadometalico.com`
Backend: Firebase (Firestore + Auth Google con whitelist)
Path local: `E:\Drive\CBT\CFRM-firebase\`
Dev server: port 5000

---

## Stack Técnico

- **React 19** + TypeScript 5.8
- **Tailwind CSS v4** con `@theme` tokens (NO Tailwind config file — todo en `src/index.css`)
- **Vite 6** con `@tailwindcss/vite` plugin + manualChunks (react-vendor, firebase-app/store/auth, icons, d3)
- **Zustand** para estado global (campaña, UI, roster)
- **React Router v7** con `BrowserRouter`, páginas lazy-loaded vía `pageLoaders` map + Suspense + RouteErrorBoundary
- **Firebase 12** (Firestore + Auth)
- **Lucide React** para iconos
- **@dnd-kit** (core/sortable/utilities) para drag&drop en Taller
- **d3-delaunay** disponible para Voronoi (Mapa Estelar futuro)

## Deploy

GitHub Action automático. Push a `main` → build → deploy a Firebase Hosting.
- `base: '/'` en `vite.config.ts`
- Assets estáticos en `/public/` (`import.meta.env.BASE_URL`)
- Workflow: `.github/workflows/firebase-deploy.yml`
- Secret GitHub: `FIREBASE_SERVICE_ACCOUNT_CRFM_DC873`
- Hosting: SPA rewrites, cache headers en `firebase.json`

Alternativa rápida (skip Action): `firebase deploy --only hosting` (Launcher opción 4).

## Auth

Google sign-in. Whitelist en `src/lib/firebase-config.ts` (`ALLOWED_EMAILS`) Y en `firestore.rules`. Cambiar emails = actualizar AMBOS sitios + `firebase deploy --only firestore:rules`.

Gate: `src/components/shell/AuthGate.tsx` envuelve App en `main.tsx`.
Logout: botón en SecretMenu.

## Backup Firestore

`scripts/backup-firestore.ts` exporta todas las colecciones a `backups/YYYY-MM-DD_HHmmss/<col>.json`. Usa Firebase Admin SDK con service account.

Setup (una vez):
1. Firebase Console → Project Settings → Service Accounts → Generate new private key → descarga JSON
2. Guarda fuera del repo (p.ej. `C:\firebase-keys\crfm-backup.json`)
3. `setx GOOGLE_APPLICATION_CREDENTIALS "C:\firebase-keys\crfm-backup.json"` (permanente)

Uso: Launcher opción 5, o `npx tsx scripts/backup-firestore.ts`. Carpeta `backups/` ignorada en git.

---

## Estructura del Proyecto

```
src/
├── main.tsx                    ← Entry (BrowserRouter + AuthGate)
├── App.tsx                     ← Router lazy + Shell + paleta por ruta
├── index.css                   ← Design system Stitch
│
├── components/
│   ├── shell/
│   │   ├── Sidebar.tsx         ← Nav 4 secciones (con preloadByPath)
│   │   ├── Header.tsx
│   │   ├── SectionTabs.tsx
│   │   ├── AuthGate.tsx
│   │   ├── RouteErrorBoundary.tsx
│   │   └── SecretMenu.tsx      ← Settings + treasury override + reset legacy mechs
│   ├── simulador/              ← ArmorDiagram, PilotPanel, HeatMonitor, CriticalMatrix, UnitSlots (con lock), CombatLog, FuerzaSyncBar, CatalogSearch...
│   ├── barracones/             ← FichaHeraldica, MechAssignmentBar (NEW), SheetsPanel, CombatePanel
│   └── ui/
│
├── hooks/
│   ├── useSimulador.ts         ← Hook principal del simulador
│   ├── useBarracones.ts        ← Barracones (carga/guarda PJs)
│   └── useMechCatalog.ts       ← Catálogo singleton (index.json)
│
├── lib/
│   ├── firebase-config.ts      ← Config Firebase + ALLOWED_EMAILS
│   ├── firebase-service.ts     ← Servicio Firestore (load/save/sanitize)
│   ├── combat-types.ts         ← MechSlot ahora con maintenance? opcional
│   ├── combat-data.ts          ← Tablas BT + transferencias + calor
│   ├── parsers.ts              ← Parsers SSW/MTF/SAW completos
│   ├── ssw-basic.ts            ← Parser ligero (chassis/model/tons/cost)
│   ├── weapons.ts
│   ├── repair-engine.ts        ← Coste reparación per-componente (propio + canon)
│   ├── repair-priority.ts      ← Sistema priorización + drag&drop
│   ├── maintenance-engine.ts   ← Quality Rating + DamagePatch + tablas MoS/MoF
│   ├── hangar-types.ts         ← HangarItem (inventario mechs)
│   ├── simulador-persistence.ts← Snapshot localStorage + load/save mech maintenance
│   ├── types.ts                ← Tipos generales
│   ├── navigation.ts           ← Rutas + secciones + paletas
│   ├── store.ts                ← Zustand
│   ├── roster.ts               ← Roster derivado de personajes
│   └── currency-utils.ts
│
├── pages/
│   ├── PortadaPage.tsx
│   ├── ComisionPage.tsx
│   ├── ReclutamientoPage.tsx
│   ├── BarraconesPage.tsx + Legacy
│   ├── HojaServicioPage.tsx + Legacy
│   ├── SimuladorPage.tsx       ← Funcional + lock slots hangar en modo campaña
│   ├── FinanzasPage.tsx        ← Libro Mayor + Personal + TallerModal + AcquisitionModal
│   ├── HangarPage.tsx          ← NEW: Inventario / Comprar / Vender
│   ├── TallerPage.tsx          ← Prioridades + Mantenimiento + Factura
│   ├── HudTacticoPage.tsx      ← Placeholder
│   ├── AyudasPage.tsx
│   ├── TROPage.tsx             ← Catálogo searchable + botón Comprar para hangar
│   ├── MapaEstelarPage.tsx
│   ├── CronicasPage.tsx
│   └── LogrosPage.tsx
│
scripts/
├── backup-firestore.ts         ← Backup Admin SDK
├── rebuild-indexes.cjs         ← Genera index.json mechs/vehicles
├── sync-solaris.cjs            ← Copia .ssw nuevos desde Solaris + rebuild
├── build-systems-data.ts
└── local.bat / deploy.bat / deploy-firebase.bat / backup.bat / index.bat / sync-solaris.bat

public/
├── assets/
│   ├── mechs/index.json + *.ssw    ← Catálogo mechs (~4200)
│   └── vehicles/index.json + *.saw ← Catálogo vehículos
├── mech-blueprint.png
└── ...
```

---

## Design System Stitch

### Triple Paleta (se activa por ruta via `data-palette` en App.tsx)

| Paleta | Uso | Primary | Bright |
|--------|-----|---------|--------|
| **amber** | Civil: Comisión, Reclutamiento, Barracones, Hoja, Finanzas, Hangar, Taller, Crónicas, Logros | `#ffd79b` | `#ffae00` |
| **blue** | Tech: TRO, Ayudas, Mapa | `#bdf4ff` | `#60a5fa` |
| **green** | Militar: Simulador, HUD Táctico | `#4ade80` | `#00ff41` |

Los componentes usan `var(--p)`, `var(--p-bright)`, etc.

### Estilo Visual
- Zero border-radius (angular, militar)
- `clip-chamfer` para paneles (clip-path 8px)
- Scanline CRT overlay fijo
- Tipografía: Space Grotesk (headlines), Inter (body), Share Tech Mono (datos)
- Fondo `#10141a` con jerarquía surfaces

Más detalle en `herramientas/MD/DESIGN.md`.

---

## Arquitectura del Simulador

### Separación State / Session

```typescript
interface MechSlot {
  state:        MechState | null;
  session:      MechSession | null;
  maintenance?: MechMaintenanceState; // NEW: quality rating + historial + extraDamage
}
```

- `MechState`: chassis, model, tonnage, armor max, IS max, armas, crits, ammo bins
- `MechSession`: armor actual, IS actual, calor, heridas, crits hit, ammo bins actuales, activeShots, logs
- `MechMaintenanceState`: qualityRating A-F, experienciaEquipo, techRating, historial, extraDamage acumulado

### Persistencia
- `kk_simulador_session_v1` localStorage — `SimuladorSnapshot`
- `loadMechMaintenance(idx)` / `saveMechMaintenance(idx, state)` helpers en `simulador-persistence.ts`

### Modo Campaña + Hangar
Al activar **Campaña** en sim, los slots se cargan desde el hangar:
- Lee `loadHangar()` items
- Para cada `CAMPAIGN_PILOT_ORDER[i]` → busca rosterIdx → encuentra `HangarItem.pilotoIdx === rosterIdx`
- Fetch `.ssw` priorizando `item.sourceFile`
- Persiste mapping en `hangarBySlot`
- Slots con item: **bloqueados** (badge 🔒, upload disabled, CatalogSearch + handleFileUpload guardados)

### Mecánicas Implementadas (en `combat-data.ts`)
1. Cadena de transferencia daño (armor → IS → transfiere)
2. Curación
3. Destrucción CT/HD/Engine/Gyro
4. Armas (verifica destrucción, munición)
5. Explosión munición (al marcar crit ammo)
6. Calor (mov + armas + reactor + jump − disipación)
7. Fin de turno
8. Gunnery (base + calor + heridas + sensores×2 + mov)
9. Piloting (base + gyro×3 + heridas)
10. MP efectivo

Tablas calor/destrucción/heridas/transferencia: ver `herramientas/MD/WARTHOGS_FLEET_MECHANICS_REFERENCE.md`.

---

## Sistema de Reparación (3 capas)

Arquitectura unificada en `/taller`:

### 1. Coste (`src/lib/repair-engine.ts`)
- `MechRepairConfig` (tipos de blindaje/estructura/reactor/etc.)
- Funciones per-componente: `costoActuador`, `costoReactor`, `costoBlindaje`, etc.
- Dos sistemas: `RepairSystem = 'propio' | 'canon'` (CamOps)
- `configFromCatalog(catalog)` deriva config desde CatalogMech

### 2. Tiempo + prioridades (`src/lib/repair-priority.ts`)
- `RepairItem` con `tiempoBase`, `costoBase`, `categoria`, `divisible`
- `mapearDamageARepairItemsConCoste(damage, config, system, mechTons)` rellena costoBase per-componente
- 4 presets (Persecución, Patrulla, Atrincherado, Manual) + orden secundario (asc/desc/manual)
- `calcularReparaciones(items, minutos, minutosBase, config)` → status `reparado | parcial | pendiente`
- `agregarCostes` y `costoFinal(bruto, pct)` para Factura

### 3. Mantenimiento rutinario (`src/lib/maintenance-engine.ts`)
- `QualityRating A-F` con `QUALITY_COST_MOD` y `QUALITY_TN_MOD`
- `calcularTNMantenimiento(exp, techRating, quality, mods)` + 2D6
- `MAINTENANCE_CHECK_TABLE_MOS/MOF` matrices completas
- `tirarDanoAleatorio(jumpJets, ammo)` → `DamagePatch[]`
- `aplicarDamagePatches(damage, patches)` aplica a damage del mech
- `mergeDamage(a, b)` para combinar damage del sim + extraDamage del mantenimiento

UI: 3 tabs en `/taller`:
- **Prioridades**: drag&drop items + flechas ▲▼ + sistema canon/propio + slider estadoFactPct + botón Registrar gasto
- **Mantenimiento**: badge Quality + TN calcs + flow tirar 2D6 → resolver → tirar daño → aplicar todo (persiste qualityRating + extraDamage + historial)
- **Factura**: TallerModal manual ad-hoc

Specs históricas: `herramientas/MD/spec_sistema_prioridades_reparacion.md` (DONE), `spec_unificado_y_mantenimiento.md` (DONE).

---

## Hangar (Inventario de Mechs)

### Modelo (`src/lib/hangar-types.ts`)
```typescript
interface HangarItem {
  id, chassis, model, tons, bv?, era?, techRating?, sourceFile?,
  precioBase, valorActual, fechaCompra,
  pilotoIdx?,            // 0..roster.length-1
  estadoPct?, qualityRating?, damagePersist?,
  notas?, createdAt, updatedAt
}
```

### Persistencia (`firebase-service.ts`)
- Collection `hangar/{id}`
- `loadHangar()` / `saveHangarItem(item)` (sanitize undefined → deleteField())
- `deleteHangarItem(id)` / `assignPilotToHangar(id, pilotoIdx)`

### UI (`/hangar` — Cuartel General)
3 sub-tabs:
- **Inventario**: tabla tipo TRO (Nombre · Tipo · Tons · BV · Año · Era · Valor · Asignado · Compra) con dropdown piloto inline + conflict prompt bidireccional
- **Comprar**: search catálogo TRO → fetch `.ssw` → autorrellena chassis/model/tons/cost → slider factor compra 0-200% (descuento/markup) → asiento `compra_mech` libro mayor
- **Vender**: lista hangar → slider estado 0-150% → asiento `venta_mech` + delete

### Botón Comprar desde TRO
TRO DetailPanel (mechs only) → navega `/hangar?buy=<file>` + setActiveSubTab('comprar') → auto-selecciona en ComprarTab.

### Asignación piloto↔mech (bidireccional)
- **Ficha piloto** (Barracones tab Ficha): `MechAssignmentBar` arriba con dropdown del hangar
- **Inventario hangar**: dropdown piloto por fila
- Conflictos siempre prompted con `window.confirm`:
  - Piloto ya tenía otro mech → liberar anterior?
  - Mech ya estaba con otro piloto → robarlo?
- Roster es la fuente de pilotos (no campaign.pilotMechs legacy)

### Reset legacy
SecretMenu bloque rojo: borra `PILOTO_N_MECH` config + `mech` en personajes + cache localStorage.

---

## Sync Solaris → Assets

Flow para añadir mechs nuevos:
1. Crea/edita mech en Solaris Skunk Werks (SSW desktop) → exporta `.ssw`
2. Launcher opción **6** (Sync Solaris): `scripts/sync-solaris.cjs` busca SSW en candidatos comunes (override `SOLARIS_DIR` env), walk recursivo, copia los faltantes a `public/assets/mechs/`, regenera `index.json`
3. Launcher opción **3** (Deploy bump+commit+push): GH Action despliega

⚠ Siempre opción 3 (no 4) para mechs nuevos — el repo debe tener los archivos para futuros builds.

---

## Backend: Firebase Firestore

Estructura colecciones (`config/main` doc único + colecciones):

| Collection | Contenido |
|---|---|
| `config/main` | key/value (año/mes campaña, contrato_valor, FUERZA1..5, FUERZACAMPAÑA, ENEMIGO1..5, etc.) |
| `personajes/{nombre}` | PJ/PNJ con xpTotal, xpDisponible, mech, etc. |
| `personal/{id}` | Techs, astechs, médicos |
| `libroMayor/{id}` | Tesorería con categoría (compra_mech, venta_mech, repuestos, mantenimiento_mensual, etc.) |
| `fuerzas/{id}` | Snapshots simulador (combates concretos) |
| `hangar/{id}` | Inventario mechs (NEW) |
| `cronicas/{id}` | Narrativa campaña |
| `ordenDia/{id}` | Órdenes diarias |
| `parteDiario/{id}` | Partes diarios |
| `historial/{id}` | Misiones (Hoja Servicio + Telegram) |
| `logros/{id}` | Achievements pilotos |
| `mejoras/{id}` | Subidas XP de personajes |
| `gastosXP/{id}` | Gastos XP varios (rerolls) |

Servicio: `src/lib/firebase-service.ts` con `safe()` envelope (`{success, data, error}`).

`sanitizeForFirestore` convierte `undefined` → `deleteField()` para top-level y omite anidados.

`commitLibroEntryAndTreasury(entry, prevEntry?)` wrapper: persiste libro + actualiza CONTRATO_VALOR optimista en store.

---

## Secciones de la App (sidebar 4 grupos)

### CUARTEL GENERAL (amber)
- Comisión (`/`) — Landing
- Reclutamiento (`/reclutamiento`)
- Finanzas (`/finanzas`) — Inicio / Libro Mayor / Personal
- **Hangar** (`/hangar`) — Inventario / Comprar / Vender
- Barracones (`/barracones`)

### OPERACIONES
- Simulador (`/simulador`, green) — Infantería / Mechs / Vehículos
- **Taller** (`/taller`, amber) — Prioridades / Mantenimiento / Factura
- HUD Táctico (`/hud`, green)
- Hoja de Servicio (`/hoja-servicio`, amber)

### TÁCTICO (blue)
- Ayudas (`/ayudas`)
- Manual Técnico (TRO) (`/tro`) — con botón Comprar para Hangar

### INTEL (blue/amber)
- Navegación (`/mapa`) — Calculadora Saltos / Mapa Estelar
- Logros (`/logros`)
- Crónicas (`/cronicas`)

---

## Convenciones de Código

- Componentes: función exportada con nombre (`export function ComponentName`)
- Hooks: prefijo `use`
- Tipos: archivos separados (`combat-types.ts`, `hangar-types.ts`, etc.)
- Lógica pura: `combat-data.ts`, `repair-engine.ts`, `maintenance-engine.ts` (sin side effects, testeables)
- CSS: Tailwind v4 + design system tokens
- Palette-aware: `var(--p)` cuando varía por sección
- Import paths: `@/` alias

---

## Documentos de Referencia (`herramientas/MD/`)

| Doc | Estado |
|---|---|
| `WARTHOGS_FLEET_MECHANICS_REFERENCE.md` | Mecánicas BT vivas |
| `DESIGN.md` | Design system |
| `INFORME_COSTES.md` | Compilación costes |
| `INFORME_DISCREPANCIAS_CANON.md` | Taller propio vs CamOps |
| `APPS_SCRIPT.md` | Referencia endpoints legacy (Sheets) — obsoleto, migrado Firebase |
| `COMBAT_IMPROVEMENTS_SPEC.md` | F1 done · F2-F5 pendientes |
| `INFANTRY.spec.md` | Pendiente |
| `DYNAMIC_STAR_MAP_SPEC.md` | Pendiente |
| `TELEGRAM_SPEC.md` | Cliente listo · setup manual pendiente |
| `BARRACONES_DYNAMIC_DOSSIER_SPEC.md` | Pendiente |
| `BUILD_SCRIPT_SPEC.md` | Referencia ETL |
| `spec_sistema_prioridades_reparacion.md` | **DONE** |
| `spec_unificado_y_mantenimiento.md` | **DONE** |
| `spec_hangar_integracion.md` | Plan próximo |
| `PENDING.md` | Backlog activo |
| `TechManual.md` / `Campaign Operations.md` | Manuales canon (NO editar) |

### Manuales canon (NO commitear)
Carpeta `manuales/` (gitignored). PDFs comerciales BattleTech.

---

## Seguridad

- `.gitignore`: `credenciales*.json`, `*service-account*.json`, `secrets.*`, `manuales/`, `.env*`, `backups/`, `herramientas/`, `AutoMover.py`
- Firebase service account NUNCA en repo
- Whitelist emails en `firebase-config.ts` Y `firestore.rules` (actualizar AMBOS + redeploy rules)
- Apps Script TOKEN Telegram revoked en sesiones anteriores — usar SecretMenu Treasury override en lugar de asientos sintéticos
