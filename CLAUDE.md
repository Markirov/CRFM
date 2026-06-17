# CLAUDE.md — Contexto del Proyecto para Claude Code

## Proyecto
**CRFM — Comisión de Revisión y Fianza de Mercenarios**
App de gestión de campaña BattleTech. React + TS + Tailwind v4 + Vite + Firebase.
Repo: `https://github.com/Markirov/CRFM`
Deploy: `https://crfm-dc873.web.app` (Firebase Hosting)
Backend: Firebase (Firestore + Auth Google con whitelist)
Path local: `E:\Drive\CBT\CFRM-firebase\`
Dev server: port 5000

---

## Stack Técnico

- **React 19** + TypeScript 5.8
- **Tailwind CSS v4** con `@theme` tokens (NO Tailwind config file — todo en `src/index.css`)
- **Vite 6** con `@tailwindcss/vite` plugin
- **Zustand** para estado global (campaña, UI)
- **React Router v7** con `BrowserRouter`
- **Firebase 12** (Firestore + Auth)
- **Lucide React** para iconos
- **Motion** (Framer Motion) disponible pero no usado aún

## Deploy

GitHub Action automático. Push a `main` → build → deploy a Firebase Hosting.
- `base: '/'` en `vite.config.ts`
- Assets estáticos en `/public/` (`import.meta.env.BASE_URL`)
- Workflow: `.github/workflows/firebase-deploy.yml`
- Secret GitHub: `FIREBASE_SERVICE_ACCOUNT_CRFM_DC873`
- Hosting: SPA rewrites, cache headers en `firebase.json`

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
├── main.tsx                    ← Entry point (BrowserRouter)
├── App.tsx                     ← Router + Shell + paleta automática por ruta
├── index.css                   ← Design system Stitch (tokens @theme + paletas + utilities)
│
├── components/
│   ├── shell/
│   │   ├── Sidebar.tsx         ← Navegación lateral con 9 secciones
│   │   ├── Header.tsx          ← Barra superior (Comisión de Revisión y Fianza de Mercenarios)
│   │   ├── SectionTabs.tsx     ← Sub-tabs dentro de secciones (Mechs/Vehículos/Infantería)
│   │   └── SecretMenu.tsx      ← Settings modal con toggle USE_LEGACY_DESIGNS
│   ├── simulador/
│   │   ├── ArmorDiagram.tsx    ← Diagrama de blindaje con imagen mech + dots por zona
│   │   ├── PilotPanel.tsx      ← Piloto, heridas, movimiento, to-hit
│   │   ├── HeatMonitor.tsx     ← Barra de calor con proyección y warnings
│   │   ├── CriticalMatrix.tsx  ← Layout 3x3 con control de daños
│   │   ├── UnitSlots.tsx       ← Selector de slots 1-5 + botón upload
│   │   └── CombatLog.tsx       ← Terminal de logs
│   └── ui/
│       └── PagePlaceholder.tsx ← Placeholder para secciones no migradas
│
├── hooks/
│   └── useSimulador.ts         ← Hook principal del simulador (state/session)
│
├── lib/
│   ├── firebase-config.ts      ← Config Firebase + ALLOWED_EMAILS whitelist
│   ├── firebase-service.ts     ← Servicio Firestore (load/save config, players, roster, etc.)
│   ├── combat-types.ts         ← Tipos: MechState, MechSession, VehicleState, etc.
│   ├── combat-data.ts          ← Tablas BT, cadena de transferencia, calor, daño, curación
│   ├── parsers.ts              ← Parsers SSW/MTF/SAW (portados del HTML original)
│   ├── weapons.ts              ← Base de datos de armas + ammo helpers
│   ├── types.ts                ← Tipos generales (NavItem, CampaignConfig, etc.)
│   ├── navigation.ts           ← Rutas, secciones, paletas
│   ├── store.ts                ← Zustand store global
│   └── sheets-service.ts       ← Shims legacy (routing a Firestore equivalents)
│
├── pages/
│   ├── SimuladorPage.tsx       ← Simulador de combate (FUNCIONAL)
│   ├── ComisionPage.tsx        ← Placeholder
│   ├── ReclutamientoPage.tsx   ← Placeholder
│   ├── BarraconesPage.tsx      ← Placeholder
│   ├── HojaServicioPage.tsx    ← Placeholder
│   ├── HudTacticoPage.tsx      ← Placeholder
│   ├── AyudasPage.tsx          ← Placeholder
│   ├── TROPage.tsx             ← Placeholder
│   └── CronicasPage.tsx        ← Placeholder
│
scripts/
├── backup-firestore.ts         ← Backup Admin SDK
└── build-mech-data.cjs         ← Genera index.min.json mechs/vehicles

public/
├── assets/
│   ├── mechs/index.json + index.min.json    ← Catálogo mechs
│   └── vehicles/index.json + index.min.json ← Catálogo vehículos
├── mech-blueprint.png          ← Silueta de mech (fondo del diagrama de blindaje)
└── .nojekyll
```

