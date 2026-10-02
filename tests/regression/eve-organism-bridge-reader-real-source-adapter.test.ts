import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  adaptRealSourceRecordsForBridgeReader,
  adaptRealSourceRecordsForBridgeReaderWithResult,
  evaluateRealSourceAdapterNoGo,
  getNonProductiveBridgeReaderRealSourceAdapterContract,
  getRealSourceAdapterReadiness,
  mapToShadowOnlyOutboxEventRecord,
  produceBridgeReaderInput,
  runBridgeReaderWithRealSourceAdapter,
  validateRealSourceRecord,
} from "../../src/services/eve-organism-bridge-reader-real-source-adapter.ts";

import type { ShadowOnlyOutboxEventsSourceRecord } from "../../src/types/eve-organism-bridge-reader-real-source-adapter.ts";

const serviceSource = readFileSync(
  "src/services/eve-organism-bridge-reader-real-source-adapter.ts",
  "utf8",
);
const typeSource = readFileSync(
  "src/types/eve-organism-bridge-reader-real-source-adapter.ts",
  "utf8",
);

function validRecord(overrides: Partial<ShadowOnlyOutboxEventsSourceRecord> = {}): ShadowOnlyOutboxEventsSourceRecord {
  return {
    eventId: "event-1",
    tenantId: "tenant-1",
    sessionId: "session-1",
    activityId: "activity-1",
    correlationId: "corr-1",
    idempotencyKey: "idem-1",
    sourceRef: "official-flow-1",
    provenance: "shadow-only-local-record",
    occurredAt: "2026-06-28T00:00:00.000Z",
    eventType: "accepted_for_shadow_outbox",
    payload: { runtime: "local" },
    officialOutcome: { state: "accepted" },
    shadowOutcome: { state: "shadow-accepted" },
    replayId: "replay-1",
    traceId: "trace-1",
    schemaVersion: "1",
    producer: "local-fixture",
    checksum: "checksum-1",
    noGoFlags: [],
    evidenceRefs: ["evidence-1"],
    sourceReadMode: "local_memory",
    shadowOutcomeProvenance: { source: "local-shadow-evaluator" },
    shadowOutcomeSchemaVersion: "shadow-outcome-v1",
    shadowOutcomeGeneratedAt: "2026-06-28T00:00:01.000Z",
    shadowOutcomeProducer: "EVE_SHADOW_NON_PRODUCTIVE",
    shadowOutcomeChecksum: "shadow-checksum-1",
    shadowOutcomeEvidenceRefs: ["shadow-evidence-1"],
    shadowOutcomeNoGoFlags: [],
    shadowOutcomeReadiness: "ready_for_shadow_comparison",
    shadowOutcomeSourceRef: "shadow-source-1",
    ...overrides,
  };
}

function hasNoGo(records: ShadowOnlyOutboxEventsSourceRecord[], code: string): boolean {
  return evaluateRealSourceAdapterNoGo(records).some((finding) => finding.code === code);
}

