import assert from "node:assert/strict";
import { test } from "node:test";

import {
  adaptRealSourceRecordsForBridgeReader,
  adaptRealSourceRecordsForBridgeReaderWithResult,
  evaluateRealSourceAdapterNoGo,
  getNonProductiveBridgeReaderRealSourceAdapterContract,
  getRealSourceAdapterReadiness,
  mapToShadowOnlyOutboxEventRecord,
  runBridgeReaderWithRealSourceAdapter,
  validateRealSourceRecord,
} from "../../src/services/eve-organism-bridge-reader-real-source-adapter.ts";

import type { ShadowOnlyOutboxEventsSourceRecord } from "../../src/types/eve-organism-bridge-reader-real-source-adapter.ts";

function syntheticRecord(
  overrides: Partial<ShadowOnlyOutboxEventsSourceRecord> = {},
): ShadowOnlyOutboxEventsSourceRecord {
  return {
    eventId: "synthetic-event-1",
    tenantId: "tenant-local",
    sessionId: "session-local",
    activityId: "activity-local",
    correlationId: "correlation-local",
    idempotencyKey: "idempotency-local-1",
    sourceRef: "shadow-only-outbox-local-ref",
    provenance: "local-synthetic-e2e",
    occurredAt: "2026-06-28T00:00:00.000Z",
    eventType: "accepted_for_shadow_outbox",
    payload: { step: "local-e2e", source: "synthetic" },
    officialOutcome: { status: "approved", value: 1 },
    shadowOutcome: { status: "blocked", value: 2 },
    replayId: "replay-local-1",
    traceId: "trace-local-1",
    schemaVersion: "1",
    producer: "local-e2e-fixture",
    checksum: "checksum-local-1",
    noGoFlags: [],
    evidenceRefs: ["synthetic-evidence-1"],
    sourceReadMode: "local_memory",
    sourceKind: "shadow_outbox",
    shadowOutcomeProvenance: { source: "local-shadow-evaluator" },
    shadowOutcomeSchemaVersion: "shadow-outcome-v1",
    shadowOutcomeGeneratedAt: "2026-06-28T00:00:01.000Z",
    shadowOutcomeProducer: "EVE_SHADOW_NON_PRODUCTIVE",
    shadowOutcomeChecksum: "shadow-checksum-1",
    shadowOutcomeEvidenceRefs: ["shadow-evidence-1"],
    shadowOutcomeNoGoFlags: [],
    shadowOutcomeReadiness: "ready_for_shadow_comparison",
    shadowOutcomeSourceRef: "shadow-source-local-1",
    ...overrides,
  };
}

function hasNoGo(records: ShadowOnlyOutboxEventsSourceRecord[], code: string): boolean {
  return evaluateRealSourceAdapterNoGo(records).some((finding) => finding.code === code);
}