---

## Design System Stitch

### Triple Paleta (se activa por ruta via `data-palette` en App.tsx)

| Paleta | Uso | Primary | Bright | Surface Tint | Text |
|--------|-----|---------|--------|--------------|------|
| **amber** | Civil: Comisión, Reclutamiento, Barracones, Hoja, Crónicas | `#ffd79b` | `#ffae00` | `#1a1610` | `#e8d5b8` |
| **blue** | Tech: TRO, Ayudas | `#bdf4ff` | `#60a5fa` | `#0a141e` | `#cbe3ff` |
| **green** | Militar: Simulador, HUD Táctico | `#4ade80` | `#00ff41` | `#0a1a0f` | `#b8f0c8` |

Los componentes usan `var(--p)`, `var(--p-bright)`, etc. que cambian según la paleta activa.

### Core Surfaces
- **Void Black** (`#0a0e14`) — Deepest background, sidebar, header
- **Command Dark** (`#10141a`) — Primary canvas background
- **Panel Low** (`#181c22`) — Recessed panel backgrounds
- **Panel Mid** (`#1c2026`) — Standard panel/card backgrounds
- **Panel High** (`#262a31`) — Elevated elements, hover states
- **Panel Highest** (`#31353c`) — Maximum elevation surface, active states

### Estilo Visual
- **Zero border-radius** en todo (angular, militar)
- **clip-chamfer** vía `clip-path: polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)` para paneles
- **Scanline CRT** overlay fijo (2px intervals, opacity 0.3)
- **Tipografía:**
  - Headlines: Space Grotesk, bold/black, uppercase, wide letter-spacing (1-3px)
  - Body: Inter, regular weight
  - Datos/mono: Share Tech Mono (numeric readouts, logs, status codes)
  - Size scale: Micro 8-9px, data 10-11px, body 13px, headers 16-20px
- **Fondo:** `#10141a` con jerarquía de surfaces
- **Imagen del mech:** `filter: invert(1) hue-rotate(180deg)` + `mix-blend-mode: screen`
- **Error Red:** `#ffb4ab` — Damaged components, critical warnings
- **Transitions:** 200ms ease hover, 300ms layout

### Component Patterns
- **Stitch Panel:** Chamfered card, background `surface-container-low`, header mono 10px uppercase 2px tracking
- **Section Tabs:** 11px headline, uppercase, 2px tracking. Active = palette-colored + bottom border
- **Sidebar Navigation:** 12px headline, 1px tracking. Active = 3px left border + tinted background
- **Data Readout:** Label mono 9px uppercase (outline), value headline 13-14px bold (primary-container)

---

## Arquitectura del Simulador

### Separación State / Session

El simulador usa un patrón de **slots** (5 mechs, 4 vehículos):

```typescript
interface MechSlot {
  state: MechState | null;   // Datos estáticos del archivo parseado (inmutable)
  session: MechSession | null; // Estado de combate actual (mutable)
}
```

- **MechState**: chassis, model, tonnage, armor máximo, IS máximo, armas, crits, ammo bins
- **MechSession**: armor actual, IS actual, calor, heridas, crits con hit/no-hit, ammo bins con contadores, activeShots, logs

