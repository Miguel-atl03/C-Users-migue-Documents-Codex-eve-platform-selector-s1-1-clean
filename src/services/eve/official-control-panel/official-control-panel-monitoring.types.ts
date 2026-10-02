/**
 * §10 Monitoreo recursivo — tipos de lectura factual + puente perfil↔RRS.
 */

export const MONITORING_UNAVAILABLE = "No disponible";
export const MONITORING_NO_RECORDS = "No hay registros para este caso";
export const MONITORING_NO_RUNTIME_LINK =
  "No hay una sesión funcional vinculada a este rol.";
export const MONITORING_PENDING_REVIEW =
  "La vinculación de esta sesión requiere revisión.";
export const MONITORING_SELECT_SESSION =
  "Seleccione una sesión funcional para consultar actividades.";
export const MONITORING_ACTIVITY_NAME_UNAVAILABLE = "Nombre no disponible";

export type ProfileRuntimeLinkStatus =
  | "confirmed"
  | "pending_review"
  | "revoked";

export type MonitoringActivitiesLinkStatus =
  | "empty"
  | "no_runtime_session_link"
  | "linked"
  | "multiple_runtime_sessions"
  | "pending_review"
  | "unavailable";

export type MonitoringUserRow = {
  participantId: string;
  userId: string;
  label: string;
  engagementLabel: string;
  rolesCount: number;
  rolesCountLabel: string;
  activitiesLabel: string;
  journeyStageLabel: string;
  readinessLabel: string;
  attentionLabel: string;
  participationStatusLabel: string | null;
  profileResolutionStatus:
    | "resolved"
    | "partial"
    | "unresolved"
    | "unavailable";
};

export type MonitoringRoleRow = {
  profileId: string;
  participantId: string;
  label: string;
  responsibilitiesLabel: string;
  eligibleLabel: string;
  primaryLabel: string;
  nonPrimaryLabel: string;
  stateLabel: string;
  nextStepLabel: string;
  roleRuntimeSessionId: string | null;
  roleRuntimeSessionIds: string[];
  roleRuntimeSessionCount: number | null;
  activitiesLinkStatus: MonitoringActivitiesLinkStatus;
};

export type MonitoringActivityRow = {
  activityId: string | null;
  runId: string;
  label: string;
  selectionReasonLabel: string;
  baseLabel: string;
  causalLabel: string;
  currentBlockLabel: string;
  readinessLabel: string;
  criticalRouteLabel: string;
  roleRuntimeSessionId: string;
  runStateLabel: string;
};

export type FunctionalSessionOption = {
  id: string;
  label: string;
  stateLabel: string | null;
  linkStatus: "confirmed" | "pending_review";
};

export type MonitoringUsersResponse = {
  users: MonitoringUserRow[];
  /** null = consulta fallida / no disponible; 0 = vacío factual */
  caseRoleSessionCount: number | null;
  caseActivityRunCount: number | null;
};

export type MonitoringRolesResponse = {
  roles: MonitoringRoleRow[];
};

export type MonitoringSessionsResponse = {
  sessions: FunctionalSessionOption[];
};

export type MonitoringActivitiesResponse = {
  activities: MonitoringActivityRow[];
  linkStatus: MonitoringActivitiesLinkStatus;
  message: string | null;
  roleRuntimeSessionId: string | null;
};

export type LinkedRoleRuntimeSession = {
  linkId: string;
  profileId: string;
  roleRuntimeSessionId: string;
  caseId: string;
  state: string;
  linkStatus: "confirmed" | "pending_review";
  validFrom: string;
  validUntil: string | null;
};

export type ProfileRuntimeSessionLink = {
  id: string;
  profileId: string;
  roleRuntimeSessionId: string;
  linkStatus: ProfileRuntimeLinkStatus;
  enabled: boolean;
  validFrom: string;
  validUntil: string | null;
  sourceReference: string | null;
};

export type RoleRuntimeSessionListItem = {
  id: string;
  caseId: string;
  roleId: string | null;
  state: string;
  selectedPrimaryActivityCount: number;
  secondaryActivityCount: number;
};

export type ActivityRuntimeRunListItem = {
  id: string;
  caseId: string;
  roleRuntimeSessionId: string;
  activityId: string | null;
  activityLabel: string | null;
  state: string;
  baseVisibleCount: number;
  causalVisibleCount: number;
  readinessState: string | null;
  currentRuntimeInteractionId: string | null;
  interactionInstanceCount: number | null;
  confirmedInteractionInstanceCount: number | null;
  subfieldResponseCount: number | null;
  evidenceItemCount: number | null;
  canonicalVariableCount: number | null;
};

export type OfficialControlPanelMonitoringRuntimeRepository = {
  countRoleSessionsByCase(caseId: string): Promise<number | null>;
  countActivityRunsByCase(caseId: string): Promise<number | null>;
  listRoleSessionsByCase(caseId: string): Promise<RoleRuntimeSessionListItem[]>;
  listActivityRunsBySession(
    roleRuntimeSessionId: string,
  ): Promise<ActivityRuntimeRunListItem[]>;
  findLinkedRoleSessionsByProfile(
    profileId: string,
  ): Promise<LinkedRoleRuntimeSession[]>;
  findProfileLinkByRuntimeSession(
    roleRuntimeSessionId: string,
  ): Promise<ProfileRuntimeSessionLink | null>;
  findSessionById(
    roleRuntimeSessionId: string,
  ): Promise<RoleRuntimeSessionListItem | null>;
};
