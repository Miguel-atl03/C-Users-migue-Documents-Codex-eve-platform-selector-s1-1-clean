#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import {
  RING1_ARTIFACT_PATHS,
  RING1_FEATURE_FLAGS,
  RING1_METADATA,
} from "./ring1-artifact-paths.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { updateChainContext } from "./local-activation-chain-context-lib.mjs";

function main() {
  const ring1Auth = readJsonIfExists(RING1_ARTIFACT_PATHS.ring1Authorization);
  const envelope = readJsonIfExists(RING1_ARTIFACT_PATHS.ring1OperatingEnvelope);
  const priorContext = readJsonIfExists(RING1_ARTIFACT_PATHS.chainContext);

  if (ring1Auth?.ring1_authorized !== true) {
    console.error("Ring 1 authorization not verified");
    process.exit(1);
  }

  const test_tenant_id = crypto.randomUUID();
  const test_case_id = crypto.randomUUID();
  const test_role_id = crypto.randomUUID();
  const test_activity_id = priorContext?.activity_id ?? crypto.randomUUID();
  const test_run_id = crypto.randomUUID();
  const internal_test_client_id = `ring1-internal-client-${Date.now()}`;

  const testTenantManifest = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_TEST_TENANT_MANIFEST",
    generated_at: new Date().toISOString(),
    authorization_ref: ring1Auth.authorization_ref,
    test_tenant_id,
    test_case_id,
    test_role_id,
    test_activity_id,
    test_run_id,
    controlled_test_data: true,
    real_external_client_data: false,
    public_access: false,
    diagnosis_allowed: false,
    external_export_allowed: false,
    production_public_allowed: false,
    ring1_scope: "internal_test_tenant_limited_client",
    metadata: RING1_METADATA,
    feature_flags: RING1_FEATURE_FLAGS,
    ring0_chain_context_ref: envelope?.ring0_chain_context_ref ?? priorContext?.context_ref ?? null,
  };

  const internalTestClientManifest = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_INTERNAL_TEST_CLIENT_MANIFEST",
    generated_at: new Date().toISOString(),
    authorization_ref: ring1Auth.authorization_ref,
    internal_test_client_id,
    test_tenant_id,
    test_case_id,
    allowed_user_type: "internal_test_client",
    real_external_client_access_enabled: false,
    production_public_access_enabled: false,
    client_ui_mode: "limited_safe_client",
    bff_mode: "client_safe_bff_local_or_staging",
    controlled_test_data: true,
    real_external_client_data: false,
    metadata: RING1_METADATA,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.testTenantManifest, `${JSON.stringify(testTenantManifest, null, 2)}\n`);
  writeFileSync(
    RING1_ARTIFACT_PATHS.internalTestClientManifest,
    `${JSON.stringify(internalTestClientManifest, null, 2)}\n`,
  );

  updateChainContext({
    updated_at: new Date().toISOString(),
    tenant_id: test_tenant_id,
    case_id: test_case_id,
    role_id: test_role_id,
    activity_id: test_activity_id,
    run_id: test_run_id,
    activity_runtime_run_id: test_run_id,
    internal_test_client_id,
    controlled_test_data: true,
    real_external_client_data: false,
    test_tenant: true,
    internal_test_client: true,
    ring1_scope: "internal_test_tenant_limited_client",
    metadata: RING1_METADATA,
    source_trace: [{ stage: "ring1_create_test_tenant_fixture", at: new Date().toISOString() }],
  });

  const executionReadiness = readJsonIfExists(RING1_ARTIFACT_PATHS.ring1ExecutionReadiness);
  if (executionReadiness) {
    writeFileSync(
      RING1_ARTIFACT_PATHS.ring1ExecutionReadiness,
      `${JSON.stringify(
        {
          ...executionReadiness,
          ring1_execution_started: true,
          updated_at: new Date().toISOString(),
          test_tenant_manifest_ref: "docs/production-activation/ring1_test_tenant_manifest.json",
          internal_test_client_manifest_ref:
            "docs/production-activation/ring1_internal_test_client_manifest.json",
        },
        null,
        2,
      )}\n`,
    );
  }

  const result = {
    test_tenant_created: true,
    internal_test_client_created: true,
    test_tenant_id,
    internal_test_client_id,
    real_external_client_data: false,
    production_public_allowed: false,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
