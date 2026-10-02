#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");
const docs = join(repoRoot, "docs/production-activation");

export const RING4_POLICY_PATHS = {
  authorization: join(docs, "ring4_authorization_record.json"),
  operatingEnvelope: join(docs, "ring4_operating_envelope.json"),
  scaleGovernance: join(docs, "ring4_scale_governance_policy.json"),
  productionExpansion: join(docs, "ring4_production_expansion_policy.json"),
  trafficTenantCaseRamp: join(docs, "ring4_traffic_tenant_case_ramp_policy.json"),
  productionDataBoundary: join(docs, "ring4_production_data_boundary_policy.json"),
  observabilitySlo: join(docs, "ring4_observability_slo_policy.json"),
  incidentResponse: join(docs, "ring4_incident_response_policy.json"),
  executionReadiness: join(docs, "ring4_execution_readiness.json"),
  rollbackAbortRequirements: join(docs, "ring4_rollback_abort_requirements.json"),
  noGoConstraints: join(docs, "ring4_no_go_constraints.json"),
};

export const RING4_ARTIFACT_PATHS = {
  scaleTargetReport: join(docs, "ring4_scale_target_report.json"),
  scaleExecutionScope: join(docs, "ring4_scale_execution_scope_manifest.json"),
  trafficTenantCaseAllowlist: join(docs, "ring4_traffic_tenant_case_allowlist.json"),
  mbaConformance: join(docs, "ring4_mba_conformance_report.json"),
  structuralCoverage: join(docs, "ring4_structural_framework_coverage_report.json"),
  clientUiFlow: join(docs, "ring4_client_ui_flow_results.json"),
  bffRuntimeFlow: join(docs, "ring4_bff_runtime_flow_results.json"),
  runtimeRecordInventory: join(docs, "ring4_runtime_record_inventory.json"),
  gateReadiness: join(docs, "ring4_gate_readiness_results.json"),
  clientSafeResult: join(docs, "ring4_client_safe_result_results.json"),
  consultantPacket: join(docs, "ring4_consultant_packet_results.json"),
  parallelPayload: join(docs, "ring4_parallel_payload_results.json"),
  observabilitySlo: join(docs, "ring4_observability_slo_results.json"),
  incidentResponse: join(docs, "ring4_incident_response_results.json"),
  rollback: join(docs, "ring4_rollback_drill_results.json"),
  abort: join(docs, "ring4_abort_drill_results.json"),
  noGo: join(docs, "ring4_no_go_checklist.json"),
  boundary: join(docs, "ring4_boundary_ledger.json"),
  commandResults: join(docs, "ring4_command_results.json"),
  scaleDecisionCandidate: join(docs, "ring4_scale_decision_candidate.json"),
  finalActivationReadiness: join(docs, "ring4_final_activation_readiness.json"),
  traceability: join(docs, "ring4_expanded_production_execution_traceability.json"),
  closeout: join(docs, "ring4_expanded_production_execution_closeout.md"),
  chainContext: join(docs, "eve_local_activation_chain_context.json"),
  ring3NextRingReadiness: join(docs, "ring3_next_ring_readiness.json"),
  ring3ScopeManifest: join(docs, "ring3_controlled_production_scope_manifest.json"),
  ring3NoGo: join(docs, "ring3_no_go_checklist.json"),
  ring2SupervisorAssignment: join(docs, "ring2_supervisor_assignment.json"),
};

export const RING4_FEATURE_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
  EVE_GATES_READINESS_LOCAL_ENABLED: "true",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
  EVE_RING4_EXPANDED_PRODUCTION_ENABLED: "true",
  EVE_RING4_SUPERVISED_MODE: "true",
  EVE_RING4_ROLLBACK_READY: "true",
  EVE_RING4_ABORT_READY: "true",
  EVE_RING4_SCALE_GOVERNANCE_ENABLED: "true",
};

export const RING4_BLOCKED_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
  EVE_GATES_READINESS_LOCAL_ENABLED: "false",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
  EVE_RING4_EXPANDED_PRODUCTION_ENABLED: "false",
  EVE_RING4_SUPERVISED_MODE: "false",
  EVE_RING4_ROLLBACK_READY: "false",
  EVE_RING4_ABORT_READY: "false",
  EVE_RING4_SCALE_GOVERNANCE_ENABLED: "false",
  EVE_RING4_EXPANDED_PRODUCTION_TARGET_APPROVED: "false",
};

export const RING4_METADATA = {
  ring: "ring4",
  ring4_scope: "expanded_production_scale_governance",
  expanded_production_access: true,
  human_supervision_required: true,
  consultant_review_required: true,
  scoped_production_data_only: true,
  production_public_access_enabled: false,
  activation_allowed_general_production: false,
  automatic_scale_up_allowed: false,
};

export const BLOCKED_EXIT_CODE = 2;
