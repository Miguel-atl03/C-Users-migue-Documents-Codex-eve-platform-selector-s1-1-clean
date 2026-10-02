import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const matrixPath = "docs/audits/_eve04_cvar_001_source_decision_matrix.json";
const summaryPath = "docs/audits/_eve04_cvar_001_summary.json";
const closeoutPath = "docs/audits/EVE04_CVAR_001_SOURCE_DECISION_PREFLIGHT.md";

test("CVAR-001 source decision preflight keeps all 33 variables open", () => {
  const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  assert.equal(matrix.issueId, "CVAR-001");
  assert.equal(matrix.count, 33);
  assert.equal(matrix.rows.length, 33);
  assert.equal(summary.cvarClosed, false);
  assert.equal(summary.certified, false);
  assert.equal(summary.rules.cvar001Closed, false);
});

test("CVAR-001 source decision rows preserve required audit fields", () => {
  const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
  const required = ["variable_name","referenced_by_source_node_id","referenced_by_runtime_interaction_id","source_matrix_row","found_in_mother_nodes","found_in_mother_canonical_variables","found_in_runtime_xlsx","found_in_eve03_json","found_in_eve04_candidate_json","mother_matches","runtime_matches","eve03_matches","eve04_matches","exact_source_sheet","exact_source_row","exact_source_column","source_definition_text","definition_quality","recommended_status","risk_if_left_open","proposed_next_action","requires_human_approval","notes"];
  for (const row of matrix.rows) {
    for (const field of required) assert.ok(Object.hasOwn(row, field), `${row.variable_name} missing ${field}`);
    assert.equal(row.requires_human_approval, true);
    assert.notEqual(row.recommended_status, "CERTIFIED");
    assert.notEqual(row.recommended_status, "READY_NO_FLAGS");
  }
});

test("CVAR-001 closeout does not claim certification or closure", () => {
  const text = readFileSync(closeoutPath, "utf8");
  assert.match(text, /CVAR-001 permanece abierto/);
  assert.match(text, /No se declara CERTIFIED/);
  assert.doesNotMatch(text, /READY_NO_FLAGS/);
});
