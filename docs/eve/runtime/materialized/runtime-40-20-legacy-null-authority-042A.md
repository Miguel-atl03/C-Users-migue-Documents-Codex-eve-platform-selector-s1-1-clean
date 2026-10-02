# Autoridad de NULL legacy 042-A

## Decisión

Aplica la **Rama B**. `EVE-RUNTIME-SEMPERSIST-R1` no exige que las doce
columnas legacy de `runtime_interaction_def` sean físicamente `NULL`.

La regla rectora aprobada exige:

- persistir la semántica literal en `runtime_branching_rule`,
  `runtime_epistemic_rule` y `runtime_variable_map`;
- conservar `raw_literal`, procedencia, trazabilidad y checksum;
- interpretar `NULL` únicamente como ausencia literal en fuente;
- no coercionar políticas, pesos ni colecciones para adaptarlos a columnas
  existentes.

La exigencia física de doce `NULL` apareció después como supuesto de fixture y
regla de implementación en 037/038/039-B. No está en la regla rectora aprobada.
Además, 040-D ya reconoció el contrato físico real: defaults vacíos para las
diez columnas `NOT NULL` y `NULL` para las dos nullable.

## Apariciones relevantes

| Fuente | Literal resumido | Estado | Autoridad |
| --- | --- | --- | --- |
| `EVE-RUNTIME-SEMPERSIST-R1`, sección 8 | `null solo significa ausencia literal en fuente` | regla aprobada | `rector_approved` |
| 037 contract/validation | fixture full catalog con doce `NULL` explícitos | validación local desechable | `test_assumption` |
| 038 CatalogLoader contract | doce columnas incompatibles permanecen `NULL` | contrato de implementación | `implementation_rule` |
| 039-B traceability | full catalog draft deja legacy en `NULL` | evidencia de trazabilidad | `historical_evidence` |
| 040-D boundary | columnas no autoritativas con empty defaults / `NULL` | corrección de proyección física | `implementation_rule` |
| preload snapshot 042 | exige doce `NULL` aunque diez son `NOT NULL` | gate técnico posterior | `unsupported` |

La matriz se trató como control transversal y no como autoridad única.

## Regla de compatibilidad física

- El payload no suministra ninguna de las doce columnas legacy.
- El `INSERT` del RPC omite las doce columnas.
- PostgreSQL aplica sin cambios sus defaults existentes.
- Los diez defaults no nulos son exclusivamente
  `physical_compatibility_values`.
- `free_text_weight` y `confirmation_weight` quedan `NULL`.
- Ningún default es fuente semántica, contenido rector, criterio QA de
  significado ni entrada autorizada de branching, variables o epistemología.
- La evidencia íntegra queda en `raw_row_json` y en los tres órganos
  semánticos.

## Contrato exacto observado

| Columna | Tipo | Nullable | Default exacto | Órgano autoritativo |
| --- | --- | --- | --- | --- |
| `opens_nodes` | `text[]` | no | `'{}'::text[]` | `runtime_branching_rule` |
| `closes_nodes` | `text[]` | no | `'{}'::text[]` | `runtime_branching_rule` |
| `mutual_exclusion_policy` | `jsonb` | no | `'{}'::jsonb` | `runtime_epistemic_rule` |
| `free_text_weight` | `numeric` | sí | `NULL` | `runtime_epistemic_rule` |
| `fatigue_policy` | `jsonb` | no | `'{}'::jsonb` | `runtime_epistemic_rule` |
| `must_not_infer` | `boolean` | no | `false` | `runtime_epistemic_rule` |
| `canonical_variables` | `text[]` | no | `'{}'::text[]` | `runtime_variable_map` |
| `required_variables` | `text[]` | no | `'{}'::text[]` | `runtime_variable_map` |
| `derived_variables` | `text[]` | no | `'{}'::text[]` | `runtime_variable_map` |
| `optional_variables` | `text[]` | no | `'{}'::text[]` | `runtime_variable_map` |
| `confirmation_weight` | `numeric` | sí | `NULL` | `runtime_epistemic_rule` |
| `can_be_inferred_from` | `text[]` | no | `'{}'::text[]` | `runtime_variable_map` |

Las expresiones provienen literalmente del contrato 040-A y fueron confirmadas
mediante `information_schema.columns` en
`eve-staging-onboarding` (`shrpiwkxcdgvbqymjecx`). Producción no fue
consultada. No se creó ningún TR-ID.
