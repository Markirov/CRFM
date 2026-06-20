# Blindaje Personal y Exotrajes

Este documento detalla las reglas para el Blindaje Personal y los Exotrajes en el universo de BattleTech. Se cubren los tres tipos principales de blindaje (Personal, Táctico y de Barrera), las mecánicas de Penetración de Blindaje (AP) contra Valor de Blindaje de Barrera (BAR), y cómo el blindaje se degrada con el daño. También se incluyen reglas para apilar blindaje y las mecánicas específicas para Exotrajes y Servoarmaduras, incluyendo cómo ponérselos y sus interacciones en combate. Finalmente, se proporcionan tablas detalladas con estadísticas para diversos tipos de blindajes, accesorios, kits estándar por facción y blindajes exóticos.

## Reglas Generales de Blindaje

### Tipos de Blindaje y Barreras
Existen tres tipos principales de blindaje o barreras en combate:

*   **Blindaje Personal:** Cualquier blindaje que un personaje viste como ropa. Se considera parte del personaje y se rastrea mediante valores BAR. El Blindaje Natural de las criaturas se trata como blindaje personal.
*   **Blindaje Táctico:** Se refiere al blindaje de vehículos y unidades de apoyo que rastrean el daño en puntos. Los personajes dentro de una unidad con blindaje táctico generalmente no pueden ser objetivo directo. La Servoarmadura es un caso especial.
*   **Barrera:** Un término genérico para la protección que un personaje puede recibir de obstáculos en la línea de fuego. Se valora en BAR y puntos de blindaje (integridad).

### AP vs. BAR (Penetración de Blindaje vs. Valor de Blindaje de Barrera)
La reducción de daño se basa en la comparación del valor de Penetración de Blindaje (AP) del ataque con el Valor de Blindaje de Barrera (BAR) del blindaje.

*   Si el **AP es mayor o igual al BAR**, el blindaje no afecta el resultado del daño.
*   Si el **AP es menor que el BAR**, el blindaje reduce el AP y el Daño Base (BD) finales del ataque por la diferencia entre el BAR del blindaje y el AP del ataque. (Ej: Un arma con AP 5B/BD 6 contra un blindaje con BAR 6 para Balístico resulta en un ataque de AP 4B/BD 5).
*   El AP y el BD de un ataque no pueden reducirse por debajo de 0.
*   **Blindaje Personal y Barreras:** Cualquier daño restante que atraviese el blindaje se aplica como daño al personaje objetivo.
*   **Blindaje Táctico:** Cualquier daño infligido más allá del efecto de reducción de daño del blindaje se aplicará solo a los puntos de blindaje y estructura del blindaje táctico, no a los personajes que estén dentro.

### Degradación del Blindaje
*   **Degradación del Blindaje Personal:** Si un ataque que inflige daño estándar (no de Fatiga) penetra el blindaje para infligir 5 o más puntos de daño, todos los cuatro valores BAR del blindaje se reducen en 1 punto (hasta un mínimo de 0). El blindaje personal reducido de esta manera sigue siendo reparable.
*   **Degradación del Blindaje Táctico (y Estructura):** El blindaje táctico reduce su valor de Puntos de Blindaje Táctico en una cantidad igual a los puntos de Daño Estándar infligidos, dividido por el BAR del blindaje (redondeo normal). Los ataques que infligen daño de Sometimiento o solo de Fatiga no dañan el blindaje táctico.

### Blindaje Apilado
*   Cuando un ataque debe atravesar más de un tipo de blindaje, resuelve el daño primero en la barrera (o capa de blindaje) más externa y luego en cada barrera o capa adicional hacia el objetivo.
*   Si alguna de las barreras o capas de blindaje posee valores BAR más altos que el AP actual del ataque, el blindaje reduce el daño restante y el AP del ataque en una cantidad igual a la diferencia entre el BAR del blindaje o barrera y el AP del ataque.
*   Si el daño absorbido por las diversas barreras y/o capas de blindaje entre el atacante y su objetivo reduce el BD del arma a 0, el ataque se anula antes de que pueda alcanzar su objetivo.
*   **Apilar Blindaje Personal:** Si un personaje decide "apilar" blindaje (usando una capa de blindaje personal sobre otra), cada capa añadida aumenta su factor de Carga en un nivel. Un personaje no puede llevar más de tres capas de blindaje personal.

## Servoarmaduras y Exotrajes

