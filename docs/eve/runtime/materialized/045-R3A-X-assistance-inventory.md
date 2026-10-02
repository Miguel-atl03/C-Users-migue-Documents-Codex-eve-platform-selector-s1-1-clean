# 045-R3A-X — Assistance inventory

Gate 4 rule: **asistencia ≠ autoridad Runtime**.

| id | section | classification | confirm | service/route |
|---|---|---|---|---|
| workmap_side_cognitive_guide | WORKMAP | reusable_with_canvas_adapter | none | client-only; work-map-*-validation services |
| workmap_inline_blur_assist | WORKMAP | reusable_with_canvas_adapter | none | src/domain/work-map.ts assist evaluators |
| workmap_formal_save_validation | WORKMAP | reusable_with_canvas_adapter | soft (continue with warnings) | work-map-save-validation.ts; finalize route |
| b0_help_text | B0 | reusable_exact | none | block0-catalog-snapshot.ts |
| b0_intro_example | B0 | reusable_exact | none | /api/coach/operational-description/intro-example |
| b0_operational_description_coach | B0 | reusable_exact | none (does not mutate draft) | /api/coach/operational-description |
| b0_boundary_confirmation | B0 | reusable_with_canvas_adapter | required | infer-activity-boundary.ts; persist with block0 |
| workmap_to_b0_prefill | B0 | reusable_exact | implicit via edit/advance | workmap-to-block0-prefill.ts |
| runtime_help_text | B05-B7 | reusable_exact | none | interaction-renderer + client-bff |
| runtime_microconfirmation_contract | B7 | reusable_exact | intended yes | Runtime microconfirmation budget |
| consistency_micro_clarification | READINESS | reusable_with_canvas_adapter | required to proceed | consistency-checker.ts; /api/questionnaire/submit |
| legacy_mission_confirm_ui | questionnaire_legacy_unmounted | legacy_ui_coupled | yes when confidence not high | mission-inference via /api/questionnaire/submit |
| block05_fichas_reference | B05 | obsolete | n/a | n/a |
| workmap_writing_assistance_chip_doc | WORKMAP | obsolete | n/a | n/a |
| detect_anchor_clarification_unwired | B0 | obsolete | n/a | scanOperationalDescription |

Necessary mechanisms must be preserved across UI retirement.
