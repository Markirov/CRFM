# Moral, Fatiga y Experiencia

## Moral, Fatiga y Experiencia en Campañas

Este documento resume las reglas para gestionar la experiencia, la moral y la fatiga de una unidad de BattleTech durante una campaña, fuera de los escenarios de juego individuales. Estas mecánicas añaden profundidad a la gestión de la fuerza, afectando el rendimiento de la unidad tanto en el campo de batalla como en las fases de mantenimiento y reparación.

- **Experiencia:** El personal mejora sus habilidades a través de escenarios completados o gastando Puntos de Apoyo (SP).
- **Moral:** Un sistema que mide la voluntad de lucha de la fuerza. Afecta los chequeos de deserción y motín, y proporciona modificadores en combate. La moral puede cambiar debido a victorias, derrotas, pérdidas y otros factores de la campaña.
- **Fatiga:** Representa el desgaste físico y mental de las tropas. Se acumula con el combate y se reduce con el descanso. La fatiga alta impone penalizaciones a las tiradas de habilidad y puede provocar una bajada de la moral.

### Experiencia y Avance de Habilidades

#### Reglas de Experiencia (Personal de Apoyo)

El personal técnico y médico puede mejorar sus **Ratings de Experiencia** (por ejemplo, de Regular a Veterano) completando un número determinado de escenarios. 

- Un equipo que ha sufrido bajas y ha sido reforzado a su fuerza completa, ve su contador de escenarios completados reducido a **0**.

| Rating Antiguo | Rating Nuevo | Escenarios Completos Requeridos |
| :--- | :--- | :--- |
| Green | Regular | 5 |
| Regular | Veteran | 10 |
| Veteran | Elite | 20 |

#### Reglas de Avance de Habilidades (Campañas Chaos)

El personal que participó en la misión (track) anterior puede mejorar sus **Ratings de Habilidad**.

- **Costo:** El coste en Puntos de Apoyo (SP) se detalla en la tabla de Avance de Habilidad.
- **Personal Inactivo:** El personal que no participó en la misión anterior, o que fue recién contratado, tiene un coste de SP **triplicado** para mejorar sus habilidades.
- **Personal del Clan:** El coste se **duplica** para el personal del Clan, a menos que la fuerza del jugador sea de origen Clan.
- **Límite de Avance:** El personal solo puede avanzar cada Rating de Habilidad de uno en uno por cada período entre misiones.
- **Habilidades Especiales de Piloto (Opcional):** Se pueden comprar por **100 SP** por habilidad. Un piloto debe haber recibido un avance de un Rating de Habilidad y no haber comprado una habilidad especial en los últimos 3 meses de tiempo de juego.

| Avance de Habilidad | Coste en SP |
| :--- | :--- |
| Habilidad de Artillería de MechWarrior | 200 |
| Habilidad de Artillería de ProtoMech | 400 |
| Habilidad de Pilotaje de MechWarrior | 150 |
| Habilidad de Pilotaje de ProtoMech | 400 |
| Habilidad de Artillería de Piloto Aeroespacial/Aeronave | 200 |
| Habilidad de Pilotaje de Piloto Aeroespacial/Aeronave | 150 |
| Habilidad de Artillería de Tripulación de Vehículo/Vehículo de Apoyo | 100 |
| Habilidad de Conducción de Tripulación de Vehículo/Vehículo de Apoyo | 50 |
| Habilidad de Artillería de Tripulación de DropShip/JumpShip | 1,000 |
| Habilidad de Pilotaje de Tripulación de DropShip/JumpShip | 1,500 |
| Habilidad de Artillería de Escuadrón/Punto de Battle Armor | 800 |
| Habilidad de Artillería de Pelotón de Infantería | 500 |
| Nueva Habilidad Especial de Piloto | 100 por habilidad |

### Moral y Fatiga (Fuera de Juego)

Estas reglas se gestionan en **Ciclos de Moral/Fatiga** de una semana de duración.

#### Calidad de la Fuerza (Force Quality)

Para determinar la Calidad de la Fuerza, se promedian todos los **Ratings de Habilidad de Pilotaje y Artillería** de la fuerza. El valor total se divide por 2, y luego por el número de pilotos. El resultado se compara con la siguiente tabla:

| Promedio de Habilidades | Calidad de la Fuerza |
| :--- | :--- |
| 7-6 | Green |
| 5-4 | Regular |
| 3-2 | Veteran |
| 1-0 | Elite |

#### Lealtad de la Fuerza (Force Loyalty)

Esta es una medida subjetiva, pero se puede usar la siguiente tabla genérica como guía:

| Rating de Equipamiento | Lealtad de la Fuerza |
| :--- | :--- |
| A | Fanatical |
| B | Fanatical/Reliable |
| C | Reliable |
| D | Reliable/Questionable |
| F | Questionable |
| **Clan** | |
| Front Line | A Rating |
| Second Line | B Rating |
| Garrison/Solahma | D Rating |

