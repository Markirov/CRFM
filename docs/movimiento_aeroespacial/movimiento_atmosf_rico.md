# Movimiento Atmosférico

## Movimiento Atmosférico en BattleTech

El movimiento atmosférico cubre las reglas para unidades aeroespaciales que operan dentro de la atmósfera de un planeta, ya sea a gran altitud (interactuando abstractamente con el terreno) o a baja altitud (interactuando directamente con el mapa de juego terrestre). Estas reglas son un subconjunto del movimiento espacial estándar, modificado por los efectos de la sustentación, la resistencia y la gravedad.

## Reglas Estándar (Total Warfare)

Estas son las reglas fundamentales para el vuelo atmosférico.

### Términos Clave
*   **Turno Atmosférico:** Equivale a un turno de tierra (10 segundos).
*   **Mapa de Gran Altitud:** Un mapa espacial con un borde designado como la superficie del planeta y 4 filas de hexágonos como atmósfera.
*   **Mapa de Baja Altitud:** Un mapa de juego terrestre estándar de BattleTech, donde los niveles del terreno corresponden a altitudes.
*   **Altitud:** La "capa" horizontal en la que opera una unidad en un mapa de baja altitud. Cada nivel de terreno en un hexágono del mapa terrestre corresponde a una altitud aeroespacial.

### Secuencia de Turno Atmosférico
Debido a que un turno espacial (1 minuto) equivale a seis turnos atmosféricos (10 segundos cada uno), se juegan seis turnos atmosféricos por cada turno espacial. Las unidades que se mueven entre el espacio y la baja altitud se retiran del mapa actual al final de su turno y entran en el nuevo mapa al comienzo de la siguiente fase de movimiento apropiada.

### Interfaz Espacio/Atmósfera
*   Para cruzar desde el espacio a un hexágono de interfaz, una unidad debe hacer una **Tirada de Control** modificada por la **Tabla de Reingreso**.
*   **Fallo:** La Velocidad de la unidad cae a 0 y permanece en el hexágono espacial. Además, por cada punto de Margen de Fallo (MoF), aplica 5 puntos de daño al morro.
*   **Unidades fuera de control:** Sufren 250 puntos de daño en el morro por punto de Velocidad. Si la Velocidad es 0, sufren 50 puntos de daño.
*   Solo naves que puedan gastar 4 o más Puntos de Empuje pueden moverse de un hexágono de interfaz a uno espacial.

### Movimiento a Gran Altitud (Filas 1-4 de la Atmósfera)
*   **Costo de Empuje:** Aumentar la velocidad en 1 cuesta 2 Puntos de Empuje.
*   **Resistencia:** Cada unidad en un hexágono atmosférico reduce automáticamente su velocidad en 1 en la Fase Final de cada turno.
*   **Velocidad Segura:** Exceder la Velocidad Segura para la altitud (ver tabla) causa 5 puntos de daño al morro por cada punto de exceso de velocidad.
*   **Gravedad:** Afecta a cualquier unidad a 10 hexágonos o menos de la interfaz. En la Fase Final, la unidad se desplaza una fila de hexágonos más cerca del planeta. Las unidades desplazadas a la interfaz deben hacer una Tirada de Control para reingresar.
*   **Unidades Restringidas:**
    *   Dirigibles y VTOLs no pueden entrar en mapas de gran altitud.
    *   Cazas Convencionales y de Apoyo de Ala Fija están restringidos a la fila de tierra y la fila atmosférica 1.

### Movimiento a Baja Altitud (Mapa Terrestre)
*   Las unidades deben moverse un número de hexágonos igual a su velocidad, aunque maniobras especiales pueden reducir este número.
*   **Terreno:** Cada nivel en un hexágono del mapa terrestre corresponde a una altitud. Los bosques se elevan una altitud por encima de su terreno subyacente.
*   **Pérdida de Velocidad y Stalling:** Al inicio de cada turno, la velocidad de la unidad se reduce a la mitad (redondeando hacia abajo). Si la velocidad de un caza o una nave aerodinámica cae a 0, entra en pérdida (stall), cae una altitud y debe hacer una Tirada de Control. Las unidades con VSTOL pueden usar 2 Puntos de Empuje para flotar (hover).
*   **Cambios de Orientación (Facing):** Son gratuitos, pero requieren que la unidad se mueva un número mínimo de hexágonos en línea recta antes de poder girar (ver tabla de Movimiento Recto).
*   **Cambio de Altitud:** Subir una altitud cuesta 2 Puntos de Empuje. Bajar altitudes no cuesta Puntos de Empuje. Un caza que baja 2 o más altitudes en un turno gana 1 punto de velocidad adicional (hasta un máximo de 12).
*   **DropShips Esferoidales:** Deben gastar 2 Puntos de Empuje por turno para flotar y contrarrestar la gravedad. Pueden gastar 1 Punto de Empuje para moverse a un hexágono adyacente.

