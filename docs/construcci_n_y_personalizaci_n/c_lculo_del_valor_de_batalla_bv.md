# Cálculo del Valor de Batalla (BV)

El Valor de Batalla (Battle Value o BV) es un sistema de puntos que representa las capacidades y la supervivencia de cada unidad de BattleTech. Su propósito es permitir a los jugadores crear batallas equilibradas. El cálculo del BV final de una unidad se obtiene sumando su Valor de Batalla Defensivo (DBR) y su Valor de Batalla Ofensivo (OBR).

## Reglas Estándar (TechManual)

Estas reglas se aplican a 'Mechs, ProtoMechs, Vehículos, Infantería Convencional, Blindaje de Batalla y unidades Aeroespaciales estándar.

### Cálculo del BV para 'Mechs e IndustrialMechs

**Paso 1: Calcular el Valor de Batalla Defensivo (DBR)**

1.  **Sumar los siguientes valores:**
    *   Puntos Totales de Blindaje x 2.5 x Modificador de Tipo de Blindaje.
    *   Puntos Totales de Estructura Interna x 1.5 x Modificador de Tipo de Estructura Interna x Modificador de Tipo de Motor.
    *   Tonelaje del Giroscopio x Modificador de Tipo de Giroscopio.
    *   BV total de todo el Equipo Defensivo (Sondas Activas, Sistemas Anti-Misiles, Módulos ECM, etc.).

