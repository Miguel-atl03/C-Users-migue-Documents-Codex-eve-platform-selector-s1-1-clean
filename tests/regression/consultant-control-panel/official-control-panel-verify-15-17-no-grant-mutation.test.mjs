import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const verify = readFileSync(
  resolve("scripts/eve/official-control-panel/verify-point15-17-action-chain.mjs"),
  "utf8",
);
const seed = readFileSync(
  resolve("scripts/eve/official-control-panel/seed-point15-17-experience-test.mjs"),
  "utf8",
);
const provision = readFileSync(
  resolve(
    "scripts/eve/official-control-panel/provision-point15-17-experience-capabilities.mjs",
  ),
  "utf8",
);

test("verifier does not spawn seed / provision and does not mutate grants", () => {
  // Executable paths only — comments may name the seed as a precondition.
  assert.doesNotMatch(
    verify,
    /spawnSync\([\s\S]{0,200}seed-point15-17-experience-test/,
  );
  assert.doesNotMatch(
    verify,
    /spawnSync\([\s\S]{0,200}provision-point15-17-experience-capabilities/,
  );
  assert.doesNotMatch(
    verify,
    /\.from\(\s*["']eve_consultant_panel_capability_grant["']\s*\)\s*\.(upsert|update|insert|delete)/,
  );
  assert.match(verify, /grantsMutatedByVerifier:\s*false/);
  assert.match(verify, /consultants\.c/);
  assert.match(verify, /manifest_missing/);
});

test("seed / provision assigns send_support_message for A via grant RPC", () => {
  assert.match(seed, /eve_grant_consultant_panel_capability/);
  assert.match(seed, /point15-opval-c@example\.invalid/);
  assert.match(seed, /assignment_without_send_support_message/);
  assert.doesNotMatch(
    seed,
    /insert into public\.eve_consultant_panel_capability_grant/,
  );
  assert.match(provision, /seed-point15-17-experience-test\.mjs/);
});
