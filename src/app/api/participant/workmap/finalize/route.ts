import { NextResponse } from "next/server";

import { normalizeWorkMapData, type WorkMapData } from "@/domain/local-work-map";
import {
  participantContextHttpStatus,
  resolveAuthenticatedParticipantContext,
} from "@/lib/participant-context";
import { bearerTokenFromRequest, authenticateCommercialRequest } from "@/lib/session-boundary";
import {
  createAuthenticatedServerSupabaseClient,
  createServiceRoleServerSupabaseClient,
} from "@/lib/supabase-server";
import {
  buildCanonicalSelectionsForParticipantProfiles,
  hashCanonicalJson,
  type ProfileCanonicalSelection,
} from "@/services/participant-canonical-activity-selection";
import { replayAndPersistActivitySelection } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-replay";

export const dynamic = "force-dynamic";

type WorkMapSnapshotRow = {
  id: string;
  case_id: string;
  case_participant_id: string;
  workmap_json: unknown;
  workmap_version: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  role_code: string | null;
  role_label: string;
  profile_status: string | null;
  is_primary?: boolean | null;
  created_at?: string | null;
};


type RuntimeSessionRow = {
  role_runtime_session_id: string;
  sesion_id: string;
  case_id: string | null;
  role_id: string | null;
  role_label: string | null;
  catalog_version_id: string | null;
  tenant_id: string | null;
  organization_id: string | null;
  owner_auth_user_id: string | null;
  state?: string | null;
};

type SelectionResultRow = {
  id: string;
  role_runtime_session_id: string;
  source_snapshot_hash: string;
  source_snapshot_reference: string;
  result_version: number;
  lifecycle_state: string;
  selection_result_hash?: string | null;
  trace_completeness_status?: string | null;
};

type RuntimeRunRow = {
  activity_runtime_run_id: string;
  role_runtime_session_id: string;
  activity_id: string;
  activity_name: string;
  activity_rank: number | null;
  state: string;
  readiness_state: string;
};

type SelectionReplaySummary = {
  replayStatus: "match" | "mismatch" | "unverifiable";
  replayedAt: string;
  replayHash: string;
  diffCount: number;
};

type FinalizedProfileResult =
  | {
      profile: ProfileCanonicalSelection["profile"];
      profileOrder: number;
      status: "reentry_required";
      selectionResult: ProfileCanonicalSelection["selectionResult"];
      runs: [];
    }
  | {
      profile: ProfileCanonicalSelection["profile"];
      profileOrder: number;
      status: "ready";
      runtime: RuntimeSessionRow;
      selection: SelectionResultRow;
      replay: SelectionReplaySummary;
      selectionResult: ProfileCanonicalSelection["selectionResult"];
      runs: RuntimeRunRow[];
    };

function isReadyProfileResult(
  result: FinalizedProfileResult,
): result is Extract<FinalizedProfileResult, { status: "ready" }> {
  return result.status === "ready";
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ status: "error", code, message }, { status });
}

async function materializeProfilesWithParticipantAuthority(
  token: string,
  caseId: string,
) {
  const client = createAuthenticatedServerSupabaseClient(token);
  const { error } = await client.rpc(
    "materialize_case_participant_profiles_from_workmap",
    { p_case_id: caseId },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function readLatestWorkMapSnapshot(service: ReturnType<typeof createServiceRoleServerSupabaseClient>, input: {
  caseId: string;
  participantId: string;
}) {
  const { data, error } = await service
    .from("case_participant_workmap_snapshots")
    .select("id, case_id, case_participant_id, workmap_json, workmap_version, created_at, updated_at")
    .eq("case_id", input.caseId)
    .eq("case_participant_id", input.participantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<WorkMapSnapshotRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("workmap_snapshot_required");
  }

  return {
    ...data,
    workmap: normalizeWorkMapData(data.workmap_json) as WorkMapData,
  };
}

async function readActiveProfiles(service: ReturnType<typeof createServiceRoleServerSupabaseClient>, participantId: string) {
  const { data, error } = await service
    .from("case_participant_profiles")
    .select("id, role_code, role_label, profile_status, is_primary, created_at")
    .eq("case_participant_id", participantId)
    .eq("profile_status", "active")
    .returns<ProfileRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    roleCode: profile.role_code,
    roleLabel: profile.role_label,
    status: profile.profile_status,
    isPrimary: profile.is_primary ?? false,
    createdAt: profile.created_at ?? null,
  }));
}

