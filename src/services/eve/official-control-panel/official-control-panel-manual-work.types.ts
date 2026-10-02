/**
 * §13 manual process tracking — types and view models.
 * Technical work tracking only; not MBA Object[State].
 */

export const MANUAL_PROCESS_CODES = [
  "P-SUP-03",
  "P-SUP-04",
  "P-SUP-05",
] as const;

export type ManualProcessCode = (typeof MANUAL_PROCESS_CODES)[number];

export const MANUAL_TRACKING_STATUSES = [
  "not_ready",
  "ready_to_start",
  "downloaded",
  "in_manual_work",
  "submitted",
  "review_required",
  "accepted",
  "blocked",
] as const;

export type ManualTrackingStatus = (typeof MANUAL_TRACKING_STATUSES)[number];

export const HANDOFF_STATUSES = [
  "not_applicable",
  "pending",
  "accepted",
  "closed",
] as const;

export type HandoffStatus = (typeof HANDOFF_STATUSES)[number];

export const MANUAL_HANDOFF_OVERDUE_CODE = "manual_handoff_overdue" as const;
export const MANUAL_HANDOFF_OVERDUE_TITLE = "Entrega manual vencida" as const;

export type ManualWorkDataStatus =
  | "empty"
  | "partial"
  | "available"
  | "unavailable"
  | "error";

export type ManualWorkActionId =
  | "download_package"
  | "register_start"
  | "attach_output"
  | "submit_review"
  | "accept_output";

/** Rector product actions (R2). */
export type ManualWorkProductAction = ManualWorkActionId;

export type ManualWorkAvailableActionView = {
  action: ManualWorkProductAction;
  allowed: boolean;
  reasonCode: string | null;
  label: string;
};

export type ManualWorkArtifactView = {
  id: string;
  kind: "input_package" | "manual_output";
  versionNumber: number;
  sanitizedFilename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  storageReference: string;
};

/** @deprecated Ola 1 reserved shape — prefer ManualWorkAvailableActionView. */
export type ManualWorkActionView = {
  id: ManualWorkActionId;
  label: string;
  enabled: false;
};

export type ManualWorkTimelineEventView = {
  id: string;
  eventType: string;
  actorLabel: string;
  occurredAt: string;
  beforeStatus: string;
  afterStatus: string;
  beforeHandoffStatus: string | null;
  afterHandoffStatus: string | null;
  reason: string | null;
  artifactRef: string | null;
};

export type ManualHandoffOverdueAlertView = {
  code: typeof MANUAL_HANDOFF_OVERDUE_CODE;
  title: typeof MANUAL_HANDOFF_OVERDUE_TITLE;
  processCode: ManualProcessCode;
  processLabel: string;
  workItemId: string;
  expectedEvent: string;
  dueAt: string;
  overdueDurationLabel: string;
  responsibleLabel: string | null;
  nextReviewRequired: true;
};

export type ManualWorkItemView = {
  id: string;
  processCode: ManualProcessCode;
  dataStatus: "available" | "partial";
  manualTrackingStatus: ManualTrackingStatus;
  handoffStatus: HandoffStatus;
  sourceObjectLabel: string | null;
  sourceStateLabel: string | null;
  expectedOutputObjectLabel: string | null;
  expectedOutputStateLabel: string | null;
  responsibleLabel: string | null;
  openedAt: string | null;
  expectedEvent: string | null;
  expectedHandoffAt: string | null;
  lastEventAt: string | null;
  artifactRef: string | null;
  version: number;
  attentionRequired: boolean;
  timeline: ManualWorkTimelineEventView[];
  overdueAlert: ManualHandoffOverdueAlertView | null;
  latestInputArtifact: ManualWorkArtifactView | null;
  latestOutputArtifact: ManualWorkArtifactView | null;
  submittedArtifactVersionId: string | null;
  acceptedArtifactVersionId: string | null;
  availableActions: ManualWorkAvailableActionView[];
};

export type ManualProcessGroupView = {
  processCode: ManualProcessCode;
  processLabel: string;
  dataStatus: ManualWorkDataStatus;
  emptyMessage: string | null;
  partialMessage: string | null;
  errorMessage: string | null;
  workItems: ManualWorkItemView[];
};

export type ManualWorkTrackingResponse = {
  caseId: string;
  companyId: string;
  dataStatus: ManualWorkDataStatus;
  processes: ManualProcessGroupView[];
  overdueAlerts: ManualHandoffOverdueAlertView[];
  generatedAt: string;
  capabilities?: import("./official-control-panel-contract.types").CapabilityVM[];
};

export const MANUAL_PROCESS_OPERATIONAL_LABELS: Record<
  ManualProcessCode,
  string
> = {
  "P-SUP-03": "Transducir evidencia por rol funcional.",
  "P-SUP-04": "Agregar causalidad empresarial.",
  "P-SUP-05": "Componer síntesis experta.",
};

export function isManualProcessCode(value: string): value is ManualProcessCode {
  return (MANUAL_PROCESS_CODES as readonly string[]).includes(value);
}

export function isManualTrackingStatus(
  value: string,
): value is ManualTrackingStatus {
  return (MANUAL_TRACKING_STATUSES as readonly string[]).includes(value);
}

export function isHandoffStatus(value: string): value is HandoffStatus {
  return (HANDOFF_STATUSES as readonly string[]).includes(value);
}