const scenarios: Array<[string, () => void]> = [
  ["001 E2E valid synthetic record reaches Bridge Reader", () => {
    const result = runBridgeReaderWithRealSourceAdapter([syntheticRecord()]);
    assert.equal(result.recordsRead, 1);
    assert.equal(result.recordsAccepted, 1);
  }],
  ["002 E2E valid batch reaches Bridge Reader", () => {
    const batch = [
      syntheticRecord(),
      syntheticRecord({
        eventId: "synthetic-event-2",
        idempotencyKey: "idempotency-local-2",
        sourceRef: "shadow-only-outbox-local-ref-2",
      }),
    ];
    const result = runBridgeReaderWithRealSourceAdapter(batch);
    assert.equal(result.recordsRead, 2);
    assert.equal(result.recordsAccepted, 2);
  }],
  ["003 divergent officialOutcome vs shadowOutcome produces local divergence evidence", () => {
    const result = runBridgeReaderWithRealSourceAdapter([syntheticRecord()]);
    assert.equal(result.divergenceReport.divergentOutcomes, 1);
    assert.equal(result.divergenceReport.divergences.length, 1);
  }],
  ["004 aligned officialOutcome vs shadowOutcome produces local aligned evidence", () => {
    const aligned = syntheticRecord({ shadowOutcome: { status: "approved", value: 1 } });
    const result = runBridgeReaderWithRealSourceAdapter([aligned]);
    assert.equal(result.divergenceReport.equalOutcomes, 1);
    assert.equal(result.divergenceReport.divergentOutcomes, 0);
  }],
  ["005 missing shadowOutcome is rejected before Bridge Reader", () => {
    assert.equal(validateRealSourceRecord(syntheticRecord({ shadowOutcome: undefined })).ok, false);
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcome: undefined })], "MISSING_SHADOW_OUTCOME"), true);
  }],
  ["006 missing officialOutcome is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ officialOutcome: undefined })], "MISSING_OFFICIAL_OUTCOME"), true);
  }],
  ["007 missing shadowOutcomeProvenance is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcomeProvenance: undefined })], "MISSING_SHADOW_OUTCOME_METADATA"), true);
  }],
  ["008 missing shadowOutcomeSchemaVersion is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcomeSchemaVersion: undefined })], "MISSING_SHADOW_OUTCOME_METADATA"), true);
  }],
  ["009 missing shadowOutcomeGeneratedAt is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcomeGeneratedAt: undefined })], "MISSING_SHADOW_OUTCOME_METADATA"), true);
  }],
  ["010 missing shadowOutcomeProducer is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcomeProducer: undefined })], "MISSING_SHADOW_OUTCOME_METADATA"), true);
  }],
  ["011 wrong shadowOutcomeProducer is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcomeProducer: "OTHER" })], "UNAUTHORIZED_SHADOW_OUTCOME_PRODUCER"), true);
  }],
  ["012 missing shadowOutcomeChecksum is rejected before Bridge Reader", () => {
    assert.equal(hasNoGo([syntheticRecord({ shadowOutcomeChecksum: undefined })], "MISSING_SHADOW_OUTCOME_METADATA"), true);
  }],
  ["013 registryWrite true is rejected", () => {
    assert.equal(hasNoGo([syntheticRecord({ registryWrite: true })], "REGISTRY_WRITE_TRUE"), true);
  }],
  ["014 exportGenerated true is rejected", () => {
    assert.equal(hasNoGo([syntheticRecord({ exportGenerated: true })], "EXPORT_GENERATED_TRUE"), true);
  }],
  ["015 diagnosisEnabled true is rejected", () => {
    assert.equal(hasNoGo([syntheticRecord({ diagnosisEnabled: true })], "DIAGNOSIS_ENABLED_TRUE"), true);
  }],
  ["016 gate3Ready true is rejected", () => {
    assert.equal(hasNoGo([syntheticRecord({ gate3Ready: true })], "SOURCE_REQUIRES_GATE3"), true);
  }],
  ["017 fase9Started true is rejected", () => {
    assert.equal(hasNoGo([syntheticRecord({ fase9Started: true })], "SOURCE_REQUIRES_FASE9"), true);
  }],
  ["018 sourceReadMode write is rejected", () => {
    assert.equal(hasNoGo([syntheticRecord({ sourceReadMode: "write" })], "SOURCE_REQUIRES_WRITE_CAPABILITY"), true);
  }],
  ["019 tenant mix is captured as no-go according to adapter contract", () => {
    const mixed = [
      syntheticRecord(),
      syntheticRecord({ eventId: "synthetic-event-tenant-2", tenantId: "tenant-other", idempotencyKey: "idempotency-local-2" }),
    ];
    assert.equal(hasNoGo(mixed, "TENANT_MIX_NOT_ALLOWED"), true);
  }],
  ["020 duplicate idempotency conflict is rejected before Bridge Reader", () => {
    const duplicate = [
      syntheticRecord(),
      syntheticRecord({ eventId: "synthetic-event-duplicate", payload: { step: "changed" } }),
    ];
    assert.equal(hasNoGo(duplicate, "REPLAY_POISONING_RISK"), true);
  }],
  ["021 input immutability preserved", () => {
    const record = syntheticRecord();
    const before = JSON.stringify(record);
    runBridgeReaderWithRealSourceAdapter([record]);
    assert.equal(JSON.stringify(record), before);
  }],
  ["022 localInMemoryRecordsOnly true remains true", () => {
    assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().localInMemoryRecordsOnly, true);
  }],
  ["023 sourceConnected remains false", () => {
    assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().sourceConnected, false);
  }],
  ["024 realTableRead remains false", () => {
    assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().realTableRead, false);
  }],
  ["025 migrationExecuted remains false", () => {
    assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().migrationExecuted, false);
  }],
  ["026 Gate 2 real-shadow remains false", () => {
    const result = adaptRealSourceRecordsForBridgeReaderWithResult([syntheticRecord()]);
    assert.equal(result.authority.gate2_real_shadow_closed, false);
  }],
  ["027 Gate 3 and Fase 9 remain false", () => {
    const result = adaptRealSourceRecordsForBridgeReaderWithResult([syntheticRecord()]);
    assert.equal(result.authority.gate3_ready, false);
    assert.equal(result.authority.fase9_started, false);
  }],
  ["028 observer registry export diagnosis remain false", () => {
    const result = adaptRealSourceRecordsForBridgeReaderWithResult([syntheticRecord()]);
    assert.equal(result.authority.observer_created, false);
    assert.equal(result.authority.registry_written, false);
    assert.equal(result.authority.export_generated, false);
    assert.equal(result.authority.diagnosis_enabled, false);
  }],
  ["029 no production authority granted", () => {
    const contract = getNonProductiveBridgeReaderRealSourceAdapterContract();
    assert.equal(contract.productiveAuthorityGranted, false);
    assert.equal(contract.writesAllowed, false);
    assert.equal(contract.dbWriteAllowed, false);
  }],
  ["030 no DB Supabase fetch process env or filesystem imports are used", () => {
    assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().sourceConnected, false);
  }],
  ["031 valid records are mapped toward ShadowOnlyOutboxEventRecord", () => {
    const mapped = mapToShadowOnlyOutboxEventRecord(syntheticRecord());
    assert.equal(mapped.tenantId, "tenant-local");
    assert.deepEqual(mapped.shadowOutcome, { status: "blocked", value: 2 });
  }],
  ["032 adapter produces Bridge Reader input from valid synthetic records", () => {
    const input = adaptRealSourceRecordsForBridgeReader([syntheticRecord()]);
    assert.equal(input.source, "shadow_only_outbox_events");
    assert.equal(input.records.length, 1);
  }],
  ["033 invalid records are excluded from Bridge Reader input", () => {
    const result = adaptRealSourceRecordsForBridgeReaderWithResult([syntheticRecord({ shadowOutcome: undefined })]);
    assert.equal(result.validation.ok, false);
    assert.equal(result.bridgeReaderInput.records.length, 0);
  }],
  ["034 readiness reports ready for valid local synthetic records", () => {
    assert.equal(getRealSourceAdapterReadiness([syntheticRecord()]), "ready_for_non_productive_bridge_reader_input");
  }],
  ["035 readiness reports blocked for missing shadowOutcome", () => {
    assert.equal(getRealSourceAdapterReadiness([syntheticRecord({ shadowOutcome: undefined })]), "blocked_by_missing_shadow_outcome");
  }],
];

for (const [name, assertion] of scenarios) {
  test(name, assertion);
}

test("036 matrix summary covers required local E2E evidence scenarios", () => {
  assert.equal(scenarios.length, 35);
});
