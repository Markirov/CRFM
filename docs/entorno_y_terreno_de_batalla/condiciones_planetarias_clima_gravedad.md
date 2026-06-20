# Condiciones Planetarias (Clima, Gravedad)

# Condiciones Planetarias (Reglas Estándar)

Las Reglas Estándar de *Total Warfare* tienen reglas limitadas para las condiciones planetarias. La mayoría de los efectos ambientales detallados, como el clima, se consideran reglas avanzadas que se encuentran en otros manuales (específicamente *Tactical Operations*).

## Clima (Lluvia, Nieve, Viento, etc.)

No existen reglas estándar para las condiciones climáticas en *Total Warfare*. Los efectos del clima se consideran reglas avanzadas y se detallan en el libro de reglas *Tactical Operations*.

## Gravedad

Las reglas estándar para la gravedad solo se aplican a las unidades aeroespaciales en un mapa de gran altitud.

### Mecánicas de Gravedad

*   **Área de Efecto**: La gravedad influye en la posición de cualquier unidad en el mismo mapa de gran altitud que la superficie planetaria, siempre que se encuentren a diez hexágonos o menos de la interfaz espacio-atmósfera.
*   **Efecto de Desplazamiento**: En la Fase Final (End Phase), cualquier unidad en el área afectada por la gravedad se desplaza una fila de hexágonos más cerca de la superficie planetaria.
    *   Si una unidad puede moverse a dos hexágonos posibles, el jugador que la controla elige el hexágono final.
    *   Las unidades desplazadas hacia la fila de la interfaz deben realizar una Tirada de Control (Control Roll) para la reentrada.
*   **Excepciones**: La gravedad no influye en las unidades que ya están en la interfaz, en la atmósfera o en un hexágono de tierra (baja altitud), a menos que su Velocidad sea 0.
*   **Unidades con Velocidad 0**: Una unidad en un hexágono de tierra con Velocidad 0 debe realizar una de las siguientes acciones al final de la Fase de Movimiento (Aeroespacial):
    *   Flotar (Hover), si es posible, con un coste de 2 Puntos de Empuje (MP).
    *   Aterrizar (Land).
    *   Estrellarse (Crash).

## Reglas Avanzadas

Esta sección detalla las reglas avanzadas para condiciones planetarias, incluyendo clima y gravedad, que afectan el movimiento y el combate.

#### Condiciones de Terreno

**Presión Atmosférica (Densidad)**

Las reglas simulan varias presiones atmosféricas, desde el vacío hasta densidades muy altas.

*   **Vacío:**
    *   **Unidades Prohibidas:** Vehículos, infantería convencional y cazas convencionales no pueden operar. Excepciones: unidades no de infantería con motor de fusión (o de fisión/célula de combustible para IndustrialMechs) y Sello Ambiental; infantería convencional si son Tropas XCT.
    *   **Integridad del Casco:** Cada vez que una unidad no aeroespacial/no de infantería sufre daño, se realiza una tirada de 2D6. Con un 10+, el casco se rompe en esa localización. Si toda la armadura de una localización es destruida, se considera rota automáticamente.
    *   **Efectos de la Brecha:**
        *   **'Mechs:** Todos los componentes en la localización rota se vuelven no funcionales. Una brecha en la cabeza mata al piloto. Un impacto crítico en el Soporte Vital elimina el suministro de aire interno, causando 1 punto de daño al piloto por turno en vacío, requiriendo una Tirada de Consciencia por cada punto.
        *   **ProtoMechs:** Si el torso central sufre una brecha, el piloto muere.
        *   **Vehículos:** Si cualquier localización sufre una brecha, el vehículo es destruido.
        *   **Infantería:** El daño a la infantería convencional (Tropas XCT) se duplica.
*   **Rastro:**
    *   Sigue las reglas de Vacío con las siguientes excepciones: las unidades aeroespaciales no esferoidales se mueven en el Mapa de Baja Altitud como si estuvieran en la Fila Atmosférica 4 del Mapa de Gran Altitud. Las brechas de casco ocurren con un resultado de 12+. La condición de Viento se reduce en dos categorías.
*   **Delgada:**
    *   Aplica una penalización de -2 MP de Crucero a vehículos WiGE, VTOL y Hovercraft.
    *   Las unidades aeroespaciales no esferoidales aumentan el número de hexágonos de aterrizaje/despegue requeridos por 1.5 (redondeado hacia arriba).
    *   La condición de Viento se reduce en una categoría.
*   **Alta:**
    *   Aplica una bonificación de +1 MP de Crucero a vehículos WiGE, VTOL y Hovercraft.
    *   Las aeronaves aumentan su capacidad de carga en un 10% por cada 0.1 bar de atmósfera por encima de 1.2.
    *   Las unidades aeroespaciales no esferoidales disminuyen el número de hexágonos de aterrizaje/despegue requeridos por 0.75 (redondeado hacia arriba).
    *   La condición de Viento aumenta en una categoría.
*   **Muy Alta:**
    *   Igual que la atmósfera Alta, pero la condición de Viento aumenta en dos categorías.

**Gravedad Alta/Baja**

El combate en mundos con gravedad significativamente mayor o menor que 1 G afecta el movimiento de una unidad.

