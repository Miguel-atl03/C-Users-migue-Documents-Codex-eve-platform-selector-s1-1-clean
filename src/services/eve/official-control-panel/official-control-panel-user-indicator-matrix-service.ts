import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CaseUserIndicatorMatrix } from "./official-control-panel-user-indicator-matrix.types";

type Row = Record<string, unknown>;

export async function buildCaseUserIndicatorMatrix(input: {
  client: SupabaseClient;
  caseId: string;
}): Promise<CaseUserIndicatorMatrix> {
  const generatedAt = new Date().toISOString();
  const participants = await loadParticipants(input.client, input.caseId);
  const ids = participants.map((row) => row.participantId);

  const [workMaps, primarySelections, runtimeLinks, profileFacts] = await Promise.all([
    loadWorkMaps(input.client, input.caseId, ids),
    loadPrimarySelections(input.client, input.caseId, ids),
    loadRuntimeLinks(input.client, input.caseId, ids),
    loadProfileFacts(input.client, ids),
  ]);

  const attentionByParticipant: Record<string, boolean | null> = {};
  for (const id of ids) {
    const sourceResolved = workMaps.byParticipant[id] !== null;
    attentionByParticipant[id] = sourceResolved
      ? Boolean(
          workMaps.byParticipant[id] === false ||
            primarySelections.byParticipant[id] === null ||
            (primarySelections.byParticipant[id] !== null &&
              runtimeLinks.sessionsByParticipant[id] === 0),
        )
      : null;
  }

  return {
    users: participants.map((row) => ({
      participantId: row.participantId,
      displayName: row.displayName,
      declaredPosition: row.declaredPosition,
      declaredArea: workMaps.areaByParticipant[row.participantId] ?? null,
      functionalProfileId:
        profileFacts.byParticipant[row.participantId]?.profileId ?? null,
      functionalProfileLabel:
        profileFacts.byParticipant[row.participantId]?.profileLabel ??
        workMaps.areaByParticipant[row.participantId] ??
        null,
      functionalProfileStatus: profileFacts.byParticipant[row.participantId]
        ? "materialized"
        : "pending_materialization",
      confirmationStatus:
        profileFacts.byParticipant[row.participantId]?.confirmationStatus ??
        null,
      sourceWorkmapId:
        profileFacts.byParticipant[row.participantId]?.sourceWorkmapId ??
        workMaps.snapshotIdByParticipant[row.participantId] ??
        null,
      sourceWorkmapVersionId:
        profileFacts.byParticipant[row.participantId]?.sourceWorkmapVersionId ??
        workMaps.versionByParticipant[row.participantId] ??
        null,
      responsibilityCount:
        profileFacts.byParticipant[row.participantId]?.responsibilityCount ??
        workMaps.responsibilityCountByParticipant[row.participantId] ??
        null,
      activityCount:
        profileFacts.byParticipant[row.participantId]?.activityCount ??
        workMaps.activityCountByParticipant[row.participantId] ??
        null,
      eligibleActivityCount:
        primarySelections.eligibleByParticipant[row.participantId],
      selectedPrimaryCount: primarySelections.byParticipant[row.participantId],
      nonPrimaryContextCount:
        primarySelections.nonPrimaryByParticipant[row.participantId],
      selectionPolicyVersion:
        primarySelections.policyVersionByParticipant[row.participantId],
      selectionEffectiveFrom:
        primarySelections.effectiveFromByParticipant[row.participantId],
      preparedRuntimeSessionCount:
        runtimeLinks.sessionsByParticipant[row.participantId] ?? 0,
      preparedRuntimeRunCount:
        runtimeLinks.runsByParticipant[row.participantId] ?? 0,
      startedRuntimeRunCount:
        runtimeLinks.startedRunsByParticipant[row.participantId] ?? 0,
      currentRuntimeActivityOrdinal:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]?.activityOrdinal ??
        null,
      currentRuntimeActivityTotal:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]?.activityTotal ??
        null,
      currentRuntimeRunState:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]?.runState ??
        null,
      currentRuntimeBlockLabel:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]?.blockLabel ??
        null,
      b0InteractionCount:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]
          ?.interactionCount ?? null,
      b0ConfirmedInteractionCount:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]
          ?.confirmedInteractionCount ?? null,
      b0ResponseCount:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]
          ?.responseCount ?? null,
      b0SubfieldCount:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]
          ?.subfieldCount ?? null,
      b0EvidenceCount:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]
          ?.evidenceCount ?? null,
      b0CanonicalVariableCount:
        runtimeLinks.currentRuntimeByParticipant[row.participantId]
          ?.canonicalVariableCount ?? null,
      selectionStage:
        primarySelections.byParticipant[row.participantId] !== null
          ? "effective"
          : workMaps.byParticipant[row.participantId]
            ? "eligibility_pending"
            : "not_started",
      selectionStageLabel:
        runtimeLinks.byParticipant[row.participantId]
          ? "Runtime en ejecución"
          : primarySelections.byParticipant[row.participantId] !== null
          ? "Selección efectiva"
          : workMaps.byParticipant[row.participantId]
            ? "Elegibilidad pendiente"
            : "No iniciado",
      attentionLabel: attentionByParticipant[row.participantId]
        ? "Atención activa"
        : "Sin atención abierta",
      functionalSessionStatus: runtimeLinks.byParticipant[row.participantId]
        ? "active"
        : "not_started",
      functionalSessionLabel: runtimeLinks.byParticipant[row.participantId]
        ? "Runtime en ejecución"
        : runtimeLinks.sessionsByParticipant[row.participantId]
          ? "Preparada"
          : "Aún no preparada",
      lastScreenLabel: runtimeLinks.sessionsByParticipant[row.participantId]
        ? runtimeLinks.currentRuntimeByParticipant[row.participantId]
            ?.blockLabel ??
          `${runtimeLinks.runsByParticipant[row.participantId] ?? 0} runs preparados`
        : "Sin Runtime preparado",
    })),
    totalParticipants: participants.length,
    workMapsSaved: workMaps,
    primarySelections,
    runtimesStarted: runtimeLinks,
    runtimesPrepared: {
      totalSessions: runtimeLinks.totalPreparedSessions,
      totalRuns: runtimeLinks.totalPreparedRuns,
      sessionsByParticipant: runtimeLinks.sessionsByParticipant,
      runsByParticipant: runtimeLinks.runsByParticipant,
    },
    participantsWithAttention: {
      total: Object.values(attentionByParticipant).filter(Boolean).length,
      byParticipant: attentionByParticipant,
    },
    generatedAt,
    sourceMaxUpdatedAt: latestIso([
      ...participants.map((row) => row.updatedAt),
      workMaps.sourceMaxUpdatedAt,
      primarySelections.sourceMaxUpdatedAt,
      runtimeLinks.sourceMaxUpdatedAt,
    ]),
  };
}