2.  **Restar las siguientes penalizaciones (el total no puede ser inferior a 1):**
    *   15 puntos por cada espacio crítico de munición explosiva en el torso central, piernas o cabeza (solo 'Mechs del Clan).
    *   15 puntos por cada espacio crítico de munición explosiva en cualquier localización (solo 'Mechs de la Esfera Interior con motor XL).
    *   15 puntos por cada espacio crítico de munición explosiva en el torso central, piernas, cabeza, o en una localización sin CASE ('Mechs de la Esfera Interior con motores Estándar o Ligeros).
    *   15 puntos por cada espacio crítico de munición explosiva en un brazo sin CASE, o en la localización adyacente interior en el Diagrama de Transferencia de Daño.
    *   1 punto por cada espacio crítico de arma Gauss en las localizaciones mencionadas anteriormente, según la facción y tipo de motor.

3.  **Calcular el DBR Final:** Multiplicar el total por el Factor Defensivo del 'Mech. Este factor se basa en el modificador de objetivo más alto posible de la unidad (por movimiento, salto, MASC, TSM, blindaje especial, etc.).

**Paso 2: Calcular el Valor de Batalla Ofensivo (OBR)**

1.  **Calcular el BV Modificado de cada Arma:** Se toma el BV base del arma y su munición y se aplican modificadores por sistemas como Artemis IV (+20% al BV del lanzador) o Computador de Puntería (BV del arma x 1.25).

2.  **Determinar la Eficiencia de Calor y el Calor Total de Armas:**
    *   **Eficiencia de Calor del 'Mech** = 6 + Capacidad de Disipadores de Calor – Calor por Movimiento.
    *   **Calor Total de Armas** = Suma del calor de todas las armas ofensivas si se disparan a la vez.

3.  **Calcular el Valor de Batalla de Armas (Weapon Battle Rating):**
    *   Si el Calor Total de Armas es menor o igual a la Eficiencia de Calor, el Valor de Batalla de Armas es la suma del BV modificado de todas las armas, municiones y el tonelaje del 'Mech.
    *   Si el Calor Total de Armas es mayor, se suman los BV de las armas en orden descendente de BV, añadiendo su calor a un total acumulado. La primera arma que iguala o excede la Eficiencia de Calor se añade con su BV completo. Todas las armas restantes se añaden con la mitad de su BV modificado.

4.  **Calcular el OBR Final:** Multiplicar el Valor de Batalla de Armas por el Factor de Velocidad de la unidad. El Factor de Velocidad se determina sumando el MP de Carrera (Running) y la mitad del MP de Salto (Jumping) (redondeado hacia arriba).

**Paso 3: Calcular el Valor de Batalla Final**

*   **BV Final** = Valor de Batalla Defensivo + Valor de Batalla Ofensivo (redondeado al entero más cercano).
*   Si el 'Mech tiene una cabina pequeña (Small Cockpit), se multiplica el total por 0.95.

### Cálculo del BV para otras Unidades

*   **ProtoMech:** Sigue un proceso similar al de los 'Mechs, pero con fórmulas y modificadores específicos. El Factor Defensivo añade un +0.1. El Factor de Velocidad añade +1 si tiene un Myomer Booster.
*   **Vehículos (Combate y Apoyo):** Proceso similar, pero el DBR se multiplica por un Modificador de Tipo de Unidad (Tracked, Wheeled, Hover, etc.). Los Vehículos de Apoyo multiplican su blindaje por (BAR / 10).
*   **Infantería Convencional:**
    *   DBR = (Número de Soldados x 1.5) x Factor Defensivo.
    *   OBR = Valor de Batalla de Armas x Factor de Velocidad.
*   **Blindaje de Batalla (Battle Armor):**
    *   DBR = ((Puntos de Blindaje x BV de Blindaje) + 1) x Factor Defensivo. El Factor Defensivo base añade +0.1.
    *   OBR = Valor de Batalla de Armas x Factor de Velocidad.
    *   El BV final de un traje se multiplica por un modificador según el tamaño de la escuadra.
*   **Unidades Aeroespaciales:**
    *   DBR = ((Factor de Blindaje x 2.5) + (Integridad Estructural x 2.0) + BV Equipo Defensivo - Penalizaciones) x Modificador de Tipo de Unidad.
    *   OBR = Valor de Batalla de Armas x Factor de Velocidad (basado en el Empuje Máximo).

### Tablas y Modificadores (Estándar)

**Modificadores de Tipo de Blindaje ('Mech)**

| Tipo de Blindaje | Modificador |
| :--- | :--- |
| Estándar | 1.0 |
| Ferro-Fibroso (Todos) | 1.0 |
| Industrial | 1.0 |
| Industrial Pesado | 1.0 |
| Comercial | 0.5 |
| Stealth | 1.0 |

**Modificadores de Estructura Interna ('Mech)**

| Tipo de Estructura | Modificador |
| :--- | :--- |
| Estándar | 1.0 |
| Endo-Acero | 1.0 |
| Industrial | 0.5 |

**Modificadores de Tipo de Motor ('Mech)**

| Tipo de Motor | Modificador |
| :--- | :--- |
| Estándar* | 1.0 |
| Ligero | 0.75 |
| Compacto | 1.0 |
| XL (Esfera Interior) | 0.5 |
| XL (Clan) | 0.75 |

*Incluye ICE, Célula de Combustible y Fisión

**Modificadores de Tipo de Giroscopio ('Mech)**

| Tipo de Giroscopio | Modificador |
| :--- | :--- |
| Estándar | 0.5 |
| Compacto | 0.5 |
| Extraligero (XL) | 0.5 |
| Pesado (Heavy-Duty) | 1.0 |

**Tabla de Factores Defensivos**

| Modificador de Objetivo* | Factor Defensivo |
| :--- | :--- |
| +0 | 1.0 |
| +1 | 1.1 |
| +2 | 1.2 |
| +3 | 1.3 |
| +4 | 1.4 |
| +5 y superior | 1 + (modificador / 10) |

**Modificador de Factor Defensivo**

| Caso Especial | Modificador |
| :--- | :--- |
| ProtoMech | +0.1 |
| Blindaje de Batalla | +0.1 |
| Blindaje de Batalla (Camo) | +0.2 |
| Blindaje de Batalla (Stealth Básico) | +0.2 |
| Blindaje de Batalla (Stealth Prototipo) | +0.2 |
| Blindaje de Batalla (Stealth Estándar) | +0.2 |
| Blindaje de Batalla (Stealth Mejorado) | +0.3 |
| Blindaje de Batalla (Mimético) | +0.3 |

**Modificadores de Tipo de Unidad (Vehículos)**

| Tipo | Modificador |
| :--- | :--- |
| Oruga (Tracked) | 0.9 |
| Ruedas (Wheeled) | 0.8 |
| Aerodeslizador (Hover) | 0.7 |
| Naval | 0.6 |
| VTOL | 0.7 |
| Dirigible (Airship) | 0.7 |
| Ala Fija (Fixed-Wing) | 1.0 |
| WiGE | 0.7 |

## Reglas Avanzadas (Strategic Operations)

Estas reglas se aplican a Naves de Salto, Naves de Guerra y Estaciones Espaciales.

### Cálculo del BV de Unidades Aeroespaciales Avanzadas

Siguen el mismo proceso básico de DBR + OBR, pero con modificadores específicos para su escala.

*   **Valor de Batalla Defensivo (DBR):**
    *   El Factor de Blindaje a escala capital se multiplica por **25** (en lugar de 2.5).
    *   La Integridad Estructural a escala capital se multiplica por **20** (en lugar de 2.0).
    *   Se aplica un Modificador de Tipo de Unidad específico (ver tabla abajo).

*   **Valor de Batalla Ofensivo (OBR):**
    *   El cálculo se basa en arcos de fuego, no en armas individuales. Se determina el BV de cada arco.
    *   El arco con el BV más alto se considera el "frontal" y se calcula al 100% de su valor, incluso si excede la Eficiencia de Calor.
    *   Los arcos adyacentes se añaden secuencialmente, reduciendo su BV al 50% o 25% si la capacidad de disipación de calor se va superando.
    *   Los arcos restantes se añaden al 25% de su BV.
    *   El Factor de Velocidad para **Estaciones Espaciales** se basa en un Empuje Máximo de 0. Para **Naves de Salto**, se basa en un Empuje Máximo de 1.

### Modificadores de Tipo de Unidad (Avanzado)

| Tipo | Modificador |
| :--- | :--- |
| Nave de Salto (JumpShip) | 0.75 |
| Nave de Guerra (WarShip) | 0.8 |
| Estación Espacial (Space Station) | 0.7 |
