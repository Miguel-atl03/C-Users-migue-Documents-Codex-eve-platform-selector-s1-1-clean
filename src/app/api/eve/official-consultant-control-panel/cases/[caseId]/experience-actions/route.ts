import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import {
  capabilityForAction,
  isExperienceActionType,
  isExperienceScreenKey,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import {
  buildExperienceCapabilityMatrix,
  isCompatibleExperienceBeforeState,
  isExperienceActionCapabilityAllowed,
} from "@/services/eve/official-control-panel/official-control-panel-experience-capabilities";
import { resolveCapabilityAllowed } from "@/services/eve/official-control-panel/official-control-panel-capability-catalog";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  createOfficialPanelRequestId,
  logOfficialPanelEvent,
} from "@/services/eve/official-control-panel/official-control-panel-observability";
import { assertConsultantCaseSupportProcessAccess } from "@/services/eve/official-control-panel/official-control-panel-support-process-service";

export const dynamic = "force-dynamic";

type ActionBody = {
  companyId?: string;
  userId?: string;
  screenKey?: string;
  actionType?: string;
  reasonCode?: string;
  beforeState?: string;
  expectedEffect?: string;
  roleRuntimeSessionId?: string | null;
  activityId?: string | null;
  effectPayload?: Record<string, unknown>;
  idempotencyKey?: string;
  requestId?: string;
};

