# Especificación del generador de personajes legacy

## Propósito del documento

Este documento contiene la información necesaria para que un agente implemente en la web nueva el generador de personajes MechWarrior existente en:

`E:\Drive\CBT\ELH\ShitProject-ELHMechs\index Enorme.html`

La intención es reproducir fielmente:

- El flujo de creación.
- Las reglas de disponibilidad.
- El presupuesto de puntos.
- Las tablas de costes.
- La selección y tirada de BattleMech.
- Los paquetes de formación.
- Los méritos, deméritos y habilidades adicionales.
- Los datos que deben persistirse.
- La transformación del formulario en ficha de personaje.

El HTML legacy mezcla reglas, interfaz, persistencia, Barracones y generación de PDF en un único archivo. La implementación nueva no debe copiar esa arquitectura. Debe conservar las reglas válidas y separar claramente dominio, estado, interfaz y persistencia.

> **Importante:** este documento distingue entre el comportamiento legacy que debe conocerse para mantener compatibilidad y las correcciones recomendadas para no reproducir sus defectos.

---

## 1. Resumen funcional

El generador parte de un presupuesto de **150 puntos de creación**.

El jugador:

1. Selecciona una campaña.
2. Introduce nombre del personaje y nombre del jugador.
3. Selecciona una fecha base.
4. Compra cuatro atributos.
5. Selecciona origen y afiliación.
6. Compra una formación, limitada por INT.
7. Selecciona hasta seis méritos y seis deméritos.
8. Puede comprar entre cero y tres habilidades adicionales, según INT.
9. Selecciona un modificador para la tirada de BattleMech y realiza la tirada.
10. Genera aleatoriamente ciertos datos físicos.
11. Valida el presupuesto y los campos obligatorios.
12. Transforma los datos en una ficha de personaje.
13. Opcionalmente guarda, carga, exporta o importa el personaje.

El contador muestra los **puntos restantes**, no los puntos gastados.

```text
puntosRestantes =
    150
    - costeAtributos
    - costeFormacion
    - costeMeritos
    - costeHabilidadesExtra
    - costeModificadorMech
    + puntosDemeritos
```

En el legacy se permite terminar con puntos positivos. Solo se impide generar si el resultado es negativo.

---

## 2. Estados principales de la interfaz

La sección tiene dos estados visibles:

### 2.1. Modo creación

Contiene el formulario completo, el contador fijo de puntos y las acciones de persistencia.

Estado legacy del DOM:

- `pre-generacion`: visible.
- `points-counter`: visible.
- `ficha-container`: oculto.

### 2.2. Modo ficha

Muestra el personaje generado en formato de ficha.

Estado legacy del DOM:

- `pre-generacion`: oculto.
- `points-counter`: oculto.
- `ficha-container`: visible.

La ficha presenta:

- Identificación.
- Origen, afiliación y formación.
- Mech inicial.
- Datos físicos.
- Atributos.
- Tabla de habilidades.
- Puntos de vida.
- C-Bills, salario y PX.
- Méritos y deméritos.
- Tablas vacías o editables para armas, armadura y notas.
- Acción para descargar PDF.
- Acción para volver al formulario.

### Recomendación para la web nueva

No dupliques los datos entre dos árboles DOM. Mantén un único objeto de personaje en el estado de la aplicación y representa:

- Una vista de edición.
- Una vista previa/ficha.

Ambas deben derivarse del mismo estado.

---

## 3. Modelo de datos recomendado

El legacy utiliza nombres inconsistentes (`str`, `fue`, `cha`, `car`, `salary`, `sueldo`, etc.). En la web nueva se recomienda un modelo canónico y adaptadores para importar datos antiguos.

```ts
type CampaignId = "ELH" | "IS";
type AttributeId = "FUE" | "DES" | "INT" | "CAR";

interface CharacterDraft {
  schemaVersion: number;

  identity: {
    name: string;
    playerName: string;
  };

  campaign: {
    id: CampaignId;
    baseDecade: number;
    yearDigit: number;
  };

  attributes: {
    FUE: number | null;
    DES: number | null;
    INT: number | null;
    CAR: number | null;
  };

  background: {
    originId: string | null;
    affiliationId: string | null;
    educationId: string | null;
    nobleSkillId: string | null;
  };

  traits: {
    meritIds: string[];
    demeritIds: string[];
    grantedMeritIds: string[];
    grantedDemeritIds: string[];
  };

  extraSkills: Array<{
    skillId: string;
    level: number;
  }>;

  assignedMech: {
    modifier: number;
    rawRoll: number | null;
    finalRoll: number | null;
    model: string | null;
    tons: number | null;
  };

  physical: {
    ageAdjustmentRoll: number | null;
    birthYear: number | null;
    heightCm: number | null;
    weightKg: number | null;
    hair: string | null;
    sex: string | null;
    eyes: string | null;
  };

  campaignStatus: {
    cbills: number;
    salary: number;
    xpTotal: number;
    xpAvailable: number;
    xpBase?: number;
  };
}
```

