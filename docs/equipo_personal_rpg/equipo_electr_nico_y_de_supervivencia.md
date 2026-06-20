# Equipo Electrónico y de Supervivencia

Este documento resume las reglas para el equipo electrónico y de supervivencia en el juego de rol BattleTech: A Time of War. Se enfoca exclusivamente en las mecánicas, estadísticas y modificadores, omitiendo el lore y las descripciones narrativas. El equipo se divide en categorías principales, cada una con sus tablas de estadísticas y reglas de juego específicas.

**Términos Clave:**
*   **Coste:** Coste del objeto en C-bills.
*   **Masa:** Peso del objeto en gramos (g) o kilogramos (kg).
*   **Uso de Energía:** Consumo de energía, medido en Puntos de Poder (PP) por hora (PPH), minuto (PPM), uso (PPU) o disparo (PPS).
*   **Capacidad de Energía (P-Cap):** Máximo de Puntos de Poder que un paquete de energía puede contener.
*   **BAR (Barrier Armor Rating):** Valor de armadura de barrera contra daño (Cuerpo a Cuerpo/Balístico/Energía/Explosivo).

## Equipo Electrónico

### Comunicaciones

**Reglas Especiales:**
*   Para obtener un bonificador a la tirada de **Iniciativa**, todos los miembros de un grupo deben tener dispositivos de comunicación de dos vías funcionales y sintonizados en la misma frecuencia.
*   El **ECM hostil**, la interferencia electromagnética y los metales pesados pueden bloquear o interrumpir las comunicaciones.
*   Los rangos listados en las tablas son para dispositivos que operan "fuera de la red". En ciudades con una base tecnológica suficiente (Base Tecnológica C o superior), los relés necesarios facilitan las comunicaciones a través de la ciudad o hacia ciudades cercanas.

### Equipo de Audio/Video/Trideo

**Reglas Especiales:**
*   **Holotanque:** Se puede conectar a comunicaciones de campo avanzadas para producir un modificador de **+2 a las tiradas de Estrategia, Tácticas e Iniciativa** del comandante.

### Ordenadores

**Reglas Especiales:**
*   **Escáner de Diagnóstico (Descartes Mk.XXI y XXV):** Requiere un paquete de energía o enchufe. Otorga un bonificador a las tiradas de **Técnico** al diagnosticar daños.
*   **Escáner/Lector de Verigraph:** Encripta/lee el código genético del operador para transferencias seguras de mensajes. Aplica un **-4 a las tiradas de Falsificación**.

### Equipo de Vigilancia y Óptica

**Reglas Especiales:**
*   **Micrófono Láser:** Reduce su alcance a tan solo 100 metros en niebla, humo u otro terreno que obstaculice la visión.
*   **Visor de Visión Circular:** El usuario no puede ser sorprendido. Tiene BAR 10 vs. Flash.
*   **Detector Ultrasónico:** Permite detectar objetivos hasta a 10 metros a través de barreras con BAR 3. Ignora modificadores por oscuridad. Tiene BAR 3 vs. Flash.

### Sensores Remotos

**Reglas Especiales:**
*   Un personaje con la habilidad de **Operaciones de Sensores** o una habilidad de **Sistemas de Seguridad** apropiada puede instalar estos sensores sin necesidad de una tirada.
*   El Director de Juego debe determinar cualquier modificador misceláneo a la detección del sensor (distancia, sigilo, terreno).
*   Los sensores sísmicos son inmunes a las restricciones de línea de visión, pero son imprecisos (modificador de **-2 a la tirada** para localizar a un intruso).

### Paquetes de Energía y Recargadores

**Reglas Especiales:**
*   **Recarga:** Todos los paquetes de energía son recargables.
*   **Carga Rápida (Quick-Charge):** La tasa de recarga se duplica (absorben 2 PP por cada 1 PP que el cargador proporciona).
*   **Carga Lenta (Slow-Charge):** Absorben 1 PP por cada 2 PP que el cargador proporciona (redondeando hacia abajo).
*   **Capacidad Máxima:** Un paquete de energía nunca puede ser cargado más allá de su **P-Cap** nominal.
*   **Tasa de Recarga:** La PPH de un recargador es una cantidad fija. Si se conectan múltiples paquetes, la tasa de recarga se divide entre el número de puertos de carga activos.

