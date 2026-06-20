# Reglas de Construcción de Unidades

Este documento resume las reglas para la construcción de unidades en el universo de BattleTech, divididas en Reglas Estándar (del TechManual) y Reglas Avanzadas (de Strategic Operations). Se enfoca exclusivamente en las mecánicas, fórmulas y datos numéricos, omitiendo el lore y las descripciones narrativas.

## Reglas Estándar de Construcción (TechManual)

Las reglas estándar cubren la creación de las unidades más comunes en el campo de batalla, desde BattleMechs hasta infantería convencional.

### Conceptos Básicos de Construcción

Todas las unidades estándar se construyen siguiendo estos principios fundamentales:

*   **Peso (Masa):** Las unidades se miden en toneladas (BattleMechs, vehículos) o kilogramos (Trajes de Batalla, ProtoMechs). El peso total de los componentes no puede exceder el peso objetivo del chasis.
*   **Espacio (Críticos):** La mayoría de las unidades utilizan un sistema de "espacios críticos" para representar el volumen interno. Los componentes ocupan uno o más espacios. Los BattleMechs e IndustrialMechs tienen una cantidad fija de críticos por localización. Otros tipos de unidades tienen un inventario de "ranuras de armas".
*   **Base Tecnológica:** Las unidades son del Clan o de la Esfera Interior. No se pueden mezclar componentes de diferentes bases tecnológicas (salvo los universales).
*   **Tecnología Omni:** Ciertas unidades (OmniMechs, OmniVehicles) pueden ser modulares. Tienen una configuración base fija (chasis, motor, blindaje, controles) y el resto del peso/espacio es para "OmniPods" intercambiables.
*   **Redondeo:** Las reglas de redondeo varían según el componente:
    *   **Peso:** Generalmente se redondea hacia arriba a la media tonelada más cercana.
    *   **Espacio:** Se redondea hacia arriba al número entero más cercano.
    *   **Blindaje/Estructura Interna:** Los puntos fraccionarios de blindaje se redondean hacia abajo; los de estructura interna se redondean hacia arriba.
    *   **Coste/Valor de Batalla:** Se redondea normalmente al número entero más cercano.

### Construcción de BattleMech

El proceso consta de 6 pasos:

1.  **Diseñar Chasis:**
    *   Elegir Base Tecnológica (Clan/Esfera Interior), tipo (bípedo/cuadrúpedo) y peso (20-100 toneladas en incrementos de 5).
    *   Asignar tonelaje para Estructura Interna: Estándar (10% del peso total) o Endo-Acero (5% del peso total, redondeado a la media tonelada más cercana). El Endo-Acero ocupa 14 críticos (EI) o 7 (Clan).
2.  **Instalar Motores y Controles:**
    *   **Motor:** `Ratio del Motor = Tonelaje del 'Mech x Puntos de Movimiento Andando (PMA)`. El peso y los críticos dependen del tipo (Estándar, XL, Ligero, Compacto).
    *   **Giroscopio:** `Peso Base = Ratio del Motor / 100` (redondeado hacia arriba al entero). El peso final y los críticos dependen del tipo (Estándar, XL, Compacto, Pesado).
    *   **Cabina:** Estándar (3 toneladas, 1 crítico libre) o Pequeña (2 toneladas, 2 críticos libres, +1 a las tiradas de pilotaje).
    *   **Propulsores de Salto:** El peso depende del tonelaje del 'Mech y del tipo de propulsor (Estándar o Mejorado). Cada propulsor ocupa 1 o 2 críticos.
3.  **Añadir Disipadores de Calor:** Los motores de fusión incluyen 10 disipadores. Se pueden añadir más (1 tonelada cada uno). Los Dobles pesan lo mismo pero disipan el doble de calor y ocupan más críticos (3 EI, 2 Clan).
4.  **Añadir Blindaje:** El máximo de puntos de blindaje por localización es el doble de sus puntos de Estructura Interna (excepto la cabeza, máx. 9). El peso depende del tipo de blindaje (Estándar, Ferro-Fibroso, etc.).
5.  **Añadir Armas y Equipo:** Asignar el peso y los espacios críticos restantes a armas, munición y otro equipo.
6.  **Completar la Hoja de Registro.**

### Construcción de IndustrialMech

Sigue los pasos del BattleMech con estas diferencias clave:

*   **Peso:** 10-100 toneladas.
*   **Estructura Interna:** Solo tipo Industrial Estándar, que pesa el 20% del tonelaje total del 'Mech.
*   **Motores:** Pueden usar motores de Fusión, Fisión, de Célula de Combustible o de Combustión Interna (ICE).
*   **Blindaje:** Tipos disponibles: Comercial, Industrial y Pesado Industrial.
*   **Cabina:** La cabina estándar de IndustrialMech impone un modificador de +1 a las tiradas para impactar, que puede ser eliminado con la mejora "Control de Tiro Avanzado".

### Construcción de ProtoMech

