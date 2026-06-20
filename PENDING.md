# Pendientes Activos

Última actualización: 2026-06-20

---

## 🔴 Alto — Integración Hangar (ciclo Sim ↔ Taller ↔ Hangar)

Spec: `herramientas/MD/spec_hangar_integracion.md`. Paso 3 DONE.

### Pasos restantes
- **Paso 1**: `applyDamageToSession()` helper + aplicar `damagePersist` al cargar mech del hangar en modo campaña
- **Paso 2**: `persistMechSlotToHangar()` + auto-save sim→hangar al salir de modo campaña
- **Paso 4**: UI estado (operativo/destruido) en Hangar — botones vender restos / reparación total / desguace
- **Paso 5**: Centralizar mantenimiento en `HangarItem` (qualityRating, techRating, maintenanceHistory ya viven aquí; falta migrar experienciaEquipo desde session)

### Combate destruye → Hangar
Si mech termina destruido en sim:
- Marca `HangarItem.estadoPct = 0`
- Añade flag `destruido: true`
- En inventario aparece badge rojo
- Opciones desde Hangar:
  - **Vender restos** (10-30% canon) → asiento `venta_mech` + delete
  - **Reparación total** → abre Taller con `damagePersist = state max` y `estadoFactPct` editable
  - **Desguace** → delete sin asiento

---

## 🟡 Medio — UX Hangar

- `estadoPct` editable inline (slider por fila)
- Filtro/búsqueda inventario (tons / asignado / categoría)
- Notas editables inline
- Histórico compra/venta (tabla filtrada por `compra_mech` / `venta_mech` del libroMayor)
- Ficha piloto: `pilot.mech` display vivo desde hangar (no cache stale)
- `qualityRating` editable en hangar (alimenta MantenimientoTab — actualmente solo editable en Taller)
- Migración mechs comprados con descuento previo: `valorActual` = precio pagado erróneo, no canon

---

## 🟢 Bajo

### Enriquecer `rebuild-indexes.cjs`
Añadir `tons/cost/era/techbase/categoria` al `index.json` para evitar fetch del `.ssw` en cada selección (TRO + Hangar Comprar).

### Telegram — ampliaciones
Outbound + inbound + 6 comandos básicos DONE. Pendiente:
- Comandos admin: `/backup`, `/anuncio <texto>`, `/resetcampana`
- Mapping `PJ_TG_<NOMBRE> = user_id` (Firestore) para que `/parte` use nombre PJ canónico
- UI gestión `TG_AUTHORIZED_IDS` desde SecretMenu (en lugar de secret CSV)
- Telemetría: log de comandos ejecutados en Firestore (auditoría)

### Verificación E2E prod
Recorrer flujos: registro, compra-venta hangar, reparación prioridades, mantenimiento check, hoja servicio + reroll, asignación piloto-mech, modo campaña sim.

---

## 🔵 Otros pendientes vivos

### Recuperación de Mechs (salvage post-combate)
Tras misión, registrar mech enemigo recuperado:
- Vender salvage (ingreso `venta_mech`, precio = BV × tabla CamOps: 50% dañado, 30% destruido)
- O añadir al hangar como item nuevo (reutiliza `newHangarItem`)

Modal `RecoveryModal` en HojaServicio o FinanzasPage portada.

### Field Repair (reparación localizada en sim)
Sin pasar por libro mayor:
- Tirada 1d6 → repara UNA localización
- Coste 0 ₡
- Restaura armor/IS/crits solo en esa loc

Otros tipos: triaje, rearm puro, cabin/sensors only.
Implementación: `FieldRepairModal` en simulador.

### Taller — tiempo reparación informativo
Sistema actual cubre tiempos en Prioridades. Pendiente: badge "X horas" canon junto a coste ₡ en Factura (TallerModal).

### HUD Táctico — responsive móvil
Target: móvil portrait 375-414px. Layout 1 col, tarjetas por unidad, botones touch ≥44px.

### Comisión — responsive tablet 10"
Target prioritario: 1280×800 landscape. Layout 1 col en <1100px, hero alto auto, banner oculto en <900px.

### Combat Improvements Spec — F2-F5
Spec: `herramientas/MD/COMBAT_IMPROVEMENTS_SPEC.md`. F1 done.
- F2 Paper doll rework `ArmorDiagram.tsx`
- F3 Undo simple (stack 5 snapshots + Ctrl+Z)
- F4 Pending obligations strip (PSR, Consciousness, Shutdown, Ammo explosion)
- F5 DamageGrouper integrado en flujo daño

### Infantería + Battle Armor
Spec 6 fases: `herramientas/MD/INFANTRY.spec.md`.

### Mapa Estelar Dinámico
Voronoi + radio máximo, reemplaza SVGs estáticos.
Spec: `herramientas/MD/DYNAMIC_STAR_MAP_SPEC.md`.

### Barracones Dynamic Dossier
Fichas por facción con estilo distinto.
Spec: `herramientas/MD/BARRACONES_DYNAMIC_DOSSIER_SPEC.md`.

### AI Crónicas Gemini
`PROMPT_INSTRUCCIONES` + `PROMPT_TONO` definidos en `config/main`. Sin integración API.

### Historial Combates UI
Endpoint `loadHistorial()` listo. Sin viewer.

### Vehículos completos
VehicleSession parcial. Falta motive damage, crits fatales VTOL/Naval, testing.

### MTF → SSW conversión bulk
Status: parked. GUI manual SSW o parser+BV calculator Node (~500 líneas).

---

## 🔴 Alto — Seguridad rules · DONE (2026-06-20)