async function loadParticipants(client: SupabaseClient, caseId: string) {
  const modern = await tryList<Row>(
    client
      .from("case_participants")
      .select("id, participant_name, updated_at, usuarios(rol_declarado)")
      .eq("case_id", caseId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  );
  const positions = await loadDeclaredPositions(client);
  if (modern.ok) {
    return modern.data.map((row) => ({
      participantId: String(row.id),
      displayName:
        textOrNull(row.participant_name) ??
        textOrNull(row.display_label) ??
        "Participante",
      declaredPosition:
        positions[String(row.id)] ??
        textOrNull(objectOrNull(row.usuarios)?.rol_declarado),
      updatedAt: textOrNull(row.updated_at),
    }));
  }

  const legacy = await tryList<Row>(
    client
      .from("case_participants")
      .select("id, display_label, updated_at")
      .eq("case_id", caseId)
      .eq("enabled", true)
      .order("created_at", { ascending: true }),
  );
  return legacy.ok
    ? legacy.data.map((row) => ({
        participantId: String(row.id),
      displayName: textOrNull(row.display_label) ?? "Participante",
      declaredPosition: positions[String(row.id)] ?? null,
      updatedAt: textOrNull(row.updated_at),
    }))
    : [];
}

async function loadDeclaredPositions(client: SupabaseClient) {
  const result = await tryList<Row>(
    client
      .from("case_participant_positions")
      .select("case_participant_id, declared_title")
      .eq("status", "active"),
  );
  if (!result.ok) return {} as Record<string, string>;
  return Object.fromEntries(
    result.data.flatMap((row): Array<[string, string]> => {
      const participantId = textOrNull(row.case_participant_id);
      const title = textOrNull(row.declared_title);
      return participantId && title ? [[participantId, title]] : [];
    }),
  );
}

async function loadWorkMaps(
  client: SupabaseClient,
  caseId: string,
  participantIds: string[],
) {
  const byParticipant = Object.fromEntries(
    participantIds.map((id) => [id, false as boolean | null]),
  );
  if (participantIds.length === 0) {
    return {
      total: 0,
      byParticipant,
      sourceMaxUpdatedAt: null,
      snapshotIdByParticipant: {},
      versionByParticipant: {},
      areaByParticipant: {},
      responsibilityCountByParticipant: {},
      activityCountByParticipant: {},
    };
  }

  const result = await tryList<Row>(
    client
      .from("case_participant_workmap_snapshots")
      .select("id, case_participant_id, workmap_version, workmap_json, status, updated_at")
      .eq("case_id", caseId)
      .in("case_participant_id", participantIds)
      .eq("status", "active"),
  );
  if (!result.ok) {
    return {
      total: 0,
      byParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as boolean | null]),
      ),
      sourceMaxUpdatedAt: null,
      snapshotIdByParticipant: {},
      versionByParticipant: {},
      areaByParticipant: {},
      responsibilityCountByParticipant: {},
      activityCountByParticipant: {},
    };
  }

  const snapshotIdByParticipant: Record<string, string | null> = {};
  const versionByParticipant: Record<string, string | number | null> = {};
  const areaByParticipant: Record<string, string | null> = {};
  const responsibilityCountByParticipant: Record<string, number | null> = {};
  const activityCountByParticipant: Record<string, number | null> = {};
  for (const row of result.data) {
    const id = textOrNull(row.case_participant_id);
    if (!id) continue;
    const workmap = objectOrNull(row.workmap_json);
    byParticipant[id] = true;
    snapshotIdByParticipant[id] = textOrNull(row.id);
    versionByParticipant[id] = textOrNull(row.workmap_version);
    areaByParticipant[id] = resolveWorkMapProfileLabel(workmap);
    responsibilityCountByParticipant[id] = countArray(workmap?.responsibilities);
    activityCountByParticipant[id] = countWorkMapActivities(workmap);
  }
  return {
    total: Object.values(byParticipant).filter(Boolean).length,
    byParticipant,
    sourceMaxUpdatedAt: latestIso(result.data.map((row) => textOrNull(row.updated_at))),
    snapshotIdByParticipant,
    versionByParticipant,
    areaByParticipant,
    responsibilityCountByParticipant,
    activityCountByParticipant,
  };
}

