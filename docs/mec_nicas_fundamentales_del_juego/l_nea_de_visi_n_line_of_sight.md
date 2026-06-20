# Línea de Visión (Line of Sight)

## Línea de Visión (Line of Sight - LOS)

La Línea de Visión (LOS) es un concepto fundamental en BattleTech que determina si una unidad puede atacar a otra. Se define como una línea recta ininterrumpida desde el centro del hexágono del atacante hasta el centro del hexágono del objetivo. Diversos factores, como el terreno, la elevación y las características de las unidades, pueden obstruir esta línea.

### Determinación de la Línea de Visión

*   Se traza una línea recta desde el centro del hexágono de la unidad atacante hasta el centro del hexágono de la unidad objetivo.
*   Cualquier hexágono por el que pase esta línea se considera que está en la LOS.
*   Los hexágonos del atacante y del objetivo **no** se consideran para determinar si el terreno interviene.
*   Si la LOS pasa exactamente entre dos hexágonos, el jugador que controla la **unidad objetivo** decide por cuál de los dos hexágonos pasa la LOS para esa fase de ataque.

### Niveles y Altura

La altura de las unidades y del terreno es crucial para determinar la LOS. La altura se mide en niveles.

**Altura del Terreno y Rasgos:**
*   **Colinas:** La altura está indicada por su número de nivel en el mapa.
*   **Bosques:** Se elevan 2 niveles por encima del nivel del hexágono que ocupan.
*   **Edificios:** Se elevan un número de niveles igual a su nivel listado, por encima del nivel del hexágono que ocupan. (Ej: un edificio de Nivel 2 en una colina de Nivel 4 alcanza una altura total de Nivel 6).
*   **Agua:** La superficie del agua está al nivel del hexágono. El fondo está al nivel del hexágono menos su profundidad. (Ej: un río de Profundidad 2 en un hexágono de Nivel 3 tiene su superficie en Nivel 3 y su lecho en Nivel 1).

**Altura de Unidades:**
La altura de una unidad para propósitos de LOS es el nivel de su hexágono más la altura de la unidad misma.

| Tipo de Unidad | Altura | Notas |
| :--- | :--- | :--- |
| 'Mech | 2 niveles | Un 'Mech de pie. |
| 'Mech (Tumbado) | 1 nivel | Un 'Mech tumbado (prone). |
| ProtoMechs, Vehículos, Infantería, Cazas | 1 nivel | - |
| Submarinos | 1 profundidad | Se resta de la superficie del agua. |
| Vehículos de Apoyo Grandes y Naves Pequeñas | 2 niveles | - |
| Naves de Descenso (Aerodyne) | 5 niveles | Cuando están en tierra. |
| Naves de Descenso (Spheroid) | 10 niveles | Cuando están en tierra. |

### Terreno Interviniente

Un terreno o rasgo a lo largo de la LOS (excluyendo los hexágonos del atacante y objetivo) interviene si se cumple **una** de las siguientes condiciones:

1.  El nivel del terreno/rasgo es **igual o mayor** que el nivel de **ambas** unidades.
2.  El terreno/rasgo es **adyacente al atacante** y su nivel es **igual o mayor** que el nivel del atacante.
3.  El terreno/rasgo es **adyacente al objetivo** y su nivel es **igual o mayor** que el nivel del objetivo.

**Efectos del Terreno Interviniente (Bloqueo de LOS):**
*   **Colinas y Edificios:** Un hexágono de colina o edificio interviniente bloquea la LOS.
*   **Bosques Ligeros:** Tres o más hexágonos de bosques ligeros intervinientes bloquean la LOS.
*   **Bosques Pesados:** Dos o más hexágonos de bosques pesados intervinientes bloquean la LOS.
*   **Combinación de Bosques:** Un hexágono de bosque pesado combinado con uno o más de bosque ligero bloquea la LOS.
*   **Agua:** Un hexágono de agua interviniente bloquea la LOS, a menos que tanto el atacante como el objetivo estén completamente sumergidos.
*   **Otras Unidades:** Generalmente no bloquean la LOS, con la excepción de las Naves de Descenso (DropShips) en tierra.

### Casos Especiales

**Cobertura Parcial (Solo para 'Mechs de pie):**
Un 'Mech de pie recibe cobertura parcial si:
1.  Es adyacente a un hexágono que está un nivel por encima del hexágono que ocupa el 'Mech.
2.  Dicho hexágono interviniente se encuentra entre el atacante y el 'Mech.
3.  El nivel de LOS del atacante es igual o inferior al nivel de LOS del 'Mech defensor (disparar desde una posición más alta anula la cobertura parcial).
*   **Efecto:** Añade un modificador de **+1** para ser impactado. Si un impacto de arma alcanza una pierna, en su lugar golpea la cobertura.

**Hexágonos de Agua:**
*   Un 'Mech de pie en agua de **Profundidad 1** recibe **cobertura parcial**.
*   Un 'Mech en agua de **Profundidad 2 o más** (o tumbado en Profundidad 1) tiene la LOS completamente bloqueada hacia y desde unidades que no estén bajo el agua.