# Movimiento en el Espacio (Empuje)

Este documento detalla las reglas para el movimiento en el espacio mediante el uso de empuje, diferenciando entre las reglas estándar y las avanzadas.

Las reglas estándar se basan en un sistema simple donde las unidades tienen una velocidad y gastan Puntos de Empuje para acelerar, frenar o cambiar de orientación. El coste para cambiar la orientación depende de la velocidad actual de la unidad.

Las reglas avanzadas introducen un sistema de vectores, donde la orientación (hacia dónde apunta la nave) y la dirección del movimiento (hacia dónde se desplaza) pueden ser diferentes. El empuje se aplica a vectores que corresponden a las seis caras de un hexágono, y estos se consolidan para determinar el movimiento final. Este sistema permite maniobras más complejas y realistas, como el desplazamiento lateral o el frenado aplicando empuje en dirección opuesta al movimiento.

## Reglas Estándar (Total Warfare)

Las unidades aeroespaciales no gastan Puntos de Movimiento (PM) para entrar en hexágonos. En su lugar, tienen una **velocidad** que indica el número de hexágonos que deben recorrer. En el vacío, una unidad continúa en línea recta a velocidad constante a menos que se vea afectada por una fuerza externa como el empuje de sus motores.

### Puntos de Empuje (Thrust Points)

Cada unidad tiene dos valores de empuje:
*   **Empuje Seguro (Safe Thrust):** El número de Puntos de Empuje que una unidad puede gastar en un solo turno sin efectos adversos.
*   **Empuje Máximo (Maximum Thrust):** El número total de Puntos de Empuje que una unidad puede gastar en un turno. Es igual a 1.5 veces el valor de Empuje Seguro, redondeado hacia arriba. Gastar más Puntos de Empuje que el valor de Empuje Seguro degrada el manejo de la unidad.

En el espacio, una unidad viaja a velocidad y rumbo constantes a menos que se use el empuje de los motores. Al principio o al final del movimiento de una unidad, puede gastar Puntos de Empuje para cambiar su velocidad u orientación.

#### Cambio de Velocidad

Cada Punto de Empuje gastado aumenta o disminuye la velocidad de la unidad en 1. La velocidad de una unidad no puede reducirse por debajo de cero. Los cambios de velocidad realizados **antes** del movimiento afectan al turno actual. Los cambios realizados **al final** del movimiento tienen efecto en el siguiente turno. Una unidad que cambia su velocidad al final de un turno no puede cambiarla de nuevo al principio del siguiente turno.

#### Cambio de Orientación

Se utilizan Puntos de Empuje para cambiar la orientación de una unidad en incrementos de 60 grados (un lado de hexágono). El coste en Puntos de Empuje depende de la velocidad actual de la unidad, como se muestra en la siguiente tabla.

| Velocidad Actual | Coste de Puntos de Empuje |
| :--------------- | :------------------------ |
| 0-2              | 1                         |
| 3-5              | 2                         |
| 6-7              | 3                         |
| 8-9              | 4                         |
| 10               | 5                         |
| 11               | 6                         |
| 12+              | +1 por punto              |

Una unidad debe moverse al menos un hexágono hacia adelante antes de poder realizar cualquier cambio de orientación, a menos que su velocidad sea 0.

## Reglas Avanzadas (Strategic Operations)

El movimiento avanzado simula una versión más realista donde la **dirección del movimiento (heading)** de una unidad puede diferir de su **orientación (facing)**. Para ralentizar, una unidad debe cambiar su orientación y aplicar empuje en una dirección que contrarreste su movimiento actual.

### Sistema de Vectores

La dirección y velocidad de una unidad se determinan mediante un sistema de seis vectores (A-F), que se corresponden con las seis caras de un hexágono. El lado A de cada hexágono siempre está hacia la parte superior del mapa.
*   Un vector está **activo** si se le aplica empuje mientras la unidad está orientada hacia ese lado del hexágono.
*   Un vector está **inactivo** si no se aplica empuje para moverse a través de ese lado del hexágono.

Cada vez que una unidad gasta empuje, ese número se anota en el vector apropiado (el de la orientación de la unidad). Luego, se determina el efecto del empuje consolidando los vectores activos.

1.  **Consolidar Vectores Opuestos:** Resta el valor de empuje más bajo de ambos vectores opuestos, reduciendo un vector a 0.
2.  **Consolidar Vectores Oblicuos:** Los vectores oblicuos son pares de vectores adyacentes al mismo lado del hexágono (por ejemplo, F y B son oblicuos a A). Cuando un par de vectores oblicuos está activo, resta el valor más bajo de ambos y suma ese mismo valor al vector que se encuentra entre ellos.

Después de la consolidación, una unidad no debería tener más de dos vectores activos.

### Movimiento de Unidades Específicas

*   **JumpShips:** Son esencialmente estáticos. Sus motores de fusión generan suficiente empuje para moverse de forma convencional, aunque lentamente. Pueden acumular Puntos de Empuje a lo largo de múltiples turnos para cambiar su velocidad. Sus **motores de actitud** les permiten cambiar su orientación en un lado de hexágono por turno; este movimiento no cuenta para el empuje acumulado para el cambio de velocidad.
*   **Space Stations:** Sus motores de actitud son más débiles que los de los JumpShips, proporcionando 0.2 de empuje. Acumulan empuje a lo largo de varios turnos para realizar un cambio de orientación. Las Estaciones Espaciales militares pueden cambiar 1 lado de hexágono por turno.

### Maniobras Adicionales

*   **Vectores Rotacionales:** Permiten a las unidades continuar rotando su orientación en turnos sucesivos hasta que se aplica empuje para contrarrestar la rotación.
*   **Movimiento Lateral y de Desaceleración:** Una vez por turno, una unidad puede aplicar un punto de empuje a cualquier orientación (excepto la popa) para cambiar sus vectores, lo que permite desplazamientos laterales o frenado.