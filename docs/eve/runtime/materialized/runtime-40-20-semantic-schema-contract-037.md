# Runtime 40/20 Semantic Schema Contract 037

Estado: LOCAL_RECTOR_CONFORMANCE_SCHEMA_CONTRACT

## Organos semanticos

| Organo | Campos | Materialidad previa |
|---|---|---|
| `public.runtime_branching_rule` | `opens_nodes`, `closes_nodes` | `specification_only` |
| `public.runtime_epistemic_rule` | `mutual_exclusion_policy`, `free_text_weight`, `fatigue_policy`, `must_not_infer`, `confirmation_weight` | `specification_only` |
| `public.runtime_variable_map` | `canonical_variables`, `required_variables`, `derived_variables`, `optional_variables`, `can_be_inferred_from` | `specification_only` |

## Identidad de fila

`(catalog_version_id, runtime_interaction_id, field_name)` porque la cardinalidad singleton fue demostrada desde 031C.

## Columnas minimas

- `catalog_version_id`
- `runtime_interaction_id`
- `field_name`
- `raw_literal`
- `source_file`
- `source_sheet`
- `source_row`
- `source_column`
- `trace_id`
- `source_checksum`

## Politica legacy

`legacy_typed_columns_not_authoritative_for_full_catalog`: las doce columnas legacy en `runtime_interaction_def` permanecen fisicamente sin cambios, quedan NULL para la fixture full catalog local y no son autoridad semantica para el catalogo completo.

## Cardinalidad por campo

| Campo | Con literal | Sin literal | Multiplicidad |
|---|---:|---:|---:|
| `opens_nodes` | 60 | 0 | 0 |
| `closes_nodes` | 60 | 0 | 0 |
| `mutual_exclusion_policy` | 60 | 0 | 0 |
| `free_text_weight` | 60 | 0 | 0 |
| `fatigue_policy` | 60 | 0 | 0 |
| `must_not_infer` | 60 | 0 | 0 |
| `confirmation_weight` | 60 | 0 | 0 |
| `canonical_variables` | 60 | 0 | 0 |
| `required_variables` | 60 | 0 | 0 |
| `derived_variables` | 60 | 0 | 0 |
| `optional_variables` | 60 | 0 | 0 |
| `can_be_inferred_from` | 60 | 0 | 0 |

## Restricciones de representacion

- Sin booleanizacion.
- Sin numerizacion de pesos.
- Sin tokenizacion de listas.
- Sin AST.
- Sin aliases.
- Sin fuzzy matching.
- Sin referencias normalizadas todavia.
