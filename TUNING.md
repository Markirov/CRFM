# TUNING.md — Referencia rápida de ajustes

Dónde editar cada cosa que se ha ido afinando.

---

## Pilotos en Barracones (Portada)

**Archivo**: `src/components/barracones/BarraconesPortada.tsx`

| Qué | Constante / Función | Notas |
|---|---|---|
| Lista jugadores fijos | `DEFAULT_PLAYERS` | `['Marcos','Jaime','Joan','Alex','Zhao','Erik']` |
| Color por jugador | `PLAYER_COLORS` | Hex strings, índice = slot |
| Tamaño base foto | `BASE_PILOT_WIDTH = 80` | % del panel |
| Altura referencia (1:1 escala) | `BASE_HEIGHT_M = 1.80` | metros |
| Scale específico por slug | `PILOT_SCALE` | Multiplicador. Ej: `zhao: 0.84`, `erik: 0.18` |
| Aspect ratio override | `PILOT_ASPECT` | Para PNGs no-cuadrados. Ej: `erik: 710/351` |
| Offset vertical foto | `PILOT_BOTTOM` | CSS bottom. Ej: `erik: '-10px'` |
| Cálculo final ancho | función `pilotWidth()` | aplica scale + altura + clamp por aspect |

**Foto path**: `pilot-${imageSlug(handle)}.png` en `public/`. Handle = `DEFAULT_PLAYERS[i]`, NO se ve afectado por nombres de Configuracion.

---

## Mech silueta en Barracones Portada

**Archivo**: `src/components/barracones/BarraconesPortada.tsx`

| Qué | Constante | Notas |
|---|---|---|
| Ancho por chassis | `MECH_WIDTH` | Ej: `catapult: '65%'` (más padding transparente) |
| Altura/posición | variables `mechBottom`, `mechLeft`, `mechScale` | Cambian con `compactMode` (4+ pilotos) |

**Imagen path**: `mech-${chassis}.png` en `public/`. `chassis = mechName.split(' ')[0].toLowerCase()`.

---

## Foto piloto en Ficha de Barracones

**Archivo**: `src/pages/BarraconesPage.tsx:225`

```tsx
pilotImg={activeIdx < FIXED_COUNT ? `${BASE}pilot-${imageSlug(DEFAULT_FIXED_PLAYERS[activeIdx])}.png` : undefined}
```

Lookup siempre por handle jugador (Marcos/Jaime/...), nunca por nombre personaje.

---

## Cards de Mech en Comisión (landing)

**Archivo**: `src/pages/ComisionPage.tsx`

| Qué | Constante | Notas |
|---|---|---|
| Metadata por chassis | `MECH_META` | `{ weight, bv, cost, imgScale?, imgOffsetX? }` |
| Mapeo nombre → png | función `mechImage(mech, base)` | Detecta chassis por substring |
| Imagen del mech | función `mechImage()` | Devuelve path a `mech-*.png` |
| Stats reales (.ssw) | `mechFileStats` (state) | Sobreescribe `meta` con valores parseados de archivo |

**Render fila stats**: `[ComisionPage.tsx:287-288](src/pages/ComisionPage.tsx#L287)`
- Izquierda: `PRECIO {formatCzar(price)}`
- Derecha: `BV {bv.toLocaleString('es-ES', { useGrouping: 'always' })}`

---

## Display nombre/apodo bajo el mech (Comisión)

**Archivo**: `src/pages/ComisionPage.tsx` (~líneas 680)

```tsx
const apodo    = apodoFromConfig.trim() || p?.apodo?.trim() || p?.callsign || '?';
const fullName = nombre || p?.callsign || '—';
return { pilot: fullName, call: apodo, ... };
```

- `call` (top, ‹ APODO ›): `pilotApodos[i]` config → `pilot.apodo` sheet → `callsign`
- `pilot` (bottom): nombre completo del personaje

Misma cadena en `FichaHeraldica.tsx:537` (Apodo field):
```tsx
val={apodoOverride?.trim() || pilot.apodo || pilot.callsign || '—'}
```

---

## Frases del Orden del Día (al subir atributo)

**Archivo**: `src/pages/ComisionPage.tsx`