### Campos legacy que deben importarse

| Campo legacy | Campo canónico |
|---|---|
| `campaign` | `campaign.id` |
| `decade` | `campaign.baseDecade` |
| `year` | `campaign.yearDigit` |
| `nombre` | `identity.name` |
| `jugador` | `identity.playerName` |
| `str` | `attributes.FUE` |
| `dex` | `attributes.DES` |
| `int` | `attributes.INT` |
| `cha` | `attributes.CAR` |
| `origen` | `background.originId` |
| `afiliacion` | `background.affiliationId` |
| `estudios` | `background.educationId` |
| `nobleSkill` | `background.nobleSkillId` |
| `merits` | `traits.meritIds` |
| `demerits` | `traits.demeritIds` |
| `extraSkills` | `extraSkills` |
| `mechMod` | `assignedMech.modifier` |
| `mechRoll` | `assignedMech.rawRoll` |
| `ageRoll` | `physical.ageAdjustmentRoll` |
| `altura` | `physical.heightCm` |
| `peso` | `physical.weightKg` |
| `pelo` | `physical.hair` |
| `sexo` | `physical.sex` |
| `ojos` | `physical.eyes` |
| `cbills` o `dinero` | `campaignStatus.cbills` |
| `salary` o `sueldo` | `campaignStatus.salary` |
| `xpTotal` | `campaignStatus.xpTotal` |
| `xpAvail` | `campaignStatus.xpAvailable` |
| `xpBase` | `campaignStatus.xpBase` |

Los valores legacy de altura y peso pueden contener sufijos como `"180 cm"` y `"90.7 kg"`. El importador debe normalizarlos a números.

---

## 4. Presupuesto de creación

### 4.1. Presupuesto inicial

```ts
const CREATION_BUDGET = 150;
```

### 4.2. Fórmula exacta legacy

```ts
remaining =
  150
  - attributeCost.FUE
  - attributeCost.DES
  - attributeCost.INT
  - attributeCost.CAR
  - educationCost
  - sum(meritCosts)
  + sum(demeritRewards)
  - sum(extraSkillCosts)
  - mechModifier * 10;
```

La expresión del modificador de Mech parece contraintuitiva, pero produce el resultado mostrado en la interfaz:

- Modificador negativo: concede puntos.
- Modificador positivo: cuesta puntos.

Ejemplos:

```text
modificador -2 => remaining -= (-2 * 10) => +20 puntos
modificador +2 => remaining -= ( 2 * 10) => -20 puntos
```

### 4.3. Reglas de validación legacy

- Si `remaining < 0`, no se permite generar.
- Si `remaining >= 0`, sí se permite.
- No es obligatorio gastar los 150 puntos.
- El color del contador es verde para cero o más y rojo para valores negativos.

### Recomendación

Conservar los puntos sobrantes puede ser una regla intencional. Debe confirmarse con diseño de juego antes de exigir exactamente cero.

La función de cálculo debe ser:

- Pura.
- Determinista.
- Independiente del DOM.
- Compartida por UI, validación, backend y tests.

Debe devolver un desglose:

```ts
interface CostBreakdown {
  budget: number;
  attributes: number;
  education: number;
  merits: number;
  demeritCredit: number;
  extraSkills: number;
  mechModifier: number;
  spent: number;
  remaining: number;
}
```

---

## 5. Costes de atributos

Los atributos admiten valores enteros de **2 a 12**.

Los valores inferiores a 6 devuelven puntos porque tienen coste negativo. El valor 6 es neutral.

| Valor | FUE | DES | INT | CAR |
|---:|---:|---:|---:|---:|
| 2 | -110 | -135 | -160 | -95 |
| 3 | -50 | -65 | -80 | -45 |
| 4 | -20 | -30 | -40 | -20 |
| 5 | -5 | -10 | -15 | -5 |
| 6 | 0 | 0 | 0 | 0 |
| 7 | 10 | 15 | 20 | 10 |
| 8 | 30 | 45 | 60 | 30 |
| 9 | 70 | 95 | 120 | 70 |
| 10 | 150 | 195 | 245 | 150 |
| 11 | 300 | 395 | 495 | 300 |
| 12 | 600 | 795 | 995 | 600 |

Representación recomendada:

