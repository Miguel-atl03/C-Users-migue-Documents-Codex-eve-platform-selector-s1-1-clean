import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const unique = (values) => [...new Set(values.filter(Boolean))];

const manifest = readJson("src/runtime/capa-1-v2-1-runtime-manifest.json");
const contract = readJson("src/runtime/platform-consumption-contract.json");
const runnerSource = readText("src/components/SceneQuestionnaireRunner.tsx");
const runtimeLoaderSource = readText("src/runtime/capa1-runtime-manifest.ts");
const repositorySource = readText("src/services/scene-repository.ts");
const derivationSource = readText("src/services/scene-derivation-engine.ts");
const preclassificationSource = readText("src/services/scene-light-preclassification-engine.ts");
const canonicalRecordSource = readText("src/services/scene-canonical-record-builder.ts");
const sqlSource = readText("sql/architecture_v02_capa1_scene.sql");

const questions = manifest.blocks.flatMap((block) =>
  block.questions.map((question) => ({ ...question, block_id: block.block_id })),
);
const questionCodes = new Set(questions.map((question) => question.question_code));
const failures = [];
const warnings = [];

const fail = (area, detail) => failures.push({ area, detail });
const warn = (area, detail) => warnings.push({ area, detail });

if (manifest.metadata.expected_platform_runtime_version !== "CAPA1_V2_1_RUNTIME_CONSUMER") {
  fail("compatibility", "El manifest no apunta al runtime esperado de plataforma.");
}

for (const field of contract.renderer_must_consume) {
  const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const combinedRendererSource = `${runtimeLoaderSource}\n${runnerSource}`;
  if (!combinedRendererSource.includes(field) && !combinedRendererSource.includes(camel)) {
    fail("renderer", `El runner no consume ${field}.`);
  }
}

if (runnerSource.includes('split(".").slice(0, 2).join(".")')) {
  fail("branching", "El runner sigue truncando question_code compuesto.");
}

for (const field of contract.branching_engine_must_consume) {
  if (!runtimeLoaderSource.includes(field) && !runnerSource.includes(field) && !derivationSource.includes(field)) {
    warn("branching", `No se observa consumo textual de ${field}; revisar si queda encapsulado.`);
  }
}

for (const code of contract.block_7.required_question_codes) {
  if (!questionCodes.has(code)) fail("block_7", `Falta ${code} en manifest runtime.`);
}

if (!runnerSource.includes("max_microconfirmations_per_scene")) {
  fail("block_7", "No se observa tope maximo de microconfirmaciones desde contrato.");
}

if (!preclassificationSource.includes("preclassification_readiness")) {
  fail("readiness_confidence", "No se persiste preclassification_readiness separado.");
}

for (const state of contract.block_7.preclassification_readiness_states ?? []) {
  if (!preclassificationSource.includes(state) || !sqlSource.includes(state)) {
    fail("readiness_confidence", `Estado de readiness no soportado end-to-end: ${state}.`);
  }
}

for (const output of [
  "preclassification_ahe_level_dominant",
  "preclassification_interpersonal_signal",
  "preclassification_interpersonal_note",
  "questions_triggered",
  "preclassification_gap_flag",
  "flagged_for_manual_review",
]) {
  if (!preclassificationSource.includes(output) || !sqlSource.includes(output)) {
    fail("block_7", `Output ampliado de Bloque 7 ausente en runtime/schema: ${output}.`);
  }
}

if (!preclassificationSource.includes("confidenceScore: score") || !preclassificationSource.includes("score >= 80")) {
  fail("readiness_confidence", "confidence_score no demuestra escala 0-100 y thresholds contractuales.");
}

for (const field of contract.persistence_must_keep_separate) {
  const token =
    field === "original_answer"
      ? "original_answer_id"
      : field === "clarification_answer"
        ? "clarification_answer_id"
        : field;
  if (!repositorySource.includes(token) && !sqlSource.includes(token) && !canonicalRecordSource.includes(token)) {
    fail("persistence", `No se observa persistencia separada de ${field}.`);
  }
}

for (const bundle of contract.required_bundles) {
  if (
    !sqlSource.includes(bundle) ||
    !preclassificationSource.includes(bundle) ||
    !canonicalRecordSource.includes("scene_answer_bundles")
  ) {
    fail("bundles", `Bundle requerido no esta implementado de forma estructurada: ${bundle}.`);
  }
}

for (const section of [
  "scene_identity",
  "systemic_framing",
  "trigger_evidence",
  "transformation_evidence",
  "handoff_evidence",
  "flow_evidence",
  "capacity_evidence",
  "compensation_evidence",
  "ahe_evidence",
  "supporting_interpersonal_patterns",
  "provenance_summary",
]) {
  if (!preclassificationSource.includes(section) && !canonicalRecordSource.includes(section)) {
    fail("bundles", `evidence_bundle_for_transduction no expone seccion requerida: ${section}.`);
  }
}

if (!readText("src/services/session-intermediate-output-builder.ts").includes("session_ready_for_transduction")) {
  fail("session_readiness", "No se calcula session_ready_for_transduction objetivamente.");
}

for (const invariant of contract.non_collapsing_invariants) {
  const [left, right] = invariant.split("!=").map((part) => part.trim());
  if (left && right && left === right) fail("contract", `Invariante invalida: ${invariant}`);
}

const byBlock = manifest.blocks.map((block) => ({
  block_id: block.block_id,
  question_count: block.questions.length,
  field_types: unique(block.questions.map((question) => question.field_type)).sort(),
  answer_modes: unique(block.questions.map((question) => question.answer_mode)).sort(),
}));

const report = {
  status: failures.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
  checked_at: new Date().toISOString(),
  manifest: {
    version: manifest.metadata.manifest_version,
    hash: manifest.metadata.content_hash,
    canonical_version: manifest.metadata.canonical_version,
    question_count: questions.length,
  },
  contract: {
    version: contract.version,
    compatibility: contract.compatibility,
  },
  by_block: byBlock,
  failures,
  warnings,
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "platform-manifest-conformance-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