### Maniobras Especiales
Las unidades aerodinámicas pueden realizar acrobacias especiales gastando Puntos de Empuje y haciendo una Tirada de Control. Cada maniobra tiene requisitos de velocidad mínima/máxima y costos específicos.

### Aterrizaje y Despegue
*   **Aterrizaje:** Una unidad que comienza su fase de movimiento a 1 altitud por encima del terreno puede intentar aterrizar.
    *   **Aterrizaje Vertical:** Requiere una Tirada de Control. Reduce a la mitad los modificadores de terreno.
    *   **Aterrizaje Horizontal:** Requiere una pista de aterrizaje (longitud variable según la unidad). El piloto debe hacer una Tirada de Control. Se pueden intentar maniobras de frenado para acortar la distancia, con riesgo de fallo.
*   **Despegue:**
    *   **Despegue Horizontal:** Requiere una pista y 2 Puntos de Empuje. La unidad se coloca en el mapa atmosférico con Velocidad 1.
    *   **Despegue Vertical:** Requiere una Tirada de Control. La unidad se coloca en el mapa atmosférico con Velocidad 1.
*   **Daño por Proximidad (Escape del DropShip):** Las unidades a 6 hexágonos o menos de un DropShip esferoidal que aterriza o despega sufren daño.

### Tablas de Movimiento Atmosférico

**Tabla de Gran Altitud**

| Fila de Hexágono | Altitud (km) | Máx. Velocidad Segura |
| :--- | :--- | :--- |
| Tierra | 0–17 | 2 |
| Fila 1 | 18–35 | 3 |
| Fila 2 | 36–53 | 6 |
| Fila 3 | 54–71 | 9 |
| Fila 4 | 72–89 | 12 |
| Interfaz | 90–107 | 15 |

**Tabla de Baja Altitud**

| Altitud | Mínimo (metros) | Máximo (metros) |
| :--- | :--- | :--- |
| Tabla de Gran Altitud | 18,000+ | | 
| 10 | 5,001 | 18,000 |
| 9 | 2,001 | 5,000 |
| 8 | 1,001 | 2,000 |
| 7 | 751 | 1,000 |
| 6 | 501 | 750 |
| 5 | 251 | 500 |
| 4 | 151 | 250 |
| 3 | 101 | 150 |
| 2 | 51 | 100 |
| 1 (NOE) | 1 | 50 |
| 0 (Tierra) | 0 | 0 |

**Tabla de Movimiento Recto (Baja Altitud)**

| Velocidad Efectiva | Caza Aeroespacial | Caza Convencional | DropShip Aerodinámico |
| :--- | :--- | :--- | :--- |
| 1–3 | 1 | 1 | 1 |
| 4–6 | 1 | 1 | 2 |
| 7–9 | 2 | 1 | 3 |
| 10–12 | 3 | 2 | 4 |
| 13–15 | 4 | 3 | 5 |
| 16+ | 5 | 4 | 6 |

## Reglas Avanzadas (Strategic Operations)

### Lanzamiento de Tropas: Saltos Atmosféricos

*   **Unidades Permitidas:** 'Mechs, ProtoMechs, Battle Armor, vehículos WiGE y vehículos con capacidad de salto pueden realizar saltos atmosféricos. Otras unidades pueden requerir equipo especial como paracaídas vehiculares.
*   **Capacidad de Lanzamiento:** Una nave aeroespacial puede lanzar un número de unidades por turno igual a su capacidad de puertas operativas. Cada vez que se lanza una unidad no infantería, se tira 2D6; con un resultado de 2, la puerta se daña.
*   **Caída:** Las unidades lanzadas desde la interfaz espacio/atmósfera, una fila atmosférica o la fila de tierra en el mapa de gran altitud caen 1 hexágono por turno. En un mapa de baja altitud, caen 3 altitudes por turno.
*   **Presión Atmosférica:** La velocidad de caída se modifica según el tipo de atmósfera del planeta:
    *   **Traza:** 8 altitudes por turno
    *   **Fina:** 5 altitudes por turno
    *   **Estándar:** 3 altitudes por turno
    *   **Densa:** 2 altitudes por turno
    *   **Muy Densa:** 1 altitud por turno
*   **Tirada de Aterrizaje:** Al llegar a la altitud 1 (NOE) o a la fila de tierra, la unidad debe realizar una **Tirada de Aterrizaje** (Tirada de Pilotaje/Conducción o 2D6 contra un número objetivo de 5 para unidades sin habilidad).
*   **Fallo de Aterrizaje:**
    *   **Daño:** La unidad sufre daño como si hubiera caído un número de niveles igual al Margen de Fallo (MoF).
    *   **Dispersión:** La unidad se dispersa 1D6 hexágonos por cada punto de MoF.
*   **Ataques:**
    *   **Contra unidades en caída:** La distancia se determina por la fila atmosférica o altitud actual de la unidad. El daño se aplica en agrupaciones de 5 puntos a localizaciones aleatorias.
    *   **Por unidades en caída:** Pueden atacar, pero con un modificador de **+2** a la tirada para impactar.