const scenarios: Array<[string, () => void]> = [
  ["001 contract defaults adapter name", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().adapterName, "NonProductiveBridgeReaderRealSourceAdapter")],
  ["002 contract migrationFileAvailable true", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().migrationFileAvailable, true)],
  ["003 contract migrationExecuted false", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().migrationExecuted, false)],
  ["004 contract requiresAppliedDbSchema false", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().requiresAppliedDbSchema, false)],
  ["005 contract sourceConnected false", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().sourceConnected, false)],
  ["006 contract realTableRead false", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().realTableRead, false)],
  ["007 contract localInMemoryRecordsOnly true", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().localInMemoryRecordsOnly, true)],
  ["008 contract sourceName shadow_only_outbox_events", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().sourceName, "shadow_only_outbox_events")],
  ["009 contract readOnly true", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().readOnly, true)],
  ["010 contract shadowOnly true", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().shadowOnly, true)],
  ["011 contract writesAllowed false", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().writesAllowed, false)],
  ["012 contract observerRequired false", () => assert.equal(getNonProductiveBridgeReaderRealSourceAdapterContract().observerRequired, false)],
  ["013 contract Gate 3 and Fase 9 false", () => {
    const contract = getNonProductiveBridgeReaderRealSourceAdapterContract();
    assert.equal(contract.gate3Required, false);
    assert.equal(contract.fase9Required, false);
  }],
  ["014 contract registry/export/diagnosis false", () => {
    const contract = getNonProductiveBridgeReaderRealSourceAdapterContract();
    assert.equal(contract.registryWriteAllowed, false);
    assert.equal(contract.exportAllowed, false);
    assert.equal(contract.diagnosisAllowed, false);
  }],
  ["015 accepts valid local source record", () => assert.equal(validateRealSourceRecord(validRecord()).ok, true)],
  ["016 maps valid record to ShadowOnlyOutboxEventRecord", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).sourceRef, "official-flow-1")],
  ["017 preserves tenantId", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).tenantId, "tenant-1")],
  ["018 preserves sessionId", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).sessionId, "session-1")],
  ["019 preserves activityId", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).activityId, "activity-1")],
  ["020 preserves correlationId", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).correlationId, "corr-1")],
  ["021 preserves idempotencyKey", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).idempotencyKey, "idem-1")],
  ["022 preserves provenance", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).provenance, "shadow-only-local-record")],
  ["023 preserves sourceRef", () => assert.equal(mapToShadowOnlyOutboxEventRecord(validRecord()).sourceRef, "official-flow-1")],
  ["024 preserves shadowOutcome", () => assert.deepEqual(mapToShadowOnlyOutboxEventRecord(validRecord()).shadowOutcome, { state: "shadow-accepted" })],
  ["025 preserves shadowOutcome metadata in source validation", () => assert.equal(validateRealSourceRecord(validRecord()).acceptedRecords[0].shadowOutcomeChecksum, "shadow-checksum-1")],
  ["026 rejects missing tenantId", () => assert.equal(validateRealSourceRecord(validRecord({ tenantId: undefined })).sourceReadiness, "blocked_by_missing_required_context")],
  ["027 rejects missing sessionId", () => assert.equal(hasNoGo([validRecord({ sessionId: undefined })], "MISSING_TENANT_SESSION_ACTIVITY"), true)],
  ["028 rejects missing activityId", () => assert.equal(hasNoGo([validRecord({ activityId: undefined })], "MISSING_TENANT_SESSION_ACTIVITY"), true)],
  ["029 rejects missing correlationId", () => assert.equal(hasNoGo([validRecord({ correlationId: undefined })], "MISSING_CORRELATION_ID"), true)],
  ["030 rejects missing idempotencyKey", () => assert.equal(hasNoGo([validRecord({ idempotencyKey: undefined })], "MISSING_IDEMPOTENCY_KEY"), true)],
  ["031 rejects missing provenance", () => assert.equal(hasNoGo([validRecord({ provenance: undefined })], "MISSING_PROVENANCE_OR_SOURCE_REF"), true)],
  ["032 rejects missing sourceRef", () => assert.equal(hasNoGo([validRecord({ sourceRef: undefined })], "MISSING_PROVENANCE_OR_SOURCE_REF"), true)],
  ["033 rejects invalid occurredAt", () => assert.equal(hasNoGo([validRecord({ occurredAt: "not-a-date" })], "MISSING_OCCURRED_AT"), true)],
  ["034 rejects missing officialOutcome", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ officialOutcome: undefined })]), "blocked_by_missing_official_outcome")],
  ["035 rejects missing shadowOutcome", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ shadowOutcome: undefined })]), "blocked_by_missing_shadow_outcome")],
  ["036 rejects missing shadowOutcome metadata", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ shadowOutcomeChecksum: undefined })]), "blocked_by_missing_shadow_outcome_metadata")],
  ["037 rejects wrong shadowOutcomeProducer", () => assert.equal(hasNoGo([validRecord({ shadowOutcomeProducer: "OTHER" })], "UNAUTHORIZED_SHADOW_OUTCOME_PRODUCER"), true)],
  ["038 rejects registryWrite true", () => assert.equal(hasNoGo([validRecord({ registryWrite: true })], "REGISTRY_WRITE_TRUE"), true)],
  ["039 rejects exportGenerated true", () => assert.equal(hasNoGo([validRecord({ exportGenerated: true })], "EXPORT_GENERATED_TRUE"), true)],
  ["040 rejects diagnosisEnabled true", () => assert.equal(hasNoGo([validRecord({ diagnosisEnabled: true })], "DIAGNOSIS_ENABLED_TRUE"), true)],
  ["041 rejects productiveWrite true", () => assert.equal(hasNoGo([validRecord({ productiveWrite: true })], "PRODUCTIVE_WRITE_TRUE"), true)],
  ["042 rejects gate3Ready true", () => assert.equal(hasNoGo([validRecord({ gate3Ready: true })], "SOURCE_REQUIRES_GATE3"), true)],
  ["043 rejects fase9Started true", () => assert.equal(hasNoGo([validRecord({ fase9Started: true })], "SOURCE_REQUIRES_FASE9"), true)],
  ["044 rejects write sourceReadMode", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ sourceReadMode: "write" })]), "blocked_by_write_risk")],
  ["045 detects tenant mix", () => assert.equal(hasNoGo([validRecord(), validRecord({ eventId: "event-2", tenantId: "tenant-2" })], "TENANT_MIX_NOT_ALLOWED"), true)],
  ["046 detects duplicate idempotency conflict before bridge reader", () => {
    const records = [validRecord(), validRecord({ eventId: "event-2", payload: { runtime: "different" } })];
    assert.equal(hasNoGo(records, "REPLAY_POISONING_RISK"), true);
  }],
  ["047 preserves input immutability", () => {
    const records = [validRecord()];
    const before = JSON.stringify(records);
    adaptRealSourceRecordsForBridgeReader(records);
    assert.equal(JSON.stringify(records), before);
  }],
  ["048 produceBridgeReaderInput returns mapped records only", () => {
    const input = produceBridgeReaderInput([validRecord()]);
    assert.equal(input.source, "shadow_only_outbox_events");
    assert.equal(input.records.length, 1);
  }],
  ["049 getReadiness ready for valid records", () => assert.equal(getRealSourceAdapterReadiness([validRecord()]), "ready_for_non_productive_bridge_reader_input")],
  ["050 getReadiness blocked_by_missing_shadow_outcome", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ shadowOutcome: null })]), "blocked_by_missing_shadow_outcome")],
  ["051 getReadiness blocked_by_missing_official_outcome", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ officialOutcome: null })]), "blocked_by_missing_official_outcome")],
  ["052 getReadiness blocked_by_missing_shadow_outcome_metadata", () => assert.equal(getRealSourceAdapterReadiness([validRecord({ shadowOutcomeGeneratedAt: undefined })]), "blocked_by_missing_shadow_outcome_metadata")],
  ["053 adapter can call existing Bridge Reader and get divergence report", () => {
    const result = runBridgeReaderWithRealSourceAdapter([validRecord()]);
    assert.equal(result.divergenceReport.totalCompared, 1);
  }],
  ["054 promotion remains false through Bridge Reader", () => {
    const result = runBridgeReaderWithRealSourceAdapter([validRecord()]);
    assert.equal(result.authority.gate3_ready, false);
    assert.equal(result.authority.fase9_started, false);
  }],
  ["055 no DB/Supabase/fetch/process.env/writeFile imports", () => {
    const operationalSurfacePattern =
      /from\s+["'][^"']*(supabase|postgres|pg|database|db)["']|createClient\s*\(|process\.env|\bfetch\s*\(|writeFile|fs\.write/i;
    assert.doesNotMatch(serviceSource, operationalSurfacePattern);
    assert.doesNotMatch(typeSource, operationalSurfacePattern);
  }],
  ["056 no real table read is performed", () => assert.equal(adaptRealSourceRecordsForBridgeReaderWithResult([validRecord()]).authority.real_table_read, false)],
  ["057 migration remains not executed", () => assert.equal(adaptRealSourceRecordsForBridgeReaderWithResult([validRecord()]).authority.migration_executed, false)],
  ["058 source remains disconnected", () => assert.equal(adaptRealSourceRecordsForBridgeReaderWithResult([validRecord()]).authority.source_connected, false)],
  ["059 missing shadowOutcome does not invent value", () => {
    assert.throws(() => mapToShadowOnlyOutboxEventRecord(validRecord({ shadowOutcome: undefined })), /missing_shadow_outcome/);
  }],
  ["060 adapter result preserves authority false", () => {
    const result = adaptRealSourceRecordsForBridgeReaderWithResult([validRecord()]);
    assert.equal(result.authority.registry_written, false);
    assert.equal(result.authority.export_generated, false);
    assert.equal(result.authority.diagnosis_enabled, false);
  }],
];

for (const [name, runScenario] of scenarios) {
  test(name, runScenario);
}

test("061 matrix summary covers required adapter scenarios", () => {
  assert.equal(scenarios.length, 60);
});
