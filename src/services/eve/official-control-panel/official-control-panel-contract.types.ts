/**
 * R1 — Canonical BFF / view-model contracts for the official control panel.
 * Wire HTTP payloads may remain domain-shaped; this layer is the typed boundary.
 * URL selectors are never authority.
 */

/** Selectors as requested by client/URL — untrusted until validated. */
export type RequestedControlPanelSelectors = {
  companyId?: string;
  relationshipId?: string;
  /** Rector alias: engagementId → relationshipId (factual product name). */
  engagementId?: string;
  caseId?: string;
  userId?: string;
  roleRuntimeSessionId?: string;
  responsibilityId?: string;
  activityId?: string;
  activityRuntimeRunId?: string;
  processId?: string;
  milestoneId?: string;
};

/** Server-validated cumulative scope. */
export type EffectiveControlPanelScope = {
  companyId: string;
  relationshipId?: string;
  caseId: string;
  userId?: string;
  roleRuntimeSessionId?: string;
  responsibilityId?: string;
  activityId?: string;
  activityRuntimeRunId?: string;
  processId?: string;
  milestoneId?: string;
};

/**
 * Data availability (BFF composition result).
 * available + empty records ≠ unavailable.
 */
export type PanelDataAvailability =
  | "available"
  | "partial"
  | "stale"
  | "unavailable"
  | "error";

/** Global screen state (contract only; full visual UX is R3). */
export type OfficialPanelScreenState =
  | "loading"
  | "refreshing"
  | "ready"
  | "partial"
  | "stale"
  | "forbidden"
  | "not_found"
  | "fatal";

export type FreshnessStatus = "current" | "stale" | "unknown";

export type FreshnessVM = {
  generatedAt: string;
  /** Factual source observation time when available. */
  sourceObservedAt: string | null;
  status: FreshnessStatus;
  reasonCode: string | null;
};

export type OfficialControlPanelCapability =
  | "view_company_state"
  | "view_participant_detail"
  | "view_authorized_evidence"
  | "view_experience_state"
  | "send_support_message"
  | "request_reentry"
  | "mark_manual_review"
  | "manage_manual_work"
  | "accept_manual_output"
  | "generate_export"
  | "block_export";

export type CapabilityVM = {
  key: OfficialControlPanelCapability;
  allowed: boolean;
  reasonCode: string | null;
  targetScope?: Partial<EffectiveControlPanelScope> | null;
};

export type OfficialPanelErrorVM = {
  code: string;
  requestId: string;
  retryable: boolean;
  source?: string;
  message?: string;
};

/**
 * Canonical success/authorized envelope. effectiveScope is always validated.
 * Pre-authorization failures use OfficialPanelUnauthorizedEnvelope (no fictitious IDs).
 */
export type OfficialPanelEnvelope<T> = {
  requestId: string;
  generatedAt: string;
  effectiveScope: EffectiveControlPanelScope;
  dataStatus: PanelDataAvailability;
  freshness: FreshnessVM;
  capabilities: CapabilityVM[];
  data: T | null;
  errors: OfficialPanelErrorVM[];
};

/** Error before a validated scope exists — never fabricates companyId/caseId. */
export type OfficialPanelUnauthorizedEnvelope = {
  requestId: string;
  generatedAt: string;
  effectiveScope: null;
  dataStatus: PanelDataAvailability;
  freshness: FreshnessVM;
  capabilities: CapabilityVM[];
  data: null;
  errors: OfficialPanelErrorVM[];
};

export type OfficialPanelResultEnvelope<T> =
  | OfficialPanelEnvelope<T>
  | OfficialPanelUnauthorizedEnvelope;

/** Minimal object-state projection (no MBA invention). */
export type ObjectStateVM = {
  id: string;
  label: string;
  statusLabel: string | null;
};

export type CompanySummaryVM = {
  id: string;
  label: string;
};

export type CoreMilestoneVM = {
  code: string;
  label: string;
  statusLabel: string | null;
  dataStatus?: string | null;
};

export type ExpectedEventVM = {
  label: string;
  code?: string | null;
};

export type ParticipationSummaryVM = {
  participantCount: number | null;
  label: string | null;
};

export type SupportProcessVM = {
  code: string;
  label: string;
  dataStatus?: string | null;
};

export type AttentionItemVM = {
  alertId: string;
  title: string;
  detail: string;
  severity?: string | null;
};

export type CompanyControlPanelVM = {
  scope: EffectiveControlPanelScope;
  company: CompanySummaryVM;
  relationship: ObjectStateVM | null;
  diagnosticCase: ObjectStateVM;
  currentMilestone: CoreMilestoneVM | null;
  nextExpectedEvent: ExpectedEventVM | null;
  /**
   * Factual §17 aggregation already received (no new MBA rules).
   * Null when experience/company state was not evaluable for this composition.
   */
  companyStateAggregation: {
    companyState: string;
    companyStateReason: string;
    experienceAlertCount: number | null;
    experienceAlertsComplete: boolean;
  } | null;
  /** Wire experience dataStatus when composition included experience. */
  experienceWireDataStatus: string | null;
  /** True when experience envelope was ready at composition time. */
  experienceLoadReady: boolean;
  participation: ParticipationSummaryVM;
  processAxis: SupportProcessVM[];
  milestones: CoreMilestoneVM[];
  attentionItems: AttentionItemVM[];
  capabilities: CapabilityVM[];
  freshness: FreshnessVM;
};

export type RoleMonitoringSessionVM = {
  roleRuntimeSessionId: string;
  label: string;
  stateLabel: string | null;
  responsibilityIds: string[];
  activityIds: string[];
  runIds: string[];
};

export type ParticipantMonitoringVM = {
  userId: string;
  /** Factual case participant id for navigation mapping. */
  participantId: string;
  displayName: string;
  engagementState: string;
  roleSessions: RoleMonitoringSessionVM[];
  /**
   * available + [] = evaluated empty;
   * unavailable = sessions source not yet evaluated for this user.
   */
  roleSessionsDataStatus: PanelDataAvailability;
  activitiesLabel: string;
  journeyStage: string;
  attentionState: string;
  lastActivityAt: string | null;
};

/** Alias documentation: engagementId ≡ relationshipId in product. */
export const SCOPE_ALIAS_NOTES = {
  engagementId: "relationshipId",
  company_id: "companyId",
  case_id: "caseId",
  process_id: "processId",
  milestone_id: "milestoneId",
  activity_runtime_run_id: "activityRuntimeRunId",
} as const;
