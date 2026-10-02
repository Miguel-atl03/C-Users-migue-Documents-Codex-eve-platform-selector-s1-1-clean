import { readShadowOnlyOutboxEvents } from "./eve-organism-gate2-real-shadow-bridge-reader.ts";

import type {
  BridgeReaderResult,
  ShadowOnlyOutboxEventRecord,
} from "../types/eve-organism-gate2-real-shadow-bridge-reader.ts";
import type {
  NonProductiveBridgeReaderRealSourceAdapterContract,
  RealSourceAdapterBridgeReaderInput,
  RealSourceAdapterNoGoCode,
  RealSourceAdapterNoGoFinding,
  RealSourceAdapterReadiness,
  RealSourceAdapterResult,
  RealSourceAdapterValidationResult,
  ShadowOnlyOutboxEventsSourceRecord,
} from "../types/eve-organism-bridge-reader-real-source-adapter.ts";

const CONTRACT: NonProductiveBridgeReaderRealSourceAdapterContract = {
  adapterName: "NonProductiveBridgeReaderRealSourceAdapter",
  sourceName: "shadow_only_outbox_events",
  sourceKind: "shadow_outbox",
  mode: "NON_PRODUCTIVE_REAL_SOURCE_READ_ONLY",
  readOnly: true,
  shadowOnly: true,
  writesAllowed: false,
  observerRequired: false,
  gate3Required: false,
  fase9Required: false,
  registryWriteAllowed: false,
  exportAllowed: false,
  diagnosisAllowed: false,
  dbWriteAllowed: false,
  productiveAuthorityGranted: false,
  migrationFileAvailable: true,
  migrationExecuted: false,
  requiresAppliedDbSchema: false,
  sourceConnected: false,
  realTableRead: false,
  localInMemoryRecordsOnly: true,
};

const ADAPTER_AUTHORITY_FALSE = {
  gate2_real_shadow_closed: false,
  gate3_ready: false,
  fase9_started: false,
  observer_created: false,
  registry_written: false,
  export_generated: false,
  diagnosis_enabled: false,
  source_connected: false,
  real_table_read: false,
  migration_executed: false,
} as const;

export function getNonProductiveBridgeReaderRealSourceAdapterContract():
  NonProductiveBridgeReaderRealSourceAdapterContract {
  return { ...CONTRACT };
}

export function validateRealSourceRecord(
  record: ShadowOnlyOutboxEventsSourceRecord,
): RealSourceAdapterValidationResult {
  const findings = evaluateRecordNoGo(record);
  const ok = findings.length === 0;
  const gaps = findings.map(gapForFinding);
  return {
    ok,
    gaps,
    noGoFindings: findings,
    acceptedRecords: ok ? [cloneRecord(record)] : [],
    rejectedRecords: ok
      ? []
      : [
          {
            recordId: record.eventId,
            record: cloneRecord(record),
            findings,
          },
        ],
    sourceReadiness: ok ? "ready_for_non_productive_bridge_reader_input" : readinessForFindings(findings),
  };
}

export function mapToShadowOnlyOutboxEventRecord(
  record: ShadowOnlyOutboxEventsSourceRecord,
): ShadowOnlyOutboxEventRecord {
  const validation = validateRealSourceRecord(record);
  if (!validation.ok) {
    throw new Error(validation.gaps[0] ?? "real_source_record_invalid");
  }
  return {
    eventId: record.eventId,
    tenantId: record.tenantId,
    sessionId: record.sessionId,
    activityId: record.activityId,
    correlationId: record.correlationId,
    idempotencyKey: record.idempotencyKey,
    sourceRef: record.sourceRef,
    provenance: record.provenance,
    occurredAt: record.occurredAt,
    eventType: record.eventType,
    payload: cloneValue(record.payload),
    officialOutcome: cloneValue(record.officialOutcome),
    shadowOutcome: cloneValue(record.shadowOutcome),
    replayId: record.replayId,
    traceId: record.traceId,
    schemaVersion: record.schemaVersion,
    producer: record.producer,
    checksum: record.checksum,
    noGoFlags: [...(record.noGoFlags ?? [])],
    evidenceRefs: [...(record.evidenceRefs ?? [])],
    registryWrite: false,
    exportGenerated: false,
    diagnosisEnabled: false,
    gate3Ready: false,
    fase9Started: false,
    productiveWrite: false,
  };
}

export function getRealSourceAdapterReadiness(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): RealSourceAdapterReadiness {
  return validateRecords(records).sourceReadiness;
}

export function produceBridgeReaderInput(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): RealSourceAdapterBridgeReaderInput {
  const validation = validateRecords(records);
  return {
    source: "shadow_only_outbox_events",
    records: validation.acceptedRecords.map(mapToShadowOnlyOutboxEventRecord),
    allowCrossTenantBatch: false,
    requireCompleteComparison: true,
  };
}

export function evaluateRealSourceAdapterNoGo(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): RealSourceAdapterNoGoFinding[] {
  return validateRecords(records).noGoFindings;
}

