import { NextRequest, NextResponse } from "next/server";

import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase-server";
import { bearerTokenFromRequest } from "@/lib/session-boundary";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import {
  isExperienceEventType,
  isExperienceScreenKey,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";

export const dynamic = "force-dynamic";

type ExperienceEventBody = {
  caseId?: string;
  screenKey?: string;
  eventType?: string;
  requestId?: string;
  idempotencyKey?: string;
  sessionReference?: string;
  roleRuntimeSessionId?: string | null;
  activityId?: string | null;
  sourceVersion?: string;
  metadata?: Record<string, unknown>;
};

const WORKMAP_DOMAIN_EVENT_MAP = {
  workmap_saved: "screen_completed",
  workmap_submitted: "screen_completed",
  screen_exited: "screen_abandoned",
} as const;

export async function POST(request: NextRequest) {
  const token = bearerTokenFromRequest(request);
  if (!token) {
    return safeJson(
      {
        error: "auth_required",
        client_safe_message: "Necesitamos una sesión activa para registrar esto.",
      },
      401,
    );
  }

  let body: ExperienceEventBody;
  try {
    body = (await request.json()) as ExperienceEventBody;
  } catch {
    return safeJson(
      {
        error: "invalid_request",
        client_safe_message: "No pudimos leer la solicitud de forma segura.",
      },
      400,
    );
  }

  const caseId = typeof body.caseId === "string" ? body.caseId.trim() : "";
  const screenKey =
    typeof body.screenKey === "string" ? body.screenKey.trim() : "";
  const requestedEventType =
    typeof body.eventType === "string" ? body.eventType.trim() : "";
  const eventType =
    WORKMAP_DOMAIN_EVENT_MAP[
      requestedEventType as keyof typeof WORKMAP_DOMAIN_EVENT_MAP
    ] ?? requestedEventType;
  const requestId =
    typeof body.requestId === "string" ? body.requestId.trim() : "";
  const idempotencyKey =
    typeof body.idempotencyKey === "string"
      ? body.idempotencyKey.trim()
      : "";
  const sessionReference =
    typeof body.sessionReference === "string"
      ? body.sessionReference.trim()
      : "";

  if (
    !isOpaqueUuid(caseId) ||
    !isExperienceScreenKey(screenKey) ||
    !isExperienceEventType(eventType) ||
    (requestedEventType in WORKMAP_DOMAIN_EVENT_MAP && screenKey !== "workmap") ||
    !requestId ||
    !idempotencyKey ||
    !sessionReference
  ) {
    return safeJson(
      {
        error: "invalid_scope",
        client_safe_message: "Faltan datos para registrar el avance.",
      },
      400,
    );
  }

  const roleRuntimeSessionId =
    typeof body.roleRuntimeSessionId === "string" &&
    isOpaqueUuid(body.roleRuntimeSessionId)
      ? body.roleRuntimeSessionId
      : null;
  const activityId =
    typeof body.activityId === "string" && isOpaqueUuid(body.activityId)
      ? body.activityId
      : null;

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

  const client = createAuthenticatedServerSupabaseClient(token);
  const { data, error } = await client.rpc("eve_record_experience_event_as_user", {
    p_case_id: caseId,
    p_screen_key: screenKey,
    p_event_type: eventType,
    p_request_id: requestId,
    p_idempotency_key: idempotencyKey,
    p_session_reference: sessionReference,
    p_role_runtime_session_id: roleRuntimeSessionId,
    p_activity_id: activityId,
    p_source_version:
      typeof body.sourceVersion === "string" && body.sourceVersion.trim()
        ? body.sourceVersion.trim()
        : "runtime-40-20-v1",
    p_metadata: {
      ...metadata,
      domainEventType: requestedEventType,
      surface: "runtime_40_20_client_bff",
    },
  });

  if (error) {
    const conflict = error.message.includes("IDEMPOTENCY_CONFLICT");
    return safeJson(
      {
        error: conflict ? "idempotency_conflict" : "event_rejected",
        client_safe_message: conflict
          ? "Ese registro ya existe con datos distintos."
          : "No pudimos registrar este evento.",
      },
      conflict ? 409 : 403,
    );
  }

  return safeJson({ ok: true, event: data }, 202);
}

export async function GET() {
  return safeJson(
    {
      error: "method_not_allowed",
      client_safe_message: "Este punto de acceso solo admite registro seguro.",
    },
    405,
  );
}

function safeJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