async function loadProfileFacts(client: SupabaseClient, participantIds: string[]) {
  const byParticipant: Record<
    string,
    | {
        profileId: string;
        profileLabel: string | null;
        confirmationStatus: string | null;
        sourceWorkmapId: string | null;
        sourceWorkmapVersionId: string | number | null;
        responsibilityCount: number | null;
        activityCount: number | null;
      }
    | null
  > = Object.fromEntries(participantIds.map((id) => [id, null]));
  if (participantIds.length === 0) return { byParticipant };
  const modern = await tryList<Row>(
    client
      .from("case_participant_profiles")
      .select("id, case_participant_id, role_label, profile_status, metadata, created_at")
      .in("case_participant_id", participantIds)
      .eq("profile_status", "active")
      .order("created_at", { ascending: true }),
  );
  if (modern.ok) {
    for (const row of modern.data) {
      const participantId = textOrNull(row.case_participant_id);
      const profileId = textOrNull(row.id);
      if (!participantId || !profileId || byParticipant[participantId]) continue;
      const metadata = objectOrNull(row.metadata);
      byParticipant[participantId] = {
        profileId,
        profileLabel: textOrNull(row.role_label),
        confirmationStatus: textOrNull(row.profile_status),
        sourceWorkmapId: textOrNull(metadata?.workmap_snapshot_id),
        sourceWorkmapVersionId: textOrNull(metadata?.workmap_version),
        responsibilityCount: numberOrNull(metadata?.responsibilities_count),
        activityCount: numberOrNull(metadata?.activities_count),
      };
    }
    return { byParticipant };
  }

  const legacy = await tryList<Row>(
    client
      .from("case_participant_profiles")
      .select("id, case_participant_id, display_label, resolution_status, created_at")
      .in("case_participant_id", participantIds)
      .eq("enabled", true)
      .order("created_at", { ascending: true }),
  );
  if (legacy.ok) {
    for (const row of legacy.data) {
      const participantId = textOrNull(row.case_participant_id);
      const profileId = textOrNull(row.id);
      if (!participantId || !profileId || byParticipant[participantId]) continue;
      byParticipant[participantId] = {
        profileId,
        profileLabel: textOrNull(row.display_label),
        confirmationStatus: textOrNull(row.resolution_status),
        sourceWorkmapId: null,
        sourceWorkmapVersionId: null,
        responsibilityCount: null,
        activityCount: null,
      };
    }
  }
  return { byParticipant };
}

