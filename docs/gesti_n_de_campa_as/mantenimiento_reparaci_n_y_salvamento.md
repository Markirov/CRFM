# Mantenimiento, Reparación y Salvamento

Este documento resume las reglas para el mantenimiento, reparación y salvamento de unidades en una campaña de BattleTech, extraídas del manual 'Campaign Operations'. Cubre desde el mantenimiento rutinario para evitar el deterioro del equipo, hasta la reparación de daños de batalla, la obtención de piezas de repuesto y el salvamento de unidades caídas en combate.

## Reglas Generales y Opcionales

### Ciclo de Mantenimiento/Reparación
*   **Duración Estándar:** A menos que se acuerde lo contrario, los jugadores disponen de **ocho horas** entre cada escenario para realizar mantenimiento y reparaciones. En una campaña con seguimiento de tiempo, cada día proporciona ocho horas de trabajo productivo.
*   **Horas Extra:** Un Equipo Técnico puede trabajar 8 horas adicionales al día, pero esto solo proporciona 4 horas adicionales de trabajo productivo.

### Tiradas de Habilidad
Las tiradas de habilidad son tiradas de 2D6 o 3D6 contra un número objetivo basado en la **Experiencia** del equipo Técnico o Médico, modificado por la situación. Los tipos de tiradas incluyen:
*   **Tirada de Mantenimiento**
*   **Tirada de Reemplazo**
*   **Tirada de Reparación**
*   **Tirada de Herido** (para chequeos médicos)

### Calidad de la Unidad
La Calidad de la Unidad indica la condición de cada unidad. Comienza basada en su facción y era de construcción, y cambia debido al desgaste, daño y mantenimiento.

**Tabla de Calidad de Unidad**

| Calidad | Descripción | Mod. de Coste | Notas |
| :--- | :--- | :--- | :--- |
| A | Salvage | 0.8 | - |
| B | Pobre | 0.9 | Estados Menores de la Periferia |
| C | Regular | 0.95 | Guerras de Sucesión Tardías |
| D | Promedio | 1.0 | Guerras de Sucesión Tempranas, Era de la Guerra, Post-Guerras de Sucesión IS |
| E | Buena | 1.1 | Estados Miembros de la Star League, ComStar, Word of Blake |
| F | Excelente | 1.3 | Clan, Hegemonía Terrana |

## Personal de Apoyo
El personal de apoyo se divide en **Técnicos** y **Médicos**, con una Calificación de Experiencia por defecto de **Regular**.

