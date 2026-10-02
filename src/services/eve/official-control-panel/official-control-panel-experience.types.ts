/**
 * §§15–17 Experience governance — panel types.
 * Not business evidence. Not MBA Object[State]. Not psychological diagnosis.
 */

export const EXPERIENCE_SCREEN_KEYS = [
  "login_demo",
  "estado_a",
  "workmap",
  "selector_interno_eve",
  "significado",
  "bloque_0",
  "bloque_0_5",
  "bloque_1",
  "bloque_2",
  "bloque_3",
  "bloque_4",
  "bloque_5",
  "bloque_6",
  "bloque_7",
  "cierre_actividad",
  "siguiente_actividad_cierre_sesion",
  "generacion_outputs",
  /** Official panel consultant surfaces (instrumentation only). */
  "panel_client_monitoring",
  "panel_client_tracking",
  "panel_client_governance",
  "panel_experience_journeys",
  "panel_experience_support",
  "panel_experience_screen_health",
] as const;

/** Product (end-user) screens — excludes panel_* consultant surfaces. */
export const EXPERIENCE_PRODUCT_SCREEN_KEYS = EXPERIENCE_SCREEN_KEYS.filter(
  (key) => !key.startsWith("panel_"),
);

export type ExperienceScreenKey = (typeof EXPERIENCE_SCREEN_KEYS)[number];

export const EXPERIENCE_SCREEN_STATUSES = [
  "not_reached",
  "active",
  "completed",
  "blocked",
  "support_requested",
  "abandoned",
  "stale",
  "not_applicable",
] as const;

export type ExperienceScreenStatus =
  (typeof EXPERIENCE_SCREEN_STATUSES)[number];

export const EXPERIENCE_EVENT_TYPES = [
  "screen_entered",
  "screen_completed",
  "screen_blocked",
  "support_requested",
  "screen_abandoned",
  "screen_error",
  "screen_recovered",
] as const;

export type ExperienceEventType = (typeof EXPERIENCE_EVENT_TYPES)[number];

export const EXPERIENCE_ACTION_TYPES = [
  "send_message",
  "resume_link",
  "request_reentry",
  "mark_manual_review",
  "reopen_block",
  "session_reset",
] as const;

export type ExperienceActionType = (typeof EXPERIENCE_ACTION_TYPES)[number];

export const EXPERIENCE_DATA_STATUSES = [
  "empty",
  "available",
  "partial",
  "error",
] as const;

export type ExperienceDataStatus = (typeof EXPERIENCE_DATA_STATUSES)[number];

/** §17.2 hierarchy literals (display order = priority). */
export const COMPANY_STATE_HIERARCHY = [
  "Cerrado",
  "Bloqueado",
  "Atención",
  "En curso",
  "No iniciado",
] as const;

export type CompanyStateLabel = (typeof COMPANY_STATE_HIERARCHY)[number];

/** §17.3 alert type literals. */
export const COMPANY_ALERT_TYPES = [
  "timer_core_upcoming_or_overdue",
  "role_assignment_gap",
  "workmap_coverage_gap",
  "blocked_by_missing_canonical_route",
  "process_state_without_timer",
  "manual_handoff_overdue",
  "qa_with_findings",
  "experience_support_requested",
  "screen_error_recurrent",
] as const;

export type CompanyAlertType = (typeof COMPANY_ALERT_TYPES)[number];

export const EXPERIENCE_EVENT_STATUS_MAP: Record<
  ExperienceEventType,
  ExperienceScreenStatus
> = {
  screen_entered: "active",
  screen_completed: "completed",
  screen_blocked: "blocked",
  support_requested: "support_requested",
  screen_abandoned: "abandoned",
  screen_error: "blocked",
  screen_recovered: "active",
};

export type ExperienceCapability =
  | "view_experience_state"
  | "send_support_message"
  | "request_reentry"
  | "mark_manual_review"
  | "reopen_block"
  | "session_reset"
  | "open_detail"
  | "view_trajectory"
  | "governed_action";

export type ExperienceScreenCatalogItem = {
  screenKey: ExperienceScreenKey;
  label: string;
  segment: string;
  visibility: "visible" | "checkpoint";
  sortOrder: number;
};

export type ExperienceTrajectoryEventView = {
  id: string;
  userId: string;
  screenKey: ExperienceScreenKey;
  screenLabel: string;
  eventType: ExperienceEventType;
  screenStatus: ExperienceScreenStatus;
  occurredAt: string;
  roleRuntimeSessionId: string | null;
  activityId: string | null;
  sessionReference: string;
  requestId: string;
};