async function loadPrimarySelections(
  client: SupabaseClient,
  caseId: string,
  participantIds: string[],
) {
  const byParticipant = Object.fromEntries(
    participantIds.map((id) => [id, null as number | null]),
  );
  const eligibleByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, null as number | null]),
  );
  const nonPrimaryByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, null as number | null]),
  );
  const policyVersionByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, null as string | null]),
  );
  const effectiveFromByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, null as string | null]),
  );
  if (participantIds.length === 0) {
    return {
      total: null,
      byParticipant,
      eligibleByParticipant,
      nonPrimaryByParticipant,
      policyVersionByParticipant,
      effectiveFromByParticipant,
      sourceMaxUpdatedAt: null,
    };
  }

  const result = await tryList<Row>(
    client
      .from("activity_selection_results")
      .select(
        "participant_id, policy_version, eligible_count, selected_count, non_primary_context_count, updated_at, effective_from",
      )
      .eq("case_id", caseId)
      .in("participant_id", participantIds)
      .eq("lifecycle_state", "effective"),
  );
  if (!result.ok) {
    return {
      total: null,
      byParticipant,
      eligibleByParticipant,
      nonPrimaryByParticipant,
      policyVersionByParticipant,
      effectiveFromByParticipant,
      sourceMaxUpdatedAt: null,
    };
  }

  for (const row of result.data) {
    const id = textOrNull(row.participant_id);
    if (!id) continue;
    byParticipant[id] =
      (byParticipant[id] ?? 0) + (numberOrNull(row.selected_count) ?? 0);
    eligibleByParticipant[id] =
      (eligibleByParticipant[id] ?? 0) +
      (numberOrNull(row.eligible_count) ?? 0);
    nonPrimaryByParticipant[id] =
      (nonPrimaryByParticipant[id] ?? 0) +
      (numberOrNull(row.non_primary_context_count) ?? 0);
    policyVersionByParticipant[id] = textOrNull(row.policy_version);
    effectiveFromByParticipant[id] = textOrNull(row.effective_from);
  }
  const materializedValues = Object.values(byParticipant).filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  return {
    total:
      materializedValues.length > 0
        ? materializedValues.reduce((sum, value) => sum + value, 0)
        : null,
    byParticipant,
    eligibleByParticipant,
    nonPrimaryByParticipant,
    policyVersionByParticipant,
    effectiveFromByParticipant,
    sourceMaxUpdatedAt: latestIso(
      result.data.map(
        (row) => textOrNull(row.updated_at) ?? textOrNull(row.effective_from),
      ),
    ),
  };
}

