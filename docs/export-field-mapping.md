# EVE Activity Collection Export Mapping

## Purpose
This document defines the expected mapping between:
- source data from the EVE session model in Supabase,
- transformation or inference logic already performed by EVE,
- destination sections in the Excel template `Herramienta de Actividades EVE FULL - V04.xlsx`.

This mapping is intentionally semantic first.  
Exact workbook sheet names, row ranges, and column coordinates must be inspected from the real template during implementation.

---

## Mapping table

| Export field / semantic block | Source origin in EVE | Transformation / rule | Destination in Excel template | Provenance type | Notes |
|---|---|---|---|---|---|
| `session_id` | `sessions.id` or equivalent | direct | header / metadata section | system metadata | mandatory |
| `export_timestamp` | generated at export time | direct | header / metadata section | system metadata | mandatory |
| `session_status` | session closure record | direct | header / session summary | system metadata | use canonical session closure status |
| `session_closure_quality` | closure engine result | direct | header / session summary | system metadata | e.g. solid, alerts, partial, blocked |
| `support_iterations_count` | closure/support history | aggregate count | header / session summary | derived system metadata | count support cycles actually executed |
| `main_activities_list` | selected activities table | direct + ordered | activities section | system decision | preserve selected order if available |
| `support_activities_list` | support activities table | direct + ordered | activities section or auxiliary sheet | system decision | mark as support explicitly |
| `activity_rank` | ranking engine result | direct if stored | activity row / technical column | system decision | optional if available |
| `activity_closure_status` | per-activity closure result | direct | activity section | system metadata | e.g. `closed_solid` |
| `activity_text` | user-captured activity text | direct | activity row main text | user-captured | never rewrite |
| `activity_role_context` | role capture context / session respondent profile | direct or inferred from session | activity row / context block | user-captured or inferred | use only if stored |
| `mission_functional` | mission inference engine | inferred | question block equivalent to mission | system-inferred | do not pretend user said it if inferred |
| `activity_purpose` | questionnaire answers | direct | questionnaire block | user-captured | depends on actual template label |
| `expected_result` | questionnaire answers | direct | questionnaire block | user-captured | preserve wording |
| `destination_or_receiver` | questionnaire answers | direct | questionnaire block | user-captured | often handoff target |
| `upstream_dependency` | questionnaire answers / diagnostic engine | direct or normalized | questionnaire block | user-captured or derived | identify prior dependency |
| `worked_object_or_document` | questionnaire answers / diagnostic engine | direct | questionnaire block | user-captured or derived | important for PM/PF/MoC/OLC later |
| `initial_object_state` | questionnaire answers | direct | questionnaire block | user-captured | if the template contains state logic |
| `final_object_state` | questionnaire answers | direct | questionnaire block | user-captured | if present |
| `validation_method` | questionnaire answers | direct | questionnaire block | user-captured | how the actor knows task is done |
| `escalation_path` | questionnaire answers | direct | questionnaire block | user-captured | preserve escalation language |
| `coordination_required` | questionnaire answers | direct | questionnaire block | user-captured | internal/external coordination |
| `sequence_description` | questionnaire answers | direct | questionnaire block | user-captured | order / workflow logic |
| `waits_or_delays` | questionnaire answers | direct | questionnaire block | user-captured | preserve evidence of waiting |
| `workaround_detected` | questionnaire answers / diagnostic engine | direct or inferred flag | questionnaire block or diagnostic section | user-captured or inferred | distinguish explicit workaround vs inferred |
| `distance_from_official_process` | questionnaire answers / consistency engine | direct or derived | questionnaire block / observations | user-captured or derived | key for later structural reading |
| `missing_information` | questionnaire answers / clarification | direct | questionnaire block / observations | user-captured or clarification-derived | preserve uncertainty |
| `precautions_or_alerts` | questionnaire answers | direct | questionnaire block / observations | user-captured | operational risk clues |
| `micro_clarification_text` | micro-clarification records | direct | clarification block or auxiliary sheet | clarification-derived | keep linked to activity |
| `micro_clarification_trigger` | consistency engine | direct | auxiliary trace sheet | system decision | why clarification was requested |
| `consistency_alert_level` | consistency engine result | direct | consistency section / auxiliary sheet | system metadata | mild / important / critical or actual taxonomy |
| `consistency_alert_detail` | consistency engine | direct | consistency section / auxiliary sheet | system metadata | keep raw message if possible |
| `critical_contradiction_flag` | consistency engine | direct | consistency section / auxiliary sheet | system metadata | boolean or category |
| `closure_gap_residual` | closure engine | direct | session or activity residual gaps section | system metadata | unresolved information gap |
| `relevant_dependencies` | diagnostic engine | normalized list | auxiliary sheet or diagnostic section | system-inferred | do not overwrite user response |
| `detected_tensions` | diagnostic engine | normalized list | auxiliary sheet or diagnostic section | system-inferred | preserve one row per tension if needed |
| `detected_sacrifices` | diagnostic engine | normalized list | auxiliary sheet or diagnostic section | system-inferred | useful for downstream diagnosis |
| `vsm_summary` | diagnostic engine | direct | auxiliary sheet / system summary | system-inferred | do not force into questionnaire cells |
| `mmabp_summary` | diagnostic engine | direct | auxiliary sheet / system summary | system-inferred | same rule |
| `ahe_summary` | diagnostic engine | direct | auxiliary sheet / system summary | system-inferred | same rule |
| `data_source_stage` | response origin tracking | derive from workflow stage | provenance sheet | derived metadata | e.g. main questionnaire, support questionnaire, clarification |
| `source_timestamp` | stored answer timestamp | direct | provenance sheet | system metadata | if available |
| `source_record_id` | answer / event id | direct | provenance sheet | system metadata | optional but ideal |
| `session_traceability_summary` | closure trace object | direct or aggregated | auxiliary sheet | system metadata | preserve reconstruction path |

---

## Provenance categories

Use these provenance categories consistently:

- `user_captured`
- `system_inferred`
- `clarification_derived`
- `system_metadata`
- `system_decision`
- `derived_metadata`

---

## Destination policy

### 1. Template-first placement
If the Excel template already has a natural place for a field, populate it there.

### 2. Conservative extension
If the field is important but the template has no natural place:
- do not break the structure of the main sheet;
- place it in a complementary sheet such as:
  - `TRAZABILIDAD`
  - `CONSISTENCIA`
  - `PROVENIENCIA`
  - `RESUMEN_SESION`

### 3. No silent loss
If a field exists in EVE but does not fit the original workbook structure, preserve it in a complementary sheet rather than dropping it.

---

## Required implementation artifact
The implementation must produce a concrete machine-readable mapping, for example:
- `activityExportTemplateMap.ts`
or
- `activity-export-mapping.json`

with exact workbook coordinates or section resolvers once the template has been inspected.