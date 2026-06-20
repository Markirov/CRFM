# Edificios y Combate Urbano

### Tipos de Edificios

BattleTech divide los edificios en cuatro tipos: Ligeros, Medios, Pesados y Reforzados. Cada tipo se clasifica por su Factor de Construcción (FC) y sus niveles de altura.

*   **Factor de Construcción (FC):** Representa los puntos de daño que un hexágono de edificio puede soportar antes de convertirse en escombros. También representa el tonelaje que cada nivel del edificio puede soportar sin colapsar.
*   **Valores por Defecto de FC:**
    *   **Ligero:** 15 FC
    *   **Medio:** 40 FC
    *   **Pesado:** 90 FC
    *   **Reforzado:** 120 FC
*   **Edificios de Múltiples Hexágonos:** Cada hexágono tiene su propio valor de FC. Si más de la mitad de los hexágonos de un edificio colapsan, el resto del edificio también colapsa.
*   **Niveles de Edificio:** Cada nivel mide aproximadamente 6 metros de altura. Los niveles de un edificio se suman al nivel del terreno subyacente para determinar su altura total para la Línea de Visión (LdV).

### Efectos en el Movimiento

Las unidades pueden moverse hacia, a través o sobre los edificios. El coste de movimiento y los modificadores se resumen en las tablas de datos.

*   **Límite de Tonelaje:** Si el tonelaje total de las unidades en cualquier nivel de un edificio (excepto el Nivel 0) excede el FC actual del hexágono, todo el hexágono del edificio colapsa inmediatamente.
*   **Unidades Prohibidas:** Las unidades VTOL, WiGE, Aeroespaciales, Navales y de Apoyo de Ala Fija no pueden entrar voluntariamente en un hexágono de edificio.

#### Moverse a Través de Edificios

*   **'Mechs y Vehículos:**
    1.  Una unidad debe realizar una Tirada de Habilidad de Pilotaje/Conducción al entrar en un hexágono de edificio. Los modificadores se basan en el tipo de edificio y la velocidad.
    2.  Si la tirada falla, la unidad recibe un daño igual al FC actual del edificio / 10 (redondeado hacia arriba).
    3.  Independientemente del resultado de la tirada, el edificio sufre un daño igual al tonelaje de la unidad / 10 (redondeado hacia arriba).
    4.  Un 'Mech no puede usar Puntos de Movimiento (PM) de salto para entrar *dentro* de un edificio, pero puede saltar para aterrizar en el tejado.
*   **Infantería y ProtoMechs:**
    1.  La infantería paga 1 PM de suelo para entrar, independientemente del tipo de edificio. La infantería mecanizada paga 2 PM.
    2.  Los ProtoMechs pagan 2 PM para entrar y causan 1 punto de daño al FC del edificio.
*   **Battle Armor:**
    1.  Las unidades de Battle Armor con PM de salto pueden entrar en un edificio por debajo del nivel del tejado. El movimiento termina inmediatamente al entrar.
    2.  Se requiere una Tirada de Habilidad Anti-'Mech. Si falla, la unidad sufre daño basado en el tipo de edificio (Ligero: 2, Medio: 3, Pesado: 4, Reforzado: 5). El edificio no sufre daño.

#### Cambiar de Nivel Dentro de un Edificio

*   **'Mechs y Vehículos:** No pueden cambiar de nivel una vez dentro (excepto para entrar en sótanos).
*   **Infantería y ProtoMechs:** Pueden cambiar de nivel como si se movieran por terreno despejado. La infantería paga 1 PM de suelo por nivel. La infantería mecanizada y los ProtoMechs pagan 2 PM por nivel. Los ProtoMechs infligen 1 punto de daño al FC por cada nivel que entran.

### Efectos en el Combate

#### Atacar Edificios

*   Los ataques contra un hexágono de edificio se tratan como ataques a un objetivo inmóvil (modificador de -4 para impactar).
*   Los ataques desde un hexágono adyacente siempre impactan.
*   El daño de los ataques se resta del FC del edificio. Cuando el FC llega a 0, el hexágono se convierte en escombros.

#### Atacar Unidades Dentro de Edificios

*   El edificio absorbe una parte del daño de cada ataque dirigido a una unidad en su interior. La cantidad absorbida es igual al FC del hexágono (al inicio de la fase) / 10, redondeado hacia arriba. Esto se aplica a cada agrupación de daño individual (por ejemplo, cada misil o cada grupo de 5 puntos de un arma de racimo).
*   Los disparos fallados no dañan el edificio.
*   Los ataques físicos no se pueden realizar contra unidades en el interior desde el exterior (excepto las cargas).
*   La infantería en el interior recibe un porcentaje del daño infligido al edificio, dependiendo del tipo de este (ver tablas).

#### Combate Dentro de Edificios

