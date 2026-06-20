# Explosivos y Demoliciones

Este documento resume las reglas para el uso de explosivos, demoliciones, granadas, minas y municiones especiales en BattleTech: A Time of War. Cubre las habilidades relevantes, las mecánicas de juego y las estadísticas de equipo, extrayendo únicamente las reglas y datos de los manuales proporcionados.

## Habilidad de Demoliciones

La habilidad de Demoliciones se utiliza para preparar, usar, armar y desarmar explosivos. Se requieren **Tiradas de Habilidad de Demoliciones** cada vez que un personaje intenta preparar o desarmar un dispositivo explosivo.

*   **Preparar Explosivos**: Los modificadores incluyen la dificultad por la colocación, materiales insuficientes o componentes inestables. El **Margen de Éxito (MoS)** en una tirada exitosa de preparación se traduce en un modificador de penalización para cualquiera que intente desarmar el dispositivo.
*   **Fallo en la Preparación**: Si el personaje falla al preparar un explosivo por un **Margen de Fallo (MoF) de 5 o más**, los explosivos detonan prematuramente, causando su daño máximo al personaje.
*   **Fallo al Desarmar**: Si un personaje falla al desarmar un explosivo con un **MoF de 3 o más**, el resultado es el mismo: detonación prematura. Cualquier otro resultado de fallo simplemente significa que el dispositivo no se arma o no se desarma, respectivamente.

## Reglas de Juego para Explosivos

### Granadas

*   **Lanzamiento**: Lanzar granadas se considera un ataque de **Fuego Indirecto** y utiliza todas las reglas aplicables del Combate Personal, incluyendo efectos de dispersión en un fallo.
*   **Alcance**: El alcance de una granada lanzada se basa en la puntuación de **Fuerza (STR)** del personaje, como se muestra en la tabla de Explosivos Estándar. El Alcance Corto es igual al STR del personaje, el Medio es STR x 2, el Largo es STR x 3, y así sucesivamente (con todos los alcances en metros).

### Minas y Campos de Minas

*   **Colocación**: Colocar y armar una mina no requiere una Tirada de Acción, pero cuenta como una **Acción Compleja**.
*   **Densidad del Campo de Minas**: Reciben una calificación de densidad que corresponde a cuántas minas se colocan en la misma área. Cada "punto" de densidad equivale a una mina por cada área de 5 metros de diámetro.
*   **Tirada de Detonación**: Cuando una unidad cruza un área minada, su jugador debe hacer una **Tirada de Atributo de Suerte (EDG)**, restando la densidad del campo de minas del resultado. Se añade un **-2** si el personaje corre o esprinta, y un **-4** si la unidad es un vehículo.
*   **Detonación**: Si la tirada tiene éxito, no detonan minas. De lo contrario, una mina detona y aplica su daño. La densidad del campo de minas se reduce en 1.
*   **Daño**: Para unidades de infantería, el daño es igual al del tipo de artillería (ordnance) listado. Para unidades vehiculares, el daño es igual a la **calificación de densidad del campo de minas x 2.5 (redondeado hacia abajo)**, y la densidad se reduce en 2 puntos.
*   **Desminado**: Los personajes entrenados como desminadores deben pasar **2 Acciones Complejas consecutivas** desarmando una sola mina, usando la habilidad de Demoliciones.
*   **Destrucción**: Las minas se tratan como objetos con un **BAR de 2**. Cualquier mina que sufra daño detona con una tirada de 2D6 de 9 o más.

### Cargas de Demolición

La mayoría de las cargas de demolición están diseñadas para "dar forma" a su fuerza explosiva. Como resultado, la cantidad de daño que infligen se reduce más rápidamente a medida que se aleja del punto central. Esta nueva tasa de reducción de daño, identificada en las notas del objeto, reemplaza la reducción habitual de –1 AP/–1 BD por metro.

## Artillería (Ordnance)

Las armas que usan artillería se indican con una letra (entre paréntesis) en lugar de los valores normales de AP/BD. Dichas armas solo pueden usar artillería de esa misma clase de calificación (de la A a la E). El valor de daño para cada tipo y clase de artillería se define en la Tabla de Artillería. A diferencia de otras armas, la artillería no reduce sus valores de AP al realizar ataques a Alcance Extremo.

## Munición Especial

