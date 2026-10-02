import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mapParticipantRow } from "./official-control-panel-participants-service";
import type {
  ActivitySelectionStage,
  WorkMapActivityState,
  WorkMapFinding,
  WorkMapProgressActivity,
  WorkMapProgressStatus,
  WorkMapProgressView,
} from "./official-control-panel-workmap-progress.types";

type Row = Record<string, unknown>;

type WorkMapProgressInput = {
  client: SupabaseClient;
  caseId: string;
  participantId?: string | null;
  userId?: string | null;
  profileId?: string | null;
  activityPage?: number;
  activityPageSize?: number;
  activitySearch?: string | null;
  activityStatus?: string | null;
  activitySelectionStatus?: string | null;
};

type NormalizedParticipant = {
  id: string;
  caseId: string;
  userId: string | null;
  label: string | null;
  status: string | null;
  updatedAt: string | null;
};

type NormalizedProfile = {
  id: string;
  label: string | null;
  status: string | null;
  isPrimary: boolean;
  updatedAt: string | null;
  metadata: Row | null;
};

const STALE_AFTER_MS = 1000 * 60 * 15;

export async function buildWorkMapProgressView({
  client,
  caseId,
  participantId: requestedParticipantId = null,
  userId: requestedUserId = null,
  profileId: requestedProfileId = null,
  activityPage = 1,
  activityPageSize = 100,
  activitySearch = null,
  activityStatus = null,
  activitySelectionStatus = null,
}: WorkMapProgressInput): Promise<WorkMapProgressView> {
  const generatedAt = new Date().toISOString();
  const caseRow = await maybeSingle<Row>(
    client
      .from("sesiones_llenado")
      .select(
        "id, display_name, estado_actual, updated_at, client_company_id, client_relationship_id",
      )
      .eq("id", caseId),
  );

  if (!caseRow) {
    return emptyView(caseId, generatedAt, [
      finding({
        caseId,
        participantId: requestedParticipantId,
        code: "case_not_found",
        severity: "critical",
        scope: "case",
        source: "sesiones_llenado",
        detectedAt: generatedAt,
        title: "Caso no encontrado",
        detail: "El caso solicitado no existe en la fuente consultada.",
        nextAction: "Resolver el caso real antes de abrir el Panel.",
      }),
    ]);
  }

  const companyId = textOrNull(caseRow.client_company_id);
  const relationshipId = textOrNull(caseRow.client_relationship_id);
  const [companyRow, relationshipRow, participants] = await Promise.all([
    companyId ? loadCompany(client, companyId) : Promise.resolve(null),
    relationshipId
      ? maybeSingle<Row>(
          client
            .from("client_relationships")
            .select("id, client_company_id, display_name, status, updated_at")
            .eq("id", relationshipId),
        )
      : Promise.resolve(null),
    loadParticipants(client, caseId),
  ]);

  const participant = resolveParticipant(
    participants,
    requestedParticipantId,
    caseId,
    requestedUserId,
  );
  const participantUser = participant?.userId
    ? await loadUser(client, participant.userId)
    : null;
  const declaredPosition = participant
    ? await loadDeclaredPosition(client, participant.id, participantUser)
    : null;
  const profiles = participant
    ? await loadProfiles(client, participant.id)
    : [];
  const profile = resolveProfile(profiles, requestedProfileId);
  const participantSnapshot = participant
    ? await maybeSingle<Row>(
        client
          .from("case_participant_workmap_snapshots")
          .select(
            "id, workmap_version, workmap_json, status, updated_at, created_at",
          )
          .eq("case_id", caseId)
          .eq("case_participant_id", participant.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(1),
      )
    : null;
  const canonicalSnapshot =
    participant && profile
      ? await maybeSingle<Row>(
          client
            .from("activity_selection_workmap_snapshot")
            .select(
              "id, snapshot_version, workmap_json, workmap_hash, prepared_at, policy_projection, role_runtime_session_id",
            )
            .eq("case_id", caseId)
            .eq("participant_id", participant.id)
            .eq("profile_id", profile.id)
            .order("prepared_at", { ascending: false })
            .limit(1),
        )
      : null;
  const effectiveSelection =
    participant && profile
      ? await maybeSingle<Row>(
          client
            .from("activity_selection_results")
            .select(
              "id, role_runtime_session_id, policy_version, selection_mode, result_version, lifecycle_state, eligible_count, selected_count, non_primary_context_count, workmap_coverage_gap, trace_completeness_status, replay_status, effective_from, updated_at",
            )
            .eq("case_id", caseId)
            .eq("participant_id", participant.id)
            .eq("profile_id", profile.id)
            .eq("lifecycle_state", "effective")
            .order("effective_from", { ascending: false })
            .limit(1),
        )
      : null;

  const linkedSessionId =
    textOrNull(effectiveSelection?.role_runtime_session_id) ??
    textOrNull(canonicalSnapshot?.role_runtime_session_id) ??
    (profile ? await loadLinkedRuntimeSessionId(client, profile.id) : null);
  const runtimeRuns = linkedSessionId
    ? await loadRuntimeRuns(client, linkedSessionId)
    : [];
  const latestRuntimeRun = runtimeRuns[0] ?? null;
  const startedRuntimeRuns = runtimeRuns.filter(isStartedRuntimeRun);
  const runtimeRunByActivityId = new Map(
    runtimeRuns.flatMap((row): Array<[string, Row]> => {
      const activityId = textOrNull(row.activity_id);
      return activityId && textOrNull(row.activity_runtime_run_id)
        ? [[activityId, row]]
        : [];
    }),
  );
  const experienceEvents = participant
    ? await loadExperienceEvents(client, {
        caseId,
        internalUserId: participant.userId,
        authUserId: textOrNull(participantUser?.auth_user_id),
      })
    : [];
  const latestScreen = experienceEvents[0] ?? null;
  const workmapJson = objectOrNull(
    participantSnapshot?.workmap_json ?? canonicalSnapshot?.workmap_json,
  );
  const workMapProfileLabel = resolveWorkMapProfileLabel(workmapJson);
  const resultItems = effectiveSelection?.id
    ? await loadResultItems(client, String(effectiveSelection.id))
    : [];
  const allActivities = projectActivities({
    workmap: workmapJson,
    canonicalSnapshot,
    resultItems,
    profileId: profile?.id ?? null,
    roleRuntimeSessionId: linkedSessionId,
    runtimeRunByActivityId,
    hasEffectiveSelection: Boolean(effectiveSelection),
  });
  const activityPageResult = pageActivities(allActivities, {
    page: activityPage,
    pageSize: activityPageSize,
    search: activitySearch,
    status: activityStatus,
    selectionStatus: activitySelectionStatus,
  });
  const activities = activityPageResult.activities;
  const selectionStage = resolveSelectionStage({
    workmapSaved: Boolean(participantSnapshot),
    profile,
    canonicalSnapshot,
    effectiveSelection,
  });
  const profileTrace = buildProfileTrace({
    profile,
    participantSnapshot,
    workmapJson,
  });
  const findings = buildFindings({
    caseId,
    participantId: participant?.id ?? requestedParticipantId,
    generatedAt,
    companyId,
    relationshipId,
    companyRow,
    relationshipRow,
    participant,
    participantSnapshot,
    profile,
    canonicalSnapshot,
    effectiveSelection,
    latestScreen,
  });
  const lastUpdatedAt = latestIso([
    textOrNull(caseRow.updated_at),
    textOrNull(companyRow?.updated_at),
    textOrNull(relationshipRow?.updated_at),
    participant?.updatedAt ?? null,
    textOrNull(participantUser?.updated_at),
    profile?.updatedAt ?? null,
    textOrNull(participantSnapshot?.updated_at),
    textOrNull(participantSnapshot?.created_at),
    textOrNull(canonicalSnapshot?.prepared_at),
    textOrNull(effectiveSelection?.effective_from),
    textOrNull(effectiveSelection?.updated_at),
    textOrNull(latestRuntimeRun?.updated_at),
    textOrNull(latestScreen?.occurred_at),
  ]);
  const status = resolveWorkMapProjectionStatus({
    hasWorkMap: Boolean(participantSnapshot || canonicalSnapshot),
    hasActivities: allActivities.length > 0,
    lastUpdatedAt,
    findings,
  });
  const scopeResolved = Boolean(
    companyId &&
      relationshipId &&
      companyRow &&
      relationshipRow &&
      relationshipRow.client_company_id === companyId &&
      participant,
  );
  const submitted = experienceEvents.some(
    (row) =>
      objectOrNull(row.metadata)?.domainEventType === "workmap_submitted",
  );

  return {
    caseId,
    company: { id: companyId, label: textOrNull(companyRow?.nombre) },
    engagement: {
      id: relationshipId,
      label: textOrNull(relationshipRow?.display_name),
      status: textOrNull(relationshipRow?.status),
    },
    diagnosticCase: {
      id: String(caseRow.id),
      label: textOrNull(caseRow.display_name),
      statusLabel: caseStatusLabel(textOrNull(caseRow.estado_actual), selectionStage),
    },
    user: {
      id: participant?.userId ?? null,
      label:
        textOrNull(participantUser?.nombre) ??
        participant?.label ??
        textOrNull(participantUser?.email),
      matchedGaby: false,
    },
    role: {
      id: profile?.id ?? null,
      label: profile?.label ?? workMapProfileLabel,
    },
    participant: {
      id: participant?.id ?? null,
      userId: participant?.userId ?? null,
      authUserId: textOrNull(participantUser?.auth_user_id),
      label:
        textOrNull(participantUser?.nombre) ??
        participant?.label ??
        textOrNull(participantUser?.email),
      status: participant?.status ?? null,
      declaredPosition,
    },
    functionalProfile: {
      id: profile?.id ?? null,
      label: profile?.label ?? workMapProfileLabel,
      status: profile ? "materialized" : "pending_materialization",
    },
    profileTrace,
    selection: {
      stage: selectionStage,
      stageLabel: selectionStageLabel(selectionStage),
      policyVersion:
        textOrNull(effectiveSelection?.policy_version) ??
        policyVersion(canonicalSnapshot),
      selectionMode: textOrNull(effectiveSelection?.selection_mode),
      maxPrimaryAllowed:
        maxPrimaryAllowed(canonicalSnapshot) ??
        (effectiveSelection ? 8 : null),
      eligibleCount:
        numberOrNull(effectiveSelection?.eligible_count) ??
        countEligiblePolicyItems(canonicalSnapshot),
      selectedPrimaryCount: numberOrNull(effectiveSelection?.selected_count),
      nonPrimaryContextCount: numberOrNull(
        effectiveSelection?.non_primary_context_count,
      ),
      traceCompletenessStatus: textOrNull(
        effectiveSelection?.trace_completeness_status,
      ),
      replayStatus: textOrNull(effectiveSelection?.replay_status),
      producerStatus: canonicalSnapshot || effectiveSelection ? "available" : "pending",
      blockingReason:
        participantSnapshot && profile && !canonicalSnapshot
          ? "activity_selection_snapshot_pending"
          : null,
      nextProducerRequired:
        selectionStage === "eligibility_pending"
          ? "Cálculo canónico de elegibilidad"
          : null,
    },
    functionalSession: {
      id: linkedSessionId,
      status: linkedSessionId ? "active" : "not_started",
    },
    runtime: {
      runId: textOrNull(latestRuntimeRun?.activity_runtime_run_id),
      status:
        startedRuntimeRuns.length > 0
          ? "active"
          : runtimeRuns.length > 0
            ? "prepared"
            : "not_started",
      reason: runtimeRuns.length > 0
        ? null
        : !profile
          ? "Perfil funcional pendiente de materializacion"
          : !effectiveSelection
            ? "Seleccion efectiva pendiente"
            : !linkedSessionId
              ? "Sesion funcional aun no iniciada"
              : "Runtime aun no iniciado",
      preparedRunCount: runtimeRuns.length,
      startedRunCount: startedRuntimeRuns.length,
    },
    workmap: {
      status,
      stateLabel: workmapStatusLabel(status, selectionStage),
      source: participantSnapshot
        ? "case_participant_workmap_snapshots"
        : canonicalSnapshot
          ? "activity_selection_workmap_snapshot"
          : "absent",
      snapshotId: textOrNull(participantSnapshot?.id ?? canonicalSnapshot?.id),
      version:
        textOrNull(participantSnapshot?.workmap_version) ??
        numberOrNull(canonicalSnapshot?.snapshot_version),
      hash: textOrNull(canonicalSnapshot?.workmap_hash),
      lastUpdatedAt:
        textOrNull(participantSnapshot?.updated_at) ??
        textOrNull(canonicalSnapshot?.prepared_at),
      responsibilitiesCount: countArray(workmapJson?.responsibilities),
      activitiesCount: countWorkMapActivities(workmapJson),
      created: Boolean(participantSnapshot || canonicalSnapshot),
      saved: Boolean(participantSnapshot),
      submitted,
      accepted: Boolean(effectiveSelection),
    },
    coverage: {
      eligibleCount: numberOrNull(effectiveSelection?.eligible_count),
      selectedCount: numberOrNull(effectiveSelection?.selected_count),
      nonPrimaryContextCount: numberOrNull(
        effectiveSelection?.non_primary_context_count,
      ),
      workmapCoverageGap:
        typeof effectiveSelection?.workmap_coverage_gap === "boolean"
          ? effectiveSelection.workmap_coverage_gap
          : null,
      coverageLabel: coverageLabel(
        effectiveSelection,
        allActivities.length,
        canonicalSnapshot,
      ),
    },
    activities,
    activitiesPage: {
      page: activityPageResult.page,
      pageSize: activityPageResult.pageSize,
      total: activityPageResult.total,
      rendered: activities.length,
      search: activitySearch,
      status: activityStatus,
      selectionStatus: activitySelectionStatus,
    },
    gaps: findings.map((item) => item.code),
    findings,
    lastScreen: {
      screenKey: textOrNull(latestScreen?.screen_key),
      status: textOrNull(latestScreen?.screen_status),
      occurredAt: textOrNull(latestScreen?.occurred_at),
    },
    lastInteractionAt: textOrNull(latestScreen?.occurred_at),
    nextStep: deriveNextStep({
      workmapSaved: Boolean(participantSnapshot),
      activityCount: activities.length,
      hasEffectiveSelection: Boolean(effectiveSelection),
      hasProfile: Boolean(profile),
      hasEligibility: Boolean(canonicalSnapshot),
      hasRuntime: runtimeRuns.length > 0,
      profileLabel: profile?.label ?? null,
    }),
    lastUpdatedAt,
    generatedAt,
    meta: {
      scopeResolved,
      projectionStatus: scopeResolved ? status : "partial",
      missingSources: findings.map((item) => item.code),
      generatedAt,
      sourceMaxUpdatedAt: lastUpdatedAt,
      staleThresholdMs: STALE_AFTER_MS,
      refreshStartedAt: generatedAt,
      refreshCompletedAt: generatedAt,
    },
  };
}

export function deriveNextStep(input: {
  workmapSaved: boolean;
  activityCount: number;
  hasEffectiveSelection: boolean;
  hasProfile: boolean;
  hasEligibility: boolean;
  hasRuntime: boolean;
  profileLabel: string | null;
}): string | null {
  if (!input.workmapSaved) return "Guardar el WorkMap del participante";
  if (input.activityCount === 0) return "Completar actividades del WorkMap";
  if (!input.hasProfile) return "Materializar el perfil funcional";
  if (!input.hasEligibility) {
    return `Preparar elegibilidad de actividades primarias del perfil ${
      input.profileLabel ?? "funcional"
    }`;
  }
  if (!input.hasEffectiveSelection) {
    return `Revisar y confirmar las actividades primarias del perfil ${
      input.profileLabel ?? "funcional"
    }`;
  }
  if (!input.hasRuntime) return "Iniciar la sesion funcional cuando corresponda";
  return null;
}

function emptyView(
  caseId: string,
  generatedAt: string,
  findings: WorkMapFinding[],
): WorkMapProgressView {
  return {
    caseId,
    company: { id: null, label: null },
    engagement: { id: null, label: null, status: null },
    diagnosticCase: { id: caseId, label: null, statusLabel: null },
    user: { id: null, label: null, matchedGaby: false },
    role: { id: null, label: null },
    participant: {
      id: null,
      userId: null,
      authUserId: null,
      label: null,
      status: null,
      declaredPosition: null,
    },
    functionalProfile: {
      id: null,
      label: null,
      status: "pending_materialization",
    },
    profileTrace: {
      profileStatus: "blocked",
      sourceWorkmapId: null,
      workmapVersion: null,
      responsibilitiesCount: null,
      activitiesCount: null,
      confirmationStatus: null,
    },
    selection: {
      stage: "blocked",
      stageLabel: "Bloqueada por scope no resuelto",
      policyVersion: null,
      selectionMode: null,
      maxPrimaryAllowed: null,
      eligibleCount: null,
      selectedPrimaryCount: null,
      nonPrimaryContextCount: null,
      traceCompletenessStatus: null,
      replayStatus: null,
      producerStatus: "pending",
      blockingReason: "case_scope_not_resolved",
      nextProducerRequired: null,
    },
    functionalSession: { id: null, status: "not_started" },
    runtime: {
      runId: null,
      status: "not_started",
      reason: "El scope factual no está resuelto",
    },
    workmap: {
      status: "partial",
      stateLabel: "Partial",
      source: "absent",
      snapshotId: null,
      version: null,
      hash: null,
      lastUpdatedAt: null,
      responsibilitiesCount: null,
      activitiesCount: null,
      created: false,
      saved: false,
      submitted: false,
      accepted: false,
    },
    coverage: {
      eligibleCount: null,
      selectedCount: null,
      nonPrimaryContextCount: null,
      workmapCoverageGap: null,
      coverageLabel: "WorkMap aún no materializado",
    },
    activities: [],
    activitiesPage: {
      page: 1,
      pageSize: 20,
      total: 0,
      rendered: 0,
      search: null,
      status: null,
      selectionStatus: null,
    },
    gaps: findings.map((item) => item.code),
    findings,
    lastScreen: { screenKey: null, status: null, occurredAt: null },
    lastInteractionAt: null,
    nextStep: null,
    lastUpdatedAt: null,
    generatedAt,
    meta: {
      scopeResolved: false,
      projectionStatus: "not_found",
      missingSources: findings.map((item) => item.code),
      generatedAt,
      sourceMaxUpdatedAt: null,
      staleThresholdMs: STALE_AFTER_MS,
      refreshStartedAt: generatedAt,
      refreshCompletedAt: generatedAt,
    },
  };
}

async function loadParticipants(
  client: SupabaseClient,
  caseId: string,
): Promise<NormalizedParticipant[]> {
  const modern = await tryList<Row>(
    client
      .from("case_participants")
      .select(
        "id, case_id, usuario_id, participant_name, participant_email, status, updated_at",
      )
      .eq("case_id", caseId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  );
  if (modern.ok) {
    return modern.data.map(mapWorkMapParticipantRow);
  }

  const legacy = await tryList<Row>(
    client
      .from("case_participants")
      .select(
        "id, case_id, user_id, display_label, participation_status, updated_at",
      )
      .eq("case_id", caseId)
      .eq("enabled", true)
      .order("created_at", { ascending: true }),
  );
  return legacy.ok
    ? legacy.data.map(mapWorkMapParticipantRow)
    : [];
}

function mapWorkMapParticipantRow(row: Row): NormalizedParticipant {
  const mapped = mapParticipantRow(row);
  return {
    id: mapped.id,
    caseId: mapped.caseId,
    userId: textOrNull(mapped.userId),
    label: textOrNull(mapped.displayLabel),
    status: textOrNull(mapped.participationStatus),
    updatedAt: textOrNull(row.updated_at),
  };
}

async function loadCompany(
  client: SupabaseClient,
  companyId: string,
): Promise<Row | null> {
  const modern = await maybeSingle<Row>(
    client
      .from("empresas")
      .select("id, nombre, sector, updated_at")
      .eq("id", companyId),
  );
  if (modern) return modern;
  return maybeSingle<Row>(
    client.from("empresas").select("id, nombre, sector").eq("id", companyId),
  );
}

async function loadUser(
  client: SupabaseClient,
  userId: string,
): Promise<Row | null> {
  const modern = await maybeSingle<Row>(
    client
      .from("usuarios")
      .select("id, auth_user_id, nombre, email, rol_declarado")
      .eq("id", userId),
  );
  if (modern) return modern;
  return maybeSingle<Row>(
    client
      .from("usuarios")
      .select("id, auth_user_id, nombre, email, rol_declarado")
      .eq("id", userId),
  );
}

async function loadDeclaredPosition(
  client: SupabaseClient,
  participantId: string,
  user: Row | null,
): Promise<string | null> {
  const position = await maybeSingle<Row>(
    client
      .from("case_participant_positions")
      .select("declared_title, updated_at")
      .eq("case_participant_id", participantId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1),
  );
  if (!position) {
    const fallback = await tryList<Row>(
      client
        .from("case_participant_positions")
        .select("declared_title")
        .eq("case_participant_id", participantId)
        .eq("status", "active")
        .limit(1),
    );
    if (fallback.ok) {
      return (
        textOrNull(fallback.data[0]?.declared_title) ??
        textOrNull(user?.rol_declarado)
      );
    }
  }
  return (
    textOrNull(position?.declared_title) ?? textOrNull(user?.rol_declarado)
  );
}

async function loadProfiles(
  client: SupabaseClient,
  participantId: string,
): Promise<NormalizedProfile[]> {
  const modern = await tryList<Row>(
    client
      .from("case_participant_profiles")
      .select(
        "id, role_label, profile_status, is_primary, metadata, updated_at, created_at",
      )
      .eq("case_participant_id", participantId)
      .eq("profile_status", "active")
      .order("created_at", { ascending: true }),
  );
  if (modern.ok) {
    return modern.data.map((row) => ({
      id: String(row.id),
      label: textOrNull(row.role_label),
      status: textOrNull(row.profile_status),
      isPrimary: row.is_primary === true,
      updatedAt: textOrNull(row.updated_at),
      metadata: objectOrNull(row.metadata),
    }));
  }

  const legacy = await tryList<Row>(
    client
      .from("case_participant_profiles")
      .select("id, display_label, resolution_status, updated_at, created_at")
      .eq("case_participant_id", participantId)
      .eq("enabled", true)
      .order("created_at", { ascending: true }),
  );
  return legacy.ok
    ? legacy.data.map((row) => ({
        id: String(row.id),
        label: textOrNull(row.display_label),
        status: textOrNull(row.resolution_status),
        isPrimary: false,
        updatedAt: textOrNull(row.updated_at),
        metadata: null,
      }))
    : [];
}

async function loadLinkedRuntimeSessionId(
  client: SupabaseClient,
  profileId: string,
): Promise<string | null> {
  const link = await maybeSingle<Row>(
    client
      .from("case_profile_runtime_session_links")
      .select("role_runtime_session_id, linked_at")
      .eq("case_participant_profile_id", profileId)
      .eq("status", "active")
      .order("linked_at", { ascending: false })
      .limit(1),
  );
  return textOrNull(link?.role_runtime_session_id);
}

async function loadRuntimeRuns(
  client: SupabaseClient,
  roleRuntimeSessionId: string,
): Promise<Row[]> {
  const result = await tryList<Row>(
    client
      .from("activity_runtime_run")
      .select(
        "activity_runtime_run_id, activity_id, role_runtime_session_id, updated_at, readiness_state, state",
      )
      .eq("role_runtime_session_id", roleRuntimeSessionId)
      .order("updated_at", { ascending: false }),
  );
  return result.ok ? result.data : [];
}

function isStartedRuntimeRun(row: Row): boolean {
  const state = textOrNull(row.state);
  const readiness = textOrNull(row.readiness_state);
  return !(
    state === "initialized" &&
    (readiness === "not_started" || readiness === null)
  );
}

async function loadExperienceEvents(
  client: SupabaseClient,
  input: {
    caseId: string;
    internalUserId: string | null;
    authUserId: string | null;
  },
): Promise<Row[]> {
  const userIds = [input.internalUserId, input.authUserId].filter(
    (value): value is string => Boolean(value),
  );
  if (userIds.length === 0) return [];
  const query = client
    .from("experience_screen_event")
    .select(
      "screen_key, screen_status, event_type, occurred_at, request_id, metadata",
    )
    .eq("case_id", input.caseId)
    .in("user_id", userIds)
    .order("occurred_at", { ascending: false })
    .limit(100);
  const result = await tryList<Row>(query);
  return result.ok ? result.data : [];
}

async function loadResultItems(
  client: SupabaseClient,
  resultId: string,
): Promise<Row[]> {
  const result = await tryList<Row>(
    client
      .from("activity_selection_result_items")
      .select(
        "id, result_id, activity_id, display_label, classification, selected_slot, source_reference, eligibility_status, selection_status, selection_reason_text, non_primary_context_status",
      )
      .eq("result_id", resultId)
      .order("selected_slot", { ascending: true, nullsFirst: false }),
  );
  return result.ok ? result.data : [];
}

function projectActivities(input: {
  workmap: Row | null;
  canonicalSnapshot: Row | null;
  resultItems: Row[];
  profileId: string | null;
  roleRuntimeSessionId: string | null;
  runtimeRunByActivityId: Map<string, Row>;
  hasEffectiveSelection: boolean;
}): WorkMapProgressActivity[] {
  const captured = activitiesFromWorkMap(input.workmap);
  const policyItems = policyItemsById(input.canonicalSnapshot);
  const resultItems = new Map(
    input.resultItems.map((row) => [String(row.activity_id), row]),
  );
  return captured.map((activity) => {
    const resultItem = resultItems.get(activity.id) ?? null;
    const policyItem = policyItems.get(activity.id) ?? null;
    const classification = normalizeActivityClassification(
      textOrNull(resultItem?.classification),
    );
    const runtimeRun = input.runtimeRunByActivityId.get(activity.id) ?? null;
    const runtimeRunId = textOrNull(runtimeRun?.activity_runtime_run_id);
    const state = activityState({
      hasEffectiveSelection: input.hasEffectiveSelection,
      classification,
      policyItem,
      runtimeRunId,
    });
    return {
      id: activity.id,
      label: textOrNull(resultItem?.display_label) ?? activity.label,
      state,
      classification:
        classification === "primary" || classification === "non-primary"
          ? classification
          : "pending",
      selectedSlot: numberOrNull(resultItem?.selected_slot),
      sourceReference:
        textOrNull(resultItem?.source_reference) ??
        activity.sourceWorkmapRecordId,
      sourceWorkmapRecordId:
        textOrNull(resultItem?.source_reference) ??
        activity.sourceWorkmapRecordId,
      selectionResultId: textOrNull(resultItem?.result_id),
      selectionResultItemId: textOrNull(resultItem?.id),
      eligible: resultItem
        ? textOrNull(resultItem.eligibility_status) !== "ineligible" &&
          textOrNull(resultItem.eligibility_status) !== "unavailable"
        : policyItem
          ? policyItem.eligible !== false
          : null,
      selectedPrimary: classification === "primary",
      selectedNonPrimary: classification === "non-primary",
      effectiveSelection: Boolean(resultItem && input.hasEffectiveSelection),
      functionalProfileId: input.profileId,
      roleRuntimeSessionId: input.roleRuntimeSessionId,
      runtimeRunId,
      runtimeRunState: textOrNull(runtimeRun?.state),
      runtimeRunReadinessState: textOrNull(runtimeRun?.readiness_state),
    };
  });
}

function normalizeActivityClassification(
  classification: string | null,
): WorkMapProgressActivity["classification"] {
  if (classification === "primary") return "primary";
  if (classification === "non_primary" || classification === "non-primary") {
    return "non-primary";
  }
  if (classification === "unavailable") return "unavailable";
  return "pending";
}

function activitiesFromWorkMap(
  workmap: Row | null,
): Array<{ id: string; label: string; sourceWorkmapRecordId: string | null }> {
  if (!Array.isArray(workmap?.responsibilities)) return [];
  const activities: Array<{
    id: string;
    label: string;
    sourceWorkmapRecordId: string | null;
  }> = [];
  for (const responsibilityRaw of workmap.responsibilities) {
    const responsibility = objectOrNull(responsibilityRaw);
    if (!Array.isArray(responsibility?.activities)) continue;
    for (const activityRaw of responsibility.activities) {
      const activity = objectOrNull(activityRaw);
      const id = textOrNull(activity?.id);
      const label = textOrNull(activity?.text);
      if (!id || !label) continue;
      activities.push({
        id,
        label,
        sourceWorkmapRecordId: id,
      });
    }
  }
  return activities;
}

function policyItemsById(snapshot: Row | null): Map<string, Row> {
  const projection = objectOrNull(snapshot?.policy_projection);
  if (!Array.isArray(projection?.items)) return new Map();
  const items = projection.items.flatMap((raw): Array<[string, Row]> => {
    const item = objectOrNull(raw);
    const id = textOrNull(item?.activity_id);
    return id && item ? [[id, item]] : [];
  });
  return new Map(items);
}

function activityState(input: {
  hasEffectiveSelection: boolean;
  classification: WorkMapProgressActivity["classification"];
  policyItem: Row | null;
  runtimeRunId: string | null;
}): WorkMapActivityState {
  if (input.classification === "primary" && input.runtimeRunId) {
    return "runtime_prepared";
  }
  if (input.classification === "primary") return "selected_primary";
  if (input.classification === "non-primary") return "selected_non_primary";
  if (input.hasEffectiveSelection) return "not_selected";
  if (input.policyItem) return "eligible";
  return "awaiting_effective_selection";
}

function pageActivities(
  activities: WorkMapProgressActivity[],
  input: {
    page: number;
    pageSize: number;
    search: string | null;
    status: string | null;
    selectionStatus: string | null;
  },
): {
  activities: WorkMapProgressActivity[];
  page: number;
  pageSize: number;
  total: number;
} {
  const page = Math.max(1, Math.floor(input.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(input.pageSize || 100)));
  const search = input.search?.trim().toLowerCase() ?? "";
  const filtered = activities.filter((activity) => {
    if (search && !activity.label.toLowerCase().includes(search)) return false;
    if (input.status && activity.state !== input.status) return false;
    if (
      input.selectionStatus &&
      activity.classification !== input.selectionStatus
    ) {
      return false;
    }
    return true;
  });
  const start = (page - 1) * pageSize;
  return {
    activities: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  };
}

function resolveSelectionStage(input: {
  workmapSaved: boolean;
  profile: NormalizedProfile | null;
  canonicalSnapshot: Row | null;
  effectiveSelection: Row | null;
}): ActivitySelectionStage {
  if (input.effectiveSelection) return "effective";
  if (!input.workmapSaved) return "not_started";
  if (!input.profile) return "awaiting_profile_confirmation";
  if (!input.canonicalSnapshot) return "eligibility_pending";
  return "awaiting_primary_selection";
}

function selectionStageLabel(stage: ActivitySelectionStage): string {
  const labels: Record<ActivitySelectionStage, string> = {
    not_started: "No iniciada",
    awaiting_profile_confirmation: "Perfil pendiente",
    eligibility_pending: "Elegibilidad pendiente",
    eligibility_computed: "Elegibilidad calculada",
    awaiting_primary_selection: "Esperando seleccion primaria",
    selection_saved: "Seleccion guardada",
    selection_rejected: "Seleccion rechazada",
    effective: "Seleccion efectiva",
    blocked: "Bloqueada",
  };
  return labels[stage];
}

function workmapStatusLabel(
  status: WorkMapProgressStatus,
  selectionStage: ActivitySelectionStage,
): string {
  if (selectionStage === "effective") return "Ready";
  if (status === "stale") return "Stale";
  if (
    selectionStage === "eligibility_pending" ||
    selectionStage === "awaiting_primary_selection"
  ) {
    return "Partial";
  }
  return status === "ready" ? "Ready" : "Partial";
}

function caseStatusLabel(
  rawStatus: string | null,
  selectionStage: ActivitySelectionStage,
): string | null {
  if (selectionStage === "effective") return "Seleccion primaria efectiva";
  if (
    rawStatus === "capa_1_triple" ||
    selectionStage === "eligibility_pending" ||
    selectionStage === "awaiting_primary_selection"
  ) {
    return "WorkMap guardado; seleccion primaria pendiente";
  }
  return rawStatus;
}

function buildProfileTrace(input: {
  profile: NormalizedProfile | null;
  participantSnapshot: Row | null;
  workmapJson: Row | null;
}): WorkMapProgressView["profileTrace"] {
  const metadata = input.profile?.metadata ?? null;
  return {
    profileStatus: profileTraceStatus(input.profile),
    sourceWorkmapId:
      textOrNull(metadata?.workmap_snapshot_id) ??
      textOrNull(input.participantSnapshot?.id),
    workmapVersion:
      textOrNull(metadata?.workmap_version) ??
      textOrNull(input.participantSnapshot?.workmap_version),
    responsibilitiesCount:
      numberOrNull(metadata?.responsibilities_count) ??
      countArray(input.workmapJson?.responsibilities),
    activitiesCount:
      numberOrNull(metadata?.activities_count) ??
      countWorkMapActivities(input.workmapJson),
    confirmationStatus: textOrNull(input.profile?.status),
  };
}

function profileTraceStatus(
  profile: NormalizedProfile | null,
): NonNullable<WorkMapProgressView["profileTrace"]>["profileStatus"] {
  if (!profile) return "awaiting_confirmation";
  if (profile.status === "active" || profile.status === "confirmed") {
    return "confirmed";
  }
  if (profile.status === "blocked" || profile.status === "rejected") {
    return "blocked";
  }
  return "candidate";
}

function policyVersion(snapshot: Row | null): string | null {
  const projection = objectOrNull(snapshot?.policy_projection);
  return (
    textOrNull(projection?.policyVersion) ??
    textOrNull(projection?.policy_version) ??
    textOrNull(snapshot?.snapshot_version)
  );
}

function maxPrimaryAllowed(snapshot: Row | null): number | null {
  const projection = objectOrNull(snapshot?.policy_projection);
  return (
    numberOrNull(projection?.maxPrimaryAllowed) ??
    numberOrNull(projection?.max_primary_allowed)
  );
}

function countEligiblePolicyItems(snapshot: Row | null): number | null {
  const projection = objectOrNull(snapshot?.policy_projection);
  if (!Array.isArray(projection?.items)) return null;
  return projection.items.filter((raw) => objectOrNull(raw)?.eligible !== false)
    .length;
}

function buildFindings(input: {
  caseId: string;
  participantId: string | null;
  generatedAt: string;
  companyId: string | null;
  relationshipId: string | null;
  companyRow: Row | null;
  relationshipRow: Row | null;
  participant: NormalizedParticipant | null;
  participantSnapshot: Row | null;
  profile: NormalizedProfile | null;
  canonicalSnapshot: Row | null;
  effectiveSelection: Row | null;
  latestScreen: Row | null;
}): WorkMapFinding[] {
  const findings: WorkMapFinding[] = [];
  const add = (
    code: string,
    severity: WorkMapFinding["severity"],
    scope: WorkMapFinding["scope"],
    source: string,
    title: string,
    detail: string,
    nextAction: string,
  ) =>
    findings.push(
      finding({
        caseId: input.caseId,
        participantId: input.participantId,
        code,
        severity,
        scope,
        source,
        detectedAt: input.generatedAt,
        title,
        detail,
        nextAction,
      }),
    );

  if (!input.companyId || !input.companyRow) {
    add(
      "company_scope_missing",
      "critical",
      "case",
      "empresas",
      "Empresa del caso ausente",
      "El caso no resuelve una empresa cliente válida.",
      "Corregir el vínculo factual del caso con la empresa.",
    );
  }
  if (
    !input.relationshipId ||
    !input.relationshipRow ||
    input.relationshipRow.client_company_id !== input.companyId
  ) {
    add(
      "engagement_scope_missing",
      "critical",
      "case",
      "client_relationships",
      "Engagement del caso ausente",
      "El engagement no pertenece a la misma empresa y caso.",
      "Corregir el vínculo factual del engagement.",
    );
  }
  if (!input.participant) {
    add(
      "participant_scope_required",
      "warning",
      "participant",
      "case_participants",
      "Participante no resuelta",
      "El Panel necesita un participante activo e inequívoco.",
      "Seleccionar una participante activa del caso.",
    );
  }
  if (input.participant && !input.participantSnapshot) {
    add(
      "participant_workmap_snapshot_missing",
      "warning",
      "workmap",
      "case_participant_workmap_snapshots",
      "WorkMap aún no guardado",
      "No existe un WorkMap activo para esta participante y caso.",
      "Guardar el WorkMap desde la sesión de la participante.",
    );
  }
  if (input.participantSnapshot && !input.profile) {
    add(
      "functional_profile_missing",
      "warning",
      "participant",
      "case_participant_profiles",
      "Perfil funcional pendiente",
      "El puesto declarado no se usa como sustituto del perfil funcional.",
      "Materializar el perfil funcional desde evidencia WorkMap.",
    );
  }
  if (
    input.participantSnapshot &&
    !input.canonicalSnapshot &&
    !input.effectiveSelection
  ) {
    add(
      "canonical_activity_selection_snapshot_missing",
      "warning",
      "workmap",
      "activity_selection_workmap_snapshot",
      "Selección canónica pendiente",
      "No existe snapshot canónico de selección para este WorkMap.",
      "Preparar la selección canónica de actividades.",
    );
  }
  if (input.participantSnapshot && !input.effectiveSelection) {
    add(
      "activity_selection_effective_result_missing",
      "warning",
      "workmap",
      "activity_selection_results",
      "Selección efectiva pendiente",
      "Las actividades están capturadas, pero la selección aún no es efectiva.",
      "Completar o confirmar la selección efectiva de actividades.",
    );
  }
  if (input.participant && !input.latestScreen && !input.effectiveSelection) {
    add(
      "last_screen_missing",
      "info",
      "experience",
      "experience_screen_event",
      "Instrumentación de última pantalla ausente",
      "No existe un evento real de pantalla para esta participante.",
      "Registrar el próximo acceso o guardado real de WorkMap.",
    );
  }
  return findings;
}

function finding(input: {
  caseId: string;
  participantId: string | null;
  code: string;
  severity: WorkMapFinding["severity"];
  scope: WorkMapFinding["scope"];
  source: string;
  detectedAt: string;
  title: string;
  detail: string;
  nextAction: string;
}): WorkMapFinding {
  return {
    findingId: [
      input.caseId,
      input.participantId ?? "case",
      input.code,
    ].join(":"),
    code: input.code,
    severity: input.severity,
    scope: input.scope,
    source: input.source,
    detectedAt: input.detectedAt,
    status: "active",
    recommendedNextAction: input.nextAction,
    title: input.title,
    detail: input.detail,
  };
}

function resolveParticipant(
  participants: NormalizedParticipant[],
  requestedId: string | null,
  caseId: string,
  requestedUserId: string | null,
): NormalizedParticipant | null {
  if (requestedId) {
    const matched = participants.find((row) => row.id === requestedId);
    if (matched) {
      return {
        ...matched,
        userId: matched.userId ?? requestedUserId,
      };
    }
    return {
        id: requestedId,
        caseId,
        userId: requestedUserId,
        label: null,
        status: "active",
        updatedAt: null,
      };
  }
  return participants.length === 1 ? participants[0] : null;
}

function resolveProfile(
  profiles: NormalizedProfile[],
  requestedId: string | null,
): NormalizedProfile | null {
  if (requestedId) return profiles.find((row) => row.id === requestedId) ?? null;
  return (
    profiles.find((row) => row.isPrimary) ??
    (profiles.length === 1 ? profiles[0] : null)
  );
}

export function resolveWorkMapProjectionStatus(input: {
  hasWorkMap: boolean;
  hasActivities: boolean;
  lastUpdatedAt: string | null;
  findings: WorkMapFinding[];
}): WorkMapProgressStatus {
  if (
    input.lastUpdatedAt &&
    Date.now() - Date.parse(input.lastUpdatedAt) > STALE_AFTER_MS
  ) {
    return "stale";
  }
  if (
    !input.hasWorkMap ||
    !input.hasActivities ||
    input.findings.some((item) => item.status === "active")
  ) {
    return "partial";
  }
  return "ready";
}

function coverageLabel(
  selection: Row | null,
  activityCount: number,
  canonicalSnapshot: Row | null,
): string {
  if (!selection) {
    return canonicalSnapshot
      ? `${activityCount} actividades capturadas; seleccion primaria pendiente`
      : `${activityCount} actividades capturadas; elegibilidad pendiente`;
  }
  const selected = numberOrNull(selection.selected_count);
  const eligible = numberOrNull(selection.eligible_count);
  return selected !== null && eligible !== null
    ? `${selected} de ${eligible} actividades seleccionadas`
    : `${activityCount} actividades con evidencia WorkMap`;
}

async function maybeSingle<T>(query: {
  maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
}): Promise<T | null> {
  try {
    const { data, error } = await query.maybeSingle();
    return error || !data ? null : (data as T);
  } catch {
    return null;
  }
}

async function tryList<T>(query: {
  then: PromiseLike<{ data: unknown; error: unknown }>["then"];
}): Promise<{ ok: true; data: T[] } | { ok: false }> {
  try {
    const { data, error } = await query;
    return error || !Array.isArray(data)
      ? { ok: false }
      : { ok: true, data: data as T[] };
  } catch {
    return { ok: false };
  }
}

function objectOrNull(value: unknown): Row | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function countArray(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}

function countWorkMapActivities(workmap: Row | null): number | null {
  if (!Array.isArray(workmap?.responsibilities)) return null;
  return workmap.responsibilities.reduce((count, raw) => {
    const responsibility = objectOrNull(raw);
    return (
      count +
      (Array.isArray(responsibility?.activities)
        ? responsibility.activities.length
        : 0)
    );
  }, 0);
}

function resolveWorkMapProfileLabel(workmap: Row | null): string | null {
  const selectedAreas = Array.isArray(workmap?.selectedAreas)
    ? workmap.selectedAreas.map(textOrNull).filter((item): item is string => Boolean(item))
    : [];
  if (selectedAreas.length === 1) return selectedAreas[0];
  if (selectedAreas.length > 1) return selectedAreas.join(", ");
  return (
    textOrNull(workmap?.functionalProfile) ??
    textOrNull(workmap?.functional_profile) ??
    textOrNull(workmap?.profileLabel) ??
    textOrNull(workmap?.roleLabel)
  );
}

function latestIso(values: Array<string | null>): string | null {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (!Number.isFinite(time) || time <= latestTime) continue;
    latest = value;
    latestTime = time;
  }
  return latest;
}

