import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { participantContextHttpStatus, resolveAuthenticatedParticipantContext } from "@/lib/participant-context";
import { authenticateCommercialRequest } from "@/lib/session-boundary";
import { createServiceRoleServerSupabaseClient } from "@/lib/supabase-server";
import type { SignificadoBlock0Answers } from "@/domain/significado-de-trabajo";

const ACTIVE_RUN_STATES = [
  "initialized",
  "semantic_preload_loaded",
  "b0_confirmation_pending",
  "active_base_capture",
  "waiting_user",
  "waiting_reentry",
  "reentry_required",
  "manual_review_required",
  "blocked",
] as const;

const BLOCK0_QUESTION_ORDER = ["B0-Q01", "B0-Q02", "B0-Q03", "B0-Q04"] as const;
const SIGNIFICADO_B0_CATALOG_VERSION_ID = "EVE_RUNTIME_40_20_B0_V1";

type RuntimeRow = {
  role_runtime_session_id: string;
  sesion_id: string;
  case_id?: string | null;
  catalog_version_id?: string | null;
  tenant_id?: string | null;
  organization_id?: string | null;
  state?: string | null;
};

type RuntimeRunRow = {
  activity_runtime_run_id: string;
  role_runtime_session_id: string;
  sesion_id: string;
  activity_id: string;
  activity_name: string;
  activity_rank: number | null;
  state: string;
  readiness_state: string | null;
};

type RuntimeInteractionRow = {
  runtime_interaction_instance_id: string;
  activity_runtime_run_id: string;
  role_runtime_session_id: string;
  runtime_interaction_id: string;
  state: string;
};

type ResponseRow = {
  response_id: string;
  runtime_interaction_instance_id: string;
};

type SubfieldResponseRow = {
  subfield_response_id: string;
  subfield_name: string;
};

export type CanonicalSignificadoBlock0Result = {
  contextStatus: "ready";
  caseId: string;
  profileId: string;
  roleRuntimeSessionId: string;
  activityRuntimeRunId: string;
  activityId: string;
  activityLabel: string;
  ordinal: number;
  total: number;
  runStateBefore: string;
  runStateAfter: "active_base_capture";
  interactionInstanceCount: number;
  responseCount: number;
  subfieldResponseCount: number;
  evidenceItemCount: number;
  canonicalVariableCount: number;
  auditEventCount: number;
  nextInteraction: {
    source: "runtime_catalog";
    status: "pending";
    message: string;
  };
};

function normalizeQuestionId(key: string) {
  const [questionId] = key.split(".");
  return questionId || key;
}

function normalizeSubfieldName(key: string) {
  const [, ...rest] = key.split(".");
  return rest.join(".") || "answer";
}

function groupedAnswers(answers: SignificadoBlock0Answers) {
  const grouped = new Map<string, Array<{ key: string; subfield: string; value: string }>>();
  for (const [key, rawValue] of Object.entries(answers)) {
    const value = rawValue.trim();
    if (!value) continue;
    const questionId = normalizeQuestionId(key);
    const entries = grouped.get(questionId) ?? [];
    entries.push({ key, subfield: normalizeSubfieldName(key), value });
    grouped.set(questionId, entries);
  }

  return [...grouped.entries()].sort(
    ([left], [right]) =>
      (BLOCK0_QUESTION_ORDER as readonly string[]).indexOf(left) -
      (BLOCK0_QUESTION_ORDER as readonly string[]).indexOf(right),
  );
}

function requireData<T>(data: T | null | undefined, message: string): T {
  if (!data) throw new Error(message);
  return data;
}

async function readActiveRuntimeForProfile(
  service: SupabaseClient,
  profileId: string,
): Promise<RuntimeRow> {
  const { data: links, error: linkError } = await service
    .from("case_profile_runtime_session_links")
    .select("role_runtime_session_id, status, linked_at")
    .eq("case_participant_profile_id", profileId)
    .eq("status", "active")
    .order("linked_at", { ascending: false })
    .limit(1);

  if (linkError) throw new Error(linkError.message);
  const link = requireData(links?.[0], "runtime_profile_link_missing");

  const { data: runtime, error: runtimeError } = await service
    .from("role_runtime_session")
    .select(
      "role_runtime_session_id, sesion_id, case_id, catalog_version_id, tenant_id, organization_id, state",
    )
    .eq("role_runtime_session_id", link.role_runtime_session_id)
    .neq("state", "archived")
    .maybeSingle<RuntimeRow>();

  if (runtimeError) throw new Error(runtimeError.message);
  return requireData(runtime, "active_runtime_session_missing");
}

