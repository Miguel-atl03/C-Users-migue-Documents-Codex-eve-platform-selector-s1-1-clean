# Governance decision matrix 044-A.3G — Canonical mapping

## Classification (unchanged)

`blocked_rector_canonical_mapping_semantics_absent`

`governance_decision_package_ready = true`

## Purpose

Present evidence so a human authority can decide:

1. For each of 57 subfields: whether it produces a canonical variable, and which exact name (if any).
2. For each of 60 interactions: whether/how `must_not_infer` becomes executable.

Cursor has **not** filled `approved_canonical_variable_name`, has **not** set `canonical_output_decision` beyond `unresolved`, and has **not** filled `executable_policy`.

## Critical rules

- `approved_canonical_variable_name` = **empty**
- `decision_status` = **unresolved**
- `canonical_output_decision` = **unresolved** (allowed after approval only: `canonical_variable` | `no_canonical_variable`)
- No name matching, semantic similarity, operator interpretation, positional choice, or Madre Catalog substitution

## Counts

| Metric | Value |
|---|---|
| Subfield rows | 57 |
| Epistemic rows | 60 |
| approved names empty | true |
| output decisions unresolved | true |
| executable_policy empty | true |

## Evidence columns (for humans)

Each row includes interaction id, subfield name/label, UX source coordinates, the **interaction-level** `canonical_variables` literal as-is (not split), and empty decision fields.

## Proposed rector (not approved)

`docs/eve/runtime/rectors/proposals/Regla_Rectora_General_Mapeo_Variables_Canonicas_Runtime_40_20_EVE_v1_0_PROPUESTA.md`

Status: **PROPOSED_NOT_APPROVED** — defines process only; contains **no** approved mappings.

## Versioning impact (dictamen only)

See `runtime-40-20-canonical-governance-versioning-impact-044A3G.json`.

If new authoritative mapping content is approved, existing CATID-R1 + activation rules imply: new source checksum → new catalog identity → draft load + QA + activation; active FULL identity remains immutable; **no version number invented here**.

## Stop

Do not fill mappings, approve rector, modify XLSX/DOCX/FULL, create versions, or reopen 044-A.3 until explicit human approval.

## Next action

Await explicit user decisions on mappings and `must_not_infer`.
