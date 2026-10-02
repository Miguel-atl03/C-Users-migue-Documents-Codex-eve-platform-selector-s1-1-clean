import type {
  BridgeReaderAuthority,
  BridgeReaderNoGoCode,
  BridgeReaderNoGoFinding,
  BridgeReaderPromotionStatus,
  BridgeReaderSource,
  NormalizedShadowOnlyOutboxEventRecord,
  ReadShadowOnlyOutboxEventsInput,
  RejectedBridgeReaderRecord,
  ShadowDivergence,
  ShadowDivergenceReport,
  ShadowEventValidationResult,
  ShadowOnlyOutboxEventRecord,
  ShadowOutboxReaderContract,
  BridgeReaderResult,
} from "../types/eve-organism-gate2-real-shadow-bridge-reader.ts";

export const REQUIRED_READ_FIELDS = [
  "outbox_event_id",
  "tenant_id",
  "session_id",
  "activity_id",
  "actor_ref",
  "source_event_id",
  "source_system",
  "source_environment",
  "source_locator",
  "real_client_intent",
  "real_tenant_context",
  "real_session_context",
  "real_activity_context",
  "real_runtime_event",
  "real_evidence_signal",
  "official_outcome",
  "provenance",
  "source_trace",
  "correlation_id",
  "idempotency_key",
  "official_flow_ref",
  "redaction_status",
  "data_minimization_attestation",
  "payload_hash",
  "checksum_chain_ref",
  "replay_ref",
  "event_status",
  "schema_version",
  "contract_version",
] as const;

const ALLOWED_SOURCES: readonly BridgeReaderSource[] = [
  "shadow_only_outbox_events",
  "fixture",
  "local_memory",
];

const AUTHORITY_FALSE: BridgeReaderAuthority = {
  runtime_connected: false,
  shadow_activated: false,
  observer_created: false,
  observer_authorized: false,
  real_observation_authorized: false,
  read_only_observer_authorized: false,
  registry_written: false,
  export_generated: false,
  diagnosis_enabled: false,
  db_written: false,
  ui_touched: false,
  gate3_ready: false,
  fase9_started: false,
  productive_brain_connection: false,
};

export function getGate2RealShadowBridgeReaderContract(
  source: BridgeReaderSource = "shadow_only_outbox_events",
): ShadowOutboxReaderContract {
  return {
    source,
    mode: "NON_PRODUCTIVE_READ_ONLY",
    readOnly: true,
    shadowOnly: true,
    productiveWritesAllowed: false,
    registryWriteAllowed: false,
    exportAllowed: false,
    diagnosisAllowed: false,
    gate3Allowed: false,
    fase9Allowed: false,
    requiredReadFields: REQUIRED_READ_FIELDS,
    requiredReadFieldsTotal: 29,
  };
}

export function validateShadowOnlyOutboxEvent(
  record: ShadowOnlyOutboxEventRecord,
): ShadowEventValidationResult {
  const recordId = value(record.eventId, record.outbox_event_id, record.event_id);
  const findings: BridgeReaderNoGoFinding[] = [];
  const add = (code: BridgeReaderNoGoCode, message: string) => {
    findings.push({ code, recordId, message, blocksPromotion: true });
  };

  const tenantId = value(record.tenantId, record.tenant_id);
  const sessionId = value(record.sessionId, record.session_id);
  const activityId = value(record.activityId, record.activity_id);
  const correlationId = value(record.correlationId, record.correlation_id);
  const idempotencyKey = value(record.idempotencyKey, record.idempotency_key);
  const sourceRef = value(record.sourceRef, record.official_flow_ref, record.source_locator);
  const occurredAt = value(record.occurredAt, record.captured_at, record.emitted_at);
  const officialOutcome = record.officialOutcome ?? record.official_outcome;
  const shadowOutcome = record.shadowOutcome;

  if (!tenantId) add("MISSING_TENANT_ID", "tenantId is required for shadow-only bridge reader records.");
  if (!sessionId) add("MISSING_SESSION_ID", "sessionId is required for shadow-only bridge reader records.");
  if (!activityId) add("MISSING_ACTIVITY_ID", "activityId is required for shadow-only bridge reader records.");
  if (!correlationId) add("MISSING_CORRELATION_ID", "correlationId is required for deterministic comparison.");
  if (!idempotencyKey) add("MISSING_IDEMPOTENCY_KEY", "idempotencyKey is required for dedupe and replay safety.");
  if (!sourceRef) add("MISSING_SOURCE_REF", "sourceRef or official_flow_ref is required.");
  if (!record.provenance) add("MISSING_PROVENANCE", "provenance is required.");
  if (!isValidDateLike(occurredAt)) add("INVALID_OCCURRED_AT", "occurredAt must be a valid timestamp.");
  if (officialOutcome === undefined || officialOutcome === null) add("MISSING_OFFICIAL_OUTCOME", "officialOutcome is required.");
  if (shadowOutcome === undefined || shadowOutcome === null) add("MISSING_SHADOW_OUTCOME", "shadowOutcome is required.");
  if (record.registryWrite === true) add("REGISTRY_WRITE_ATTEMPT", "registry write authority is forbidden.");
  if (record.exportGenerated === true) add("EXPORT_ATTEMPT", "export generation is forbidden.");
  if (record.diagnosisEnabled === true) add("DIAGNOSIS_ATTEMPT", "diagnosis authority is forbidden.");
  if (record.gate3Ready === true) add("GATE3_AUTHORITY_ATTEMPT", "Gate 3 authority is forbidden.");
  if (record.fase9Started === true) add("FASE9_AUTHORITY_ATTEMPT", "Fase 9 authority is forbidden.");
  if (record.productiveWrite === true) add("PRODUCTIVE_WRITE_ATTEMPT", "productive writes are forbidden.");

  if (findings.length > 0) {
    return { accepted: false, findings };
  }

  return {
    accepted: true,
    record: {
      eventId: recordId ?? sourceRef ?? "",
      tenantId: tenantId || "",
      sessionId: sessionId || "",
      activityId: activityId || "",
      correlationId: correlationId || "",
      idempotencyKey: idempotencyKey || "",
      sourceRef: sourceRef || "",
      provenance: record.provenance || "",
      occurredAt: occurredAt || "",
      eventType: record.eventType ?? record.event_status,
      payload: copyValue(record.payload),
      officialOutcome: copyValue(officialOutcome),
      shadowOutcome: copyValue(shadowOutcome),
      replayId: value(record.replayId, record.replay_ref),
      traceId: value(record.traceId, record.source_trace),
      schemaVersion: value(record.schemaVersion, record.schema_version),
      producer: record.producer,
      checksum: value(record.checksum, record.checksum_chain_ref, record.payload_hash),
      noGoFlags: [...(record.noGoFlags ?? [])],
      evidenceRefs: [...(record.evidenceRefs ?? [])],
    },
    findings: [],
  };
}