async function readCurrentRun(service: SupabaseClient, runtimeId: string) {
  const { data: runs, error } = await service
    .from("activity_runtime_run")
    .select(
      "activity_runtime_run_id, role_runtime_session_id, sesion_id, activity_id, activity_name, activity_rank, state, readiness_state",
    )
    .eq("role_runtime_session_id", runtimeId)
    .eq("is_primary_activity", true)
    .in("state", [...ACTIVE_RUN_STATES])
    .order("activity_rank", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);
  return requireData(runs?.[0] as RuntimeRunRow | undefined, "active_runtime_run_missing");
}

async function ensureRuntimeCatalogVersion(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    actorAuthUserId: string;
  },
): Promise<RuntimeRow> {
  if (input.runtime.catalog_version_id) {
    return input.runtime;
  }

  const { error: runtimeError } = await service
    .from("role_runtime_session")
    .update({
      catalog_version_id: SIGNIFICADO_B0_CATALOG_VERSION_ID,
      updated_at: new Date().toISOString(),
    })
    .eq("role_runtime_session_id", input.runtime.role_runtime_session_id)
    .is("catalog_version_id", null);

  if (runtimeError) throw new Error(runtimeError.message);

  const { error: runsError } = await service
    .from("activity_runtime_run")
    .update({
      catalog_version_id: SIGNIFICADO_B0_CATALOG_VERSION_ID,
      updated_at: new Date().toISOString(),
    })
    .eq("role_runtime_session_id", input.runtime.role_runtime_session_id)
    .is("catalog_version_id", null);

  if (runsError) throw new Error(runsError.message);

  const repairedRuntime = {
    ...input.runtime,
    catalog_version_id: SIGNIFICADO_B0_CATALOG_VERSION_ID,
  };

  await auditRuntimeEvent(service, {
    runtime: repairedRuntime,
    run: input.run,
    actorAuthUserId: input.actorAuthUserId,
    eventType: "runtime_catalog_version_repaired_for_b0",
    beforeJson: {
      catalog_version_id: null,
      runtime_state: input.runtime.state ?? null,
    },
    afterJson: {
      catalog_version_id: SIGNIFICADO_B0_CATALOG_VERSION_ID,
      runtime_state: input.runtime.state ?? null,
    },
    metadata: {
      repair_scope: "active_participant_runtime_session",
      repair_reason: "missing_catalog_version_before_canonical_b0",
    },
  });

  return repairedRuntime;
}

