import type {
  AggregatedProfileResolutionStatus,
  CaseParticipantProfileRecord,
  CaseParticipantRecord,
  CaseParticipantSummary,
  FunctionalProfileSummary,
  OfficialControlPanelParticipantsAccessInput,
  OfficialControlPanelParticipantsAccessResult,
  OfficialControlPanelParticipantsRepository,
  ParticipationStatus,
  ProfileResolutionStatus,
  ProfileResolutionStatusUi,
} from "./official-control-panel-participants.types";
import { assertConsultantClientContextAccess } from "./official-control-panel-context-service";
import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";

const ACCESS_DENIED_MESSAGE =
  "No fue posible abrir la participación solicitada.";
const DATA_UNAVAILABLE_MESSAGE =
  "No fue posible abrir la participación solicitada.";

const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
  pending_review: "Asignación pendiente",
};

/**
 * Cumulative access: consultant → company → relationship → case
 * → optional participant → optional profile.
 */
export async function assertConsultantCaseParticipantAccess(
  contextRepository: OfficialControlPanelContextRepository,
  participantsRepository: OfficialControlPanelParticipantsRepository,
  input: OfficialControlPanelParticipantsAccessInput,
): Promise<OfficialControlPanelParticipantsAccessResult> {
  try {
    const contextAccess = await assertConsultantClientContextAccess(
      contextRepository,
      {
        consultantUserId: input.consultantUserId,
        companyId: input.companyId,
        relationshipId: input.relationshipId,
        caseId: input.caseId,
        at: input.at,
      },
    );

    if (!contextAccess.ok) {
      return accessDenied();
    }

    if (input.participantId) {
      const participant = await participantsRepository.findParticipantById(
        input.participantId,
      );
      if (
        !participant ||
        !participant.enabled ||
        participant.caseId !== input.caseId
      ) {
        return accessDenied();
      }

      if (input.profileId) {
        const profile = await participantsRepository.findProfileById(
          input.profileId,
        );
        if (
          !profile ||
          !profile.enabled ||
          profile.caseParticipantId !== participant.id
        ) {
          return accessDenied();
        }
      }
    } else if (input.profileId) {
      return accessDenied();
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      code: "participation_data_unavailable",
      status: 500,
      message: DATA_UNAVAILABLE_MESSAGE,
    };
  }
}

export async function buildCaseParticipantsResponse(
  repository: OfficialControlPanelParticipantsRepository,
  caseId: string,
): Promise<CaseParticipantSummary[]> {
  const participants = await repository.listEnabledParticipantsByCase(caseId);
  const summaries: CaseParticipantSummary[] = [];

  for (const participant of participants) {
    const profiles = await repository.listEnabledProfilesByParticipant(
      participant.id,
    );
    summaries.push({
      id: participant.id,
      label: participant.displayLabel,
      userId: participant.userId || null,
      authUserId: participant.authUserId,
      email: participant.email,
      declaredPosition: participant.declaredPosition,
      profileCount: profiles.length,
      participationStatusLabel:
        PARTICIPATION_STATUS_LABELS[participant.participationStatus] ?? null,
      profileResolutionStatus: aggregateProfileResolution(profiles),
    });
  }

  return summaries;
}

export async function buildParticipantProfilesResponse(
  repository: OfficialControlPanelParticipantsRepository,
  participantId: string,
): Promise<FunctionalProfileSummary[]> {
  const profiles =
    await repository.listEnabledProfilesByParticipant(participantId);
  return profiles.map((profile) => ({
    id: profile.id,
    label: profile.displayLabel,
    resolutionStatus: toUiResolutionStatus(profile.resolutionStatus),
  }));
}

export function aggregateProfileResolution(
  profiles: CaseParticipantProfileRecord[],
): AggregatedProfileResolutionStatus {
  if (profiles.length === 0) return "unavailable";

  const hasResolved = profiles.some((p) => p.resolutionStatus === "resolved");
  const hasOpen = profiles.some((p) => p.resolutionStatus !== "resolved");

  if (hasResolved && !hasOpen) return "resolved";
  if (hasResolved && hasOpen) return "partial";
  return "unresolved";
}

export function toUiResolutionStatus(
  status: ProfileResolutionStatus,
): ProfileResolutionStatusUi {
  switch (status) {
    case "mixed_unresolved":
      return "mixed-unresolved";
    case "reentry_required":
      return "reentry-required";
    case "manual_review_required":
      return "manual-review-required";
    case "resolved":
      return "resolved";
    default:
      return "unavailable";
  }
}

function accessDenied(): OfficialControlPanelParticipantsAccessResult {
  return {
    ok: false,
    code: "participation_access_denied",
    status: 403,
    message: ACCESS_DENIED_MESSAGE,
  };
}

export function mapParticipantRow(row: Record<string, unknown>): CaseParticipantRecord {
  const user = relationRecord(row.usuarios);
  const status = String(row.status ?? row.participation_status ?? "");
  const modern = "usuario_id" in row || "participant_name" in row;
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    userId: String(row.usuario_id ?? row.user_id ?? ""),
    authUserId: nullableString(user?.auth_user_id),
    email:
      nullableString(row.participant_email) ?? nullableString(user?.email),
    declaredPosition: nullableString(user?.rol_declarado),
    displayLabel:
      nullableString(row.participant_name) ??
      nullableString(user?.nombre) ??
      nullableString(row.display_label) ??
      nullableString(row.participant_email) ??
      "Participante",
    participationStatus: modern
      ? status === "active"
        ? "active"
        : status === "invited"
          ? "pending_review"
          : "inactive"
      : (row.participation_status as ParticipationStatus),
    validFrom: String(row.created_at ?? row.valid_from ?? ""),
    validUntil: modern
      ? null
      : row.valid_until == null
        ? null
        : String(row.valid_until),
    enabled: modern ? status === "active" : Boolean(row.enabled),
  };
}

export function mapProfileRow(
  row: Record<string, unknown>,
): CaseParticipantProfileRecord {
  const modern = "role_label" in row || "profile_status" in row;
  const status = String(row.profile_status ?? "");
  return {
    id: String(row.id),
    caseParticipantId: String(row.case_participant_id),
    displayLabel: String(row.role_label ?? row.display_label ?? "Perfil funcional"),
    resolutionStatus: modern
      ? status === "active"
        ? "resolved"
        : "unavailable"
      : (row.resolution_status as ProfileResolutionStatus),
    validFrom: String(row.created_at ?? row.valid_from ?? ""),
    validUntil: modern
      ? null
      : row.valid_until == null
        ? null
        : String(row.valid_until),
    enabled: modern ? status === "active" : Boolean(row.enabled),
  };
}

function relationRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object"
      ? (first as Record<string, unknown>)
      : null;
  }
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
