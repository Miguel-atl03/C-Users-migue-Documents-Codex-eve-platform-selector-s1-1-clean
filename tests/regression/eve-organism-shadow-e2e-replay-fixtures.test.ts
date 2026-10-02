import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO,
  runShadowE2EReplay,
  runShadowE2EReplayBatch,
} from "../../src/services/eve-organism-shadow-e2e-adapter.ts";
import type { EveOrganismShadowE2EObservedSignal } from "../../src/types/eve-organism-shadow-e2e.ts";

type FixtureMetadata = {
  fixtureId: string;
  sourceSignalId: string;
  sourcePath: string;
  evidenceLocator: string;
  sourceKind: string;
  syntheticTestValueRequired: boolean;
  syntheticFields: {
    field: string;
    syntheticValueKind: string;
    whyRequired: string;
    whySafeForFixtureOnly: string;
  }[];
  missingInSourceFields: string[];
  noSensitiveData: boolean;
  fixtureOnly: boolean;
  expected: {
    status: string;
    accepted: boolean;
    blockers: string[];
    divergenceType: string;
    requestedCapability: string;
  };
  coverage: string[];
};

type ReplayFixture = EveOrganismShadowE2EObservedSignal & {
  fixtureMetadata: FixtureMetadata;
};

const fixtureDir = new URL("../fixtures/eve-organism-shadow-e2e/", import.meta.url);
const expectedFixtureFiles = [
  "replay_fixture_001_workmap_activity.json",
  "replay_fixture_002_significado_intent.json",
  "replay_fixture_003_runtime_like_response.json",
  "replay_fixture_004_evidence_provenance.json",
  "replay_fixture_005_candidate_source_trace.json",
  "replay_fixture_006_official_flow_ref.json",
  "replay_fixture_007_missing_context.json",
  "replay_fixture_008_missing_provenance.json",
  "replay_fixture_009_missing_idempotency_correlation.json",
  "replay_fixture_010_missing_source_trace.json",
  "replay_fixture_011_registry_export_attempt.json",
  "replay_fixture_012_tenant_leak_attempt.json",
  "replay_fixture_013_gate_bypass_signal.json",
  "replay_fixture_014_evidence_corruption_signal.json",
  "replay_fixture_015_no_go_critical_signal.json",
  "replay_fixture_016_non_critical_divergence_signal.json",
];

const fixtures = expectedFixtureFiles.map(loadFixture);

test("loads exactly the 16 approved replay fixtures from disk", () => {
  assert.deepEqual(
    readdirSync(fixtureDir)
      .filter((file) => file.endsWith(".json"))
      .sort(),
    [...expectedFixtureFiles].sort(),
  );
  assert.equal(fixtures.length, 16);
});

test("all replay fixtures include source-backed metadata and fixture-only guardrails", () => {
  for (const fixture of fixtures) {
    const metadata = fixture.fixtureMetadata;

    assert.equal(typeof metadata.fixtureId, "string");
    assert.equal(typeof metadata.sourceSignalId, "string");
    assert.equal(typeof metadata.sourcePath, "string");
    assert.equal(typeof metadata.evidenceLocator, "string");
    assert.equal(typeof metadata.sourceKind, "string");
    assert.equal(metadata.noSensitiveData, true);
    assert.equal(metadata.fixtureOnly, true);
    assert.equal(fixture.observationMode, "fixture");
    assert.equal(fixture.sideEffectPolicy.noDbWrite, true);
    assert.equal(fixture.sideEffectPolicy.noRegistryWrite, true);
    assert.equal(fixture.sideEffectPolicy.noExport, true);
    assert.equal(fixture.sideEffectPolicy.noUiTouch, true);
    assert.equal(fixture.sideEffectPolicy.noDiagnosis, true);
    assert.equal(fixture.sideEffectPolicy.noRuntimeMutation, true);
    assert.equal(fixture.sideEffectPolicy.noSupabaseRequired, true);
  }
});

test("synthetic fixture fields are explicitly declared", () => {
  for (const fixture of fixtures) {
    assert.equal(fixture.fixtureMetadata.syntheticTestValueRequired, true);
    assert.ok(fixture.fixtureMetadata.syntheticFields.length > 0);

    const declared = new Set(fixture.fixtureMetadata.syntheticFields.map((item) => item.field));
    for (const item of fixture.fixtureMetadata.syntheticFields) {
      assert.equal(typeof item.field, "string");
      assert.equal(typeof item.syntheticValueKind, "string");
      assert.equal(typeof item.whyRequired, "string");
      assert.equal(typeof item.whySafeForFixtureOnly, "string");
    }

    for (const field of ["observedSignalId", "observedAt", "sourceSystem", "rawObservedPayload.fixtureMarker"]) {
      assert.equal(declared.has(field), true, `${fixture.fixtureMetadata.fixtureId} must declare ${field}`);
    }
  }
});

