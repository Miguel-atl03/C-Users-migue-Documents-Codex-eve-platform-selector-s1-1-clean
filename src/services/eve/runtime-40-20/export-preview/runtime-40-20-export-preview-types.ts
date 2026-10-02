export type RuntimeReadinessStateForExportPreview =
  | "ready"
  | "ready_with_flags"
  | "blocked_by_missing_evidence"
  | "blocked_by_contradiction"
  | "blocked_by_missing_canonical_route"
  | "manual_review_required"
  | "reentry_required";

export type RuntimeExportPreviewStatus =
  | "draft_candidate"
  | "ready_candidate"
  | "blocked_candidate"
  | "superseded_candidate"
  | "blocked_missing_source_trace"
  | "blocked_invalid_payload_type"
  | "blocked_payload_state_sent_attempt"
  | "blocked_export_real_attempt"
  | "blocked_placeholder_payload"
  | "blocked_by_readiness_state";

export type RuntimeSCRPreviewStatus =
  | "scr_preview_candidate_created"
  | "scr_activity_anchor_candidate_created"
  | "scr_block_outputs_candidate_created"
  | "scr_gap_readiness_route_transport_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_unconfirmed_b0_anchor"
  | "blocked_scene_canonical_record_real_creation_attempt"
  | "blocked_scene_write_attempt"
  | "blocked_b7_diagnostic_attempt"
  | "blocked_by_readiness_state";

export type RuntimeEvidenceBundlePreviewStatus =
  | "evidence_bundle_preview_candidate_created"
  | "evidence_bundle_evidence_item_candidate_created"
  | "evidence_bundle_canonical_variable_route_status_candidate_created"
  | "evidence_bundle_epistemic_hardening_boundary_created"
  | "blocked_missing_source_trace"
  | "blocked_hard_evidence_from_unconfirmed_inference"
  | "blocked_evidence_from_absence"
  | "blocked_pending_microconfirmation_evidence"
  | "blocked_new_variable_creation_attempt"
  | "blocked_route_status_from_satisfaction_general"
  | "blocked_registry_creation_attempt";

export type RuntimeMDSBPreviewStatus =
  | "mdsb_preview_candidate_created"
  | "mdsb_structural_candidate_created"
  | "mdsb_conformance_consistency_checkpoint_candidate_created"
  | "combined_preview_candidate_created"
  | "export_blocking_rule_candidate_created"
  | "blocked_missing_source_trace"
  | "blocked_structural_candidate_accepted_despite_gate"
  | "blocked_semantic_contamination"
  | "blocked_structural_real_write_attempt"
  | "blocked_missing_required_preview_component"
  | "blocked_placeholder_payload";

export type RuntimeExportBoundaryStatus =
  | "preview_supersession_boundary_created"
  | "export_preview_audit_candidate_created"
  | "phase12_export_preview_qa_boundary_created"
  | "no_export_real_produccion_paralela_boundary_created"
  | "export_preview_persistence_boundary_created"
  | "blocked_missing_source_trace"
  | "blocked_export_real_attempt"
  | "blocked_payload_state_sent_attempt"
  | "blocked_produccion_paralela_attempt"
  | "blocked_export_persistence_attempt"
  | "blocked_qa_real_start_attempt";

export type RuntimeExportPreviewAuditAction =
  | "export_preview_candidate_created"
  | "export_preview_blocked"
  | "scr_preview_candidate_created"
  | "evidence_bundle_preview_candidate_created"
  | "mdsb_preview_candidate_created"
  | "combined_preview_candidate_created"
  | "payload_checksum_created"
  | "payload_superseded_candidate_created"
  | "export_real_blocked"
  | "produccion_paralela_blocked";

export type RuntimeMDSBQuadrantHint = "PM" | "MoC" | "PF" | "OLC";

export type RuntimeMDSBCheckpointType =
  | "conformance_checkpoint"
  | "consistency_checkpoint";

export type RuntimeMDSBCheckpointCompartment =
  | "PM_to_MoC"
  | "PM_to_PF"
  | "MoC_to_PF"
  | "PF_to_OLC"
  | "OLC_to_MoC"
  | "temporal_consistency_PF_to_OLC"
  | "structural_consistency_PF_to_OLC";

export type RuntimeEvidenceBundleEpistemicStatus =
  | "captured_user_evidence"
  | "user_confirmed_suggestion"
  | "user_corrected_evidence"
  | "ai_inferred_unconfirmed"
  | "canonical_derivation"
  | "internal_calculated";

export type RuntimeExportPayloadType =
  | "scr_patch"
  | "evidence_bundle_patch"
  | "mdsb_patch"
  | "combined_preview";

export type RuntimeExportPayloadState = "draft" | "ready" | "blocked" | "superseded";

export type RuntimePayloadLifecycleTransition =
  | "draft_to_ready"
  | "draft_to_blocked"
  | "ready_to_superseded"
  | "blocked_to_draft";

export type RuntimeExportPreviewBlockingReason =
  | "phase10_not_closed"
  | "phase11_not_authorized"
  | "phase11_already_started"
  | "missing_source_trace"
  | "invalid_readiness_state"
  | "readiness_state_blocks_preview"
  | "blocking_gap_refs_present"
  | "blocked_degraded_to_ready_with_flags_attempted"
  | "blocking_gap_hidden_as_flag_attempted"
  | "invalid_payload_type"
  | "missing_required_payload_sections"
  | "missing_required_provenance_fields"
  | "missing_required_readiness_fields"
  | "missing_required_checksum_policy"
  | "payload_outside_contract_attempted"
  | "payload_below_minimum_attempted"
  | "placeholder_payload_attempted"
  | "invalid_payload_state"
  | "payload_state_sent_attempted"
  | "missing_checksum"
  | "missing_checksum_source"
  | "missing_checksum_algorithm"
  | "missing_source_payload_hash"
  | "duplicate_preview_for_same_run_source_hash"
  | "preview_replaced_without_trace_attempted"
  | "missing_audit_candidate"
  | "fabricated_provenance_attempted"
  | "payload_without_source_attempted"
  | "readiness_recalculation_attempted"
  | "phase10_modification_attempted"
  | "export_preview_real_creation_attempted"
  | "parallel_export_payload_real_creation_attempted"
  | "post_export_execution_attempted"
  | "produccion_paralela_start_attempted"
  | "registry_creation_attempted"
  | "ir_creation_attempted"
  | "diagnosis_creation_attempted"
  | "control_plane_real_creation_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_violation"
  | "mba_write_attempted"
  | "scene_write_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "phase12_started_attempted";

