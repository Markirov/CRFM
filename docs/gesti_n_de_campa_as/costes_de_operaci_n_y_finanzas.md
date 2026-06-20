# Costes de Operación y Finanzas

## Resumen de Costes de Operación y Finanzas

Esta sección detalla las reglas para calcular y gestionar los costes operativos de una unidad de combate en BattleTech, tanto en tiempo de paz como de guerra. Cubre los gastos recurrentes como munición, repuestos, combustible y salarios, así como la gestión de deudas, préstamos y la compra/venta de equipo.

## Costes de Operación en Tiempo de Paz

Estos son los gastos mensuales que una Fuerza incurre independientemente de si está en una misión activa. Se calculan sumando los costes de munición, repuestos, combustible y salarios.

### Munición
*   **Consumo:** El consumo de munición en tiempo de paz es **un cuarto (1/4)** de la capacidad total de munición de la unidad. Esto representa la munición gastada en entrenamiento.
*   **Coste:** Se basa en munición estándar, incluso si la unidad normalmente usa tipos alternativos.
*   **Infantería Convencional:** Utiliza el doble de su carga de combate estándar (que es de 5 recargas) para el entrenamiento mensual en tiempo de paz.

### Repuestos
*   **Consumo Mensual Genérico:** Se calcula como un porcentaje de la masa total de la unidad:
    *   'Mechs, Cazas, Vehículos, Naves de Descenso, Naves de Guerra, Armaduras de Batalla: **0.1% de la masa**.
    *   Infantería Convencional: **0.2%** de la masa del compartimento de transporte necesario.
    *   Estaciones Espaciales y SaltoNaves: **0.01% de la masa**.
*   **Coste Genérico de Repuestos:**
    *   'Mechs e Infantería: **10,000 C-Bills** por tonelada.
    *   Vehículos: **8,000 C-Bills** por tonelada.
    *   Cazas y Naves Grandes: **15,000 C-Bills** por tonelada.
*   **Modificadores de Quirks al Coste de Repuestos:** Estos modificadores se aplican secuencialmente.
    *   **Easy to Maintain / Rugged:** x0.8
    *   **Difficult to Maintain:** x1.25
    *   **Non-Standard Parts:** x2.0
    *   **Obsolete:** x1.1 (y +0.1 adicional por cada 20 años más allá de su fecha de obsolescencia).
    *   **Ubiquitous:** x0.75

### Combustible
*   **Consumo Mensual en Tiempo de Paz:**
    *   'Mechs, Vehículos, Cazas e Infantería: **4 veces** la capacidad de combustible de la unidad.
    *   Naves de Descenso y Naves de Guerra: **15 días de consumo** por mes.
    *   SaltoNaves y Estaciones Espaciales: **3 días de consumo** por mes para mantenimiento de posición.
*   **Costes de Combustible:** Se determinan según la siguiente tabla.

| Tipo de Combustible | Coste (por tonelada) | Disponibilidad |
| :--- | :--- | :--- |
| Gas Natural | 1,200 | A |
| Petroquímicos | 1,000 | A |
| Hidrógeno | 15,000 | C* |
| Alcohol | 1,500 | A |

\*El hidrógeno puede producirse sin coste usando plantas de energía de fusión, fisión o solar.

### Salarios
Los salarios mensuales se calculan multiplicando el número de personal por su tipo y habilidad por el salario base correspondiente.

| Posición | Salario Mensual |
| :--- | :--- |
| MechWarrior | 1,500 |
| Piloto Aeroespacial | 1,500 |
| Tripulante de Vehículo/Artillería | 900 |
| Piloto de Aeronave | 900 |
| Infantería Regular | 750 |
| Infantería Especialista/Armadura | 960 |
| Tripulante de Nave (Nave de Descenso) | 1,000 |
| Tripulante de Nave (SaltoNave) | 750 |
| Tripulante de Nave (Nave de Guerra) | 1,200 |
| Técnico | 800 |
| Asistente de Técnico (Astech) | 400 |
| Administrador | 500 |

**Multiplicadores de Salario**

