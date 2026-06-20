# Creación de Escenarios

Este documento resume las reglas para la creación de escenarios y campañas extraídas de los manuales de BattleTech, centrándose en las mecánicas, tablas y modificadores. Ignora el trasfondo narrativo para enfocarse en los aspectos jugables.

Existen varios sistemas para crear y enlazar escenarios:
1.  **Escenarios Enlazados:** Un sistema estructurado para jugar una serie de batallas donde el resultado de una afecta a la siguiente, usando una Puntuación de Campaña.
2.  **Campañas Narrativas:** Un enfoque más libre, guiado por un Director de Juego (GM), que utiliza "Ganchos de Escenario" para construir una historia.
3.  **Campañas Basadas en Mapas:** Utiliza un mapa estratégico para seguir el movimiento de las fuerzas y determinar los enfrentamientos en ubicaciones clave.
4.  **Creación de Campañas Chaos:** Un sistema modular y personalizable para construir campañas "pista por pista" (track by track), utilizando Puntos de Cofre de Guerra (Warchest Points) para gestionar el progreso, reparaciones y opciones especiales.

## Escenarios Enlazados

Este sistema se utiliza para crear una campaña corta donde los resultados de cada batalla tienen consecuencias directas en la siguiente.

### 1. Ensamblar una Fuerza

*   Los jugadores crean la fuerza total que usarán en la campaña, no solo las unidades para una batalla. Esto incluye reservas y vehículos de apoyo.
*   El tamaño de la Fuerza determina la duración de la campaña. Se recomienda que ambas partes comiencen con fuerzas de tamaño comparable.
*   Se pueden usar las reglas de **Creación de Fuerzas** (p. 8) y **Construcción de Formaciones** (p. 56).
*   **Valores de Batalla (BV) Sugeridos:**

| Tipo de Campaña | Tamaño de Fuerza | BV | 
| :--- | :--- | :--- | 
| Pequeña/Corta | Compañía | 15,000 | 
| Mediana/Moderada | Compañía Reforzada/Batallón | 35,000 | 
| Grande/Larga | Batallón/Batallón Reforzado | 55,000 | 
| Enorme/Muy Larga | Batallón Reforzado/Regimiento | 120,000 | 

### 2. Acciones y Órdenes

Las batallas ocurren dentro de un **Turno Estratégico** (generalmente un día). Cada jugador asigna una orden a cada una de sus formaciones (compañías, trinarias, etc.).

| Órdenes de Combate | Descripción | 
| :--- | :--- | 
| **Luchar (Fight)** | Busca activamente enfrentar al enemigo. Se considera el agresor. | 
| **Explorar (Scout)** | Busca contacto con el enemigo para determinar su fuerza y posición, pero intenta evitar una batalla a gran escala. | 
| **Defender (Defend)** | La formación está lista para el combate pero no busca activamente al enemigo. | 

| Órdenes de No Combate | Descripción | 
| :--- | :--- | 
| **Mover (Move)** | Realiza un movimiento estratégico a su velocidad normal. No está lista para luchar. | 
| **Reparar (Repair)** | Repara unidades constituyentes según las reglas de reparación y salvamento (p. 188). No puede moverse ni luchar. | 
| **Descansar (Rest)** | Si se usan reglas de Fatiga (p. 219), reduce los Puntos de Fatiga en 1. | 
| **Abastecer (Supply)** | Gasta BV no utilizado para comprar equipo para reparaciones o personalizaciones. | 

### 3. Puntuación de Campaña

*   Cada bando comienza con una Puntuación de Campaña de 0.
*   **Victoria:** +1 punto.
*   **Victoria Marginal:** +0.5 puntos.
*   **Victoria Sustancial:** +1 punto.
*   **Victoria Decisiva:** +2 puntos.
*   **Derrota:** -1 punto.
*   **Empate:** Sin cambios.

### 4. Determinar el Escenario

Cuando las formaciones con órdenes de **Luchar** o **Explorar** se encuentran, se produce una batalla. El tipo de escenario se determina cruzando la Puntuación de Campaña del Atacante con la del Defensor en las siguientes tablas.

**Tabla de Escenario de Batalla (Orden: Luchar)**

| Puntuación Defensor | < -5 | -4.99 a -1 | -0.99 a 0.99 | 1 a 4.99 | 5+ | 
| :--- | :--- | :--- | :--- | :--- | :--- | 
| **< -4.5** | SU | HS | BK | TC | BA | 
| **-4 a -1** | SU | SU | HS | BK | TC | 
| **-0.5 a 0.5** | HTL | SU | SU | HS | BK | 
| **1 a 4** | HTL | HTL | SU | SU | HS | 
| **4.5+** | EX | HTL | HTL | HTL | SU | 

**Tabla de Escenario de Incursión (Orden: Explorar)**

| Puntuación Defensor | < -5 | -4.99 a -1 | -0.99 a 0.99 | 1 a 4.99 | 5+ | 
| :--- | :--- | :--- | :--- | :--- | :--- | 
| **< -4.5** | PB | EX | HS | RR | RR | 
| **-4 a -1** | EX | PB | EX | HS | RR | 
| **-0.5 a 0.5** | EX | EX | PB | EX | HS | 
| **1 a 4** | SU | EX | EX | PB | EX | 
| **4.5+** | BK | SU | EX | EX | PB | 