### Reglas de Juego Especiales
*   **Ponerse el Blindaje:** Es una Acción Compleja que toma 30 minutos (sin asistencia) o 15 minutos (con asistencia). Una tirada exitosa de la habilidad Pilotar/Traje de Batalla puede reducir este tiempo en 5 minutos por MoS (hasta un mínimo de 10 o 5 minutos, respectivamente).
*   **Salida de Emergencia:** Es una Acción Simple de 1 turno, siempre que al traje le quede al menos 1 punto de Blindaje Táctico.
*   **Reglas de Combate:** Las servoarmaduras usan reglas vehiculares (tácticas) cuando atacan o son atacadas por otra unidad vehicular. Cuando atacan o son atacadas por unidades de infantería, se recomiendan las reglas de combate personal.
*   **Daño al Portador:** Si una servoarmadura, traje de Potencia (Ligero) o exotraje sufre más de 1 punto de daño a su blindaje táctico (después de contar los efectos del BAR), cada punto adicional de daño táctico también inflige 1 punto de daño Estándar al personaje que está dentro. Este daño penetrante se triplica si el traje es un exotraje.

## Tablas de Equipo

### Blindaje Personal
| Objeto | Clasificaciones de Equipo | BAR (M/B/E/X) | Coste/Parche | Afiliación | Masa | Cobertura | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BLINDAJE FLAK** | C/A-A-A/B | 1/5/1/3 | —/— | — | — | — | — |
| Chaqueta | — | — | 100/10 | — | 3.5 KG | TORSO, BRAZOS | — |
| Pantalones | — | — | 75/10 | — | 5.5 KG | PIERNAS | — |
| Pantalones Cortos/Falda/Kilt | — | — | 100/10 | — | 3.5 KG | PIERNAS | +1 al AP del ATAQUE |
| Traje | — | — | 150/10 | — | 8.6 KG | TORSO, BRAZOS, PIERNAS | — |
| Chaleco | — | — | 50/10 | — | 2.8 KG | TORSO | — |
| **BLINDAJE ABLATIVO** | D/A-B-A/C | 3/1/6/1 | —/— | — | — | — | — |
| Chaqueta | — | — | 750/10 | — | 2.6 KG | TORSO, BRAZOS | — |
| Pantalones | — | — | 500/10 | — | 4 KG | PIERNAS | — |
| Pantalones Cortos/Falda/Kilt | — | — | 750/20 | — | 2.5 KG | PIERNAS | +1 al AP del ATAQUE |
| Traje | — | — | 1,000/20 | — | 6.3 KG | TORSO, BRAZOS, PIERNAS | — |
| Chaleco | — | — | 400/20 | — | 2.1 KG | TORSO | — |
| **BLINDAJE ABLATIVO/FLAK** | D/B-C-B/C | 2/4/5/2 | —/— | — | — | — | — |
| Chaqueta | — | — | 600/15 | — | 4.1 KG | TORSO, BRAZOS | — |
| Pantalones | — | — | 400/15 | — | 6.3 KG | PIERNAS | — |
| Pantalones Cortos/Falda/Kilt | — | — | 750/20 | — | 4.2 KG | PIERNAS | +1 al AP del ATAQUE |
| Traje | — | — | 800/15 | — | 9.8 KG | TORSO, BRAZOS, PIERNAS | — |
| Chaleco | — | — | 300/15 | — | 3.2 KG | TORSO | — |
| **PLACA BALÍSTICA** | D/C-C-C/D | 4/6/5/4 | —/— | — | — | — | NO SE PUEDE PARCHEAR SI ALGÚN BAR SE REDUCE A LA MITAD |
| Traje | — | — | 1,600/50 | — | 22 KG | TORSO, BRAZOS, PIERNAS | CARGA |
| Chaleco | — | — | 600/50 | — | 8.8 KG | TORSO | — |
| **NEO-COTA DE MALLA** | D/X-X-C/D | 3/3/2/2 | —/— | — | — | — | OCULTABLE |
| Chaqueta (sin capucha) | — | — | 700/17 | — | 1.9 KG | TORSO, BRAZOS | — |
| Chaqueta (con capucha) | — | — | 830/17 | — | 2.1 KG | TORSO, BRAZOS, CABEZA | — |
| Pantalones | — | — | 450/17 | — | 2.8 KG | PIERNAS | — |
| Pantalones Cortos/Falda/Kilt | — | — | 375/17 | — | 1.8 KG | PIERNAS | +1 al AP del ATAQUE |
| Traje | — | — | 920/17 | — | 4.7 KG | TORSO, BRAZOS, PIERNAS | — |
| Chaleco | — | — | 375/17 | — | 1.7 KG | TORSO | — |
| **BLINDAJE DE MIÓMERO** | E/X-X-E/E | 3/5/4/5 | —/— | LA | — | — | OCULTABLE; REQUIERE MICRO-POWER PACK HC (0.5 PUNTOS POR MINUTO ACTIVO); LA MITAD DEL BAR CUANDO ESTÁ INACTIVO (REDONDEAR HACIA ABAJO) |
| Traje | — | — | 5,800/150 | — | 18 KG | TORSO, BRAZOS, PIERNAS | CARGA |
| Chaleco | — | — | 1,800/150 | — | 7.5 KG | TORSO | — |
| **BLINDAJE OCULTO** | — | — | —/— | NO CLAN | — | — | OCULTABLE; –4 A TIRADAS DE PERCEPCIÓN, –2 A TIRADAS DE OPERACIONES DE SENSORES PARA DETECTARLO BAJO LA ROPA. |
| Flak Oculto | D/D-C-B/C | 1/4/1/2 | X1.5 | — | X0.75 | — | CHALECO, CHAQUETA, PANTALONES O TRAJE |
| Ablativo Oculto | E/E-D-B/D | 2/1/4/1 | X1.5 | — | X0.75 | — | CHALECO, CHAQUETA, PANTALONES O TRAJE |
| Ab/Flak Oculto | E/F-D-C/D | 2/3/3/2 | X1.75 | — | X0.80 | — | CHALECO, CHAQUETA, PANTALONES O TRAJE |
| Placa Balística Oculta | E/X-F-D/D | 3/4/4/3 | X1.8 | — | X0.75 | — | CHALECO, CHAQUETA O TRAJE; +1 A TIRADAS DE DETECCIÓN |

