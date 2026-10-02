# Source capture projection validation 044-A.3V-R

## Classification

`rector_projection_reconstructable_and_validated`

## Part A — Gate 2 repair

Previous 044-A.3V treated `,` vs `|` as relation reconstruction mismatch.

Correct class: **`audit_candidate_display_serialization_defect`**

Repair: regenerate `Interacciones_60` rows with:

- `source_codes_literal` = exact Runtime XLSX literal
- `source_code_members` = auditor array from primary extraction (not Runtime semantics)

| Check | Value |
|---|---|
| interactions | 60 |
| relations | 170 |
| tuple mismatches | 0 |
| source literal mismatches after repair | 0 |
| node/code ordering mismatches | 0 |
| Gate 2 passed | **true** |

## Part B — Gate 3 six projections

| ID | Classification |
|---|---|
| B7-Q39 | `exact_authorized_runtime_projection` |
| B7-Q40 | `exact_authorized_runtime_projection` |
| C09 | `exact_authorized_runtime_projection` |
| C15 | `explicit_runtime_projection_with_source_genealogy` |
| C17 | `explicit_runtime_projection_with_source_genealogy` |
| C20 | `exact_authorized_runtime_projection` |

### Notes

- Levels separated: source fiche outputs ≠ Runtime interaction Canonical_Variables.
- `/` is **not** executed as an operator.
- C09 authorized by Runtime XLSX + T-009 (presence without duplicate).
- Historical 044-A.3V files were **not** modified.

## Out of scope

crosswalk / Renderer / Ingest / CanonicalVariableService / Branching / staging / FULL / 045 / commit: **no**
