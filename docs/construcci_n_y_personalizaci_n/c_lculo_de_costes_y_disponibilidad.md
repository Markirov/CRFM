# Cálculo de Costes y Disponibilidad

Este documento detalla las reglas para calcular el coste en C-bills y la disponibilidad de las unidades en BattleTech, basándose en los manuales **TechManual** (reglas estándar) y **Strategic Operations** (reglas avanzadas).

El **coste** de una unidad se calcula sumando los costes de sus componentes estructurales (chasis, motor, etc.) y su equipo/armamento, y luego aplicando multiplicadores finales según el tipo de unidad. La **disponibilidad** determina en qué era del juego una unidad o componente puede ser construido, usando un sistema de calificación por letras y fechas de introducción/extinción.

## Reglas Estándar (TechManual)

### Cálculo de Costes Básicos

El coste de una unidad en C-bills refleja los recursos de fabricación necesarios. El proceso general es:
1.  Sumar los costes de todos los **componentes estructurales** (chasis, motor, controles, blindaje, etc.).
2.  Sumar los costes de todas las **armas y equipo** adicional.
3.  Aplicar los **multiplicadores de coste final** basados en el tipo y peso de la unidad.

**Fórmulas de Componentes**: A menudo, el coste de un componente se calcula con una sub-fórmula (ej: `Coste del Motor = (Valor Base x Rating del Motor x Tonelaje del 'Mech) / 75`).

**Redondeo**: Todos los costes no deben redondearse hasta el final del proceso. El coste final se redondea hacia arriba al **0.01 C-bill** más cercano.

#### Costes Estructurales