### Accesorios de Blindaje de Combate
| Objeto | Clasificaciones de Equipo | BAR (M/B/E/X) | Coste/Parche | Afiliación | Masa | Cobertura | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CASCOS** | | | | | | | |
| Casco Flak | C/A-A-A/B | 1/5/1/3 | 25/10 | — | 1 KG | CABEZA | +0 a PERCEPCIÓN; BAR 2 vs. FLASH |
| Casco Ablativo | D/A-B-A/C | 3/1/6/1 | 200/20 | — | 800 G | CABEZA | +0 a PERCEPCIÓN; BAR 3 vs. FLASH |
| Casco Ablativo/Flak | D/B-C-B/C | 2/4/5/2 | 150/15 | — | 800 G | CABEZA | +0 a PERCEPCIÓN; BAR 3 vs. FLASH |
| Casco de Combate Estándar | C/A-A-A/B | 3/4/3/1 | 100/15 | — | 3 KG | CABEZA | –2 a PERCEPCIÓN; BAR 3 vs. FLASH |
| Casco de Combate Avanzado | D/D-C-B/C | 5/6/5/2 | 200/25 | — | 2 KG | CABEZA | –1 a PERCEPCIÓN; BAR 7 vs. FLASH; INCLUYE COM. MILITAR |
| **GUANTES** | | | | | | | |
| Guantes de Combate Pesado | E/D-F-E/C | 3/4/4/3 | 125/15 | — | 1 KG | MANOS | –1 a TIRADAS RELACIONADAS CON DEX |
| **BOTAS** | | | | | | | |
| Botas de Combate | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| Botas de Plasteel | D/D-F-C/A | 4/6/4/4 | 175/50 | — | 3 KG | PIES | — |
| **ESCUDOS*** | | | | | | | |
| Escudo Antidisturbios | C/B-B-B/B | 2/2/2/2 | 100 | — | 2 KG | — | PROPORCIONA COBERTURA TOTAL AGACHADO; INTEGRIDAD DE BARRERA: 5 |
| Escudo Antibalas | D/B-B-B/B | 4/4/4/4 | 300 | — | 4 KG | — | PROPORCIONA COBERTURA TOTAL AGACHADO; INTEGRIDAD DE BARRERA: 8 |
| Escudo Pesado | D/C-C-C/C | 6/6/6/6 | 500 | — | 6 KG | — | PROPORCIONA COBERTURA TOTAL AGACHADO; CARGA; INTEGRIDAD DE BARRERA: 12 |
| **EQUIPO DE SOPORTE DE CARGA**** | | | | | | | |
| Chaleco | B/A-A-A/A | 1/3/1/1 | 20 | — | 400 G | TORSO | +1 FUE (SOLO TRANSPORTE/CARGA) |
| Mochila | B/A-A-A/A | — | 10 | — | 100 G | — | +1 FUE (SOLO TRANSPORTE/CARGA); ACCIÓN SIMPLE PARA QUITAR; ACCIÓN COMPLEJA PARA PONER |
| Armazón de Mochila | C/A-A-A/A | — | 45 | — | 1 KG | — | +2 FUE (SOLO TRANSPORTE/CARGA); ACCIÓN COMPLEJA PARA PONER/QUITAR |
| **EQUIPO DE AGARRE** | | | | | | | |
| Botas de Agarre | E/E-E-E/B | 2/2/1/2 | 600 | LA | 5 KG | PIES | +2 a ESCALAR (+4 CON GUANTES DE AGARRE); REQUIERE POWER PACK ESTÁNDAR (1 PPM)† |
| Guantes de Agarre | E/E-E-E/C | 2/2/1/2 | 1,000 | LA | 1 KG | MANOS | +3 a ESCALAR (+4 CON BOTAS DE AGARRE); –2 a TODAS LAS DEMÁS TIRADAS RELACIONADAS CON DEX; +3 a TIRADAS DE FUE DONDE EL AGARRE ES UN FACTOR; REQUIERE POWER PACK ESTÁNDAR (1 PPM)† |
| Botas de Microganchos | D/D-F-D/B | — | 90 | — | 2 KG | PIES | +1 a ESCALAR (+3 CON GUANTES DE MICROGANCHOS); INEFECTIVO EN SUPERFICIES LISAS |
| Guantes de Microganchos | D/D-F-C/B | — | 100 | — | 400 G | MANOS | +2 a ESCALAR (+3 CON BOTAS DE MICROGANCHOS); INEFECTIVO EN SUPERFICIES LISAS |
| Vara de Arpeo | D/C-D-A/B | — | 500 | — | 3 KG | — | ALCANCE MÁX: 20M; DISPARAR COMO ARMA DE APOYO (SIN MOD. DE ALCANCE); EN ÉXITO, +3 A TIRADA DE ESCALAR PARA ASCENDER 20M EN UN TURNO; UN SOLO USO (50 C-BILLS PARA RECARGAR) |