```ts
const ATTRIBUTE_COSTS = {
  FUE: { 2: -110, 3: -50, 4: -20, 5: -5, 6: 0, 7: 10, 8: 30, 9: 70, 10: 150, 11: 300, 12: 600 },
  DES: { 2: -135, 3: -65, 4: -30, 5: -10, 6: 0, 7: 15, 8: 45, 9: 95, 10: 195, 11: 395, 12: 795 },
  INT: { 2: -160, 3: -80, 4: -40, 5: -15, 6: 0, 7: 20, 8: 60, 9: 120, 10: 245, 11: 495, 12: 995 },
  CAR: { 2: -95, 3: -45, 4: -20, 5: -5, 6: 0, 7: 10, 8: 30, 9: 70, 10: 150, 11: 300, 12: 600 },
} as const;
```

---

## 6. Formación

La formación se habilita después de seleccionar INT. Cada formación tiene un requisito mínimo de INT, un coste y un paquete fijo de habilidades.

| Formación | INT mínima | Coste |
|---|---:|---:|
| Academia de Oficiales | 8 | 100 |
| Academia de Combate | 6 | 75 |
| Tutores Nobles | 6 | 85 |
| Autodidacta | 5 | 65 |

Si INT desciende por debajo del requisito de la formación seleccionada, la formación debe deseleccionarse.

### 6.1. Academia de Oficiales

| Habilidad | Nivel | Atributo declarado |
|---|---:|---|
| Pilotar Mech | 2 | DES |
| Disparo Mech | 2 | DES |
| Técnica Mech | 2 | INT |
| Pistola | 1 | DES |
| Tácticas | 2 | INT |
| Rifle | 1 | DES |
| Astronavegación | 1 | INT |

### 6.2. Academia de Combate

| Habilidad | Nivel | Atributo declarado |
|---|---:|---|
| Pilotar Mech | 2 | DES |
| Disparo Mech | 2 | DES |
| Técnica Mech | 2 | INT |
| Pistola | 1 | DES |
| Liderazgo | 1 | CAR |
| Supervivencia | 1 | INT |

### 6.3. Tutores Nobles

| Habilidad | Nivel | Atributo declarado |
|---|---:|---|
| Pilotar Mech | 3 | DES |
| Disparo Mech | 2 | DES |
| Técnica Mech | 1 | INT |
| Pistola | 1 | DES |
| Admin. de Feudo | 2 | INT |
| Espada o Equitación | 1 | DES |

Efectos adicionales:

- Obliga a elegir entre **Espada** y **Equitación**.
- Concede automáticamente el mérito narrativo `Nobleza baja`.
- `Nobleza baja` no debe poder comprarse otra vez en los selectores.

El legacy muestra el mérito automático como:

```text
(Formación) Nobleza baja
```

No lo incluye en el coste adicional de méritos.

### 6.4. Autodidacta

| Habilidad | Nivel | Atributo declarado |
|---|---:|---|
| Pilotar Mech | 3 | DES |
| Disparo Mech | 1 | DES |
| Técnica Mech | 2 | INT |
| Rifle | 1 | DES |
| Supervivencia | 1 | INT |

Efecto adicional:

- Concede automáticamente el demérito narrativo `Ineptitud Marcial`.

El legacy muestra:

```text
(Formación) Ineptitud Marcial
```

No concede los 20 puntos asociados a `Ineptitud natural`, porque son entradas diferentes en el código.

### Corrección necesaria

Debe definirse una única identidad canónica:

- Si la regla correcta es `Ineptitud Marcial`, hay que añadirla explícitamente al catálogo.
- Si la regla correcta es `Ineptitud natural`, hay que usar ese mismo ID en formación, filtros y ficha.

No se debe corregir mediante comparación de textos visibles; deben utilizarse IDs estables.

---

## 7. Habilidades adicionales

### 7.1. Número de espacios por INT

| INT | Espacios |
|---:|---:|
| 2–6 | 0 |
| 7 | 1 |
| 8 | 2 |
| 9–12 | 3 |

Cuando INT baja y elimina espacios:

- Los espacios sobrantes se ocultan.
- Sus nombres y niveles se limpian.
- Sus costes dejan de aplicarse.

### 7.2. Coste de compra

| Nivel | Coste |
|---:|---:|
| 1 | 20 |
| 2 | 30 |
| 3 | 50 |
| 4 | 80 |
| 5 | 130 |
| 6 | 210 |
| 7 | 330 |
| 8 | 490 |

### 7.3. Catálogo legacy

- Admin. de Feudo
- Arco
- Astronavegación
- AstroPilotaje
- Atletismo
- Callejeo
- Conducir
- Diplomacia
- Disparo Aeroespacial
- Disparo Artillería
- Disparo Mech
- Espada
- Informática
- Ingeniería
- Interrogación
- Liderazgo
- Mecánica
- Pelea
- Pícaro
- Pilotar Aeroespacial
- Pilotar Mech
- Pistola
- Primeros Auxilios
- Rifle
- Supervivencia
- Tácticas
- Técnica Mech

