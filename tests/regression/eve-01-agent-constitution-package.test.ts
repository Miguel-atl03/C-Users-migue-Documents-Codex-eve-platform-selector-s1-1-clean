import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageDir = "docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1";
const docxPath = `${packageDir}/EVE_01_Agent_Constitution_v0_1.docx`;
const mdPath = `${packageDir}/EVE_01_Agent_Constitution_v0_1.md`;
const jsonPath = `${packageDir}/EVE_01_Agent_Constitution_v0_1.json`;
const manifestPath = `${packageDir}/EVE_01_Agent_Constitution_v0_1.manifest.json`;
const tsPath = `${packageDir}/EVE_01_Agent_Constitution_v0_1.ts`;
const authorityKey = ["runtime", "Authority"].join("");

const expectedSources = ["D1", "D2", "D3", "D4", "D5"];
const expectedModules = {
  source_authority_rules: 8,
  scope_boundary_rules: 10,
  evidence_epistemology_rules: 10,
  mmabp_governance_rules: 10,
  diagnostic_boundary_rules: 8,
  runtime_behavior_rules: 12,
  parallel_production_boundary_rules: 8,
  audit_authority_rules: 10
};
const expectedPipeline = [
  "resolve_source_authority",
  "validate_scope_boundary",
  "classify_evidence_epistemology",
  "run_EVE_00_method_kernel",
  "apply_MMABP_gates",
  "apply_runtime_behavior_rules",
  "if_diagnostic_language_requested_route_to_candidate",
  "evaluate_parallel_production_boundary",
  "emit_readiness_or_blocking_state",
  "write_audit_trace"
];
const requiredOutputFields = [
  "decision_id",
  "chip_id",
  "rule_ids",
  "source_trace",
  "input_classification",
  "allowed_actions",
  "blocked_actions",
  "readiness_state",
  "required_inputs",
  "audit_required",
  "next_chip_or_service"
];
const forbiddenOutputFields = [
  "final_diagnosis_from_Capa1",
  "raw_text_export",
  "untraceable_recommendation"
];
const expectedStates = [
  "capture_allowed",
  "clarification_required",
  "blocked_by_scope",
  "blocked_by_missing_evidence",
  "blocked_by_missing_canonical_route",
  "blocked_by_contradiction",
  "manual_review_required",
  "ready_for_structural_candidate",
  "ready_for_diagnostic_preclassification",
  "ready_for_parallel_preview",
  "export_blocked",
  "audit_required"
];

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function combinedPackageText() {
  return normalizedText(
    [
      readFileSync(mdPath, "utf8"),
      readFileSync(tsPath, "utf8"),
      JSON.stringify(readJson(jsonPath)),
      JSON.stringify(readJson(manifestPath))
    ].join("\n")
  );
}

test("package artifacts exist and parse", () => {
  for (const path of [docxPath, mdPath, jsonPath, manifestPath, tsPath]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.ok(readFileSync(tsPath, "utf8").length > 0);
});

test("identity fields match staged package contract", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.equal(pkg.chip_id, "EVE-01-AGENT-CONSTITUTION");
  assert.equal(manifest.package_id, "EVE_01_Agent_Constitution_Chip_v0_1");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(pkg.stage, "01_agent_constitution");
  assert.equal(manifest.stage, "01_agent_constitution");
  assert.equal(pkg.not_a_prompt, true);
  assert.ok(pkg.dependency_chips.includes("EVE-00-METHOD-KERNEL@0.2.0"));
  assert.ok(manifest.dependency_chips.includes("EVE-00-METHOD-KERNEL@0.2.0"));
});

test("compiled sources and authority scopes are stable", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.deepEqual(pkg.source_policy.compiled_platform_sources, expectedSources);
  assert.deepEqual(manifest.source_scope.compiled_platform_sources, expectedSources);
  assert.ok(pkg.source_policy.excluded_internal_sources.length > 0);
  assert.ok(manifest.source_scope.excluded_internal_sources.length > 0);
  assert.deepEqual(Object.keys(pkg.source_registry), expectedSources);
  assert.equal(pkg.source_registry.D1.authority_scope, "Metodo MMABP");
  assert.equal(pkg.source_registry.D2.authority_scope, "Ontologia diagnostica");
  assert.equal(pkg.source_registry.D3.authority_scope, "Integracion operacional");
  assert.equal(pkg.source_registry.D4.authority_scope, "Implementacion tecnica");
  assert.equal(pkg.source_registry.D5.authority_scope, "Gobierno runtime");
});

test("rule count and module counts are locked at 76", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const jsonModuleCounts = Object.fromEntries(
    Object.entries(pkg.modules).map(([moduleId, moduleValue]: [string, any]) => [
      moduleId,
      moduleValue.rules.length
    ])
  );

  assert.equal(pkg.rule_index_count, 76);
  assert.equal(pkg.rule_index.length, 76);
  assert.equal(manifest.rule_count, 76);
  assert.deepEqual(jsonModuleCounts, expectedModules);
  assert.deepEqual(manifest.modules, expectedModules);
  assert.equal(Object.values(expectedModules).reduce((sum, count) => sum + count, 0), 76);
});

test("constitutional pipeline and output contract are present", () => {
  const pkg = readJson(jsonPath);

  for (const step of expectedPipeline) {
    assert.ok(pkg.constitutional_pipeline.includes(step), `${step} must be in pipeline`);
  }
  for (const field of requiredOutputFields) {
    assert.ok(pkg.decision_output_contract.required_fields.includes(field));
  }
  assert.deepEqual(pkg.decision_output_contract.forbidden_fields, forbiddenOutputFields);
});

test("operative states remain complete", () => {
  const pkg = readJson(jsonPath);
  const states = pkg.readiness_states.map((item: { state: string }) => item.state);

  assert.deepEqual(states, expectedStates);
});

test("constitutional boundaries are represented in package text", () => {
  const text = combinedPackageText();

  for (const pattern of [
    /no es un prompt conversacional/,
    /capa 1.*no diagnostica|no diagnostico final de capa 1/,
    /preclasificacion diagnostica|diagnostic preclassification/,
    /ui.*no.*fuente.*verdad/,
    /narrativa.*no.*implementa.*fila operacional/,
    /sg shadow.*no.*muta|shadow.*no.*mutar/,
    /produccion paralela.*no.*produccion real|produccion paralela.*no es produccion/,
    /source_trace/
  ]) {
    assert.match(text, pattern);
  }
});

test("package remains not wired and has no unsafe side effects", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(tsPath, "utf8");
  const allText = `${JSON.stringify(pkg)}\n${JSON.stringify(manifest)}\n${ts}`;

  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.equal(allText.includes(`${authorityKey}: true`), false);
  assert.doesNotMatch(ts, /from\s+["']@\/app|from\s+["'].*src\/app/);
  assert.doesNotMatch(ts, /from\s+["'].*(components|ui|react|tsx)/i);
  assert.doesNotMatch(ts, /supabase/i);
  assert.doesNotMatch(ts, /registry\s*\.\s*(write|set|push|register)/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
  assert.doesNotMatch(ts, /from\s+["'].*runtime/i);
  assert.doesNotMatch(allText, /final_diagnosis_from_Capa1["']?\s*:\s*(true|enabled)/i);
});