### Persistencia

- `kk_simulador_session_v1` localStorage — `SimuladorSnapshot` schema 1
- `restoreMechSlotFull(slotIdx)` deja slot como nuevo (armor/IS/crits/ammo)

### Mecánicas Implementadas (en `combat-data.ts`)

1. **Cadena de transferencia de daño**: `mechApplyDamage()` — armor → IS → destruye localización → transfiere (LA→LT→CT)
2. **Curación**: `mechApplyHeal()` — restaura IS y armor hasta máximo
3. **Destrucción**: CT/HD IS=0 → mech destruido. Engine≥3 o Gyro≥2 → destruido
4. **Armas**: `mechToggleWeapon()` — verifica destrucción, munición, consume de bins
5. **Explosión de munición**: `mechToggleCrit()` — al marcar crit de ammo, aplica daño
6. **Calor**: `mechCalcHeatDelta()` — mov + armas + reactor(×5/hit) − disipación
7. **Fin de turno**: `mechNextTurn()` — aplica delta de calor, reset armas/movimiento
8. **Gunnery**: base + calor + heridas + sensores(×2) + movimiento
9. **Piloting**: base + gyro(×3) + heridas
10. **MP efectivo**: walkMP − penalización por calor

### Mecánicas NO Implementadas Aún

- Vehículos completos (session, daño, motive damage, crits fatales)
- Slider de daño bidireccional (negativo = curar)
- Salto por hexes (selector de 1..jumpMP para calor variable)
- Combate RPG personal (Barracones → Combate)
- Infantería convencional y Battle Armor (spec en `herramientas/Md/INFANTRY.spec.md`)

### Tabla de Efectos de Calor

```
Calor 5+:  -1 MOV    |  Calor 17+: +3 DISPARO
Calor 8+:  +1 DISPARO |  Calor 18+: Shutdown 6+
Calor 10+: -2 MOV    |  Calor 19+: Ammo explosion 8+
Calor 13+: +2 DISPARO |  Calor 20+: -4 MOV
Calor 14+: Shutdown 4+ |  Calor 22+: Shutdown 8+
Calor 15+: -3 MOV    |  Calor 24+: +4 DISPARO
Calor 26+: Shutdown 10+ |  Calor 28+: Ammo explosion 4+
Calor 30+: APAGADO AUTOMÁTICO
```

### Destrucción de Sistemas

```
sensors >= 2 hits → NO PUEDE DISPARAR
engine >= 3 hits → MECH DESTRUIDO
gyro >= 2 hits → MECH DESTRUIDO
```

### Heridas del Piloto (TN para consciencia)

```
1 herida: 3+    4 heridas: 10+
2 heridas: 5+   5 heridas: 11+ (INCONSCIENTE)
3 heridas: 7+   6 heridas: MUERTO
```

### Cadena de Transferencia

```
LA → LT → CT (fin)
RA → RT → CT (fin)
LL → LT → CT
RL → RT → CT
HD → FIN (piloto muerto si IS=0)
CT → FIN (mech destruido si IS=0)
```

---

## Parsers

Los parsers están en `src/lib/parsers.ts` y `src/lib/weapons.ts`. Fueron portados del HTML original.

### Funciones principales:
- `mechParseMech(text)` — Detecta SSW (XML) o MTF (texto) y llama al parser correcto
- `mechParseSSW(text)` — Parser XML para archivos .ssw
- `mechParseMTF(text)` — Parser texto plano para archivos .mtf
- `vehicleParseSAW(text, sourceName)` — Parser XML para archivos .saw

### Catálogos enriquecidos

`scripts/build-mech-data.cjs` genera:
- `public/assets/mechs/index.json` + `index.min.json` (4195 mechs)
- `public/assets/vehicles/index.json` + `index.min.json` (845 vehículos)

Hook `useMechCatalog()` carga singleton + cache promise. `findMechByName()` fuzzy.

---

## Secciones de la App (9 total)