| Qué | Constante | Notas |
|---|---|---|
| Pool de frases por atributo | `ATTR_FLAVOR` | 3 frases por FUE/DES/INT/CAR |
| Selección por evento | `entry.ts % pool.length` | Determinista por timestamp |

Para añadir frases: editar `ATTR_FLAVOR.FUE` (etc.) array.

---

## Parte del Día (frases rápidas)

**Lib**: `src/lib/parte-store.ts`
- `ParteEntry { id, text, tone, ts }`
- 4 tonos: `'info' | 'victoria' | 'warning' | 'status'`
- Persiste celda Configuracion `PARTE_DIARIO`
- Máx 50 entradas

**UI editor**: `src/pages/CronicasPage.tsx` componente `ParteSection`
- `PARTE_TONE_META` mapea tono → color/label

**Render Comisión**: `src/pages/ComisionPage.tsx` componente `ParteDiario`
- `PARTE_TONE_COLOR` mapea tono → color
- Muestra primeras 6 entradas

---

## Crónicas

**Lib**: `src/lib/cronicas-store.ts`
- `CronicaEntry { id, ts, campaignYear/Month/Day, autor, autorNombre?, titulo, cuerpo, tag }`
- 3 autores: `'mando' | 'contratista' | 'narrador'`
- 4 tags: `'aar' | 'politica' | 'personal' | 'salto'`
- Persiste celda Configuracion `CRONICAS`
- Máx 200 entradas

**UI**: `src/pages/CronicasPage.tsx`
- `AUTOR_META` — color + default name por autor
- `TAG_META` — color + label por tag
- `Editor` componente — form crear/editar
- `EntryCard` — render con markdown ligero

**Markdown**: `src/lib/markdown-lite.ts`
- `**bold**`, `*italic*`, `> cita`, saltos
- HTML escapado (XSS-safe)

---

## Veterancy / Clearance por facción

**Niveles XP** → `src/lib/barracones-data.ts`:
```ts
VETERANCY = [
  { min: 0,      max: 5000,    nombre: 'Novato',   ... },
  { min: 5001,   max: 30000,   nombre: 'Regular',  ... },
  { min: 30001,  max: 65000,   nombre: 'Veterano', ... },
  { min: 65001,  max: 100000,  nombre: 'Elite',    ... },
  { min: 100001, max: Infinity,nombre: 'As',       ... },
];
```

**Nombres por facción** → `src/data/faction-dossier.ts`:
```ts
clearanceLabel:  'RANGO',
clearanceNames:  ['RECLUTA','SOLDADO','VETERANO','ÉLITE','CABALLERO'],
```

Para añadir/editar: modificar `clearanceNames` (5 strings) en el dossier de la facción.

**Render**: `FichaHeraldica.tsx`
- `clearanceText` arriba derecha (RANGO · NIVEL (ROMANO))
- `rank` en seal anillo (mismo nivel)

---

## Dossier Facción (escudo, nombre militar, prefijo serial)

**Archivo**: `src/data/faction-dossier.ts`

| Campo | Para qué |
|---|---|
| `code` | ID interno (LC/FS/DC/FWL/CC/OA/MERC) |
| `militaryAcronym` | Esquina sup. izq. ficha (ej: `FAFS`) |
| `militaryName` | Cabecera ficha |
| `dossierTitle` | Subtítulo central |
| `filePrefix` | Prefijo en N.º expediente |
| `crestAsset` | PNG escudo (`null` = monograma) |
| `crestScale`, `crestOffsetY` | Ajuste fino del escudo |
| `clearanceLabel`, `clearanceNames` | Rangos por veterancy |

**Mapping origen → código**: `ORIGIN_MAP` (acepta varias variantes en español/inglés).

**Defecto** si origen no reconocido: `MERC`.

---

## Configuración campaña (PILOTO_X_*, año, etc.)

**Archivo cliente**: `src/App.tsx` (carga inicial)
**Archivo store**: `src/lib/store.ts`
**Archivo tipos**: `src/lib/types.ts`