test("fixtures do not contain sensitive string values", () => {
  for (const fixture of fixtures) {
    const sensitiveValues = collectStringValues(fixture).filter(({ path, value }) => {
      if (path.includes(".syntheticFields.") && path.endsWith(".field")) {
        return false;
      }

      return /@|token|secret|password|api[_-]?key|private[_-]?key|bearer|sk-[a-z0-9]/i.test(value);
    });

    assert.deepEqual(sensitiveValues, []);
  }
});

test("each fixture runs through the offline shadow E2E adapter with expected status, blockers and divergence", () => {
  for (const fixture of fixtures) {
    const result = runShadowE2EReplay(fixture);
    const expected = fixture.fixtureMetadata.expected;

    assert.equal(result.accepted, expected.accepted, fixture.fixtureMetadata.fixtureId);
    assert.equal(result.shadowResult.status, expected.status, fixture.fixtureMetadata.fixtureId);
    assert.equal(result.shadowCommand.requestedCapability, expected.requestedCapability, fixture.fixtureMetadata.fixtureId);
    assert.equal(result.comparison.divergenceType, expected.divergenceType, fixture.fixtureMetadata.fixtureId);
    assert.deepEqual(
      result.blockers.map((blocker) => blocker.id),
      expected.blockers,
      fixture.fixtureMetadata.fixtureId,
    );
  }
});

test("no-cableado remains false for every replay fixture", () => {
  for (const fixture of fixtures) {
    const result = runShadowE2EReplay(fixture);

    assert.deepEqual(result.noCableadoAttestation, EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO);
    assert.equal(result.noCableadoAttestation.db_write_allowed, false);
    assert.equal(result.noCableadoAttestation.registry_write_allowed, false);
    assert.equal(result.noCableadoAttestation.final_export_allowed, false);
    assert.equal(result.noCableadoAttestation.diagnosis_allowed, false);
    assert.equal(result.noCableadoAttestation.ui_touch_allowed, false);
    assert.equal(result.noCableadoAttestation.runtime_mutation_allowed, false);
    assert.equal(result.noCableadoAttestation.supabase_required, false);
    assert.equal(result.officialFlowUntouched, true);
  }
});

test("accepted fixtures produce trace and non-accepted fixtures preserve blockers", () => {
  for (const fixture of fixtures) {
    const result = runShadowE2EReplay(fixture);

    if (fixture.fixtureMetadata.expected.status === "SHADOW_ACCEPTED") {
      assert.ok(result.shadowResult.trace.length > 0, fixture.fixtureMetadata.fixtureId);
      continue;
    }

    assert.ok(result.blockers.length > 0, fixture.fixtureMetadata.fixtureId);
  }
});

test("cross-tenant fixture does not mix tenant identifiers", () => {
  const tenantLeakFixture = fixtures.find(
    (fixture) => fixture.fixtureMetadata.fixtureId === "replay_fixture_012_tenant_leak_attempt",
  );

  assert.ok(tenantLeakFixture);
  const result = runShadowE2EReplay(tenantLeakFixture);
  assert.equal(result.shadowCommand.tenantId, tenantLeakFixture.tenantId);
  assert.notEqual(result.shadowCommand.tenantId, (tenantLeakFixture.rawObservedPayload as { crossTenantProbe: { attemptedTenantId: string } }).crossTenantProbe.attemptedTenantId);
});

test("batch replay preserves count and order for all 16 fixtures", () => {
  const results = runShadowE2EReplayBatch(fixtures);

  assert.equal(results.length, 16);
  assert.deepEqual(
    results.map((result) => result.observedSignalId),
    fixtures.map((fixture) => fixture.observedSignalId),
  );
});

function loadFixture(fileName: string): ReplayFixture {
  return JSON.parse(readFileSync(new URL(fileName, fixtureDir), "utf8")) as ReplayFixture;
}

function collectStringValues(value: unknown, path = "$"): { path: string; value: string }[] {
  if (typeof value === "string") {
    return [{ path, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStringValues(item, `${path}.${index}`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => collectStringValues(item, `${path}.${key}`));
  }

  return [];
}
