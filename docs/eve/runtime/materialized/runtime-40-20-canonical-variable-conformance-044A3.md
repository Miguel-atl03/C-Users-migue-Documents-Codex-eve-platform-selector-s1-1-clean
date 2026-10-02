# Canonical variable conformance 044-A.3

## Classification

`blocked_canonical_variable_execution_grammar_missing`

## Preconditions

- Renderer: no synthetic ViewModel fallback
- Ingest: no `catch→ok:true`, no `ingest_candidate_ready_fallback`, no `Object.entries(answers)` recovery

## Gate 1 — Materiality

| Component | Classification |
|---|---|
| CanonicalVariableService | implemented_and_connected |
| Governed `mapVariableMapsToCandidates` (before) | partial (invented names / `var_${index}`) |
| FULL `runtime_variable_map` | specification_only (prose EAV) |
| FULL `runtime_epistemic_rule.must_not_infer` | specification_only (prose) |

## Gate 4 — Why blocked

FULL `runtime_variable_map` stores free-text fields (`canonical_variables`, `required_variables`, …) with operators like `+`, `/`, `*`. There is **no** machine-readable `subfield_name → canonical_variable_name` structure. Inventing a parser/aliases/fuzzy match is forbidden.

`runtime_interaction_mapping.output_variable_name` is null (source_lineage only).

## Inferential paths removed

- `variable_name: field_name || raw_literal || var_${index+1}`
- `catch → canonical ok:true` empty fabrication
- Prose EAV → fabricated mapping candidates

## Failure contract

- Grammar missing → `blocked_canonical_variable_execution_grammar_missing`; persistencia 0; state unchanged
- Service failure → `blocked_real_canonical_variable_path_failed`; canonical=0; budget delta=0; state advance=false

## Scenarios

| Scenario | Result |
|---|---|
| A FULL prose map (no machine-readable) | grammar_missing |
| B unauthorized answer key | 0 vars from that key |
| C evidence without mapping | no invented variable |
| D induced service failure | `blocked_real_canonical_variable_path_failed` |
| E no answers→variables / no `var_${n}` | pass |
| F must_not_infer | `blocked_epistemic_execution_grammar_missing` (secondary) |

## Out of scope

Branching / SEM/PST / Readiness / Gaby / producción / E2E completo / 045 / commit: no