*   **Equipos Técnicos:** Un equipo completo consta de 1 técnico y 6 asistentes (astechs). Se especializan en un tipo de unidad ('Mech, Vehículo, Aeroespacial, Battle Armor). Para trabajar en otros tipos de unidades, deben tirar 3D6 y usar los dos dados más bajos.
*   **Equipos Médicos:** Un equipo consta de 1 doctor y 4 asistentes (médicos y enfermeros).

**Tabla de Experiencia del Personal de Apoyo**

| Experiencia | Objetivo de Habilidad Base (Técnico) | Objetivo de Habilidad Base (Médico) | Habilidades de Combate (Artillería) | Habilidades de Combate (Anti-'Mech) |
| :--- | :--- | :--- | :--- | :--- |
| Green | 8+ | 10+ | 7 | 8/* |
| Regular | 6+ | 8+ | 7 | 7/* |
| Veteran | 5+ | 7+ | 6 | 6/* |
| Elite | 3+ | 6+ | 6 | 5/* |

*Un Equipo Médico puede atacar como una escuadra de infantería a pie (rifle, balístico); no puede realizar ataques Anti-'Mech.*

## Mantenimiento
El mantenimiento preventivo es crucial para evitar la degradación de la Calidad de la Unidad. Se realiza una **Tirada de Mantenimiento** (2D6) por cada unidad activa entre batallas.

*   **Frecuencia:** Cada semana en el campo, o cada cuatro semanas en condiciones de guarnición.
*   **Fallo:** Un fallo en la tirada de mantenimiento resulta en una tirada en la tabla de estado de daño correspondiente para determinar el desperfecto.
*   **Unidades Desatendidas:** Si una unidad no tiene un equipo técnico asignado, la tirada de mantenimiento usa un Número Objetivo (NO) base de 10.

### Reglas Opcionales de Mantenimiento
*   **Mantenimiento Avanzado:** Se realiza una tirada de mantenimiento individual para cada componente de la unidad (armas, giroscopio, blindaje, etc.) con un modificador de -1 al NO. Un fallo daña ese componente específico.
*   **Unidades en Reserva (Mothballs):** Las unidades pueden ser puestas en reserva para evitar la necesidad de mantenimiento. Este proceso requiere un Equipo Técnico completo y dura dos Ciclos de Mantenimiento/Reparación. Sacar una unidad de la reserva requiere un ciclo.

## Reparación y Reemplazo

### Diagnóstico
Antes de reparar, se debe determinar el estado de los componentes.
*   **Destruido vs. Realmente Destruido:** Una unidad "destruida" en un escenario (p. ej., por pérdida de una pierna) a menudo puede ser reparada. Una unidad "realmente destruida" (p. ej., por destrucción de la estructura interna del torso central) no puede ser devuelta al servicio.
*   **Componentes Específicos:** Las reglas detallan qué se puede reparar y qué se debe reemplazar para 'Mechs, ProtoMechs, vehículos, etc. (p. ej., un brazo de 'Mech volado puede ser reinsertado si se recupera; un torso central destruido no).

### Obtención de Piezas de Repuesto
Se debe realizar una **Tirada de Disponibilidad** para encontrar piezas antes de poder instalarlas. El NO se basa en la habilidad del equipo técnico, modificado por la **Calificación de Disponibilidad** de la pieza.

**Tabla de Modificadores de Disponibilidad de Equipo**

| Calificación de Disponibilidad | Modificador |
| :--- | :--- |
| A | -4 |
| B | -3 |
| C | -2 |
| D | -1 |
| E | +0 |
| F | +2 |
| X* | +5 |

*El equipo es experimental o "extinto" en la era de juego.*

**Tabla de Resultados de Piezas de Repuesto (MoS)**

| Margen de Éxito | Calidad | Resultado |
| :--- | :--- | :--- |
| 5 o más | F | Componente disponible |
| 4 | E | Componente disponible |
| 3 | E | Componente disponible |
| 2 | D | Componente disponible |
| 1 | D | Componente disponible |
| 0 | C | Componente disponible |
| -1 | B | Calidad de salvamento* |
| -2 | A | Calidad de salvamento* |
| -3 o menos | N/A | Sin piezas disponibles |

*Ver la tabla de Calidad de Equipo de Salvamento.*

### Reglas Opcionales de Obtención de Piezas
*   **Fabricación:** Se puede fabricar una pieza desde cero. El NO tiene un +2, y el tiempo y coste son 10 veces el de un reemplazo. Solo para piezas de Nivel Tecnológico A, B o C.
*   **Variación Regional:** Se aplican modificadores al buscar piezas de una facción diferente a la de la ubicación actual.
*   **Negociaciones:** Los jugadores pueden intentar regatear el precio de compra/venta con tiradas de Negociación opuestas.

### Reparaciones
El proceso de reparación requiere una **Tirada de Habilidad de Técnico** después de invertir el tiempo especificado en la **Tabla Maestra de Reparación**. Los modificadores de la situación (entorno, herramientas, etc.) se aplican.
*   **Fallo:** El componente sigue dañado. Un equipo de mayor experiencia puede intentarlo de nuevo. Si un equipo de élite falla, la pieza debe ser reemplazada.
*   **Reparaciones Parciales:** Si la tirada falla por un margen pequeño (indicado en la tabla), la pieza puede ser reparada parcialmente, funcionando con penalizaciones.

### Reglas Especiales de Reparación
*   **Incompatibilidad Clan/Esfera Interior:** Usar un componente Clan para reemplazar uno de la Esfera Interior (o viceversa) añade un modificador de **+4** a la tirada. Los OmniPods son una excepción.
*   **Tiempo Extra:** Doblar el tiempo de reparación otorga un modificador de **-1** al NO (acumulativo hasta -3 por cuadruplicar el tiempo).
*   **Trabajo Apresurado (Rush Job):** Un equipo puede reducir su Calificación de Experiencia voluntariamente para acelerar una reparación (a la mitad, un cuarto o un octavo del tiempo). La tirada de habilidad no se realiza hasta que el componente se usa por primera vez en el siguiente combate.
*   **Jury-Rigging (Opcional):** Se puede realizar una reparación temporal con una Tirada de Habilidad de Técnico. El componente resultante tiene Calidad A (Salvage) y puede fallar permanentemente durante el combate si la unidad sufre caídas o impactos fuertes.

## Reabastecimiento (Rearming)
Recargar munición no requiere una tirada de habilidad, solo tiempo. El tiempo base depende del tipo de unidad y la experiencia del equipo.

**Tabla de Tiempos de Recarga**

| Unidad de Recarga | Tiempo Base de Recarga* |
| :--- | :--- |
| **Equipo Técnico** | |
| Green | 15 |
| Regular | 10 |
| Veteran | 8 |
| Elite | 6 |
| **Tripulación de Unidad** | |
| Green | 30 |
| Regular | 20 |
| Veteran | 15 |
| Elite | 10 |

*En minutos por tonelada de munición.*

**Modificadores de Recarga**

| Situación | Multiplicador |
| :--- | :--- |
| En el Campo | x2 |
| Arma de un solo disparo | x.25 |
| Almacenes Externos | x.25 |
| Exoesqueléto o IndustrialMech | x.5 |
| Omni | x.5 |

## Salvamento
El vencedor de una batalla puede recuperar unidades y componentes del campo de batalla.

*   **Proceso:** Se requiere una **Tirada de Habilidad de Técnico** para salvar un componente. El tiempo requerido se encuentra en la Tabla Maestra de Reparación.
*   **Calidad:** Las piezas salvadas automáticamente bajan un nivel de Calidad. Cualquier componente que caiga a Calidad A (Salvage) sufre las penalizaciones de la **Tabla de Calidad de Equipo de Salvamento**.

**Tabla de Tiempo de Recuperación de Unidad**

| Tipo de Unidad | Tiempo de Recuperación* |
| :--- | :--- |
| 'Mech | 60 minutos |
| ProtoMech | 20 minutos |
| Battle Armor | 10 minutos |
| Vehículo de Combate Ligero | 20 minutos |
| Vehículo de Combate Medio | 40 minutos |
| Vehículo de Combate Pesado | 60 minutos |
| Vehículo de Combate de Asalto | 80 minutos |
| Caza Convencional | 60 minutos |
| Caza Aeroespacial | 60 minutos |
| Nave Pequeña | 120 minutos |
| DropShip | 180 minutos |
| JumpShip | 360 minutos |
| WarShip | 480 minutos |

*Se aplican modificadores por condiciones planetarias.*

**Tabla de Calidad de Equipo de Salvamento (Efectos por tirada de 1D6)**

| Sistema | Efectos (1D6) |
| :--- | :--- |
| Armas de Energía | (1-2) +1 al impactar; (3-4) -1 daño por impacto; (5) Falla con un resultado de 2 o 3 al impactar; (6) +2 calor por disparo |
| Armas Balísticas | (1-2) +1 al impactar; (3-4) -1 daño por impacto; (5) Se atasca con un resultado de 2 o 3 al impactar; (6) Mitad de capacidad de munición |
| Armas de Misiles | (1-2) +1 al impactar; (3-4) -2 en la Tabla de Impactos de Misiles; (5) Se atasca con un resultado de 2 o 3 al impactar; (6) Mitad de capacidad de munición |
| Motores, Fusión/Fisión | (1-2) +3 calor/turno; (3-4) -1 MP; (5-6) Habilidad de Pilotaje +1 por turno de Carrera/Flanco/Empuje Máx. |
| Giroscopio/Controles | (1-3) -1 MP; (4-5) Habilidad de Pilotaje +2 por turno de Carrera/Flanco/Empuje Máx.; (6) Sin Torsión de Torso/Torreta |
| Electrónica | (1-4) Mitad de efecto [alcance o modificador reducido a la mitad]; (5-6) +1 al impactar para todas las armas de alcance |
| Jump Jets/MASC/TSM | (1-3) -2 MP; (4-5) Habilidad de Pilotaje +2 cuando se usa; (6) +3 calor cuando se usa |
