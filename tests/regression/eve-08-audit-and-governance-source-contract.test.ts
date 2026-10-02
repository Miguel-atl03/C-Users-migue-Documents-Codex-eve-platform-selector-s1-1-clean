import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const aliasPath = "docs/audits/_eve_08_audit_and_governance_source_alias_resolution_qa_v1_1.json";
const rolePath = "docs/audits/_eve_08_audit_and_governance_source_role_qa_v1_1.json";
const d8Path = "docs/audits/_eve_08_audit_and_governance_d8_contextual_gap_qa_v1_1.json";
const noCableadoPath = "docs/audits/_eve_08_audit_and_governance_no_cableado_qa_v1_1.json";
const summaryPath = "docs/audits/_eve_08_audit_and_governance_record_rule_source_qa_summary_v1_1.json";

function longPath(path: string) {
  const fullPath = resolve(path);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function readJson(path: string) {
  return JSON.parse(readFileSync(longPath(path), "utf8"));
}

test("source contract QA artifacts exist and parse", () => {
  for (const path of [aliasPath, rolePath, d8Path, noCableadoPath, summaryPath]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.doesNotThrow(() => readJson(path), `${path} must parse`);
  }
});

test("source aliases are resolved without stale A07 primary proof", () => {
  const aliases = readJson(aliasPath);
  const byId = new Map(aliases.aliases.map((alias: any) => [alias.sourceId, alias]));

  assert.equal(aliases.counts.total, 50);
  assert.equal(aliases.counts.accepted, 50);
  assert.equal(aliases.counts.sourceMissing, 0);

  for (const sourceId of ["A07PJ", "A07TJ"]) {
    const alias: any = byId.get(sourceId);
    assert.ok(alias, `${sourceId} alias must be present`);
    assert.equal(alias.allowedAsPrimaryProof, false);
    assert.equal(alias.allowedAsContextOnly, true);
    assert.match(alias.staleOrCurrentStatus, /HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF/);
    assert.match(alias.qaStatus, /accepted_contextual_or_excluded/);
  }

  for (const sourceId of ["EVE01M", "EVE02M", "EVE03M", "EVE04M", "EVE05M", "EVE06M", "EVE07M"]) {
    const alias: any = byId.get(sourceId);
    assert.ok(alias, `${sourceId} alias must be present`);
    assert.match(alias.resolvedPath, /\.manifest\.json$/);
    assert.equal(alias.exists, true);
    assert.equal(alias.readable, true);
  }

  assert.equal((byId.get("ABRAIN") as any).allowedAsPrimaryProof, false);
  assert.equal((byId.get("BRAINZIP") as any).allowedAsPrimaryProof, false);
  assert.match((byId.get("BRAINZIP") as any).qaStatus, /accepted_contextual_or_excluded/);
});

test("D8 is contextual and not direct operational proof", () => {
  const d8 = readJson(d8Path);
  const summary = readJson(summaryPath);

  assert.equal(summary.d8ContextualGap, 0);
  assert.equal(d8.d8Declared, true);
  assert.equal(d8.usedAsDirectProof, false);
  assert.equal(d8.usedAsPrimarySource, false);
  assert.deepEqual(d8.usedByCriticalRules, []);
  assert.deepEqual(d8.usedBySourceProofRows, []);
  assert.equal(d8.usedOnlyAsContextualLineage, true);
  assert.equal(d8.qaStatus, "accepted_contextual_resolved");
  assert.equal(d8.requiredBeforeBrainConnection, true);
});

test("source roles preserve no circular certification and no upstream runtime authority", () => {
  const roles = readJson(rolePath);
  const byId = new Map(roles.sources.map((source: any) => [source.sourceId, source]));
  const serialized = JSON.stringify(roles);

  assert.equal(roles.counts.roleMismatch, 0);
  assert.match(serialized, /source_proof|source proof|sourceProof/i);
  assert.match(serialized, /system|state|evidence/i);

  for (const sourceId of ["EVE00", "EVE01", "EVE02", "EVE03", "EVE04", "EVE05", "EVE06", "EVE07"]) {
    const source: any = byId.get(sourceId);
    assert.ok(source, `${sourceId} role must be present`);
    assert.equal(source.roleMismatch, false);
    assert.doesNotMatch(JSON.stringify(source), /runtimeAuthority"?\s*:\s*true|active_runtime_authority"?\s*:\s*true/i);
  }

  assert.equal((byId.get("D8") as any).allowedAsPrimaryProof, false);
  assert.equal((byId.get("BRAINZIP") as any).allowedAsPrimaryProof, false);
});

test("no-cableado controls are all accepted", () => {
  const noCableado = readJson(noCableadoPath);
  const summary = readJson(summaryPath);
  const serialized = JSON.stringify(noCableado);

  assert.equal(noCableado.counts.noCableadoViolation, 0);
  assert.equal(summary.noCableadoViolation, 0);
  assert.doesNotMatch(serialized, /runtimeAuthority"?\s*:\s*true/i);
  assert.doesNotMatch(serialized, /registryWrite"?\s*:\s*true/i);
  assert.doesNotMatch(serialized, /productWiring"?\s*:\s*true/i);
  assert.doesNotMatch(serialized, /eveBrainConnection"?\s*:\s*true/i);
});
