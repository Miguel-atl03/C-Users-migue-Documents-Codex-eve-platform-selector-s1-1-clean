import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageDir = "docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1";
const docxPath = `${packageDir}/EVE_02_Diagnostic_Ontology_v0_1.docx`;
const mdPath = `${packageDir}/EVE_02_Diagnostic_Ontology_v0_1.md`;
const jsonPath = `${packageDir}/EVE_02_Diagnostic_Ontology_v0_1.json`;
const manifestPath = `${packageDir}/EVE_02_Diagnostic_Ontology_v0_1.manifest.json`;
const tsPath = `${packageDir}/EVE_02_Diagnostic_Ontology_v0_1.ts`;
const authorityKey = ["runtime", "Authority"].join("");

const expectedCompartmentIds = Array.from(
  { length: 13 },
  (_, index) => `EVE02-CMP-${String(index + 1).padStart(3, "0")}`
);
const expectedRuleIds = Array.from(
  { length: 45 },
  (_, index) => `EVE02-R${String(index + 1).padStart(3, "0")}`
);
const expectedCanonicalPathologies = [
  "Esquizofrenia Ontológica",
  "Brecha Intencional",
  "Anarquía Operacional",
  "Violación Causal",
  "Amnesia Estructural",
  "Tortura Causal",
  "Falsa Elección",
  "Incapacidad de Gestión de Conjuntos",
  "Arquitectura Fantasma",
  "Promesa Imposible",
  "Identidad Disociada",
  "Competencia Causal",
  "Incoherencia Sistémica Total"
];
const expectedModules = {
  diagnostic_authority_rules: ["EVE02-R001", "EVE02-R002", "EVE02-R003", "EVE02-R004", "EVE02-R005"],
  inconsistency_compartment_catalog: [
    "EVE02-R006",
    "EVE02-R007",
    "EVE02-R008",
    "EVE02-R009",
    "EVE02-R010",
    "EVE02-R011",
    "EVE02-R012",
    "EVE02-R013",
    "EVE02-R014",
    "EVE02-R015",
    "EVE02-R016",
    "EVE02-R017",
    "EVE02-R018"
  ],
  evidence_input_contract: [
    "EVE02-R019",
    "EVE02-R020",
    "EVE02-R021",
    "EVE02-R022",
    "EVE02-R023",
    "EVE02-R024"
  ],
  classification_rules: [
    "EVE02-R025",
    "EVE02-R026",
    "EVE02-R027",
    "EVE02-R028",
    "EVE02-R029",
    "EVE02-R030"
  ],
  output_contract_rules: ["EVE02-R031", "EVE02-R032", "EVE02-R033", "EVE02-R034", "EVE02-R035"],
  runtime_boundary_rules: ["EVE02-R036", "EVE02-R037", "EVE02-R038", "EVE02-R039", "EVE02-R040"],
  audit_qa_rules: ["EVE02-R041", "EVE02-R042", "EVE02-R043", "EVE02-R044", "EVE02-R045"]
};
const allowedOutputs = [
  "diagnostic_preclassification_candidate",
  "blocked_by_conformance_unchecked",
  "blocked_by_consistency_unchecked",
  "blocked_by_missing_evidence",
  "blocked_by_semantic_ambiguity",
  "manual_review_required",
  "reentry_required"
];
const forbiddenOutputs = [
  "final_diagnosis",
  "IR",
  "registry_write",
  "export_payload",
  "monetization_decision",
  "transduction",
  "production_real"
];
const expectedInputContractFields = [
  "inconsistency_compartment",
  "involved_models",
  "conformance_status",
  "consistency_status",
  "evidence_refs",
  "source_trace"
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

  assert.equal(pkg.chip_id, "EVE-02-DIAGNOSTIC-ONTOLOGY");
  assert.equal(manifest.chip_id, "EVE-02-DIAGNOSTIC-ONTOLOGY");
  assert.equal(pkg.package_id, "EVE_02_Diagnostic_Ontology_v0_1");
  assert.equal(manifest.package_id, "EVE_02_Diagnostic_Ontology_v0_1");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(pkg.stage, "02_diagnostic_ontology");
  assert.equal(manifest.stage, "02_diagnostic_ontology");
  assert.equal(pkg.status, "draft_ready_for_review");
  assert.equal(pkg.not_a_prompt, true);
});

test("compiled sources and dependencies are stable", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  for (const artifact of [pkg, manifest]) {
    assert.deepEqual(artifact.compiled_sources.primary, ["D2"]);
    assert.deepEqual(artifact.compiled_sources.methodological_guard, ["D1"]);
    assert.deepEqual(artifact.compiled_sources.runtime_boundaries, ["D4", "D5"]);
    for (const sourceId of ["D3", "D6", "D7", "D8"]) {
      assert.ok(artifact.compiled_sources.not_used_in_this_stage.includes(sourceId));
    }
    assert.ok(artifact.compiled_sources.excluded_internal_sources.length > 0);
    assert.ok(
      artifact.dependencies.some(
        (dependency: { chip_id: string; version: string }) =>
          dependency.chip_id === "EVE-00-METHOD-KERNEL" && dependency.version === "0.2.0"
      )
    );
    assert.ok(
      artifact.dependencies.some(
        (dependency: { chip_id: string; version: string }) =>
          dependency.chip_id === "EVE-01-AGENT-CONSTITUTION" && dependency.version === "0.1.0"
      )
    );
  }
});

