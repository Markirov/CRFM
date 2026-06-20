# Armas Balísticas

Esta sección detalla las reglas para las armas balísticas de fuego directo. Estas armas disparan proyectiles sólidos y generalmente requieren munición. Se cubren varios tipos, incluyendo Autocannons, Rifles Gauss y Ametralladoras, cada uno con sus propias mecánicas, modificadores y estadísticas de juego.

## Reglas Generales de Munición
- **Gasto:** Las armas balísticas consumen un "disparo" de munición por cada uso en un turno, a menos que sean de Fuego Rápido.
- **Explosiones:** La munición puede explotar si la ubicación que la contiene recibe un impacto crítico.

## Tipos de Armas Balísticas

### Autocannons (AC)
Son las armas balísticas estándar. Sus variantes tienen reglas especiales.

**#### Autocannon LB-X (LB-X AC)**
- **Tipo de Munición:** Puede usar munición estándar (slug) o de racimo (cluster). El tipo de munición debe ser declarado antes de disparar.
- **Modificador de Munición de Racimo:** Aplica un modificador de **-1** al número objetivo para impactar cuando se usa munición de racimo.
- **Resolución de Daño (Racimo):** Si impacta con munición de racimo, el daño se resuelve usando la Tabla de Impactos de Racimo (Cluster Hits Table). El daño se agrupa en proyectiles de 1 punto.

**#### Autocannon Rotatorio (RAC)**
- **Cadencia de Fuego:** Puede disparar de 1 a 6 tiros en un solo turno. El jugador declara el número de disparos.
- **Calor y Munición:** Genera calor y consume munición por cada disparo realizado.
- **Atascamiento (Jamming):** Si se disparan 2 o más tiros, el arma puede atascarse.
  - 2-3 disparos: Se atasca con un resultado de 2 en la tirada para impactar.
  - 4-5 disparos: Se atasca con un resultado de 3 o menos.
  - 6 disparos: Se atasca con un resultado de 4 o menos.
- **Desatascar:** Un arma atascada puede ser reparada. El jugador debe declarar el intento en la End Phase. En el siguiente turno, la unidad no puede correr/flanquear ni saltar. Al final de la Weapon Attack Phase de ese turno, se realiza una tirada de Gunnery Skill con un modificador de +3. Si tiene éxito, el arma se desatasca.

**#### Autocannon Ultra (UAC)**
- **Cadencia de Fuego:** Puede disparar uno o dos tiros por turno.
- **Atascamiento (Jamming):** Si dispara dos veces, el arma se atasca con un resultado de 2 en la tirada para impactar. Un arma atascada es inútil por el resto de la partida.

### Rifles Gauss
Los Rifles Gauss usan imanes para acelerar un proyectil a velocidades extremas.

**#### Reglas Generales de Gauss**
- **Munición:** La munición de Gauss no explota. Un impacto crítico en la munición destruye el mecanismo de alimentación, inutilizando esa munición.
- **Explosión del Arma:** Un impacto crítico en el propio rifle destruye los capacitores, causando una explosión.
  - **Rifle Gauss Estándar:** Explosión de 20 puntos de daño.
  - **Rifle Gauss Ligero:** Explosión de 16 puntos de daño.
  - **Rifle Gauss Pesado:** Explosión de 25 puntos de daño.
  - **Rifle Gauss Anti-Personal:** Explosión de 3 puntos de daño.

**#### Rifle Gauss Pesado (Heavy Gauss Rifle)**
- **Tirada de Habilidad de Pilotaje (PSR):** Un 'Mech que se mueva y dispare un Rifle Gauss Pesado en el mismo turno debe hacer una tirada de Habilidad de Pilotaje al final de la Weapon Attack Phase.
- **Modificadores de PSR:** Assault: -1, Heavy: 0, Medium: +1, Light: +2.
- **Modificador al Disparar:** Las unidades aeroespaciales (cazas y naves pequeñas) aplican un **+1** al número objetivo para impactar cuando disparan esta arma.

**#### Rifle Gauss Hiper-Asalto (HAG)**
- **Resolución de Daño:** Se considera un arma de racimo.
  - Modificadores a la tirada en la Cluster Hits Table: **+2** a corto alcance, **-2** a largo alcance.
  - El daño total se divide en agrupaciones de 5 puntos, cada una asignada a una localización de impacto diferente.
- **Explosión del Arma:** Un impacto crítico causa una explosión: HAG 20 (10 daño), HAG 30 (15 daño), HAG 40 (20 daño).
- **Modo Flak:** Aplica un modificador de **-3** al número objetivo para impactar contra blancos aéreos elegibles.

### Ametralladoras (Machine Guns - MG)
- **Propiedad Anti-Infantry (AI):** Estas armas infligen daño especial a la infantería convencional.
- **Machine Gun Array (MGA):** Agrupa varias ametralladoras. El número de impactos se determina con una tirada en la Cluster Hits Table. Todos los impactos se aplican a una única localización.

### Otras Armas Balísticas
- **Nail/Rivet Gun:** Solo inflige daño a infantería convencional y a Support Vehicles con un BAR menor de 5.

## Tablas de Armas Balísticas