async function loadRuntimeLinks(
  client: SupabaseClient,
  caseId: string,
  participantIds: string[],
) {
  const byParticipant = Object.fromEntries(
    participantIds.map((id) => [id, false as boolean | null]),
  );
  const sessionsByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, 0 as number | null]),
  );
  const runsByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, 0 as number | null]),
  );
  const startedRunsByParticipant = Object.fromEntries(
    participantIds.map((id) => [id, 0 as number | null]),
  );
  const currentRuntimeByParticipant: Record<
    string,
    {
      runId: string;
      runState: string | null;
      activityOrdinal: number | null;
      activityTotal: number;
      blockLabel: string;
      interactionCount: number | null;
      confirmedInteractionCount: number | null;
      responseCount: number | null;
      subfieldCount: number | null;
      evidenceCount: number | null;
      canonicalVariableCount: number | null;
    } | null
  > = Object.fromEntries(participantIds.map((id) => [id, null]));
  if (participantIds.length === 0) {
    return {
      total: 0,
      byParticipant,
      totalPreparedSessions: 0,
      totalPreparedRuns: 0,
      sessionsByParticipant,
      runsByParticipant,
      startedRunsByParticipant,
      currentRuntimeByParticipant,
      sourceMaxUpdatedAt: null,
    };
  }

  const selections = await tryList<Row>(
    client
      .from("activity_selection_results")
      .select("participant_id, role_runtime_session_id, effective_from, updated_at")
      .eq("case_id", caseId)
      .in("participant_id", participantIds)
      .eq("lifecycle_state", "effective"),
  );
  if (!selections.ok) {
    return {
      total: 0,
      byParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as boolean | null]),
      ),
      totalPreparedSessions: 0,
      totalPreparedRuns: 0,
      sessionsByParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as number | null]),
      ),
      runsByParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as number | null]),
      ),
      startedRunsByParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as number | null]),
      ),
      currentRuntimeByParticipant,
      sourceMaxUpdatedAt: null,
    };
  }

  const sessionToParticipant = new Map<string, string>();
  for (const row of selections.data) {
    const participantId = textOrNull(row.participant_id);
    const sessionId = textOrNull(row.role_runtime_session_id);
    if (!participantId || !sessionId) continue;
    sessionToParticipant.set(sessionId, participantId);
  }
  const sessionIds = Array.from(sessionToParticipant.keys());
  for (const sessionId of sessionIds) {
    const participantId = sessionToParticipant.get(sessionId);
    if (!participantId) continue;
    sessionsByParticipant[participantId] =
      (sessionsByParticipant[participantId] ?? 0) + 1;
  }

  if (sessionIds.length === 0) {
    return {
      total: 0,
      byParticipant,
      totalPreparedSessions: 0,
      totalPreparedRuns: 0,
      sessionsByParticipant,
      runsByParticipant,
      startedRunsByParticipant,
      currentRuntimeByParticipant,
      sourceMaxUpdatedAt: latestIso(
        selections.data.map(
          (row) => textOrNull(row.updated_at) ?? textOrNull(row.effective_from),
        ),
      ),
    };
  }

  const runs = await tryList<Row>(
    client
      .from("activity_runtime_run")
      .select("role_runtime_session_id, activity_runtime_run_id, state, readiness_state, activity_rank, updated_at")
      .in("role_runtime_session_id", sessionIds),
  );
  if (!runs.ok) {
    return {
      total: 0,
      byParticipant,
      totalPreparedSessions: sessionIds.length,
      totalPreparedRuns: 0,
      sessionsByParticipant,
      runsByParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as number | null]),
      ),
      startedRunsByParticipant: Object.fromEntries(
        participantIds.map((id) => [id, null as number | null]),
      ),
      currentRuntimeByParticipant,
      sourceMaxUpdatedAt: latestIso(
        selections.data.map(
          (row) => textOrNull(row.updated_at) ?? textOrNull(row.effective_from),
        ),
      ),
    };
  }

  for (const row of runs.data) {
    const sessionId = textOrNull(row.role_runtime_session_id);
    const participantId = sessionId ? sessionToParticipant.get(sessionId) : null;
    if (!participantId) continue;
    runsByParticipant[participantId] =
      (runsByParticipant[participantId] ?? 0) + 1;
    if (isStartedRuntimeRun(row)) {
      startedRunsByParticipant[participantId] =
        (startedRunsByParticipant[participantId] ?? 0) + 1;
      byParticipant[participantId] = true;
    }
  }
  const runMetrics = await loadB0RuntimeMetrics(
    client,
    runs.data.flatMap((row) => {
      const runId = textOrNull(row.activity_runtime_run_id);
      return runId ? [runId] : [];
    }),
  );
  const runsBySession = new Map<string, Row[]>();
  for (const row of runs.data) {
    const sessionId = textOrNull(row.role_runtime_session_id);
    if (!sessionId) continue;
    const list = runsBySession.get(sessionId) ?? [];
    list.push(row);
    runsBySession.set(sessionId, list);
  }
  for (const [sessionId, list] of runsBySession) {
    const participantId = sessionToParticipant.get(sessionId);
    if (!participantId) continue;
    const ordered = [...list].sort((a, b) => {
      return (numberOrNull(a.activity_rank) ?? 999) - (numberOrNull(b.activity_rank) ?? 999);
    });
    const current =
      ordered.find((row) => isStartedRuntimeRun(row)) ?? ordered[0] ?? null;
    const runId = textOrNull(current?.activity_runtime_run_id);
    if (!current || !runId) continue;
    const metrics = runMetrics.get(runId) ?? null;
    const confirmed = metrics?.confirmedInteractionCount ?? 0;
    currentRuntimeByParticipant[participantId] = {
      runId,
      runState: textOrNull(current.state),
      activityOrdinal: numberOrNull(current.activity_rank),
      activityTotal: ordered.length,
      blockLabel: confirmed >= 4 ? "B0 confirmado" : "B0 pendiente",
      interactionCount: metrics?.interactionCount ?? null,
      confirmedInteractionCount: metrics?.confirmedInteractionCount ?? null,
      responseCount: metrics?.responseCount ?? null,
      subfieldCount: metrics?.subfieldCount ?? null,
      evidenceCount: metrics?.evidenceCount ?? null,
      canonicalVariableCount: metrics?.canonicalVariableCount ?? null,
    };
  }

  return {
    total: Object.values(byParticipant).filter(Boolean).length,
    byParticipant,
    totalPreparedSessions: sessionIds.length,
    totalPreparedRuns: runs.data.length,
    sessionsByParticipant,
    runsByParticipant,
    startedRunsByParticipant,
    currentRuntimeByParticipant,
    sourceMaxUpdatedAt: latestIso([
      ...selections.data.map(
        (row) => textOrNull(row.updated_at) ?? textOrNull(row.effective_from),
      ),
      ...runs.data.map((row) => textOrNull(row.updated_at)),
    ]),
  };
}

