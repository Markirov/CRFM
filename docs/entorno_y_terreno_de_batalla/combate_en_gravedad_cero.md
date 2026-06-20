# Combate en Gravedad Cero

## Combate en Gravedad Cero (Espacio)

### Movimiento en el Espacio

A diferencia de las unidades terrestres, las unidades aeroespaciales no gastan Puntos de Movimiento (PM). En su lugar, tienen una **Velocidad** que indica el número de hexágonos que deben viajar. En el vacío sin fricción del espacio, una unidad en movimiento continúa en línea recta a una velocidad constante a menos que se vea afectada por una fuerza externa, como el empuje de sus motores.

#### Puntos de Empuje (Thrust Points)
Cada unidad tiene dos valores de empuje: **Empuje Seguro (Safe Thrust)** y **Empuje Máximo (Maximum Thrust)**. El Empuje Máximo es 1.5 veces el valor de Empuje Seguro (redondeando hacia arriba). Gastar más Puntos de Empuje que el valor de Empuje Seguro degrada el manejo de la unidad.

*   **Cambio de Velocidad:** Cada Punto de Empuje gastado aumenta o disminuye la Velocidad de la unidad en 1. Los cambios de velocidad realizados antes del movimiento afectan al turno actual. Los cambios realizados al final del movimiento afectan al turno siguiente.
*   **Cambio de Orientación:** Se utilizan Puntos de Empuje para cambiar la orientación de una unidad durante el movimiento en 60 grados (un lado de hexágono). El coste depende de la velocidad actual de la unidad.

#### Subfases de Movimiento
Dentro de la Fase de Movimiento (Aeroespacial), cada tipo de unidad se mueve en su propia subfase en el siguiente orden:
1.  Naves de Descenso (DropShips)
2.  Naves Pequeñas (Small Craft)
3.  Cazas (Fighters)

#### Modos Especiales de Movimiento
*   **Acción Evasiva:** Una unidad aeroespacial puede gastar 2 Puntos de Empuje para realizar maniobras evasivas, lo que dificulta que un oponente la apunte. Los Cazas y Naves Pequeñas que realizan acción evasiva no pueden disparar armas ese turno.
*   **Rodar (Rolling):** Una unidad aeroespacial puede gastar 1 Punto de Empuje para rodar, invirtiendo efectivamente sus lados derecho e izquierdo. Esto significa que las armas montadas en un arco lateral izquierdo disparan en sus equivalentes del lado derecho, y viceversa. Los impactos en las ubicaciones del blindaje del lado izquierdo se aplican a las orientaciones del blindaje del lado derecho.
*   **Maniobras de Alta-G:** Si un solo gasto de Puntos de Empuje (en un solo hexágono) para girar o cambiar la velocidad excede la Integridad Estructural (IE) actual de una unidad, la maniobra podría dañar la unidad.

### Combate en el Espacio

#### Línea de Visión (LdV)
En el espacio, la LdV es fácil de determinar. Otras unidades no la bloquean, y no hay altitudes de terreno ni terreno interviniente. Solo los efectos de equipo como los Lanzadores de Pantalla (Screen Launchers) pueden bloquear la LdV.

#### Arcos de Disparo
*   **Unidades Aerodino (Cazas, Naves de Descenso Aerodino, Naves Pequeñas Aerodino):** Usan cuatro arcos de armas: proa, popa, ala derecha y ala izquierda.
*   **Unidades Esferoide (Naves de Descenso Esferoide, Naves Pequeñas Esferoide):** Usan seis arcos de disparo: proa, popa, proa-derecha, proa-izquierda, popa-derecha y popa-izquierda.

#### Alcance
Las unidades aeroespaciales utilizan una versión modificada de las reglas de alcance. Todos los tipos de armas utilizan cuatro tramos de alcance estandarizados: Corto, Medio, Largo y Extremo. Las armas de escala capital utilizan diferentes valores de hexágonos para estos tramos.

#### Modificadores para Impactar
Se aplican varios modificadores al número base para impactar (la Habilidad de Artillería del piloto). Los modificadores clave para el combate espacial incluyen:
*   **Modificadores de Alcance:** +0 para Corto, +2 para Medio, +4 para Largo, +6 para Extremo.
*   **Ángulo de Ataque:** La dirección del movimiento del objetivo en relación con el atacante. +0 contra la popa, +1 contra la proa, +2 contra el lado.
*   **Movimiento del Atacante:** +2 si el atacante excedió el Empuje Seguro.
*   **Movimiento del Objetivo:** +1 a +4 dependiendo de los Puntos de Empuje gastados por el objetivo en el turno.
*   **Otros:** Modificadores por daño, estado (fuera de control, evasivo), y equipo especial.

#### Localización de Impacto
Cuando un ataque impacta, el jugador atacante tira 2D6 y consulta la **Tabla de Localización de Impacto de Unidades Aeroespaciales**. La columna utilizada depende de la dirección del ataque (Proa, Popa, Lado).

