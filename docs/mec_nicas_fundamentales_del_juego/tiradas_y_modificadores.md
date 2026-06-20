# Tiradas y Modificadores

Este documento resume las reglas fundamentales sobre tiradas de dados y los modificadores que se aplican en el juego de BattleTech, basándose en el manual 'Total Warfare'. La mecánica central consiste en una tirada de 2D6 que debe igualar o superar un Número Objetivo (Target Number). Este número se calcula partiendo de una habilidad base (como Artillería o Pilotaje) y ajustándolo con diversos modificadores situacionales.

## Términos Fundamentales

*   **Número Base para Impactar (Base To-Hit Number)**: Es igual a la Habilidad de Artillería (Gunnery Skill) del guerrero que ataca.
*   **Número Modificado para Impactar (Modified To-Hit Number)**: Es el Número Base para Impactar ajustado por todos los modificadores aplicables (alcance, movimiento, terreno, etc.). Este es el número final que se debe igualar o superar en una tirada de 2D6 para que un ataque tenga éxito.
*   **Habilidad de Pilotaje/Conducción Modificada (Modified Piloting/Driving Skill)**: Es la habilidad base de Pilotaje/Conducción del guerrero, ajustada por modificadores debidos a daño, terreno, o maniobras especiales. Es el número objetivo para las tiradas de habilidad.
*   **Número Objetivo (Target Number)**: El valor que se debe igualar o superar en una tirada de dados para que una acción tenga éxito.
*   **Modificador de Movimiento del Atacante**: Penalización que se aplica al atacar si la unidad se ha movido en el mismo turno.
*   **Modificador de Movimiento del Objetivo**: Penalización que se aplica al atacar a un objetivo que se ha movido en el mismo turno.

## Habilidades y Tiradas de Habilidad

Las dos habilidades principales usadas en combate son **Artillería (Gunnery)** y **Pilotaje/Conducción (Piloting/Driving)**. Un valor más bajo indica una mayor pericia.

### Habilidades Promedio

Si no se especifica lo contrario, las unidades usan las siguientes habilidades promedio:

| Facción | Tipo de Guerrero/Tripulación | Artillería | Pilotaje | Conducción | Anti-'Mech |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Esfera Interior** | MechWarrior | 4 | 5 | — | — |
| | Tripulación de Vehículo de Combate | 4 | — | 5 | — |
| | Infantería Convencional | 4 | — | — | 8 |
| | Piloto de Caza Aeroespacial | 4 | 5 | — | — |
| **Clan** | MechWarrior | 3 | 4 | — | — |
| | Tripulación de Vehículo de Combate | 5 | — | 6 | — |
| | Infantería de Batalla | 3 | — | — | 4 |
| | Piloto de Caza Aeroespacial | 4 | 5 | — | — |

### Tiradas de Pilotaje/Conducción

Se realizan cuando una unidad intenta una maniobra peligrosa o podría perder el control. El número objetivo se calcula partiendo de la habilidad de Pilotaje/Conducción del piloto y añadiendo los modificadores de la siguiente tabla. Una tirada fallida por un 'Mech generalmente resulta en una caída.

**Tabla de Modificadores de Tirada de Pilotaje/Conducción**

| Condición | Modificador |
| :--- | :--- |
| **Daño al 'Mech** | |
| 'Mech recibe 20+ puntos de daño en una fase | +1 |
| Actuador de pierna/pie destruido | +1 |
| Actuador de cadera destruido | +2 |
| Giroscopio impactado | +3 |
| Giroscopio destruido | Caída automática |
| Pierna destruida | Caída automática |
| **Acciones de la Unidad** | |
| 'Mech entró en agua de Profundidad 1 | -1 |
| 'Mech entró en agua de Profundidad 3+ | +1 |
| 'Mech intentó levantarse | 0 |
| 'Mech entró en escombros | 0 |
| 'Mech saltó con giroscopio o actuadores dañados | Ver Daño Preexistente |
| **Casos Especiales** | |
| 'Mech de cuatro patas con piernas intactas | -2 |
| Carga no intencionada | +3 |
| **Daño Preexistente** | |
| Por actuador de pierna/pie previamente destruido | +1 |
| Por actuador de cadera previamente destruido | +2 |
| Giroscopio previamente impactado | +3 |
| Pierna previamente destruida | +5 |
| **Movimiento de Patinaje (Skidding)** | |
| Hexágonos movidos en el turno: 0-2 | -1 |
| Hexágonos movidos en el turno: 5-7 | +1 |
| Hexágonos movidos en el turno: 11-17 | +4 |
| Hexágonos movidos en el turno: 25+ | +6 |

