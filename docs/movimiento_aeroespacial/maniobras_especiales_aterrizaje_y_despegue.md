# Maniobras Especiales (Aterrizaje y Despegue)

Este documento resume las reglas para el aterrizaje y despegue de unidades aeroespaciales, diferenciando entre las Reglas Estándar de **Total Warfare** y las Reglas Avanzadas de **Strategic Operations**. Las maniobras se dividen principalmente en horizontales (que requieren una pista) y verticales (que son más directas pero a menudo más arriesgadas). Las reglas avanzadas introducen una mayor complejidad con conceptos como el estado del motor (frío, caliente, tibio), listas de comprobación pre-vuelo, uso de combustible y maniobras especiales como aterrizajes en agua.

## Reglas Estándar (Total Warfare)

### Aterrizaje

Una unidad que comienza su fase de movimiento a una altitud por encima del terreno puede intentar aterrizar. Esta maniobra reemplaza su movimiento normal del turno.

#### Aterrizaje Vertical
- **Unidades:** Obligatorio para unidades esferoides. Opcional para cazas convencionales con VSTOL y todos los cazas aeroespaciales.
- **Espacio:** Requiere menos espacio que el aterrizaje horizontal.
- **Daño al Terreno:** Un DropShip que aterriza verticalmente en un hexágono no pavimentado, de carretera o de agua, reduce en 1 el nivel del hexágono de aterrizaje y de los seis adyacentes. Los edificios se convierten en escombros y los bosques en terreno irregular.
- **Modificadores:** Los modificadores de terreno en la **Tabla de Modificadores de Aterrizaje** se reducen a la mitad (redondeando hacia abajo).

#### Aterrizaje Horizontal
- **Unidades:** Obligatorio para cazas convencionales (sin VSTOL), naves pequeñas aerodinas y DropShips aerodinos.
- **Pista Requerida:** Requiere una pista de aterrizaje (superficie plana y continua sin cambios de nivel, edificios u otras unidades).
  - **DropShip:** 3 hexágonos de ancho y 15 de largo.
  - **Cazas/Naves Pequeñas:** 1 hexágono de ancho y 8 de largo.
  - **Cazas con VSTOL:** 5 hexágonos de largo.
- **Maniobra de Frenado (DropShips Aerodinos):** Pueden intentar reducir la distancia de aterrizaje a la mitad. Requiere una Tirada de Control con un modificador de +4. Si falla, se consulta la **Tabla de Maniobra de Frenado Fallida**.

#### Tirada de Aterrizaje
- Se debe realizar una Tirada de Control aplicando los modificadores de la **Tabla de Modificadores de Aterrizaje**.
- **Éxito:** La unidad aterriza de forma segura.
- **Fallo:** La unidad sufre 10 puntos de daño a escala estándar en el morro (o en la popa para esferoides) por cada punto del Margen de Fallo (MoF).

#### Estado en Tierra
- **DropShips:** Ocupan el hexágono central y los seis adyacentes.
- **Cazas y Naves Pequeñas:** Ocupan un solo hexágono.

### Despegue

#### Despegue Horizontal
- **Unidades:** DropShips aerodinos, cazas y naves pequeñas.
- **Pista Requerida:** 20 hexágonos despejados o pavimentados en línea continua sin cambios de nivel. Las unidades con VSTOL necesitan 10 hexágonos.
- **Coste:** 2 Puntos de Empuje. No se requiere Tirada de Control.
- **Resultado:** La unidad se coloca en el mapa atmosférico con Velocidad 1.

#### Despegue Vertical
- **Unidades:** Cazas aeroespaciales y cazas convencionales con VSTOL. Naves pequeñas y DropShips aerodinos solo en vacío. Unidades esferoides deben despegar verticalmente.
- **Tirada:** Requiere una Tirada de Control con modificadores de la **Tabla de Modificadores de Despegue Vertical**.
- **Fallo:** Se consulta la **Tabla de Maniobra de Despegue Fallida**.

#### Rodaje (Taxiing)
- Las unidades aeroespaciales en tierra se consideran vehículos de ruedas para el movimiento, con un MP de Crucero igual a la mitad de su Empuje Seguro (redondeando hacia abajo).