async function loadB0RuntimeMetrics(client: SupabaseClient, runIds: string[]) {
  const metrics = new Map<
    string,
    {
      interactionCount: number | null;
      confirmedInteractionCount: number | null;
      responseCount: number | null;
      subfieldCount: number | null;
      evidenceCount: number | null;
      canonicalVariableCount: number | null;
    }
  >(
    runIds.map((id) => [
      id,
      {
        interactionCount: 0,
        confirmedInteractionCount: 0,
        responseCount: 0,
        subfieldCount: 0,
        evidenceCount: 0,
        canonicalVariableCount: 0,
      },
    ]),
  );
  if (runIds.length === 0) return metrics;
  await Promise.all([
    countRuntimeRows(client, metrics, "runtime_interaction_instance", runIds, "interactionCount", {
      confirmedKey: "confirmedInteractionCount",
    }),
    countRuntimeRows(client, metrics, "response_record", runIds, "responseCount"),
    countRuntimeRows(client, metrics, "runtime_subfield_response", runIds, "subfieldCount"),
    countRuntimeRows(client, metrics, "evidence_item", runIds, "evidenceCount"),
    countRuntimeRows(client, metrics, "canonical_variable_record", runIds, "canonicalVariableCount"),
  ]);
  return metrics;
}

async function countRuntimeRows(
  client: SupabaseClient,
  metrics: Map<
    string,
    {
      interactionCount: number | null;
      confirmedInteractionCount: number | null;
      responseCount: number | null;
      subfieldCount: number | null;
      evidenceCount: number | null;
      canonicalVariableCount: number | null;
    }
  >,
  table: string,
  runIds: string[],
  totalKey:
    | "interactionCount"
    | "responseCount"
    | "subfieldCount"
    | "evidenceCount"
    | "canonicalVariableCount",
  options: { confirmedKey?: "confirmedInteractionCount" } = {},
) {
  try {
    const { data, error } = options.confirmedKey
      ? await client
          .from(table)
          .select("activity_runtime_run_id, state")
          .in("activity_runtime_run_id", runIds)
      : await client
          .from(table)
          .select("activity_runtime_run_id")
          .in("activity_runtime_run_id", runIds);
    if (error) {
      for (const metric of metrics.values()) {
        metric[totalKey] = null;
        if (options.confirmedKey) metric[options.confirmedKey] = null;
      }
      return;
    }
    for (const raw of data ?? []) {
      const row = raw as unknown as Row;
      const runId = textOrNull(row.activity_runtime_run_id);
      if (!runId) continue;
      const metric = metrics.get(runId);
      if (!metric) continue;
      metric[totalKey] = (metric[totalKey] ?? 0) + 1;
      if (options.confirmedKey && row.state === "confirmed") {
        metric[options.confirmedKey] = (metric[options.confirmedKey] ?? 0) + 1;
      }
    }
  } catch {
    for (const metric of metrics.values()) {
      metric[totalKey] = null;
      if (options.confirmedKey) metric[options.confirmedKey] = null;
    }
  }
}

function isStartedRuntimeRun(row: Row): boolean {
  const state = textOrNull(row.state);
  const readiness = textOrNull(row.readiness_state);
  return !(state === "initialized" && (!readiness || readiness === "not_started"));
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

function latestIso(values: Array<string | null | undefined>): string | null {
  let latest: string | null = null;
  let latestTime = 0;
  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (Number.isNaN(time) || time <= latestTime) continue;
    latestTime = time;
    latest = value;
  }
  return latest;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function objectOrNull(value: unknown): Row | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : null;
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
