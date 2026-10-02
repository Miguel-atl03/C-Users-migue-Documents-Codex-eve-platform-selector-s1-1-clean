export type BridgeReaderSource = "shadow_only_outbox_events" | "fixture" | "local_memory";

export type BridgeReaderMode = "NON_PRODUCTIVE_READ_ONLY";

export type BridgeReaderNoGoCode =
  | "MISSING_TENANT_ID"
  | "MISSING_SESSION_ID"
  | "MISSING_ACTIVITY_ID"
  | "MISSING_CORRELATION_ID"
  | "MISSING_IDEMPOTENCY_KEY"
  | "MISSING_SOURCE_REF"
  | "MISSING_PROVENANCE"
  | "INVALID_OCCURRED_AT"
  | "DUPLICATE_IDEMPOTENCY_KEY"
  | "TENANT_MIXING_DETECTED"
  | "MISSING_OFFICIAL_OUTCOME"
  | "MISSING_SHADOW_OUTCOME"
  | "INVALID_SOURCE"
  | "REGISTRY_WRITE_ATTEMPT"
  | "EXPORT_ATTEMPT"
  | "DIAGNOSIS_ATTEMPT"
  | "GATE3_AUTHORITY_ATTEMPT"
  | "FASE9_AUTHORITY_ATTEMPT"
  | "PRODUCTIVE_WRITE_ATTEMPT";

export interface ShadowOutboxReaderContract {
  source: BridgeReaderSource;
  mode: BridgeReaderMode;
  readOnly: true;
  shadowOnly: true;
  productiveWritesAllowed: false;
  registryWriteAllowed: false;
  exportAllowed: false;
  diagnosisAllowed: false;
  gate3Allowed: false;
  fase9Allowed: false;
  requiredReadFields: readonly string[];
  requiredReadFieldsTotal: 29;
}

export interface BridgeReaderAuthority {
  runtime_connected: false;
  shadow_activated: false;
  observer_created: false;
  observer_authorized: false;
  real_observation_authorized: false;
  read_only_observer_authorized: false;
  registry_written: false;
  export_generated: false;
  diagnosis_enabled: false;
  db_written: false;
  ui_touched: false;
  gate3_ready: false;
  fase9_started: false;
  productive_brain_connection: false;
}

export interface ShadowOnlyOutboxEventRecord {
  eventId?: string;
  event_id?: string;
  outbox_event_id?: string;
  source_event_id?: string;
  source_system?: string;
  source_environment?: string;
  source_locator?: string;
  tenantId?: string;
  tenant_id?: string;
  sessionId?: string;
  session_id?: string;
  activityId?: string;
  activity_id?: string;
  actor_ref?: string;
  correlationId?: string;
  correlation_id?: string;
  idempotencyKey?: string;
  idempotency_key?: string;
  sourceRef?: string;
  official_flow_ref?: string;
  provenance?: string;
  source_trace?: string;
  occurredAt?: string;
  captured_at?: string;
  emitted_at?: string;
  eventType?: string;
  event_status?: string;
  payload?: unknown;
  real_client_intent?: unknown;
  real_tenant_context?: unknown;
  real_session_context?: unknown;
  real_activity_context?: unknown;
  real_runtime_event?: unknown;
  real_evidence_signal?: unknown;
  officialOutcome?: unknown;
  official_outcome?: unknown;
  shadowOutcome?: unknown;
  redaction_status?: string;
  data_minimization_attestation?: boolean;
  payload_hash?: string;
  checksum?: string;
  checksum_chain_ref?: string;
  replayId?: string;
  replay_ref?: string;
  traceId?: string;
  schemaVersion?: string;
  schema_version?: string;
  contract_version?: string;
  producer?: string;
  noGoFlags?: string[];
  evidenceRefs?: string[];
  registryWrite?: boolean;
  exportGenerated?: boolean;
  diagnosisEnabled?: boolean;
  gate3Ready?: boolean;
  fase9Started?: boolean;
  productiveWrite?: boolean;
}

export interface NormalizedShadowOnlyOutboxEventRecord {
  eventId: string;
  tenantId: string;
  sessionId: string;
  activityId: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRef: string;
  provenance: string;
  occurredAt: string;
  eventType?: string;
  payload?: unknown;
  officialOutcome?: unknown;
  shadowOutcome?: unknown;
  replayId?: string;
  traceId?: string;
  schemaVersion?: string;
  producer?: string;
  checksum?: string;
  noGoFlags: string[];
  evidenceRefs: string[];
}

export interface BridgeReaderNoGoFinding {
  code: BridgeReaderNoGoCode;
  recordId?: string;
  message: string;
  blocksPromotion: true;
}

export interface RejectedBridgeReaderRecord {
  recordId?: string;
  reasons: BridgeReaderNoGoFinding[];
  record: ShadowOnlyOutboxEventRecord;
}

export interface ShadowDivergence {
  eventId: string;
  tenantId: string;
  correlationId: string;
  idempotencyKey: string;
  officialOutcome: unknown;
  shadowOutcome: unknown;
}

export interface ShadowDivergenceReport {
  reportId: string;
  mode: BridgeReaderMode;
  totalCompared: number;
  equalOutcomes: number;
  divergentOutcomes: number;
  missingOfficialOutcome: number;
  missingShadowOutcome: number;
  divergences: ShadowDivergence[];
  reproducibility: {
    deterministicFromAcceptedRecords: true;
    replayRefs: string[];
  };
  tenantIsolationStatus: "SINGLE_TENANT" | "CROSS_TENANT_BATCH_ALLOWED" | "TENANT_MIXING_NO_GO";
  noGoStatus: "CLEAR" | "NO_GO_DETECTED";
  generatedAt: string;
}

export interface ReadShadowOnlyOutboxEventsInput {
  source: BridgeReaderSource;
  records: readonly ShadowOnlyOutboxEventRecord[];
  allowCrossTenantBatch?: boolean;
  requireCompleteComparison?: boolean;
  generatedAt?: string;
}

export interface BridgeReaderResult {
  ok: boolean;
  mode: BridgeReaderMode;
  recordsRead: number;
  recordsAccepted: number;
  recordsRejected: number;
  rejectedRecords: RejectedBridgeReaderRecord[];
  acceptedRecords: NormalizedShadowOnlyOutboxEventRecord[];
  gaps: string[];
  noGoFindings: BridgeReaderNoGoFinding[];
  divergenceReport: ShadowDivergenceReport;
  authority: BridgeReaderAuthority;
  generatedAt: string;
}

export interface ShadowEventValidationResult {
  accepted: boolean;
  record?: NormalizedShadowOnlyOutboxEventRecord;
  findings: BridgeReaderNoGoFinding[];
}

export interface BridgeReaderPromotionStatus {
  gate2RealShadowClosed: false;
  gate3Ready: false;
  fase9Ready: false;
  productiveAuthorityGranted: false;
  reason: "NON_PRODUCTIVE_BRIDGE_READER_DOES_NOT_GRANT_PROMOTION";
}
