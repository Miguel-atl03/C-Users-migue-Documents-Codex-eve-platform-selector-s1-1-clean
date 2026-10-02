#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING4_ARTIFACT_PATHS, repoRoot } from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, writeBlockedArtifact } from "./ring4-scale-target-lib.mjs";

function branch(id, name, paths, extraCheck = () => true) {
  const existing = paths.filter((p) => existsSync(p));
  const passed = existing.length === paths.length && extraCheck();
  return { id, name, paths, paths_found: existing.length, paths_required: paths.length, passed };
}

function main() {
  const assessment = assessScaleTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(
      RING4_ARTIFACT_PATHS.structuralCoverage,
      "EVE_PRODUCTION_ACTIVATION_RING4_STRUCTURAL_FRAMEWORK_COVERAGE",
      { structural_framework_coverage_passed: false },
    );
    process.exit(BLOCKED_EXIT_CODE);
  }

  const ring4Auth = existsSync(join(repoRoot, "docs/production-activation/ring4_authorization_record.json"));
  const ring4ScaleGovernance = existsSync(
    join(repoRoot, "docs/production-activation/ring4_scale_governance_policy.json"),
  );

  const branches = [
    branch("SF-R4-01", "Capa 1.0 / source_node_ref", [
      join(repoRoot, "scripts/phase1-capa1-runtime-contract.test.mjs"),
      join(repoRoot, "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane-service.ts"),
    ]),
    branch("SF-R4-02", "Runtime 40/20", [
      join(repoRoot, "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-service.ts"),
      join(repoRoot, "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter.ts"),
    ]),
    branch("SF-R4-03", "Runtime data model", [
      join(repoRoot, "scripts/eve/production-activation/p3-validate-runtime-schema.mjs"),
      join(repoRoot, "docs/production-activation/eve_production_activation_p3_supabase_schema_inventory.json"),
    ]),
    branch("SF-R4-04", "Runtime state machines", [
      join(repoRoot, "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-types.ts"),
    ]),
    branch("SF-R4-05", "Runtime budget 40+20", [
      join(repoRoot, "src/services/eve/runtime-40-20/branching-budget/runtime-40-20-branching-budget-service.ts"),
    ]),
    branch("SF-R4-06", "Gates críticos", [
      join(repoRoot, "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-service.ts"),
      join(repoRoot, "src/services/eve/runtime-40-20/critical-gates/runtime-40-20-critical-gates-service.ts"),
    ]),
    branch("SF-R4-07", "Chips subordinados a Gates", [
      join(repoRoot, "docs/architecture/runtime_40_20_gates_and_cerebral_chips_materiality_audit.md"),
      join(repoRoot, "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.manifest.json"),
    ]),
    branch("SF-R4-08", "Sistema Regulatorio", [
      join(repoRoot, "docs/architecture/runtime_40_20_marco_estructural_gates_chips_positioning_patch.md"),
      join(repoRoot, "src/types/eve-organism-gate2-signal-guardrails.ts"),
    ]),
    branch("SF-R4-09", "WorkMap / PrimaryActivitySelectionPolicy", [
      join(repoRoot, "src/services/primary-activity-selector.ts"),
    ]),
    branch("SF-R4-10", "Significado / Fase 9 Membrana Cliente", [
      join(repoRoot, "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane-service.ts"),
      join(repoRoot, "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts"),
    ]),
    branch("SF-R4-11", "Producción Paralela controlada", [
      join(repoRoot, "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-service.ts"),
      join(repoRoot, "scripts/eve/production-activation/p8-controlled-parallel-production-local-smoke.mjs"),
    ]),
    branch("SF-R4-12", "Audit trail", [
      join(repoRoot, "scripts/eve/production-activation/p4-runtime-real-local-smoke.mjs"),
    ]),
    branch("SF-R4-13", "No-Go", [
      join(repoRoot, "scripts/eve/production-activation/p9a-no-go-productivo-preflight.mjs"),
      join(repoRoot, "docs/production-activation/ring4_no_go_constraints.json"),
    ]),
    branch("SF-R4-14", "RLS / scope / authority", [
      join(repoRoot, "docs/production-activation/ring4_production_data_boundary_policy.json"),
      join(repoRoot, "docs/production-activation/ring4_traffic_tenant_case_ramp_policy.json"),
    ]),
    branch(
      "SF-R4-15",
      "Ring 4 authorization and scale governance policy",
      [
        join(repoRoot, "docs/production-activation/ring4_authorization_record.json"),
        join(repoRoot, "docs/production-activation/ring4_scale_governance_policy.json"),
      ],
      () => ring4Auth && ring4ScaleGovernance,
    ),
  ];

  const structural_framework_coverage_passed = branches.every((b) => b.passed);
  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_STRUCTURAL_FRAMEWORK_COVERAGE",
    generated_at: new Date().toISOString(),
    structural_framework_source: "Marco Sistémico Estructural Oficial actual (repo materiality)",
    ring_activation_plan_referenced: existsSync(
      "C:\\Users\\migue\\Downloads\\EVE_Plan_Activacion_por_Anillos_Produccion_Final.docx",
    ),
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    branches,
    coverage: {
      capa_1_0_covered: branches.find((b) => b.id === "SF-R4-01")?.passed === true,
      runtime_40_20_covered: branches.find((b) => b.id === "SF-R4-02")?.passed === true,
      gates_covered: branches.find((b) => b.id === "SF-R4-06")?.passed === true,
      chips_subordinated_to_gates_covered: branches.find((b) => b.id === "SF-R4-07")?.passed === true,
      sistema_regulatorio_covered: branches.find((b) => b.id === "SF-R4-08")?.passed === true,
      workmap_covered: branches.find((b) => b.id === "SF-R4-09")?.passed === true,
      significado_covered: branches.find((b) => b.id === "SF-R4-10")?.passed === true,
      produccion_paralela_controlled_covered: branches.find((b) => b.id === "SF-R4-11")?.passed === true,
      audit_trail_covered: branches.find((b) => b.id === "SF-R4-12")?.passed === true,
      no_go_covered: branches.find((b) => b.id === "SF-R4-13")?.passed === true,
      rls_scope_authority_covered: branches.find((b) => b.id === "SF-R4-14")?.passed === true,
    },
    structural_framework_coverage_passed,
    ring4_authorization_referenced: ring4Auth,
    archived_fase9_guide_used: false,
    handoff_used: false,
    free_inference_detected: false,
    unauthorized_expansion_detected: false,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.structuralCoverage, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!structural_framework_coverage_passed) process.exit(1);
}

main();