Proceso simplificado en 6 pasos, usando kilogramos:

1.  **Diseñar Chasis:**
    *   Solo Base Tecnológica del Clan. Peso de 2 a 9 toneladas (2.000-9.000 kg).
    *   Estructura Interna: 10% del peso total.
2.  **Instalar Motores y Controles:**
    *   **Motor:** `Ratio del Motor = Tonelaje del ProtoMech x Puntos de Movimiento Corriendo (PMC)`. El peso se calcula con fórmulas específicas.
    *   **Cabina:** 500 kg. No ocupa espacio de armas.
    *   **Propulsores de Salto:** El peso depende del tonelaje del ProtoMech.
3.  **Añadir Disipadores de Calor:** 250 kg por disipador. No hay disipadores dobles.
4.  **Añadir Blindaje:** Se compra punto por punto (50 kg por punto). El máximo depende del tonelaje.
5.  **Añadir Armas y Equipo:** Las armas tienen límites de peso por localización (Brazos: 500 kg, Torso: 2.000 kg, Arma Principal: sin límite).
6.  **Completar la Hoja de Registro.**

### Construcción de Vehículos de Combate

1.  **Diseñar Chasis:**
    *   Elegir Tipo de Motriz (oruga, ruedas, aerodeslizador, VTOL, etc.), que determina el tonelaje máximo.
    *   Estructura Interna: 10% del tonelaje total.
2.  **Instalar Motores y Controles:**
    *   **Motor:** `Ratio del Motor = Tonelaje del Vehículo x PM de Crucero - Factor de Suspensión`. El peso depende del tipo de motor (ICE, Fusión, etc.).
    *   Los aerodeslizadores (Hovercrafts) tienen un requisito de peso mínimo para el motor del 20% del tonelaje total.
3.  **Añadir Disipadores de Calor:** Solo si usan armas de energía. Los motores de fusión incluyen 10 disipadores gratuitos.
4.  **Añadir Blindaje:** El máximo de puntos es `(3.5 x Tonelaje del Vehículo) + 40`.
5.  **Añadir Armas y Equipo:** El número de ranuras de armas es `5 + (Tonelaje del Vehículo / 5)` (redondeado hacia abajo).
6.  **Completar la Hoja de Registro.**

### Construcción de Vehículos de Apoyo

Es un proceso más complejo que introduce **Clasificaciones de Tecnología (A-F)** que actúan como multiplicadores de coste y peso.

1.  **Diseñar Chasis:**
    *   Elegir Tipo de Motriz, Base Tecnológica y Clasificación de Tecnología Estructural.
    *   `Peso del Chasis = Valor de Chasis Base x Multiplicador de Clas. Tec. x Multiplicador(es) de Mod. de Chasis x Tonelaje Total`.
2.  **Instalar Motores y Controles:**
    *   `Peso del Motor = Valor de Motor Base x Factor de Movimiento x Multiplicador de Peso de Motor x Tonelaje Total`.
    *   Se calcula la capacidad de combustible si el motor no es de fusión/fisión/solar.
3.  **Añadir Disipadores de Calor:** No hay disipadores gratuitos. 1 tonelada por disipador.
4.  **Añadir Blindaje:** El máximo de puntos depende del tipo de motriz. El peso depende de la Clasificación Tecnológica y el **Nivel de Blindaje de Barrera (BAR)**.
5.  **Añadir Armas y Equipo:** El número de ranuras es `5 + (Tonelaje del Vehículo / 10)` (redondeado hacia abajo).
6.  **Completar la Hoja de Registro.**

### Construcción de Infantería Convencional

No se basa en el tonelaje, sino en el número de soldados y su equipo.

1.  **Establecer Tipo de Pelotón:**
    *   Elegir Tipo de Motriz (a pie, motorizado, de salto, mecanizado), que define el MP y el tamaño máximo del pelotón.
    *   Elegir Base Tecnológica (afiliación) y tamaño (número de soldados por escuadra y escuadras por pelotón).
2.  **Establecer Armamento del Pelotón:**
    *   Elegir un arma primaria (Estándar o Cuerpo a Cuerpo) para todos los soldados.
    *   Opcionalmente, elegir hasta 2 armas de apoyo (Secundarias) por escuadra.
    *   Calcular el Alcance y Daño final del pelotón basándose en la combinación de armas.
3.  **Completar la Hoja de Registro:** Se calcula el peso total del pelotón solo para fines de transporte.

### Construcción de Trajes de Batalla (Battle Armor)

1.  **Diseñar Chasis:**
    *   Elegir Base Tecnológica, Clase de Peso (Exoesqueleto, Ligero, Medio, Pesado, Asalto) y tipo (humanoide/cuadrúpedo).
    *   El peso del chasis y las ranuras de armas disponibles dependen de estos factores.