async function ensureRuntimeSession(service: ReturnType<typeof createServiceRoleServerSupabaseClient>, input: {
  profileId: string;
  caseId: string;
  participantId: string;
  actorAuthUserId: string;
  profileOrder: number;
}) {
  const { data: rpcData, error: rpcError } = await service.rpc(
    "create_role_runtime_session_for_profile",
    {
      p_case_participant_profile_id: input.profileId,
      p_metadata: {
        created_by: "participant_workmap_finalize",
        processing_order: input.profileOrder,
      },
    },
  );

  if (rpcError) {
    throw new Error(`runtime_session_rpc_failed:${rpcError.message}`);
  }

  const runtimeRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  const runtimeSessionId =
    typeof runtimeRow === "object" && runtimeRow !== null
      ? String((runtimeRow as Record<string, unknown>).role_runtime_session_id ?? "")
      : "";

  if (!runtimeSessionId) {
    throw new Error("runtime_session_not_returned");
  }

  const { data: runtime, error: runtimeError } = await service
    .from("role_runtime_session")
    .select(
      "role_runtime_session_id, sesion_id, case_id, role_id, role_label, catalog_version_id, tenant_id, organization_id, owner_auth_user_id, state",
    )
    .eq("role_runtime_session_id", runtimeSessionId)
    .maybeSingle<RuntimeSessionRow>();

  if (runtimeError) {
    throw new Error(runtimeError.message);
  }

  if (!runtime || runtime.owner_auth_user_id !== input.actorAuthUserId) {
    throw new Error("runtime_session_context_mismatch");
  }

  if (runtime.state === "archived") {
    throw new Error("runtime_session_archived");
  }

  return runtime;
}