*Los escudos no son blindaje personal per se, pero se tratan como objetos que usan las reglas de Blindaje de Barrera.
**Los modificadores de FUE para Equipo de Soporte de Carga se aplican solo a la capacidad de carga y a las reglas de Carga, no a las tasas de movimiento o a las acciones de combate cuerpo a cuerpo.
†PPM = Puntos de Potencia por Minuto

### Kits de Blindaje Estándar (Por Facción)
| Objeto | Clasificaciones de Equipo | BAR (M/B/E/X) | Coste/Parche | Afiliación | Masa | Cobertura | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CONFEDERACIÓN DE CAPELA** | | | | | | | |
| Casco | C/B-B-B/D | 3/4/5/3 | 200 | CC | 2 KG | CABEZA | INCLUYE COM. MILITAR; –1 A TIRADAS DE PERCEPCIÓN; AV 7 vs. FLASH |
| Traje | B/B-B-B/C | 3/4/3/2 | 200/10 | CC | 4.5 KG | TORSO, BRAZOS, PIERNAS | BAR 2/2/3/2 PARA BRAZOS Y PIERNAS |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| **CLANES (GENÉRICO)** | | | | | | | |
| Casco | E/E-E-E/F | 5/6/5/3 | 1,400 | CLAN | 1 KG | CABEZA | INCLUYE COM. MILITAR, ESCÁNER IR, VISIÓN NOCTURNA Y TELÉMETRO; REQUIERE MICRO POWER PACK HC (3 PPH); +1 A TIRADAS DE PERCEPCIÓN; AV 8 VS. FLASH |
| Traje | E/E-E-E/F | 3/6/5/3 | 4,000/150 | CLAN | 6 KG | TORSO, BRAZOS, PIERNAS | — |
| Botas | C/E-E-E/F | 3/5/5/3 | 100/20 | CLAN | 2 KG | PIES | — |
| Guantes | C/E-E-E/F | 1/1/3/2 | 60 | CLAN | 0.5 KG | MANOS | — |
| **COMSTAR/PALABRA DE BLAKE** | | | | | | | |
| Casco | F/D-D-D/F | 4/5/5/3 | 1,200 | CS | 2 KG | CABEZA | INCLUYE COM. MILITAR, ESCÁNER IR, VISIÓN NOCTURNA, TELÉMETRO Y DETECTOR ULTRASÓNICO (ALCANCE 5M); REQUIERE MICRO POWER PACK HC (3 PPH); +1 A TIRADAS DE PERCEPCIÓN; AV 8 VS. FLASH |
| Traje | D/E-E-E/E | 4/6/5/4 | 3,000/120 | CS | 8 KG | TORSO, BRAZOS, PIERNAS | — |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| Guantes | B/A-A-A/A | 1/1/1/1 | 30 | — | 0.5 KG | MANOS | — |
| **COMBINADO DRACONIS / REPÚBLICA LIBRE DE RASALHAGUE** | | | | | | | |
| Casco | C/B-B-B/D | 3/4/4/2 | 200 | DC/FR | 1 KG | CABEZA | INCLUYE COM. MILITAR; AV 7 VS. FLASH |
| Traje | B/B-B-B/C | 2/2/3/1 | 100/8 | DC/FR | 5 KG | TORSO, BRAZOS, PIERNAS | — |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| Guantes | B/A-A-A/A | 1/1/1/1 | 30 | — | 0.5 KG | MANOS | — |
| **SOLES FEDERADOS** | | | | | | | |
| Casco | C/B-B-B/D | 4/5/5/4 | 500 | FS | 1.5 KG | CABEZA | INCLUYE COM. MILITAR, ESCÁNER IR Y TELÉMETRO; REQUIERE MICRO POWER PACK HC (2 PPH); –1 A TIRADAS DE PERCEPCIÓN; AV 7 VS. FLASH |
| Chaqueta | B/B-B-B/C | 3/5/4/3 | 450/10 | FS | 5 KG | TORSO, BRAZOS | 1/2/2/1 PARA BRAZOS |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| Guantes | A/B-B-B/B | 2/2/2/2 | 40 | FS | 1 KG | MANOS | — |
| **LIGA DE MUNDOS LIBRES** | | | | | | | |
| Casco | C/B-B-B/D | 4/4/4/3 | 250 | FW | 1 KG | CABEZA | INCLUYE COM. MILITAR, ESCÁNER IR; REQUIERE MICRO POWER PACK HC (1 PPH); –1 A TIRADAS DE PERCEPCIÓN; AV 7 VS. FLASH |
| Traje | B/B-B-B/D | 5/6/4/3 | 1,500/30 | FW | 15 KG | TORSO, BRAZOS, PIERNAS | CARGA; 3/4/2/1 PARA BRAZOS Y PIERNAS |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 3 KG | PIES | — |
| Guantes | B/A-A-A/A | 1/1/1/1 | 30 | — | 0.5 KG | MANOS | — |
| **ALIANZA LIRANA** | | | | | | | |
| Casco | C/B-B-B/D | 4/6/6/4 | 300 | LA | 1.2 KG | CABEZA | INCLUYE COM. MILITAR, ESCÁNER IR Y VISIÓN NOCTURNA; REQUIERE MICRO POWER PACK HC (1 PPH); –1 A TIRADAS DE PERCEPCIÓN; AV 7 VS. FLASH |
| Chaqueta | B/B-B-B/D | 3/5/4/3 | 350/10 | LA | 3.5 KG | TORSO, BRAZOS | 2/4/3/2 PARA BRAZOS |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| Guantes | B/A-A-A/A | 1/1/1/1 | 30 | — | 0.5 KG | MANOS | — |
| **MAGISTRADO DE CANOPUS** | | | | | | | |
| Casco | C/B-B-B/D | 5/6/5/2 | 250 | MC | 1 KG | CABEZA | INCLUYE COM. MILITAR Y TELÉMETRO; REQUIERE MICRO POWER PACK HC (1 PPH); –2 A TIRADAS DE PERCEPCIÓN; AV 7 VS. FLASH |
| Chaleco | C/A-A-A/B | 1/5/2/3 | 75/10 | MC | 3 KG | TORSO | — |
| Botas | B/A-A-A/A | 2/3/3/1 | 48/10 | — | 2 KG | PIES | — |
| Guantes | B/A-A-A/A | 1/1/1/1 | 30 | — | 0.5 KG | MANOS | — |