Se determinan usando tablas específicas para cada tipo de unidad ('Mech, Vehículo, etc.), sumando el coste de todos los componentes base como cabina, sensores, soporte vital, estructura interna, actuadores, motor, giroscopio, reactores y blindaje.

#### Costes de Armas y Equipo

Se suman los costes de todas las armas, munición y otro equipo instalado. Estos costes se añaden al total de los costes estructurales.

*   **Excepción Especial**: Los cuartos para tripulación/pasajeros y las bahías/compartimentos de infantería en **unidades aeroespaciales avanzadas** (JumpShips, WarShips, Space Stations) y **vehículos de apoyo** (solo los que no requieren peso adicional) son gratuitos.
*   **Unidades Omni**: Se debe calcular primero el coste del diseño base (descargado). El coste de cada configuración se calcula después, usando el coste de la estructura base y las armas de esa configuración como punto de partida.

#### Costes Finales de Unidad

Una vez sumados los costes estructurales y de equipo, se aplica una fórmula final que depende del tipo de unidad.

| Tipo de Unidad | Fórmula de Coste Final |
| :--- | :--- |
| **BattleMechs** | (Coste Estructural + Coste Armas/Equipo) x (Coste de Conversión Omni*) x (1 + [Tonelaje Total / 100]) |
| **IndustrialMechs** | (Coste Estructural + Coste Armas/Equipo) x (1 + [Tonelaje Total / 400]) |
| **ProtoMechs** | (Coste Estructural + Coste Armas/Equipo) x (1 + [Tonelaje Total / 100]) |
| **Vehículos de Combate** | (Coste Estructural + Coste Armas/Equipo) x (Coste de Conversión Omni*) x (1 + [Factor de Tonelaje])** |
| **Vehículos de Apoyo** | (Coste Estructural + Coste Armas/Equipo) x (Coste de Conversión Omni*) x (1 + [Factor de Tonelaje])** |
| **Battle Armor** | (Coste Estructural + Coste Armas/Equipo + Coste de Entrenamiento***) x (Nº de Tropas por Escuadra/Punto) |
| **Cazas Convencionales** | (Coste Estructural + Coste Armas/Equipo) x (1 + [Tonelaje Total / 200]) |
| **Cazas Aeroespaciales** | (Coste Estructural + Coste Armas/Equipo) x (Coste de Conversión Omni*) x (1 + [Tonelaje Total / 200]) |
| **Naves Pequeñas** | (Coste Estructural + Coste Armas/Equipo) x (1 + [Tonelaje Total / 50]) |
| **Naves de Descenso Esferoides** | (Coste Estructural + Coste Armas/Equipo) x 28 |
| **Naves de Descenso Aerodinas** | (Coste Estructural + Coste Armas/Equipo) x 36 |

*   *Coste de Conversión Omni = 1.25; si la unidad no es Omni, el valor es 1.*
*   **El Factor de Tonelaje varía según el tipo de vehículo (ej: Orugas: /100, Ruedas: /200, Hover: /50).*
*   ***Coste de Entrenamiento = 150,000 para tropas de la Esfera Interior; 200,000 para tropas del Clan.***

### Disponibilidad

La disponibilidad determina el período de tiempo en el que una unidad puede ser construida. Se expresa mediante una **Calificación de Disponibilidad** y **fechas de introducción/extinción**.

#### Calificaciones de Disponibilidad

Es un código de tres letras que define la disponibilidad general de un objeto en tres eras principales: **Era de la Guerra/Liga Estelar** (hasta 2800), **Guerras de Sucesión** (2801-3050) e **Invasión de los Clanes** (3051 en adelante).

| Código | Disponibilidad |
| :--- | :--- |
| A | Muy Común |
| B | Común |
| C | Poco Común |
| D | Raro |
| E | Muy Raro |
| F | Único |
| X | El objeto no existe en esta era |

**Calificaciones para Clanes**: Se aplican directrices especiales para unidades del Clan:
1.  Los Clanes no existían en la era de la Liga Estelar, por lo que se usan dos períodos: Guerras de Sucesión e Invasión de los Clanes.
2.  El primer código de disponibilidad (Era de la Liga Estelar) se usa en lugar del segundo (Guerras de Sucesión).
3.  Si el objeto es tecnología militar, el código se reduce en un nivel (hasta un mínimo de A).
4.  Si un objeto tiene un año de extinción para el Clan, la disponibilidad se incrementa en dos niveles (máximo F) para períodos posteriores.
5.  Objetos introducidos en una era donde no existían en la Esfera Interior reciben una calificación de D para esa era, bajando a C en la siguiente.

#### Fechas de Introducción y Extinción

Estas fechas son absolutas y prevalecen sobre la Calificación de Disponibilidad. Una unidad no puede ser construida antes de su fecha de introducción. Las unidades que usan tecnologías "extintas" solo pueden construirse como modelos únicos personalizados.

*   **Unidades de Era Tardía**: Unidades que debutan en los últimos 20-50 años de una era pueden tener su disponibilidad reducida (calificación de letra aumentada en 1 o 2 niveles).

#### Disponibilidad Final de una Unidad

La disponibilidad final de una unidad se determina por su fecha de introducción y los códigos de disponibilidad más altos (más raros) de todos sus componentes en cada era.

## Reglas Avanzadas (Strategic Operations)

### Cálculo de Costes de Unidades Aeroespaciales Avanzadas

Estas reglas se aplican a **JumpShips, WarShips y Space Stations**.

#### Costes Estructurales y de Equipo

Se utilizan tablas específicas que detallan los costes de componentes como el Motor K-F, la Vela de Salto, sistemas de soporte vital, etc. Los costes se calculan de forma similar a las reglas estándar, sumando todos los componentes.

#### Costes Finales de Unidad

| Tipo de Unidad | Fórmula de Coste Final |
| :--- | :--- |
| **JumpShips** | (Costes Estructurales + Costes de Armas/Equipo) x 1.25 |
| **WarShips** | (Costes Estructurales + Costes de Armas/Equipo) x 2 |
| **Space Stations** | (Costes Estructurales + Costes de Armas/Equipo) x 5 |
