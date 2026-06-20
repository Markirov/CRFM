# Construcción Aeroespacial Avanzada

Este documento detalla las reglas avanzadas para la construcción de unidades aeroespaciales como Estaciones Espaciales, Naves de Salto (JumpShips) y Naves de Guerra (WarShips), expandiendo las reglas estándar de `TechManual`. El proceso se divide en seis pasos principales, desde el diseño del chasis hasta la finalización de la hoja de registro.

## Reglas de Construcción Aeroespacial Avanzada

### Lo Básico del Diseño de Unidades Avanzadas

La construcción de unidades avanzadas se basa en tres factores principales: tipo de unidad, base tecnológica y peso.

*   **Tipo de Unidad**: Las unidades presentadas aquí (Estaciones Espaciales, Naves de Salto, Naves de Guerra) son las naves espaciales más grandes del universo BattleTech. Su construcción es similar a la de otras unidades aeroespaciales, pero agrupadas en su propia sección.
*   **Base Tecnológica**: Las unidades se construyen con base tecnológica de la Esfera Interior o de los Clanes. No se pueden construir como unidades Omni.
*   **Peso (Tonelaje)**: Se utiliza el estándar de tonelaje. Los rangos de peso legales se describen en la tabla de tipos de unidad.
*   **Espacio**: El espacio para equipamiento y armas se basa en el tipo de unidad. Las Naves de Salto tienen un límite base de 12 armas por arco. Las Estaciones Espaciales y Naves de Guerra tienen un límite de 20 armas por arco. Estos límites pueden ser extendidos.

### Paso 1: Diseñar el Chasis

#### Elegir Tipo de Unidad Aeroespacial Avanzada

| Tipo de Unidad Aeroespacial | Rango de Peso (Toneladas) | Incremento de Peso (Toneladas) | Terreno Restringido |
| :--- | :--- | :--- | :--- |
| Estaciones Espaciales | 2,000 a 2,500,000 | 500 | Cualquiera que no sea Espacio |
| Naves de Salto | 50,000 a 500,000 | 1,000 | Cualquiera que no sea Espacio |
| Naves de Guerra | 100,000 a 2,500,000 | 10,000 | Cualquiera que no sea Espacio |

#### Asignar Peso para la Integridad Estructural

*   **Estaciones Espaciales y Naves de Salto**: Pueden determinar el peso de su Integridad Estructural (SI) en este paso. Los valores de SI son fijos en 1 punto (capital) y no pueden ser cambiados.
*   **Naves de Guerra**: Solo pueden asignar peso a la Integridad Estructural después de instalar los motores.

| Tipo de Unidad Aeroespacial Avanzada | Valor de Integridad Estructural | Fórmula de Peso* |
| :--- | :--- | :--- |
| Peso de Integridad Estructural de Estación Espacial | 1 | Peso de Estación Espacial / 100 |
| Peso de Integridad Estructural de Nave de Salto | 1 | Peso de Nave de Salto / 150 |
| Peso de Integridad Estructural de Nave de Guerra | Ver Instalar Motores | Ver Instalar Motores y Sistemas de Control |

*Redondear al alza a la media tonelada más cercana.*

### Paso 2: Instalar Motores y Sistemas de Control

#### Instalar Motor

El peso del motor se determina multiplicando el peso total de la unidad por sus factores relevantes (Factor de Masa del Motor y, si es una Nave de Guerra, su Empuje Seguro deseado).

**Fórmulas de Peso del Motor de Unidad Aeroespacial Avanzada**
*   **Peso del Motor (Estación Espacial/Nave de Salto)** = Factor de Masa del Motor x Peso Total de la Unidad Aeroespacial Avanzada
*   **Peso del Motor (Naves de Guerra)** = Factor de Masa del Motor x Empuje Seguro x Peso Total de la Unidad Aeroespacial Avanzada

#### Determinar Capacidad de Combustible

Todas las unidades aeroespaciales avanzadas requieren combustible. Se debe asignar masa para el suministro de combustible. Se añade un 2% adicional del peso total del combustible para reflejar la masa de los tanques y bombas (redondeado al alza a la tonelada más cercana).

| Masa de Unidad Avanzada | Puntos de Combustible (por tonelada) | Uso Estratégico de Combustible (toneladas/día de quema)* |
| :--- | :--- | :--- |
| 2,000 a 49,999 | 10 | 2.82 |
| 50,000 a 99,999 | 10 | 9.77 |
| 100,000 a 109,999 | 10 | 19.75 |
| 110,000 a 199,999 | 5 | 19.75 |
| 200,000 a 249,000 | 5 | 39.52 |
| Más de 249,999 | 2.5 | 39.52 |