export function adaptRealSourceRecordsForBridgeReader(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): RealSourceAdapterBridgeReaderInput {
  return produceBridgeReaderInput(records);
}

export function runBridgeReaderWithRealSourceAdapter(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): BridgeReaderResult {
  return readShadowOnlyOutboxEvents(produceBridgeReaderInput(records));
}

export function adaptRealSourceRecordsForBridgeReaderWithResult(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): RealSourceAdapterResult {
  const validation = validateRecords(records);
  const bridgeReaderInput = produceBridgeReaderInput(records);
  const bridgeReaderResult = readShadowOnlyOutboxEvents(bridgeReaderInput);
  return {
    contract: getNonProductiveBridgeReaderRealSourceAdapterContract(),
    validation,
    bridgeReaderInput,
    bridgeReaderResult,
    authority: { ...ADAPTER_AUTHORITY_FALSE },
  };
}

function validateRecords(
  records: readonly ShadowOnlyOutboxEventsSourceRecord[],
): RealSourceAdapterValidationResult {
  const acceptedRecords: ShadowOnlyOutboxEventsSourceRecord[] = [];
  const rejectedRecords: RealSourceAdapterValidationResult["rejectedRecords"] = [];
  const noGoFindings: RealSourceAdapterNoGoFinding[] = [];
  const tenantIds = new Set<string>();
  const replayKeys = new Map<string, string>();

  for (const record of records) {
    const recordFindings = evaluateRecordNoGo(record);
    if (record.tenantId) tenantIds.add(record.tenantId);
    if (record.tenantId && record.idempotencyKey && record.sourceRef) {
      const key = [record.tenantId, record.idempotencyKey, record.sourceRef].join("::");
      const payloadHash = stableStringify(record.payload);
      const prior = replayKeys.get(key);
      if (prior && prior !== payloadHash) {
        recordFindings.push(finding("REPLAY_POISONING_RISK", record, "Same idempotency/source boundary has conflicting payload."));
      }
      replayKeys.set(key, payloadHash);
    }
    if (recordFindings.length === 0) {
      acceptedRecords.push(cloneRecord(record));
    } else {
      rejectedRecords.push({ recordId: record.eventId, record: cloneRecord(record), findings: recordFindings });
      noGoFindings.push(...recordFindings);
    }
  }

  if (tenantIds.size > 1) {
    const tenantFinding = finding("TENANT_MIX_NOT_ALLOWED", undefined, "Multiple tenants are not allowed in one adapter batch.");
    noGoFindings.push(tenantFinding);
  }

  const gaps = Array.from(new Set(noGoFindings.map(gapForFinding)));
  return {
    ok: noGoFindings.length === 0,
    gaps,
    noGoFindings,
    acceptedRecords: noGoFindings.length === 0 ? acceptedRecords : [],
    rejectedRecords,
    sourceReadiness:
      noGoFindings.length === 0 ? "ready_for_non_productive_bridge_reader_input" : readinessForFindings(noGoFindings),
  };
}