export type ExperienceUserScreenCellView = {
  screenKey: ExperienceScreenKey;
  screenLabel: string;
  status: ExperienceScreenStatus;
  lastEventAt: string | null;
  lastEventType: ExperienceEventType | null;
};

export type ExperienceUserJourneyView = {
  userId: string;
  displayLabel: string;
  currentScreenKey: ExperienceScreenKey | null;
  currentStatus: ExperienceScreenStatus | null;
  lastActivityAt: string | null;
  cells: ExperienceUserScreenCellView[];
};

export type ExperienceScreenHealthView = {
  screenKey: ExperienceScreenKey;
  screenLabel: string;
  visibility: "visible" | "checkpoint";
  enteredCount: number;
  completedCount: number;
  blockedCount: number;
  supportCount: number;
  abandonedCount: number;
  errorCount: number;
  activeUsers: number;
};

export type ExperienceSupportQueueItemView = {
  id: string;
  userId: string;
  screenKey: ExperienceScreenKey;
  screenLabel: string;
  actionType: ExperienceActionType | null;
  reasonCode: string | null;
  beforeState: string | null;
  expectedEffect: string | null;
  capability: string | null;
  actorId: string | null;
  createdAt: string;
  source: "support_action" | "support_requested_event";
  roleRuntimeSessionId: string | null;
  activityId: string | null;
};

export type ExperienceSelectors = {
  userId: string | null;
  roleRuntimeSessionId: string | null;
  activityId: string | null;
  screenKey: ExperienceScreenKey | null;
};

export type ExperienceStateView = {
  caseId: string;
  companyId: string;
  dataStatus: ExperienceDataStatus;
  emptyMessage: string | null;
  generatedAt: string;
  selectors: ExperienceSelectors;
  catalog: ExperienceScreenCatalogItem[];
  trajectory: ExperienceTrajectoryEventView[];
  users: ExperienceUserJourneyView[];
  screensHealth: ExperienceScreenHealthView[];
  supportQueue: ExperienceSupportQueueItemView[];
  /**
   * Canonical capability matrix (CapabilityVM[]).
   * Consumers must read allowed via key + allowed === true — never infer from queue presence.
   */
  capabilities: import("./official-control-panel-contract.types").CapabilityVM[];
};

export type CompanyAttentionAlertView = {
  alertId: string;
  alertType: CompanyAlertType;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  scopeLabel: string;
  responseHint: string;
  userId?: string | null;
  screenKey?: ExperienceScreenKey | null;
  processCode?: string | null;
  packageId?: string | null;
  workItemId?: string | null;
  capabilities: ExperienceCapability[];
};

export type CompanyStateAggregationView = {
  companyState: CompanyStateLabel;
  companyStateReason: string;
  alerts: CompanyAttentionAlertView[];
  /** null → UI shows "—"; number when aggregation complete. */
  experienceAlertCount: number | null;
  experienceAlertsComplete: boolean;
};

export type ExperienceStateResponse = ExperienceStateView & {
  companyState: CompanyStateAggregationView;
};

export const EXPERIENCE_EMPTY_MESSAGE =
  "Sin experience events. La instrumentación no está disponible o el usuario aún no inició.";

export function isExperienceScreenKey(
  value: string,
): value is ExperienceScreenKey {
  return (EXPERIENCE_SCREEN_KEYS as readonly string[]).includes(value);
}

export function isExperienceEventType(
  value: string,
): value is ExperienceEventType {
  return (EXPERIENCE_EVENT_TYPES as readonly string[]).includes(value);
}

export function isExperienceActionType(
  value: string,
): value is ExperienceActionType {
  return (EXPERIENCE_ACTION_TYPES as readonly string[]).includes(value);
}

export function isPanelExperienceScreenKey(
  value: string,
): value is ExperienceScreenKey {
  return (
    isExperienceScreenKey(value) &&
    (value as string).startsWith("panel_")
  );
}

export function capabilityForAction(
  actionType: ExperienceActionType,
): ExperienceCapability {
  switch (actionType) {
    case "send_message":
    case "resume_link":
      return "send_support_message";
    case "request_reentry":
      return "request_reentry";
    case "mark_manual_review":
      return "mark_manual_review";
    case "reopen_block":
      return "reopen_block";
    case "session_reset":
      return "session_reset";
  }
}
