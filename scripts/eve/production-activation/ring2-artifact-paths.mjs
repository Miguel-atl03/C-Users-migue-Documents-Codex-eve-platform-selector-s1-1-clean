#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");
const docs = join(repoRoot, "docs/production-activation");

export const RING2_POLICY_PATHS = {
  authorization: join(docs, "ring2_authorization_record.json"),
  operatingEnvelope: join(docs, "ring2_operating_envelope.json"),
  pilotClientPolicy: join(docs, "ring2_authorized_pilot_client_policy.json"),
  dataConsentBoundary: join(docs, "ring2_data_consent_boundary_policy.json"),
  supervisionPolicy: join(docs, "ring2_supervision_policy.json"),
  executionReadiness: join(docs, "ring2_execution_readiness.json"),
};

export const RING2_ARTIFACT_PATHS = {
  pilotReadiness: join(docs, "ring2_pilot_readiness_report.json"),
  pilotClientManifest: join(docs, "ring2_pilot_client_manifest.json"),
  pilotConsentRecord: join(docs, "ring2_pilot_consent_record.json"),
  supervisorAssignment: join(docs, "ring2_supervisor_assignment.json"),
  pilotScopeManifest: join(docs, "ring2_pilot_scope_manifest.json"),
  mbaConformance: join(docs, "ring2_mba_conformance_report.json"),
  structuralCoverage: join(docs, "ring2_structural_framework_coverage_report.json"),
  clientUiFlow: join(docs, "ring2_client_ui_flow_results.json"),
  bffRuntimeFlow: join(docs, "ring2_bff_runtime_flow_results.json"),
  runtimeRecordInventory: join(docs, "ring2_runtime_record_inventory.json"),
  gateReadiness: join(docs, "ring2_gate_readiness_results.json"),
  clientSafeResult: join(docs, "ring2_client_safe_result_results.json"),
  consultantPacket: join(docs, "ring2_consultant_packet_results.json"),
  parallelPayload: join(docs, "ring2_parallel_payload_results.json"),
  observability: join(docs, "ring2_observability_results.json"),
  rollback: join(docs, "ring2_rollback_drill_results.json"),
  abort: join(docs, "ring2_abort_drill_results.json"),
  noGo: join(docs, "ring2_no_go_checklist.json"),
  boundary: join(docs, "ring2_boundary_ledger.json"),
  commandResults: join(docs, "ring2_command_results.json"),
  nextRingReadiness: join(docs, "ring2_next_ring_readiness.json"),
  traceability: join(docs, "ring2_authorized_pilot_execution_traceability.json"),
  closeout: join(docs, "ring2_authorized_pilot_execution_closeout.md"),
  chainContext: join(docs, "eve_local_activation_chain_context.json"),
  ring1Authorization: join(docs, "ring1_authorization_record.json"),
};

export const RING2_FEATURE_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
  EVE_GATES_READINESS_LOCAL_ENABLED: "true",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
  EVE_RING2_AUTHORIZED_PILOT_ENABLED: "true",
};

export const RING2_BLOCKED_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
  EVE_GATES_READINESS_LOCAL_ENABLED: "false",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
  EVE_RING2_AUTHORIZED_PILOT_ENABLED: "false",
};

export const RING2_METADATA = {
  ring: "ring2",
  authorized_pilot_client: true,
  pilot_scope_limited: true,
  human_supervision_required: true,
  consultant_review_required: true,
  controlled_pilot_data: true,
  real_external_client_data: false,
};

export const BLOCKED_EXIT_CODE = 2;
