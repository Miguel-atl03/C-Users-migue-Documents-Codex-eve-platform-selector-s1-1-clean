/**
 * R1 — Typed composers for CompanyControlPanelVM and ParticipantMonitoringVM.
 * No new HTTP company-state facade: composition absorbs multi-GET reads (Option B).
 */

import {
  buildCapabilityMatrix,
  mapExperienceCapabilitiesToOfficial,
} from "./official-control-panel-capability-catalog.ts";
import {
  buildFreshnessVM,
  mapWireToPanelDataAvailability,
  validateAndBuildEffectiveScope,
} from "./official-control-panel-contract-normalize.ts";
import type {
  AttentionItemVM,
  CompanyControlPanelVM,
  CompanySummaryVM,
  CoreMilestoneVM,
  EffectiveControlPanelScope,
  ExpectedEventVM,
  ObjectStateVM,
  ParticipantMonitoringVM,
  RoleMonitoringSessionVM,
  SupportProcessVM,
} from "./official-control-panel-contract.types";
import type { CoreMilestoneAxisItem } from "./official-control-panel-core-milestone-axis.types";
import type {
  CompanyAttentionAlertView,
  CompanyStateAggregationView,
  ExperienceCapability,
  ExperienceStateView,
} from "./official-control-panel-experience.types";
import type {
  FunctionalSessionOption,
  MonitoringActivityRow,
  MonitoringUserRow,
} from "./official-control-panel-monitoring.types";
import type { SupportProcessAxisItem } from "./official-control-panel-support-process.types";

export type CompanyControlPanelComposeInput = {
  company: { id: string; label: string };
  relationship: { id: string; label: string; statusLabel?: string | null };
  diagnosticCase: { id: string; label: string; statusLabel?: string | null };
  milestones: CoreMilestoneAxisItem[];
  processAxis: SupportProcessAxisItem[];
  attentionAlerts: CompanyAttentionAlertView[];
  companyState?: CompanyStateAggregationView | null;
  experience?: ExperienceStateView | null;
  experienceCapabilities?: readonly ExperienceCapability[];
  generatedAt: string;
  /** Factual observation only — never pass experience.generatedAt. */
  sourceObservedAt?: string | null;
  versionMismatch?: boolean;
  extraAllowedCapabilities?: Iterable<string>;
};

function toMilestoneVM(item: CoreMilestoneAxisItem): CoreMilestoneVM {
  return {
    code: item.code,
    label: item.label,
    statusLabel: item.uiStateLabel || item.objectStateLabel || null,
    dataStatus: item.dataStatus,
  };
}

function toProcessVM(item: SupportProcessAxisItem): SupportProcessVM {
  return {
    code: item.code,
    label: item.label,
    dataStatus: item.dataStatus ?? null,
  };
}

function toAttentionVM(alert: CompanyAttentionAlertView): AttentionItemVM {
  return {
    alertId: alert.alertId,
    title: alert.title,
    detail: alert.detail,
    severity: alert.severity ?? null,
  };
}

function pickCurrentMilestone(
  milestones: CoreMilestoneAxisItem[],
): CoreMilestoneVM | null {
  const current =
    milestones.find(
      (m) =>
        m.uiState === "current_wait" ||
        m.uiState === "manual_pending" ||
        m.uiState === "blocked",
    ) ??
    milestones.find((m) => m.reached === false && m.dataStatus === "available");
  return current ? toMilestoneVM(current) : null;
}

/**
 * Only returns an event when the current rail position has a factual expected label.
 * Never invents a synthetic next-event label from companyState === "En curso".
 * Catalog labels on non-current milestones are not treated as the live next event.
 */
export function pickNextExpectedEvent(
  milestones: CoreMilestoneAxisItem[],
): ExpectedEventVM | null {
  const current = milestones.find(
    (m) =>
      (m.uiState === "current_wait" ||
        m.uiState === "manual_pending" ||
        m.uiState === "blocked") &&
      m.dataStatus === "available" &&
      m.expectedNextEventLabel != null &&
      m.expectedNextEventLabel.trim().length > 0,
  );
  if (current?.expectedNextEventLabel) {
    return {
      label: current.expectedNextEventLabel,
      code: current.code,
    };
  }
  return null;
}

/**
 * Compose CompanyControlPanelVM from existing factual fragments.
 * Does not invent MBA states or fill nulls with false/0/completed.
 */
