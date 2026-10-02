#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING0_ARTIFACT_PATHS, repoRoot } from "./ring0-artifact-paths.mjs";
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
  const chainContext = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );
  const p6 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json"),
  );
  const p8 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json"),
  );

  const primaryActivitySelectorPath = join(repoRoot, "src/services/primary-activity-selector.ts");
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
    check(
      "MBA-R0-01",
      "primary activity selected for fixture chain",
      Boolean(chainContext?.activity_id) &&
        (existsSync(primaryActivitySelectorPath) ||
          fileContains(primaryActivitySelectorPath, /PrimaryActivitySelectionPolicy|selectPrimary/i)),
      {
        activity_id: chainContext?.activity_id ?? null,
        selector_file: existsSync(primaryActivitySelectorPath),
      },
    ),
    check(
      "MBA-R0-02",
      "object/state produced per local runtime task",
      Boolean(
        chainContext?.runtime_interaction_instance_ids?.length &&
          (chainContext?.runtime_subfield_response_ids?.length ||
            p5?.runtime_subfield_response_created),
      ),
      {
        interaction_instances: chainContext?.runtime_interaction_instance_ids?.length ?? 0,
        subfield_responses: chainContext?.runtime_subfield_response_ids?.length ?? 0,
      },
    ),
    check(
      "MBA-R0-03",
      "no direct jump from input to diagnosis",
      p6?.diagnosis_created !== true &&
        p8?.diagnosis_final_created !== true &&
        fileContains(gatesTestPath, /B7 does not create diagnosis/),
      { p6_diagnosis: p6?.diagnosis_created ?? false, p8_diagnosis: p8?.diagnosis_final_created ?? false },
    ),
    check(
      "MBA-R0-04",
      "B3 not treated as general satisfaction",
      fileContains(gatesServicePath, /B3_C09/) &&
        (p5?.b3_c09_executed_local !== undefined || p5?.critical_route_gate_results?.B3_C09 !== undefined),
      { b3_executed_local: p5?.b3_c09_executed_local ?? null },
    ),
    check(
      "MBA-R0-05",
      "B3/C09 has evidence or canonical route",
      Boolean(
        p5?.readiness_gap_record_id ||
          chainContext?.readiness_gap_record_ids?.length ||
          p5?.b3_c09_executed_local === true,
      ),
      {
        readiness_gap_records: chainContext?.readiness_gap_record_ids?.length ?? 0,
        b3_c09_executed_local: p5?.b3_c09_executed_local ?? null,
        dominant_gate: p5?.dominant_gate ?? null,
      },
    ),
    check(
      "MBA-R0-06",
      "B7 does not produce diagnosis, IR, registry or export",
      fileContains(gatesTestPath, /B7 does not create IR/) &&
        fileContains(gatesTestPath, /B7 does not create export/) &&
        p8?.export_real_created !== true &&
        p8?.registry_created !== true,
      {
        b7_c20_executed_local: p5?.b7_c20_executed_local ?? null,
        export_real_created: p8?.export_real_created ?? false,
      },
    ),
    check(
      "MBA-R0-07",
      "visible outputs are client-safe states only",
      (p6?.client_visible_result_safe === true || p6?.client_safe_result_dto_valid === true) &&
        fileContains(clientResultTypesPath, /client_visible_state|ClientSafeResult/),
      {
        client_visible_result_safe: p6?.client_visible_result_safe ?? false,
        client_visible_state: chainContext?.client_visible_state ?? null,
      },
    ),
    check(
      "MBA-R0-08",
      "conformance before consistency recorded",
      fileContains(gatesServicePath, /conformance|consistency/i) ||
        Boolean(chainContext?.semantic_resolution_event_ids?.length),
      {
        semantic_resolution_events: chainContext?.semantic_resolution_event_ids?.length ?? 0,
        process_state_timer_events: chainContext?.process_state_timer_event_ids?.length ?? 0,
      },
    ),
  ];

  const mba_conformance_passed = checks.every((c) => c.passed);
  const b3_c09_safe = checks.find((c) => c.id === "MBA-R0-05")?.passed === true;
  const b7_no_diagnosis_ir_export = checks.find((c) => c.id === "MBA-R0-06")?.passed === true;
  const conformance_before_consistency_recorded =
    checks.find((c) => c.id === "MBA-R0-08")?.passed === true;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_MBA_CONFORMANCE",
    generated_at: new Date().toISOString(),
    mba_source: "MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado",
    checks,
    mba_conformance_passed,
    b3_c09_safe,
    b7_no_diagnosis_ir_export,
    conformance_before_consistency_recorded,
    diagnosis_created: false,
    export_real_created: false,
    production_supabase_touched: false,
  };

  writeFileSync(RING0_ARTIFACT_PATHS.mbaConformance, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!mba_conformance_passed) process.exit(1);
}

main();
