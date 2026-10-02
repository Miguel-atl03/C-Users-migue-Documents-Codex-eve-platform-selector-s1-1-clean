import type {
  BridgeReaderResult,
  ShadowOnlyOutboxEventRecord,
} from "./eve-organism-gate2-real-shadow-bridge-reader.ts";

export type RealSourceAdapterReadiness =
  | "ready_for_non_productive_bridge_reader_input"
  | "ready_with_gaps"
  | "blocked_by_missing_required_context"
  | "blocked_by_write_risk"
  | "blocked_by_observer_dependency"
  | "blocked_by_gate3_or_fase9_dependency"
  | "blocked_by_registry_export_diagnosis_dependency"
  | "blocked_by_missing_shadow_outcome"
  | "blocked_by_missing_official_outcome"
  | "blocked_by_missing_shadow_outcome_metadata";

export type RealSourceAdapterNoGoCode =
  | "SOURCE_NOT_SHADOW_ONLY"
  | "SOURCE_REQUIRES_WRITE_CAPABILITY"
  | "SOURCE_REQUIRES_OBSERVER"
  | "SOURCE_REQUIRES_GATE3"
  | "SOURCE_REQUIRES_FASE9"
  | "MISSING_TENANT_SESSION_ACTIVITY"
  | "MISSING_CORRELATION_ID"
  | "MISSING_IDEMPOTENCY_KEY"
  | "MISSING_PROVENANCE_OR_SOURCE_REF"
  | "MISSING_OCCURRED_AT"
  | "MISSING_OFFICIAL_OUTCOME"
  | "MISSING_SHADOW_OUTCOME"
  | "MISSING_SHADOW_OUTCOME_METADATA"
  | "UNAUTHORIZED_SHADOW_OUTCOME_PRODUCER"
  | "REGISTRY_WRITE_TRUE"
  | "EXPORT_GENERATED_TRUE"
  | "DIAGNOSIS_ENABLED_TRUE"
  | "PRODUCTIVE_WRITE_TRUE"
  | "TENANT_MIX_NOT_ALLOWED"
  | "REPLAY_POISONING_RISK"
  | "STALE_OFFICIAL_OUTCOME"
  | "AUDIT_SOURCE_TAMPERING_RISK"
  | "ADAPTER_WRITE_CAPABLE"
  | "APP_UI_DEPENDENCY"
  | "RUNTIME_PRODUCTIVE_DEPENDENCY"
  | "DB_SUPABASE_DEPENDENCY"
  | "PROMOTION_AUTHORITY_CONTAMINATION";

export interface NonProductiveBridgeReaderRealSourceAdapterContract {
  adapterName: "NonProductiveBridgeReaderRealSourceAdapter";
  sourceName: "shadow_only_outbox_events";
  sourceKind: "shadow_outbox";
  mode: "NON_PRODUCTIVE_REAL_SOURCE_READ_ONLY";
  readOnly: true;
  shadowOnly: true;
  writesAllowed: false;
  observerRequired: false;
  gate3Required: false;
  fase9Required: false;
  registryWriteAllowed: false;
  exportAllowed: false;
  diagnosisAllowed: false;
  dbWriteAllowed: false;
  productiveAuthorityGranted: false;
  migrationFileAvailable: true;
  migrationExecuted: false;
  requiresAppliedDbSchema: false;
  sourceConnected: false;
  realTableRead: false;
  localInMemoryRecordsOnly: true;
}

export interface ShadowOnlyOutboxEventsSourceRecord {
  eventId?: string;
  tenantId?: string;
  sessionId?: string;
  activityId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  sourceRef?: string;
  provenance?: string;
  occurredAt?: string;
  eventType?: string;
  payload?: unknown;
  officialOutcome?: unknown;
  shadowOutcome?: unknown;
  replayId?: string;
  traceId?: string;
  schemaVersion?: string;
  producer?: string;
  checksum?: string;
  noGoFlags?: string[];
  evidenceRefs?: string[];
  sourceCreatedAt?: string;
  sourceSequence?: string | number;
  sourcePartition?: string;
  sourceTenantBoundary?: string;
  sourceReadMode?: "read" | "read_only" | "local_memory" | "write" | "mutation" | "productive";
  shadowOutcomeProvenance?: unknown;
  shadowOutcomeSchemaVersion?: string;
  shadowOutcomeGeneratedAt?: string;
  shadowOutcomeProducer?: string;
  shadowOutcomeChecksum?: string;
  shadowOutcomeEvidenceRefs?: unknown[];
  shadowOutcomeNoGoFlags?: string[];
  shadowOutcomeReadiness?: string;
  shadowOutcomeSourceRef?: string;
  registryWrite?: boolean;
  exportGenerated?: boolean;
  diagnosisEnabled?: boolean;
  productiveWrite?: boolean;
  gate3Ready?: boolean;
  fase9Started?: boolean;
  observerRequired?: boolean;
  sourceKind?: string;
  requiresDb?: boolean;
  requiresSupabase?: boolean;
  appUiDependency?: boolean;
  runtimeProductiveDependency?: boolean;
  promotionAuthority?: boolean;
  auditSourceTamperingRisk?: boolean;
  staleOfficialOutcome?: boolean;
}

export interface RealSourceAdapterNoGoFinding {
  code: RealSourceAdapterNoGoCode;
  recordId?: string;
  message: string;
  blocksBridgeReader: true;
  blocksPromotion: true;
}

export interface RealSourceAdapterValidationResult {
  ok: boolean;
  gaps: string[];
  noGoFindings: RealSourceAdapterNoGoFinding[];
  acceptedRecords: ShadowOnlyOutboxEventsSourceRecord[];
  rejectedRecords: Array<{
    recordId?: string;
    record: ShadowOnlyOutboxEventsSourceRecord;
    findings: RealSourceAdapterNoGoFinding[];
  }>;
  sourceReadiness: RealSourceAdapterReadiness;
}

export interface RealSourceAdapterBridgeReaderInput {
  source: "shadow_only_outbox_events";
  records: ShadowOnlyOutboxEventRecord[];
  allowCrossTenantBatch?: boolean;
  requireCompleteComparison?: boolean;
  generatedAt?: string;
}

export interface RealSourceAdapterResult {
  contract: NonProductiveBridgeReaderRealSourceAdapterContract;
  validation: RealSourceAdapterValidationResult;
  bridgeReaderInput: RealSourceAdapterBridgeReaderInput;
  bridgeReaderResult: BridgeReaderResult;
  authority: {
    gate2_real_shadow_closed: false;
    gate3_ready: false;
    fase9_started: false;
    observer_created: false;
    registry_written: false;
    export_generated: false;
    diagnosis_enabled: false;
    source_connected: false;
    real_table_read: false;
    migration_executed: false;
  };
}