| Sección | Ruta | Paleta | Estado |
|---------|------|--------|--------|
| Comisión (Landing) | `/` | amber | Placeholder |
| Reclutamiento (Generador) | `/reclutamiento` | amber | Placeholder |
| Barracones (Fichas RPG) | `/barracones` | amber | Placeholder |
| Hoja de Servicio | `/hoja-servicio` | amber | Placeholder |
| **Simulador** | `/simulador` | green | **FUNCIONAL** |
| HUD Táctico (Battle Tracker) | `/hud` | green | Placeholder |
| Ayudas (TRR Hub) | `/ayudas` | blue | Placeholder |
| Technical Readout (TRO) | `/tro` | blue | Placeholder |
| Crónicas | `/cronicas` | amber | Placeholder |

### Sub-tabs del Simulador
- **Infantería** — Placeholder (futuro: Battle Armor)
- **Mechs** — Funcional
- **Vehículos** — Parcial (carga archivos .saw, UI placeholder)

---

## Backend: Firebase Firestore

Servicio en `src/lib/firebase-service.ts`. Funciones principales:
- `loadConfig()`, `saveConfigBatch(cfg)` — config global (doc `config/main`)
- `loadPlayer(name)`, `searchPilots(name)`, `savePlayer(data)`, `savePilot(data)` — `personajes/{name}`
- `loadRosterAsEnvelope()` — agregado del roster (orden CAMPAIGN_PILOT_ORDER)
- `loadLogros()`, `loadPersonal()`, `loadLibroMayor()`, `loadCronicas()`, `loadParteDiario()`, `loadMovimientos()`, `loadFuerzaCampana()`, etc.
- `sheetsGet/sheetsPost` shims legacy (routing a Firestore equivalents)

Apps Script legacy archivado en `herramientas/sheets-service.legacy.ts`.

---

## Constantes Ajustables (Tuning)

### Pilotos en Barracones (Portada)

**Archivo**: `src/components/barracones/BarraconesPortada.tsx`

| Qué | Constante | Notas |
|---|---|---|
| Lista jugadores fijos | `DEFAULT_PLAYERS` | `['Marcos','Jaime','Joan','Alex','Zhao','Erik']` |
| Color por jugador | `PLAYER_COLORS` | Hex strings, índice = slot |
| Tamaño base foto | `BASE_PILOT_WIDTH = 80` | % del panel |
| Scale específico por slug | `PILOT_SCALE` | Multiplicador. Ej: `zhao: 0.84` |
| Aspect ratio override | `PILOT_ASPECT` | Para PNGs no-cuadrados |

**Foto path**: `pilot-${imageSlug(handle)}.png` en `public/`. Handle = `DEFAULT_PLAYERS[i]`.

### Mech silueta

**Archivo**: `src/components/barracones/BarraconesPortada.tsx`
**Imagen path**: `mech-${chassis}.png` en `public/`. `chassis = mechName.split(' ')[0].toLowerCase()`.

### Configuración campaña

**Archivo store**: `src/lib/store.ts` / **Tipos**: `src/lib/types.ts`

Claves leídas desde Firestore `config/main`:
- `AÑO_CAMPANA`, `MES_CAMPANA`, `COMPANIA_NOMBRE`
- `CONTRATO_VALOR`, `VALOR_UNIDAD`, `TOTAL_MECHS`
- `PILOTO_1_NOMBRE`...`PILOTO_6_NOMBRE`, `PILOTO_1_APODO`...`PILOTO_6_APODO`, `PILOTO_1_MECH`...`PILOTO_6_MECH`

### Imágenes en `public/`

| Archivo | Para qué |
|---|---|
| `pilot-*.png` | Foto piloto (Barracones, Hoja Servicio) |
| `mech-*.png` | Silueta mech (cards Comisión, Barracones) |
| `mech-blueprint.png` | Fallback genérico mech |
| `vehicle-blueprint.png` | Fallback genérico vehículo |
| `house_*_logo.png` | Escudos de casas (Davion, Steiner, etc.) |
| `KIngKarlKRifle.png` | Emblema unidad (hero Comisión) |
| `banner-kkk.png` | Banner hero Comisión |

---

## Convenciones de Código

