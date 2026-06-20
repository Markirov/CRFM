# Equipo Electrónico (C3, ECM, Sondas)

Este documento resume las reglas para el equipo electrónico como Sondas, ECM y sistemas C3, que proporcionan capacidades de guerra electrónica, incluyendo la detección de unidades ocultas, la interrupción de la electrónica enemiga y el intercambio de datos de apuntado.

## Equipo Electrónico (C3, ECM, Sondas)

### Sonda Activa (Active Probe)

Una sonda activa solo afecta el juego si se utilizan las reglas de **Unidades Ocultas**.

*   **Detección**: Puede detectar cualquier 'Mech, vehículo o blindaje de batalla oculto (no infantería convencional o unidades con blindaje sigiloso).
*   **Condiciones de Detección**:
    *   La detección ocurre al final de la Fase de Movimiento Terrestre.
    *   El objetivo debe estar dentro del alcance de la sonda.
    *   Debe existir una Línea de Visión (LdV) entre la unidad con la sonda y la unidad oculta (si esta no estuviera oculta).
*   **Agua**: Una sonda sobre la superficie no puede detectar unidades submarinas. Para que funcione bajo el agua, la LdV debe pasar únicamente a través de hexágonos de agua. Una sonda en el "cuerpo" de una unidad naval de superficie puede detectar tanto por encima como por debajo del agua.
*   **Sensores Mejorados (Battle Armor)**: Esta versión tiene un alcance de 2 hexágonos.

### Suite ECM (Electronic Countermeasures)

Una suite ECM genera una "burbuja" de interferencia con un radio de 6 hexágonos alrededor de la unidad portadora.

*   **Efecto**: Afecta a todas las unidades enemigas dentro de la burbuja y a cualquier LdV enemiga que se trace a través de ella. No tiene efecto sobre unidades amigas.
*   **Interacciones con otros sistemas**:
    *   **Sonda Activa**: No puede penetrar el área de efecto del ECM.
    *   **Artemis IV FCS**: Bloquea sus efectos. Los lanzadores equipados con Artemis IV pierden la bonificación a la Tabla de Impactos de Racimo.
    *   **Baliza de Misiles Narc**: Los misiles que apuntan a una baliza dentro de la burbuja ECM pierden su bonificación a la Tabla de Impactos de Racimo. El lanzador Narc en sí no se ve afectado.
    *   **Computadora C3 y C3i**: Aísla de su red a cualquier unidad equipada con C3 que se encuentre dentro de la burbuja. Si un C3 Master es aislado, toda la porción de la red bajo su control queda desconectada. Solo las unidades con LdV hacia el Master que no pase a través de la burbuja ECM pueden acceder a la red.
*   **Agua**: Una suite ECM en una unidad de superficie no afecta a unidades submarinas, y viceversa. La excepción son las unidades navales.
*   **ECM de Battle Armor**: Solo afecta al hexágono ocupado por la unidad.
*   **Pod ECM (Munición Especial)**: En un impacto exitoso, el objetivo es tratado como si estuviera dentro de un campo ECM hostil. No tiene radio de efecto y no afecta a la infantería.

### Sistema de Computadora C3 (Master/Slave)

El sistema C3 enlaza hasta doce 'Mechs o vehículos en una red de comunicaciones para compartir datos de apuntado.

*   **Ataque en Red**: Para realizar un ataque, se calcula el número de impactar usando el alcance desde la unidad de la red **más cercana** al objetivo. La unidad que dispara aplica sus propios modificadores (movimiento, terreno, alcance mínimo, etc.).
*   **Restricciones**: El ataque debe cumplir con las restricciones normales de LdV y no puede disparar más allá del alcance máximo del arma.
*   **Alcance de la Red**: La red en sí no tiene alcance máximo, pero solo las unidades en el área de juego se benefician. El C3 Master debe estar en el área de juego.
*   **Configuración**: Una unidad puede montar un Master y un Slave, pero solo uno puede estar activo. Un C3 Master puede controlar hasta 3 C3 Slaves o 3 C3 Masters. Un Master que controla a otro Master no puede controlar a un Slave.
*   **Funciones Adicionales del Master**: Un C3 Master duplica la función del equipo TAG.
*   **Interacciones con otros sistemas**:
    *   **Fuego Indirecto LRM**: La red C3 no ayuda a lanzar o designar objetivos para fuego indirecto.
    *   **Alcances Mínimos y Daño Variable**: Siempre se determinan desde la unidad que dispara hacia el objetivo.
    *   **Blindaje Sigiloso**: Los modificadores de alcance del blindaje sigiloso se aplican basados en el alcance entre el objetivo y la unidad **más cercana** en la red.
*   **Pérdida de la Red**: La destrucción de una unidad con un C3 Master (o un impacto crítico en el equipo) elimina la porción de la red que controlaba. La destrucción de una unidad con un C3 Slave no tiene efecto en el resto de la red.

### Sistema de Computadora C3 Mejorado (C3i)

Sigue las reglas estándar del C3 con las siguientes excepciones:

*   **Configuración**: No hay "master". Cada unidad en la red debe montar una computadora C3i.
*   **Tamaño de la Red**: Se pueden enlazar hasta 6 unidades. Múltiples redes C3i no pueden enlazarse entre sí.
*   **Resistencia**: La red completa no puede ser desactivada por la pérdida de una sola unidad. Solo las unidades dentro de un radio ECM o cuya computadora C3i sea destruida quedan aisladas.
*   **Incompatibilidad**: No es compatible con los sistemas C3 estándar y no tiene capacidad TAG.