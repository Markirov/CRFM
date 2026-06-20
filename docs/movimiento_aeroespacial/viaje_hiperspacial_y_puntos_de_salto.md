# Viaje Hiperspacial y Puntos de Salto

Este documento resume las reglas para el viaje hiperespacial y los puntos de salto en BattleTech, extrayendo información de los manuales *Total Warfare* y *Strategic Operations*. El viaje hiperespacial permite a las naves con Motores Kearny-Fuchida (K-F) viajar instantáneamente entre sistemas estelares, hasta un máximo de 30 años luz. Para realizar un salto seguro, la nave debe estar en un "Punto de Salto", una zona con mínimas influencias gravitacionales. Las reglas detallan los tipos de puntos de salto, cómo cargar el motor K-F, cómo calcular la ruta de salto y los riesgos asociados con el proceso.

## Reglas Estándar (Total Warfare)

El manual *Total Warfare* se centra en el combate táctico dentro de un sistema estelar (espacial y atmosférico). No contiene reglas mecánicas detalladas para el viaje hiperespacial o los puntos de salto. Estas reglas se encuentran en manuales avanzados como *Strategic Operations*.

## Reglas Avanzadas (Strategic Operations)

### Puntos de Salto (Fuera del Juego)

Para realizar un salto, una unidad debe estar en una zona libre de influencias gravitacionales significativas. Los puntos de salto más comunes son el **Zenith** y el **Nadir** del pozo de gravedad de una estrella.

*   **Puntos de Proximidad:** Cualquier punto en la esfera del límite de proximidad de una estrella. La distancia se determina por el tipo de estrella.
*   **Puntos de Salto Estándar (Zenith/Nadir):** Puntos de salto situados "sobre" y "debajo" de los polos de la estrella, perpendiculares al plano de la eclíptica del sistema. Simplifican los cálculos de navegación.
*   **Puntos de Salto No Estándar (Lagrange):** Puntos donde las fuerzas gravitacionales de dos cuerpos (ej. planeta y luna) se cancelan. Son más difíciles de calcular.
*   **Puntos Transitorios:** Puntos de salto temporales, a menudo cerca de puntos de Lagrange, que aparecen y desaparecen. Son difíciles de usar sin una planificación avanzada.

**Tabla de Distancia al Punto de Proximidad (en miles de millones de km)**

| Tipo de Estrella | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| B | 347.84 | 282.07 | 229.40 | 187.12 | 153.06 | 125.56 | 103.29 | 85.20 | 70.47 | 58.44 |
| A | 48.56 | 40.51 | 33.85 | 28.36 | 23.82 | 20.06 | 19.63 | 14.32 | 12.15 | 10.32 |
| F | 8.80 | 7.51 | 6.43 | 5.51 | 4.74 | 4.08 | 3.52 | 3.04 | 2.64 | 2.29 |
| G | 1.99 | 1.74 | 1.52 | 1.33 | 1.16 | 1.02 | 0.90 | 0.79 | 0.70 | 0.62 |
| K | 0.55 | 0.49 | 0.43 | 0.39 | 0.34 | 0.31 | 0.28 | 0.25 | 0.22 | 0.20 |
| M | 0.18 | 0.16 | 0.15 | 0.13 | 0.12 | 0.11 | 0.10 | 0.09 | 0.08 | 0.07 |

**Tabla de Distancia a Puntos de Salto Zenith/Nadir (en días, asumiendo 1G de aceleración)**

| Tipo de Estrella | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| B | 137.91 | 124.19 | 112.00 | 101.15 | 91.48 | 82.86 | 75.15 | 68.25 | 62.07 | 56.53 |
| A | 51.51 | 47.06 | 43.02 | 39.38 | 36.09 | 33.12 | 32.76 | 27.98 | 25.77 | 23.75 |
| F | 21.94 | 20.26 | 18.75 | 17.36 | 16.10 | 14.94 | 13.87 | 12.89 | 12.01 | 11.19 |
| G | 10.43 | 9.75 | 9.12 | 8.53 | 7.96 | 7.47 | 7.01 | 6.57 | 6.19 | 5.82 |
| K | 5.48 | 5.18 | 4.85 | 4.62 | 4.31 | 4.12 | 3.91 | 3.70 | 3.47 | 3.31 |
| M | 3.14 | 2.96 | 2.86 | 2.67 | 2.56 | 2.45 | 2.34 | 2.22 | 2.09 | 1.96 |