✅ **Config split implementado**:
- `config/main` rules: `read if hasAnyRole, write if isAdmin`
- `config/sim` rules: `read, write if hasAnyRole`
- `firebase-service.saveConfigBatch` enruta por prefijo (`isSimKey`): FUERZA_*, FUERZACAMPAÑA, ENEMIGO*, ESTADOMECHS, PILOTO_*_MECH → `config/sim`. Resto → `config/main`.
- `loadConfig` mergea ambos docs (sim wins en colisión)
- Backward compat: `readConfigField` con fallback al otro doc, `loadAllFuerza/EnemigoConfigSlots` leen ambos y mergean

Pendiente: `firebase deploy --only firestore:rules` para activar en prod.

Migración datos legacy (config/main → config/sim) opcional. Compat lectura ya cubre.

---

## ✅ Completado reciente (2026-06)

### Telegram + Wiki + Seguridad (2026-06-20)
- **Telegram outbound**: Cloud Function `sendTelegramNotif` callable con role gate. Secrets en Firebase Secret Manager. 6 eventos (`mision_cerrada`, `libro_mayor_relevante`, `tesoreria_grande`, `cronica_nueva`, `parte_nuevo`, `test`). Reemplaza shim no-op `sheetsPost` (motivo: Telegram nunca funcionó post-migración Sheets→Firebase)
- **Telegram inbound**: Cloud Function HTTPS `tgWebhook` con secret_token validation. Comandos: `/whoami` (libre), `/roster`, `/tesoreria`, `/cronica`, `/parte <texto>`, `/help`. Whitelist user_ids vía secret `TG_AUTHORIZED_IDS`
- **CORS whitelist** Cloud Functions: battletechalicante.es + legadometalico.com + web.app + firebaseapp.com + localhost
- **SecretMenu 8 tabs sidebar**: Campaña, Tesorería, Pilotos XP, Prompts IA (4 prompts), Telegram (toggle + umbrales + test), Combate, Diseño, Roles
- **telegram-service**: getters/setters localStorage para toggle + umbrales tesorería/libro mayor
- **Alias system**: `RoleEntry.alias` + `getPublicRoles()` desde `config/main.public_roles` (espejo ofuscado con `safeEmail`). Permite PJ ver lista usuarios sin exponer emails. `syncPublicRoles()` auto-ejecuta tras setRole/removeRole
- **RolesPanel**: input alias en add + botón "Cambiar alias" inline
- **FuerzaSyncBar**: usa `getPublicRoles()` + `safeEmail`. Selector muestra alias
- **SimuladorPage refactor hooks**: useMemo `visibleIndices`/`lockedSlotsForView` antes de early returns (fix React error #310 latente)
- **firestore.rules**: `claimRole()` hardened con `'role' in token` check; `config/{doc}` abierto a `hasAnyRole()` (ver pendiente seguridad arriba)

### Wiki BattleTech reglas (en progreso — 2026-06-20)
- **AI rule extractor** Python (`scripts/ai_rule_extractor/build_rulebase.py`): pipeline Gemini API con `Total Warfare Nuevo.pdf` → extrae crunch sin fluff por tema → markdown + JSON
- **wiki-tree.json**: 14+ categorías (mecánicas, movimiento terrestre/aeroespacial, combate distancia/físico, calor, construcción, entorno, equipo RPG, escenarios, gestión campaña, organización, personajes, unidades, armas)
- **VitePress sidebar dinámico**: `docs/.vitepress/config.mts` lee `wiki-tree.json` + filtra carpetas existentes
- **docs/index.md** rebrandeado "CFRM Rulebase · Enciclopedia de Reglas"

### Mantenimiento + Hangar (2026-06-19)
- **MechSourcePicker** en Prioridades (hangar + sim) y Mantenimiento (solo campaña)
- **BayTeam[]** hasta 3 equipos paralelos calidad mixta (CamOps p.148 throughput sumado)
- **Mantenimiento canon 0 ₡** — upkeep = salarios Personal, daños fallidos → Prioridades
- **`hasJumpJets` / `hasAmmo` persisted** en HangarItem desde parse .ssw (compra) + lazy detect items legacy
- **`maintenanceHistory` persisted** en HangarItem (antes session-only)
- **Hangar columna Estado** % daños con badge color (sustituye Era)
- **`precioBase` = canon** (no precio pagado con descuento)
- **Compras/ventas por 0 ₡** permitidas (premio, regalo, salvage)
- **Valores mech sin decimales** (Math.round en displays)
- **SecretMenu editor XP pilotos** + botón "Guardar XP" sin cerrar modal
- **Fix roles**: setRole/removeRole respetan `docId` real del listado (docs legacy con id ≠ emailKey ahora actualizables/borrables)

### Anteriores
- **Migración Sheets → Firebase** (auth, Firestore, hosting custom domain)
- **Sistema Prioridades Reparación** (spec DONE)
- **Pestaña Mantenimiento + Quality Rating** (spec DONE)
- **Hangar collection + UI completa** (Inventario / Comprar / Vender)
- **Asignación bidireccional piloto↔mech** con conflict prompts
- **Solaris sync** + Launcher opción 6
- **Sim modo campaña carga del hangar + lock slots**
- **Drag&drop + flechas reorden Prioridades**
- **Botón Comprar desde TRO** (`?buy=<file>`)
- **Tesorería override directo** en SecretMenu (sin asientos)
- **Reset legacy mech assignments** (PILOTO_N_MECH purge)
- **Fix rerolls** — solo restan de xpDisponible, no de xpTotal
- **AC slots críticos** — BUG ARREGLADO
- **Persistencia personajes tras misión** (xpTotal + xpDisponible)
- **TallerInline funcional desde simulador**