*Abreviaturas: SU (Combate Frontal), HS (Escondite), HTL (Mantener la Línea), EX (Extracción), BK (Ruptura), TC (La Caza), PB (Sondeo), BA (Ataque a Base), RR (Incursión de Reconocimiento).*

### 5. Nuevos Escenarios

Estos escenarios se pueden usar de forma independiente o como parte del sistema de Escenarios Enlazados.

*   **Sondeo (Probe):** Fuerzas pequeñas de ambos bandos se enfrentan. Gana 1 Punto de Victoria (PV) por unidad enemiga destruida y 0.5 PV por unidad con daño crítico. Se pierde la misma cantidad por las pérdidas propias. Gana el que tenga más puntos.
*   **Incursión de Reconocimiento (Recon Raid):** El atacante tiene la mitad de la fuerza del defensor. El objetivo es identificar la composición de la fuerza enemiga. Gana 1 PV por cada formación defensora avistada (LOS y a 10 hexes o menos).
*   **Ataque a Base (Base Attack):** El atacante debe destruir los suministros y las instalaciones del defensor. El defensor despliega 10 edificios Medios (CF 40) y 1 edificio Endurecido (CF 120). La victoria se determina por el número de edificios destruidos o capturados.

## Campañas Narrativas y Basadas en Mapas

Estos sistemas son más flexibles y dependen del GM. Las Campañas Basadas en Mapas usan un mapa estratégico para determinar los enfrentamientos.

### Órdenes de Formación (Basadas en Mapa)

*   **Ataque, Explorar, Defender:** Similar a los Escenarios Enlazados.
*   **Reparar:** Permite usar las reglas de mantenimiento y reparación.
*   **Mover:** Mueve la formación a 1x su Tasa de Movimiento Estratégico.
*   **Movimiento Rápido:** Mueve la formación a 1.5x su Tasa de Movimiento Estratégico.

### Determinación de Escenario (Basado en Mapa)

Se usa una tirada de 1D6 en la **Tabla de Tipo de Escenario** y se aplican modificadores según las órdenes dadas.

**Modificadores a la Tirada de Tipo de Escenario**

| Modificador | Condición | 
| :--- | :--- | 
| **+3 Batalla** | Una formación tiene orden de Ataque y la otra una orden de no-combate. | 
| **+1 Batalla** | Ambas formaciones tienen órdenes de Ataque. | 
| **+3 Explorar** | Una formación tiene orden de Explorar y la otra una orden de no-combate. | 
| **+1 Explorar** | Ambas formaciones tienen órdenes de Explorar. | 
| **-3 Explorar** | Una formación tiene orden de Ataque. | 

**Tabla de Tipo de Escenario**

| 1D6 | Batalla | Explorar | 
| :--- | :--- | :--- | 
| 1 | EX | BK | 
| 2 | EX | BK | 
| 3 | HTL | PB | 
| 4 | HTL | PB | 
| 5 | SU | HS | 
| 6 | SU | HS | 
| 7 | HS | RR | 
| 8 | BK | RR | 
| 9 | BK | RR | 

## Creación de Campañas Chaos

Este es un sistema para crear campañas personalizadas "pista por pista" (track by track). Cada pista es un mini-escenario con su propia configuración, objetivos y reglas.

### Estructura de una Pista

1.  **Preparación del Juego (Game Setup):** Define el Atacante y el Defensor, el terreno y las fuerzas.
2.  **Objetivos (Objectives):** Las metas a cumplir para ganar Puntos de Cofre de Guerra (WP). Hay docenas de objetivos posibles, como:
    *   **Aniquilar:** Destruir/incapacitar a toda la fuerza enemiga (500 WP).
    *   **Ataque por Avance:** Destruir/incapacitar al menos la mitad de la fuerza enemiga (300 WP).
    *   **Ruptura (Breakthrough):** Al menos el 25% de la fuerza del jugador sale por el borde del mapa del oponente (200 WP).
    *   **Quemar la Bandera (Burn the Flag):** Localizar y destruir el cuartel general enemigo (500 WP).
3.  **Opciones (Options):** Modificadores opcionales que el jugador puede elegir para aumentar la dificultad a cambio de más WP. Ejemplos:
    *   **Clima Adverso (Bad Weather):** 75-200 WP.
    *   **Fuego de Artillería (Artillery):** Recompensa variable.
    *   **Combate Aéreo (Air Support):** 25-100 WP.
4.  **Cofre de Guerra (Warchest):** Define el coste en WP para jugar la pista y las recompensas de los Objetivos y Opciones.
5.  **Reglas Especiales (Special Rules):** Reglas únicas que se aplican a la pista, como **Retirada Forzosa** o **Salvamento**.
6.  **Situación, Consecuencias y Siguiente Pista:** Texto narrativo que enlaza las pistas.

### Condiciones de Victoria (Opcional)

En lugar de WP por objetivo, se puede usar un sistema jerárquico basado en el número total de objetivos completados.

| Condición | Definición | 
| :--- | :--- | 
| **Victoria Total** | Completar todos los Objetivos. | 
| **Victoria Clara** | Completar todos los Objetivos menos uno. | 
| **Victoria Parcial** | Completar la mitad de los Objetivos (redondeando hacia arriba). | 
| **Victoria Pírrica** | Completar menos de la mitad, pero más de uno. | 
| **Derrota Parcial** | Completar solo un Objetivo. | 
| **Derrota Total** | No completar ningún Objetivo. |