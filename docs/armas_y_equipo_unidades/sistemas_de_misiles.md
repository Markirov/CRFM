# Sistemas de Misiles

Este documento resume las reglas para los sistemas de misiles en BattleTech, extraídas del manual Total Warfare. Cubre las mecánicas generales como el gasto de munición y el uso de la Tabla de Impactos Agrupados (Cluster), así como las reglas para tipos específicos de lanzadores (LRM, SRM, ATM, Streak) y municiones especiales (Infernos, NARC, Artemis IV, etc.). Se ignoran las descripciones narrativas para centrarse únicamente en las mecánicas del juego.

## Reglas Generales de Misiles

### Gasto de Munición
Las armas de misiles tienen una cantidad limitada de "disparos". Cada vez que se dispara un arma, se gasta un "disparo" de munición. La munición se rastrea en los espacios de munición designados en la Hoja de Críticos de la unidad. Un arma no puede disparar si su contenedor de munición asignado está vacío, a menos que haya otro contenedor con el mismo tipo de munición disponible.

### Tabla de Impactos Agrupados (Cluster Hits)
Las armas de misiles son armas de tipo "Cluster" (Agrupado). Después de un impacto exitoso, el jugador debe tirar 2D6 y consultar la Tabla de Impactos Agrupados. El resultado se cruza con el tamaño del arma (por ejemplo, la columna '20' para un LRM-20) para determinar cuántos misiles individuales impactan en el objetivo. Cada misil o grupo de misiles (según el arma) requiere una tirada de localización de impacto separada.

### Modificador de Rango Mínimo
Algunos sistemas, como los LRM, son menos efectivos a corta distancia. El modificador se calcula con la siguiente fórmula:

`[Rango Mínimo] – [Rango al Objetivo] + 1 = Modificador de Rango Mínimo`

### Fuego Indirecto de LRM
Permite a una unidad con LRM atacar a un objetivo sin línea de visión (LOS), siempre que una unidad aliada ("spotter" u observador) tenga LOS con el objetivo.

**Requisitos y Modificadores:**
*   El observador no puede haber realizado un ataque de Carga o Muerte desde Arriba (DFA) en ese turno.
*   El número base para impactar es la Habilidad de Artillería de la unidad que dispara.
*   Se aplican los siguientes modificadores:
    *   Modificador de rango estándar desde el tirador al objetivo.
    *   **+1** por fuego indirecto.
    *   Modificadores de movimiento del objetivo estándar.
    *   Modificador de movimiento del atacante + modificador de movimiento del observador.
    *   Modificadores de terreno basados en la LOS desde el observador al objetivo.
    *   Si el observador también realiza ataques en el mismo turno, se aplica un **+1** adicional al ataque indirecto y a sus propios ataques.

## Tipos de Lanzadores de Misiles

### ATM (Misil Táctico Avanzado)
*   **Artemis IV Integrado:** Añade un bonificador de **+2** a la tirada en la Tabla de Impactos Agrupados.
*   **Munición Especial:** Puede usar munición de Rango Extendido (ER) o de Alto Explosivo (HE).
*   **Agrupación de Daño:** El daño total se divide en agrupaciones de 5 puntos para la localización de impactos.
*   **Restricción:** No puede realizar fuego indirecto.

### MML (Lanzador de Misiles Múltiples)
*   Puede disparar tanto misiles SRM como LRM, incluyendo sus respectivas municiones especiales.
*   La agrupación de daño depende del tipo de munición: 5 puntos para LRM, 2 puntos para SRM.

### Streak SRM
*   Requiere una tirada para impactar para "fijar" el objetivo (lock-on).
*   Si la tirada tiene éxito, **todos los misiles impactan automáticamente** (no se usa la Tabla de Impactos Agrupados).
*   Si la tirada falla, no se fijó el objetivo, no se disparan misiles y no se genera calor.
*   Se requiere una tirada de fijación separada para cada sistema Streak individual que se dispare.

### Lanzador de Torpedos
*   Son lanzadores SRM o LRM diseñados para uso submarino.
*   Solo pueden dispararse desde o hacia un hexágono de agua de Profundidad 1 o mayor.
*   La LOS debe trazarse a través de hexágonos de agua de Profundidad 1 o mayor.
*   Si un torpedo impacta una localización que no está sumergida, se debe volver a tirar la localización.

## Balizas y Municiones Especiales

### Baliza de Misiles NARC
*   Un impacto exitoso adhiere una baliza (pod) al objetivo.
*   Las unidades aliadas que ataquen a un objetivo con una baliza NARC con misiles equipados para NARC reciben un **+2** a su tirada en la Tabla de Impactos Agrupados.
*   **iNarc (NARC Mejorado):** Las balizas son más grandes y pueden ser retiradas por el objetivo como si se tratara de una infantería en enjambre (Swarm). Una tirada exitosa destruye una baliza. Los vehículos pueden retirarlas si no se mueven ni disparan durante un turno.
*   **Fuego Indirecto:** Una baliza NARC permite que los misiles equipados para NARC disparen indirectamente sin necesidad de un observador, pero pierden el bonificador de +2 en la Tabla de Impactos Agrupados.

### Municiones Especiales
*   **Misiles Equipados con Artemis:** Ganan un **+2** a la tirada en la Tabla de Impactos Agrupados cuando se usan junto con un sistema Artemis IV FCS.
*   **Misiles de Fragmentación:** Aplican su valor de daño estándar directamente contra infantería convencional (sin usar la tabla de cluster). No causan daño a otras unidades. El daño se duplica contra bosques.
*   **Infernos:** No causan daño directo. En su lugar, aplican calor o críticos automáticos.
    *   **Contra 'Mechs y cazas:** +2 de calor por cada misil que impacta.
    *   **Contra Vehículos:** Cada misil que impacta fuerza una tirada en la Tabla de Críticos apropiada.
    *   **Contra Infantería Convencional:** 1 misil elimina 3 soldados.
    *   **Contra Battle Armor:** 3 misiles eliminan 1 soldado.
    *   La munición de Inferno puede explotar debido al calor interno de la unidad portadora.
*   **Misiles Semi-Guiados:** Ignoran los modificadores de movimiento del objetivo, fuego indirecto, terreno y movimiento del observador cuando se disparan contra un objetivo designado por TAG.

## Sistemas Relacionados

### Sistema Anti-Misiles (AMS)
*   Se activa automáticamente contra un ataque de misiles exitoso que impacte en su arco de cobertura.
*   El atacante aplica un **-4** a su tirada en la Tabla de Impactos Agrupados (el resultado no puede ser menor a 2).
*   Si el arma es un lanzador Streak, se trata como si el resultado en la tabla de cluster fuera 11 antes de aplicar el modificador de -4.
*   Gasta 1 disparo de munición por cada ataque de misiles interceptado.

### Misiles Tele-Operados
*   Solo para combate espacial. El misil lanzado se convierte en una unidad en el mapa.
*   Se mueve como un caza y requiere una línea de visión constante desde la unidad lanzadora para ser controlado.
*   Si pierde la LOS, continúa en su última trayectoria y velocidad. Si impacta, el número base para impactar es 2, modificado por el daño del misil y el empuje gastado.