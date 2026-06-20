# Salud, Daño Personal y Curación

Este documento resume las reglas de BattleTech: A Time of War sobre la salud del personaje, los tipos de daño que puede recibir, sus efectos y los métodos de curación. Cubre tanto las reglas estándar para el combate personal como las reglas opcionales más detalladas, como la localización de heridas.

## Salud y Puntos de Daño

La salud de un personaje se mide a través del **Monitor de Condición**, que rastrea dos tipos principales de daño.

*   **Daño Estándar:** Representa heridas físicas reales. Un personaje puede soportar una cantidad de Daño Estándar igual a **2 x su atributo de Cuerpo (BOD)**. Recibir más daño que este umbral resulta en la muerte.
*   **Fatiga:** Representa agotamiento, heridas menores y daño no letal. Un personaje puede soportar una cantidad de Fatiga igual a **2 x su atributo de Voluntad (WIL)**. Si la Fatiga excede este umbral, el personaje cae inconsciente y el exceso de puntos se convierte en Daño Estándar.

### Registro de Daño

Ambos tipos de daño se marcan en las burbujas correspondientes en la hoja de personaje. A medida que el personaje sufre daño, el jugador tacha las burbujas. La curación elimina estas marcas.

## Cálculo y Tipos de Daño

La notación de daño se expresa como **AP/BD** (Penetración de Armadura / Daño Base).

*   **AP (Armor Penetration):** Un valor numérico y un código de tipo (M: Melee, B: Balístico, E: Energía, X: Explosivo, S: Especial).
*   **BD (Base Damage):** El número de puntos de daño base. Puede tener códigos adicionales (A: Área, B: Ráfaga, C: Continuo, D: Sometimiento, S: Salpicadura).

### Tabla de Notación de Daño

| Código AP | Efecto | Código BD | Efecto |
| :--- | :--- | :--- | :--- |
| B | Balístico | A | Área-Efecto |
| E | Energía | B | Ráfaga |
| M | Melee | C | Continuo |
| S | Especial | D | Sometimiento/Incapacitante |
| X | Explosivo | S | Salpicadura |

### Cálculo de Daño Estándar

El daño final de un ataque se calcula según su tipo.

| Tipo de Ataque | Valor de Daño Estándar |
| :--- | :--- |
| A Distancia (Estándar)* | Daño del Arma + (MoS del Atacante x 0.25)** |
| A Distancia (Ráfaga) | Daño del Arma + (MoS del Atacante) |
| Melee (Sin armas) | (FUE del Ganador ÷ 4)† + (MoS del Ganador x 0.25)† |
| Melee (Armado) | (Daño del Arma) + (FUE del Ganador ÷ 4)† + (MoS del Ganador x 0.25)† |
| Caída (Superficie Dura) | 0.2 x (Distancia de caída en metros)†† |
| Caída (Superficie Blanda) | 0.1 x (Distancia de caída en metros)†† |
| Área-Efecto | Daño del Arma – (Distancia desde el impacto en metros)** |

*También para armas de ráfaga usadas como fuego de supresión.
**Redondear hacia abajo; el AP del daño de área-efecto se reduce en 1 por metro de distancia.
†Redondear hacia arriba; para MoS neto, restar el MoS del perdedor al del ganador si ambos tuvieron éxito (o sumar el MoF del perdedor al MoS del ganador).
††Redondear hacia arriba; AP del Daño = (0.1 x distancia de caída, redondeado normalmente; 0.5 redondea hacia arriba).

### Fatiga

La fatiga representa el agotamiento y las heridas menores. Se acumula por diversas fuentes.

| Situación | Acumulación de Fatiga |
| :--- | :--- |
| **Daño Recibido** | |
| Daño No Incapacitante | +1 por Impacto |
| Daño de Arma Incapacitante | +(Daño del Arma) por Impacto |
| Daño Melee Incapacitante | +(Daño de Ataque Melee) por Impacto |
| **Movimiento Continuo*** | |
| Caminar | +1 por minutos de BOD |
| Correr/Arrastrarse | +3 por minutos de BOD |
| Nadar/Escalar | +1 por Turnos de BOD |
| Esprintar/Saltar | +1 por Turno |
| Movimiento con Carga | +1 por minutos de BOD |
| **Esfuerzo** | |
| Requiere Chequeo de Atributo FUE | +1 por Turno |
| **Multiplicadores de Efecto de Fatiga** | |
| Gravedad Alta/Baja** | x Nivel de Gravedad (G)† |
| Rasgo Mandíbula de Cristal/Handicap | x 2† |
| Rasgo Dureza/En Forma | x 0.5† |

*Se aplica solo si el personaje pasa el período de tiempo completo usando la velocidad de movimiento indicada (o una más rápida) sin descansar.
**Se aplica solo al movimiento continuo, Esprintar/Saltar y Fatiga por Esfuerzo; reducir a la mitad este modificador si el personaje tiene el rasgo Tolerancia-G.
†Redondear normalmente (0.5 redondea hacia arriba).