- **Componentes:** función exportada con nombre (`export function ComponentName`)
- **Hooks:** `use` prefix (`useSimulador`)
- **Tipos:** en archivos separados (`combat-types.ts`, `types.ts`)
- **Lógica pura:** en `combat-data.ts` (funciones sin side effects, testeables)
- **CSS:** Tailwind v4 utility classes. Colores del design system via `text-primary-container`, `bg-surface-container-low`, etc.
- **Palette-aware:** usar `var(--p)` para colores que cambian por sección
- **Import paths:** usar `@/` alias (configurado en vite y tsconfig)

---

## Pendientes Activos (Backlog)

### Bugs
- **Autocannons solo cargan 1 slot de críticos** — parsers no rellenan `slotsUsed`/`slotIndices` para AC
- **Sheets Unidad** — BUSCARV concatena chassis duplicado al final

### Specs pendientes de implementar
- **Infantería + Battle Armor** — spec completa en `herramientas/Md/INFANTRY.spec.md` (6 fases)
- **Combat Improvements F2-F5** — paper doll rework, undo, obligations strip, DamageGrouper (spec en `herramientas/Md/COMBAT_IMPROVEMENTS_SPEC.md`)
- **Mapa Estelar Dinámico** — Voronoi + radio máximo, reemplaza SVGs estáticos (spec en `herramientas/Md/DYNAMIC_STAR_MAP_SPEC.md`)
- **Sistema Prioridades Reparación** — lista reordenable drag-and-drop (spec en `herramientas/Md/spec_sistema_prioridades_reparacion.md`)
- **Pestaña Mantenimiento** — Quality Rating A-F, tiradas daño aleatorio (spec en `herramientas/Md/spec_unificado_y_mantenimiento.md`)

### Features sin UI
- **Historial Combates** — endpoint `getHistorial` listo, sin UI viewer
- **AI Crónicas Gemini** — `PROMPT_INSTRUCCIONES` + `PROMPT_TONO` definidos, sin integración API
- **Telegram** — cliente + backend listos, falta setup manual bot + deploy (spec en `herramientas/Md/TELEGRAM_SPEC.md`)

---

## Documentos de Referencia

Todos en `herramientas/Md/`:

| Documento | Contenido |
|---|---|
| `WARTHOGS_FLEET_MECHANICS_REFERENCE.md` | Referencia completa de mecánicas BT implementadas |
| `DESIGN.md` | Design system visual exportado de Google Stitch |
| `INFORME_COSTES.md` | Compilación costes blindaje/armas/personal/combustible |
| `INFORME_DISCREPANCIAS_CANON.md` | Taller propio vs CamOps canon |
| `APPS_SCRIPT.md` | Referencia endpoints legacy + headers sheets |
| `COMBAT_IMPROVEMENTS_SPEC.md` | Spec mejoras simulador (6 mejoras, F1 done) |
| `INFANTRY.spec.md` | Spec infantería + Battle Armor |
| `DYNAMIC_STAR_MAP_SPEC.md` | Spec mapa estelar dinámico |
| `TELEGRAM_SPEC.md` | Spec integración bot Telegram |
| `BARRACONES_DYNAMIC_DOSSIER_SPEC.md` | Spec fichas dinámicas por facción |
| `BUILD_SCRIPT_SPEC.md` | Spec ETL SUCS + UserDB → JSON |
| `TUNING.md` | Referencia rápida de constantes ajustables |
| `PENDING.md` | Backlog activo detallado |

### Manuales canon (NO commitear)

Carpeta `manuales/` (gitignored). PDFs comerciales BattleTech:
- Campaign Operations 3rd Print — repair, maintenance, salaries
- TechManual — component costs, construction rules
- Tactical Operations — advanced equipment
- FM Mercenaries — salary scales, contracts

---

## Seguridad

- `.gitignore` cubre `credenciales*.json`, `*service-account*.json`, `secrets.*`, `manuales/`, `.env*`, `backups/`
- Google Apps Script URL pública en código (es scriptId, no secret)
- Firebase service account credentials NUNCA en repo
- Whitelist emails en `firebase-config.ts` Y `firestore.rules` (actualizar AMBOS)