export function readShadowOnlyOutboxEvents(input: ReadShadowOnlyOutboxEventsInput): BridgeReaderResult {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const noGoFindings: BridgeReaderNoGoFinding[] = [];
  const rejectedRecords: RejectedBridgeReaderRecord[] = [];
  const acceptedRecords: NormalizedShadowOnlyOutboxEventRecord[] = [];
  const gaps: string[] = [];

  if (!ALLOWED_SOURCES.includes(input.source)) {
    noGoFindings.push({
      code: "INVALID_SOURCE",
      message: "Bridge reader source must be shadow_only_outbox_events, fixture or local_memory.",
      blocksPromotion: true,
    });
  }

  for (const originalRecord of input.records) {
    const validation = validateShadowOnlyOutboxEvent(originalRecord);
    if (validation.accepted && validation.record) {
      acceptedRecords.push(validation.record);
    } else {
      rejectedRecords.push({
        recordId: value(originalRecord.eventId, originalRecord.outbox_event_id, originalRecord.event_id),
        reasons: validation.findings,
        record: { ...originalRecord },
      });
      noGoFindings.push(...validation.findings);
    }
  }

  const duplicateFindings = detectDuplicateIdempotency(acceptedRecords);
  noGoFindings.push(...duplicateFindings);
  if (duplicateFindings.length > 0) gaps.push("duplicate_idempotency_key_detected");

  const tenantFindings = detectTenantMixing(acceptedRecords, input.allowCrossTenantBatch === true);
  noGoFindings.push(...tenantFindings);
  if (tenantFindings.length > 0) gaps.push("tenant_mixing_detected");

  const completeComparisonFindings =
    input.requireCompleteComparison === false ? [] : detectComparisonGaps(acceptedRecords);
  noGoFindings.push(...completeComparisonFindings);
  if (completeComparisonFindings.length > 0) gaps.push("comparison_outcome_missing");

  const divergenceReport = buildShadowDivergenceReport(acceptedRecords, {
    generatedAt,
    noGoDetected: noGoFindings.length > 0,
    allowCrossTenantBatch: input.allowCrossTenantBatch === true,
  });

  return {
    ok: noGoFindings.length === 0,
    mode: "NON_PRODUCTIVE_READ_ONLY",
    recordsRead: input.records.length,
    recordsAccepted: acceptedRecords.length,
    recordsRejected: rejectedRecords.length,
    rejectedRecords,
    acceptedRecords,
    gaps,
    noGoFindings,
    divergenceReport,
    authority: { ...AUTHORITY_FALSE },
    generatedAt,
  };
}