## Equipo de Supervivencia

### Kits de Supervivencia y Refugios

**Reglas Especiales:**
*   **Kits de Campo:** Los cuchillos incluidos tienen las mismas estadísticas que un Cuchillo estándar. El multi-herramienta del kit avanzado ayuda en tiradas de **Técnico**, reduciendo penalizaciones por falta de equipo.
*   **Brújula Electrónica:** Puede conectarse a redes SatNav locales, actuando como un escáner de posicionamiento global.
*   **Bengalas de Emergencia:** Infligen daño 1E/3C si se tocan encendidas. Una tirada de **Percepción** exitosa puede avistarlas con un modificador de +10 a 50 metros o menos, y -1 por cada 100 metros adicionales.

### Equipo para Climas Hostiles

**Reglas Especiales:**
*   Un personaje que usa equipo para clima hostil en el terreno apropiado funciona como si tuviera el Rasgo **Piel Gruesa (Thick-Skinned)**. Si ya lo tiene, el efecto del Rasgo se duplica.
*   Los trajes de cuerpo completo (traje espacial, traje ambiental) se consideran comprometidos si sufren cualquier daño que no sea de Fatiga que reduzca uno de sus valores de BAR a 0.

### Equipo de Sigilo

**Reglas Tácticas:**
*   Las estadísticas de sigilo se representan con códigos **E/I/C (ECM/Infrarrojo/Camuflaje)**.
*   **Contra Sensores Portátiles y Óptica Personal:** Los códigos son los modificadores que se aplican a la tirada de **Sigilo** del usuario. Para detectar al usuario, el operador del sensor debe hacer una tirada opuesta de **Operaciones de Sensores** o **Percepción**.
*   **Contra Sensores Vehiculares:** Los códigos E/I/C simplifican sus efectos. El valor de **ECM (E)** determina la capacidad de ocultarse de sensores electromagnéticos. El valor de **Infrarrojo (I)** determina la capacidad de ocultar la firma térmica. El valor de **Camuflaje (C)** determina la capacidad de ocultar el contorno visual en movimiento.

| Calificación ECM | Efecto Táctico                                                              |
| :--------------- | :--------------------------------------------------------------------------- |
| Menos de 0       | La unidad no puede ocultarse de los sensores EM.                             |
| 0 a 5            | Sin efecto táctico. Puede usar reglas de Unidades Ocultas.                   |
| 6 a 9            | Puede ocultarse de sensores vehiculares y Sondas Activas (excepto Sabueso). |
| 10 o más         | No puede ser detectado por ninguna Sonda Activa.                           |

| Calificación IR | Modificador de Tirada Adicional (Corto/Medio/Largo/Extremo) |
| :------------ | :---------------------------------------------------------- |
| Menos de 4    | Sin efecto táctico                                          |
| 4 a 5         | +0/–1/–2/–3                                                 |
| 6 a 7         | –1/–1/–2/–3                                                 |
| 8 a 9         | –1/–2/–3/–5                                                 |
| 10 o más      | –2/–3/–3/–6                                                 |

| Calificación Camo | Modificador de Tirada Adicional (basado en PM del objetivo gastado)* |
| :---------------- | :------------------------------------------------------------------- |
| Menos de 2        | Sin efecto táctico                                                   |
| 2 a 3             | –1/–0/–0/–0/–0                                                      |
| 4 a 5             | –2/–1/–0/–0/–0                                                      |
| 6 a 7             | –3/–2/–1/–0/–0                                                      |
| 8 a 9             | –3/–2/–1/–1/–0                                                      |
| 10 o más          | –3/–3/–2/–1/–1                                                      |

*1 PM Táctico = 15 metros por turno de 5 segundos. Los modificadores de Calificación IR son para la unidad objetivo moviéndose 0/1/2/3/4+ PM respectivamente.*
