import type {
  AggregatedProfileResolutionStatus,
  CaseParticipantSummary,
  FunctionalProfileSummary,
  ProfileResolutionStatusUi,
} from "@/services/eve/official-control-panel/official-control-panel-participants.types";
import type {
  AssignmentPresentationKind,
  CaseParticipantListItem,
  FunctionalProfileListItem,
  ParticipantProfileViewModel,
  ParticipantProfileViewStatus,
} from "../types/participant-profile.types";

export const PARTICIPANTS_ERROR_MESSAGE =
  "No fue posible cargar las personas participantes del caso.";

export const PARTICIPATION_OPEN_ERROR_MESSAGE =
  "No fue posible abrir la participación solicitada.";

const PROFILE_RESOLUTION_LABELS: Record<ProfileResolutionStatusUi, string> = {
  resolved: "Confirmado",
  "mixed-unresolved": "Asignación no resuelta",
  "reentry-required": "Requiere revisión",
  "manual-review-required": "Revisión del consultor",
  unavailable: "No disponible",
};

const ASSIGNMENT_LABELS: Record<AssignmentPresentationKind, string> = {
  single_confirmed: "Perfil confirmado",
  multi_confirmed: "Varios perfiles confirmados",
  system_suggested_pending_confirmation: "Confirmación pendiente",
  mixed_unresolved: "Asignación no resuelta",
  reentry_required: "Requiere revisión",
  manual_review_required: "Revisión del consultor",
  unavailable: "No disponible",
};

export function presentProfileResolutionLabel(
  status: ProfileResolutionStatusUi,
): string {
  return PROFILE_RESOLUTION_LABELS[status] ?? "No disponible";
}

export function presentAssignmentLabel(kind: AssignmentPresentationKind): string {
  return ASSIGNMENT_LABELS[kind] ?? "No disponible";
}

/**
 * Derives read-only assignment presentation from R2A aggregates + loaded profiles.
 * Does not invent BFF fields absent from the contract.
 */
export function deriveAssignmentPresentation(input: {
  participant: CaseParticipantSummary;
  profiles: FunctionalProfileSummary[] | null;
}): { kind: AssignmentPresentationKind; label: string } {
  const { participant, profiles } = input;

  if (profiles && profiles.length > 0) {
    const statuses = profiles.map((p) => p.resolutionStatus);
    if (statuses.some((s) => s === "manual-review-required")) {
      return kindOf("manual_review_required");
    }
    if (statuses.some((s) => s === "reentry-required")) {
      return kindOf("reentry_required");
    }
    if (statuses.some((s) => s === "mixed-unresolved")) {
      return kindOf("mixed_unresolved");
    }
    const allResolved = statuses.every((s) => s === "resolved");
    if (allResolved && profiles.length === 1) {
      return kindOf("single_confirmed");
    }
    if (allResolved && profiles.length > 1) {
      return kindOf("multi_confirmed");
    }
    if (statuses.some((s) => s === "unavailable")) {
      return kindOf("system_suggested_pending_confirmation");
    }
  }

  switch (participant.profileResolutionStatus) {
    case "resolved":
      return participant.profileCount > 1
        ? kindOf("multi_confirmed")
        : kindOf("single_confirmed");
    case "partial":
      return kindOf("system_suggested_pending_confirmation");
    case "unresolved":
      return kindOf("mixed_unresolved");
    default:
      return kindOf("unavailable");
  }
}

function kindOf(kind: AssignmentPresentationKind) {
  return { kind, label: presentAssignmentLabel(kind) };
}

export function presentParticipantItem(
  participant: CaseParticipantSummary,
  profiles: FunctionalProfileSummary[] | null = null,
): CaseParticipantListItem {
  const assignment = deriveAssignmentPresentation({ participant, profiles });
  return {
    ...participant,
    assignmentKind: assignment.kind,
    assignmentLabel: assignment.label,
    engagementLabel: "No disponible",
    rolesCountLabel: String(participant.profileCount),
    activitiesLabel: "No disponible",
    journeyStageLabel: "No disponible",
    readinessLabel: "No disponible",
    attentionLabel: "No disponible",
  };
}

export function presentProfileItem(
  profile: FunctionalProfileSummary,
): FunctionalProfileListItem {
  return {
    ...profile,
    resolutionLabel: presentProfileResolutionLabel(profile.resolutionStatus),
    needsReview:
      profile.resolutionStatus === "reentry-required" ||
      profile.resolutionStatus === "manual-review-required" ||
      profile.resolutionStatus === "mixed-unresolved",
    responsibilitiesLabel: "No disponible",
    eligibleLabel: "No disponible",
    primaryLabel: "No disponible",
    nonPrimaryLabel: "No disponible",
    stateLabel: presentProfileResolutionLabel(profile.resolutionStatus),
    nextStepLabel: "No disponible",
    activitiesLinkStatus: "no_runtime_session_link",
  };
}

