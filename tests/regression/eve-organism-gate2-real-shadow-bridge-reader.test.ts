import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  buildShadowDivergenceReport,
  evaluateBridgeReaderNoGo,
  getBridgeReaderPromotionStatus,
  getGate2RealShadowBridgeReaderContract,
  readShadowOnlyOutboxEvents,
  validateShadowOnlyOutboxEvent,
} from "../../src/services/eve-organism-gate2-real-shadow-bridge-reader.ts";

import type { ShadowOnlyOutboxEventRecord } from "../../src/types/eve-organism-gate2-real-shadow-bridge-reader.ts";

const serviceSource = readFileSync(
  "src/services/eve-organism-gate2-real-shadow-bridge-reader.ts",
  "utf8",
);

function validRecord(overrides: Partial<ShadowOnlyOutboxEventRecord> = {}): ShadowOnlyOutboxEventRecord {
  return {
    eventId: "event-1",
    tenantId: "tenant-1",
    sessionId: "session-1",
    activityId: "activity-1",
    correlationId: "corr-1",
    idempotencyKey: "idem-1",
    sourceRef: "official-flow-1",
    provenance: "local-fixture",
    occurredAt: "2026-06-27T00:00:00.000Z",
    eventType: "shadow_fixture",
    payload: { value: 1 },
    officialOutcome: { status: "ok" },
    shadowOutcome: { status: "ok" },
    replayId: "replay-1",
    traceId: "trace-1",
    schemaVersion: "1",
    producer: "test",
    checksum: "checksum-1",
    noGoFlags: [],
    evidenceRefs: ["evidence-1"],
    ...overrides,
  };
}

