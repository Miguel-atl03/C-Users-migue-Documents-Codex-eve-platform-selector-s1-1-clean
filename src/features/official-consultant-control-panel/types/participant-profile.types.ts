import type {
  AggregatedProfileResolutionStatus,
  CaseParticipantSummary,
  FunctionalProfileSummary,
  ProfileResolutionStatusUi,
} from "@/services/eve/official-control-panel/official-control-panel-participants.types";
import type {
  MonitoringActivityRow,
  MonitoringActivitiesLinkStatus,
} from "@/services/eve/official-control-panel/official-control-panel-monitoring.types";

export type ParticipantProfileViewStatus =
  | "idle"
  | "loading-participants"
  | "empty"
  | "loading-profiles"
  | "partial"
  | "active"
  | "error";

export type AssignmentPresentationKind =
  | "single_confirmed"
  | "multi_confirmed"
  | "system_suggested_pending_confirmation"
  | "mixed_unresolved"
  | "reentry_required"
  | "manual_review_required"
  | "unavailable";

export type CaseParticipantListItem = CaseParticipantSummary & {
  assignmentLabel: string;
  assignmentKind: AssignmentPresentationKind;
  engagementLabel: string;
  rolesCountLabel: string;
  activitiesLabel: string;
  journeyStageLabel: string;
  readinessLabel: string;
  attentionLabel: string;
};

export type FunctionalProfileListItem = FunctionalProfileSummary & {
  resolutionLabel: string;
  needsReview: boolean;
  responsibilitiesLabel: string;
  eligibleLabel: string;
  primaryLabel: string;
  nonPrimaryLabel: string;
  stateLabel: string;
  nextStepLabel: string;
  activitiesLinkStatus: MonitoringActivitiesLinkStatus;
};

export type ParticipantProfileViewModel = {
  status: ParticipantProfileViewStatus;
  participants: CaseParticipantListItem[];
  expandedParticipantId: string | null;
  selectedParticipant: CaseParticipantListItem | null;
  profiles: FunctionalProfileListItem[];
  profilesLoading: boolean;
  profilesError: boolean;
  selectedProfile: FunctionalProfileListItem | null;
  activities: MonitoringActivityRow[];
  activitiesLoading: boolean;
  activitiesError: boolean;
  activitiesMessage: string | null;
  activitiesLinkStatus: MonitoringActivitiesLinkStatus | null;
  sessions: Array<{
    id: string;
    label: string;
    stateLabel: string | null;
  }>;
  selectedSessionId: string | null;
  activitySelection: import("@/services/eve/official-control-panel/official-control-panel-activity-selection.types").ActivitySelectionCoverageView | null;
  activitySelectionLoading: boolean;
  activitySelectionError: boolean;
  selectedActivityId: string | null;
  errorMessage: string | null;
  emptyTitle: string;
  emptyMessage: string;
};
