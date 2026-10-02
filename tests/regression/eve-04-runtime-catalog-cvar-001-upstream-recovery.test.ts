import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function platformRoot() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, "docs/audits/_eve04_cvar_001_upstream_recovery_matrix.json"))) {
    return cwd;
  }
  return join(cwd, "external-consumers/eve-platform");
}

function gitRoot() {
  return execFileSync("git", ["-c", "safe.directory=*", "rev-parse", "--show-toplevel"], {
    cwd: platformRoot(),
    encoding: "utf8",
  }).trim();
}

const root = platformRoot();
const matrixPath = join(root, "docs/audits/_eve04_cvar_001_upstream_recovery_matrix.json");
const summaryPath = join(root, "docs/audits/_eve04_cvar_001_upstream_recovery_summary.json");

test("CVAR-001 upstream recovery artifacts exist and preserve 33 open variables", () => {
  assert.equal(existsSync(matrixPath), true);
  assert.equal(existsSync(summaryPath), true);

  const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

  assert.equal(matrix.issueId, "CVAR-001");
  assert.equal(matrix.rows.length, 33);
  assert.equal(summary.total_variables, 33);
  assert.equal(summary.definition_addendum_required, 33);
  assert.equal(summary.can_certify_eve04_now, false);
  assert.equal(summary.can_promote_eve04_now, false);
  assert.equal(summary.can_continue_shadow, true);
});

test("CVAR-001 upstream recovery does not close or certify any variable", () => {
  const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));

  assert.equal(matrix.cvarClosed, false);
  assert.equal(matrix.certified, false);
  assert.equal(summary.cvarClosed, false);
  assert.equal(summary.certified, false);

  for (const row of matrix.rows) {
    assert.equal(row.recommended_resolution_path, "CVAR_DEFINITION_ADDENDUM_REQUIRED");
    assert.equal(row.can_apply_technical_patch, false);
    assert.equal(row.should_remain_shadow_only, true);
    assert.notEqual(row.recommended_resolution_path, "CERTIFIED");
    assert.notEqual(row.recommended_resolution_path, "READY_NO_FLAGS");
  }
});

test("CVAR-001 upstream recovery did not modify candidate or tracked product files", () => {
  const diff = execFileSync(
    "git",
    ["-c", "safe.directory=*", "-c", "core.longpaths=true", "diff", "--name-only"],
    { cwd: gitRoot(), encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);

  const candidateChanges = diff.filter((path) =>
    path.startsWith("external-consumers/eve-platform/docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/"),
  );
  const trackedProductChanges = diff.filter((path) =>
    path.startsWith("external-consumers/eve-platform/src/"),
  );

  assert.deepEqual(candidateChanges, []);
  assert.deepEqual(trackedProductChanges, []);
});
