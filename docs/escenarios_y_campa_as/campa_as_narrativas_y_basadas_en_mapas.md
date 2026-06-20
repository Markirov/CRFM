# Campañas Narrativas y Basadas en Mapas

## Resumen de Reglas de Campaña

Este documento resume las reglas para tres tipos de campañas en BattleTech: Escenarios Vinculados, Campañas Narrativas y Campañas Basadas en Mapas. Estas reglas proporcionan marcos para conectar batallas individuales en una historia o conflicto más grande, gestionando la progresión, los recursos y las condiciones de victoria.

- **Escenarios Vinculados:** Un sistema estructurado donde los resultados de un escenario impactan directamente en el siguiente. Utiliza una Puntuación de Campaña para determinar los tipos de misiones y las condiciones. Las fuerzas se crean al inicio y se gestionan a lo largo de la campaña.
- **Campañas Narrativas:** Un enfoque más flexible y centrado en la historia, dirigido por un Director de Juego (GM). Se basa en el concepto de "tejer" (webbing), donde las acciones de los jugadores tienen consecuencias positivas y negativas que ramifican la historia. El equilibrio y la progresión de la misión son más subjetivos.
- **Campañas Basadas en Mapas:** Utiliza un mapa estratégico para rastrear el movimiento de las fuerzas y el control de ubicaciones clave. Las batallas ocurren cuando las fuerzas se encuentran en el mapa. Este sistema introduce Turnos Estratégicos, órdenes de formación y beneficios por controlar ubicaciones específicas.

## Escenarios Vinculados

### Ensamblando una Fuerza
- **Creación de Fuerza:** Se crea la fuerza total que se usará en la campaña, incluyendo reservas y unidades de apoyo. El tamaño de la fuerza determina la duración de la campaña.
- **Valores de Batalla (BV):** Se sugiere un BV inicial para diferentes duraciones de campaña. Se pueden mantener BV en reserva para reparaciones y reabastecimiento.
- **Formaciones:** La fuerza se divide en formaciones distintas (ej. Compañías, Trinarios) que serán las fuerzas operativas.

| Tipo de Campaña | Tamaño de Fuerza | BV | 
| :--- | :--- | :--- | 
| Pequeña/Corta | Compañía | 15,000 | 
| Mediana/Moderada | Compañía Reforzada/Batallón | 35,000 | 
| Grande/Larga | Batallón/Batallón Reforzado | 55,000 | 
| Enorme/Muy Larga | Batallón Reforzado/Regimiento | 120,000 | 

### Acciones y Turnos
- **Turno Estratégico:** Un período de tiempo discreto (día, semana, etc.) donde los jugadores realizan acciones. Cada formación recibe una orden por turno.
- **Movimiento Estratégico:** La distancia que una fuerza puede mover se calcula multiplicando los PM de Caminar/Crucero de su unidad más lenta por 10.8 (para obtener km/h) y luego por el número de horas en el Turno Estratégico.

### Puntuación de Campaña
- **Cálculo:** Cada fuerza comienza con una Puntuación de Campaña de 0.
- **Victoria:** +1 punto. (Marginal: +0.5, Sustancial: +1, Decisiva: +2).
- **Derrota:** -1 punto.
- **Empate:** Sin cambios.

### Determinación de Escenarios
- **Enfrentamiento:** Ocurre cuando formaciones de ambos bandos tienen órdenes de Lucha (Fight).
- **Tabla de Escenario de Batalla:** El atacante cruza su Puntuación de Campaña con la del defensor para determinar el tipo de escenario.
- **Incursión:** Ocurre cuando formaciones tienen órdenes de Exploración (Scout).
- **Tabla de Escenario de Incursión:** Se utiliza para determinar el tipo de escenario de incursión.
- **Ataques sin Oposición:** Si una formación con orden de Lucha se enfrenta a una sin orden de combate, se considera que su puntuación de campaña es 1 punto mayor. Si se enfrenta a una con orden de no-combate, es 3 puntos mayor.

| Puntuación de Campaña del Atacante | < -5 | -4.99 a -1 | -0.99 a 0.99 | 1 a 4.99 | 5+ | 
| :--- | :--- | :--- | :--- | :--- | :--- | 
| **< -4.5** | SU | HS | BK | TC | BA | 
| **-4 a -1** | SU | SU | HS | BK | TC | 
| **-0.5 a 0.5** | HTL | SU | SU | HS | BK | 
| **1 a 4** | HTL | HTL | SU | SU | HS | 
| **4.5+** | EX | HTL | HTL | HTL | SU | 
*Clave: SU=Combate Directo, HS=Escondite, HTL=Mantener la Línea, EX=Extracción, BK=Ruptura, TC=La Caza, PB=Sondeo, BA=Ataque a Base, RR=Incursión de Reconocimiento.*

### Nuevos Escenarios
- **Sondeo (Probe):**
  - **Composición:** Una Lanza, Estrella o Nivel II por bando.
  - **Victoria:** +1 Punto de Victoria (PV) por unidad enemiga destruida, +0.5 PV por unidad enemiga con daño crítico. -1 PV por unidad propia destruida, -0.5 PV por unidad propia con daño crítico. Gana el que tenga mayor puntuación.
- **Incursión de Reconocimiento (Recon Raid):**
  - **Composición:** La fuerza atacante es la mitad del tamaño de la defensora.
  - **Victoria:** +1 PV por cada formación defensora avistada (tener LdV a 10 hexes o menos). El defensor gana +1 PV por cada unidad no avistada. Gana el que tenga mayor puntuación.