La munición especial modifica la munición estándar utilizada por varias armas. Los modificadores de valor de daño, alcance y coste se definen en la Tabla de Munición Especial. Los códigos de AP y BD para la munición especial siempre reemplazan a los del arma por defecto. Si no se proporcionan códigos nuevos, los originales permanecen. La única excepción es que cualquier arma con un código de fuego en ráfaga (burst-fire) en su BD conserva la capacidad de fuego en ráfaga incluso cuando usa municiones alternativas.

## Tablas de Equipo

### Explosivos Estándar y Demoliciones

| Objeto | AP/BD | Alcance (m) | Disparos | Coste/Recarga (C-bills) | Masa | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GRANADAS** | | | | | | |
| Granada, Micro | (A) | STR x 1/2/3/4 | 1 | 2 | 200 g | Indirecto |
| Granada, Mini | (B) | STR x 1/2/3/4 | 1 | 10 | 450 g | Indirecto |
| Granada | (C) | STR x 1/2/3/4 | 1 | 20 | 600 g | Indirecto |
| Granada, Cohete Asistido | 5X/10A | STR x 1/2/3/4 | 1 | 50 | 600 g | Indirecto; -2 al ataque; Alcance x5 y BD -2 en modo cohete. |
| **MINAS** | | | | | | |
| Mina, Activa | (D) | — | — | 1,000 | 5 kg | -4 a la tirada de detonación vs. unidades saltando o aerodeslizadores. |
| Mina, Detonación Remota | (E) | — | — | 75 | 600 g | No detonará a menos que la active una unidad amiga con comunicaciones. |
| Mina, Estándar | (E) | — | — | 50 | 500 g | +4 a la tirada de detonación vs. aerodeslizadores; no puede atacar unidades saltando. |
| Mina, Vibrabomba | (E) | — | — | 500 | 1 kg | Activada por tonelaje. |
| **DEMOLICIONES** | | | | | | |
| C8, Bloque de Demolición | 7X/10A | — | 1 | 50 | 1 kg | -4AP/-4BD por metro. |
| C8, Carga de Cartera | 8X/12A | STR x 0.5/1/1.5/2 | 1 | 210 | 4.5 kg | -2AP/-2BD por metro; el alcance se aplica cuando se lanza como granada. |
| Kit de Demolición | — | — | 12 | 200 | 2 kg | Usado para preparar hasta 12 explosivos para detonación remota o temporizada; +1 a la tirada de Demoliciones para preparar. |
| Pentaglicerina | 7X/10A | — | 1 | 150 | 200 g | -2AP/-2BD por metro. |

### Munición Especial

| Categoría | Objeto | Modificador AP/BD | Modificador Alcance | Modificador Coste/Recarga | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Munición Especial para Arco y Flecha** | | | | | |
| Explosiva | -1X/+1S | — | x3 | En una pifia, el arma explota e inflige la mitad de AP/BD al atacante. |
| Incendiaria | -1B/-1CS | — | x1.5 | Cambia el BD a Continuo/Salpicadura. |
| **Munición Especial para Armas de Proyectiles** | | | | | |
| AET | +0/+0 | — | x2 | AP 50% (redondeado hacia abajo) vs. Barreras. |
| Ráfaga Aérea | -1X/-1S | — | x8 | Disponible solo para rifles; requiere módulo de rifle guiado; Acción Compleja para atacar. |
| Perforante de Armadura | +2B/-1 | — | x3 | — |
| Explosiva | -1X/+1S | — | x3 | En una pifia, el arma explota. |
| Flechette | -3B/+1S | — | x1 | No disponible para escopetas. |
| Frangible | -1B/+0 | — | x2 | 0 AP vs. Barreras. |
| Incendiaria | -1B/-1CS | — | x1.5 | Añade Continuo/Salpicadura al BD. |
| Rastreador Radiactivo | +0B/+0 | — | x3.5 | Objetivo "marcado" con un impacto exitoso; la firma dura 1 mes; requiere escáner de rastreo. |
| Subsónica | -2B/-1 | Mitad de alcance | x1 | -1 a la Percepción para oír el disparo. |
| Trazadora | — | — | x1.5 | +1 al ataque para fuego de supresión o en oscuridad; +2 a la Percepción para localizar al atacante. |
| **Munición Especial para Gyrojet** | | | | | |
| Proyectiles Guiados | -1B/-1 | — | x8 | Requiere módulo de rifle guiado; Acción Compleja para atacar; +2 al ataque. |