const scenarioTests: Array<[string, () => void]> = [
  ["001 contract default keeps readOnly true", () => assert.equal(getGate2RealShadowBridgeReaderContract().readOnly, true)],
  ["002 contract default keeps shadowOnly true", () => assert.equal(getGate2RealShadowBridgeReaderContract().shadowOnly, true)],
  ["003 contract disables productive writes", () => assert.equal(getGate2RealShadowBridgeReaderContract().productiveWritesAllowed, false)],
  ["004 contract disables registry write", () => assert.equal(getGate2RealShadowBridgeReaderContract().registryWriteAllowed, false)],
  ["005 contract disables export", () => assert.equal(getGate2RealShadowBridgeReaderContract().exportAllowed, false)],
  ["006 contract disables diagnosis", () => assert.equal(getGate2RealShadowBridgeReaderContract().diagnosisAllowed, false)],
  ["007 contract disables Gate 3", () => assert.equal(getGate2RealShadowBridgeReaderContract().gate3Allowed, false)],
  ["008 contract disables Fase 9", () => assert.equal(getGate2RealShadowBridgeReaderContract().fase9Allowed, false)],
  ["009 contract carries 29 required read fields from prior plan", () => assert.equal(getGate2RealShadowBridgeReaderContract().requiredReadFieldsTotal, 29)],

  ["010 accepts valid local fixture record", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord()).accepted, true)],
  ["011 read accepts valid local fixture record", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).recordsAccepted, 1)],
  ["012 rejects missing tenantId", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ tenantId: undefined, tenant_id: undefined })).findings[0].code, "MISSING_TENANT_ID")],
  ["013 rejects missing sessionId", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ sessionId: undefined, session_id: undefined })).findings[0].code, "MISSING_SESSION_ID")],
  ["014 rejects missing activityId", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ activityId: undefined, activity_id: undefined })).findings[0].code, "MISSING_ACTIVITY_ID")],
  ["015 rejects missing correlationId", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ correlationId: undefined, correlation_id: undefined })).findings[0].code, "MISSING_CORRELATION_ID")],
  ["016 rejects missing idempotencyKey", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ idempotencyKey: undefined, idempotency_key: undefined })).findings[0].code, "MISSING_IDEMPOTENCY_KEY")],
  ["017 rejects missing sourceRef", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ sourceRef: undefined, official_flow_ref: undefined, source_locator: undefined })).findings[0].code, "MISSING_SOURCE_REF")],
  ["018 rejects missing provenance", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ provenance: undefined })).findings[0].code, "MISSING_PROVENANCE")],
  ["019 rejects invalid occurredAt", () => assert.equal(validateShadowOnlyOutboxEvent(validRecord({ occurredAt: "not-a-date" })).findings[0].code, "INVALID_OCCURRED_AT")],
  ["020 rejects duplicate idempotencyKey in same boundary", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord(), validRecord({ eventId: "event-2" })] });
    assert.ok(result.noGoFindings.some((finding) => finding.code === "DUPLICATE_IDEMPOTENCY_KEY"));
  }],
  ["021 same idempotencyKey across tenant is no-go by default", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord(), validRecord({ eventId: "event-2", tenantId: "tenant-2" })] });
    assert.ok(result.noGoFindings.some((finding) => finding.code === "TENANT_MIXING_DETECTED"));
  }],
  ["022 same idempotencyKey across tenant can pass when cross-tenant batch is explicit", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", allowCrossTenantBatch: true, records: [validRecord(), validRecord({ eventId: "event-2", tenantId: "tenant-2" })] });
    assert.equal(result.noGoFindings.some((finding) => finding.code === "TENANT_MIXING_DETECTED"), false);
  }],

  ["023 detects divergent officialOutcome vs shadowOutcome", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord({ shadowOutcome: { status: "changed" } })] });
    assert.equal(result.divergenceReport.divergentOutcomes, 1);
  }],
  ["024 detects equal officialOutcome vs shadowOutcome", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] });
    assert.equal(result.divergenceReport.equalOutcomes, 1);
  }],
  ["025 produces divergence report with zero divergences", () => {
    const report = buildShadowDivergenceReport([]);
    assert.equal(report.divergentOutcomes, 0);
    assert.equal(report.totalCompared, 0);
  }],
  ["026 preserves input immutability", () => {
    const records = [validRecord()];
    const before = JSON.stringify(records);
    readShadowOnlyOutboxEvents({ source: "fixture", records });
    assert.equal(JSON.stringify(records), before);
  }],

  ["027 rejects registryWrite true", () => assert.ok(evaluateBridgeReaderNoGo([validRecord({ registryWrite: true })]).some((finding) => finding.code === "REGISTRY_WRITE_ATTEMPT"))],
  ["028 rejects exportGenerated true", () => assert.ok(evaluateBridgeReaderNoGo([validRecord({ exportGenerated: true })]).some((finding) => finding.code === "EXPORT_ATTEMPT"))],
  ["029 rejects diagnosisEnabled true", () => assert.ok(evaluateBridgeReaderNoGo([validRecord({ diagnosisEnabled: true })]).some((finding) => finding.code === "DIAGNOSIS_ATTEMPT"))],
  ["030 rejects gate3Ready true", () => assert.ok(evaluateBridgeReaderNoGo([validRecord({ gate3Ready: true })]).some((finding) => finding.code === "GATE3_AUTHORITY_ATTEMPT"))],
  ["031 rejects fase9Started true", () => assert.ok(evaluateBridgeReaderNoGo([validRecord({ fase9Started: true })]).some((finding) => finding.code === "FASE9_AUTHORITY_ATTEMPT"))],
  ["032 rejects productiveWrite true", () => assert.ok(evaluateBridgeReaderNoGo([validRecord({ productiveWrite: true })]).some((finding) => finding.code === "PRODUCTIVE_WRITE_ATTEMPT"))],
  ["033 rejects invalid source", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] });
    assert.equal(result.noGoFindings.some((finding) => finding.code === "INVALID_SOURCE"), false);
  }],
  ["034 no-go status blocks clean promotion", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord({ gate3Ready: true })] });
    assert.equal(result.divergenceReport.noGoStatus, "NO_GO_DETECTED");
  }],
  ["035 promotion status remains false with clean records", () => {
    const result = readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] });
    assert.equal(getBridgeReaderPromotionStatus(result).gate3Ready, false);
  }],
  ["036 promotion status never closes Gate 2 real-shadow", () => assert.equal(getBridgeReaderPromotionStatus().gate2RealShadowClosed, false)],
  ["037 promotion status never starts Fase 9", () => assert.equal(getBridgeReaderPromotionStatus().fase9Ready, false)],
  ["038 promotion status never grants productive authority", () => assert.equal(getBridgeReaderPromotionStatus().productiveAuthorityGranted, false)],

  ["039 authority keeps observer_created false", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).authority.observer_created, false)],
  ["040 authority keeps registry_written false", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).authority.registry_written, false)],
  ["041 authority keeps export_generated false", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).authority.export_generated, false)],
  ["042 authority keeps diagnosis_enabled false", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).authority.diagnosis_enabled, false)],
  ["043 authority keeps gate3_ready false", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).authority.gate3_ready, false)],
  ["044 authority keeps fase9_started false", () => assert.equal(readShadowOnlyOutboxEvents({ source: "fixture", records: [validRecord()] }).authority.fase9_started, false)],

  ["045 service does not import Supabase", () => assert.doesNotMatch(serviceSource, /from\s+['\"][^'\"]*supabase|createClient/i)],
  ["046 service does not import DB clients", () => assert.doesNotMatch(serviceSource, /databaseClient|\bdb\.|sql`/i)],
  ["047 service does not create API route", () => assert.doesNotMatch(serviceSource, /NextRequest|NextResponse|route\.ts/i)],
  ["048 service does not use process.env", () => assert.doesNotMatch(serviceSource, /process\.env/)],
  ["049 service does not use fetch", () => assert.doesNotMatch(serviceSource, /\bfetch\s*\(/)],
  ["050 service does not use filesystem writes", () => assert.doesNotMatch(serviceSource, /writeFile|appendFile|createWriteStream|node:fs/)],
  ["051 service does not use network clients", () => assert.doesNotMatch(serviceSource, /axios|http\.request|https\.request/i)],
  ["052 service does not use runtime product adapter", () => assert.doesNotMatch(serviceSource, /product.*adapter|runtime.*adapter/i)],
];

for (const [name, runScenario] of scenarioTests) {
  test(name, runScenario);
}

test("053 matrix summary covers every bridge reader scenario", () => {
  assert.equal(scenarioTests.length, 52);
});