| Calidad/Experiencia | Multiplicador |
| :--- | :--- |
| Green | x0.6 |
| Regular | x1.0 |
| Veteran | x1.6 |
| Elite | x3.2 |
| Entrenamiento Anti-BattleMech (Infantería) | x1.5 |

| Rango | Multiplicador |
| :--- | :--- |
| Oficial (no-Clan) | ((Puntos de Rasgo de Rango - 3) / 3) + 1 |
| Tropa (no-Clan) y todo el Clan | ((Puntos de Rasgo de Rango - 3) / 6) + 1 |

## Costes en Tiempo de Guerra

Una Fuerza se considera en tiempo de guerra mientras ejecuta cualquier tipo de misión que no sea de guarnición, cuadro, seguridad o transporte.

*   **Línea Base:** Los costes operativos en tiempo de guerra comienzan en la línea base de tiempo de paz.
*   **Salarios:** El personal que muere en combate recibe su paga completa por el mes en que fallece.
*   **Combustible:** Se suma el combustible gastado en misiones de combate a la línea base de tiempo de paz.
*   **Mantenimiento:** Se suman los costes de reparación y reemplazo por encima de la línea base de tiempo de paz.
*   **Munición:** Se debe registrar y costear toda la munición gastada en combate, además del consumo base de tiempo de paz.

## Deuda y Finanzas

### Contraer Deuda
*   **Creación de Fuerza:** Una fuerza mercenaria o gubernamental puede duplicar su presupuesto inicial contrayendo una deuda. Los piratas no pueden.
*   **Reembolso:** Se debe pagar el **150%** de la deuda original. Esto se hace añadiendo un **1%** del valor de la deuda original a los costes operativos mensuales en tiempo de paz hasta que se complete el pago.

### Préstamos durante una Campaña
Las fuerzas pueden solicitar préstamos, cuyas condiciones varían según el tipo de fuerza y su reputación.

| Tipo de Fuerza | Interés Anual Base | Colateral Base | Interés Mínimo | Periodo Máx. de Pago |
| :--- | :--- | :--- | :--- | :--- |
| Gobierno | 5% | 0% | 0% | 10 años |
| Mercenario (Reputación 14+) | 7% | 15% | 4% | 5 años |
| Mercenario (Reputación 10-13) | 10% | 25% | 5% | 3 años |
| Mercenario (Reputación 5-9) | 15% | 40% | 5% | 2 años |
| Mercenario (Reputación 1-4) | 20% | 60% | 10% | 1 año |
| Mercenario (Reputación 0 o menos) | 35% | 80% | 15% | 6 meses |
| Pirata | 50% | 100% | 25% | 6 meses |

*   **Modificadores de Interés:**
    *   **Colateral Reducido:** +1% de interés por cada -1% de colateral.
    *   **Colateral Aumentado:** -1% de interés por cada +10% o +15% de colateral (dependiendo de la reputación).

### Pagar Deudas Reduciendo Salarios
*   Una fuerza (principalmente mercenarios) puede reducir los salarios para pagar deudas.
*   **Riesgo:** Por cada mes sin pago, el comandante debe hacer una tirada de Liderazgo contra una Dificultad de 6 (3 para fuerzas gubernamentales), con una penalización acumulativa de +1 por cada mes consecutivo sin pago.
*   **Consecuencias del Fallo:** Si la tirada falla, se pierde personal (por motín o deserción) igual al Margen de Fallo multiplicado por el número de lanzas/pelotones en la fuerza.

### Compra y Venta de Equipo (Opcional)
*   **Venta:**
    *   Unidades/equipo sin daños: **50%** del precio de compra.
    *   Unidades/equipo dañado: **33.3%** del precio de compra.
    *   Unidades destruidas: **10%** del precio de compra.
*   **Negociaciones (Opcional):** Los jugadores pueden intentar regatear los precios. Se realiza una tirada de habilidad con una Dificultad base de 10. El éxito modifica el precio en un 10% a favor del jugador. Se pueden hacer hasta 3 intentos con una penalización acumulativa de +1. Un fallo revierte el progreso y aplica una penalización porcentual igual al descuento/aumento ya negociado.