Las habilidades incluidas en la formación seleccionada se eliminan del catálogo de compra adicional.

### Validaciones recomendadas

El legacy no aplica correctamente todas estas validaciones. La web nueva debe:

- Impedir seleccionar dos veces la misma habilidad adicional.
- Exigir nombre y nivel juntos.
- No cobrar un nivel si no hay habilidad.
- No aceptar una habilidad sin nivel.
- Impedir comprar una habilidad ya concedida por la formación.
- Revalidar al cambiar formación o la habilidad de Tutores Nobles.
- Identificar habilidades mediante ID, no por texto traducido.

---

## 8. Méritos

Se pueden seleccionar hasta seis. El legacy impide duplicar un mérito dentro de los seis selectores.

| Mérito | Coste |
|---|---:|
| Ambidiestro Indiferente | 20 |
| Ambidiestro Ambas | 40 |
| Atractivo | 10 |
| Valiente | 10 |
| Sexto sentido | 20 |
| Contactos leves | 5 |
| Contactos medios | 10 |
| Contactos poderosos | 20 |
| Aptitud natural | 20 |
| Sentidos agudos | 10 |
| Reputacion leve | 5 |
| Reputacion media | 10 |
| Reputacion elevada | 20 |
| Resistencia al dolor | 10 |
| Resistencia a las drogas | 10 |
| Riqueza leve | 5 |
| Riqueza media | 10 |
| Riqueza elevada | 20 |
| Nobleza baja | 5 |
| Nobleza media | 10 |
| Nobleza alta | 20 |
| Fuerte | 20 |

### Recomendaciones

- Corregir tildes en los textos visibles sin cambiar silenciosamente los IDs de datos antiguos.
- Definir familias excluyentes o progresivas:
  - Contactos leves/medios/poderosos.
  - Reputación leve/media/elevada.
  - Riqueza leve/media/elevada.
  - Nobleza baja/media/alta.
  - Las dos variantes de Ambidiestro, si no pueden coexistir.
- Decidir si deben coexistir `Fuerte` y el demérito `Débil`.
- Decidir si `Aptitud natural` debe almacenar una habilidad objetivo.
- Decidir si Contactos/Reputación/Nobleza necesitan descripción adicional.

---

## 9. Deméritos

Se pueden seleccionar hasta seis. Cada demérito devuelve puntos al presupuesto.

| Demérito | Puntos concedidos |
|---|---:|
| Adiccion leve | 10 |
| Adiccion fuerte | 20 |
| Mala reputacion leve | 5 |
| Mala reputacion media | 10 |
| Mala reputacion alta | 20 |
| Terror de combate leve | 10 |
| Terror de combate alto | 20 |
| Enemigo debil | 5 |
| Enemigo medio | 10 |
| Enemigo poderoso | 20 |
| SDT | 10 |
| Deudas leves | 5 |
| Deudas medias | 10 |
| Deudas elevadas | 20 |
| Ineptitud natural | 20 |
| Repulsivo | 10 |
| Gafe | 10 |
| Debil | 20 |

### Recomendaciones

- Normalizar tildes: Adicción, Reputación, Débil.
- Documentar el significado de `SDT`.
- Definir familias excluyentes:
  - Adicción leve/fuerte.
  - Mala reputación leve/media/alta.
  - Terror de combate leve/alto.
  - Enemigo débil/medio/poderoso.
  - Deudas leves/medias/elevadas.
- Impedir contradicciones evidentes entre méritos y deméritos.
- Si `Ineptitud natural` afecta a una habilidad concreta, almacenar dicha habilidad.

---

## 10. Origen y afiliación

### 10.1. Orígenes legacy

- Alianza de Mundos Exteriores
- Coalición Auriga
- Concordato de Tauro
- Condominio Draconis
- Confederación de Capela
- Confederación de Oberon
- Federación de Circinus
- Federación de Soles
- Hegemonía Mariana
- Liga de Mundos Libres
- Magistratura de Canopus
- Mancomunidad Lirana

### 10.2. Afiliaciones legacy

| Texto mostrado | Valor persistido |
|---|---|
| Alianza de Mundos Exteriores | Casa Avellar (Alianza de Mundos Exteriores) |
| Coalición Auriga | Casa Arano (Coalición Auriga) |
| Concordato de Tauro | Casa Calderon (Concordato de Tauro) |
| Casa Kurita | Casa Kurita (Condominio Draconis) |
| Casa Liao | Casa Liao (Confederación de Capella) |
| Confederación de Oberon | Casa Grimm (Confederación de Oberon) |
| Federación de Circinus | Casa McIntyre (Federación de Circinus) |
| Casa Davion | Casa Davion (Federacion de Soles) |
| Hegemonía Mariana | Casa O'Reilly (Hegemonía Mariana) |
| Casa Marik | Casa Marik (Liga de Mundos Libres) |
| Magistratura de Canopus | Casa Centrella (Magistratura de Canopus) |
| Casa Steiner | Casa Steiner (Mancomunidad de Lira) |
| Mercenario | Mercenario (Unidad Mercenaria) |