async function countPrimaryRuns(service: SupabaseClient, runtimeId: string) {
  const { count, error } = await service
    .from("activity_runtime_run")
    .select("activity_runtime_run_id", { count: "exact", head: true })
    .eq("role_runtime_session_id", runtimeId)
    .eq("is_primary_activity", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function ensureInteraction(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    questionId: string;
    actorAuthUserId: string;
  },
) {
  const { data: existing, error: existingError } = await service
    .from("runtime_interaction_instance")
    .select(
      "runtime_interaction_instance_id, activity_runtime_run_id, role_runtime_session_id, runtime_interaction_id, state",
    )
    .eq("activity_runtime_run_id", input.run.activity_runtime_run_id)
    .eq("runtime_interaction_id", input.questionId)
    .maybeSingle<RuntimeInteractionRow>();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const insertPayload = {
    activity_runtime_run_id: input.run.activity_runtime_run_id,
    role_runtime_session_id: input.runtime.role_runtime_session_id,
    sesion_id: input.run.sesion_id,
    catalog_version_id: input.runtime.catalog_version_id,
    runtime_interaction_id: input.questionId,
    interaction_group_source: "base_40",
    interaction_group_normalized: "base",
    state: "shown",
    visibility_state: "visible",
    runtime_order:
      Math.max((BLOCK0_QUESTION_ORDER as readonly string[]).indexOf(input.questionId), 0) + 1,
    shown_at: new Date().toISOString(),
      metadata_json: {
        source: "significado_block0",
        created_by: "canonical_significado_b0",
        local_interaction_uuid: randomUUID(),
      },
  };

  const { data: inserted, error } = await service
    .from("runtime_interaction_instance")
    .insert(insertPayload)
    .select(
      "runtime_interaction_instance_id, activity_runtime_run_id, role_runtime_session_id, runtime_interaction_id, state",
    )
    .single<RuntimeInteractionRow>();

  if (error) throw new Error(error.message);
  return inserted;
}

async function ensureResponse(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    interaction: RuntimeInteractionRow;
    questionId: string;
    answers: Array<{ key: string; subfield: string; value: string }>;
    actorAuthUserId: string;
  },
) {
  const idempotencyKey = `significado-b0:${input.run.activity_runtime_run_id}:${input.questionId}`;
  const rawAnswer = Object.fromEntries(input.answers.map((answer) => [answer.key, answer.value]));
  const freeText = input.answers.map((answer) => answer.value).join("\n");

  const { data: existing, error: existingError } = await service
    .from("response_record")
    .select("response_id, runtime_interaction_instance_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle<ResponseRow>();

  if (existingError) throw new Error(existingError.message);
  if (existing) {
    const { error: updateError } = await service
      .from("response_record")
      .update({
        free_text: freeText,
        raw_answer_json: rawAnswer,
        epistemic_status: "user_confirmed_or_corrected_evidence",
        provenance_type: "participant_significado_b0",
        updated_at: new Date().toISOString(),
      })
      .eq("response_id", existing.response_id);
    if (updateError) throw new Error(updateError.message);
    return existing;
  }

  const { data: inserted, error } = await service
    .from("response_record")
    .insert({
      runtime_interaction_instance_id:
        input.interaction.runtime_interaction_instance_id,
      activity_runtime_run_id: input.run.activity_runtime_run_id,
      role_runtime_session_id: input.runtime.role_runtime_session_id,
      sesion_id: input.run.sesion_id,
      free_text: freeText,
      raw_answer_json: rawAnswer,
      epistemic_status: "user_confirmed_or_corrected_evidence",
      provenance_type: "participant_significado_b0",
      idempotency_key: idempotencyKey,
      created_by_auth_user_id: input.actorAuthUserId,
    })
    .select("response_id, runtime_interaction_instance_id")
    .single<ResponseRow>();

  if (error) throw new Error(error.message);
  return inserted;
}

async function upsertSubfield(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    interaction: RuntimeInteractionRow;
    response: ResponseRow;
    answer: { key: string; subfield: string; value: string };
  },
) {
  const { data, error } = await service
    .from("runtime_subfield_response")
    .upsert(
      {
        response_id: input.response.response_id,
        runtime_interaction_instance_id:
          input.interaction.runtime_interaction_instance_id,
        activity_runtime_run_id: input.run.activity_runtime_run_id,
        role_runtime_session_id: input.runtime.role_runtime_session_id,
        sesion_id: input.run.sesion_id,
        subfield_name: input.answer.subfield,
        subfield_value_json: {
          value: input.answer.value,
          source_key: input.answer.key,
        },
        epistemic_status: "user_confirmed_or_corrected_evidence",
        provenance_type: "participant_significado_b0",
      },
      { onConflict: "response_id,subfield_name" },
    )
    .select("subfield_response_id, subfield_name")
    .single<SubfieldResponseRow>();

  if (error) throw new Error(error.message);
  return data;
}

async function ensureEvidenceItem(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    interaction: RuntimeInteractionRow;
    response: ResponseRow;
    subfield: SubfieldResponseRow;
    value: string;
  },
) {
  const { data: existing, error: existingError } = await service
    .from("evidence_item")
    .select("evidence_item_id")
    .eq("subfield_response_id", input.subfield.subfield_response_id)
    .maybeSingle<{ evidence_item_id: string }>();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing.evidence_item_id;

  const { data: inserted, error } = await service
    .from("evidence_item")
    .insert({
      activity_runtime_run_id: input.run.activity_runtime_run_id,
      role_runtime_session_id: input.runtime.role_runtime_session_id,
      runtime_interaction_instance_id:
        input.interaction.runtime_interaction_instance_id,
      response_id: input.response.response_id,
      subfield_response_id: input.subfield.subfield_response_id,
      sesion_id: input.run.sesion_id,
      literal_value: input.value,
      normalized_value: input.value,
      evidence_kind: "participant_statement",
      epistemic_status: "user_confirmed_or_corrected_evidence",
      provenance_type: "participant_significado_b0",
    })
    .select("evidence_item_id")
    .single<{ evidence_item_id: string }>();

  if (error) throw new Error(error.message);
  return inserted.evidence_item_id;
}