export function composeCompanyControlPanelVM(
  input: CompanyControlPanelComposeInput,
): CompanyControlPanelVM {
  const scopeResult = validateAndBuildEffectiveScope({
    companyId: input.company.id,
    caseId: input.diagnosticCase.id,
    relationshipId: input.relationship.id,
  });
  if (!scopeResult.ok) {
    throw new Error(`invalid_effective_scope:${scopeResult.code}`);
  }

  const company: CompanySummaryVM = {
    id: input.company.id,
    label: input.company.label,
  };

  const relationship: ObjectStateVM = {
    id: input.relationship.id,
    label: input.relationship.label,
    statusLabel: input.relationship.statusLabel ?? null,
  };

  const diagnosticCase: ObjectStateVM = {
    id: input.diagnosticCase.id,
    label: input.diagnosticCase.label,
    statusLabel: input.diagnosticCase.statusLabel ?? null,
  };

  const milestones = input.milestones.map(toMilestoneVM);
  const processAxis = input.processAxis.map(toProcessVM);
  const attentionItems = input.attentionAlerts.map(toAttentionVM);

  const experienceWireCaps = input.experience?.capabilities ?? [];
  const experienceCaps =
    experienceWireCaps.length > 0
      ? experienceWireCaps.filter((c) => c.allowed).map((c) => c.key)
      : mapExperienceCapabilitiesToOfficial(input.experienceCapabilities ?? []);
  const capabilities = buildCapabilityMatrix({
    allowed: [
      "view_company_state",
      "view_participant_detail",
      "view_authorized_evidence",
      ...experienceCaps,
      ...(input.extraAllowedCapabilities
        ? Array.from(input.extraAllowedCapabilities)
        : []),
    ],
  });

  const freshness = buildFreshnessVM({
    generatedAt: input.generatedAt,
    sourceObservedAt: input.sourceObservedAt ?? null,
    versionMismatch: input.versionMismatch,
  });

  return {
    scope: scopeResult.scope,
    company,
    relationship,
    diagnosticCase,
    currentMilestone: pickCurrentMilestone(input.milestones),
    nextExpectedEvent: pickNextExpectedEvent(input.milestones),
    companyStateAggregation: input.companyState
      ? {
          companyState: input.companyState.companyState,
          companyStateReason: input.companyState.companyStateReason,
          experienceAlertCount: input.companyState.experienceAlertCount,
          experienceAlertsComplete: input.companyState.experienceAlertsComplete,
        }
      : null,
    experienceWireDataStatus: input.experience?.dataStatus ?? null,
    experienceLoadReady: input.experience != null,
    participation: {
      participantCount: null,
      label: null,
    },
    processAxis,
    milestones,
    attentionItems,
    capabilities,
    freshness,
  };
}

export type ParticipantMonitoringComposeInput = {
  user: MonitoringUserRow;
  roleSessions?: FunctionalSessionOption[];
  /**
   * true = sessions source evaluated for this user (even if empty).
   * false/undefined = not yet evaluated → roleSessionsDataStatus unavailable.
   */
  roleSessionsEvaluated?: boolean;
  activitiesBySessionId?: Map<string, MonitoringActivityRow[]>;
  lastActivityAt?: string | null;
};

/**
 * Preserve user → role_runtime_session → responsibilities → activities → runs.
 * Never merge distinct sessions by userId.
 */
export function composeParticipantMonitoringVM(
  input: ParticipantMonitoringComposeInput,
): ParticipantMonitoringVM {
  const evaluated = input.roleSessionsEvaluated === true;
  const sessions = evaluated ? (input.roleSessions ?? []) : [];
  const roleSessions: RoleMonitoringSessionVM[] = sessions.map((s) => {
    const activities = input.activitiesBySessionId?.get(s.id) ?? [];
    return {
      roleRuntimeSessionId: s.id,
      label: s.label,
      stateLabel: s.stateLabel,
      responsibilityIds: [],
      activityIds: activities
        .map((a) => a.activityId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
      runIds: activities.map((a) => a.runId).filter((id) => id.length > 0),
    };
  });

  return {
    userId: input.user.userId,
    participantId: input.user.participantId,
    displayName: input.user.label,
    engagementState: input.user.engagementLabel,
    roleSessions,
    roleSessionsDataStatus: evaluated ? "available" : "unavailable",
    activitiesLabel: input.user.activitiesLabel,
    journeyStage: input.user.journeyStageLabel,
    attentionState: input.user.attentionLabel,
    lastActivityAt: input.lastActivityAt ?? null,
  };
}

export function composeParticipantMonitoringList(
  users: MonitoringUserRow[],
  sessionsByUserId?: Map<string, FunctionalSessionOption[]>,
  activitiesBySessionId?: Map<string, MonitoringActivityRow[]>,
): ParticipantMonitoringVM[] {
  return users.map((user) => {
    const evaluated = sessionsByUserId?.has(user.userId) === true;
    return composeParticipantMonitoringVM({
      user,
      roleSessions: evaluated ? sessionsByUserId!.get(user.userId) : undefined,
      roleSessionsEvaluated: evaluated,
      activitiesBySessionId,
      lastActivityAt: null,
    });
  });
}

/** Derive canonical data availability for a composed company VM payload. */
export function companyVmDataAvailability(input: {
  milestonesStatus?: string | null;
  experienceStatus?: string | null;
  processStatus?: string | null;
}): ReturnType<typeof mapWireToPanelDataAvailability> {
  const primary = mapWireToPanelDataAvailability(
    input.milestonesStatus ?? "available",
  );
  const secondary = [
    mapWireToPanelDataAvailability(input.experienceStatus ?? "available"),
    mapWireToPanelDataAvailability(input.processStatus ?? "available"),
  ];
  if (primary === "error" || primary === "unavailable") return primary;
  if (
    secondary.some(
      (s) => s === "error" || s === "unavailable" || s === "partial",
    )
  ) {
    return "partial";
  }
  if (primary === "stale") return "stale";
  return "available";
}

export function assertScopeMatchesAuthorization(
  effective: EffectiveControlPanelScope,
  authorized: { companyId: string; caseId: string; relationshipId?: string },
): boolean {
  if (effective.companyId !== authorized.companyId) return false;
  if (effective.caseId !== authorized.caseId) return false;
  if (authorized.relationshipId) {
    if (!effective.relationshipId) return false;
    if (effective.relationshipId !== authorized.relationshipId) return false;
  }
  return true;
}
