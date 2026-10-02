import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { createOfficialControlPanelMonitoringRuntimeRepository } from "@/services/eve/official-control-panel/official-control-panel-monitoring-runtime-repository";
import { createOfficialControlPanelActivitySelectionRepository } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-repository";
import { buildActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-service";
import {
  assertSelectedActivityCountAllowed,
  SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY,
} from "@/services/eve/official-control-panel/official-control-panel-activity-selection-mutation";
import { assertMonitoringParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-monitoring-service";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  createOfficialPanelRequestId,
  logOfficialPanelEvent,
} from "@/services/eve/official-control-panel/official-control-panel-observability";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    caseId: string;
    participantId: string;
    profileId: string;
    sessionId: string;
  }>;
};

type ActivitySelectionPostBody = {
  selectedActivityIds?: unknown;
  expectedVersion?: unknown;
  snapshotVersion?: unknown;
  selectionMode?: unknown;
  idempotencyKey?: unknown;
};

/**
 * GET .../participants/:participantId/profiles/:profileId/sessions/:sessionId/activity-selection
 * §11 — lectura factual del resultado effective; no recalcula.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const requestId = createOfficialPanelRequestId();
  const auth = await authenticateOfficialControlPanelConsultant(request);
  if (!auth.ok) {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: auth.code,
        requestId,
        message: auth.message,
        retryable: false,
      }),
      auth.status,
    );
  }

  const scope = await resolveAuthorizedScope(auth, params, requestId);
  if (!scope.ok) return scope.response;

  const selectionRepository =
    createOfficialControlPanelActivitySelectionRepository(auth.client);

  try {
    const body = await buildActivitySelectionCoverageView(selectionRepository, {
      caseId: scope.caseId,
      participantId: scope.participantId,
      profileId: scope.profileId,
      roleRuntimeSessionId: scope.sessionId,
    });
    return noStoreJson(body, 200);
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "activity_selection_unavailable",
        requestId,
        message: "No fue posible cargar la cobertura de actividades.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}

/**
 * POST .../activity-selection
 * R4 FX-03/FX-04 — apply an immutable canonical policy projection through the
 * authenticated RPC. The browser never supplies a WorkMap or fixture source.
 *
 * Body:
 * {
 *   selectedActivityIds: string[],
 *   expectedVersion: number,   // current max result_version (0 if none)
 *   snapshotVersion: number,
 *   selectionMode: "non_competitive_inclusion" | "competitive_selection",
 *   idempotencyKey: string,
 * }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const requestId = createOfficialPanelRequestId();
  const started = Date.now();
  const auth = await authenticateOfficialControlPanelConsultant(request);
  if (!auth.ok) {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: auth.code,
        requestId,
        message: auth.message,
        retryable: false,
      }),
      auth.status,
    );
  }

  let body: ActivitySelectionPostBody;
  try {
    body = (await request.json()) as ActivitySelectionPostBody;
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "activity_selection_invalid_body",
        requestId,
        message: "No fue posible interpretar la solicitud de selección.",
        retryable: false,
      }),
      422,
    );
  }

  const selectedActivityIds = normalizeIdList(body.selectedActivityIds);
  const expectedVersion = Number(body.expectedVersion);
  const snapshotVersion = Number(body.snapshotVersion);
  const selectionMode =
    typeof body.selectionMode === "string" ? body.selectionMode.trim() : "";
  const idempotencyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  if (
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 0 ||
    !Number.isInteger(snapshotVersion) ||
    snapshotVersion < 1 ||
    ![
      "reentry_required",
      "non_competitive_inclusion",
      "competitive_selection",
      "manual_review_required",
    ].includes(selectionMode) ||
    !idempotencyKey
  ) {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "activity_selection_invalid_payload",
        requestId,
        message: "Faltan datos necesarios para publicar la selección.",
        retryable: false,
      }),
      422,
    );
  }

  // FX-04 reject path: >8 selected → canonical code, zero mutations.
  const countGuard = assertSelectedActivityCountAllowed(selectedActivityIds);
  if (!countGuard.ok) {
    logOfficialPanelEvent({
      level: "warn",
      requestId,
      operation: "activity_selection_post",
      result: "denied",
      errorCode: countGuard.code,
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: countGuard.code,
        requestId,
        message:
          "No se pueden publicar más de ocho actividades primarias. La solicitud no se aplicó.",
        retryable: false,
      }),
      422,
    );
  }

  const scope = await resolveAuthorizedScope(auth, params, requestId, started);
  if (!scope.ok) return scope.response;

  try {
    const { data, error } = await auth.client.rpc(
      "eve_publish_canonical_activity_selection_as_consultant",
      {
        p_case_id: scope.caseId,
        p_participant_id: scope.participantId,
        p_profile_id: scope.profileId,
        p_role_runtime_session_id: scope.sessionId,
        p_expected_version: expectedVersion,
        p_snapshot_version: snapshotVersion,
        p_idempotency_key: idempotencyKey,
        p_requested_activity_ids: selectedActivityIds,
        p_selection_mode: selectionMode,
        p_request_id: requestId,
      },
    );

    if (error) {
      const mapped = mapRpcError(error.message ?? "");
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "activity_selection_post",
        result: "denied",
        caseId: scope.caseId,
        errorCode: mapped.code,
        durationMs: Date.now() - started,
      });
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: mapped.code,
          requestId,
          message: mapped.message,
          retryable: false,
        }),
        mapped.status,
      );
    }

    const selectionRepository =
      createOfficialControlPanelActivitySelectionRepository(auth.client);
    const coverage = await buildActivitySelectionCoverageView(
      selectionRepository,
      {
        caseId: scope.caseId,
        participantId: scope.participantId,
        profileId: scope.profileId,
        roleRuntimeSessionId: scope.sessionId,
      },
    );

    logOfficialPanelEvent({
      level: "info",
      requestId,
      operation: "activity_selection_post",
      result: "ok",
      caseId: scope.caseId,
      durationMs: Date.now() - started,
    });

    return noStoreJson(
      {
        requestId,
        dataStatus: coverage.dataStatus,
        actionResult: data,
        coverage,
        errors: [],
      },
      200,
    );
  } catch {
    logOfficialPanelEvent({
      level: "error",
      requestId,
      operation: "activity_selection_post",
      result: "error",
      caseId: scope.caseId,
      errorCode: "activity_selection_unavailable",
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "activity_selection_unavailable",
        requestId,
        message: "No fue posible publicar la selección de actividades.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}

async function resolveAuthorizedScope(
  auth: Extract<
    Awaited<ReturnType<typeof authenticateOfficialControlPanelConsultant>>,
    { ok: true }
  >,
  params: RouteParams["params"],
  requestId: string,
  started?: number,
): Promise<
  | {
      ok: true;
      caseId: string;
      participantId: string;
      profileId: string;
      sessionId: string;
    }
  | { ok: false; response: NextResponse }
> {
  const { caseId, participantId, profileId, sessionId } = await params;
  if (
    !isOpaqueUuid(caseId) ||
    !isOpaqueUuid(participantId) ||
    !isOpaqueUuid(profileId) ||
    !isOpaqueUuid(sessionId)
  ) {
    return {
      ok: false,
      response: accessDenied(requestId, caseId, started),
    };
  }

  const contextRepository = createOfficialControlPanelContextRepository(
    auth.client,
  );
  const participantsRepository =
    createOfficialControlPanelParticipantsRepository(auth.client);
  const monitoringRuntime =
    createOfficialControlPanelMonitoringRuntimeRepository(auth.client);

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return {
        ok: false,
        response: accessDenied(requestId, caseId, started),
      };
    }

    const participant = await participantsRepository.findParticipantById(
      participantId,
    );
    if (!participant?.enabled || participant.caseId !== caseId) {
      return {
        ok: false,
        response: accessDenied(requestId, caseId, started),
      };
    }

    const profile = await participantsRepository.findProfileById(profileId);
    if (!profile?.enabled || profile.caseParticipantId !== participantId) {
      return {
        ok: false,
        response: accessDenied(requestId, caseId, started),
      };
    }

    const access = await assertMonitoringParticipantAccess(
      contextRepository,
      participantsRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
        participantId,
        profileId,
      },
    );
    if (!access.ok) {
      return {
        ok: false,
        response: noStoreJson(
          buildSafeOfficialPanelErrorBody({
            code: access.code,
            requestId,
            message: access.message,
            retryable: false,
          }),
          access.status,
        ),
      };
    }

    const linked =
      await monitoringRuntime.findLinkedRoleSessionsByProfile(profileId);
    const match = linked.find(
      (item) =>
        item.roleRuntimeSessionId === sessionId &&
        item.linkStatus === "confirmed" &&
        item.caseId === caseId,
    );
    if (!match) {
      return {
        ok: false,
        response: accessDenied(requestId, caseId, started),
      };
    }

    return { ok: true, caseId, participantId, profileId, sessionId };
  } catch {
    return {
      ok: false,
      response: noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "activity_selection_unavailable",
          requestId,
          message: "No fue posible cargar la cobertura de actividades.",
          retryable: true,
          dataStatus: "error",
        }),
        500,
      ),
    };
  }
}

function normalizeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed) out.add(trimmed);
  }
  return [...out].sort();
}

function mapRpcError(
  message: string,
): { status: number; code: string; message: string } {
  const raw = message.toLowerCase();
  if (raw.includes("selection_result_more_than_eight_primary")) {
    return {
      status: 422,
      code: SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY,
      message:
        "No se pueden publicar más de ocho actividades primarias. La solicitud no se aplicó.",
    };
  }
  if (raw.includes("stale_activity_selection_version")) {
    return {
      status: 409,
      code: "STALE_ACTIVITY_SELECTION_VERSION",
      message: "La selección cambió; actualice antes de continuar.",
    };
  }
  if (raw.includes("snapshot_not_found")) {
    return {
      status: 409,
      code: "ACTIVITY_SELECTION_SNAPSHOT_NOT_FOUND",
      message: "El mapa de trabajo cambió; actualice antes de continuar.",
    };
  }
  if (raw.includes("idempotency_conflict")) {
    return {
      status: 409,
      code: "IDEMPOTENCY_CONFLICT",
      message: "La solicitud entra en conflicto con una acción previa.",
    };
  }
  if (
    raw.includes("access_denied") ||
    raw.includes("auth_required") ||
    raw.includes("capability_denied")
  ) {
    return {
      status: 403,
      code: "activity_selection_access_denied",
      message: "No tiene autorización para publicar la selección.",
    };
  }
  if (
    raw.includes("invalid") ||
    raw.includes("mismatch") ||
    raw.includes("requires") ||
    raw.includes("precondition")
  ) {
    return {
      status: 422,
      code: "activity_selection_precondition_failed",
      message: "No se cumplen las condiciones para publicar la selección.",
    };
  }
  return {
    status: 500,
    code: "activity_selection_unavailable",
    message: "No fue posible publicar la selección de actividades.",
  };
}

function accessDenied(
  requestId: string,
  caseId?: string,
  started?: number,
) {
  if (typeof started === "number") {
    logOfficialPanelEvent({
      level: "warn",
      requestId,
      operation: "activity_selection_post",
      result: "denied",
      caseId,
      errorCode: "activity_selection_access_denied",
      durationMs: Date.now() - started,
    });
  }
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "activity_selection_access_denied",
      requestId,
      message: "No fue posible cargar la cobertura de actividades.",
      retryable: false,
    }),
    403,
  );
}

function noStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