function evaluateRecordNoGo(record: ShadowOnlyOutboxEventsSourceRecord): RealSourceAdapterNoGoFinding[] {
  const findings: RealSourceAdapterNoGoFinding[] = [];
  const add = (code: RealSourceAdapterNoGoCode, message: string) => findings.push(finding(code, record, message));

  if (record.sourceKind && record.sourceKind !== "shadow_outbox") add("SOURCE_NOT_SHADOW_ONLY", "Source must be shadow-only.");
  if (record.sourceReadMode === "write" || record.sourceReadMode === "mutation" || record.sourceReadMode === "productive") {
    add("SOURCE_REQUIRES_WRITE_CAPABILITY", "Source read mode must be local/read-only.");
  }
  if (record.observerRequired === true) add("SOURCE_REQUIRES_OBSERVER", "Observer dependency is forbidden.");
  if (record.gate3Ready === true) add("SOURCE_REQUIRES_GATE3", "Gate 3 dependency is forbidden.");
  if (record.fase9Started === true) add("SOURCE_REQUIRES_FASE9", "Fase 9 dependency is forbidden.");
  if (!record.tenantId || !record.sessionId || !record.activityId) add("MISSING_TENANT_SESSION_ACTIVITY", "tenantId/sessionId/activityId are required.");
  if (!record.correlationId) add("MISSING_CORRELATION_ID", "correlationId is required.");
  if (!record.idempotencyKey) add("MISSING_IDEMPOTENCY_KEY", "idempotencyKey is required.");
  if (!record.provenance || !record.sourceRef) add("MISSING_PROVENANCE_OR_SOURCE_REF", "provenance and sourceRef are required.");
  if (!isValidDateLike(record.occurredAt)) add("MISSING_OCCURRED_AT", "occurredAt must be a valid timestamp.");
  if (record.officialOutcome === undefined || record.officialOutcome === null) add("MISSING_OFFICIAL_OUTCOME", "officialOutcome is required.");
  if (record.shadowOutcome === undefined || record.shadowOutcome === null) add("MISSING_SHADOW_OUTCOME", "shadowOutcome is required and cannot be derived.");
  if (record.shadowOutcome !== undefined && record.shadowOutcome !== null && !hasShadowOutcomeMetadata(record)) {
    add("MISSING_SHADOW_OUTCOME_METADATA", "shadowOutcome metadata is required when shadowOutcome is present.");
  }
  if (record.shadowOutcomeProducer && record.shadowOutcomeProducer !== "EVE_SHADOW_NON_PRODUCTIVE") {
    add("UNAUTHORIZED_SHADOW_OUTCOME_PRODUCER", "shadowOutcomeProducer must be EVE_SHADOW_NON_PRODUCTIVE.");
  }
  if (record.registryWrite === true) add("REGISTRY_WRITE_TRUE", "Registry writing is forbidden.");
  if (record.exportGenerated === true) add("EXPORT_GENERATED_TRUE", "Export generation is forbidden.");
  if (record.diagnosisEnabled === true) add("DIAGNOSIS_ENABLED_TRUE", "Diagnosis generation is forbidden.");
  if (record.productiveWrite === true) add("PRODUCTIVE_WRITE_TRUE", "Productive writes are forbidden.");
  if (record.staleOfficialOutcome === true) add("STALE_OFFICIAL_OUTCOME", "Stale official outcome is forbidden.");
  if (record.auditSourceTamperingRisk === true) add("AUDIT_SOURCE_TAMPERING_RISK", "Audit/source tampering risk is forbidden.");
  if (CONTRACT.writesAllowed !== false) add("ADAPTER_WRITE_CAPABLE", "Adapter must remain write-disabled.");
  if (record.appUiDependency === true) add("APP_UI_DEPENDENCY", "App/UI dependency is forbidden.");
  if (record.runtimeProductiveDependency === true) add("RUNTIME_PRODUCTIVE_DEPENDENCY", "Productive runtime dependency is forbidden.");
  if (record.requiresDb === true || record.requiresSupabase === true) add("DB_SUPABASE_DEPENDENCY", "DB/Supabase dependency is forbidden.");
  if (record.promotionAuthority === true) add("PROMOTION_AUTHORITY_CONTAMINATION", "Promotion authority contamination is forbidden.");

  return findings;
}

function hasShadowOutcomeMetadata(record: ShadowOnlyOutboxEventsSourceRecord): boolean {
  return Boolean(
    record.shadowOutcomeProvenance &&
      record.shadowOutcomeSchemaVersion &&
      isValidDateLike(record.shadowOutcomeGeneratedAt) &&
      record.shadowOutcomeProducer === "EVE_SHADOW_NON_PRODUCTIVE" &&
      record.shadowOutcomeChecksum,
  );
}

function readinessForFindings(findings: readonly RealSourceAdapterNoGoFinding[]): RealSourceAdapterReadiness {
  if (findings.some((item) => item.code === "MISSING_SHADOW_OUTCOME")) return "blocked_by_missing_shadow_outcome";
  if (findings.some((item) => item.code === "MISSING_OFFICIAL_OUTCOME")) return "blocked_by_missing_official_outcome";
  if (findings.some((item) => item.code === "MISSING_SHADOW_OUTCOME_METADATA")) return "blocked_by_missing_shadow_outcome_metadata";
  if (findings.some((item) => item.code === "SOURCE_REQUIRES_WRITE_CAPABILITY" || item.code === "PRODUCTIVE_WRITE_TRUE")) {
    return "blocked_by_write_risk";
  }
  if (findings.some((item) => item.code === "SOURCE_REQUIRES_OBSERVER")) return "blocked_by_observer_dependency";
  if (findings.some((item) => item.code === "SOURCE_REQUIRES_GATE3" || item.code === "SOURCE_REQUIRES_FASE9")) {
    return "blocked_by_gate3_or_fase9_dependency";
  }
  if (findings.some((item) => item.code === "REGISTRY_WRITE_TRUE" || item.code === "EXPORT_GENERATED_TRUE" || item.code === "DIAGNOSIS_ENABLED_TRUE")) {
    return "blocked_by_registry_export_diagnosis_dependency";
  }
  return "blocked_by_missing_required_context";
}

function gapForFinding(findingItem: RealSourceAdapterNoGoFinding): string {
  return findingItem.code.toLowerCase();
}

function finding(
  code: RealSourceAdapterNoGoCode,
  record: ShadowOnlyOutboxEventsSourceRecord | undefined,
  message: string,
): RealSourceAdapterNoGoFinding {
  return {
    code,
    recordId: record?.eventId,
    message,
    blocksBridgeReader: true,
    blocksPromotion: true,
  };
}

function isValidDateLike(item: string | undefined): boolean {
  return typeof item === "string" && item.trim().length > 0 && !Number.isNaN(Date.parse(item));
}

function cloneRecord(record: ShadowOnlyOutboxEventsSourceRecord): ShadowOnlyOutboxEventsSourceRecord {
  return cloneValue(record);
}

function cloneValue<T>(item: T): T {
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