*Las Estaciones Espaciales y Naves de Salto queman una décima parte de este combustible por día para mantener la posición.*

#### Determinar Integridad Estructural (Solo Naves de Guerra)

El valor de SI de una Nave de Guerra debe ser como mínimo igual a su Empuje Máximo, pero puede aumentarse hasta 30 veces su Empuje Máximo. El peso de la SI se calcula como: `(Valor de SI x Tonelaje) / 1,000` (redondeado al alza a la media tonelada más cercana).

#### Determinar Capacidad de Salto K-F (Naves de Salto y Naves de Guerra)

Se debe instalar un motor de salto Kearny-Fuchida (K-F). Las Naves de Salto usan el motor K-F Estándar, mientras que las Naves de Guerra usan el motor K-F Compacto.

| Tipo de Unidad | Tipo de Motor K-F | Peso del Motor K-F | Integridad del Motor K-F | Masa de la Vela de Salto* |
| :--- | :--- | :--- | :--- | :--- |
| Nave de Salto | Estándar | Peso de Nave de Salto x 0.95 | 1.2 + (Peso Motor K-F / 60,000) | 30 + (Peso Nave de Salto / 7,500) |
| Nave de Guerra | Compacto | Peso de Nave de Guerra x 0.4525 | 2 + (Peso Motor K-F / 25,000) | 30 + (Peso Nave de Guerra / 20,000) |

*Integridad de la Vela de Salto = 1 + (Masa de la Vela de Salto / 20). Redondear todos los pesos y valores de integridad al alza al número entero más cercano.*

#### Añadir Sistemas de Control/Tripulación

El peso de los sistemas de control se basa en el tonelaje de la unidad. La tripulación mínima se determina por el tipo de unidad y su tonelaje, más los artilleros necesarios para las armas.

| Unidad Aeroespacial Avanzada | Peso de Sistemas de Control |
| :--- | :--- |
| Estación Espacial | Tonelaje x 0.0010* |
| Nave de Salto/Nave de Guerra | Tonelaje x 0.0025* |

*Basado en el tonelaje total de la unidad, redondear al alza a la tonelada completa más cercana.*

### Paso 3: Añadir Disipadores de Calor

Las unidades operan con un principio de "calor neto cero". Deben tener suficientes disipadores para cubrir el calor de la bahía de armas más intensiva en calor. Se recibe un número de disipadores "gratuitos" basado en el peso del motor: `45 + √(Tonelaje del Motor x 2)` (redondeado a la baja).

### Paso 4: Añadir Blindaje

El blindaje es a escala capital (1 punto = 10 puntos estándar). Las unidades reciben una cantidad de blindaje gratuito por cara basado en su valor de SI: `Valor de SI de la Unidad / 10` (redondeado normalmente).

| Peso de la Unidad (Toneladas) | Puntos por Tonelada (Esfera Interior/Clan) |
| :--- | :--- |
| 2,000 a 149,999 | 0.8 / 1.0 (Estándar) |
| 150,000 a 249,999 | 0.6 / 0.7 (Estándar) |
| 250,000 a 2,500,000 | 0.4 / 0.5 (Estándar) |

*Se aplican multiplicadores para blindajes avanzados como Ferro-Aluminio, Ferro-Carburo, etc.*

### Paso 5: Añadir Armas, Munición y Otro Equipamiento

*   **Bahías de Armas y Arcos de Disparo**: Las armas se agrupan en bahías por clase. El límite es de 700 puntos de daño estándar (70 capital) por bahía.
*   **Puertas de Bahía**: Se debe asignar un mínimo de 1 puerta de bahía para bahías de transporte. El máximo de puertas depende del tipo y peso de la unidad.
*   **Bahías de Transporte**: Ocupan el tonelaje restante. Incluyen bahías para cazas, Naves Pequeñas, 'Mechs, infantería, carga, etc.

### Paso 6: Completar la Hoja de Registro

Transfiere todas las estadísticas a la hoja de registro apropiada (Estación Espacial, Nave de Salto o Nave de Guerra). Asegúrate de que todos los valores de blindaje, integridad estructural, armas y demás equipamiento estén correctamente anotados.