### Carga del Motor (Fuera del Juego)

*   **Vela de Salto:** La recarga estándar. El tiempo depende del tipo de estrella. El tiempo se incrementa un 10% por cada punto de daño a la Integridad de la Vela.
*   **Planta de Energía:** Se puede usar la planta de energía de la nave para recargar. Requiere 10 días de combustible. Cada punto de MoS en una tirada de Control reduce el consumo en 0.5 días de combustible (mínimo 4). Cada punto de MoF lo aumenta en 0.5.
*   **Carga Rápida:** Intentar recargar en menos de 175 horas puede dañar el motor. Se requiere una tirada de Control con modificadores según el tiempo. Un fallo resulta en una tirada en la Tabla de Fallo de Carga Rápida.
*   **Baterías de Litio-Fusión (LF):** Permiten un segundo salto. Se cargan como un motor K-F. Una carga rápida fallida que indique una reducción de Integridad del Motor K-F destruye la batería.

**Tabla de Recarga con Vela de Salto (en horas)**

| Tipo de Estrella | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 209 | 210 |
| K | 191 | 192 | 193 | 194 | 195 | 196 | 197 | 198 | 199 | 200 |
| G | 181 | 182 | 183 | 184 | 185 | 186 | 187 | 188 | 189 | 190 |
| F | 171 | 172 | 173 | 174 | 175 | 176 | 177 | 178 | 179 | 180 |
| A | 161 | 162 | 163 | 164 | 165 | 166 | 167 | 168 | 169 | 170 |
| B | 151 | 152 | 153 | 154 | 155 | 156 | 157 | 158 | 159 | 160 |

### Cálculos de Salto (Durante el Juego)

Para calcular una ruta de salto, se realiza una tirada de Control con un modificador de +2, más los modificadores de la Tabla de Navegación Hiperespacial. El MoS de la tirada determina el tiempo necesario para el cálculo.

**Tabla de Navegación Hiperespacial**

| Situación | Modificador |
| :--- | :--- |
| Cálculos sin computadora de navegación | +2 |
| Nave en movimiento predecible | +1 |
| Nave fuera de control | +3 |
| Destino es punto Zenith o Nadir | +0 |
| Destino es punto no estándar | +4 |
| Destino es punto transitorio | +4 |
| Origen es punto Zenith o Nadir | 0 |
| Origen es punto no estándar (Lagrange) | +2 |
| Origen es punto transitorio | +2 |

**Tabla de Cálculo de Salto**

| Objetivo | Método de Cálculo |
| :--- | :--- |
| Zenith o Nadir | Con computadora: (2D6 – MoS) x 10 minutos |
| | Sin computadora: (2D6 – MoS) horas |
| No estándar | Con computadora: (2D6 – MoS) x 30 minutos |
| | Sin computadora: Imposible |
| Otros | Si la unidad se está moviendo: Tiempo base x 1.1 |

### Realizar un Salto (Durante el Juego)

*   **Declaración:** Se declara en la Fase de Iniciativa. La nave debe tener coordenadas trazadas y no haber gastado empuje desde entonces.
*   **Ejecución:** El salto ocurre en la Fase Final del siguiente turno. La unidad se retira del mapa.
*   **Daño a Unidades Cercanas:** Abrir un agujero al hiperespacio causa estrés en objetos cercanos. Todas las unidades en el mismo hexágono o adyacente a una unidad que salta (o llega) deben hacer una tirada de Control. Un fallo indica que reciben (MoF x 2D6) puntos de daño a escala capital en cada localización de blindaje.
*   **Distancia Mínima de Salto:** No hay una distancia mínima, pero saltar al mismo hexágono o a uno adyacente es extremadamente peligroso y se trata como si la propia nave estuviera en el radio de efecto de su propio salto.