*   Las unidades en el mismo hexágono y nivel pueden atacarse entre sí normalmente.
*   Para unidades en diferentes niveles o hexágonos (en un edificio de múltiples hexágonos), cada hexágono/nivel de edificio interviniente actúa como bosque ligero (+1 al número objetivo para impactar).
*   La LdV se bloquea si hay 3 o más hexágonos/niveles de edificio intervinientes.
*   Se utilizan tablas de localización de impacto especiales para ataques entre diferentes niveles.

### Colapso

Un edificio colapsa si su FC se reduce a 0 o si se excede su límite de peso en cualquier nivel por encima del suelo.

*   **Daño a Unidades:** Las unidades dentro de un edificio que colapsa reciben un daño base igual al FC del edificio (al inicio de la fase) / 10. Este daño se multiplica por (1 + el número de niveles de edificio por encima de la unidad). Las unidades en el tejado no tienen multiplicador.
*   **Resolución del Daño:** El daño total se divide en agrupaciones de 5 puntos. Se realiza una tirada de localización de impacto para cada agrupación. Se utilizan tablas de localización de impacto especiales para 'Mechs en el interior.
*   **Daño a Infantería:** La infantería convencional sufre el triple del daño normal por colapso. La Battle Armor y la infantería mecanizada sufren el doble.
*   **Caídas:** Cualquier unidad en un nivel superior a 0 también sufre el daño por caída estándar además del daño por colapso.

### Sótanos

Cuando una unidad entra por primera vez en un edificio en el Nivel 0, el jugador tira 2D6 en la Tabla de Sótanos para ver si existe uno y de qué tipo.

*   **Caída en Sótano:** Si una unidad entra en un edificio con un sótano (o el peso combinado de las unidades en el Nivel 0 excede el FC), cae. La unidad sufre daño por caída correspondiente a la profundidad del sótano (1 o 2 niveles).
*   **Sótano Pequeño:** La infantería puede entrar y moverse en él como si fuera un subnivel.
*   **Colapso sobre Sótano:** Un edificio que colapsa sobre un sótano se convierte en un hexágono de escombros al nivel del terreno circundante (no un subnivel). Cualquier unidad en el sótano es destruida.

## Reglas Avanzadas

### Reglas Avanzadas y Expansiones de Construcción: Edificios y Combate Urbano

Este documento extrae las mecánicas y tablas relacionadas con los edificios, el terreno urbano y el combate dentro de estas estructuras, del manual de **BattleTech: Tactical Operations**.

#### 1. Clasificaciones de Edificios y Movimiento

Los edificios se clasifican en varios tipos, cada uno con sus propias reglas de movimiento, Factor de Construcción (CF), y modificadores. La tabla principal de clasificación se encuentra en los datos tabulares.

**Movimiento a Través de Edificios Avanzados:**
- **Escalar Edificios:** 'Mechs y ProtoMechs con actuadores de mano, así como la infantería (excepto motorizada o mecanizada), pueden escalar el exterior de un edificio. Esta acción inflige daño al CF del hexágono como si la unidad hubiera entrado normalmente. Un fallo en la tirada de habilidad de pilotaje resulta en una caída. Las unidades de infantería que escalan pueden atacar, pero su valor de daño se reduce a la mitad.
- **Riesgo de Colapso al Escalar:** Una unidad que escala cuyo tonelaje excede el CF del hexágono del edificio (después de aplicar el daño por escalada) provocará un colapso y sufrirá una caída automática.
- **Edificios Pequeños (Small Buildings):** Estructuras de 2 niveles o menos. Los vehículos terrestres y 'Mechs no pueden simplemente caminar sobre ellos; deben usar las reglas de escalada.
- **Características Avanzadas de Edificios:** Al moverse a través de un hexágono de edificio con características especiales (techos bajos, equipo, etc.), se aplican modificadores de MP y de Tirada de Habilidad de Pilotaje adicionales, como se detalla en la *Tabla de Movimiento en Edificios Avanzados*.

**Zona Industrial Pesada (Heavy Industrial Zone):**
- **Movimiento:** Cuesta +1 MP para que un 'Mech entre en un hexágono de zona industrial pesada.
- **Combate:** Se aplica un modificador de +1 a la dificultad para impactar a todos los ataques con armas que se realicen hacia o a través de un hexágono de zona industrial pesada. 3 hexágonos intermedios de esta zona bloquean la Línea de Visión (LOS).
- **Explosiones Involuntarias:** Cada arma disparada hacia un hexágono de zona industrial pesada que no impacte en su objetivo previsto puede causar una explosión. Tira 2D6; con un resultado de 8 o más, consulta la *Tabla de Efectos del Terreno*.

#### 2. Daño, Colapso y Combate en Edificios

**Daño Crítico en Edificios Avanzados:**
- **Umbral de Daño (Damage Threshold):** Es igual al CF actual del hexágono del edificio / 10 (redondeado hacia arriba). Si el daño de un solo ataque con arma o grupo de valor de daño excede este umbral, el atacante debe realizar una tirada de golpe crítico.
- **Edificios Blindados (Armored Buildings):** No pueden sufrir golpes críticos mientras les quede blindaje.
- **Disparos Apuntados (Aimed Shots):** Permiten a una unidad atacante declarar un nivel y hexágono específico de un edificio como objetivo. Un disparo apuntado exitoso añade un modificador de +2 a la tirada de Golpe Crítico en Edificios Avanzados.