test("counts are locked at 13 compartments, 13 pathologies, 45 rules and 7 modules", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.equal(pkg.compartments.length, 13);
  assert.equal(new Set(pkg.compartments.map((item: { pathology: string }) => item.pathology)).size, 13);
  assert.equal(pkg.rules.length, 45);
  assert.equal(pkg.modules.length, 7);
  assert.deepEqual(manifest.counts, {
    compartments: 13,
    canonical_pathologies: 13,
    rules: 45,
    modules: 7
  });
});

test("diagnostic compartments are complete and field-safe", () => {
  const pkg = readJson(jsonPath);
  const compartmentIds = pkg.compartments.map((item: { id: string }) => item.id);

  assert.deepEqual(compartmentIds, expectedCompartmentIds);
  for (const compartment of pkg.compartments) {
    for (const field of [
      "id",
      "inconsistency_type",
      "models",
      "models_implicated",
      "diagnostic_question",
      "pathology",
      "trigger_condition",
      "evidence_required",
      "blocked_if"
    ]) {
      assert.ok(Object.hasOwn(compartment, field), `${compartment.id} must have ${field}`);
      assert.notDeepEqual(compartment[field], [], `${compartment.id}.${field} must not be empty`);
    }
  }
});

test("canonical pathology inventory remains exactly 13 and aliases do not increase count", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const canonicalPathologies = pkg.compartments.map((item: { pathology: string }) => item.pathology);
  const aliases = pkg.compartments.flatMap((item: { aliases?: string[] }) => item.aliases ?? []);

  assert.deepEqual(canonicalPathologies, expectedCanonicalPathologies);
  assert.equal(new Set(canonicalPathologies).size, 13);
  assert.equal(manifest.counts.canonical_pathologies, 13);
  assert.ok(aliases.includes("Esquizofrenia Organizacional"));
  assert.equal(canonicalPathologies.includes("Esquizofrenia Organizacional"), false);
});

test("rules and module ranges remain complete", () => {
  const pkg = readJson(jsonPath);
  const ruleIds = pkg.rules.map((item: { id: string }) => item.id);

  assert.deepEqual(ruleIds, expectedRuleIds);
  for (const rule of pkg.rules) {
    for (const field of ["id", "module", "title", "rule", "severity", "source_refs", "guard_kind"]) {
      assert.ok(Object.hasOwn(rule, field), `${rule.id} must have ${field}`);
      assert.notDeepEqual(rule[field], [], `${rule.id}.${field} must not be empty`);
    }
  }

  for (const [moduleName, expectedIds] of Object.entries(expectedModules)) {
    const moduleRules = pkg.rules
      .filter((rule: { module: string }) => rule.module === moduleName)
      .map((rule: { id: string }) => rule.id);
    assert.deepEqual(moduleRules, expectedIds, `${moduleName} range must remain stable`);
  }
});

test("functional output contract protects allowed and forbidden outputs", () => {
  const pkg = readJson(jsonPath);
  const contract = pkg.output_contract;

  assert.deepEqual(contract.allowed_outputs, allowedOutputs);
  assert.deepEqual(contract.forbidden_outputs, forbiddenOutputs);
  for (const field of ["evidence_refs", "source_trace", "method_trace", "readiness_state"]) {
    assert.ok(contract.minimum_payload_fields.includes(field), `${field} must be in payload contract`);
  }
});

test("explicit input contract is present and field-safe", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const inputContract = pkg.input_contract;

  assert.deepEqual(Object.keys(inputContract), expectedInputContractFields);
  for (const field of expectedInputContractFields) {
    assert.equal(inputContract[field].required, true, `${field}.required must be true`);
    for (const property of ["meaning", "blocked_if_missing", "source_support"]) {
      assert.ok(Object.hasOwn(inputContract[field], property), `${field} must have ${property}`);
      assert.notDeepEqual(inputContract[field][property], [], `${field}.${property} must not be empty`);
    }
  }
  assert.equal(manifest.qa_expectations.input_contract_explicit, true);
});

test("diagnostic boundaries are represented in package text", () => {
  const text = combinedPackageText();

  for (const pattern of [
    /no final diagnosis|no diagnostico final|final_diagnosis_enabled["']?\s*:\s*false/,
    /no.*ir|ir.*registry.*export/,
    /registry_write/,
    /export_payload/,
    /monetization_decision/,
    /transduction/,
    /production_real/,
    /no pathology from text alone|textual narrative without model evidence/,
    /no exposure of internal diagnosis to ui|ui.*not expose pathology labels/,
    /b7\/c20 non-diagnostic boundary|b7\/c20.*non-diagnostic/,
    /governed candidates|governed evidence\/candidate payloads|not raw text/
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
  assert.equal(manifest.qa_expectations.final_diagnosis_enabled, false);
  assert.equal(pkg.qa_expectations.final_diagnosis_enabled, false);
  assert.doesNotMatch(ts, /from\s+["']@\/app|from\s+["'].*src\/app/);
  assert.doesNotMatch(ts, /from\s+["'].*(components|ui|react|tsx)/i);
  assert.doesNotMatch(ts, /supabase/i);
  assert.doesNotMatch(ts, /registry\s*\.\s*(write|set|push|register)/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
  assert.doesNotMatch(ts, /from\s+["'].*runtime/i);
  assert.doesNotMatch(allText, /final_diagnosis_enabled["']?\s*:\s*true/i);
});