## Efectos del Daño

El daño acumulado impone penalizaciones y puede causar efectos adicionales.

### Modificadores por Herida (Injury)

*   **Modificador Base:** Se aplica un modificador de **-1** a todas las tiradas afectadas por heridas por cada **25%** de la capacidad total de Daño Estándar del personaje que se haya perdido.
*   **Heridas y Movimiento:** Este modificador también se resta de las tasas de movimiento en MPs de Caminar y Correr.

### Modificadores por Fatiga

*   Se aplica un modificador de **-1** a todos los Chequeos de Acción por cada punto de Fatiga acumulado **por encima** del atributo de Voluntad (WIL) del personaje.
*   Estos modificadores no afectan los chequeos de MedTech ni las tasas de movimiento.

### Chequeo de Consciencia

Se requiere un Chequeo de Consciencia (un Chequeo de Atributo Individual de WIL) cada vez que un personaje sufre Daño Estándar o un ataque incapacitante exitoso. A la tirada se le suma la puntuación de BOD del personaje y se aplican los modificadores de Herida y Fatiga. Si tiene éxito, el personaje permanece consciente.

### Efecto de Sangrado (Bleeding)

*   **Activación:** Cada vez que un personaje sufre Daño Estándar en un solo ataque que exceda la mitad de su puntuación de BOD (redondeado hacia arriba), debe hacer un Chequeo de Atributo de BOD sin modificar. Si falla, comienza a sangrar.
*   **Efecto:** Un personaje que sangra sufre 1 punto de Daño Estándar como Daño Continuo en cada Fase Final hasta que se detenga el sangrado.
*   **Detener el Sangrado:** Requiere un turno completo y un Chequeo de MedTech exitoso.

### Aturdimiento (Stun)

Cualquier Daño Estándar o Fatiga infligida por un ataque aturde al personaje. Un personaje aturdido no puede realizar acciones hasta que se recupera, lo que requiere una Acción Simple (sin chequeo).

### Muerte

Un personaje muere si su Daño Estándar total supera el doble de su puntuación de BOD.

## Curación y Recuperación

### Reglas Generales

*   **Estabilización:** Antes de cualquier procedimiento, un personaje herido debe ser estabilizado. Esto sigue las mismas reglas que para detener el sangrado, pero se aplica un **+2** a la tirada de MedTech si no se está en combate.
*   **Curación Normal (sin asistencia):** Un personaje recupera **1 punto de Daño Estándar por cada semana** de descanso. Las condiciones insalubres duplican este tiempo.
*   **Curación Asistida:** Con instalaciones médicas adecuadas y cuidado, un personaje recupera una cantidad de Daño Estándar igual a la **mitad de su puntuación de BOD (redondeado hacia arriba) por semana**.
*   **Recuperación de Fatiga:** Un personaje activo recupera puntos de Fatiga igual a su BOD por minuto. En reposo, recupera su BOD por cada turno de 5 segundos.

### Cirugía (Opcional)

La cirugía es necesaria para heridas específicas (de la tabla de Localización de Heridas). El éxito de la cirugía depende de un chequeo de la habilidad de Cirugía.

| MoS de Cirugía | Nivel de Recuperación de la Herida |
| :--- | :--- |
| +3 o más | Recuperación Completa |
| +0 a +2 | Recuperación Parcial |
| -1 a -2 | Funcionalidad Limitada |
| -3 a -5 | Efecto Permanente |
| -6 o menos | El paciente sufre 1D6 de daño adicional por sangrado* |

*El Chequeo de Cirugía debe repetirse inmediatamente.

## Daño a Pilotos en Vehículos

Los pilotos y la tripulación pueden sufrir daño personal por eventos como sobrecalentamiento extremo, impactos críticos en la cabina o la destrucción de su vehículo.

| Evento | Daño (AP/BD) |
| :--- | :--- |
| **MechWarrior** | |
| Daño por Caída | 1M/3 |
| Explosión de Munición Interna | 0E/4D* |
| Torso Central Destruido por Artillería | 10X/20 |
| **MechWarriors y Pilotos de Cazas** | |
| Impacto en Tripulación/Localización de Cabina | 1B/3 |
| Sobrecalentamiento de la Unidad por 15+ puntos (con Soporte Vital) | 0E/2D* |
| Sobrecalentamiento de la Unidad por 25+ puntos (con Soporte Vital) | 0E/4D* |
| **Tripulación de Vehículo Convencional** | |
| Impacto Crítico: Comandante/Conductor | 5B/4 (al Comandante/Conductor) |
| Impacto Crítico: Tripulación Aturdida† | 0M/5D* (a toda la tripulación) |
| Tripulación Muerta† | 5B/10 (a toda la tripulación) |

*Daño no afectado por armadura.
†En vehículos de múltiples hexágonos, solo la tripulación en el segmento impactado sufre este efecto.
