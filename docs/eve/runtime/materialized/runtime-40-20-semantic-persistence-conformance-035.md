# Runtime 40/20 Semantic Persistence Conformance 035

Estado: PROPOSED_FOR_GOVERNANCE_APPROVAL

## Fuentes verificadas
- `runtime_xlsx_sha256`: `5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0`
- `mother_catalog_xlsx_sha256`: `09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2`
- `identity_rule_sha256`: `4a2a1a2367e53202094b483e707c805194699bb9fd1de38046db30f1b4200468`
- `spec_docx_sha256`: `b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8`
- `matrix_sha256`: `1936369a01dcf46d8453d48788685055234b3ce2daf0ffa179a204f4076950e5`
- `marco_sha256`: `cc95b80a869f37d56c7f23a88761a60acf9a5462bf795c37ea50856543263090`

## Materialidad de organos
| Organo | Estado | Evidencia |
| --- | --- | --- |
| `runtime_branching_rule` | `specification_only` | Only historical eve_runtime_branching_rule and runtime_branching_rule_ref services/tests found; no public.runtime_branching_rule table in 027/028 or current public runtime schema. |
| `runtime_epistemic_rule` | `specification_only` | Declared as logical destination in spec; no implemented public.runtime_epistemic_rule table/repository/RPC found. |
| `runtime_variable_map` | `specification_only` | Declared as logical destination in spec; current repo has canonical-variable service and runtime_variable_map_ref fields, but no public.runtime_variable_map table in 027/028. |

## Contrato por campo
| Campo | Fuente | Tipo fuente | Organo rector | Gramatica | Conformance |
| --- | --- | --- | --- | --- | --- |
| `opens_nodes` | `Branching_Budget_Rules` | `string` | `runtime_branching_rule` | `authorized_structured_policy` | `conformant_as_branching_policy_literal_reference_resolution_deferred_to_governed_grammar` |
| `closes_nodes` | `Branching_Budget_Rules` | `string` | `runtime_branching_rule` | `authorized_structured_policy` | `conformant_as_branching_policy_literal_reference_resolution_deferred_to_governed_grammar` |
| `mutual_exclusion_policy` | `Epistemic_Policy` | `string` | `runtime_epistemic_rule` | `authorized_structured_policy` | `conformant_as_policy_literal` |
| `free_text_weight` | `Required_Field_Model` | `enum` | `runtime_epistemic_rule` | `authorized_atomic_literal` | `conformant_as_qualitative_enum_no_numeric_coercion` |
| `fatigue_policy` | `Epistemic_Policy` | `string` | `runtime_epistemic_rule` | `authorized_structured_policy` | `conformant_as_policy_literal` |
| `must_not_infer` | `Epistemic_Policy` | `string` | `runtime_epistemic_rule` | `authorized_structured_policy` | `conformant_as_policy_literal` |
| `canonical_variables` | `Canonical_Variables` | `string list` | `runtime_variable_map` | `authorized_unordered_collection` | `conformant_as_variable_collection_literal_reference_resolution_deferred_to_governed_grammar` |
| `required_variables` | `Canonical_Variables` | `string list` | `runtime_variable_map` | `authorized_unordered_collection` | `conformant_as_variable_collection_literal_reference_resolution_deferred_to_governed_grammar` |
| `derived_variables` | `Canonical_Variables` | `string list` | `runtime_variable_map` | `authorized_unordered_collection` | `conformant_as_variable_collection_literal_reference_resolution_deferred_to_governed_grammar` |
| `optional_variables` | `Canonical_Variables` | `string list` | `runtime_variable_map` | `authorized_unordered_collection` | `conformant_as_variable_collection_literal_reference_resolution_deferred_to_governed_grammar` |
| `confirmation_weight` | `Required_Field_Model` | `enum` | `runtime_epistemic_rule` | `authorized_atomic_literal` | `conformant_as_qualitative_enum_no_numeric_coercion` |
| `can_be_inferred_from` | `Epistemic_Policy` | `string` | `runtime_variable_map` | `authorized_structured_policy` | `conformant_as_policy_literal` |

## Dictamen de pesos y politicas
- `free_text_weight` y `confirmation_weight` se conservan como enum cualitativo literal `bajo|medio|alto`; no existe autorizacion para escala numerica.
- `mutual_exclusion_policy`, `fatigue_policy`, `must_not_infer` y `can_be_inferred_from` se conservan como politicas literales/estructuradas; no existe autorizacion para booleanizarlas.

## Variables y nodos
- Variables: se preserva el literal completo y se difiere tokenizacion hasta aprobacion de gramatica; no aliases, no fuzzy, no completado narrativo.
- Nodos: `opens_nodes` y `closes_nodes` no se derivan desde texto; solo se resolveran tokens explicitos contra Catalogo Madre despues de aprobar gramatica.

## SQL local
No se genero SQL local 035: los organos `runtime_branching_rule`, `runtime_epistemic_rule` y `runtime_variable_map` estan en estado `specification_only` para `public.runtime_*` y no hay DDL completo aprobado.

## Validacion
- `fields_reviewed`: `12`
- `boolean_coercions_authorized`: `0`
- `numeric_scales_invented`: `0`
- `unauthorized_splits_authorized`: `0`
- `aliases_authorized`: `0`
- `fuzzy_matching_authorized`: `0`
- `remote_contact`: `False`
- `sql_candidate_created`: `False`
- `sql_candidate_reason`: `Public semantic organs are specification_only and full approved DDL is not yet authorized; no local SQL candidate was generated.`

## Clasificacion final
semantic_persistence_rule_ready_for_governance_approval

## Brecha siguiente
Solo despues de aprobacion humana explicita: semantic_persistence_governance_approved -> semantic_schema_materialization_authorized -> CatalogLoader minimo