export type RuntimeSCRPreviewBlockingReason =
  | "missing_source_trace"
  | "missing_checksum_source"
  | "invalid_payload_type"
  | "missing_activity_id"
  | "missing_catalog_version_id"
  | "activity_anchor_from_unconfirmed_free_text"
  | "missing_subfield_inferred_attempted"
  | "b0_not_closed_or_confirmed"
  | "scene_canonical_record_real_creation_attempted"
  | "scene_write_attempted"
  | "object_inventory_creation_attempted"
  | "block_output_invented_attempted"
  | "b7_diagnosis_attempted"
  | "blocking_gap_hidden_attempted"
  | "gaps_closed_in_scr_attempted"
  | "blocked_readiness_state"
  | "manual_review_required"
  | "reentry_required"
  | "export_real_attempted"
  | "parallel_export_payload_real_creation_attempted"
  | "payload_state_sent_attempted"
  | "post_export_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted";

export type RuntimeEvidenceBundleBlockingReason =
  | "missing_source_trace"
  | "invalid_payload_type"
  | "missing_evidence_item_ref"
  | "missing_epistemic_status"
  | "missing_provenance_type"
  | "missing_source_ref"
  | "hard_evidence_from_unconfirmed_inference_attempted"
  | "evidence_from_absence_attempted"
  | "pending_microconfirmation_evidence_attempted"
  | "confidence_inflation_attempted"
  | "supersession_without_trace_attempted"
  | "route_status_from_satisfaction_general_attempted"
  | "variable_from_text_similarity_attempted"
  | "new_variable_creation_attempted"
  | "canonical_variable_record_real_creation_attempted"
  | "route_status_real_update_attempted"
  | "registry_creation_attempted"
  | "evidence_bundle_real_creation_attempted"
  | "evidence_item_real_creation_attempted"
  | "ai_inference_elevation_attempted"
  | "low_confidence_to_hard_evidence_attempted"
  | "prior_evidence_deleted_without_supersession_trace_attempted"
  | "evidence_corrected_in_export_preview_attempted"
  | "export_real_attempted"
  | "parallel_export_payload_real_creation_attempted"
  | "payload_state_sent_attempted"
  | "post_export_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted";

export type RuntimeMDSBBlockingReason =
  | "missing_source_trace"
  | "invalid_payload_type"
  | "missing_structural_candidate_ref"
  | "missing_quadrant_hint"
  | "missing_candidate_type"
  | "missing_candidate_label"
  | "structural_candidate_accepted_despite_gate"
  | "state_as_class_attempted"
  | "attribute_as_class_attempted"
  | "process_as_object_attempted"
  | "false_isa_attempted"
  | "fused_olc_attempted"
  | "structural_real_write_attempted"
  | "moc_real_creation_attempted"
  | "pf_real_creation_attempted"
  | "olc_real_creation_attempted"
  | "pm_real_creation_attempted"
  | "diagram_real_creation_attempted"
  | "core_semantics_correction_attempted"
  | "diagnosis_creation_attempted"
  | "ir_creation_attempted"
  | "registry_creation_attempted"
  | "checkpoint_invented_attempted"
  | "gate_passed_without_sources_attempted"
  | "future_mmabp_review_replaced_attempted"
  | "missing_scr_preview"
  | "missing_evidence_bundle_preview"
  | "missing_mdsb_preview"
  | "critical_component_blocked"
  | "placeholder_payload_detected"
  | "automatic_override_creation_attempted"
  | "export_real_attempted"
  | "parallel_export_payload_real_creation_attempted"
  | "payload_state_sent_attempted"
  | "post_export_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted";

export type RuntimeExportBoundaryBlockingReason =
  | "missing_source_trace"
  | "missing_stale_reason"
  | "previous_preview_deleted_without_trace_attempted"
  | "supersession_real_emission_attempted"
  | "export_payload_real_creation_attempted"
  | "missing_audit_reason"
  | "invalid_audit_action"
  | "runtime_audit_trail_real_creation_attempted"
  | "qa_green_declaration_attempted"
  | "shadow_pilot_start_attempted"
  | "full_runtime_authorization_attempted"
  | "phase12_definition_of_done_modification_attempted"
  | "phase12_started_attempted"
  | "post_export_attempted"
  | "payload_state_sent_attempted"
  | "external_delivery_attempted"
  | "produccion_paralela_real_start_attempted"
  | "parallel_production_runtime_artifacts_write_attempted"
  | "registry_real_creation_attempted"
  | "ir_real_creation_attempted"
  | "diagnosis_real_creation_attempted"
  | "control_plane_real_creation_attempted"
  | "mba_write_attempted"
  | "scene_write_attempted"
  | "db_write_attempted"
  | "supabase_touch_attempted"
  | "sql_execution_attempted"
  | "endpoint_creation_attempted"
  | "service_role_client_violation"
  | "runtime_real_start_attempted";

export interface RuntimeSCRPreviewGapTransportItem {
  gap_id: string;
  gap_type?: string;
  gap_severity?: string | number;
  affected_route?: string;
  affected_gate?: string;
  carry_forward: boolean;
  manual_review_required: boolean;
  reentry_required: boolean;
  source_trace: Record<string, unknown>;
}

export interface RuntimeSCRPreviewSourceInput extends RuntimePhase11BoundaryGuardInput {
  scr_preview_candidate_ref?: string;
  payload_type?: RuntimeExportPayloadType | string;
  scene_canonical_record_patch?: Record<string, unknown>;
  activity_anchor?: Record<string, unknown>;
  block_outputs?: Record<string, unknown>;
  gaps?: RuntimeSCRPreviewGapTransportItem[];
  route_status?: Record<string, unknown>;
  readiness?: Record<string, unknown>;
  checksum_source?: string;
  source_trace?: Record<string, unknown>;
  scene_canonical_record_real_creation_attempted?: boolean;
  object_inventory_creation_attempted?: boolean;
}

export interface RuntimeSCRPreviewCandidate {
  scr_preview_candidate_ref: string;
  payload_type: "scr_patch";
  scene_canonical_record_patch: Record<string, unknown>;
  activity_anchor: Record<string, unknown>;
  block_outputs: Record<string, unknown>;
  gaps: RuntimeSCRPreviewGapTransportItem[];
  route_status: Record<string, unknown>;
  readiness: Record<string, unknown>;
  checksum_source: string;
  source_trace: Record<string, unknown>;
  scr_preview_real_created: false;
  scene_canonical_record_real_created: false;
  scene_write_detected: false;
  object_inventory_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeSCRPreviewBlockingReason[];
}

