## Resumen Unificado de Armas de Energía

Las armas de energía (Láseres, PPCs, etc.) son un pilar del combate en BattleTech. A diferencia de las armas balísticas o de misiles, no requieren munición, lo que elimina el riesgo de explosiones de munición y la necesidad de reabastecimiento. Sin embargo, su uso genera una cantidad significativa de calor, que debe ser gestionado por los disipadores de calor de la unidad. El sobrecalentamiento puede llevar a penalizaciones en el movimiento, la precisión, paradas de emergencia del reactor e incluso explosiones de munición si la unidad también las transporta.

Existen varios tipos principales:
- **Láseres Estándar, de Rango Extendido (ER) y Pesados:** El armamento básico de energía. Las versiones ER ofrecen mayor alcance a costa de más calor. Las versiones Pesadas (Clan) causan más daño pero son más difíciles de apuntar.
- **Láseres de Pulso (Pulse Lasers):** Ofrecen una bonificación a la tirada de impacto (generalmente -2) para representar una mayor facilidad para impactar al objetivo, pero a costa de un menor alcance y/o mayor calor que sus contrapartes estándar.
- **Cañones de Proyectores de Partículas (PPCs):** Armas de alto daño y largo alcance que generan una cantidad considerable de calor. Tienen un rango mínimo dentro del cual son menos efectivos.
- **Lanzallamas (Flamers):** Armas de corto alcance que pueden infligir daño por calor a 'Mechs o daño directo a otras unidades como infantería y vehículos.
- **Armas de Plasma:** Armas avanzadas que infligen daño por calor a unidades que lo rastrean y daño cinético a las que no.
- **TAG (Target Acquisition Gear):** Un láser de designación que no causa daño, pero "pinta" un objetivo para guiar municiones especiales como misiles semi-guiados o bombas guiadas por láser.

Todas las armas de energía siguen las reglas estándar de línea de visión y modificadores por movimiento y terreno. Su efectividad se ve drásticamente reducida en combate submarino, donde solo los Láseres y PPCs son funcionales y con un alcance muy disminuido.

## Reglas Generales de Disparo (Estándar)

Estas reglas se aplican a todas las armas de energía y se extraen de *Total Warfare*.

- **Calor (Heat):** Cada arma de energía genera una cantidad específica de calor al ser disparada. Este valor es fijo y se suma al total de calor de la unidad en la Fase de Calor.
- **Línea de Visión (LOS):** Se debe tener una línea de visión clara hacia el objetivo para poder disparar.
- **Modificadores de Ataque:** Se aplican los modificadores estándar GATOR (Gunnery, Attacker, Target, Other, Range).
- **Rangos:** Las armas tienen rangos Corto (+0), Medio (+2) y Largo (+4). Algunas armas tienen un rango Extremo (+6). Disparar a un objetivo más allá del rango Largo es imposible.
- **Rango Mínimo:** Algunas armas, como los PPCs, tienen un rango mínimo. Si un objetivo está dentro de este rango, se aplica un modificador positivo a la tirada de impacto, calculado con la fórmula: `[Rango Mínimo] - [Rango del Objetivo] + 1`.
- **Combate Submarino:** Solo los Láseres y los PPCs pueden dispararse bajo el agua. Sus rangos se ven severamente reducidos según la *Tabla de Rangos Submarinos*. Todas las demás armas de energía no funcionan bajo el agua.

## Tipos de Armas de Energía y Reglas Específicas (Estándar)

### Láseres de Pulso (Pulse Lasers)
- **Modificador de Disparo:** Aplican un modificador de **-2** a la tirada de impacto.
- **Ataques Apuntados:** No pueden usarse para realizar ataques apuntados con un Computador de Puntería.

### Lanzallamas (Flamers)
- **Doble Modo:** El jugador puede elegir al declarar el disparo si el lanzallamas inflige **2 puntos de daño** o **2 puntos de calor** al objetivo. No puede hacer ambas cosas.
- **Anti-Infantería:** Inflige daño adicional contra unidades de infantería convencional.

