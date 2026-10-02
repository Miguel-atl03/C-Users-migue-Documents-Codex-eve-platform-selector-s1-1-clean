export type ParticipationStatus = "active" | "inactive" | "pending_review";

export type ProfileResolutionStatus =
  | "resolved"
  | "mixed_unresolved"
  | "reentry_required"
  | "manual_review_required"
  | "unavailable";

export type ProfileResolutionStatusUi =
  | "resolved"
  | "mixed-unresolved"
  | "reentry-required"
  | "manual-review-required"
  | "unavailable";

export type AggregatedProfileResolutionStatus =
  | "resolved"
  | "partial"
  | "unresolved"
  | "unavailable";

export type CaseParticipantRecord = {
  id: string;
  caseId: string;
  userId: string;
  authUserId: string | null;
  email: string | null;
  declaredPosition: string | null;
  displayLabel: string;
  participationStatus: ParticipationStatus;
  validFrom: string;
  validUntil: string | null;
  enabled: boolean;
};

export type CaseParticipantProfileRecord = {
  id: string;
  caseParticipantId: string;
  displayLabel: string;
  resolutionStatus: ProfileResolutionStatus;
  validFrom: string;
  validUntil: string | null;
  enabled: boolean;
};

export type CaseParticipantSummary = {
  id: string;
  label: string;
  userId: string | null;
  authUserId: string | null;
  email: string | null;
  declaredPosition: string | null;
  profileCount: number;
  participationStatusLabel: string | null;
  profileResolutionStatus: AggregatedProfileResolutionStatus;
};

export type FunctionalProfileSummary = {
  id: string;
  label: string;
  resolutionStatus: ProfileResolutionStatusUi;
};

export type OfficialControlPanelParticipantsAccessInput = {
  consultantUserId: string;
  companyId: string;
  relationshipId: string;
  caseId: string;
  participantId?: string;
  profileId?: string;
  at?: Date;
};

export type OfficialControlPanelParticipantsAccessResult =
  | { ok: true }
  | {
      ok: false;
      code: "participation_access_denied" | "participation_data_unavailable";
      status: 403 | 500;
      message: string;
    };

export type OfficialControlPanelParticipantsRepository = {
  listEnabledParticipantsByCase(
    caseId: string,
  ): Promise<CaseParticipantRecord[]>;
  findParticipantById(
    participantId: string,
  ): Promise<CaseParticipantRecord | null>;
  listEnabledProfilesByParticipant(
    participantId: string,
  ): Promise<CaseParticipantProfileRecord[]>;
  findProfileById(
    profileId: string,
  ): Promise<CaseParticipantProfileRecord | null>;
};