### Kits de Combate Especiales
| Objeto | Clasificaciones de Equipo | BAR (M/B/E/X) | Coste/Parche | Afiliación | Masa | Cobertura | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **KIT DE PILOTO DE CAZA AEROESPACIAL** | | | | | | | |
| Traje de Vuelo de Combate | C/B-C-B/B | 2/3/2/2 | 3,000/300 | — | 7 KG | TORSO, BRAZOS, PIERNAS | PUEDE SER SELLADO EN ENTORNOS HOSTILES (CON GUANTES, BOTAS Y CASCO DE PILOTO; PROPORCIONA 48 HORAS DE SOPORTE VITAL)* |
| Neurocasco de Piloto | C/B-C-B/B | 2/3/2/2 | 1,200 | — | 5 KG | CABEZA | PUEDE SER SELLADO (CON TRAJE DE VUELO DE COMBATE); AV 10 VS. FLASH** |
| Guantes de Vuelo | A/A-A-A/A | — | 20 | — | 0.5 KG | MANOS | REQUERIDO PARA SELLAR EL TRAJE DE VUELO DE COMBATE |
| Botas | B/A-A-A/A | 2/3/3/1 | 55/15 | — | 3 KG | PIES | REQUERIDO PARA SELLAR EL TRAJE DE VUELO DE COMBATE |
| **OTROS KITS DE COMBATE ESPECIALES** | | | | | | | |
| Traje Espacial de Combate | D/E-E-E/E | 1/5/1/3 | 7,000/15 | — | 14 KG | COMPLETO | CARGA; PUEDE SER SELLADO EN ENTORNOS HOSTILES (PROPORCIONA 48 HORAS DE SOPORTE VITAL); AV 8 VS. FLASH |
| Traje de Combate Marino | D/D-D-D/D | 4/5/5/2 | 15,000/100 | — | 20 KG | COMPLETO | +2 A OPERACIONES CERO-G; PUEDE SER SELLADO EN ENTORNOS HOSTILES (PROPORCIONA 18 HORAS DE SOPORTE VITAL); AV 10 VS. FLASH |
| Blusón de Tanquista | C/B-C-B/C | 3/5/5/3 | 275/30 | — | 7.5 KG | TORSO | REEMPLAZA EL BLINDAJE DE TORSO EN ATUENDO DE INFANTERÍA ESTÁNDAR; INCORPORA SISTEMAS DE REFRIGERACIÓN* |

