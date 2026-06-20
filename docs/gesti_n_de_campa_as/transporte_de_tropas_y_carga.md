# Transporte de Tropas y Carga

Este conjunto de reglas detalla los procedimientos y tiempos necesarios para el transporte de unidades de combate y carga fuera de las condiciones de una batalla. Cubre el montaje y desmontaje desde bahías de transporte dedicadas, el movimiento de carga general y las reglas más complejas para transportar unidades como carga y prepararlas para el despliegue.

## Moviendo Carga

Estas reglas cubren el movimiento de carga entre dos objetos cualesquiera (edificios, vehículos, unidades aeroespaciales, etc.), incluso en gravedad cero.

### Determinando Toneladas Movidas por Minuto

Para determinar la cantidad de carga movida por minuto, se debe consultar la **Tabla de Transporte de Carga**. El proceso es el siguiente:

1.  Comenzar con el **Modificador Base** según el **Método** de transporte.
2.  Aplicar los modificadores de **Tipo de Elevador**.
3.  Aplicar los modificadores de **Tipo de Carga**.
4.  Finalmente, aplicar los modificadores de **Condiciones Planetarias**. Si se aplican múltiples condiciones, la más severa se aplica primero.

**Nota:** Si se cargan o descargan unidades, el número de métodos no puede ser mayor que el número de puertas que la unidad monte.

### Tabla: Transporte de Carga

| Categoría | Objeto | Modificador | Notas |
| :--- | :--- | :--- | :--- |
| **Método** | Humano | 0.2 Ton/min | Base |
| | Animal (Tamaño Grande) | 1 Ton/min | Base |
| | Animal (Tamaño Muy Grande) | 1.5 Ton/min | Base |
| | Exoesqueleto (incl. Battle Armor) | 1 Ton/min | Base |
| | ProtoMech | Masa / 15 | Base |
| | Vehículo | Masa / 60 | Base |
| | 'Mech | Masa / 30 | Base. Si solo tiene un actuador de mano, es Masa/50. |
| **Tipo de Elevador** | Manipulador de Carga | x1.2 | |
| | Grúa de Carga | x1.2 | |
| | Equipo Cero-G | x1.75 | Solo en gravedad cero y vacío. |
| | Plataforma de Carga Ligera | x2 | |
| | Plataforma de Carga Pesada | x4 | |
| **Tipo de Carga** | Contenerizada | x5 | Carga en contenedores estándar. |
| | Líquido | x5 | |
| | Paquete Nulo-G | x2.5 | |
| **Condiciones Planetarias** | Gravedad Cero | x0.2 | |
| | Vacío | x0.75 | Requiere traje/vehículo sellado. |
| | Atmósfera Contaminada | x0.8 | |
| | Presión Atmosférica Mínima o Muy Alta | x0.9 | |
| | Temperaturas Extremas | x0.8 | > 50°C o < -30°C. |
| | Nevada Fuerte / Tormenta de Hielo / etc. | x0.75 | |
| | Huracán / Tornado | x0.5 | |
| | Noche sin Luna / Erupción Solar | x0.75 | Si no hay luces/cobertura. |
| | Oscuridad Total | x0.5 | Si no hay luces/cobertura. |

### Unidades Aeroespaciales

*   Las unidades aeroespaciales que están en el aire y desean transferir carga deben primero **acoplarse**.
*   Las Naves Grandes que montan bahías de transporte de carga líquida se asume que también montan sistemas de reabastecimiento por cada 10,000 toneladas completas de carga líquida. Cada sistema se considera una **Plataforma de Carga Pesada** bajo gravedad estándar para determinar el tiempo de transferencia.

## Montando y Desmontando Unidades (Fuera de Juego)

Estas reglas se usan cuando una unidad monta o desmonta de una unidad portadora que incluye una **bahía de transporte** del tipo apropiado. Se usan las reglas estándar de *Carrying Units* (p. 89, TW) con las siguientes excepciones:

*   **Multiplicar por 6** el tiempo requerido para montar o desmontar una unidad. (Ej: un 'Mech tarda 60 segundos en lugar de 10).
*   Una **pelotón de infantería convencional** o una **escuadra de battle armor** es equivalente a un 'Mech al determinar el número que puede montar o desmontar en un turno.
*   Mientras una puerta se use para montar o desmontar una unidad, esa puerta **no puede usarse para transferir carga**.
*   Si existen ciertas **Condiciones Planetarias** (ver tabla anterior) mientras se carga o descarga una unidad, se multiplica el tiempo requerido por **8** en lugar de 6 para: Infantería Convencional, Atmósfera Contaminada, Presión Mínima o Muy Alta, Nevada Fuerte, Tormenta de Hielo, Tormenta Eléctrica, Viento Fuerte o Aguacero Torrencial.
*   Se multiplica el tiempo requerido por **10** en lugar de 6 para: Huracán, Tornado, Noche sin Luna, Erupción Solar u Oscuridad Total.

## Unidades y Personal en Bodegas de Carga (Reglas Avanzadas)

Transportar unidades en bodegas de carga generales (no bahías de transporte dedicadas) tiene limitaciones significativas.

*   **Descarga:** Las unidades solo pueden ser descargadas en el suelo, a otra unidad aeroespacial acoplada, o a una bahía de transporte apropiada usando las reglas de movimiento de carga.
*   **Asistencia:** El personal de la unidad que se descarga no participa en el proceso. La descarga la realiza el personal del vehículo portador (generalmente 5 personas).
*   **Bonificación de Descarga:** Para unidades autopropulsadas (vehículos, 'Mechs, etc.), se **duplica la cantidad de carga manejada por turno** para reflejar que son un solo "paquete". Los 'Mechs no reciben esta bonificación.

### Transporte de Personal en Bodegas de Carga

El transporte de personal en bodegas de carga (no diseñadas para ello) es ineficiente en consumibles:

*   **Bodega de Carga:** Consume **1 tonelada** de consumibles (aire, agua, etc.) por día por cada **5 personas**.
*   **Bahías de Infantería:** Consume **1 tonelada** de consumibles por día por cada **20 personas**.
*   **Aposentos (Quarters):** Consume **1 tonelada** de consumibles por día por cada **200 personas**.

### Preparación para el Despliegue

Una unidad transportada como carga no está lista para el despliegue inmediato tras ser descargada.

*   **Tiempo Base:** Se requieren **15 minutos** (90 turnos) para preparar la unidad para su uso, asumiendo un equipo técnico completo (1 técnico, 6 asistentes).
*   **Modificadores de Tiempo:**
    *   Por cada asistente que falte, se añaden **1D6 minutos** adicionales.
    *   Si el técnico principal está ausente, se añaden **2D6 minutos** adicionales.
    *   Debe haber al menos un técnico/asistente presente.
*   **Técnicos Adicionales:**
    *   Por cada asistente adicional, se resta **1 minuto**.
    *   Por cada técnico adicional, se restan **2 minutos**.
    *   Un máximo de dos equipos técnicos pueden trabajar en una sola unidad, reduciendo el tiempo a **7 minutos** (42 turnos).
*   **Unidad Personal:** Si el equipo técnico está asignado permanentemente a la unidad, se reducen todos los tiempos en **5 minutos** (30 turnos).
*   **Infantería Convencional:** La infantería a pie está lista para desplegarse tan pronto como termina la descarga.