#### Moral

Cada fuerza tiene un **Rating de Moral**, que por defecto es **Normal (4)**. Este rating puede cambiar y afecta a varios aspectos del juego.

**Tabla de Ratings de Moral**

| Rating de Moral | Mod. de Combate | Mod. No Combate | N.O. Chequeo Deserción | N.O. Chequeo Motín |
| :--- | :--- | :--- | :--- | :--- |
| 1 (Unbreakable) | +1 | +2 | 0 | 0 |
| 2 (Very High) | +1 | +1 | 0 | 0 |
| 3 (High) | +0 | +1 | 0 | 0 |
| 4 (Normal) | +0 | +0 | 2 | 0 |
| 5 (Low) | +0 | -1 | 5 | 4 |
| 6 (Very Low) | -1 | -1 | 5 | 4 |
| 7 (Broken) | -2 | -2 | 8 | 7 |

**Modificadores Situacionales a los Chequeos de Moral, Deserción y Motín**

- **Calidad de la Fuerza:** Green (-1), Regular (+0), Veteran (+1), Elite (+2).
- **Lealtad de la Fuerza:** Fanatical (+1), Reliable (+0), Questionable (-1).
- **Otros:** La tabla completa incluye modificadores para tipo de fuerza (Clan, Casa, Mercenario), tipo de unidad principal ('Mech, Infantería, etc.), y eventos como haber sufrido deserciones (-1) o motines (-3) recientemente.

**Chequeos de Deserción y Motín**

- **Deserción:** Al inicio de cada Ciclo, tira 2D6 por cada compañía. Si el resultado es **menor o igual** al Rating de Moral actual, una o más unidades han desertado. Luego, tira 2D6 por cada unidad de combate y por cada 10 miembros de personal no combatiente. Si este segundo resultado es **menor o igual** al valor del chequeo de deserción de la tabla, esa unidad deserta.
- **Motín:** Se realiza un chequeo por cada lanza/pelotón/Star. Si el resultado es **menor o igual** al valor del chequeo de motín, esa unidad se amotina.

**Cambios en la Moral**

- **Victoria en Combate:** Tira 1D6. Si el resultado es menor que el Rating de Moral actual, la moral mejora en 1.
- **Derrota en Combate:** Tira 1D6. Si el resultado es mayor que el Rating de Moral actual, la moral empeora en 1.
- **Victoria de Campaña:** La moral mejora en 1 automáticamente.
- **Pérdida de Líder:** El comandante general muere, la moral empeora en 1. Un subcomandante muere, tira 1D6; si es mayor que la moral actual, empeora en 1.
- **Pérdidas en Combate:** 25% de pérdidas = -1 a la Moral; 50% = -2; 75% o más = -3.
- **Suministros:** Fallar en obtener una pieza de repuesto, tira 1D6. Con un 6, la moral empeora en 1. (+1 a la tirada por cada 5 objetos no obtenidos).
- **Deserciones/Motines:** Si ocurren, tira 1D6. Con un 6, la moral empeora en 1.
- **Inactividad:** Tras 4 Ciclos sin combate, la moral se mueve 1 punto hacia Normal (4).

#### Fatiga

Cada compañía tiene **Puntos de Fatiga** (FP), que se acumulan y reducen.

- **Ganancia de Fatiga:** +1 FP por cada combate en el que participa.
- **Pérdida de Fatiga:** -1 FP por cada Ciclo en que no combate. -1 FP adicional por cada dos Ciclos sin combate más allá del primero.
- **Cocina de Campaña:** Reduce la fatiga en 1 punto extra.

**Tabla de Ratings de Fatiga**

| Puntos de Fatiga | Mod. de Combate | Mod. No Combate | Chequeo de Moral |
| :--- | :--- | :--- | :--- |
| 0 | +0 | +1 | No |
| 1-4 | +0 | +0 | No |
| 5-8 | -1 | +0 | Sí |
| 9-12 | -2 | -1 | Sí |
| 13-16 | -3 | -2 | Sí |
| 17+ | -4 | -3 | Sí |

**Modificadores Situacionales a la Fatiga**

- **Calidad de la Fuerza:** Green (+0), Regular (+0), Veteran (+1), Elite (+2).
- **Fuerza del Clan:** +2.

**Efectos de la Fatiga**

- **Chequeo de Moral:** Si la tabla lo indica, tira 2D6 y añade los modificadores de fatiga. Si el resultado es menor que los Puntos de Fatiga actuales, la fuerza pierde 1 Nivel de Moral.
- **Efectos en Juego:** Cada -1 modificador de combate de la tabla resta un turno de la tabla de Fatiga del manual *Tactical Operations* (p. 166) para determinar cuándo se aplican las penalizaciones de habilidad.