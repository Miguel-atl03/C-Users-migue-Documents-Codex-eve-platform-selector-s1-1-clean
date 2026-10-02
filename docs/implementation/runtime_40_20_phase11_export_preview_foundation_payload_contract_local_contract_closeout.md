# Runtime 40/20 Phase 11 Export Preview Foundation Payload Contract Local Contract Closeout

## 1. Dictamen

RUNTIME_40_20_PHASE11_EXPORT_PREVIEW_FOUNDATION_PAYLOAD_CONTRACT_LOCAL_CONTRACT_V1 completed.

## 2. Plan phase

Parte 2 - Fase 11 - Export-preview.

## 3. Tree points worked

- 11.1 Revalidacion de entrada desde Fase 10
- 11.2 ExportPreviewService local contract
- 11.3 Export eligibility gate
- 11.4 runtime_export_contract source
- 11.5 parallel_export_payload preview contract
- 11.6 Payload state lifecycle
- 11.7 Checksum / idempotency / versioning
- 11.8 Source traceability / provenance envelope

## 4. Rector documents referenced

- EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx
- EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx

## 5. Previous Phase 10 closeout referenced

- docs/implementation/runtime_40_20_phase10_nogo_definition_of_done_final_traceability.json
- docs/implementation/runtime_40_20_phase10_nogo_definition_of_done_final_closeout.md
- docs/implementation/runtime_40_20_phase10_readiness_foundation_rules_state_local_contract_traceability.json
- docs/implementation/runtime_40_20_phase10_readiness_decision_candidates_local_contract_traceability.json
- docs/implementation/runtime_40_20_phase10_reentry_required_planning_execution_boundary_local_contract_traceability.json
- docs/implementation/runtime_40_20_phase10_readiness_aggregation_decision_record_local_contract_traceability.json
- docs/implementation/runtime_40_20_phase10_audit_export_qa_supersession_persistence_boundary_local_contract_traceability.json

## 6. Control de fuente / No-inferencia

This tranche implements only the local Phase 11-A export-preview foundation contract authorized by the instruction. It consumes Phase 10 local closeout and candidate references as input and does not recalculate readiness, modify Phase 10, create real export-preview, create real parallel_export_payload, use payload_state sent, execute POST export, start Produccion Paralela, touch Supabase, execute SQL, create endpoints, create registry, create IR, create diagnosis, create Control Plane real, write mba_*, write scene_*, write parallel_production_runtime_artifacts, close Phase 11, authorize Phase 12, or start Phase 12.

## 7. Phase 10 input revalidation

The local service creates RuntimePhase11InputRevalidationDecision. It requires phase10_closed_local = true and ready_for_phase11_authorization = true, confirms phase11_started_local was false before this tramo, starts Phase 11 locally as candidate work, keeps phase11_closed_local = false, and keeps ready_for_phase12_authorization = false.

The revalidation consumes readiness_decision_record candidates, readiness_state candidate, ready candidates, ready_with_flags candidates, blocking_gap_refs, non_blocking_gap_refs, manual_review_refs, reentry_refs, gate_result_refs, semantic_event_refs, pst_event_refs, carry_forward_gap_refs, readiness audit candidates, and the Phase 11 export-preview boundary from Phase 10-E. It records readiness_recalculated = false, phase10_modified = false, and phase12_started = false.

## 8. ExportPreviewService local contract

The service creates RuntimeExportPreviewServiceCandidate records with export_preview_candidate_ref, run_id, activity_runtime_run_id, role_runtime_session_id, source_readiness_decision_candidate_ref, source_readiness_state, source_gate_result_refs, source_evidence_refs, source_canonical_variable_refs, source_gap_refs, source_trace, export_preview_status, candidate_allowed, and blocking_reasons.

Allowed statuses are draft_candidate, ready_candidate, blocked_candidate, and superseded_candidate. Missing source_trace blocks the candidate. export_preview_real_created, post_export_executed, payload_state_sent, and produccion_paralela_started remain false.

## 9. Export eligibility gate

The service creates RuntimeExportEligibilityGateCandidate records. ready allows preview candidate. ready_with_flags allows preview candidate with visible flags. blocked_by_missing_evidence, blocked_by_contradiction, blocked_by_missing_canonical_route, manual_review_required, and reentry_required block preview. blocking_gap_refs must be empty, while non_blocking_gap_refs can travel as flags. The service does not degrade blocked to ready_with_flags and does not hide a blocking gap as a flag.