2.  **Instalar Sistemas Motrices:**
    *   Cada clase de peso tiene un PM Terrestre mínimo gratuito y un máximo. Se puede añadir más PM pagando peso.
    *   Se pueden añadir sistemas no terrestres (propulsores de salto, VTOL, UMU).
3.  **Añadir Manipuladores:** Determina la capacidad de realizar ataques anti-'Mech (Enjambre/Pierna) y de usar las reglas de Infantería Mecanizada.
4.  **Añadir Blindaje:** Se compra punto por punto. El peso por punto y el máximo de puntos dependen del tipo de blindaje y la clase de peso del traje.
5.  **Añadir Armas y Equipo:** Asignar el peso y las ranuras de armas restantes.
6.  **Completar la Hoja de Registro.**

### Construcción de Unidades Aeroespaciales (Estándar)

Cubre cazas Convencionales y Aeroespaciales.

1.  **Diseñar Chasis:**
    *   Elegir Tipo de Unidad (Caza Convencional/Aeroespacial), que define el rango de peso y si puede operar en el espacio.
2.  **Instalar Motores y Controles:**
    *   **Empuje (Thrust):** Se elige un Empuje Seguro (Safe Thrust). `Empuje Máximo = Empuje Seguro x 1.5` (redondeado hacia arriba).
    *   **Motor:** El peso se basa en el Ratio del Motor, que se calcula de forma diferente para cazas convencionales y aeroespaciales.
    *   **Integridad Estructural (SI):** `SI = mayor de (Empuje Seguro o 10% del Tonelaje)`.
    *   **Capacidad de Combustible:** Se asigna tonelaje al combustible.
3.  **Añadir Blindaje:** El máximo de puntos de blindaje es `Tonelaje x 8` (cazas aero) o `Tonelaje x 1` (cazas conv.).
4.  **Añadir Disipadores de Calor:** Los cazas aeroespaciales tienen un requisito mínimo de 10 disipadores (que vienen con el motor). Los cazas convencionales solo necesitan disipadores para armas de energía.
5.  **Añadir Armas y Equipo:** Los cazas tienen un límite de 5 armas por arco (Nariz, Ala Izquierda, Ala Derecha, Popa).
6.  **Completar la Hoja de Registro.**

## Reglas Avanzadas de Construcción Aeroespacial (Strategic Operations)

Estas reglas cubren la creación de las unidades más grandes: Estaciones Espaciales, Naves de Salto (JumpShips) y Naves de Guerra (WarShips).

### Conceptos Básicos Avanzados

*   **Unidades:** Estación Espacial, Nave de Salto, Nave de Guerra.
*   **Peso:** Rangos de tonelaje masivos, medidos en incrementos de 500, 1.000 o 10.000 toneladas.
*   **Integridad Estructural (SI):** Se mide a escala capital (1 punto de SI capital = 10 puntos de SI estándar). El peso de la SI depende del tipo de unidad.
*   **Blindaje a Escala Capital:** El blindaje también se mide a escala capital. El máximo de blindaje depende de la masa de la SI.

### Proceso de Construcción de Unidades Aeroespaciales Avanzadas

1.  **Diseñar Chasis:**
    *   Elegir Tipo de Unidad, Base Tecnológica y Peso.
    *   **Naves de Salto y Estaciones:** La SI es fija (1 punto). El peso de la SI se calcula: `Peso de SI = Tonelaje / 100` (Estaciones) o `Tonelaje / 150` (Naves de Salto).
2.  **Instalar Motores y Controles:**
    *   **Motor:** El peso depende del tipo de unidad y del Empuje Seguro (solo para Naves de Guerra). Las Estaciones y Naves de Salto tienen motores de mantenimiento de posición fijos.
    *   **Capacidad de Salto K-F (Naves de Salto/Guerra):** Se calcula el peso del Núcleo K-F, la Vela de Salto y su Integridad. El tipo de núcleo (Estándar/Compacto) es crucial.
    *   **Integridad Estructural (Naves de Guerra):** `SI Mínima = Empuje Máximo`. `Peso de SI = (SI x Tonelaje) / 1000`.
    *   **Sistemas de Control y Tripulación:** El peso se basa en el tonelaje de la nave. Se deben asignar alojamientos para toda la tripulación.
3.  **Añadir Disipadores de Calor:** El número de disipadores gratuitos se calcula con la fórmula: `45 + √(Tonelaje del Motor x 2)`.
4.  **Añadir Blindaje:** Se añade blindaje a escala capital. La nave recibe puntos de blindaje gratuitos por cada punto de SI (`Puntos de Blindaje Gratuitos = SI / 10`).
5.  **Añadir Armas y Equipo:**
    *   Las armas se agrupan en bahías por clase (Láser, PPC, Misil Capital, etc.).
    *   Límite de daño por bahía: 700 puntos de daño estándar (70 capital).
    *   Se pueden añadir bahías de transporte (para cazas, 'Mechs, etc.), collares de anclaje, y otros sistemas avanzados.
6.  **Completar la Hoja de Registro.**