#### Daño por Proximidad
- El escape de un DropShip al aterrizar o despegar causa un daño inmenso a las unidades cercanas. El daño se determina según la **Tabla de Daño por Escape de DropShip**.

### Tablas (Reglas Estándar)

**Tabla de Modificadores de Aterrizaje**
| Condición | Modificador |
|---|---|
| La unidad tiene propulsores dañados | +4 |
| La unidad está fuera de control | Fallo automático (asumir MoF de 10) |
| Aterrizaje vertical | +1 por punto de Velocidad sobre 1 |
| Aterrizaje horizontal | +1 por punto de Velocidad sobre 2 |
| Tren de aterrizaje dañado | +5 |
| Blindaje del morro destruido (cazas y aerodinos) | +2 |
| Empuje reducido al 50% o menos | +2 |
| Sin empuje disponible (aerodino) | +4 |
| Sin empuje disponible (esferoide)* | +8 |
| Pista demasiado corta para la unidad | +2 |
| Modificadores de Terreno | Varía de -2 a +5 |

**Tabla de Maniobra de Frenado Fallida**
| Margen de Fallo | Efecto |
|---|---|
| 1-4 | El aterrizaje requiere la distancia completa. Se puede intentar aterrizar normalmente o abortar. |
| 5 | La unidad debe aterrizar. Se añade +1 al número objetivo de la Tirada de Control de aterrizaje. |
| 6+ | La unidad debe aterrizar y requiere 20 hexágonos de pista. Sufre 20 puntos de daño en el morro y el tren de aterrizaje queda destruido. Se añade +2 al número objetivo de la Tirada de Control de aterrizaje. |

**Tabla de Modificadores de Despegue Vertical**
| Condición | Modificador |
|---|---|
| Tren de aterrizaje dañado | +1 |
| Propulsores de maniobra dañados | +3 |
| Despegue desde un cráter | +3 |
| Despegue desde un aeródromo o pista | -1 |
| Unidad no esferoide realizando despegue vertical | +2 |

**Tabla de Maniobra de Despegue Fallida**
| Margen de Fallo | Efecto |
|---|---|
| 1-2 | La unidad despega. Tren de aterrizaje dañado. |
| 3-4 | Tren de aterrizaje dañado. Se requiere una Tirada de Control adicional sin modificadores. Si tiene éxito, despega. Si falla, cae al suelo sufriendo 20 puntos de daño a escala estándar en la sección de popa. |
| 5 | El tren de aterrizaje está dañado y la unidad golpea el suelo, causando 50 puntos de daño a escala estándar en la sección de popa. |
| 6+ | El tren de aterrizaje está dañado y la unidad golpea el suelo, causando 100 puntos de daño a escala estándar en la sección de popa. |

**Tabla de Daño por Escape de DropShip**
| Distancia | Daño |
|---|---|
| Mismo Hex | Destruido |
| 1 Hex | 12D6 |
| 2 Hexes | 10D6 |
| 3 Hexes | 8D6 |
| 4 Hexes | 6D6 |
| 5 Hexes | 4D6 |
| 6 Hexes | 2D6 |

## Reglas Avanzadas (Strategic Operations)

### Estado de los Sistemas

#### Lista de Comprobación Pre-vuelo (Preflight Check List)
- Antes de cambiar el estado del motor, se debe completar una comprobación. El tiempo requerido depende del tonelaje de la unidad:
  - **≤ 200 toneladas:** 45 turnos de tierra (7.5 minutos)
  - **201 a 5,000 toneladas:** 90 turnos de tierra (15 minutos)
  - **5,001 a 10,000 toneladas:** 180 turnos de tierra (30 minutos)
  - **≥ 10,001 toneladas:** 270 turnos de tierra (45 minutos)
- **Despegue Anticipado:** Requiere una Tirada de Control automática con un modificador acumulativo de +1 por cada 30 turnos de tierra (5 minutos) por debajo del tiempo requerido. Un fallo se consulta en la **Tabla de Lista de Comprobación Pre-vuelo Fallida**.

