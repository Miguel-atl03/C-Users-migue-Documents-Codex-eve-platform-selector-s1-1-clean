# Runtime 40/20 Semantic Schema Validation 037

Estado: `passed`

## Base local desechable

- contenedor: `supabase_db_eve-platform`
- base: `eve_semantic_037_local`
- client_encoding: `UTF8`
- contacto remoto: no

## Resultados

| Control | Resultado |
|---|---|
| `apply_local_passed` | `True` |
| `rollback_local_passed` | `True` |
| `reapply_local_passed` | `True` |
| `three_tables_created` | `True` |
| `zero_semantic_tables_additional` | `True` |
| `round_trip_exact_raw_literal` | `True` |
| `expected_records` | `720` |
| `inserted_records` | `720` |
| `record_difference` | `0` |

## Conteo por campo

| Campo | Esperado/insertado | Diferencia |
|---|---:|---:|
| `opens_nodes` | 60 | 0 |
| `closes_nodes` | 60 | 0 |
| `mutual_exclusion_policy` | 60 | 0 |
| `free_text_weight` | 60 | 0 |
| `fatigue_policy` | 60 | 0 |
| `must_not_infer` | 60 | 0 |
| `confirmation_weight` | 60 | 0 |
| `canonical_variables` | 60 | 0 |
| `required_variables` | 60 | 0 |
| `derived_variables` | 60 | 0 |
| `optional_variables` | 60 | 0 |
| `can_be_inferred_from` | 60 | 0 |

## Constraints negativas

| Constraint | Resultado |
|---|---|
| `version_fk_rejects_nonexistent_root` | `True` |
| `interaction_fk_rejects_nonexistent_interaction` | `True` |
| `semantic_duplicate_rejected` | `True` |
| `field_name_outside_organ_rejected` | `True` |
| `weight_outside_bajo_medio_alto_rejected` | `True` |
| `incomplete_provenance_rejected` | `True` |

## Transformaciones semanticas

- splits: 0
- AST: 0
- booleanizaciones: 0
- numeric weights: 0
- aliases: 0
- fuzzy matching: 0

## Legacy

`legacy_typed_columns_not_authoritative_for_full_catalog`; las filas full catalog de fixture tienen las 12 columnas legacy en NULL explicito.

## Clasificacion final

semantic_schema_materialized_local_only

## Brecha siguiente

catalogloader_minimal_implementation_authorized

## Typecheck y build

- typecheck: passed
- build: passed