export function classifyParticipantProfileViewStatus(input: {
  caseActive: boolean;
  loadingParticipants: boolean;
  participantsError: boolean;
  participants: CaseParticipantSummary[];
  loadingProfiles: boolean;
}): ParticipantProfileViewStatus {
  if (!input.caseActive) return "idle";
  if (input.loadingParticipants) return "loading-participants";
  if (input.participantsError) return "error";
  if (input.participants.length === 0) return "empty";
  if (input.loadingProfiles) return "loading-profiles";

  const incomplete = input.participants.some(
    (p) =>
      p.profileCount === 0 ||
      p.profileResolutionStatus === "partial" ||
      p.profileResolutionStatus === "unresolved" ||
      p.profileResolutionStatus === "unavailable",
  );
  return incomplete ? "partial" : "active";
}

export function presentParticipantProfileViewModel(input: {
  status: ParticipantProfileViewStatus;
  participants: CaseParticipantSummary[];
  expandedParticipantId: string | null;
  profilesByParticipantId: Record<string, FunctionalProfileSummary[]>;
  profilesLoading: boolean;
  profilesError: boolean;
  selectedProfileId: string | null;
  errorMessage: string | null;
  activities?: import("@/services/eve/official-control-panel/official-control-panel-monitoring.types").MonitoringActivityRow[];
  activitiesLoading?: boolean;
  activitiesError?: boolean;
  activitiesMessage?: string | null;
  activitiesLinkStatus?: import("@/services/eve/official-control-panel/official-control-panel-monitoring.types").MonitoringActivitiesLinkStatus | null;
}): ParticipantProfileViewModel {
  const participants = input.participants.map((participant) =>
    presentParticipantItem(
      participant,
      input.expandedParticipantId === participant.id
        ? (input.profilesByParticipantId[participant.id] ?? null)
        : null,
    ),
  );

  const selectedParticipant =
    participants.find((p) => p.id === input.expandedParticipantId) ?? null;

  const rawProfiles =
    input.expandedParticipantId &&
    input.profilesByParticipantId[input.expandedParticipantId]
      ? input.profilesByParticipantId[input.expandedParticipantId]
      : [];

  const profiles = rawProfiles.map(presentProfileItem);
  const selectedProfile =
    profiles.find((p) => p.id === input.selectedProfileId) ?? null;

  const empty = emptyCopyForStatus(input.status);

  return {
    status: input.status,
    participants,
    expandedParticipantId: input.expandedParticipantId,
    selectedParticipant,
    profiles,
    profilesLoading: input.profilesLoading,
    profilesError: input.profilesError,
    selectedProfile,
    activities: input.activities ?? [],
    activitiesLoading: Boolean(input.activitiesLoading),
    activitiesError: Boolean(input.activitiesError),
    activitiesMessage: input.activitiesMessage ?? null,
    activitiesLinkStatus: input.activitiesLinkStatus ?? null,
    sessions: [],
    selectedSessionId: null,
    activitySelection: null,
    activitySelectionLoading: false,
    activitySelectionError: false,
    selectedActivityId: null,
    errorMessage: input.errorMessage,
    emptyTitle: empty.title,
    emptyMessage: empty.message,
  };
}

function emptyCopyForStatus(status: ParticipantProfileViewStatus): {
  title: string;
  message: string;
} {
  switch (status) {
    case "idle":
      return {
        title: "Usuarios del caso no disponibles.",
        message: "Seleccione un caso activo para consultar el monitoreo recursivo.",
      };
    case "loading-participants":
      return {
        title: "Cargando usuarios del caso…",
        message: "Espere mientras se consulta la participación del caso.",
      };
    case "empty":
      return {
        title: "Este caso no tiene personas participantes registradas.",
        message: "",
      };
    case "loading-profiles":
      return {
        title: "Cargando roles funcionales…",
        message: "Espere mientras se consultan los roles de la persona.",
      };
    case "error":
      return {
        title: "Usuarios del caso",
        message: PARTICIPANTS_ERROR_MESSAGE,
      };
    case "partial":
      return {
        title: "Usuarios del caso",
        message: "Existen participantes con asignación funcional incompleta.",
      };
    default:
      return {
        title: "Usuarios del caso",
        message: "Monitoreo recursivo: usuario → rol → actividad.",
      };
  }
}

export function isAggregatedIncomplete(
  status: AggregatedProfileResolutionStatus,
): boolean {
  return (
    status === "partial" ||
    status === "unresolved" ||
    status === "unavailable"
  );
}