#### Estado del Motor
- **Frío (Cold):** Motor completamente apagado. El tiempo para despegar es de 90 turnos (Naves Grandes) o 45 turnos (Cazas/Naves Pequeñas).
- **Tibio (Warm):** Sistemas parcialmente calientes. El tiempo para despegar es de 30 turnos (Naves Grandes) o 15 turnos (Cazas/Naves Pequeñas).
- **Caliente (Hot):** Motor al ralentí. El despegue es instantáneo.

### Uso de Combustible para Aterrizaje y Despegue
- **Lanzamiento desde bahías:** 0 combustible/empuje.
- **Aterrizaje horizontal rodado:** Sin coste extra de combustible/empuje.
- **Aterrizaje vertical:** 1 Punto de Empuje y 1 punto de combustible por cada 0.5 Gs de gravedad local (redondeado hacia arriba).
- **Despegue horizontal rodado:** 2 Puntos de Empuje.
- **Despegue vertical:** 1 Punto de Empuje y 1 punto de combustible por cada 0.5 Gs de gravedad local (redondeado hacia arriba).

### Aterrizaje y Despegue Vertical (Aerodinos)
- Las unidades aerodinas pueden intentar aterrizajes y despegues verticales en atmósfera, tratándolas como esferoides pero con modificadores adicionales.
- **Aterrizaje:** Se añade un modificador de +1 (DropShips aerodinos) o +2 (naves pequeñas aerodinas) a la Tirada de Control. Se requiere una segunda Tirada de Control con un modificador de +2. Un fallo añade 1D6 de daño a escala capital por MoF. Un éxito resta 6 de daño a escala capital por MoS.
- La unidad sufre daño automático basado en su tonelaje según la **Tabla de Daño por Clase de Tamaño**.

### Aterrizaje y Despegue en Agua
- Las unidades pueden aterrizar en hexágonos de agua de Profundidad 1 o mayor.
- **Aterrizaje Horizontal:** Si más de 1/4 de la pista es agua, se considera un accidente. El daño se multiplica por 10. Se tira 1D6 para determinar la orientación (1-3 boca arriba, 4-6 boca abajo).
- **Aterrizaje Vertical:** Se realiza una Tirada de Control. El daño se basa en la **Tabla de Daño por Clase de Tamaño** y se modifica por las **Condiciones Atmosféricas** y el resultado de la tirada.

### Tablas (Reglas Avanzadas)

**Tabla de Lista de Comprobación Pre-vuelo Fallida**
| Tirada 2D6 | Efecto |
|---|---|
| 2-5 | Sin Efecto |
| 6-7 | +1 modificador a todas las Tiradas de Control |
| 8-9 | +2 modificador a todas las Tiradas de Control, +1 a las Tiradas de Ataque de Armas |
| 10-11 | Determinar aleatoriamente una columna y localización en la Tabla de Localización de Impacto y aplicar ese daño crítico |
| 12 | Determinar aleatoriamente una columna y localización dos veces y aplicar ambos daños críticos |

**Tabla de Daño por Clase de Tamaño (Todo el daño en Escala Capital)**
| Tonelaje de la Unidad | Daño* |
|---|---|
| 0 a 500 toneladas | 8 + 1D6 |
| 501 a 5,000 toneladas | 14 + 2D6 |
| 5,001 a 10,000 toneladas | 18 + 3D6 |
| 10,001 a 20,000 toneladas | 24 + 4D6 |
| 20,001 a 35,000 toneladas | 30 + 5D6 |

*Añadir 1D6 de daño si la unidad realiza un aterrizaje vertical.

**Tabla de Condiciones Atmosféricas**
| Presión Atmosférica | Modificador |
|---|---|
| Vacío | Sin Daño |
| Rastro | Multiplicar Daño por .5 |
| Fina | Multiplicar Daño por .75 |
| Estándar | Sin Modificador |
| Alta | Sin Modificador |
| Muy Alta | Multiplicar Daño por 1.25 |
| Despegue en Agua | Multiplicar Daño por 1.25 |