**Atacando Edificios desde Dentro:**
- Una unidad dentro de un edificio puede atacar el propio edificio. El ataque tiene éxito automáticamente si hay LOS y rango. El daño completo del arma se aplica al CF del hexágono objetivo.
- Se puede atacar equipo específico dentro del edificio. Se resuelve como un ataque contra un objetivo inmóvil. El daño se aplica al equipo en lugar del CF del edificio.

**Factor de Construcción (Expandido):**
- El Factor de Construcción (CF) de un edificio se rastrea por nivel en cada hexágono. Cada nivel tiene un CF igual al del edificio completo. Esto permite un seguimiento de daño más detallado y colapsos por niveles.

**Colapso de Edificio (Expandido):**
- **Colapso de Arriba hacia Abajo (Top-Down Collapse):** Si un nivel dentro de un hexágono de edificio colapsa, los niveles superiores caen. Esto inflige daño al nivel inmediatamente superior al original destruido y al nivel inmediatamente inferior. El daño es igual a un tercio del CF total de todos los niveles por encima del nivel destruido originalmente (redondeado hacia abajo).
- **Colapso Total (Edificios de Múltiples Hexágonos):** Un edificio de múltiples hexágonos colapsa por completo si más de la mitad de sus hexágonos sufren colapsos que los reducen a la mitad de su altura original o menos.
- **Colapso de Edificios de Múltiples Hexágonos:** Cuando un hexágono de un edificio de múltiples hexágonos colapsa, reduce a la mitad el CF actual de todos los hexágonos de edificio adyacentes en la misma estructura.
- **Daño por Salpicadura del Colapso (Splash Damage):** Un hexágono de edificio que colapsa tiene la posibilidad de esparcir escombros en hexágonos cercanos. El radio del área de efecto es de 1 hexágono por cada 12 niveles completos de altura. El daño se calcula dividiendo el CF del hexágono que colapsa por 20 (para hexágonos adyacentes), 30 (para hexágonos a 2 de distancia), y así sucesivamente, y luego multiplicando por el número de niveles.

**Daño Escalado (Scaled Damage):**
- Ciertos tipos de edificios (como Fortalezas y Castles Brian) modifican el daño que reciben y el daño que infligen a las unidades que se mueven a través de ellos. Estos se representan como multiplicadores en la *Tabla de Clasificación y Tipo de Edificio*.

**Fuego en Edificios:**
- Un edificio en llamas pierde 2 CF por turno (o por nivel, si se usa el CF Expandido).
- El fuego puede propagarse a niveles y hexágonos adyacentes durante la Fase Final de cada turno. Se aplican modificadores basados en el tipo de edificio y las condiciones climáticas.

#### 3. Construcción de Edificios Avanzados

El proceso de diseño de edificios avanzados sigue estos pasos:

1.  **Establecer Superestructura:** Elegir Base Tecnológica, Clasificación, Tipo de Estructura, Tamaño, Forma y Factor de Construcción (CF).
    *   **Capacidad de Peso Interno:** Para la mayoría de los edificios, es igual al CF x número de niveles por hexágono. Los hangares pueden triplicar esta capacidad, pero con un límite de 300 toneladas de equipo por cada 4 niveles de altura.

2.  **Instalar Blindaje:** Solo los Muros, Emplazamientos de Armas, Fortalezas y Castles Brian pueden instalar blindaje. 1 tonelada de blindaje de la Esfera Interior proporciona 16 puntos; 1 tonelada de blindaje del Clan proporciona 20 puntos.

3.  **Instalar Componentes:**
    *   **Armas:** Las armas Ligeras y Medias pueden montarse en Hangares, Edificios Estándar y Muros. Las armas Pesadas y Capitales solo pueden montarse en Emplazamientos de Armas, Fortalezas y Castles Brian.
    *   **Sistemas de Energía:** Se pueden instalar generadores para operación independiente. Se requieren amplificadores de potencia para armas de energía pesada/capital si no se utiliza un motor de fusión.
    *   **Equipo Avanzado de Edificios:** Se puede instalar una variedad de equipo especializado, incluyendo:
        *   Armas Automatizadas
        *   Generadores de Energía
        *   Tanques de Almacenamiento de Combustible/Químicos
        *   Sellado Ambiental
        *   Superestructura de Metal Pesado
        *   Techos Altos/Bajos
        *   Elevadores Industriales
        *   Puertas Grandes
        *   Construcción de Espacio Abierto
        *   Estructuras Subterráneas/Submarinas
        *   Túneles
        *   Complejos de Castles Brian

4.  **Completar la Hoja de Registro:** Registrar todas las especificaciones en una Hoja de Registro de Estructura.