async function upsertCanonicalVariable(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    subfieldName: string;
    value: string;
    evidenceItemId: string;
    responseId: string;
  },
) {
  const routeId = "B0";
  const variableName = `b0.${input.subfieldName}`;
  const { error } = await service
    .from("canonical_variable_record")
    .upsert(
      {
        activity_runtime_run_id: input.run.activity_runtime_run_id,
        role_runtime_session_id: input.runtime.role_runtime_session_id,
        sesion_id: input.run.sesion_id,
        variable_name: variableName,
        variable_value: { value: input.value },
        variable_type: "runtime_b0",
        route_id: routeId,
        route_status: "open",
        source_evidence_item_ids: [input.evidenceItemId],
        derived_from_response_ids: [input.responseId],
        gap_flag: false,
        gap_type: "none",
      },
      { onConflict: "activity_runtime_run_id,variable_name,route_id" },
    );

  if (error) throw new Error(error.message);
}

async function auditRuntimeEvent(
  service: SupabaseClient,
  input: {
    runtime: RuntimeRow;
    run: RuntimeRunRow;
    actorAuthUserId: string;
    eventType: string;
    beforeJson?: Record<string, unknown>;
    afterJson?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await service.from("runtime_audit_trail").insert({
    role_runtime_session_id: input.runtime.role_runtime_session_id,
    activity_runtime_run_id: input.run.activity_runtime_run_id,
    sesion_id: input.run.sesion_id,
    actor_type: "participant",
    actor_auth_user_id: input.actorAuthUserId,
    event_type: input.eventType,
    entity_table: "activity_runtime_run",
    entity_id: input.run.activity_runtime_run_id,
    event_summary: input.eventType,
    before_json: input.beforeJson ?? {},
    after_json: input.afterJson ?? {},
    metadata_json: input.metadata ?? {},
  });

  if (error) throw new Error(error.message);
}

export async function persistCanonicalSignificadoBlock0(
  request: Request,
  input: {
    answers: SignificadoBlock0Answers;
  },
) {
  const auth = await authenticateCommercialRequest(request);
  if (!auth.user) {
    return {
      ok: false as const,
      status: auth.status,
      error: auth.error ?? "auth_required",
    };
  }

  const context = await resolveAuthenticatedParticipantContext(request);
  if (context.status !== "ready") {
    return {
      ok: false as const,
      status: participantContextHttpStatus(context),
      error: context.reason,
    };
  }

  const profile = context.functionalProfiles[0];
  if (!profile) {
    return { ok: false as const, status: 409, error: "active_profile_missing" };
  }

  const grouped = groupedAnswers(input.answers);
  if (!grouped.length) {
    return { ok: false as const, status: 400, error: "block0_answers_missing" };
  }

  const service = createServiceRoleServerSupabaseClient();
  const runtimeWithoutCatalog = await readActiveRuntimeForProfile(service, profile.id);
  const run = await readCurrentRun(service, runtimeWithoutCatalog.role_runtime_session_id);
  if (run.sesion_id !== context.case.id) {
    return { ok: false as const, status: 409, error: "runtime_case_mismatch" };
  }

  const runtime = await ensureRuntimeCatalogVersion(service, {
    runtime: runtimeWithoutCatalog,
    run,
    actorAuthUserId: auth.user.authUserId,
  });

  const total = await countPrimaryRuns(service, runtime.role_runtime_session_id);
  const runStateBefore = run.state;

  const { error: preloadError } = await service
    .from("activity_runtime_run")
    .update({
      state:
        run.state === "initialized"
          ? "b0_confirmation_pending"
          : run.state,
      readiness_state:
        run.readiness_state === "not_started" || !run.readiness_state
          ? "in_progress"
          : run.readiness_state,
      updated_at: new Date().toISOString(),
    })
    .eq("activity_runtime_run_id", run.activity_runtime_run_id);
  if (preloadError) throw new Error(preloadError.message);

  await auditRuntimeEvent(service, {
    runtime,
    run,
    actorAuthUserId: auth.user.authUserId,
    eventType: "significado_b0_opened",
    beforeJson: { state: runStateBefore },
    afterJson: { state: "b0_confirmation_pending" },
  });

  let interactionInstanceCount = 0;
  let responseCount = 0;
  let subfieldResponseCount = 0;
  let evidenceItemCount = 0;
  let canonicalVariableCount = 0;

  for (const [questionId, answers] of grouped) {
    const interaction = await ensureInteraction(service, {
      runtime,
      run,
      questionId,
      actorAuthUserId: auth.user.authUserId,
    });
    interactionInstanceCount += 1;

    const response = await ensureResponse(service, {
      runtime,
      run,
      interaction,
      questionId,
      answers,
      actorAuthUserId: auth.user.authUserId,
    });
    responseCount += 1;

    for (const answer of answers) {
      const subfield = await upsertSubfield(service, {
        runtime,
        run,
        interaction,
        response,
        answer,
      });
      subfieldResponseCount += 1;

      const evidenceItemId = await ensureEvidenceItem(service, {
        runtime,
        run,
        interaction,
        response,
        subfield,
        value: answer.value,
      });
      evidenceItemCount += 1;

      await upsertCanonicalVariable(service, {
        runtime,
        run,
        subfieldName: answer.subfield,
        value: answer.value,
        evidenceItemId,
        responseId: response.response_id,
      });
      canonicalVariableCount += 1;
    }

    const { error: interactionUpdateError } = await service
      .from("runtime_interaction_instance")
      .update({
        state: "confirmed",
        answered_at: new Date().toISOString(),
        closed_at: new Date().toISOString(),
        metadata_json: {
          source: "significado_block0",
          confirmed_by: "participant",
        },
      })
      .eq("runtime_interaction_instance_id", interaction.runtime_interaction_instance_id);
    if (interactionUpdateError) throw new Error(interactionUpdateError.message);
  }

  const { error: runUpdateError } = await service
    .from("activity_runtime_run")
    .update({
      state: "active_base_capture",
      readiness_state: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("activity_runtime_run_id", run.activity_runtime_run_id);

  if (runUpdateError) throw new Error(runUpdateError.message);

  const { error: runtimeUpdateError } = await service
    .from("role_runtime_session")
    .update({
      state: "active_base_capture",
      updated_at: new Date().toISOString(),
    })
    .eq("role_runtime_session_id", runtime.role_runtime_session_id);
  if (runtimeUpdateError) throw new Error(runtimeUpdateError.message);

  await auditRuntimeEvent(service, {
    runtime,
    run,
    actorAuthUserId: auth.user.authUserId,
    eventType: "significado_b0_confirmed",
    beforeJson: { state: runStateBefore },
    afterJson: { state: "active_base_capture" },
    metadata: {
      interaction_instance_count: interactionInstanceCount,
      response_count: responseCount,
      subfield_response_count: subfieldResponseCount,
      evidence_item_count: evidenceItemCount,
      canonical_variable_count: canonicalVariableCount,
    },
  });

  const result: CanonicalSignificadoBlock0Result = {
    contextStatus: "ready",
    caseId: context.case.id,
    profileId: profile.id,
    roleRuntimeSessionId: runtime.role_runtime_session_id,
    activityRuntimeRunId: run.activity_runtime_run_id,
    activityId: run.activity_id,
    activityLabel: run.activity_name,
    ordinal: run.activity_rank ?? 1,
    total,
    runStateBefore,
    runStateAfter: "active_base_capture",
    interactionInstanceCount,
    responseCount,
    subfieldResponseCount,
    evidenceItemCount,
    canonicalVariableCount,
    auditEventCount: 2,
    nextInteraction: {
      source: "runtime_catalog",
      status: "pending",
      message:
        "B0 confirmado; el siguiente paso debe resolverse desde runtime_interaction_instance pendiente.",
    },
  };

  return { ok: true as const, result };
}

export function maskRuntimeId(value: string) {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