/**
 * POST /api/eve/official-consultant-control-panel/cases/:caseId/experience-actions
 * §16 governed support interventions (RPC only).
 * Capability is re-validated server-side; privileged infrastructure never substitutes allow.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
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

  const { caseId } = await params;
  if (!isOpaqueUuid(caseId)) {
    return denied(requestId, started, caseId);
  }

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "experience_action_invalid",
        requestId,
        message: "Cuerpo inválido.",
        retryable: false,
      }),
      400,
    );
  }

  const userId = textField(body.userId);
  const screenKey = textField(body.screenKey);
  const actionType = textField(body.actionType);
  const reasonCode = textField(body.reasonCode);
  const beforeState = textField(body.beforeState);
  const expectedEffect = textField(body.expectedEffect);
  const idempotencyKey = textField(body.idempotencyKey);

  if (
    !isOpaqueUuid(userId) ||
    !isExperienceScreenKey(screenKey) ||
    !isExperienceActionType(actionType) ||
    !reasonCode ||
    !beforeState ||
    !expectedEffect ||
    !idempotencyKey
  ) {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "experience_transition_not_allowed",
        requestId,
        message: "Acción de soporte no permitida.",
        retryable: false,
      }),
      400,
    );
  }

  const contextRepository = createOfficialControlPanelContextRepository(
    auth.client,
  );

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return denied(requestId, started, caseId);
    }

    const companyId =
      body.companyId && isOpaqueUuid(body.companyId)
        ? body.companyId
        : linkedCase.companyId;
    if (companyId !== linkedCase.companyId) {
      return denied(requestId, started, caseId);
    }

    const access = await assertConsultantCaseSupportProcessAccess(
      contextRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
      },
    );
    if (!access.ok) {
      return denied(requestId, started, caseId);
    }

    const capability = capabilityForAction(actionType);
    const granted = await resolveExperienceGrants(
      auth.client,
      auth.consultantUserId,
      companyId,
    );
    const matrix = buildExperienceCapabilityMatrix({
      caseAccessAllowed: true,
      deniedKeys: EXPERIENCE_MUTATION_CAPS.filter((k) => !granted.has(k)),
    });

    if (
      !resolveCapabilityAllowed(matrix, capability) ||
      !isExperienceActionCapabilityAllowed(matrix, actionType)
    ) {
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "experience_action_post",
        result: "denied",
        caseId,
        errorCode: "experience_capability_denied",
        durationMs: Date.now() - started,
      });
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "experience_capability_denied",
          requestId,
          message: "Capability de acción de soporte no autorizada.",
          retryable: false,
        }),
        403,
      );
    }

    if (!isCompatibleExperienceBeforeState(beforeState)) {
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "experience_action_post",
        result: "denied",
        caseId,
        errorCode: "experience_before_state_incompatible",
        durationMs: Date.now() - started,
      });
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "experience_before_state_incompatible",
          requestId,
          message: "El before-state no es compatible con la acción.",
          retryable: false,
        }),
        422,
      );
    }

    // Single transactional RPC: capability + advisory lock + hash + action + ledger.
    // Never read/write experience_action_idempotency from BFF.
    const { data, error } = await auth.client.rpc(
      "eve_apply_experience_action_as_consultant",
      {
        p_case_id: caseId,
        p_user_id: userId,
        p_screen_key: screenKey,
        p_action_type: actionType,
        p_reason_code: reasonCode,
        p_before_state: beforeState,
        p_expected_effect: expectedEffect,
        p_idempotency_key: idempotencyKey,
        p_request_id: requestId,
        p_role_runtime_session_id: body.roleRuntimeSessionId ?? null,
        p_activity_id: body.activityId ?? null,
        p_effect_payload: body.effectPayload ?? {},
      },
    );

    if (error) {
      const msg = String(error.message ?? "");
      if (msg.includes("IDEMPOTENCY_CONFLICT")) {
        return noStoreJson(
          buildSafeOfficialPanelErrorBody({
            code: "IDEMPOTENCY_CONFLICT",
            requestId,
            message: "Conflicto de idempotencia en la acción de soporte.",
            retryable: false,
          }),
          409,
        );
      }
      if (msg.includes("experience_capability_denied")) {
        logOfficialPanelEvent({
          level: "warn",
          requestId,
          operation: "experience_action_post",
          result: "denied",
          caseId,
          errorCode: "experience_capability_denied",
          durationMs: Date.now() - started,
        });
        return noStoreJson(
          buildSafeOfficialPanelErrorBody({
            code: "experience_capability_denied",
            requestId,
            message: "Capability no concedida para esta acción.",
            retryable: false,
          }),
          403,
        );
      }
      if (msg.includes("experience_access_denied")) {
        return denied(requestId, started, caseId);
      }
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "experience_action_post",
        result: "denied",
        caseId,
        errorCode: "experience_transition_not_allowed",
        durationMs: Date.now() - started,
      });
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "experience_transition_not_allowed",
          requestId,
          message: "Acción de soporte no permitida.",
          retryable: false,
        }),
        400,
      );
    }

    const responseBody =
      data && typeof data === "object"
        ? (data as {
            ok?: boolean;
            action?: unknown;
            requestId?: string;
            actionId?: string | null;
          })
        : {
            ok: true,
            action: data,
            requestId,
            actionId: null,
          };

    logOfficialPanelEvent({
      level: "info",
      requestId,
      operation: "experience_action_post",
      result: "ok",
      caseId,
      durationMs: Date.now() - started,
    });

    return noStoreJson(
      {
        ok: responseBody.ok !== false,
        action: responseBody.action ?? null,
        requestId: responseBody.requestId ?? requestId,
        actionId: responseBody.actionId ?? null,
      },
      200,
    );
  } catch {
    logOfficialPanelEvent({
      level: "error",
      requestId,
      operation: "experience_action_post",
      result: "error",
      caseId,
      errorCode: "experience_action_unavailable",
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "experience_action_unavailable",
        requestId,
        message: "No fue posible registrar la acción de soporte.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}

const EXPERIENCE_MUTATION_CAPS = [
  "send_support_message",
  "request_reentry",
  "mark_manual_review",
  "view_experience_state",
] as const;

async function resolveExperienceGrants(
  client: SupabaseClient,
  consultantUserId: string,
  companyId: string,
): Promise<Set<string>> {
  // Explicit grant ∧ assignment ∧ validity (via SQL helper). Never imply from assignment alone.
  const granted = new Set<string>();
  for (const capability of EXPERIENCE_MUTATION_CAPS) {
    const { data, error } = await client.rpc(
      "eve_consultant_has_panel_capability",
      {
        p_company_id: companyId,
        p_capability: capability,
      },
    );
    if (error) {
      throw new Error("experience_capability_grants_unavailable");
    }
    if (data === true) granted.add(capability);
  }
  return granted;
}

function denied(requestId: string, started: number, caseId: string) {
  logOfficialPanelEvent({
    level: "warn",
    requestId,
    operation: "experience_action_post",
    result: "denied",
    caseId,
    errorCode: "experience_access_denied",
    durationMs: Date.now() - started,
  });
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "experience_access_denied",
      requestId,
      message: "No fue posible registrar la acción de soporte.",
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

function textField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