### Esfera Interior
| Objeto | Tipo | Calor | Daño | Alc. Mín. | Alc. Corto | Alc. Medio | Alc. Largo | Munición/Ton | Mod. Al Blanco |
|---|---|---|---|---|---|---|---|---|---|
| Autocannon/2 | DB, S | 1 | 2 | 4 | 1-8 | 9-16 | 17-24 | 45 | 0 |
| Autocannon/5 | DB, S | 1 | 5 | 3 | 1-6 | 7-12 | 13-18 | 20 | 0 |
| Autocannon/10 | DB, S | 3 | 10 | 0 | 1-5 | 6-10 | 11-15 | 10 | 0 |
| Autocannon/20 | DB, S | 7 | 20 | 0 | 1-3 | 4-6 | 7-9 | 5 | 0 |
| Light Gauss Rifle | DB, X | 1 | 8 | 3 | 1-8 | 9-17 | 18-25 | 16 | 0 |
| Gauss Rifle | DB, X | 1 | 15 | 2 | 1-7 | 8-15 | 16-22 | 8 | 0 |
| Heavy Gauss Rifle | DB, X, V | 2 | 25/20/10 | 4 | 1-6 | 7-13 | 14-20 | 4 | 0 |
| LB 2-X AC | DB, C/S/F | 1 | 2 | 4 | 1-9 | 10-18 | 19-27 | 45 | 0, -1 |
| LB 5-X AC | DB, C/S/F | 1 | 5 | 3 | 1-7 | 8-14 | 15-21 | 20 | 0, -1 |
| LB 10-X AC | DB, C/S/F | 2 | 10 | 0 | 1-6 | 7-12 | 13-18 | 10 | 0, -1 |
| LB 20-X AC | DB, C/S/F | 6 | 20 | 0 | 1-4 | 5-8 | 9-12 | 5 | 0, -1 |
| Light AC/2 | DB, S | 1 | 2 | 0 | 1-6 | 7-12 | 13-18 | 45 | 0 |
| Light AC/5 | DB, S | 1 | 5 | 0 | 1-5 | 6-10 | 11-15 | 20 | 0 |
| Light Machine Gun | DB, AI | 0 | 1 | 0 | 1-2 | 3-4 | 5-6 | 200 | 0 |
| Machine Gun | DB, AI | 0 | 2 | 0 | 1 | 2 | 3 | 200 | 0 |
| Heavy Machine Gun | DB, AI | 0 | 3 | 0 | 1 | 2 | - | 100 | 0 |
| Nail/Rivet Gun | DB, AI | 0 | 0 | 0 | 1 | - | - | 300 | 0 |
| Rotary AC/2 | DB, R/C | 1/Sht | 2/Sht, R6 | 0 | 1-6 | 7-12 | 13-18 | 45 | 0 |
| Rotary AC/5 | DB, R/C | 1/Sht | 5/Sht, R6 | 0 | 1-5 | 6-10 | 11-15 | 20 | 0 |
| Ultra AC/2 | DB, R/C | 1/Sht | 2/Sht, R2 | 3 | 1-8 | 9-17 | 18-25 | 45 | 0 |
| Ultra AC/5 | DB, R/C | 1/Sht | 5/Sht, R2 | 2 | 1-6 | 7-13 | 14-20 | 20 | 0 |
| Ultra AC/10 | DB, R/C | 4/Sht | 10/Sht, R2 | 0 | 1-6 | 7-12 | 13-18 | 10 | 0 |
| Ultra AC/20 | DB, R/C | 8/Sht | 20/Sht, R2 | 0 | 1-3 | 4-7 | 8-10 | 5 | 0 |

### Clan
| Objeto | Tipo | Calor | Daño | Alc. Mín. | Alc. Corto | Alc. Medio | Alc. Largo | Munición/Ton | Mod. Al Blanco |
|---|---|---|---|---|---|---|---|---|---|
| LB 2-X AC | DB, C/S/F | 1 | 2 | 4 | 1-10 | 11-20 | 21-30 | 45 | 0, -1 |
| LB 5-X AC | DB, C/S/F | 1 | 5 | 3 | 1-8 | 9-15 | 16-24 | 20 | 0, -1 |
| LB 10-X AC | DB, C/S/F | 2 | 10 | 0 | 1-6 | 7-12 | 13-18 | 10 | 0, -1 |
| LB 20-X AC | DB, C/S/F | 6 | 20 | 0 | 1-4 | 5-8 | 9-12 | 5 | 0, -1 |
| AP Gauss Rifle | DB, X, AI | 1 | 3 | 0 | 1-3 | 4-6 | 7-9 | 40 | 0 |
| Gauss Rifle | DB, X | 1 | 15 | 2 | 1-7 | 8-15 | 16-22 | 8 | 0 |
| HAG 20 | DB, X, C, F | 4 | C5/20 | 2 | 1-8 | 9-16 | 17-24 | 6 | 0 |
| HAG 30 | DB, X, C, F | 6 | C5/30 | 2 | 1-8 | 9-16 | 17-24 | 4 | 0 |
| HAG 40 | DB, X, C, F | 8 | C5/40 | 2 | 1-8 | 9-16 | 17-24 | 3 | 0 |
| Light Machine Gun | DB, AI | 0 | 1 | 0 | 1-2 | 3-4 | 5-6 | 200 | 0 |
| Machine Gun | DB, AI | 0 | 2 | 0 | 1 | 2 | 3 | 200 | 0 |
| Heavy Machine Gun | DB, AI | 0 | 3 | 0 | 1 | 2 | - | 100 | 0 |
| Nail/Rivet Gun | DB, AI | 0 | 0 | 0 | 1 | - | - | 300 | 0 |
| Ultra AC/2 | DB, R/C | 1/Sht | 2/Sht, R2 | 2 | 1-9 | 10-18 | 19-27 | 45 | 0 |
| Ultra AC/5 | DB, R/C | 1/Sht | 5/Sht, R2 | 0 | 1-7 | 8-14 | 15-21 | 20 | 0 |
| Ultra AC/10 | DB, R/C | 3/Sht | 10/Sht, R2 | 0 | 1-6 | 7-12 | 13-18 | 10 | 0 |
| Ultra AC/20 | DB, R/C | 7/Sht | 20/Sht, R2 | 0 | 1-4 | 5-8 | 9-12 | 5 | 0 |
