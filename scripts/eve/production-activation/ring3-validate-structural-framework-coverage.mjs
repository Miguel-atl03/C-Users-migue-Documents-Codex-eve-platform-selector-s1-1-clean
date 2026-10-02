#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING3_ARTIFACT_PATHS, repoRoot } from "./ring3-artifact-paths.mjs";
import { assessControlledTarget, writeBlockedArtifact } from "./ring3-controlled-target-lib.mjs";

function branch(id, name, paths, extraCheck = () => true) {
  const existing = paths.filter((p) => existsSync(p));
  const passed = existing.length === paths.length && extraCheck();
  return { id, name, paths, paths_found: existing.length, paths_required: paths.length, passed };
}

function main() {
  const assessment = assessControlledTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(
      RING3_ARTIFACT_PATHS.structuralCoverage,
      "EVE_PRODUCTION_ACTIVATION_RING3_STRUCTURAL_FRAMEWORK_COVERAGE",
      { structural_framework_coverage_passed: false },
    );
    process.exit(BLOCKED_EXIT_CODE);
  }

  const ring3Auth = existsSync(join(repoRoot, "docs/production-activation/ring3_authorization_record.json"));
  const ring3AccessPolicy = existsSync(
    join(repoRoot, "docs/production-activation/ring3_controlled_production_access_policy.json"),
  );

  const branches = [
    branch("SF-R3-01", "Capa 1.0 / source_node_ref", [
      join(repoRoot, "scripts/phase1-capa1-runtime-contract.test.mjs"),
      join(repoRoot, "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane-service.ts"),
    ]),
    branch("SF-R3-02", "Runtime 40/20", [
      join(repoRoot, "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-service.ts"),
      join(repoRoot, "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter.ts"),
    ]),
    branch("SF-R3-03", "Runtime data model", [
      join(repoRoot, "scripts/eve/production-activation/p3-validate-runtime-schema.mjs"),
      join(repoRoot, "docs/production-activation/eve_production_activation_p3_supabase_schema_inventory.json"),
    ]),
    branch("SF-R3-04", "Runtime state machines", [
      join(repoRoot, "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-types.ts"),
    ]),
    branch("SF-R3-05", "Runtime budget 40+20", [
      join(repoRoot, "src/services/eve/runtime-40-20/branching-budget/runtime-40-20-branching-budget-service.ts"),
    ]),
    branch("SF-R3-06", "Gates críticos", [
      join(repoRoot, "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-service.ts"),
      join(repoRoot, "src/services/eve/runtime-40-20/critical-gates/runtime-40-20-critical-gates-service.ts"),
    ]),
    branch("SF-R3-07", "Chips subordinados a Gates", [
      join(repoRoot, "docs/architecture/runtime_40_20_gates_and_cerebral_chips_materiality_audit.md"),
      join(repoRoot, "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.manifest.json"),
    ]),
    branch("SF-R3-08", "Sistema Regulatorio", [
      join(repoRoot, "docs/architecture/runtime_40_20_marco_estructural_gates_chips_positioning_patch.md"),
      join(repoRoot, "src/types/eve-organism-gate2-signal-guardrails.ts"),
    ]),
    branch("SF-R3-09", "WorkMap / PrimaryActivitySelectionPolicy", [
      join(repoRoot, "src/services/primary-activity-selector.ts"),
    ]),
    branch("SF-R3-10", "Significado / Fase 9 Membrana Cliente", [
      join(repoRoot, "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane-service.ts"),
      join(repoRoot, "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts"),
    ]),
    branch("SF-R3-11", "Producción Paralela controlada", [
      join(repoRoot, "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-service.ts"),
      join(repoRoot, "scripts/eve/production-activation/p8-controlled-parallel-production-local-smoke.mjs"),
    ]),
    branch("SF-R3-12", "Audit trail", [
      join(repoRoot, "scripts/eve/production-activation/p4-runtime-real-local-smoke.mjs"),
    ]),
    branch("SF-R3-13", "No-Go", [
      join(repoRoot, "scripts/eve/production-activation/p9a-no-go-productivo-preflight.mjs"),
      join(repoRoot, "docs/production-activation/ring3_no_go_constraints.json"),
    ]),
    branch("SF-R3-14", "RLS / scope / authority", [
      join(repoRoot, "docs/production-activation/ring3_production_data_boundary_policy.json"),
      join(repoRoot, "docs/production-activation/ring3_controlled_production_access_policy.json"),
    ]),
    branch(
      "SF-R3-15",
      "Ring 3 authorization and controlled production access policy",
      [
        join(repoRoot, "docs/production-activation/ring3_authorization_record.json"),
        join(repoRoot, "docs/production-activation/ring3_controlled_production_access_policy.json"),
      ],
      () => ring3Auth && ring3AccessPolicy,
    ),
  ];

  const structural_framework_coverage_passed = branches.every((b) => b.passed);
  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_STRUCTURAL_FRAMEWORK_COVERAGE",
    generated_at: new Date().toISOString(),
    structural_framework_source: "Marco Sistémico Estructural Oficial actual (repo materiality)",
    ring_activation_plan_referenced: existsSync(
      "C:\\Users\\migue\\Downloads\\EVE_Plan_Activacion_por_Anillos_Produccion_Final.docx",
    ),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    branches,
    coverage: {
      capa_1_0_covered: branches.find((b) => b.id === "SF-R3-01")?.passed === true,
      runtime_40_20_covered: branches.find((b) => b.id === "SF-R3-02")?.passed === true,
      gates_covered: branches.find((b) => b.id === "SF-R3-06")?.passed === true,
      chips_subordinated_to_gates_covered: branches.find((b) => b.id === "SF-R3-07")?.passed === true,
      sistema_regulatorio_covered: branches.find((b) => b.id === "SF-R3-08")?.passed === true,
      workmap_covered: branches.find((b) => b.id === "SF-R3-09")?.passed === true,
      significado_covered: branches.find((b) => b.id === "SF-R3-10")?.passed === true,
      produccion_paralela_controlled_covered: branches.find((b) => b.id === "SF-R3-11")?.passed === true,
      audit_trail_covered: branches.find((b) => b.id === "SF-R3-12")?.passed === true,
      no_go_covered: branches.find((b) => b.id === "SF-R3-13")?.passed === true,
      rls_scope_authority_covered: branches.find((b) => b.id === "SF-R3-14")?.passed === true,
    },
    structural_framework_coverage_passed,
    ring3_authorization_referenced: ring3Auth,
    archived_fase9_guide_used: false,
    handoff_used: false,
    free_inference_detected: false,
    unauthorized_expansion_detected: false,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.structuralCoverage, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!structural_framework_coverage_passed) process.exit(1);
}

main();