export function buildShadowDivergenceReport(
  records: readonly NormalizedShadowOnlyOutboxEventRecord[],
  options: { generatedAt?: string; noGoDetected?: boolean; allowCrossTenantBatch?: boolean } = {},
): ShadowDivergenceReport {
  const divergences: ShadowDivergence[] = [];
  let equalOutcomes = 0;
  let missingOfficialOutcome = 0;
  let missingShadowOutcome = 0;

  for (const record of records) {
    if (record.officialOutcome === undefined || record.officialOutcome === null) {
      missingOfficialOutcome += 1;
      continue;
    }
    if (record.shadowOutcome === undefined || record.shadowOutcome === null) {
      missingShadowOutcome += 1;
      continue;
    }
    if (stableStringify(record.officialOutcome) === stableStringify(record.shadowOutcome)) {
      equalOutcomes += 1;
    } else {
      divergences.push({
        eventId: record.eventId,
        tenantId: record.tenantId,
        correlationId: record.correlationId,
        idempotencyKey: record.idempotencyKey,
        officialOutcome: copyValue(record.officialOutcome),
        shadowOutcome: copyValue(record.shadowOutcome),
      });
    }
  }

  const tenantCount = new Set(records.map((record) => record.tenantId)).size;
  const tenantIsolationStatus =
    tenantCount <= 1
      ? "SINGLE_TENANT"
      : options.allowCrossTenantBatch === true
        ? "CROSS_TENANT_BATCH_ALLOWED"
        : "TENANT_MIXING_NO_GO";

  return {
    reportId: `shadow-divergence-${records.length}-${divergences.length}`,
    mode: "NON_PRODUCTIVE_READ_ONLY",
    totalCompared: records.length,
    equalOutcomes,
    divergentOutcomes: divergences.length,
    missingOfficialOutcome,
    missingShadowOutcome,
    divergences,
    reproducibility: {
      deterministicFromAcceptedRecords: true,
      replayRefs: records.map((record) => record.replayId).filter((item): item is string => Boolean(item)),
    },
    tenantIsolationStatus,
    noGoStatus: options.noGoDetected === true ? "NO_GO_DETECTED" : "CLEAR",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
}

export function evaluateBridgeReaderNoGo(
  records: readonly ShadowOnlyOutboxEventRecord[],
  source: BridgeReaderSource = "local_memory",
): BridgeReaderNoGoFinding[] {
  return readShadowOnlyOutboxEvents({ source, records }).noGoFindings;
}

export function getBridgeReaderPromotionStatus(
  _result?: BridgeReaderResult,
): BridgeReaderPromotionStatus {
  return {
    gate2RealShadowClosed: false,
    gate3Ready: false,
    fase9Ready: false,
    productiveAuthorityGranted: false,
    reason: "NON_PRODUCTIVE_BRIDGE_READER_DOES_NOT_GRANT_PROMOTION",
  };
}

function detectDuplicateIdempotency(
  records: readonly NormalizedShadowOnlyOutboxEventRecord[],
): BridgeReaderNoGoFinding[] {
  const seen = new Set<string>();
  const findings: BridgeReaderNoGoFinding[] = [];
  for (const record of records) {
    const key = [
      record.tenantId,
      record.sessionId,
      record.activityId,
      record.correlationId,
      record.idempotencyKey,
    ].join("::");
    if (seen.has(key)) {
      findings.push({
        code: "DUPLICATE_IDEMPOTENCY_KEY",
        recordId: record.eventId,
        message: "Duplicate idempotencyKey detected inside the same tenant/session/activity/correlation boundary.",
        blocksPromotion: true,
      });
    }
    seen.add(key);
  }
  return findings;
}

function detectTenantMixing(
  records: readonly NormalizedShadowOnlyOutboxEventRecord[],
  allowCrossTenantBatch: boolean,
): BridgeReaderNoGoFinding[] {
  if (allowCrossTenantBatch || new Set(records.map((record) => record.tenantId)).size <= 1) {
    return [];
  }
  return [
    {
      code: "TENANT_MIXING_DETECTED",
      message: "Multiple tenants were read in a batch that requires tenant isolation.",
      blocksPromotion: true,
    },
  ];
}

function detectComparisonGaps(
  records: readonly NormalizedShadowOnlyOutboxEventRecord[],
): BridgeReaderNoGoFinding[] {
  const findings: BridgeReaderNoGoFinding[] = [];
  for (const record of records) {
    if (record.officialOutcome === undefined || record.officialOutcome === null) {
      findings.push({
        code: "MISSING_OFFICIAL_OUTCOME",
        recordId: record.eventId,
        message: "officialOutcome is required for complete comparison.",
        blocksPromotion: true,
      });
    }
    if (record.shadowOutcome === undefined || record.shadowOutcome === null) {
      findings.push({
        code: "MISSING_SHADOW_OUTCOME",
        recordId: record.eventId,
        message: "shadowOutcome is required for complete comparison.",
        blocksPromotion: true,
      });
    }
  }
  return findings;
}

function value(...items: Array<unknown>): string | undefined {
  for (const item of items) {
    if (typeof item === "string" && item.trim().length > 0) return item;
  }
  return undefined;
}

function isValidDateLike(item: string | undefined): boolean {
  return typeof item === "string" && item.trim().length > 0 && !Number.isNaN(Date.parse(item));
}

function copyValue<T>(item: T): T {
  if (item === undefined || item === null) return item;
  return JSON.parse(JSON.stringify(item)) as T;
}

function stableStringify(item: unknown): string {
  if (item === null || typeof item !== "object") return JSON.stringify(item);
  if (Array.isArray(item)) return `[${item.map(stableStringify).join(",")}]`;
  const object = item as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(",")}}`;
}