Claves leídas desde Sheets Configuracion:
- `AÑO_CAMPANA`, `MES_CAMPANA`, `COMPANIA_NOMBRE`
- `CONTRATO_VALOR`, `VALOR_UNIDAD`, `TOTAL_MECHS`
- `PILOTO_1_NOMBRE`...`PILOTO_6_NOMBRE`
- `PILOTO_1_APODO`...`PILOTO_6_APODO`
- `PILOTO_1_MECH`...`PILOTO_6_MECH`

Para añadir nueva clave: extender en `App.tsx` useEffect inicial + `CampaignConfig` type + store default.

---

## Triple paleta (color del UI por sección)

**Archivo**: `src/index.css` (tokens `@theme` Tailwind v4)

3 paletas: `amber` (civil), `blue` (tech), `green` (militar).

**Asignación por ruta**: `src/lib/navigation.ts` campo `palette` por sección.

**Activación**: `App.tsx` setea `data-palette={palette}` en root → CSS aplica colores.

Para añadir paleta nueva: definir tokens en index.css + extender type `Palette` en types.ts.

---

## Navegación (sidebar)

**Archivo**: `src/lib/navigation.ts`

`NAV_SECTIONS` — array de grupos con items `{ id, label, icon, path, palette, tabs? }`.

Para nueva ruta: añadir item + crear página en `src/pages/` + ruta en `App.tsx`.

---

## Header — botón Settings (Secret Menu)

**Archivo**: `src/components/shell/Header.tsx`

Botón engranaje ahora dispara SecretMenu (antes era la "M" oculta del título).

---

## Backend Apps Script

**URL**: hardcoded en `src/lib/sheets-service.ts:7`. Override via localStorage `GOOGLE_SCRIPT_URL_CUSTOM`.

**Endpoints relevantes**:
| Action | Cliente función | Para qué |
|---|---|---|
| `getConfiguracion` | `loadConfig()` | Lee toda la pestaña Configuracion |
| `saveConfiguracionBatch` | `saveConfigBatch(configs)` | Escribe varias claves a la vez |
| `getJugador` (default) | `searchPilots(name)` | Busca personaje en pestaña Personajes |
| `guardarJugador` | `savePilot(data)` | POST guardar personaje |
| `registrarMejora` | `registerImprovement()` | Log subida atributo/skill |
| `registrarMision` | `registerMission()` | Log misión completa |

**Columnas Personajes (Sheet)**:
| Col | Letra | Campo |
|---|---|---|
| 0 | A | NOMBRE |
| 1 | B | JUGADOR |
| 2 | C | APODO ← desde col C, no en JSON |
| 3-6 | D-G | STR/DEX/INT/CHA |
| 7-9 | H-J | ORIGEN/AFILIACION/ESTUDIOS |
| 10 | K | DATOS_COMPLETOS (JSON crudo) |
| 11 | L | XP_DISPONIBLE (fórmula) |
| 12 | M | XP_TOTAL (fórmula) |
| 15 | P | DATOS_RESUELTOS (fórmula que resuelve placeholders) |
| 17 | R | SUELDO |
| 18 | S | DINERO |

---

## Imágenes en `public/`

| Archivo | Para qué |
|---|---|
| `pilot-*.png` | Foto piloto (Barracones, Hoja Servicio) |
| `mech-*.png` | Silueta mech (cards Comisión, Barracones) |
| `mech-blueprint.png` | Fallback genérico mech |
| `vehicle-blueprint.png` | Fallback genérico vehículo |
| `house_*_logo.png` | Escudos de casas (Davion, Steiner, etc.) |
| `KIngKarlKRifle.png` | Emblema unidad (hero Comisión) |
| `banner-kkk.png` | Banner hero Comisión |
| `hangar-default.png` | Fondo hangar Barracones Portada |

Para añadir piloto nuevo: PNG cuadrado ~500×500 (o ajustar `PILOT_ASPECT` y `PILOT_SCALE` si distinto).

---

## Tipografías y estilo militar

**Archivo**: `src/index.css`

- Headlines: Space Grotesk
- Body: Inter
- Datos/mono: Share Tech Mono
- Serif decorativo: Cormorant Garamond (FichaHeraldica)

**Estilo común**:
- `clip-chamfer` — esquinas biseladas (8px)
- `scanline-overlay` — CRT overlay fijo
- `border-radius: 0` — todo angular

Cambios globales tipografía: editar `@theme` tokens en index.css.