### Armas de Plasma
- **Efecto Dual:** El efecto depende del tipo de objetivo.
  - **Contra unidades que rastrean calor ('Mechs, Cazas):**
    - **Rifle de Plasma:** Inflige **1D6 de calor** además de sus 10 puntos de daño estándar.
    - **Cañón de Plasma:** No inflige daño directo, solo **2D6 de calor**.
  - **Contra unidades que no rastrean calor (Vehículos, Infantería, etc.):**
    - **Rifle de Plasma:** Añade **2D6 de daño** a sus 10 puntos de daño base.
    - **Cañón de Plasma:** Inflige **3D6 de daño**.
- **Reglas Adicionales:**
  - No pueden dispararse bajo el agua.
  - Infligen el doble de daño contra bosques y edificios.
  - Tienen reglas especiales de daño contra Infantería Convencional y Battle Armor.

### TAG (Target Acquisition Gear)
- **Función:** Es un designador láser que no inflige daño. Un impacto exitoso "pinta" al objetivo.
- **Uso:** Permite guiar armas especiales como Misiles Semi-Guiados (LRM) o Bombas Guiadas por Láser (LGB).
- **Resolución:** Las tiradas de impacto para el TAG se resuelven después de la Fase de Movimiento pero antes de la Fase de Ataque con Armas.

## Reglas Avanzadas (Tactical Operations)

El material proporcionado (Total Warfare) no contiene reglas avanzadas de Tactical Operations para armas de energía. Todas las reglas presentadas son de nivel Estándar.

## Tablas de Estadísticas de Armas

### Inner Sphere

| Nombre                 | Tipo      | Calor | Daño      | R. Min | Corto | Medio | Largo  | Mod. | Notas                                      |
|------------------------|-----------|-------|-----------|--------|-------|-------|--------|------|--------------------------------------------|
| ER Large Laser         | DE        | 12    | 8         | 0      | 1-7   | 8-14  | 15-19  | +0   |                                            |
| ER Medium Laser        | DE        | 5     | 5         | 0      | 1-4   | 5-8   | 9-12   | +0   |                                            |
| ER Small Laser         | DE        | 2     | 3         | 0      | 1-2   | 3-4   | 5      | +0   |                                            |
| Flamer                 | DE, H, AI | 3     | 2         | 0      | 1     | 2     | 3      | +0   | Puede infligir calor en lugar de daño.       |
| Large Laser            | DE        | 8     | 8         | 0      | 1-5   | 6-10  | 11-15  | +0   |                                            |
| Medium Laser           | DE        | 3     | 5         | 0      | 1-3   | 4-6   | 7-9    | +0   |                                            |
| Small Laser            | DE        | 1     | 3         | 0      | 1     | 2     | 3      | +0   |                                            |
| Plasma Rifle           | DE, H     | 10    | 10 + 1D6H | 0      | 1-5   | 6-10  | 11-15  | +0   | Inflige calor a 'Mechs, daño a otros.        |
| Light PPC              | DE        | 5     | 5         | 3      | 1-6   | 7-12  | 13-18  | +0   |                                            |
| PPC                    | DE        | 10    | 10        | 3      | 1-6   | 7-12  | 13-18  | +0   |                                            |
| Heavy PPC              | DE        | 15    | 15        | 3      | 1-6   | 7-12  | 13-18  | +0   |                                            |
| ER PPC                 | DE        | 15    | 10        | 0      | 1-7   | 8-14  | 15-23  | +0   |                                            |
| Snub-Nose PPC          | DE, V     | 10    | 10/8/5    | 0      | 1-9   | 10-13 | 14-15  | +0   | Daño variable por rango.                     |
| Large Pulse Laser      | P         | 10    | 9         | 0      | 1-3   | 4-7   | 8-10   | -2   |                                            |
| Medium Pulse Laser     | P         | 4     | 6         | 0      | 1-2   | 3-4   | 5-6    | -2   |                                            |
| Small Pulse Laser      | P, AI     | 2     | 3         | 0      | 1     | 2     | 3      | -2   |                                            |
| TAG                    | E         | 0     | -         | 0      | 1-5   | 6-9   | 10-15  | +0   | Designador de objetivos.                     |

### Clan

| Nombre              | Tipo      | Calor | Daño    | R. Min | Corto | Medio | Largo  | Ext.  | Mod. | Notas                                      |
|---------------------|-----------|-------|---------|--------|-------|-------|--------|-------|------|--------------------------------------------|
| ER Large Laser      | DE        | 12    | 10      | 0      | 1-8   | 9-15  | 16-25  | -     | +0   |                                            |
| ER Medium Laser     | DE        | 5     | 7       | 0      | 1-5   | 6-10  | 11-15  | -     | +0   |                                            |
| ER Small Laser      | DE        | 2     | 5       | 0      | 1-2   | 3-4   | 5-6    | -     | +0   |                                            |
| ER Micro Laser      | DE        | 1     | 2       | 0      | 1     | 2     | 3-4    | -     | +0   |                                            |
| Heavy Large Laser   | DE        | 18    | 16      | 0      | 1-5   | 6-10  | 11-15  | -     | +1   |                                            |
| Heavy Medium Laser  | DE        | 7     | 10      | 0      | 1-3   | 4-6   | 7-9    | -     | +1   |                                            |
| Heavy Small Laser   | DE        | 3     | 6       | 0      | 1     | 2     | 3      | -     | +1   |                                            |
| Plasma Cannon       | DE, H     | 7     | 2D6H    | 0      | 1-6   | 7-12  | 13-18  | -     | +0   | Inflige calor a 'Mechs, daño a otros.        |
| ER PPC              | DE        | 15    | 15      | 0      | 1-7   | 8-14  | 15-23  | -     | +0   |                                            |
| Large Pulse Laser   | P         | 10    | 10      | 0      | 1-6   | 7-14  | 15-20  | -     | -2   |                                            |
| Medium Pulse Laser  | P         | 4     | 7       | 0      | 1-4   | 5-8   | 9-12   | -     | -2   |                                            |
| Small Pulse Laser   | P, AI     | 2     | 3       | 0      | 1-2   | 3-4   | 5-6    | -     | -2   |                                            |
| Micro Pulse Laser   | P, AI     | 1     | 3       | 0      | 1     | 2     | 3      | -     | -2   |                                            |
| TAG                 | E         | 0     | -       | 0      | 1-5   | 6-9   | 10-15  | -     | +0   | Designador de objetivos.                     |
| Light TAG           | E         | 0     | -       | 0      | 1-3   | 4-6   | 7-9    | -     | +0   | Designador de objetivos.                     |
