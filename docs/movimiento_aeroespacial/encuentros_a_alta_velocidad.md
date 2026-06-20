# Encuentros a Alta Velocidad

## Encuentros a Alta Velocidad (High Speed Closing Engagements)

Este es un conjunto de reglas avanzadas y abstractas para resolver combates aeroespaciales a velocidades relativas muy altas (más de 101 hexágonos por turno), donde el combate se resuelve en una sola pasada. Este sistema reemplaza el movimiento y combate aeroespacial estándar de *Total Warfare* y utiliza una hoja de registro específica ("High Speed Closing Engagements Sheet") en lugar de mapas.

### Clases de Velocidad del Encuentro

La velocidad relativa entre las fuerzas determina la clase del encuentro:
*   **Lento (Slow):** 101-1,000 hexágonos/turno.
*   **Medio (Medium):** 1,001-5,000 hexágonos/turno.
*   **Rápido (Fast):** 5,001+ hexágonos/turno.

### Tipos de Encuentros

*   **De Frente (Head On):** Las fuerzas se aproximan directamente una contra la otra.
*   **Cruce (Crossing):** Las fuerzas se cruzan con vectores de velocidad con más de 60 grados de diferencia.

### Secuencia de Juego

El encuentro se resuelve en las siguientes fases:
1.  Fase de Detección y Maniobra Inicial
2.  Fase de Misiles Capitales
3.  Fase de Encuentro Principal
4.  Fase de Fin de Fase

--- 

## Fases del Encuentro

### 1. Fase de Detección y Maniobra Inicial

**Lanzar y Reagrupar Unidades:**
*   Última oportunidad para agrupar naves/escuadrones en "Unidades" para maniobrar como un solo grupo.
*   En encuentros **Lentos** y **Medios**, todos los cazas y naves pequeñas pueden ser lanzados.
*   En encuentros **Rápidos**, el defensor debe tirar en la "Tabla de Despliegue de Cazas y Naves Pequeñas" para determinar qué porcentaje de sus fuerzas puede lanzar.

**Maniobras de Detección:**
Cada "Unidad" debe elegir una de dos maniobras:
*   **Interceptar (Intercept):** Intento de entrar en combate. El éxito se determina con una Tirada de Control opuesta.
*   **Romper Contacto (Break Contact):** Intento de evitar el combate. El éxito se determina con una Tirada de Control opuesta. A la tirada se le suma la mitad del Empuje Seguro (Safe Thrust) de la unidad (redondeando hacia abajo).

*Resolución:* Se realizan Tiradas de Control opuestas. Los empates favorecen a la maniobra de `Interceptar`.

### 2. Fase de Misiles Capitales

*Esta fase se omite en encuentros **Rápidos**.*

**Maniobras con Misiles Capitales:**
Las unidades eligen una de cuatro maniobras:
*   **Intercepción Tardía (Late Intercept):** Intento de interceptar un objetivo que previamente rompió contacto o que está girando para evadir.
*   **Giro Evasivo (Turn Aside):** Intento de evitar el combate principal. Si tiene éxito, la unidad solo puede ser atacada por Misiles Capitales en esta fase.
*   **Evasión (Evasion):** Maniobra errática. Más difícil de impactar, pero perjudica la propia puntería.
*   **Mantener Posición (Hold Steady):** Sin maniobras evasivas para maximizar la puntería.

**Ataques con Misiles Capitales:**
*   Solo se pueden usar misiles capitales en modo "solo-rumbo" (bearings-only).
*   **Modificadores de Ataque:**
    *   **+2 al impactar** si el objetivo tuvo éxito en `Romper Contacto` pero el atacante tuvo éxito en `Intercepción Tardía`.
    *   El objetivo no puede ser atacado si tuvo éxito en `Romper Contacto` y `Giro Evasivo`.
    *   Se aplican modificadores normales por ángulo de ataque y maniobras de evasión.

### 3. Fase de Encuentro Principal

**Maniobras de Encuentro:**
*   **Aceleración (Accelerating):** Aumenta la dificultad para ser impactado (+1 por cada 3 de empuje) pero también para impactar a otros (+1 por cada 3 de empuje).
*   **Desaceleración (Decelerating):** Mejora la puntería (-1 por cada 3 de empuje) pero hace a la unidad más fácil de impactar (-1 por cada 3 de empuje).
*   **Evasión (Evasion):** Aplica modificadores normales.
*   **Mantener Posición (Hold Steady):** Sin modificadores.

**Fuego de Armas en el Encuentro:**
*   **Modificadores de Ataque:**
    *   **Rango:** +4 a todas las tiradas para impactar.
    *   **Giro Evasivo:** +2 al impactar si el objetivo tuvo éxito en `Giro Evasivo` en la fase anterior.
    *   **Maniobras:** Se aplican modificadores por `Aceleración` y `Desaceleración`.
    *   **Velocidad del Encuentro:** +1 en encuentros **Medios**; +2 en encuentros **Rápidos**.
    *   **Armas Capitales:** -2 al impactar si el arma tiene rango Largo o Extremo.

**Fuego de Armas de Persecución (Chaser Weapons Fire):**
*   Después de la pasada inicial, las unidades pueden disparar con las armas de sus arcos opuestos.
*   Las armas cinéticas (misiles, balísticas) sufren penalizaciones o no pueden impactar dependiendo de la velocidad del encuentro.

### 4. Daño a Alta Velocidad

El daño de las armas balísticas y de misiles (no de energía) se multiplica según la velocidad del encuentro.

*   **Encuentro Lento:** Daño x 1.5 (redondeado hacia arriba).
*   **Encuentro Medio:** Daño x 2.
*   **Encuentro Rápido:** Daño x 4.
*   **Fuego de Persecución:**
    *   **Lento:** Solo Autocañones y Rifles Gauss impactan, a mitad de daño.
    *   **Medio y Rápido:** Armas no energéticas no pueden impactar.

---

## Tablas de Encuentros a Alta Velocidad

### Tabla de Velocidad Aleatoria del Encuentro

| Tirada 2D6 | Clase de Velocidad |
| :--- | :--- |
| 2 | Rápido |
| 3-4 | Medio |
| 5-9 | Lento |
| 10-11 | Medio |
| 12 | Rápido |

### Tabla de Ángulo de Ataque

| Tirada 2D6 | Ángulo de Ataque (AdA) |
| :--- | :--- |
| 2-4 | Cruce |
| 5-10 | De Frente |
| 11-12 | Cruce |

### Tabla de Despliegue de Cazas y Naves Pequeñas (Solo Encuentros Rápidos)

| Tirada 1D6 | Porcentaje de Unidades Desplegadas |
| :--- | :--- |
| 1 | 15% |
| 2 | 30% |
| 3 | 45% |
| 4 | 60% |
| 5 | 75% |
| 6 | 90% |

*En todos los casos, redondear hacia abajo al caza o nave pequeña entera más cercana.*