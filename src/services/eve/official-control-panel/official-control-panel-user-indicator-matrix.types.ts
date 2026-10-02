export type CaseUserIndicatorMatrix = {
  users: Array<{
    participantId: string;
    displayName: string;
    declaredPosition: string | null;
    declaredArea: string | null;
    functionalProfileId: string | null;
    functionalProfileLabel: string | null;
    functionalProfileStatus: "materialized" | "pending_materialization";
    confirmationStatus: string | null;
    sourceWorkmapId: string | null;
    sourceWorkmapVersionId: string | number | null;
    responsibilityCount: number | null;
    activityCount: number | null;
    eligibleActivityCount: number | null;
    selectedPrimaryCount: number | null;
    nonPrimaryContextCount: number | null;
    selectionPolicyVersion: string | null;
    selectionEffectiveFrom: string | null;
    preparedRuntimeSessionCount: number;
    preparedRuntimeRunCount: number;
    startedRuntimeRunCount: number;
    currentRuntimeActivityOrdinal: number | null;
    currentRuntimeActivityTotal: number | null;
    currentRuntimeRunState: string | null;
    currentRuntimeBlockLabel: string | null;
    b0InteractionCount: number | null;
    b0ConfirmedInteractionCount: number | null;
    b0ResponseCount: number | null;
    b0SubfieldCount: number | null;
    b0EvidenceCount: number | null;
    b0CanonicalVariableCount: number | null;
    selectionStage: "eligibility_pending" | "effective" | "not_started";
    selectionStageLabel: string;
    attentionLabel: string;
    functionalSessionStatus: "not_started" | "active";
    functionalSessionLabel: string;
    lastScreenLabel: string;
  }>;
  totalParticipants: number;
  workMapsSaved: {
    total: number;
    byParticipant: Record<string, boolean | null>;
  };
  primarySelections: {
    total: number | null;
    byParticipant: Record<string, number | null>;
    eligibleByParticipant: Record<string, number | null>;
    nonPrimaryByParticipant: Record<string, number | null>;
  };
  runtimesStarted: {
    total: number;
    byParticipant: Record<string, boolean | null>;
  };
  runtimesPrepared: {
    totalSessions: number;
    totalRuns: number;
    sessionsByParticipant: Record<string, number | null>;
    runsByParticipant: Record<string, number | null>;
  };
  participantsWithAttention: {
    total: number;
    byParticipant: Record<string, boolean | null>;
  };
  generatedAt: string;
  sourceMaxUpdatedAt: string | null;
};