### Daño
*   **Escala:** Las armas de escala capital infligen 10 puntos de daño por cada punto de su Valor de Ataque contra blindaje de escala estándar. Los ataques de armas de escala estándar contra blindaje de escala capital se suman y luego se dividen por 10 (redondeando normalmente).
*   **Daño a la Integridad Estructural (IE):** Todo el daño a la IE de una unidad se reduce a la mitad (redondeando hacia abajo).
*   **Impactos Críticos:** Un impacto crítico puede ocurrir en una de cuatro situaciones:
    1.  **Umbral de Daño:** Si el daño de un solo impacto excede el Umbral de Daño de una cara del blindaje (10% de su valor total de blindaje, redondeado hacia arriba).
    2.  **Daño a la IE:** Si un impacto en una ubicación inflige 1 o más puntos de daño a la IE.
    3.  **Impactos de Suerte:** Cualquier tirada para impactar exitosa que sea un 12 natural.
    4.  **Misiles Capitales:** Cada impacto de un misil capital o bahía de misiles puede infligir un impacto crítico.

### Colisiones y Embestidas
*   **Ataques de Embestida:** Una unidad debe terminar su movimiento en el mismo hexágono que el objetivo y declarar la embestida. El piloto debe tener éxito en una tirada de 2D6 de 11+ para proceder. El número para impactar se calcula usando la **Tabla de Ataques de Embestida**.
*   **Daño por Colisiones:** El daño que cada unidad causa a la otra es igual a su propia masa dividida por 10, multiplicada por la velocidad neta del impacto. La velocidad neta es la velocidad del atacante, modificada por el movimiento del objetivo (se suma la velocidad si se mueve de frente, se resta si se aleja). El daño se aplica como un solo impacto en una ubicación determinada por una tirada de 2D6.

## Reglas Avanzadas

# Combate en Gravedad Cero (Reglas de Gravedad Alta/Baja)

El combate en mundos cuya gravedad es significativamente mayor o menor que la gravedad terrestre normal (1 G) afecta el movimiento de una unidad.

## Efectos en el Movimiento

Para determinar las tasas de movimiento de una unidad afectadas por la gravedad, divide sus MP de Caminar (o Crucero) y de Salto por la calificación G del mundo y redondea al número entero más cercano (0.5 se redondea hacia abajo). Los modificadores al movimiento debidos a la gravedad siempre se calculan después de todos los demás modificadores de movimiento.

Calcula los nuevos MP de Correr (o Flanquear) basándose en los MP de Caminar (o Crucero) revisados.

Las unidades cuyos MP se reducen a 0 por los efectos de la gravedad son incapaces de moverse.

### Daño Potencial por Movimiento de Correr/Flanquear

Si una unidad gasta más MP que sus MP normales de Correr (o Flanquear) durante un turno, el jugador debe hacer una Tirada de Habilidad de Pilotaje al final de la fase en la que se excedieron los MP de Correr, modificada apropiadamente por las condiciones relevantes, para determinar si la unidad sufre algún daño por moverse a una velocidad inusual.

- **'Mech**: Si la Tirada de Habilidad de Pilotaje falla, el 'Mech sufre 1 punto de daño a la estructura interna en cada una de sus piernas por cada punto de movimiento por el cual la unidad excedió sus MP normales de Correr (el 'Mech no cae si esta tirada falla). Tira en la Tabla de Determinación de Golpes Críticos para resolver si el daño a la estructura interna resultó en un golpe crítico.
- **Vehículo**: Recibe 1 punto de daño en la estructura interna de su lado Frontal por cada Punto de Movimiento gastado que exceda su Velocidad de Flanqueo normal y debe hacer una única tirada en la Tabla de Daño al Sistema Motriz (independientemente de cuánto daño se reciba, solo se hace una tirada).

### Daño Potencial por Salto

Realiza una Tirada de Habilidad de Pilotaje, aplicando un modificador por cada 0.5 gravedades completas por encima o por debajo de 1.

- **Gravedad Baja**: Si la tirada falla, el 'Mech sufre 1 punto de daño a la estructura interna en cada pierna por cada Punto de Movimiento gastado en el salto que exceda sus MP de Salto normales.
- **Gravedad Alta**: Cada MP de Salto gastado únicamente para "amortiguar" el aterrizaje (es decir, no para moverse de hexágono) aplica un modificador de –1. Si la tirada falla, el 'Mech sufre 1 punto de daño a la estructura interna en cada pierna por cada segundo MP de Caminar perdido de sus MP de Caminar normales.

### Caídas

Calcula el daño por caídas sufridas en gravedad inusual normalmente, luego multiplica el resultado por la calificación G del mundo y aplica el daño total a la unidad.

### ProtoMechs

- El MP de un ProtoMech no se incrementa por gravedad baja, aunque se reduce por gravedad alta.
- Un ProtoMech no necesita hacer una tirada al saltar en gravedad baja.

## Ataques con Armas

Añade un modificador de +1 al impactar a todos los ataques con armas de Misiles y Balísticas de Fuego Directo por cada 0.2 G (o fracción) por encima o por debajo del estándar terrestre de 1 G.

## Eyección

Al aterrizar después de una eyección, se aplican modificadores a la Tirada de Habilidad de Pilotaje según las condiciones planetarias.