### Comportamiento por campaña

- En campaña `ELH`, la afiliación se fuerza a `Mercenario (Unidad Mercenaria)` y queda deshabilitada.
- En campaña `IS`, el usuario puede seleccionar cualquier afiliación.

### Correcciones necesarias

El legacy contiene diferencias ortográficas:

- Capela / Capella.
- Federación / Federacion.
- Mancomunidad Lirana / Mancomunidad de Lira.

La web nueva debe:

- Usar IDs estables.
- Mantener alias para importar textos antiguos.
- Separar `label` de `value`.
- Decidir si origen y afiliación deben estar relacionados.
- Si deben estar relacionados, filtrar afiliaciones o advertir combinaciones incoherentes.

---

## 11. Campañas y asignación de BattleMech

Hay dos configuraciones:

### 11.1. Eridani Light Horse (`ELH`)

- Tirada base: `1d16`.
- Modificadores permitidos: -2, -1, 0, +1 y +2.
- El resultado modificado se limita al intervalo 1–16.

| Modificador | Efecto en puntos |
|---:|---:|
| -2 | +20 |
| -1 | +10 |
| 0 | 0 |
| +1 | -10 |
| +2 | -20 |

| Resultado final | BattleMech | Toneladas |
|---:|---|---:|
| 1 | Dervish DV-6M | 55 |
| 2 | Gladiator GLD-4R | 55 |
| 3 | Griffin GRF-1N | 55 |
| 4 | Wolverine WVR-6M | 55 |
| 5 | Shadow Hawk-2ELH | 55 |
| 6 | Wolverine WVR-6R | 55 |
| 7 | Wolverine WVR-6S | 55 |
| 8 | Wolverine WVR-6D | 55 |
| 9 | Quickdraw QKD-5A | 60 |
| 10 | Merlin MLN-1A | 60 |
| 11 | Exterminator EXT-4A | 65 |
| 12 | Catapult CPT-C1 | 65 |
| 13 | Thunderbolt-5SE | 65 |
| 14 | Grasshopper GHR-5H | 70 |
| 15 | Guillotine GLT-4L | 70 |
| 16 | BattleAxe BKX-7K | 70 |

### 11.2. Esfera Interior (`IS`)

- Tirada base: `2d6`.
- Modificadores permitidos: -3, -2, -1, 0, +1, +2 y +3.
- El resultado modificado se limita al intervalo -1–15.

| Modificador | Efecto en puntos |
|---:|---:|
| -3 | +30 |
| -2 | +20 |
| -1 | +10 |
| 0 | 0 |
| +1 | -10 |
| +2 | -20 |
| +3 | -30 |

| Resultado final | Grupo de BattleMechs | Toneladas |
|---:|---|---:|
| -1 | Locust, Wasp, Stinger | 20 |
| 0 | Commando | 25 |
| 1 | Javelin, Spider, Valkyrie, Urbanmech | 30 |
| 2 | Locust, Wasp, Stinger | 20 |
| 3 | Commando | 25 |
| 4 | Javelin, Spider, Valkyrie, Urbanmech | 30 |
| 5 | Firestarter, Jenner, Panthter, Ostcout, Firebee | 35 |
| 6 | Assassin, Cicada, Clint, Hermes II, Vulcan, Whitoworth, Icarus II | 40 |
| 7 | BlackJack, Hatchetman, Vindicator, Phoenix Hawk | 45 |
| 8 | Centurion, Enforcer, Hunchback, Trebuchet | 50 |
| 9 | Griffin, Shadow Hawk, Wolverine, Scorpion, Dervish, Gladiator | 55 |
| 10 | Dragon, Ostroc, Ostsol, Rifleman, Quickdraw | 60 |
| 11 | Catapult, Jagermech, Thunderbolt, Crusader | 65 |
| 12 | Archer, Warhammer, Grasshopper, Battleaxe | 70 |
| 13 | Marauder, Orion | 75 |
| 14 | Awesome, Charger, Victor, Goliath, Zeus | 80 |
| 15 | Battlemaster, Stalker, Longbow | 85 |

### Algoritmo

```ts
function assignMech(campaign: CampaignId, modifier: number, rng: Rng): AssignedMech {
  const rawRoll = campaign === "ELH"
    ? rng.integer(1, 16)
    : rng.d6() + rng.d6();

  const min = campaign === "ELH" ? 1 : -1;
  const max = campaign === "ELH" ? 16 : 15;
  const finalRoll = clamp(rawRoll + modifier, min, max);
  const result = table[campaign][finalRoll];

  return { modifier, rawRoll, finalRoll, ...result };
}
```