*   **Efectos de Movimiento:** Para determinar las nuevas tasas de movimiento, divide los MP de Caminar (o Crucero) y Salto de la unidad por la clasificación G del mundo y redondea al número entero más cercano (redondea hacia abajo en .5). Calcula los nuevos MP de Correr (o Flanquear) basándose en el MP de Caminar (o Crucero) revisado.
*   **Daño Potencial por Correr/Flanquear:** Si una unidad gasta más MP que su MP de Correr (o Flanquear) normal durante un turno, el jugador debe hacer una Tirada de Habilidad de Pilotaje al final de la fase. Si falla, un 'Mech sufre 1 punto de daño a la estructura interna de cada una de sus piernas. Un vehículo sufre 1 punto de daño a su blindaje frontal y debe hacer una tirada en la Tabla de Daño al Sistema Motriz.
*   **Daño Potencial por Salto:** Se requiere una Tirada de Habilidad de Pilotaje, aplicando un modificador por cada 0.5 gravedades completas por encima o por debajo de 1 G. Si la tirada falla en baja gravedad, el 'Mech sufre 1 punto de daño a la estructura interna de cada pierna por cada Punto de Movimiento gastado en salto que exceda su MP de Salto normal. En alta gravedad, si la tirada falla, el 'Mech sufre 1 punto de daño a la estructura interna de cada pierna por cada segundo MP de Caminar perdido de su MP de Caminar normal.
*   **Caída:** Calcula el daño por caídas normalmente, luego multiplica el resultado por la clasificación G del mundo.
*   **Ataques con Armas:** Añade un modificador de +1 para impactar a todos los ataques con armas de Misiles y Balísticas de Fuego Directo por cada 0.2 G (o fracción) por encima o por debajo del estándar terrestre de 1 G.

#### Condiciones Climáticas

**Viento**
*   **Dirección del Viento:** Al comienzo de un escenario, se declara un lado de un hexágono como Dirección 1 y se numeran los restantes del 2 al 6 en sentido horario. Se tira 1D6 para determinar la dirección del viento para toda la partida.
*   **Vientos Cambiantes (Opcional):** Durante la Fase Final de cada turno, se puede verificar si la dirección o la fuerza del viento ha cambiado. Tira 1D6 para la fuerza: con un 1, el viento se debilita una categoría; con un 6, se fortalece una categoría. Luego tira 1D6 para la dirección: con un 1, la dirección cambia un hexágono (60 grados) en sentido horario; con un 6, cambia un hexágono en sentido antihorario.

**Niebla**
*   **Niebla Ligera:** La mayoría de las unidades pagan +1 MP para entrar en cada hexágono de niebla ligera.
*   **Niebla Densa:** Aplica un modificador de +1 para impactar a todas las armas de pulso y de energía de fuego directo. La mayoría de las unidades pagan +2 MP para entrar en cada hexágono de niebla densa.

**Granizo**
*   **Granizo Ligero:** Durante la Fase Final, cada jugador tira 1D6 para determinar el número de sus unidades de infantería convencional o Aeronaves que sufren daño. Se tira 1D6/2 por cada unidad afectada para determinar el daño.
*   **Granizo Fuerte:** Durante la Fase Final, cada jugador tira 1D6 para determinar el número de sus unidades que sufren daño. Se tira 1D6 por cada unidad afectada para determinar el daño.

**Lluvia**
*   **Lluvia Ligera:** Aplica un modificador de +1 para impactar a todos los ataques de la infantería convencional.
*   **Lluvia Moderada:** Aplica un modificador de +1 para impactar a todos los ataques con armas. Crea barro en hexágonos de terreno despejado, agua de Profundidad 0 o caminos de tierra.
*   **Tormenta Eléctrica:** Durante la Fase Final de cada turno, tira 1D6. Con un 5-6, tira 1D6 de nuevo, dividiendo el resultado por 2 (redondeado hacia abajo, mínimo 1) para determinar el número de rayos. Los rayos se resuelven usando la Tabla de Impacto de Rayo.
*   **Lluvia Fuerte:** Aplica un modificador de +1 para impactar a todos los ataques con armas y un modificador de +1 a las Tiradas de Habilidad de Pilotaje/Conducción. Crea barro y rápidos.
*   **Lluvia con Ráfagas:** Incluye todos los modificadores y efectos de Lluvia Fuerte y Viento Fuerte.
*   **Aguacero Torrencial:** Aplica un modificador de +2 para impactar a todos los ataques con armas y un modificador de +2 a las Tiradas de Habilidad de Pilotaje/Conducción. Crea barro y torrentes.

**Nieve**
*   **Nieve Ligera:** Aplica un modificador de +1 para impactar a toda la infantería convencional. Se combina con temperaturas de -40 grados Celsius.
*   **Aguanieve:** Aplica un modificador de +1 para impactar a todos los ataques con armas. Puede crear hielo. Se combina con temperaturas de -40 grados Celsius.
*   **Nieve Moderada:** Aplica un modificador de +1 para impactar a todos los ataques con armas. Puede crear nieve fina/profunda y hielo. Se combina con temperaturas de -50 grados Celsius.
*   **Ráfagas de Nieve:** Incluye todos los modificadores y efectos de Nieve Moderada y Viento Moderado.
*   **Nevada Fuerte:** Aplica un modificador de +1 para impactar a todos los ataques con armas y un modificador de +1 a las Tiradas de Habilidad de Pilotaje/Conducción. Puede crear nieve fina/profunda y hielo. Se combina con temperaturas de -50 grados Celsius.
*   **Tormenta de Hielo:** Incluye todos los modificadores y efectos de hielo negro. Se combina con temperaturas de -60 grados Celsius. Puede crear hielo.

**Temperaturas Extremas**
*   Por cada 10 grados C (o fracción) por encima de 50 grados, añade 1 Punto de Calor al aumento de calor general de la unidad en cada turno.
*   Por cada 10 grados C (o fracción) por debajo de -30 grados, resta 1 Punto de Calor del aumento de calor general de la unidad en cada turno.
*   Los vehículos e infantería ven su velocidad de Crucero reducida en 1 MP por cada 10 grados por encima de 50°C o por debajo de -30°C.