- **Ataque a Base (Base Attack):**
  - **Composición:** Fuerzas iguales. El defensor coloca 10 edificios Medios (CF 40) y 1 edificio Endurecido (CF 120).
  - **Victoria:** Se basa en el número de edificios destruidos o capturados por el atacante antes de ser destruido o retirarse.

## Campañas Narrativas

### Estructura General
- **Dirigido por el GM:** El GM crea una historia y escenarios interconectados.
- **"Tejido" (Webbing):** Las acciones de los jugadores (éxitos y fracasos) tienen consecuencias directas en misiones futuras, creando una narrativa ramificada.
- **Equilibrio de Misiones:** El GM equilibra las fuerzas para cada escenario usando BV, Puntos de Alpha Strike, tonelaje o tamaño. No es necesario que las batallas sean siempre equilibradas.

### Conclusión de la Misión
- **Salvamento:** Regla simplificada: si la misión falla, los jugadores no controlan el campo de batalla y no hay salvamento.
- **Coste y Tiempo de Reparación:** Sistema simplificado basado en el nivel de daño:
  - **Solo armadura:** Disponible para la siguiente misión.
  - **Daño interno modesto:** Puede perderse una misión.
  - **Daño interno mayor:** Puede perderse dos o tres misiones.
- **Resultados y Seguimiento:** El GM aplica los efectos de la misión al "tejido" de la campaña y presenta las siguientes opciones de misión a los jugadores.

## Campañas Basadas en Mapas

### Configuración de la Campaña
- **Escala:** Puede variar desde un solo mapa (sección de un planeta) hasta un mapa de todo el Espacio Conocido.
- **Objetivos:** Se determinan los objetivos principales de la campaña (ej. controlar ubicaciones clave, destruir fuerzas enemigas). A cada objetivo en el mapa se le asigna un valor en puntos.
- **Construcción de Fuerza:** La fuerza de campaña suele ser un nivel de organización mayor que la fuerza usada en una batalla típica (ej. un batallón para batallas a nivel de compañía).
- **Despliegue:** El atacante elige su zona de despliegue inicial, que puede ser un desembarco planetario o un salto a través de una frontera.

### Turnos a Escala de Mapa
- **Turno Estratégico:** Período de tiempo (día, semana) en el que cada formación puede realizar una acción.
- **Órdenes de Formación:**
  - **Órdenes de Combate:**
    - **Ataque (Attack):** Busca activamente al enemigo para entablar combate.
    - **Exploración (Scout):** Intenta determinar la fuerza y posición enemiga evitando un combate a gran escala.
    - **Defensa (Defend):** Preparada para la batalla pero no busca activamente al enemigo. Recibe un bono de +1 a la Iniciativa.
  - **Órdenes de No-Combate:**
    - **Reparación (Repair):** Repara unidades según las reglas de Mantenimiento.
    - **Movimiento (Move):** Se mueve a 1x su Tasa de Movimiento Estratégico.
    - **Movimiento Rápido (Fast Move):** Se mueve a 1.5x su Tasa de Movimiento Estratégico.

### Batallas y Escenarios
- **Inicio de Batalla:** Ocurre cuando formaciones opuestas se encuentran en el mismo hexágono/zona del mapa.
- **Tipo de Escenario:** Se determina mediante una tirada de 1D6 en la Tabla de Tipo de Escenario, modificada por las órdenes dadas a las formaciones.

| Modificador | Órdenes | 
| :--- | :--- | 
| **Modificadores de Batalla** | | 
| +3 | Una formación tiene orden de Ataque y la otra una orden de no-combate. | 
| +1 | Ambas formaciones tienen órdenes de Ataque. | 
| **Modificadores de Exploración** | | 
| +3 | Una formación tiene orden de Exploración y la otra una orden de no-combate. | 
| +1 | Ambas formaciones tienen órdenes de Exploración. | 
| -3 | Una formación tiene orden de Ataque. | 

| 1D6 | Batalla | Exploración | 
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

### Ubicaciones Clave
- Controlar ubicaciones clave en el mapa otorga beneficios estratégicos.

| Ubicación Clave | Beneficio para el Controlador | 
| :--- | :--- | 
| Aeródromo | Unidades aeroespaciales pueden despegar y aterrizar. | 
| Ciudad | Orden de Reparación gratuita. | 
| Puerto de Descenso | El Movimiento de Naves de Descenso solo requiere 1 Turno. | 
| Fábrica | Recibe una unidad gratuita de un nivel de organización inferior. | 
| Fortaleza | Bono de +1 a la Iniciativa en batallas en este hex o adyacentes. | 
| Puerto Marítimo | Permite movimiento a través de hexes de agua a otros puertos. | 
| Depósito de Suministros | Orden de Reparación gratuita (solo armadura y munición). | 

### Reglas Opcionales
- **Campañas Multi-Fuerza:** Permite campañas de jugador contra jugador.
- **Reglas a Doble Ciego:** Las ubicaciones de las formaciones se mantienen en secreto, requiriendo un árbitro neutral.
- **Escalado Dinámico de Campaña:** Permite "hacer zoom" en las batallas, pasando de una escala estratégica (como ACS o SBF) a una táctica (Total Warfare o Alpha Strike) para resolver conflictos clave con mayor detalle.