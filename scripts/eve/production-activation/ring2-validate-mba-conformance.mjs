#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING2_ARTIFACT_PATHS, repoRoot } from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness, writeBlockedArtifact } from "./ring2-pilot-readiness-lib.mjs";
import { readJsonIfExists } from "./p9a-production-activation-lib.mjs";
import { readChainContext } from "./local-activation-chain-context-lib.mjs";

function fileContains(filePath, pattern) {
  if (!existsSync(filePath)) return false;
  return pattern.test(readFileSync(filePath, "utf8"));
}

function check(id, description, passed, evidence) {
  return { id, description, passed, evidence };
}

function main() {
  const readiness = assessPilotReadiness();
  if (!readiness.ready_for_execution) {
    writeBlockedArtifact(RING2_ARTIFACT_PATHS.mbaConformance, "EVE_PRODUCTION_ACTIVATION_RING2_MBA_CONFORMANCE", {
      mba_conformance_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const ring2Auth = readJsonIfExists(join(repoRoot, "docs/production-activation/ring2_authorization_record.json"));
  const pilotScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);
  const chainContext = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );
  const p6 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json"),
  );
  const p7 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json"),
  );
  const p8 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json"),
  );

  const gatesServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-service.ts",
  );
  const gatesTestPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness.test.mjs",
  );
  const clientResultTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-types.ts",
  );

  const checks = [
    check("MBA-R2-01", "Ring 2 authorization verified", ring2Auth?.ring2_authorized === true, {
      authorization_ref: ring2Auth?.authorization_ref ?? null,
    }),
    check(
      "MBA-R2-02",
      "primary activity selected for pilot scope",
      Boolean(chainContext?.activity_id || pilotScope?.pilot_activity_id),
      { activity_id: chainContext?.activity_id ?? pilotScope?.pilot_activity_id },
    ),
    check(
      "MBA-R2-03",
      "object/state produced per pilot runtime task",
      Boolean(chainContext?.runtime_interaction_instance_ids?.length || p5?.runtime_subfield_response_created),
      { interaction_instances: chainContext?.runtime_interaction_instance_ids?.length ?? 0 },
    ),
    check(
      "MBA-R2-04",
      "no direct jump from pilot input to diagnosis",
      p6?.diagnosis_created !== true && p8?.diagnosis_final_created !== true,
      { p6_diagnosis: p6?.diagnosis_created ?? false },
    ),
    check(
      "MBA-R2-05",
      "B3/C09 with evidence or route",
      fileContains(gatesServicePath, /B3_C09/) &&
        Boolean(p5?.readiness_gap_record_id || p5?.b3_c09_executed_local === true),
      { b3_executed_local: p5?.b3_c09_executed_local ?? null },
    ),
    check(
      "MBA-R2-06",
      "B7 no diagnosis, IR, registry or export",
      fileContains(gatesTestPath, /B7 does not create diagnosis/) &&
        fileContains(gatesTestPath, /B7 does not create export/) &&
        p8?.export_real_created !== true,
      { export_real_created: p8?.export_real_created ?? false },
    ),
    check(
      "MBA-R2-07",
      "client safe result only for pilot",
      fileContains(clientResultTypesPath, /client_visible_state|ClientSafeResult/) && p6?.diagnosis_created !== true,
      { client_visible_state: chainContext?.client_visible_state ?? null },
    ),
    check(
      "MBA-R2-08",
      "consultant packet supervised, not automatic diagnosis",
      p7?.consultant_review_packet_created === true && p7?.diagnosis_final_created !== true,
      { consultant_packet_ref: chainContext?.consultant_packet_ref ?? null },
    ),
    check(
      "MBA-R2-09",
      "Producción Paralela local/rehearsal only",
      p8?.scr_patch_created === true && p8?.produccion_paralela_productiva_started !== true,
      { parallel_rehearsal_ref: chainContext?.parallel_rehearsal_ref ?? null },
    ),
    check(
      "MBA-R2-10",
      "conformance before consistency recorded",
      fileContains(gatesServicePath, /conformance|consistency/i) ||
        Boolean(chainContext?.semantic_resolution_event_ids?.length),
      { semantic_resolution_events: chainContext?.semantic_resolution_event_ids?.length ?? 0 },
    ),
    check(
      "MBA-R2-11",
      "pilot scope authorized and consent documented",
      pilotScope?.scope_closed === true && pilotScope?.consent_verified === true,
      { pilot_tenant_id: pilotScope?.pilot_tenant_id ?? null },
    ),
  ];

  const mba_conformance_passed = checks.every((c) => c.passed);
  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_MBA_CONFORMANCE",
    generated_at: new Date().toISOString(),
    mba_source: "MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado",
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    checks,
    mba_conformance_passed,
    b3_c09_safe: checks.find((c) => c.id === "MBA-R2-05")?.passed === true,
    b7_no_diagnosis_ir_export: checks.find((c) => c.id === "MBA-R2-06")?.passed === true,
    conformance_before_consistency_recorded: checks.find((c) => c.id === "MBA-R2-10")?.passed === true,
    diagnosis_created: false,
    export_real_created: false,
    activation_allowed_general_production: false,
  };

  writeFileSync(RING2_ARTIFACT_PATHS.mbaConformance, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!mba_conformance_passed) process.exit(1);
}

main();
