#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");
const docs = join(repoRoot, "docs/production-activation");

export const RING1_ARTIFACT_PATHS = {
  mbaConformance: join(docs, "ring1_mba_conformance_report.json"),
  structuralCoverage: join(docs, "ring1_structural_framework_coverage_report.json"),
  testTenantManifest: join(docs, "ring1_test_tenant_manifest.json"),
  internalTestClientManifest: join(docs, "ring1_internal_test_client_manifest.json"),
  clientUiFlow: join(docs, "ring1_client_ui_flow_results.json"),
  bffRuntimeFlow: join(docs, "ring1_bff_runtime_flow_results.json"),
  runtimeRecordInventory: join(docs, "ring1_runtime_record_inventory.json"),
  gateReadiness: join(docs, "ring1_gate_readiness_results.json"),
  clientSafeResult: join(docs, "ring1_client_safe_result_results.json"),
  consultantPacket: join(docs, "ring1_consultant_packet_results.json"),
  parallelPayload: join(docs, "ring1_parallel_payload_results.json"),
  observability: join(docs, "ring1_observability_results.json"),
  rollback: join(docs, "ring1_rollback_drill_results.json"),
  abort: join(docs, "ring1_abort_drill_results.json"),
  noGo: join(docs, "ring1_no_go_checklist.json"),
  boundary: join(docs, "ring1_boundary_ledger.json"),
  commandResults: join(docs, "ring1_command_results.json"),
  nextRingReadiness: join(docs, "ring1_next_ring_readiness.json"),
  traceability: join(docs, "ring1_internal_test_tenant_execution_traceability.json"),
  closeout: join(docs, "ring1_internal_test_tenant_execution_closeout.md"),
  ring1Authorization: join(docs, "ring1_authorization_record.json"),
  ring1ExecutionReadiness: join(docs, "ring1_execution_readiness.json"),
  ring1OperatingEnvelope: join(docs, "ring1_operating_envelope.json"),
  chainContext: join(docs, "eve_local_activation_chain_context.json"),
};

export const RING1_FEATURE_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
  EVE_GATES_READINESS_LOCAL_ENABLED: "true",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
  EVE_RING1_INTERNAL_TEST_TENANT_ENABLED: "true",
};

export const RING1_BLOCKED_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
  EVE_GATES_READINESS_LOCAL_ENABLED: "false",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
  EVE_RING1_INTERNAL_TEST_TENANT_ENABLED: "false",
};

export const RING1_METADATA = {
  ring: "ring1",
  test_tenant: true,
  internal_test_client: true,
  controlled_test_data: true,
  real_external_client_data: false,
};