## 10. runtime_export_contract source

The service creates RuntimeExportContractSourceCandidate records for allowed payload_type values only: scr_patch, evidence_bundle_patch, mdsb_patch, and combined_preview. It requires required_payload_sections, required_provenance_fields, required_readiness_fields, required_checksum_policy, source_node_ref, and source_trace. Invalid payload_type, payload outside contract, payload below minimum, and placeholder payload attempts are blocked.

## 11. parallel_export_payload preview contract

The service creates RuntimeParallelExportPayloadPreviewCandidate records with parallel_export_payload_candidate_ref, run_id, payload_type, payload_json, payload_state, checksum, created_at_preview, and source_trace. Allowed local states are draft, ready, blocked, and superseded. payload_state sent is blocked. parallel_export_payload_real_created, db_write_created, post_export_executed, and produccion_paralela_started remain false.

## 12. Payload state lifecycle

The service creates RuntimePayloadStateLifecycleCandidate records. It supports draft_to_ready only when eligibility passes, draft_to_blocked when readiness blocks, ready_to_superseded when source revision changes, and blocked_to_draft only with explicit local revalidation. sent and invented states are blocked. Every transition requires an audit candidate.

## 13. Checksum / idempotency / versioning

The service creates RuntimeChecksumIdempotencyCandidate records requiring checksum_source, checksum_algorithm, and source_payload_hash. It supports source_readiness_hash, source_evidence_hash, source_variable_hash, idempotency_key, duplicate_preview_detected, supersedes_payload_candidate_ref, and previous_payload_candidate_ref. Duplicate preview for the same run/source hash is blocked and preview replacement without trace is blocked.

## 14. Source traceability / provenance envelope

The service creates RuntimeSourceTraceEnvelopeCandidate records supporting source_document, source_sheet, source_row_number, raw_row_internal, source_codes, source_refs, source_gate_refs, source_gap_refs, source_evidence_refs, source_variable_refs, and source_readiness_ref. Missing source_trace, fabricated provenance, and payload without source are blocked.

## 15. Direct source vs derived boundary

Input revalidation is derived from the accepted Phase 10 closeout and boundary. ExportPreviewService, eligibility, runtime_export_contract, parallel_export_payload preview, payload lifecycle, checksum/idempotency, and provenance envelope remain direct local source contracts from the authorized Phase 11-A instruction.

## 16. No-Inference verification

The implementation does not invent payload_type, payload_state, runtime_export_contract, source_trace, provenance, or checksum_source. It does not create payload outside contract, reduce payload below the minimum rector, authorize preview from blocked readiness, degrade blocked to ready_with_flags, hide blocking gaps as flags, or use placeholders.

## 17. Boundary verification

- runtime_40_20_started: false
- catalog_activated: false
- migration_applied: false
- supabase_touched: false
- sql_executed: false
- endpoint_created: false
- service_role_used: false
- service_role_used_in_client: false
- export_preview_real_created: false
- parallel_export_payload_real_created: false
- payload_state_sent: false
- post_export_executed: false
- produccion_paralela_started: false
- registry_created: false
- ir_created: false
- diagnosis_created: false
- control_plane_real_created: false
- mba_write_detected: false
- scene_write_detected: false
- parallel_production_runtime_artifacts_write_detected: false
- qa_green_declared: false
- shadow_pilot_started: false
- full_runtime_authorized: false
- phase12_started: false

## 18. Code changes

Created:

- src/services/eve/runtime-40-20/export-preview/runtime-40-20-export-preview-types.ts
- src/services/eve/runtime-40-20/export-preview/runtime-40-20-export-preview-service.ts
- src/services/eve/runtime-40-20/export-preview/runtime-40-20-export-preview.test.mjs

No Phase 10 files were modified.

## 19. Test execution

Command executed:

```text
node --test src/services/eve/runtime-40-20/export-preview/runtime-40-20-export-preview.test.mjs
```

Result: passed. 121 tests passed, 0 failed.

## 20. Phase 11 status after this tramo

- phase11_started_local: true
- phase11_closed_local: false
- ready_for_phase12_authorization: false
- next_tree_point: 11.9 SCR preview contract + 11.10 SCR activity anchor + 11.11 SCR block outputs + 11.12 SCR gaps/readiness/critical-route transport
- next_authorization_required: true
