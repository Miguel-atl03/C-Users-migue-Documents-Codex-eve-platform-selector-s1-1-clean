#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");
const docs = join(repoRoot, "docs/production-activation");

export const RING0_ARTIFACT_PATHS = {
  mbaConformance: join(docs, "ring0_mba_conformance_report.json"),
  structuralCoverage: join(docs, "ring0_structural_framework_coverage_report.json"),
  fixtureManifest: join(docs, "ring0_fixture_manifest.json"),
  uiBffRuntimeFlow: join(docs, "ring0_ui_bff_runtime_flow_results.json"),
  runtimeRecordInventory: join(docs, "ring0_runtime_record_inventory.json"),
  gateReadiness: join(docs, "ring0_gate_readiness_results.json"),
  clientSafeResult: join(docs, "ring0_client_safe_result_results.json"),
  consultantPacket: join(docs, "ring0_consultant_packet_results.json"),
  parallelPayload: join(docs, "ring0_parallel_payload_results.json"),
  observability: join(docs, "ring0_observability_results.json"),
  rollback: join(docs, "ring0_rollback_drill_results.json"),
  abort: join(docs, "ring0_abort_drill_results.json"),
  noGo: join(docs, "ring0_no_go_checklist.json"),
  boundary: join(docs, "ring0_boundary_ledger.json"),
  commandResults: join(docs, "ring0_command_results.json"),
  nextRingReadiness: join(docs, "ring0_next_ring_readiness.json"),
  traceability: join(docs, "ring0_internal_operator_execution_traceability.json"),
  closeout: join(docs, "ring0_internal_operator_execution_closeout.md"),
  p9bAuthorization: join(docs, "eve_production_activation_p9b_ring0_authorization_record.json"),
  p9bOperatingEnvelope: join(docs, "eve_production_activation_p9b_ring0_operating_envelope.json"),
  chainContext: join(docs, "eve_local_activation_chain_context.json"),
};

export const RING0_FEATURE_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
  EVE_GATES_READINESS_LOCAL_ENABLED: "true",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
  EVE_RING0_INTERNAL_OPERATOR_ENABLED: "true",
};

export const RING0_BLOCKED_FLAGS = {
  EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
  EVE_GATES_READINESS_LOCAL_ENABLED: "false",
  EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
  EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
  EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
  EVE_RING0_INTERNAL_OPERATOR_ENABLED: "false",
};