*Si un Chaleco/Traje de Refrigeración, Traje de Vuelo o Blusón de Tanquista se reduce a un BAR de 0 en cualquier categoría, pierde su funcionalidad de refrigeración; tratar la unidad como si hubiera sufrido un impacto crítico de Soporte Vital.
**Los neurocascos son necesarios para operar de forma segura BattleMechs, IndustrialMechs y cazas aeroespaciales. Sin un neurocasco, el piloto sufre un modificador de –6 a la tirada de habilidad de Pilotaje, y debe hacer tiradas de habilidad de Pilotaje incluso al girar caminando.

### Blindaje Exótico
| Objeto | Clasificaciones de Equipo | BAR (M/B/E/X) | Coste/Parche | Afiliación | Masa | Cobertura | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Bogu (Blindaje de práctica de Kendo) | B/C-C-C/A | 2/1/0/1 | 75/5 | DC | 7 KG | COMPLETO | –1 a TIRADAS DE PERCEPCIÓN |
| Oyoroi (Antiguo) | A/F-F-F/A | 3/1/1/2 | 50,000/100 | DC | 20 KG | COMPLETO | –2 a PERCEPCIÓN; CARGA |
| Oyoroi (Moderno) | D/E-E-E/B | 4/5/4/4 | 2,000/50 | DC | 23 KG | COMPLETO | –2 a PERCEPCIÓN; CARGA |
| Armadura de Caballero (Antigua) | A/F-F-F/A | 3/1/1/2 | 49,000/100 | — | 19.5 KG | COMPLETO | –2 a PERCEPCIÓN; CARGA |
| Armadura de Caballero (Moderna) | C/E-F-E/B | 4/5/3/3 | 2,400/55 | — | 22 KG | COMPLETO | –2 a PERCEPCIÓN; CARGA |