### Tiradas de Consciencia

Se realizan cuando un piloto de 'Mech, ProtoMech o caza sufre daño. Si la tirada de 2D6 es menor que el número de consciencia, el piloto queda inconsciente.

| Puntos de Daño Totales | Número de Consciencia |
| :--- | :--- |
| 1 | 3 |
| 2 | 5 |
| 3 | 7 |
| 4 | 10 |
| 5 | 11 |
| 6 | Muerto |

## Tiradas de Ataque y Modificadores (Combate Terrestre)

El número objetivo para un ataque se calcula usando el mnemónico **G.A.T.O.R.**

*   **G (Gunnery/Artillería)**: La habilidad de Artillería del atacante.
*   **A (Attacker/Atacante)**: Modificadores por el movimiento del atacante.
*   **T (Target/Objetivo)**: Modificadores por el movimiento y estado del objetivo.
*   **O (Other/Otros)**: Modificadores por terreno, calor, daño, etc.
*   **R (Range/Alcance)**: Modificadores por la distancia al objetivo.

**Tabla Maestra de Modificadores de Ataque**

| Condición | Modificador |
| :--- | :--- |
| **Atacante: Movimiento** | |
| Estacionario | 0 |
| Caminando/Crucero | +1 |
| Corriendo/Flanqueo | +2 |
| Saltando | +3 |
| Tumbado (Prone) | +2 |
| **Terreno (acumulativo)** | |
| Bosque Ligero | +1 por hexágono intermedio; +1 si el objetivo está en bosque ligero |
| Bosque Pesado | +2 por hexágono intermedio; +2 si el objetivo está en bosque pesado |
| Agua Profundidad 1 | +1 (ver Cobertura Parcial) |
| Cobertura Parcial | +1 |
| **Objetivo: Estado y Movimiento** | |
| Tumbado (Prone) | -2 desde adyacente; +1 desde otros |
| Inmóvil | -4 |
| Patinando (Skidding) | +2 |
| Movido 0-2 hexágonos | 0 |
| Movido 5-6 hexágonos | +2 |
| Movido 10-17 hexágonos | +4 |
| Movido 25+ hexágonos | +6 |
| Saltando/Aerotransportado | +1 adicional |
| Unidad de Infantería de Batalla | +1 (solo para no-infantería) |
| **Atacante: Daño y Calor (Solo Ataques con Armas)** | |
| Sensor impactado | +2 |
| Actuador de hombro impactado | +4 para armas en ese brazo |
| Nivel de Calor 8-12 | +1 |
| Nivel de Calor 17-23 | +3 |
| **Alcance y Otros** | |
| Alcance Corto | 0 |
| Alcance Medio | +2 |
| Alcance Largo | +4 |
| Alcance Mínimo | [Alcance Mín.] - [Alcance Obj.] + 1 |
| Ataque indirecto LRM | +1 |
| Objetivo secundario en arco frontal | +1 |
| Objetivo secundario en arco lateral/trasero | +2 |

## Modificadores de Combate Aeroespacial

El combate aeroespacial utiliza su propio conjunto de modificadores.

**Tabla de Modificadores de Ataque Aeroespacial (Espacio)**

| Condición | Modificador |
| :--- | :--- |
| **Alcance** | |
| Corto (0-6 hex) | +0 |
| Medio (7-12 hex) | +2 |
| Largo (13-20 hex) | +4 |
| Extremo (21-25 hex) | +6 |
| **Ángulo de Ataque** | |
| Ataque contra la popa (Aft) | +0 |
| Ataque contra el morro (Nose) | +1 |
| Ataque contra el lateral (Side) | +2 |
| **Condiciones del Atacante** | |
| Superó el Empuje Seguro este turno | +2 |
| Fuera de control | +2 |
| Daño en piloto/tripulación | +1 por casilla marcada |
| **Condiciones del Objetivo** | |
| Objetivo a Velocidad 0 | -2 |
| Objetivo realizando ataque aire-tierra | -3 |
| Objetivo en evasión | Variable (ver p. 77) |
| **Otros** | |
| Disparando a través de hex atmosférico | +2 por hexágono |

**Tabla de Modificadores de Ataque Aire-Tierra**

| Tipo de Ataque | Modificador |
| :--- | :--- |
| Ametrallamiento (Strafing) | +4 |
| Ataque de Precisión (Striking) | +2 |
| Bombardeo (Bombing) | +2 |