Cambiar campaña o modificador invalida la tirada anterior y debe limpiar:

- Tirada base.
- Resultado final.
- Modelo.
- Tonelaje.

### Correcciones y decisiones pendientes

- En `IS`, una fila puede contener varios modelos, pero el legacy no realiza una segunda selección. La web nueva debería permitir elegir o sortear un modelo concreto dentro del grupo.
- Corregir posibles erratas de catálogo: `Panthter`, `Ostcout`, `Whitoworth`, `BlackJack`, según la fuente oficial usada por el proyecto.
- Guardar siempre tirada base, modificador, resultado final y modelo definitivo.
- Usar un RNG inyectable para poder probar el sistema.

---

## 12. Datos físicos

### 12.1. Ajuste de año

El legacy tira:

```ts
ageAdjustmentRoll = randomInteger(1, 6);
```

Después calcula:

```ts
finalYear = baseDecade + yearDigit + ageAdjustmentRoll;
```

La ficha etiqueta `finalYear` como **Año de nacimiento**.

### Problema

Si la fecha base representa el año de campaña, sumar 1d6 genera un año posterior, no un año de nacimiento. Esta regla necesita confirmación.

Posibles interpretaciones:

1. El selector representa una década de nacimiento y el 1d6 ajusta el año dentro de ella.
2. La etiqueta `Fecha Base de Campaña` es incorrecta.
3. La operación debería restar una edad o una cantidad de años.

No debe corregirse a ciegas. La web nueva debe renombrar el campo o confirmar la fórmula con las reglas de juego.

### 12.2. Altura y peso

Altura:

```ts
heightCm = randomInteger(165, 200);
```

Peso:

```ts
weightKg = ((heightCm / 100) ** 2) * 28;
weightKg = roundToOneDecimal(weightKg);
```

Es decir, utiliza un IMC fijo de 28.

### 12.3. Pelo

- Rubio
- Pelirrojo
- Castaño
- Negro
- Calvo

### 12.4. Sexo

- Hombre
- Mujer

### 12.5. Ojos

- Verdes
- Azules
- Grises
- Marrones
- Negros

### Recomendación

Estos catálogos no deben limitar el modelo de dominio. La interfaz puede ofrecer opciones rápidas, pero debería permitir:

- Valor personalizado.
- Más opciones de sexo/género si encaja con el diseño del proyecto.
- Altura y peso editables después de generarlos.

---

## 13. Generación de habilidades y tiradas

El legacy combina:

1. Habilidades concedidas por formación.
2. Habilidades adicionales compradas.
3. Filas manuales vacías hasta intentar alcanzar un número relacionado con INT.

Después calcula:

```ts
universalAttribute = round((FUE + DES + INT + CAR) / 4);
targetRoll = universalAttribute - skillLevel;
```

### Defecto crítico

Cada habilidad ya declara un atributo (`DES`, `INT`, `CAR`), pero el legacy lo ignora y aplica el promedio universal a todas.

Por ejemplo:

- Técnica Mech declara INT.
- Pilotar Mech declara DES.
- Liderazgo declara CAR.

Sin embargo, las tres reciben el mismo valor medio.

### Comportamiento recomendado

Confirmar la regla real del sistema. Si la propiedad `attributeId` es válida, usar:

```ts
targetRoll = character.attributes[skill.attributeId] - skill.level;
```

Las habilidades adicionales legacy llevan `c: "UNI"`. Para la web nueva deben asociarse a un atributo mediante un catálogo central:

```ts
interface SkillDefinition {
  id: string;
  label: string;
  governingAttribute: AttributeId;
}
```

No se debe inferir el atributo a partir del nombre en cada componente.

### Filas vacías

El legacy calcula:

```ts
emptyRows = INT - generatedSkills.length;
```

Si el valor es positivo, añade filas manuales. Si es negativo, no elimina habilidades concedidas.

Esto parece utilizar INT como capacidad total de habilidades, pero no está documentado. Debe confirmarse antes de replicarlo como regla.

---

## 14. Validación al generar

El legacy impide generar si:

- Los puntos restantes son negativos.
- Falta nombre del personaje.
- Falta nombre del jugador.
- Falta algún atributo.
- Falta origen.
- Falta formación.
- Falta afiliación.
- No se ha realizado la tirada de Mech.

No exige:

- Datos físicos completos.
- Gastar todos los puntos.
- Seleccionar habilidad de Tutores Nobles.
- Coherencia entre habilidad adicional y nivel.
- Ausencia de habilidades adicionales duplicadas.
- Coherencia entre origen y afiliación.

