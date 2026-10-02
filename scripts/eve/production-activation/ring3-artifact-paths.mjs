#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");
const docs = join(repoRoot, "docs/production-activation");

export const RING3_POLICY_PATHS = {
  authorization: join(docs, "ring3_authorization_record.json"),
  operatingEnvelope: join(docs, "ring3_operating_envelope.json"),
  controlledProductionAccess: join(docs, "ring3_controlled_production_access_policy.json"),
  productionDataBoundary: join(docs, "ring3_production_data_boundary_policy.json"),
  supervisionPolicy: join(docs, "ring3_supervision_policy.json"),
  executionReadiness: join(docs, "ring3_execution_readiness.json"),
  rollbackAbortRequirements: join(docs, "ring3_rollback_abort_requirements.json"),
  observabilityRequirements: join(docs, "ring3_observability_requirements.json"),
  noGoConstraints: join(docs, "ring3_no_go_constraints.json"),
};

export const RING3_ARTIFACT_PATHS = {
  targetReport: join(docs, "ring3_controlled_production_target_report.json"),
  scopeManifest: join(docs, "ring3_controlled_production_scope_manifest.json"),
  mbaConformance: join(docs, "ring3_mba_conformance_report.json"),
  structuralCoverage: join(docs, "ring3_structural_framework_coverage_report.json"),
  clientUiFlow: join(docs, "ring3_client_ui_flow_results.json"),
  bffRuntimeFlow: join(docs, "ring3_bff_runtime_flow_results.json"),
  runtimeRecordInventory: join(docs, "ring3_runtime_record_inventory.json"),
  gateReadiness: join(docs, "ring3_gate_readiness_results.json"),
  clientSafeResult: join(docs, "ring3_client_safe_result_results.json"),
  consultantPacket: join(docs, "ring3_consultant_packet_results.json"),
  parallelPayload: join(docs, "ring3_parallel_payload_results.json"),
  observability: join(docs, "ring3_observability_results.json"),
  rollback: join(docs, "ring3_rollback_drill_results.json"),
  abort: join(docs, "ring3_abort_drill_results.json"),
  noGo: join(docs, "ring3_no_go_checklist.json"),
  boundary: join(docs, "ring3_boundary_ledger.json"),
  commandResults: join(docs, "ring3_command_results.json"),
  nextRingReadiness: join(docs, "ring3_next_ring_readiness.json"),
  traceability: join(docs, "ring3_controlled_production_execution_traceability.json"),
  closeout: join(docs, "ring3_controlled_production_execution_closeout.md"),
  chainContext: join(docs, "eve_local_activation_chain_context.json"),
  ring2NextRingReadiness: join(docs, "ring2_next_ring_readiness.json"),
  ring2SupervisorAssignment: join(docs, "ring2_supervisor_assignment.json"),
  ring2PilotScope: join(docs, "ring2_pilot_scope_manifest.json"),
};

export const RING3_FEATURE_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
  EVE_GATES_READINESS_LOCAL_ENABLED: "true",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
  EVE_RING3_CONTROLLED_PRODUCTION_ENABLED: "true",
  EVE_RING3_SUPERVISED_MODE: "true",
  EVE_RING3_ROLLBACK_READY: "true",
  EVE_RING3_ABORT_READY: "true",
};

export const RING3_BLOCKED_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
  EVE_GATES_READINESS_LOCAL_ENABLED: "false",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
  EVE_RING3_CONTROLLED_PRODUCTION_ENABLED: "false",
  EVE_RING3_SUPERVISED_MODE: "false",
  EVE_RING3_ROLLBACK_READY: "false",
  EVE_RING3_ABORT_READY: "false",
  EVE_RING3_SAFE_STAGING_ENABLED: "false",
  EVE_RING3_CONTROLLED_PRODUCTION_TARGET_APPROVED: "false",
};

export const RING3_METADATA = {
  ring: "ring3",
  ring3_scope: "controlled_production_supervised_rollback_ready",
  controlled_production_access: true,
  human_supervision_required: true,
  consultant_review_required: true,
  scoped_production_data_only: true,
  production_public_access_enabled: false,
  activation_allowed_general_production: false,
};

export const BLOCKED_EXIT_CODE = 2;