export interface RuntimeSCRActivityAnchorSourceInput {
  scr_activity_anchor_candidate_ref?: string;
  activity_id?: string;
  catalog_version_id?: string;
  activity_name_user_confirmed?: string;
  activity_semantic_action_verb?: string;
  activity_semantic_input_object?: string;
  activity_semantic_procedure_standard?: string;
  activity_semantic_output_product?: string;
  block0_entry_mode?: string;
  semantic_confirmation_status?: string;
  b0_q01_subfields_preserved?: boolean;
  activity_anchor_from_unconfirmed_free_text_attempted?: boolean;
  missing_subfield_inferred_attempted?: boolean;
  b0_closed_or_confirmed?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeSCRActivityAnchorCandidate {
  scr_activity_anchor_candidate_ref: string;
  activity_id?: string;
  catalog_version_id?: string;
  activity_name_user_confirmed?: string;
  activity_semantic_action_verb?: string;
  activity_semantic_input_object?: string;
  activity_semantic_procedure_standard?: string;
  activity_semantic_output_product?: string;
  block0_entry_mode?: string;
  semantic_confirmation_status?: string;
  b0_q01_subfields_preserved: boolean;
  activity_anchor_from_unconfirmed_free_text: false;
  missing_subfield_inferred: false;
  b0_closed_or_confirmed: boolean;
  scr_allowed: boolean;
  source_trace: Record<string, unknown>;
  blocking_reasons: RuntimeSCRPreviewBlockingReason[];
}

export interface RuntimeSCRBlockOutputsSourceInput {
  scr_block_outputs_candidate_ref?: string;
  b0_output_readiness?: Record<string, unknown>;
  b05_scene_context?: Record<string, unknown>;
  b1_trigger_source_channel?: Record<string, unknown>;
  b2_transformation_state_initial?: Record<string, unknown>;
  b2_transformation_state_final?: Record<string, unknown>;
  b3_output_object_receiver?: Record<string, unknown>;
  b4_deadlock_risk?: Record<string, unknown>;
  b5_capacity_gap?: Record<string, unknown>;
  b6_rework_workaround_residual_variety?: Record<string, unknown>;
  b7_preclassification_readiness?: Record<string, unknown>;
  block_outputs_source_refs?: string[];
  block_outputs_source_trace?: Record<string, unknown>;
  block_output_invented_attempted?: boolean;
  b7_diagnosis_attempted?: boolean;
}

export interface RuntimeSCRBlockOutputsCandidate {
  scr_block_outputs_candidate_ref: string;
  b0_output_readiness?: Record<string, unknown>;
  b05_scene_context?: Record<string, unknown>;
  b1_trigger_source_channel?: Record<string, unknown>;
  b2_transformation_state_initial?: Record<string, unknown>;
  b2_transformation_state_final?: Record<string, unknown>;
  b3_output_object_receiver?: Record<string, unknown>;
  b4_deadlock_risk?: Record<string, unknown>;
  b5_capacity_gap?: Record<string, unknown>;
  b6_rework_workaround_residual_variety?: Record<string, unknown>;
  b7_preclassification_readiness?: Record<string, unknown>;
  block_outputs_source_refs: string[];
  block_outputs_source_trace: Record<string, unknown>;
  block_output_invented: false;
  b7_diagnosis_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeSCRPreviewBlockingReason[];
}

export interface RuntimeSCRGapReadinessRouteTransportSourceInput {
  scr_gap_transport_candidate_ref?: string;
  gaps?: RuntimeSCRPreviewGapTransportItem[];
  readiness_state?: string;
  readiness_flags?: string[];
  critical_route_status?: Record<string, unknown>;
  blocking_gap_hidden_attempted?: boolean;
  gaps_closed_in_scr_attempted?: boolean;
  critical_route_status_recalculated_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeSCRGapReadinessRouteTransportCandidate {
  scr_gap_transport_candidate_ref: string;
  gaps: RuntimeSCRPreviewGapTransportItem[];
  readiness_state?: string;
  readiness_flags: string[];
  critical_route_status: Record<string, unknown>;
  blocking_gap_hidden: false;
  gaps_closed_in_scr: false;
  scr_export_allowed: boolean;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeSCRPreviewBlockingReason[];
}

export interface RuntimeEvidenceBundleCanonicalVariablePreviewItem {
  canonical_variable_ref: string;
  variable_name?: string;
  variable_value?: unknown;
  epistemic_status?: RuntimeEvidenceBundleEpistemicStatus;
  provenance_type?: string;
  source_ref?: string;
  source_trace: Record<string, unknown>;
}

export interface RuntimeEvidenceBundlePreviewSourceInput extends RuntimePhase11BoundaryGuardInput {
  evidence_bundle_preview_candidate_ref?: string;
  payload_type?: RuntimeExportPayloadType | string;
  evidence_items?: Record<string, unknown>[];
  canonical_variables?: RuntimeEvidenceBundleCanonicalVariablePreviewItem[];
  route_status?: Record<string, unknown>;
  readiness?: Record<string, unknown>;
  source_trace?: Record<string, unknown>;
  evidence_bundle_real_creation_attempted?: boolean;
}

export interface RuntimeEvidenceBundlePreviewCandidate {
  evidence_bundle_preview_candidate_ref: string;
  payload_type: "evidence_bundle_patch";
  evidence_items: Record<string, unknown>[];
  canonical_variables: RuntimeEvidenceBundleCanonicalVariablePreviewItem[];
  route_status: Record<string, unknown>;
  readiness: Record<string, unknown>;
  source_trace: Record<string, unknown>;
  evidence_bundle_preview_real_created: false;
  evidence_bundle_real_created: false;
  registry_created: false;
  hard_evidence_fabricated: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeEvidenceBundleBlockingReason[];
}

export interface RuntimeEvidenceBundleEvidenceItemSourceInput extends RuntimePhase11BoundaryGuardInput {
  evidence_item_candidate_ref?: string;
  literal_value?: unknown;
  normalized_value?: unknown;
  epistemic_status?: RuntimeEvidenceBundleEpistemicStatus | string;
  provenance_type?: string;
  confidence?: number;
  source_ref?: string;
  response_revision_number?: number;
  supersedes_evidence_ref?: string;
  supersession_source_trace?: Record<string, unknown>;
  hard_evidence_requested?: boolean;
  evidence_from_absence_attempted?: boolean;
  pending_microconfirmation_evidence_attempted?: boolean;
  confidence_inflation_attempted?: boolean;
  supersession_without_trace_attempted?: boolean;
  evidence_item_real_creation_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeEvidenceBundleEvidenceItemCandidate {
  evidence_item_candidate_ref: string;
  literal_value?: unknown;
  normalized_value?: unknown;
  epistemic_status?: RuntimeEvidenceBundleEpistemicStatus;
  provenance_type?: string;
  confidence?: number;
  source_ref?: string;
  response_revision_number?: number;
  supersedes_evidence_ref?: string;
  hard_evidence: boolean;
  evidence_from_absence: false;
  pending_microconfirmation_evidence: false;
  confidence_inflated: false;
  supersession_without_trace: false;
  evidence_item_real_created: false;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeEvidenceBundleBlockingReason[];
}

export interface RuntimeEvidenceBundleCanonicalVariableRouteStatusSourceInput
  extends RuntimePhase11BoundaryGuardInput {
  canonical_variable_route_status_candidate_ref?: string;
  canonical_variable_refs?: string[];
  variable_name?: string;
  variable_value?: unknown;
  variable_epistemic_status?: RuntimeEvidenceBundleEpistemicStatus | string;
  variable_provenance_type?: string;
  cr_b0_route_status?: string;
  cr_b2_route_status?: string;
  cr_b3_c09_route_status?: string;
  cr_b7_route_status?: string;
  route_status_source?: string;
  variable_from_text_similarity_attempted?: boolean;
  new_variable_creation_attempted?: boolean;
  canonical_variable_record_real_creation_attempted?: boolean;
  route_status_real_update_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeEvidenceBundleCanonicalVariableRouteStatusCandidate {
  canonical_variable_route_status_candidate_ref: string;
  canonical_variable_refs: string[];
  variable_name?: string;
  variable_value?: unknown;
  variable_epistemic_status?: RuntimeEvidenceBundleEpistemicStatus;
  variable_provenance_type?: string;
  cr_b0_route_status?: string;
  cr_b2_route_status?: string;
  cr_b3_c09_route_status?: string;
  cr_b7_route_status?: string;
  route_status_from_satisfaction_general: false;
  variable_from_text_similarity: false;
  new_variable_created: false;
  canonical_variable_record_real_created: false;
  route_status_real_updated: false;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeEvidenceBundleBlockingReason[];
}

export interface RuntimeEvidenceBundleEpistemicHardeningBoundarySourceInput
  extends RuntimePhase11BoundaryGuardInput {
  epistemic_hardening_boundary_ref?: string;
  epistemic_status?: RuntimeEvidenceBundleEpistemicStatus | string;
  derived_from_refs?: string[];
  user_answer_ref?: string;
  confidence?: number;
  hard_evidence_requested?: boolean;
  ai_inference_elevation_attempted?: boolean;
  low_confidence_to_hard_evidence_attempted?: boolean;
  prior_evidence_deleted_without_supersession_trace_attempted?: boolean;
  evidence_corrected_in_export_preview_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeEvidenceBundleEpistemicHardeningBoundary {
  epistemic_hardening_boundary_ref: string;
  epistemic_status?: RuntimeEvidenceBundleEpistemicStatus;
  captured_user_evidence_preserved: boolean;
  user_confirmed_suggestion_preserved: boolean;
  user_corrected_evidence_preserved: boolean;
  ai_inferred_unconfirmed_hard_evidence: false;
  canonical_derivation_requires_derived_from_refs: boolean;
  internal_calculated_not_user_answer: boolean;
  ai_inference_elevated: false;
  low_confidence_converted_to_hard_evidence: false;
  prior_evidence_deleted_without_supersession_trace: false;
  evidence_corrected_in_export_preview: false;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeEvidenceBundleBlockingReason[];
}

export interface RuntimeMDSBStructuralCandidateSourceInput extends RuntimePhase11BoundaryGuardInput {
  structural_candidate_ref?: string;
  quadrant_hint?: RuntimeMDSBQuadrantHint | string;
  candidate_type?: string;
  candidate_label?: string;
  source_variable?: string;
  source_evidence_item_ref?: string;
  source_gate_ref?: string;
  gate_blocks_candidate?: boolean;
  accepted_structural_candidate_attempted?: boolean;
  state_as_class_attempted?: boolean;
  attribute_as_class_attempted?: boolean;
  process_as_object_attempted?: boolean;
  false_isa_attempted?: boolean;
  fused_olc_attempted?: boolean;
  structural_real_write_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeMDSBStructuralCandidate {
  structural_candidate_ref: string;
  quadrant_hint?: RuntimeMDSBQuadrantHint;
  candidate_type?: string;
  candidate_label?: string;
  source_variable?: string;
  source_evidence_item_ref?: string;
  source_gate_ref?: string;
  source_trace: Record<string, unknown>;
  candidate_state: "candidate";
  accepted_structural_candidate_created: false;
  gate_blocking_respected: boolean;
  state_as_class: false;
  attribute_as_class: false;
  process_as_object: false;
  false_isa: false;
  fused_olc: false;
  structural_real_write_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeMDSBBlockingReason[];
}

export interface RuntimeMDSBConformanceConsistencyCheckpointSourceInput
  extends RuntimePhase11BoundaryGuardInput {
  checkpoint_candidate_ref?: string;
  checkpoint_type?: RuntimeMDSBCheckpointType | string;
  compartment?: RuntimeMDSBCheckpointCompartment | string;
  checkpoint_label?: string;
  checkpoint_reason?: string;
  checkpoint_invented_attempted?: boolean;
  gate_passed_without_sources_attempted?: boolean;
  future_mmabp_review_replaced_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeMDSBConformanceConsistencyCheckpointCandidate {
  checkpoint_candidate_ref: string;
  checkpoint_type?: RuntimeMDSBCheckpointType;
  compartment?: RuntimeMDSBCheckpointCompartment;
  checkpoint_label?: string;
  checkpoint_reason?: string;
  source_trace: Record<string, unknown>;
  checkpoint_invented: false;
  gate_passed_without_sources: false;
  future_mmabp_review_replaced: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeMDSBBlockingReason[];
}

export interface RuntimeMDSBPreviewSourceInput extends RuntimePhase11BoundaryGuardInput {
  mdsb_preview_candidate_ref?: string;
  payload_type?: RuntimeExportPayloadType | string;
  mmabp_design_source_bundle_patch?: Record<string, unknown>;
  structural_candidates?: RuntimeMDSBStructuralCandidate[];
  conformance_checkpoints?: RuntimeMDSBConformanceConsistencyCheckpointCandidate[];
  consistency_checkpoints?: RuntimeMDSBConformanceConsistencyCheckpointCandidate[];
  mdsb_preview_real_creation_attempted?: boolean;
  moc_real_creation_attempted?: boolean;
  pf_real_creation_attempted?: boolean;
  olc_real_creation_attempted?: boolean;
  pm_real_creation_attempted?: boolean;
  diagram_real_creation_attempted?: boolean;
  core_semantics_correction_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeMDSBPreviewCandidate {
  mdsb_preview_candidate_ref: string;
  payload_type: "mdsb_patch";
  mmabp_design_source_bundle_patch: Record<string, unknown>;
  structural_candidates: RuntimeMDSBStructuralCandidate[];
  conformance_checkpoints: RuntimeMDSBConformanceConsistencyCheckpointCandidate[];
  consistency_checkpoints: RuntimeMDSBConformanceConsistencyCheckpointCandidate[];
  source_trace: Record<string, unknown>;
  mdsb_preview_real_created: false;
  moc_real_created: false;
  pf_real_created: false;
  olc_real_created: false;
  pm_real_created: false;
  diagram_real_created: false;
  diagnosis_created: false;
  ir_created: false;
  registry_created: false;
  core_semantics_corrected_by_mdsb: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeMDSBBlockingReason[];
}

export interface RuntimeCombinedPreviewSourceInput extends RuntimePhase11BoundaryGuardInput {
  combined_preview_candidate_ref?: string;
  payload_type?: RuntimeExportPayloadType | string;
  scr_preview_ref?: string;
  evidence_bundle_preview_ref?: string;
  mdsb_preview_ref?: string;
  combined_readiness_state?: string;
  combined_gap_summary?: Record<string, unknown>;
  combined_checksum?: string;
  critical_component_blocked?: boolean;
  placeholder_payload_attempted?: boolean;
  combined_preview_real_send_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeCombinedPreviewCandidate {
  combined_preview_candidate_ref: string;
  payload_type: "combined_preview";
  scr_preview_ref?: string;
  evidence_bundle_preview_ref?: string;
  mdsb_preview_ref?: string;
  combined_readiness_state?: string;
  combined_gap_summary: Record<string, unknown>;
  combined_checksum?: string;
  source_trace: Record<string, unknown>;
  blocked_if_any_critical_component_blocks: boolean;
  missing_required_component_blocked: boolean;
  placeholder_payload_detected: false;
  combined_preview_real_sent: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeMDSBBlockingReason[];
}

export interface RuntimeExportBlockingRuleSourceInput extends RuntimePhase11BoundaryGuardInput {
  export_blocking_rule_candidate_ref?: string;
  blocked_by_readiness_state?: boolean;
  blocked_by_missing_scr?: boolean;
  blocked_by_missing_evidence_bundle?: boolean;
  blocked_by_missing_mdsb?: boolean;
  blocked_by_missing_source_trace?: boolean;
  blocked_by_unresolved_b0?: boolean;
  blocked_by_unresolved_b2?: boolean;
  blocked_by_unresolved_b3_c09?: boolean;
  blocked_by_b7_diagnostic_attempt?: boolean;
  blocked_by_sem_gate?: boolean;
  blocked_by_pst_gate?: boolean;
  blocked_by_manual_review_required?: boolean;
  blocked_by_reentry_required?: boolean;
  blocked_by_hard_evidence_violation?: boolean;
  blocked_by_placeholder_payload?: boolean;
  automatic_override_creation_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeExportBlockingRuleCandidate {
  export_blocking_rule_candidate_ref: string;
  blocked_by_readiness_state: boolean;
  blocked_by_missing_scr: boolean;
  blocked_by_missing_evidence_bundle: boolean;
  blocked_by_missing_mdsb: boolean;
  blocked_by_missing_source_trace: boolean;
  blocked_by_unresolved_b0: boolean;
  blocked_by_unresolved_b2: boolean;
  blocked_by_unresolved_b3_c09: boolean;
  blocked_by_b7_diagnostic_attempt: boolean;
  blocked_by_sem_gate: boolean;
  blocked_by_pst_gate: boolean;
  blocked_by_manual_review_required: boolean;
  blocked_by_reentry_required: boolean;
  blocked_by_hard_evidence_violation: boolean;
  blocked_by_placeholder_payload: boolean;
  automatic_override_created: false;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeMDSBBlockingReason[];
}

export interface RuntimeExportPreviewSupersessionBoundarySourceInput
  extends RuntimePhase11BoundaryGuardInput {
  preview_supersession_candidate_ref?: string;
  source_readiness_revision?: string | number;
  source_evidence_revision?: string | number;
  source_variable_revision?: string | number;
  source_gate_revision?: string | number;
  previous_preview_ref?: string;
  supersedes_preview_ref?: string;
  stale_reason?: string;
  prior_preview_deleted_without_trace_attempted?: boolean;
  supersession_real_emission_attempted?: boolean;
  export_payload_real_creation_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeExportPreviewSupersessionBoundary {
  preview_supersession_candidate_ref: string;
  source_readiness_revision?: string | number;
  source_evidence_revision?: string | number;
  source_variable_revision?: string | number;
  source_gate_revision?: string | number;
  previous_preview_ref?: string;
  supersedes_preview_ref?: string;
  stale_reason?: string;
  payload_state_superseded_candidate: "superseded";
  prior_preview_deleted_without_trace: false;
  supersession_real_emitted: false;
  export_payload_real_created: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeExportBoundaryBlockingReason[];
}

export interface RuntimeExportPreviewAuditCandidateSourceInput
  extends RuntimePhase11BoundaryGuardInput {
  export_preview_audit_candidate_ref?: string;
  audit_action?: RuntimeExportPreviewAuditAction | string;
  audit_reason?: string;
  source_preview_candidate_ref?: string;
  source_payload_candidate_ref?: string;
  source_component_ref?: string;
  runtime_audit_trail_real_creation_attempted?: boolean;
  db_write_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeExportPreviewAuditCandidate {
  export_preview_audit_candidate_ref: string;
  audit_action?: RuntimeExportPreviewAuditAction;
  audit_reason?: string;
  source_preview_candidate_ref?: string;
  source_payload_candidate_ref?: string;
  source_component_ref?: string;
  source_trace: Record<string, unknown>;
  runtime_audit_trail_real_created: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportBoundaryBlockingReason[];
}

export interface RuntimePhase12ExportPreviewQABoundarySourceInput
  extends RuntimePhase11BoundaryGuardInput {
  phase12_export_preview_qa_boundary_ref?: string;
  qa_green_declaration_attempted?: boolean;
  shadow_pilot_start_attempted?: boolean;
  full_runtime_authorization_attempted?: boolean;
  phase12_definition_of_done_modification_attempted?: boolean;
  phase12_started_attempted?: boolean;
  produccion_paralela_real_start_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimePhase12ExportPreviewQABoundary {
  phase12_export_preview_qa_boundary_ref: string;
  export_preview_candidates_can_feed_future_qa: true;
  scr_preview_can_feed_future_qa: true;
  evidence_bundle_preview_can_feed_future_qa: true;
  mdsb_preview_can_feed_future_qa: true;
  combined_preview_can_feed_future_qa: true;
  blocked_previews_can_feed_future_qa: true;
  qa_green_declared: false;
  shadow_pilot_started: false;
  full_runtime_authorized: false;
  produccion_paralela_started: false;
  phase12_definition_of_done_modified: false;
  ready_for_phase12_authorization: false;
  phase12_started: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeExportBoundaryBlockingReason[];
}

export interface RuntimeNoExportRealProduccionParalelaBoundarySourceInput
  extends RuntimePhase11BoundaryGuardInput {
  no_export_real_boundary_ref?: string;
  post_export_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  external_delivery_attempted?: boolean;
  produccion_paralela_real_start_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  registry_real_creation_attempted?: boolean;
  ir_real_creation_attempted?: boolean;
  diagnosis_real_creation_attempted?: boolean;
  control_plane_real_creation_attempted?: boolean;
  mba_write_attempted?: boolean;
  scene_write_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeNoExportRealProduccionParalelaBoundary {
  no_export_real_boundary_ref: string;
  post_export_executed: false;
  payload_state_sent: false;
  external_delivery_created: false;
  produccion_paralela_real_started: false;
  parallel_production_runtime_artifacts_write_detected: false;
  registry_real_created: false;
  ir_real_created: false;
  diagnosis_real_created: false;
  control_plane_real_created: false;
  mba_write_detected: false;
  scene_write_detected: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  source_trace: Record<string, unknown>;
  boundary_passed: boolean;
  blocking_reasons: RuntimeExportBoundaryBlockingReason[];
}

export interface RuntimeExportPreviewPersistenceBoundarySourceInput
  extends RuntimePhase11BoundaryGuardInput {
  export_preview_persistence_boundary_ref?: string;
  parallel_export_payload_real_creation_attempted?: boolean;
  db_write_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
  scene_write_attempted?: boolean;
  mba_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  runtime_real_start_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeExportPreviewPersistenceBoundary {
  export_preview_persistence_boundary_ref: string;
  local_scr_preview_candidate_mode: true;
  local_evidence_bundle_preview_candidate_mode: true;
  local_mdsb_preview_candidate_mode: true;
  local_combined_preview_candidate_mode: true;
  local_parallel_export_payload_candidate_mode: true;
  local_export_audit_candidate_mode: true;
  parallel_export_payload_real_creation_authorized: false;
  db_write_authorized: false;
  supabase_touch_authorized: false;
  sql_execution_authorized: false;
  endpoint_creation_authorized: false;
  service_role_used: false;
  service_role_used_in_client: false;
  scene_write_detected: false;
  mba_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  runtime_40_20_started: false;
  source_trace: Record<string, unknown>;
  persistence_boundary_passed: boolean;
  blocking_reasons: RuntimeExportBoundaryBlockingReason[];
}

export interface RuntimePhase10CloseoutForPhase11Input {
  phase10_closed_local?: boolean;
  ready_for_phase11_authorization?: boolean;
  phase11_started_local?: boolean;
  phase11_started?: boolean;
}

export interface RuntimePhase10ExportPreviewInputCandidates {
  readiness_decision_record_candidates?: unknown[];
  readiness_state_candidates?: unknown[];
  ready_candidates?: unknown[];
  ready_with_flags_candidates?: unknown[];
  blocking_gap_refs?: string[];
  non_blocking_gap_refs?: string[];
  manual_review_refs?: string[];
  reentry_refs?: string[];
  gate_result_refs?: string[];
  semantic_event_refs?: string[];
  pst_event_refs?: string[];
  carry_forward_gap_refs?: string[];
  readiness_audit_candidates?: unknown[];
  phase11_export_preview_boundaries?: unknown[];
}

export interface RuntimePhase11BoundaryGuardInput {
  readiness_recalculation_attempted?: boolean;
  phase10_modification_attempted?: boolean;
  export_preview_previously_created?: boolean;
  export_preview_real_creation_attempted?: boolean;
  parallel_export_payload_real_previously_created?: boolean;
  parallel_export_payload_real_creation_attempted?: boolean;
  post_export_execution_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  produccion_paralela_previously_started?: boolean;
  produccion_paralela_start_attempted?: boolean;
  registry_previously_created?: boolean;
  registry_creation_attempted?: boolean;
  ir_creation_attempted?: boolean;
  diagnosis_creation_attempted?: boolean;
  control_plane_real_creation_attempted?: boolean;
  supabase_previously_touched?: boolean;
  supabase_touch_attempted?: boolean;
  sql_previously_executed?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_previously_created?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
  mba_write_attempted?: boolean;
  scene_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  phase12_started_attempted?: boolean;
}

export interface RuntimePhase11InputRevalidationDecision {
  phase10_closed_local: boolean;
  ready_for_phase11_authorization: boolean;
  phase11_started_local: boolean;
  phase11_closed_local: false;
  ready_for_phase12_authorization: false;
  readiness_decision_record_candidates_available: boolean;
  readiness_state_candidate_available: boolean;
  ready_candidates_available: boolean;
  ready_with_flags_candidates_available: boolean;
  blocking_gap_refs_available: boolean;
  non_blocking_gap_refs_available: boolean;
  manual_review_refs_available: boolean;
  reentry_refs_available: boolean;
  gate_result_refs_available: boolean;
  semantic_event_refs_available: boolean;
  pst_event_refs_available: boolean;
  carry_forward_gap_refs_available: boolean;
  readiness_audit_candidates_available: boolean;
  phase11_export_preview_boundary_from_phase10e_available: boolean;
  export_preview_previously_created: false;
  parallel_export_payload_real_previously_created: false;
  produccion_paralela_previously_started: false;
  registry_previously_created: false;
  supabase_previously_touched: false;
  sql_previously_executed: false;
  endpoint_previously_created: false;
  readiness_recalculated: false;
  phase10_modified: false;
  phase12_started: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimeExportPreviewServiceSourceInput extends RuntimePhase11BoundaryGuardInput {
  export_preview_candidate_ref?: string;
  run_id?: string;
  activity_runtime_run_id?: string;
  role_runtime_session_id?: string;
  source_readiness_decision_candidate_ref?: string;
  source_readiness_state?: RuntimeReadinessStateForExportPreview | string;
  source_gate_result_refs?: string[];
  source_evidence_refs?: string[];
  source_canonical_variable_refs?: string[];
  source_gap_refs?: string[];
  source_trace?: Record<string, unknown>;
  export_preview_status?: RuntimeExportPreviewStatus | string;
}

export interface RuntimeExportPreviewServiceCandidate {
  export_preview_candidate_ref: string;
  run_id?: string;
  activity_runtime_run_id?: string;
  role_runtime_session_id?: string;
  source_readiness_decision_candidate_ref?: string;
  source_readiness_state?: RuntimeReadinessStateForExportPreview;
  source_gate_result_refs: string[];
  source_evidence_refs: string[];
  source_canonical_variable_refs: string[];
  source_gap_refs: string[];
  source_trace: Record<string, unknown>;
  export_preview_status: RuntimeExportPreviewStatus;
  export_preview_real_created: false;
  post_export_executed: false;
  payload_state_sent: false;
  produccion_paralela_started: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimeExportEligibilityGateSourceInput {
  export_eligibility_candidate_ref?: string;
  readiness_state?: RuntimeReadinessStateForExportPreview | string;
  blocking_gap_refs?: string[];
  non_blocking_gap_refs?: string[];
  source_trace?: Record<string, unknown>;
  blocked_degraded_to_ready_with_flags_attempted?: boolean;
  blocking_gap_hidden_as_flag_attempted?: boolean;
}

export interface RuntimeExportEligibilityGateCandidate {
  export_eligibility_candidate_ref: string;
  readiness_state?: RuntimeReadinessStateForExportPreview;
  ready_allows_preview_candidate: boolean;
  ready_with_flags_allows_preview_candidate_with_visible_flags: boolean;
  blocked_by_missing_evidence_blocks_preview: boolean;
  blocked_by_contradiction_blocks_preview: boolean;
  blocked_by_missing_canonical_route_blocks_preview: boolean;
  manual_review_required_blocks_preview: boolean;
  reentry_required_blocks_preview: boolean;
  blocking_gap_refs_empty: boolean;
  non_blocking_gap_refs_can_travel_as_flags: boolean;
  export_block_reason?: string;
  source_trace: Record<string, unknown>;
  blocked_degraded_to_ready_with_flags: false;
  blocking_gap_hidden_as_flag: false;
  readiness_trace_missing: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimeExportContractSourceInput {
  runtime_export_contract_ref?: string;
  export_contract_version?: string;
  payload_type?: RuntimeExportPayloadType | string;
  required_payload_sections?: string[];
  required_provenance_fields?: string[];
  required_readiness_fields?: string[];
  required_checksum_policy?: string;
  source_node_ref?: string;
  source_trace?: Record<string, unknown>;
  payload_outside_contract_attempted?: boolean;
  payload_below_minimum_attempted?: boolean;
  placeholder_payload_attempted?: boolean;
}

export interface RuntimeExportContractSourceCandidate {
  runtime_export_contract_ref: string;
  export_contract_version?: string;
  payload_type?: RuntimeExportPayloadType;
  required_payload_sections: string[];
  required_provenance_fields: string[];
  required_readiness_fields: string[];
  required_checksum_policy?: string;
  source_node_ref?: string;
  source_trace: Record<string, unknown>;
  payload_outside_contract: false;
  payload_below_minimum: false;
  placeholder_payload_detected: false;
  contract_candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimeParallelExportPayloadPreviewSourceInput
  extends RuntimePhase11BoundaryGuardInput {
  parallel_export_payload_candidate_ref?: string;
  run_id?: string;
  payload_type?: RuntimeExportPayloadType | string;
  payload_json?: Record<string, unknown>;
  payload_state?: RuntimeExportPayloadState | "sent" | string;
  checksum?: string;
  created_at_preview?: string;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeParallelExportPayloadPreviewCandidate {
  parallel_export_payload_candidate_ref: string;
  parallel_export_payload_real_created: false;
  run_id?: string;
  payload_type?: RuntimeExportPayloadType;
  payload_json: Record<string, unknown>;
  payload_state: RuntimeExportPayloadState;
  payload_state_sent: false;
  checksum?: string;
  created_at_preview?: string;
  source_trace: Record<string, unknown>;
  db_write_created: false;
  post_export_executed: false;
  produccion_paralela_started: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimePayloadStateLifecycleSourceInput {
  payload_lifecycle_candidate_ref?: string;
  current_state?: RuntimeExportPayloadState | "sent" | string;
  requested_transition?: RuntimePayloadLifecycleTransition | string;
  eligibility_passes?: boolean;
  readiness_blocks?: boolean;
  source_revision_changed?: boolean;
  explicit_local_revalidation?: boolean;
  audit_candidate_ref?: string;
  source_trace?: Record<string, unknown>;
}

export interface RuntimePayloadStateLifecycleCandidate {
  payload_lifecycle_candidate_ref: string;
  current_state?: RuntimeExportPayloadState;
  requested_transition?: RuntimePayloadLifecycleTransition;
  draft_to_ready_supported_when_eligibility_passes: boolean;
  draft_to_blocked_supported_when_readiness_blocks: boolean;
  ready_to_superseded_supported_when_source_revision_changes: boolean;
  blocked_to_draft_supported_with_explicit_local_revalidation: boolean;
  sent_state_attempted: false;
  invented_state_detected: false;
  audit_candidate_required: true;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimeChecksumIdempotencySourceInput {
  checksum_candidate_ref?: string;
  checksum_source?: string;
  checksum_algorithm?: string;
  source_payload_hash?: string;
  source_readiness_hash?: string;
  source_evidence_hash?: string;
  source_variable_hash?: string;
  idempotency_key?: string;
  duplicate_preview_detected?: boolean;
  supersedes_payload_candidate_ref?: string;
  previous_payload_candidate_ref?: string;
  preview_replaced_without_trace_attempted?: boolean;
  source_trace?: Record<string, unknown>;
}

export interface RuntimeChecksumIdempotencyCandidate {
  checksum_candidate_ref: string;
  checksum_source?: string;
  checksum_algorithm?: string;
  source_payload_hash?: string;
  source_readiness_hash?: string;
  source_evidence_hash?: string;
  source_variable_hash?: string;
  idempotency_key?: string;
  duplicate_preview_detected: boolean;
  supersedes_payload_candidate_ref?: string;
  previous_payload_candidate_ref?: string;
  duplicate_preview_blocked: boolean;
  preview_replaced_without_trace: false;
  export_payload_real_created: false;
  source_trace: Record<string, unknown>;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimeSourceTraceEnvelopeSourceInput {
  source_trace_envelope_ref?: string;
  source_document?: string;
  source_sheet?: string;
  source_row_number?: number;
  raw_row_internal?: Record<string, unknown>;
  source_codes?: string[];
  source_refs?: string[];
  source_gate_refs?: string[];
  source_gap_refs?: string[];
  source_evidence_refs?: string[];
  source_variable_refs?: string[];
  source_readiness_ref?: string;
  source_trace?: Record<string, unknown>;
  provenance_fabricated_attempted?: boolean;
  payload_without_source_attempted?: boolean;
}

export interface RuntimeSourceTraceEnvelopeCandidate {
  source_trace_envelope_ref: string;
  source_document?: string;
  source_sheet?: string;
  source_row_number?: number;
  raw_row_internal?: Record<string, unknown>;
  source_codes: string[];
  source_refs: string[];
  source_gate_refs: string[];
  source_gap_refs: string[];
  source_evidence_refs: string[];
  source_variable_refs: string[];
  source_readiness_ref?: string;
  source_trace: Record<string, unknown>;
  source_trace_missing: false;
  provenance_fabricated: false;
  payload_without_source: false;
  candidate_allowed: boolean;
  blocking_reasons: RuntimeExportPreviewBlockingReason[];
}

export interface RuntimePhase11ExportPreviewFoundationLocalInput {
  case_id: string;
  phase10_closeout: RuntimePhase10CloseoutForPhase11Input;
  phase10_candidates: RuntimePhase10ExportPreviewInputCandidates;
  export_preview_service_sources?: RuntimeExportPreviewServiceSourceInput[];
  export_eligibility_gate_sources?: RuntimeExportEligibilityGateSourceInput[];
  runtime_export_contract_sources?: RuntimeExportContractSourceInput[];
  parallel_export_payload_preview_sources?: RuntimeParallelExportPayloadPreviewSourceInput[];
  payload_state_lifecycle_sources?: RuntimePayloadStateLifecycleSourceInput[];
  checksum_idempotency_sources?: RuntimeChecksumIdempotencySourceInput[];
  source_trace_envelope_sources?: RuntimeSourceTraceEnvelopeSourceInput[];
  scr_preview_sources?: RuntimeSCRPreviewSourceInput[];
  scr_activity_anchor_sources?: RuntimeSCRActivityAnchorSourceInput[];
  scr_block_outputs_sources?: RuntimeSCRBlockOutputsSourceInput[];
  scr_gap_readiness_route_transport_sources?: RuntimeSCRGapReadinessRouteTransportSourceInput[];
  evidence_bundle_preview_sources?: RuntimeEvidenceBundlePreviewSourceInput[];
  evidence_bundle_evidence_item_sources?: RuntimeEvidenceBundleEvidenceItemSourceInput[];
  evidence_bundle_canonical_variable_route_status_sources?: RuntimeEvidenceBundleCanonicalVariableRouteStatusSourceInput[];
  evidence_bundle_epistemic_hardening_boundary_sources?: RuntimeEvidenceBundleEpistemicHardeningBoundarySourceInput[];
  mdsb_preview_sources?: RuntimeMDSBPreviewSourceInput[];
  mdsb_structural_candidate_sources?: RuntimeMDSBStructuralCandidateSourceInput[];
  mdsb_conformance_consistency_checkpoint_sources?: RuntimeMDSBConformanceConsistencyCheckpointSourceInput[];
  combined_preview_sources?: RuntimeCombinedPreviewSourceInput[];
  export_blocking_rule_sources?: RuntimeExportBlockingRuleSourceInput[];
  preview_supersession_boundary_sources?: RuntimeExportPreviewSupersessionBoundarySourceInput[];
  export_preview_audit_candidate_sources?: RuntimeExportPreviewAuditCandidateSourceInput[];
  phase12_export_preview_qa_boundary_sources?: RuntimePhase12ExportPreviewQABoundarySourceInput[];
  no_export_real_produccion_paralela_boundary_sources?: RuntimeNoExportRealProduccionParalelaBoundarySourceInput[];
  export_preview_persistence_boundary_sources?: RuntimeExportPreviewPersistenceBoundarySourceInput[];
  boundary_guard?: RuntimePhase11BoundaryGuardInput;
}

export interface RuntimePhase11ExportPreviewFoundationLocalResult {
  status:
    | RuntimeExportPreviewStatus
    | RuntimeSCRPreviewStatus
    | RuntimeEvidenceBundlePreviewStatus
    | RuntimeMDSBPreviewStatus
    | RuntimeExportBoundaryStatus;
  phase11_input_revalidation: RuntimePhase11InputRevalidationDecision;
  export_preview_service_candidates: RuntimeExportPreviewServiceCandidate[];
  export_eligibility_gate_candidates: RuntimeExportEligibilityGateCandidate[];
  runtime_export_contract_source_candidates: RuntimeExportContractSourceCandidate[];
  parallel_export_payload_preview_candidates: RuntimeParallelExportPayloadPreviewCandidate[];
  payload_state_lifecycle_candidates: RuntimePayloadStateLifecycleCandidate[];
  checksum_idempotency_candidates: RuntimeChecksumIdempotencyCandidate[];
  source_trace_envelope_candidates: RuntimeSourceTraceEnvelopeCandidate[];
  scr_preview_candidates?: RuntimeSCRPreviewCandidate[];
  scr_activity_anchor_candidates?: RuntimeSCRActivityAnchorCandidate[];
  scr_block_outputs_candidates?: RuntimeSCRBlockOutputsCandidate[];
  scr_gap_readiness_route_transport_candidates?: RuntimeSCRGapReadinessRouteTransportCandidate[];
  evidence_bundle_preview_candidates?: RuntimeEvidenceBundlePreviewCandidate[];
  evidence_bundle_evidence_item_candidates?: RuntimeEvidenceBundleEvidenceItemCandidate[];
  evidence_bundle_canonical_variable_route_status_candidates?: RuntimeEvidenceBundleCanonicalVariableRouteStatusCandidate[];
  evidence_bundle_epistemic_hardening_boundaries?: RuntimeEvidenceBundleEpistemicHardeningBoundary[];
  mdsb_preview_candidates?: RuntimeMDSBPreviewCandidate[];
  mdsb_structural_candidates?: RuntimeMDSBStructuralCandidate[];
  mdsb_conformance_consistency_checkpoint_candidates?: RuntimeMDSBConformanceConsistencyCheckpointCandidate[];
  combined_preview_candidates?: RuntimeCombinedPreviewCandidate[];
  export_blocking_rule_candidates?: RuntimeExportBlockingRuleCandidate[];
  preview_supersession_boundaries?: RuntimeExportPreviewSupersessionBoundary[];
  export_preview_audit_candidates?: RuntimeExportPreviewAuditCandidate[];
  phase12_export_preview_qa_boundaries?: RuntimePhase12ExportPreviewQABoundary[];
  no_export_real_produccion_paralela_boundaries?: RuntimeNoExportRealProduccionParalelaBoundary[];
  export_preview_persistence_boundaries?: RuntimeExportPreviewPersistenceBoundary[];
  phase11_started_local: boolean;
  phase11_closed_local: false;
  ready_for_phase12_authorization: false;
  readiness_recalculated: false;
  phase10_modified: false;
  runtime_40_20_started: false;
  catalog_activated: false;
  migration_applied: false;
  supabase_touched: false;
  sql_executed: false;
  endpoint_created: false;
  service_role_used: false;
  service_role_used_in_client: false;
  export_preview_real_created: false;
  parallel_export_payload_real_created: false;
  payload_state_sent: false;
  post_export_executed: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  diagnosis_created: false;
  control_plane_real_created: false;
  mba_write_detected: false;
  scene_write_detected: false;
  parallel_production_runtime_artifacts_write_detected: false;
  qa_green_declared: false;
  shadow_pilot_started: false;
  full_runtime_authorized: false;
  phase12_started: false;
}