### Validación recomendada

```ts
interface ValidationIssue {
  code: string;
  path: string;
  severity: "error" | "warning";
  message: string;
}
```

Errores mínimos:

- Nombre vacío.
- Jugador vacío.
- Atributo ausente o fuera de 2–12.
- Formación no disponible para INT.
- Tutores Nobles sin habilidad elegida.
- Más habilidades adicionales de las permitidas por INT.
- Habilidad adicional sin nivel o nivel sin habilidad.
- Habilidades duplicadas.
- Méritos duplicados.
- Deméritos duplicados.
- Más de seis méritos o deméritos.
- Presupuesto negativo.
- Modificador de Mech no permitido para la campaña.
- Tirada de Mech ausente o invalidada.

Advertencias sugeridas:

- Puntos sin gastar.
- Origen y afiliación potencialmente incoherentes.
- Datos físicos incompletos.
- Méritos y deméritos posiblemente contradictorios.

---

## 15. Persistencia

El legacy ofrece:

- Exportación a JSON.
- Importación desde JSON.
- Búsqueda por nombre de jugador.
- Guardado en Google Apps Script/Google Sheets.
- Guardado automático al generar la ficha.

### Comportamientos que no deben copiarse

- No guardar silenciosamente en un servicio remoto al pulsar “Generar ficha”.
- No mezclar cargar el generador con cargar Barracones.
- No insertar datos remotos usando `innerHTML`.
- No depender del texto visible como clave de datos.
- No limpiar el formulario antes de confirmar que el guardado terminó correctamente.

### Recomendación para Firebase/web nueva

- Autenticación y autorización explícitas.
- Esquema versionado.
- Validación tanto en cliente como en backend.
- Guardado manual claramente visible.
- Autoguardado local opcional con estado `guardando/guardado/error`.
- Operaciones de red que devuelvan y esperen promesas reales.
- Sanitización y renderizado seguro de nombres.
- Separación entre:
  - `CharacterDraft`.
  - Personaje persistido.
  - Ficha de campaña.
  - Estado de combate/Barracones.

---

## 16. Arquitectura recomendada

```text
character-generator/
├── domain/
│   ├── character.ts
│   ├── catalogs.ts
│   ├── costs.ts
│   ├── education.ts
│   ├── mech-assignment.ts
│   ├── validation.ts
│   └── legacy-adapter.ts
├── application/
│   ├── create-character.ts
│   ├── load-character.ts
│   └── save-character.ts
├── infrastructure/
│   └── character-repository.ts
└── ui/
    ├── CharacterGenerator.tsx
    ├── CostSummary.tsx
    ├── AttributeSelector.tsx
    ├── EducationSelector.tsx
    ├── TraitSelector.tsx
    ├── ExtraSkillSelector.tsx
    ├── MechRoller.tsx
    └── CharacterSheetPreview.tsx
```

Principios:

- Catálogos centralizados.
- Reglas puras fuera de componentes.
- Estado único.
- IDs estables.
- Textos traducibles.
- Adaptador exclusivo para datos legacy.
- Persistencia desacoplada.
- RNG inyectable.

---

## 17. Algoritmo completo de creación

```ts
function buildCharacter(draft: CharacterDraft): BuildResult {
  const issues = validateDraft(draft);

  if (issues.some(issue => issue.severity === "error")) {
    return { ok: false, issues };
  }

  const costs = calculateCreationCosts(draft);
  const education = resolveEducationPackage(
    draft.background.educationId,
    draft.background.nobleSkillId
  );

  const skills = mergeSkills({
    granted: education.skills,
    purchased: draft.extraSkills,
  });

  const physical = resolvePhysicalData(draft);

  return {
    ok: true,
    character: {
      ...draft,
      costs,
      skills,
      traits: {
        meritIds: unique([
          ...draft.traits.meritIds,
          ...education.grantedMeritIds,
        ]),
        demeritIds: unique([
          ...draft.traits.demeritIds,
          ...education.grantedDemeritIds,
        ]),
      },
      physical,
    },
    issues,
  };
}
```

---

## 18. Casos de prueba obligatorios

### Costes

1. Cuatro atributos a 6, sin formación ni extras:
   - Coste de atributos: 0.
   - Restante: 150.

2. FUE 7, resto a 6:
   - Coste de atributos: 10.
   - Restante: 140 antes del resto de elecciones.

3. DES 2:
   - Devuelve 135 puntos.

4. Mérito `Atractivo`:
   - Resta 10.

5. Demérito `Gafe`:
   - Suma 10.

6. Habilidad adicional nivel 4:
   - Resta 80.

7. Modificador ELH -2:
   - Suma 20.

8. Modificador IS +3:
   - Resta 30.

