import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const manifest = readJson("src/runtime/capa-1-v2-1-runtime-manifest.json");
const contract = readJson("src/runtime/platform-consumption-contract.json");
const sql = readText("sql/architecture_v02_capa1_scene.sql");
const answerHistoryMigration = readText("sql/migration_v03_scene_answers_no_question_code_overwrite.sql");
const renderer = readText("src/components/SceneQuestionnaireRunner.tsx");
const repository = readText("src/services/scene-repository.ts");
const derivationEngine = readText("src/services/scene-derivation-engine.ts");
const preclassification = readText("src/services/scene-light-preclassification-engine.ts");
const canonicalRecord = readText("src/services/scene-canonical-record-builder.ts");
const sessionOutput = readText("src/services/session-intermediate-output-builder.ts");
const platformValidator = readText("scripts/validate-platform-against-manifest.mjs");
const phase1Fixtures = readJson("fixtures/capa1-phase1-fixtures.json");
const nhrPhase3bInput = readJson("fixtures/nhr-phase3b-session-input.json");

const questions = manifest.blocks.flatMap((block) =>
  block.questions.map((question) => ({ ...question, block_id: block.block_id })),
);
const questionCodes = new Set(questions.map((question) => question.question_code));

test("manifest exposes the complete Capa 1 v2.1 Block 0-7 catalog", () => {
  assert.equal(manifest.metadata.canonical_version, "CAPA1_V2_1");
  assert.equal(manifest.blocks.length, 9);
  assert.equal(questions.length, 171);
  for (const code of ["7.0", "7.0a", "7.1", "7.2", "7.3", "7.3a", "7.4"]) {
    assert.equal(questionCodes.has(code), true, `missing ${code}`);
  }
  for (const code of ["3.13", "3.13a", "3.D"]) {
    assert.equal(questionCodes.has(code), true, `missing ${code}`);
  }
});

test("renderer consumes manifest modes without rendering internal inferences", () => {
  for (const token of contract.renderer_must_consume) {
    const camel = token.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    assert.match(`${renderer}\n${readText("src/runtime/capa1-runtime-manifest.ts")}`, new RegExp(`${token}|${camel}`));
  }
  assert.match(renderer, /questionAnswerMode\(question\) !== "internal_inference"/);
  assert.match(renderer, /optionIsExclusive/);
  assert.match(renderer, /shouldShowFreeText/);
  assert.doesNotMatch(renderer, /split\("\."\)\.slice\(0, 2\)/);
  assert.match(renderer, /help_text/);
  assert.match(renderer, /short_ui_label/);
  assert.match(renderer, /allows_free_text/);
  assert.match(renderer, /maxUserVisibleQuestions/);
});

test("consumer preserves answer history and avoids question_code overwrite", () => {
  assert.match(repository, /\.insert\(answerRows\)/);
  assert.doesNotMatch(repository, /onConflict:\s*"scene_id,instrument_version,question_code,subquestion_code"/);
  assert.match(answerHistoryMigration, /idx_scene_question_answers_scene_question_history/);
});

test("confidence score is stored on the canonical 0-100 scale", () => {
  assert.match(preclassification, /score >= 80/);
  assert.match(preclassification, /Math\.min\(95/);
  assert.doesNotMatch(preclassification, /0\.95/);
});

test("consumer derives V3 and R9 through canonical runtime routes", () => {
  assert.match(derivationEngine, /transformationExceptionExistsFromType/);
  assert.match(derivationEngine, /sourceVariable:\s*"transformation_exception_type"/);
  assert.match(derivationEngine, /formula:\s*"exceptionExists\(transformation_exception_type\)"/);
  assert.match(derivationEngine, /receiverFeedbackExistsFromFeedback/);
  assert.match(derivationEngine, /sourceVariable:\s*"receiver_feedback"/);
  assert.match(derivationEngine, /formula:\s*"feedbackExists\(receiver_feedback\)"/);
});

test("NHR 3B input keeps satisfaction and operational feedback separate", () => {
  const answers = nhrPhase3bInput.sceneAnswersByActivityId.nhr_delivery_order_flow;
  const satisfaction = answers.find((answer) => answer.questionCode === "3.13");
  const feedback = answers.find((answer) => answer.questionCode === "3.13a");

  assert.equal(satisfaction?.blockId, "block_3");
  assert.match(satisfaction?.freeText ?? "", /insatisfecho/);
  assert.doesNotMatch(satisfaction?.freeText ?? "", /Chef avisa|repartidor avisa/);
  assert.equal(feedback?.blockId, "block_3");
  assert.match(feedback?.freeText ?? "", /Chef avisa/);
  assert.match(feedback?.freeText ?? "", /repartidor avisa/);
});

test("Block 7 persists expanded AHE, interpersonal, gap and readiness outputs", () => {
  for (const output of [
    "preclassification_ahe_level_dominant",
    "preclassification_interpersonal_signal",
    "preclassification_interpersonal_note",
    "preclassification_ahe_bundle_refined",
    "questions_triggered",
    "preclassification_gap_flag",
    "flagged_for_manual_review",
  ]) {
    assert.match(sql, new RegExp(output));
    assert.match(preclassification, new RegExp(output));
  }

  for (const state of contract.block_7.preclassification_readiness_states) {
    assert.match(sql, new RegExp(state));
    assert.match(preclassification, new RegExp(state));
  }
});

test("evidence bundle for transduction is structured and remains non diagnostic", () => {
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
    "preclassification",
    "confidence",
    "flags",
    "gaps",
    "provenance_summary",
  ]) {
    assert.match(preclassification, new RegExp(section));
  }
  assert.match(canonicalRecord, /evidence_bundle_for_transduction/);
  assert.match(canonicalRecord, /forbiddenRuntimePromotions/);
  assert.doesNotMatch(canonicalRecord, /capa_2_node_assignment"\s*:/);
});

test("session output calculates objective session_ready_for_transduction", () => {
  assert.match(sessionOutput, /session_ready_for_transduction/);
  assert.match(sessionOutput, /deep/);
  assert.match(sessionOutput, /abbreviated/);
  assert.match(sessionOutput, /support_reentry_recommendations/);
  assert.match(sessionOutput, /manual_review_queue/);
  assert.match(sessionOutput, /evidence_bundle_summary/);
  assert.match(sessionOutput, /capa1ToCapa2RuntimeGuard/);
  assert.match(sessionOutput, /handoffAllowed:\s*sessionReady/);
  assert.match(sessionOutput, /doesNotModifyCapa2Readiness:\s*true/);
  assert.match(sessionOutput, /prohibitedUsesWhenBlocked/);
});

test("platform validator fails on runtime drift across manifest, schema and export", () => {
  assert.match(platformValidator, /preclassification_ahe_level_dominant/);
  assert.match(platformValidator, /session_ready_for_transduction/);
  assert.match(platformValidator, /evidence_bundle_for_transduction/);
});

test("phase 1 fixture set covers acceptance cases A-F", () => {
  assert.deepEqual(
    phase1Fixtures.fixtures.map((fixture) => fixture.id),
    ["A", "B", "C", "D", "E", "F"],
  );
  assert.match(JSON.stringify(phase1Fixtures), /7\.3a/);
  assert.match(JSON.stringify(phase1Fixtures), /mustNotFalseReady/);
});
