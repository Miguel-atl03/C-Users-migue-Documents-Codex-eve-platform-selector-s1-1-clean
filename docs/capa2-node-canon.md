# Capa 2 - Canon de nodos causal/MMABP

## Decision adoptada

La Capa 2 usa como identificador canonico estable la numeracion del motor MMABP de 13 nodos. La numeracion usada en el MVP previo (`N2`, `N3`, `N4`, `N5`) queda conservada solo como codigo legacy/comercial para interpretar salidas antiguas.

## Mapa canonico

| node_code_canonical | nombre canonico | desacople MMABP | legacy_mvp_code | estado MVP |
| --- | --- | --- | --- | --- |
| `N02` | Brecha Intencional | `PM <-> PF` | - | preparado, no activo |
| `N03` | Anarquia Operacional | `MoC <-> PF` | `N5` | activo |
| `N04` | Violacion Causal | `PF <-> OLC` | `N4` | activo |
| `N06` | Tortura Causal | `PF <-> OLC` | `N2` | activo |
| `N10` | Promesa Imposible | `PM <-> PF <-> OLC` | `N3` | activo |
| `N13` | Incoherencia Total | `PM <-> MoC <-> PF <-> OLC` | - | preparado, no activo |

## Reglas MVP activas

| rule_id | nodo canonico | nombre |
| --- | --- | --- |
| `R-N03-ANARQUIA-OPERACIONAL-MVP` | `N03` | Anarquia Operacional |
| `R-N04-VIOLACION-CAUSAL-MVP` | `N04` | Violacion Causal |
| `R-N06-TORTURA-CAUSAL-MVP` | `N06` | Tortura Causal |
| `R-N10-PROMESA-IMPOSIBLE-MVP` | `N10` | Promesa Imposible |

## Compatibilidad

Los outputs nuevos incluyen:

- `node_code_canonical`: codigo MMABP canonico.
- `node_name_canonical`: nombre canonico.
- `node_name_commercial`: nombre narrativo/comercial cuando aplica.
- `legacy_mvp_code`: codigo usado por el MVP previo.
- `motor_node_reference.mmabpNodeNumber`: numero MMABP.
- `motor_node_reference.mmabpDecoupling`: desacople MMABP formal.
- `motor_node_reference.legacyMvpCode`: equivalencia con salidas anteriores.

`root_node_probable` se conserva por compatibilidad de contrato, pero debe leerse junto con `root_node_probable_within_mvp_scope`, porque el MVP solo evalua `N03`, `N04`, `N06` y `N10`.
