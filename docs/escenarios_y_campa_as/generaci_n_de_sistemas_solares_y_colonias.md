# Generación de Sistemas Solares y Colonias

Este documento resume las reglas para la generación de sistemas solares, planetas y colonias para su uso en campañas de BattleTech. Las reglas cubren desde la creación de la estrella principal y sus planetas, hasta el establecimiento de detalles de colonias como población, nivel tecnológico y gobierno.

## Generación de Sistemas Solares

Estas reglas permiten crear sistemas estelares detallados. Se dividen en la creación de la estrella (el primario) y luego la población de sus órbitas con planetas y otros cuerpos celestes.

### El Primario (La Estrella)

La estrella del sistema afecta la formación planetaria y la posibilidad de vida.

**1. Tipo de Estrella**

*   Tira 2D6 y consulta la **Tabla de Generación Primaria** para determinar el tipo de estrella (Realista, Amigable para la Vida o Caliente).
*   Todas las estrellas generadas son de clase V (secuencia principal) por defecto.

**2. Subtipo Estelar**

*   Para generar el subtipo (un número de 0 a 9), tira 1D6 y consulta la columna de Subtipo en la **Tabla de Generación Primaria**.

**3. Estadísticas Solares**

*   Una vez determinado el tipo y subtipo, consulta la **Tabla de Estadísticas Solares Primarias** para obtener todos los detalles físicos de la estrella (masa, luminosidad, temperatura, tiempo de recarga de salto, etc.).

### Los Planetas

**Paso 1: Generar Número de Órbitas**

*   Tira 2D6 y suma 3. El resultado es el número de ranuras orbitales del sistema.

**Paso 2: Colocar Órbitas**

*   Para encontrar la ubicación de una ranura orbital en UA (Unidades Astronómicas), multiplica el valor de la **Tabla de Colocación Orbital** por la masa de la estrella (en múltiplos de la masa de Sol).
*   Las órbitas se asumen circulares o casi circulares (baja excentricidad).

**Paso 3: Llenar Ranuras Orbitales**

*   Comenzando desde la ranura más interna, tira 2D6 y consulta la **Tabla de Tipos de Objeto**.
*   Usa la columna "Sistema Interior" si la órbita está dentro o más cerca de la zona de vida. Usa la columna "Sistema Exterior" si está más allá.
*   Los detalles de cada tipo de objeto (diámetro, densidad, etc.) se determinan usando los modificadores de la misma tabla.

**Paso 4: Detalles Planetarios**

*   **Gravedad Superficial (en Gs):**
    *   `Gravedad = (Diámetro en km / 12742) x (Densidad en g/cm³ / 5.5153)`
*   **Velocidad de Escape (en m/s):**
    *   `Ve = 11,186 m/s x (Diámetro / 12,742) x √(Densidad / 5.5153)`
*   **Longitud del Año (en años terrestres):**
    *   Método 1 (preciso): `T (segundos) = 769,107 x √[R³ / (G x M)]` donde R es el radio orbital en metros, M es la masa de la estrella en kg, y G es la constante gravitacional.
    *   Método 2 (alternativo): `Ty (años) = √[Ra³ / Ms]` donde Ra es el radio orbital en UA y Ms es la masa de la estrella en múltiplos solares.
*   **Temperatura Planetaria (para mundos sin atmósfera o con atmósfera tenue):**
    *   `T (Kelvin) = 277 x (Luminosidad)^0.25 x √(1/R)` donde R es la distancia orbital en UA.
    *   Para planetas con atmósfera, se aplican multiplicadores a R: Baja (x0.95), Normal (x0.9), Alta (x0.8), Muy Alta (x0.5).
*   **Lunas y Anillos:**
    *   Tira 1D6 en la **Tabla de Generación de Lunas** según el tipo de planeta para determinar la cantidad y clase de las lunas.
*   **Presión Atmosférica y Composición:**
    *   Para planetas terrestres, se realizan dos tiradas en la **Tabla de Presión Atmosférica y Habitabilidad**.
    *   **Tirada de Presión:** 2D6, modificado por la proximidad a la estrella (-2 si es más cercano que la zona de vida) y multiplicado por el ratio de velocidad de escape del planeta (`Ve / 11,186`).
    *   **Tirada de Habitabilidad:** 2D6 >= 9 para ser habitable. Se aplican modificadores por tipo de planeta y el modificador de habitabilidad de la estrella.
    *   Para atmósferas no habitables, usa la **Tabla de Composición de Atmósfera Inhabitable**.

### Reglas Opcionales de Sistema Solar

*   **Enanas Marrones:** Pueden generar suficiente calor para hacer habitables las lunas de un planeta, extendiendo la zona de vida en un 33%.
*   **Lunas Exóticas:** Incluye reglas para planetas duales, lunas habitables y lunas con atmósfera.
*   **Órbitas Planetarias Excéntricas:** Un planeta cuya órbita cruza más de una ranura orbital.
*   **Sistemas Multi-Estelares:** Las estrellas deben estar separadas por al menos 4 veces el límite de salto de la estrella más grande para no afectar las zonas habitables y los puntos de salto.

## Creación de Colonias

Estas reglas determinan las características de una colonia en un planeta.

### Paso 1: Población

**A. Historia de Ocupación**

*   Tira 1D6 en la **Tabla de Historia de Ocupación** para determinar quién y cuándo se estableció la colonia, o elígelo.

**B. Población**

*   Cruza la distancia desde Terra y la era de fundación en la **Tabla de Población Planetaria** para obtener la fórmula de población.
*   La tabla tiene dos números: una tirada de 1D6 para determinar la categoría de población (baja o alta) y una segunda tirada para la población específica.
*   Aplica los **Modificadores de Condición Planetaria** al resultado final.

### Paso 2: Códigos USILR

El USILR (Universal Socio-Industrial Level Rating) es un código de 5 letras que representa la sofisticación tecnológica, desarrollo industrial, dependencia de materias primas, producción industrial y dependencia agrícola.

*   **Sofisticación Tecnológica:** Base C. Modificadores por era de asentamiento, población, facción.
*   **Desarrollo Industrial:** Base D. Modificadores por población y sofisticación tecnológica.
*   **Dependencia de Materias Primas:** Base B. Modificadores por tecnología, densidad del mundo, población, producción industrial y antigüedad.
*   **Producción Industrial:** Base C. Modificadores por población, tecnología y desarrollo industrial.
*   **Dependencia Agrícola:** Base C. Modificadores por tecnología, desarrollo industrial, población, agua superficial y polución.

Consulta la **Tabla USILR** para todos los modificadores y descripciones de las calificaciones (A-F).

### Paso 3: Gobiernos

*   Tira 2D6 en la **Tabla de Gobierno Base**, aplicando modificadores según la facción a la que pertenece el planeta.
*   Selecciona **Calificadores de Gobierno** de la **Tabla de Gobierno Detallada** para refinar el tipo de gobierno.

### Paso 4: Otras Características

*   **Generadores de Hiperpulso (HPG):**
    *   Si la colonia es Clan, tiene un HPG de clase A.
    *   Para otros, tira 2D6 en la **Tabla de HPG**, aplicando modificadores por distancia a Terra, población, tecnología, industria, año y si es una capital nacional.
*   **Estaciones de Recarga:**
    *   Tira 2D6 en la **Tabla de Estaciones de Recarga**, aplicando modificadores por población, tecnología, industria, año y si es una capital nacional.