### Formación

9. INT 7 no permite Academia de Oficiales.
10. INT 8 permite Academia de Oficiales.
11. Bajar INT de 8 a 7 elimina Academia de Oficiales seleccionada.
12. Tutores Nobles exige Espada o Equitación.
13. Tutores Nobles concede Nobleza baja sin cobrarla de nuevo.
14. Autodidacta concede el demérito definido por la regla corregida.

### Habilidades adicionales

15. INT 6 muestra cero espacios.
16. INT 7 muestra uno.
17. INT 8 muestra dos.
18. INT 9 muestra tres.
19. Bajar INT limpia espacios que dejan de estar disponibles.
20. No se puede repetir una habilidad.
21. No se puede comprar una habilidad de formación.
22. Nombre sin nivel y nivel sin nombre producen error.

### Mech

23. ELH siempre tira entre 1 y 16.
24. IS siempre tira entre 2 y 12 antes del modificador.
25. Los resultados se limitan a los extremos de cada tabla.
26. Cambiar modificador invalida la asignación anterior.
27. Cambiar campaña invalida la asignación anterior.

### Persistencia

28. Importar `"180 cm"` produce `180`.
29. Importar `"90.7 kg"` produce `90.7`.
30. Se aceptan alias legacy de origen y afiliación.
31. Guardar espera confirmación del repositorio antes de limpiar o navegar.
32. Los nombres remotos se renderizan como texto, nunca como HTML.

---

## 19. Lista priorizada de correcciones para la web nueva

### Prioridad crítica

1. **Corregir el cálculo de tiradas de habilidad.** No usar el promedio universal salvo que se confirme como regla real.
2. **Crear un modelo de datos canónico.** Evitar `str/fue`, `cha/car`, `salary/sueldo`.
3. **Separar generador, ficha, Barracones y persistencia.**
4. **Eliminar el guardado remoto silencioso al generar.**
5. **Validar las reglas también en backend.**
6. **Sanitizar todos los datos cargados y evitar `innerHTML`.**

### Prioridad alta

7. Corregir la discrepancia `Ineptitud Marcial` / `Ineptitud natural`.
8. Exigir la habilidad de Tutores Nobles.
9. Validar pares nombre/nivel de habilidades adicionales.
10. Evitar habilidades adicionales duplicadas.
11. Normalizar origen y afiliación mediante IDs y alias.
12. Arreglar el significado o cálculo del año de nacimiento.
13. Convertir el resultado IS de “grupo de modelos” en un modelo definitivo.

### Prioridad media

14. Añadir exclusiones entre grados de un mismo mérito o demérito.
15. Detectar contradicciones entre méritos y deméritos.
16. Permitir editar altura y peso después de la tirada.
17. Mostrar un desglose completo de costes.
18. Añadir advertencia de puntos sobrantes.
19. Versionar el esquema de personaje.

### Prioridad de mantenimiento

20. Eliminar eventos duplicados inline y programáticos.
21. Evitar lógica duplicada entre generación y carga.
22. Añadir tests unitarios para todas las tablas.
23. Añadir tests de migración de JSON legacy.
24. Centralizar catálogos y traducciones.

---

## 20. Criterios de aceptación

La réplica se considera funcionalmente completa cuando:

- Presenta todos los campos de creación legacy.
- Calcula exactamente los mismos costes documentados.
- Aplica los requisitos de INT para formación y habilidades adicionales.
- Genera la asignación de Mech según campaña, tirada y modificador.
- Persiste todos los datos necesarios para reconstruir la creación.
- Puede importar personajes legacy mediante adaptadores.
- Genera una ficha usando el mismo estado del formulario.
- No permite estados de habilidad incompletos o duplicados.
- No guarda remotamente sin una acción o indicación clara.
- Expone un desglose auditable de los 150 puntos.
- Tiene tests para costes, formación, rasgos, habilidades y Mechs.

---

## 21. Fuente legacy consultada

Puntos principales dentro del archivo original:

- Estilos del generador: líneas aproximadas 16–89.
- Constantes y tablas de costes: 1539–1622.
- Recogida y carga de datos: 1629–1741.
- Cálculo de puntos: 4692–4712.
- Paquetes de formación: 4727–4733.
- Tirada de BattleMech: 4739–4755.
- Restricciones y efectos de formación: 4758–4826.
- Habilidades adicionales: 4802–4848.
- Datos físicos: 4850–4858.
- Formulario HTML: 365600–365681.
- Generación y validación de ficha: 7603–7724.

Esta especificación debe tratarse como documento de migración. Ante cualquier conflicto entre compatibilidad con datos existentes y corrección de reglas, conservar los datos mediante alias/adaptadores y aplicar la regla corregida en el nuevo dominio.
