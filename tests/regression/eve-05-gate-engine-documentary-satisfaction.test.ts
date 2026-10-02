import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const closeoutPath =
  "docs/audits/CLOSEOUT_EVE_05_GATE_ENGINE_INDEPENDENT_RECORD_RULE_SOURCE_QA_V1_4.md";
const auditJsonPaths = [
  "docs/audits/_eve_05_gate_engine_independent_record_rule_matrix_v1_4.json",
  "docs/audits/_eve_05_gate_engine_independent_documentary_satisfaction_matrix_v1_4.json",
  "docs/audits/_eve_05_gate_engine_independent_atomic_rules_satisfaction_matrix_v1_4.json",
  "docs/audits/_eve_05_gate_engine_independent_source_proof_validation_v1_4.json",
  "docs/audits/_eve_05_gate_engine_independent_remaining_gaps_v1_4.json"
];

const gateFamilies = [
  "critical_route_gate",
  "semantic_resolution_gate",
  "process_state_timer_gate",
  "mmabp_conformance_gate",
  "mmabp_consistency_gate",
  "failure_guards"
];

function longPath(path: string) {
  const fullPath = resolve(path);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function readJson(path: string) {
  return JSON.parse(readFileSync(longPath(path), "utf8"));
}

function valueOrZero(...values: unknown[]) {
  const found = values.find((value) => typeof value === "number");
  return found ?? 0;
}

function valueOrFalse(...values: unknown[]) {
  const found = values.find((value) => typeof value === "boolean");
  return found ?? false;
}

test("QA artifacts exist and parse", () => {
  for (const path of auditJsonPaths) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("record-rule QA dictamen is satisfactory", () => {
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  assert.match(closeout, /GATE_ENGINE_RECORD_RULE_QA_SATISFACTORY/);
});

test("documentary satisfaction matrix has no fidelity gaps", () => {
  const record = readJson("docs/audits/_eve_05_gate_engine_independent_record_rule_matrix_v1_4.json");
  const doc = readJson(
    "docs/audits/_eve_05_gate_engine_independent_documentary_satisfaction_matrix_v1_4.json"
  );
  const atomic = readJson(
    "docs/audits/_eve_05_gate_engine_independent_atomic_rules_satisfaction_matrix_v1_4.json"
  );
  const validation = readJson(
    "docs/audits/_eve_05_gate_engine_independent_source_proof_validation_v1_4.json"
  );
  const remaining = readJson(
    "docs/audits/_eve_05_gate_engine_independent_remaining_gaps_v1_4.json"
  );

  assert.equal(validation.companionProofsChecked, 157);
  assert.equal(validation.companionProofsAccepted, 157);
  assert.equal(validation.companionProofsRejected, 0);
  assert.equal(record.recordRulesChecked, 157);
  assert.equal(record.recordRulesAccepted, 157);
  assert.equal(record.recordRulesRejected, 0);
  assert.equal(atomic.atomicRulesChecked, 130);
  assert.equal(atomic.atomicRulesAccepted, 130);
  assert.equal(atomic.atomicRulesRejected, 0);
  assert.equal(validation.previousRejectedUniqueRulesAccepted, 16);
  assert.equal(validation.previousRejectedUniqueRulesRejected, 0);
  assert.equal(validation.previousRejectedRecordsAccepted, 31);
  assert.equal(validation.previousRejectedRecordsRejected, 0);
  assert.deepEqual(validation.mismatchesByReason, {});
  assert.equal(remaining.gapCount, 0);
  assert.deepEqual(remaining.gaps, []);
  assert.equal(doc.documentarySatisfactionStatus, "satisfactory");
  assert.equal(doc.dictamen, "GATE_ENGINE_RECORD_RULE_QA_SATISFACTORY");

  assert.equal(valueOrZero(doc.totals?.mismatches, validation.mismatches), 0);
  assert.equal(valueOrZero(doc.totals?.missingInChip, validation.missingInChip), 0);
  assert.equal(valueOrZero(doc.totals?.missingInSource, validation.missingInSource), 0);
  assert.equal(valueOrZero(doc.totals?.pendingSourceProof, validation.companionProofsPending), 0);
  assert.equal(valueOrZero(doc.genericProofsAccepted, validation.genericProofsAccepted), 0);
  assert.equal(valueOrFalse(doc.overreachDetected, validation.overreachDetected), false);
});

test("gate families and atomic rule family are covered", () => {
  const validation = readJson(
    "docs/audits/_eve_05_gate_engine_independent_source_proof_validation_v1_4.json"
  );
  const atomic = readJson(
    "docs/audits/_eve_05_gate_engine_independent_atomic_rules_satisfaction_matrix_v1_4.json"
  );
  const modules = new Set(validation.entries.map((entry: { module: string }) => entry.module));

  for (const family of gateFamilies) {
    assert.equal(modules.has(family), true, `${family} must be represented in V1_4 proofs`);
  }

  assert.equal(atomic.atomicRulesSatisfaction, "130/130");
  assert.equal(atomic.entries.length, 130);
});

test("no-overreach and no-cableado remain protected by QA artifacts", () => {
  const doc = readJson(
    "docs/audits/_eve_05_gate_engine_independent_documentary_satisfaction_matrix_v1_4.json"
  );
  const validation = readJson(
    "docs/audits/_eve_05_gate_engine_independent_source_proof_validation_v1_4.json"
  );
  const closeout = readFileSync(longPath(closeoutPath), "utf8");
  const serialized = `${JSON.stringify(doc)}\n${JSON.stringify(validation)}\n${closeout}`;

  assert.match(serialized, /No overreach D1\/VSM1\/AHE1/i);
  assert.match(serialized, /No runtime\/productive wiring|No runtime authority/i);
  assert.match(serialized, /No registry write/i);
  assert.match(serialized, /No EVE brain connection/i);
  assert.match(serialized, /No WorkMap/i);
  assert.match(serialized, /Significado/i);
  assert.match(serialized, /Supabase/i);
  assert.match(serialized, /SQL/i);
  assert.doesNotMatch(serialized, /VSM diagnostic enabled|AHE diagnostic enabled/i);
  assert.doesNotMatch(serialized, /diagnostico final habilitado|final diagnosis enabled/i);
  assert.doesNotMatch(serialized, /IR enabled|export enabled|registry write true/i);
});
