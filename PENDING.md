# Pendientes Activos

Última actualización: 2026-06-16

---

## 🔴 Alto — Integración Hangar (ciclo Sim ↔ Taller ↔ Hangar)

Spec corto: `herramientas/MD/spec_hangar_integracion.md`.

### Taller ↔ Hangar
Taller hoy usa sim slots. Debería identificar HangarItem por chassis/model (o pilotoIdx en modo campaña) y persistir:
- `damagePersist` (resta lo reparado)
- `estadoPct` (recalc por % daño total)
- `qualityRating` (sincronizado con MechSlot.maintenance)

Al pagar reparación total: `damagePersist` resetea, `estadoPct = 100`.

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
- `qualityRating` editable en hangar (alimenta MantenimientoTab)

---

## 🟢 Bajo

### Enriquecer `rebuild-indexes.cjs`
Añadir `tons/cost/era/techbase/categoria` al `index.json` para evitar fetch del `.ssw` en cada selección (TRO + Hangar Comprar).

### Telegram setup manual
Cliente + backend listos. Pendiente setup bot + deploy editor + webhook.
Spec: `herramientas/MD/TELEGRAM_SPEC.md`.

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

## ✅ Completado reciente (2026-06)

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