async function ensureSelectionResult(service: ReturnType<typeof createServiceRoleServerSupabaseClient>, input: {
  actorAuthUserId: string;
  caseId: string;
  participantId: string;
  canonical: ProfileCanonicalSelection;
  runtime: RuntimeSessionRow;
}) {
  const snapshotHash = hashCanonicalJson(input.canonical.scopedWorkMap);
  const { data: existing, error: existingError } = await service
    .from("activity_selection_results")
    .select(
      "id, role_runtime_session_id, source_snapshot_hash, source_snapshot_reference, result_version, lifecycle_state, selection_result_hash, trace_completeness_status",
    )
    .eq("role_runtime_session_id", input.runtime.role_runtime_session_id)
    .eq("lifecycle_state", "effective")
    .maybeSingle<SelectionResultRow>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (
    existing &&
    existing.source_snapshot_hash === snapshotHash &&
    existing.source_snapshot_reference === input.canonical.sourceReference
  ) {
    if (
      !existing.selection_result_hash ||
      existing.selection_result_hash === input.canonical.stage.result.selection_result_hash
    ) {
      return existing;
    }
    throw new Error("canonical_selection_effective_hash_mismatch");
  }

  if (existing) {
    throw new Error("canonical_selection_already_effective_for_different_workmap");
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await service
    .from("activity_selection_results")
    .insert({
      case_id: input.caseId,
      participant_id: input.participantId,
      profile_id: input.canonical.profile.id,
      role_runtime_session_id: input.runtime.role_runtime_session_id,
      ...input.canonical.stage.result,
      source_snapshot_hash: snapshotHash,
      result_version: 1,
      lifecycle_state: "effective",
      workmap_coverage_gap:
        input.canonical.selectionResult.mode === "reentry_required",
      computed_by: input.actorAuthUserId,
      validated_at: now,
      validated_by: input.actorAuthUserId,
      effective_from: now,
      published_by: input.actorAuthUserId,
    })
    .select(
      "id, role_runtime_session_id, source_snapshot_hash, source_snapshot_reference, result_version, lifecycle_state, selection_result_hash, trace_completeness_status",
    )
    .single<SelectionResultRow>();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const items = input.canonical.stage.items.map((item) => ({
    result_id: inserted.id,
    ...item,
  }));
  if (items.some((item) => !item.activity_description_source)) {
    throw new Error("activity_description_source_required");
  }

  if (items.length) {
    const { error: itemsError } = await service
      .from("activity_selection_result_items")
      .insert(items);
    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  return inserted;
}

async function ensureActivityRuns(service: ReturnType<typeof createServiceRoleServerSupabaseClient>, input: {
  actorAuthUserId: string;
  caseId: string;
  runtime: RuntimeSessionRow;
  canonical: ProfileCanonicalSelection;
}) {
  const runs: RuntimeRunRow[] = [];

  for (const activity of input.canonical.selectionResult.selectedPrimaryActivities) {
    const { data: existing, error: existingError } = await service
      .from("activity_runtime_run")
      .select(
        "activity_runtime_run_id, role_runtime_session_id, activity_id, activity_name, activity_rank, state, readiness_state",
      )
      .eq("role_runtime_session_id", input.runtime.role_runtime_session_id)
      .eq("activity_id", activity.activityId)
      .maybeSingle<RuntimeRunRow>();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      runs.push(existing);
      continue;
    }

    const { data: inserted, error: insertError } = await service
      .from("activity_runtime_run")
      .insert({
        role_runtime_session_id: input.runtime.role_runtime_session_id,
        sesion_id: input.caseId,
        activity_id: activity.activityId,
        activity_name: activity.activityLiteral,
        activity_rank: activity.runtimeOrder,
        is_primary_activity: true,
        catalog_version_id: input.runtime.catalog_version_id,
        tenant_id: input.runtime.tenant_id,
        organization_id: input.runtime.organization_id,
        owner_auth_user_id: input.actorAuthUserId,
        execution_mode: "commercial",
        state: "initialized",
        readiness_state: "not_started",
        metadata_json: {
          created_by: "participant_workmap_finalize",
          profile_id: input.canonical.profile.id,
          profile_order: input.canonical.profileOrder,
          source_reference: input.canonical.sourceReference,
          selection_reason_code: activity.selectionReasonCode,
        },
      })
      .select(
        "activity_runtime_run_id, role_runtime_session_id, activity_id, activity_name, activity_rank, state, readiness_state",
      )
      .single<RuntimeRunRow>();

    if (insertError) {
      throw new Error(insertError.message);
    }

    runs.push(inserted);
  }

  return runs.sort((a, b) => (a.activity_rank ?? 999) - (b.activity_rank ?? 999));
}

export async function POST(request: Request) {
  try {
    const token = bearerTokenFromRequest(request);
    const auth = await authenticateCommercialRequest(request);
    if (!token || !auth.user) {
      return jsonError(
        auth.status,
        "auth_required",
        auth.error ?? "Commercial mode requires an authenticated Supabase user.",
      );
    }

    const context = await resolveAuthenticatedParticipantContext(request);
    if (context.status !== "ready") {
      return NextResponse.json(context, {
        status: participantContextHttpStatus(context),
      });
    }

    await materializeProfilesWithParticipantAuthority(token, context.case.id);

    const service = createServiceRoleServerSupabaseClient();
    const workMapSnapshot = await readLatestWorkMapSnapshot(service, {
      caseId: context.case.id,
      participantId: context.participant.id,
    });
    const profiles = await readActiveProfiles(service, context.participant.id);
    if (!profiles.length) {
      return jsonError(
        409,
        "profile_reentry_required",
        "Necesitamos responsabilidades y actividades suficientes para preparar tu recorrido.",
      );
    }

    const canonicalSelections = buildCanonicalSelectionsForParticipantProfiles({
      workMap: workMapSnapshot.workmap,
      profiles,
      sourceSnapshotId: workMapSnapshot.id,
    });

    const profileResults: FinalizedProfileResult[] = [];
    for (const canonical of canonicalSelections) {
      if (canonical.selectionResult.mode === "reentry_required") {
        profileResults.push({
          profile: canonical.profile,
          profileOrder: canonical.profileOrder,
          status: "reentry_required",
          selectionResult: canonical.selectionResult,
          runs: [],
        });
        continue;
      }

      const runtime = await ensureRuntimeSession(service, {
        profileId: canonical.profile.id,
        caseId: context.case.id,
        participantId: context.participant.id,
        actorAuthUserId: auth.user.authUserId,
        profileOrder: canonical.profileOrder,
      });
      const selection = await ensureSelectionResult(service, {
        actorAuthUserId: auth.user.authUserId,
        caseId: context.case.id,
        participantId: context.participant.id,
        canonical,
        runtime,
      });
      const replay = await replayAndPersistActivitySelection({
        client: service,
        selectionResultId: selection.id,
      });
      if (replay.replayStatus !== "match") {
        throw new Error(`canonical_selection_replay_${replay.replayStatus}`);
      }
      const runs = await ensureActivityRuns(service, {
        actorAuthUserId: auth.user.authUserId,
        caseId: context.case.id,
        runtime,
        canonical,
      });

      profileResults.push({
        profile: canonical.profile,
        profileOrder: canonical.profileOrder,
        status: "ready",
        runtime,
        selection,
        replay: {
          replayStatus: replay.replayStatus,
          replayedAt: replay.replayedAt,
          replayHash: replay.replayHash,
          diffCount: replay.diffs.length,
        },
        selectionResult: canonical.selectionResult,
        runs,
      });
    }

    const nextProfile = profileResults.find(
      (profile): profile is Extract<FinalizedProfileResult, { status: "ready" }> =>
        isReadyProfileResult(profile) && profile.runs.length > 0,
    );
    const nextRun = nextProfile?.runs[0] ?? null;

    if (!nextProfile || !nextRun) {
      return NextResponse.json(
        {
          status: "reentry_required",
          context,
          profiles: profileResults,
          message:
            "Necesitamos actividades mas concretas antes de abrir Significado.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      status: "ready",
      context,
      workMapSnapshot: {
        id: workMapSnapshot.id,
        version: workMapSnapshot.workmap_version,
        createdAt: workMapSnapshot.created_at,
      },
      profiles: profileResults,
      next: {
        flowState: "intake_significado",
        profileId: nextProfile.profile.id,
        profileOrder: nextProfile.profileOrder,
        roleRuntimeSessionId: nextProfile.runtime.role_runtime_session_id,
        activityRuntimeRunId: nextRun.activity_runtime_run_id,
        activityId: nextRun.activity_id,
        activityLabel: nextRun.activity_name,
        activityRank: nextRun.activity_rank,
      },
      primaryActivitySelectionResult: nextProfile.selectionResult,
      scopedWorkMap: canonicalSelections.find(
        (selection) => selection.profile.id === nextProfile.profile.id,
      )?.scopedWorkMap,
    });
  } catch (error) {
    return jsonError(
      500,
      "participant_workmap_finalize_failed",
      error instanceof Error ? error.message : "No pude preparar el recorrido.",
    );
  }
}

