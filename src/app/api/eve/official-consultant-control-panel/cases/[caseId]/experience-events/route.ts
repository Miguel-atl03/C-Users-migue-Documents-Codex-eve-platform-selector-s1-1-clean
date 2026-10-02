import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import {

  isExperienceEventType,

  isExperienceScreenKey,

} from "@/services/eve/official-control-panel/official-control-panel-experience.types";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import {

  createOfficialPanelRequestId,

  logOfficialPanelEvent,

} from "@/services/eve/official-control-panel/official-control-panel-observability";

import { assertConsultantCaseSupportProcessAccess } from "@/services/eve/official-control-panel/official-control-panel-support-process-service";



export const dynamic = "force-dynamic";



const PANEL_SOURCE_VERSION_PREFIX = "ola3-panel-v1";



type EventBody = {

  screenKey?: string;

  eventType?: string;

  sessionReference?: string;

  idempotencyKey?: string;

  roleRuntimeSessionId?: string | null;

  activityId?: string | null;

  metadata?: Record<string, unknown>;

};



/**

 * POST /api/eve/official-consultant-control-panel/cases/:caseId/experience-events

 * §§15–17 productive panel screen instrumentation (RPC only, append-only).

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



  let body: EventBody;

  try {

    body = (await request.json()) as EventBody;

  } catch {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "experience_event_invalid",

        requestId,

        message: "Cuerpo inválido.",

        retryable: false,

      }),

      400,

    );

  }



  const screenKey = body.screenKey?.trim() ?? "";

  const eventType = body.eventType?.trim() ?? "";

  if (!isExperienceScreenKey(screenKey) || !isExperienceEventType(eventType)) {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "experience_transition_not_allowed",

        requestId,

        message: "Evento de pantalla no permitido.",

        retryable: false,

      }),

      400,

    );

  }



  const sessionReference =

    typeof body.sessionReference === "string" &&

    body.sessionReference.trim().length > 0

      ? body.sessionReference.trim()

      : `official-panel:${auth.consultantUserId}:${caseId}`;



  const metadata =

    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)

      ? body.metadata

      : {};



  const transition =

    typeof metadata.navVersion === "number"

      ? String(metadata.navVersion)

      : typeof metadata.transition === "string"

        ? metadata.transition

        : "0";

  const sourceVersion = `${PANEL_SOURCE_VERSION_PREFIX}:t${transition}`;



  const contextRepository = createOfficialControlPanelContextRepository(

    auth.client,

  );



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (!linkedCase?.companyId || !linkedCase.relationshipId) {

      return denied(requestId, started, caseId);

    }



    const companyId = linkedCase.companyId;

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



    const idempotencyKey =
      typeof body.idempotencyKey === "string" &&
      body.idempotencyKey.trim().length > 0
        ? body.idempotencyKey.trim()
        : `${sessionReference}:${screenKey}:${eventType}:${sourceVersion}`;

    const roleRuntimeSessionId =
      typeof body.roleRuntimeSessionId === "string" &&
      isOpaqueUuid(body.roleRuntimeSessionId)
        ? body.roleRuntimeSessionId
        : null;

    const activityId =
      typeof body.activityId === "string" && isOpaqueUuid(body.activityId)
        ? body.activityId
        : null;

    const { data, error } = await auth.client.rpc(

      "eve_record_experience_event_as_user",

      {

        p_case_id: caseId,

        p_screen_key: screenKey,

        p_event_type: eventType,

        p_request_id: requestId,

        p_idempotency_key: idempotencyKey,

        p_session_reference: sessionReference,

        p_role_runtime_session_id: roleRuntimeSessionId,

        p_activity_id: activityId,

        p_source_version: sourceVersion,

        p_metadata: {

          ...metadata,

          surface: "official_consultant_control_panel",

          navVersion: Number.isFinite(Number(transition))

            ? Number(transition)

            : transition,

        },

      },

    );



    if (error) {

      logOfficialPanelEvent({

        level: "warn",

        requestId,

        operation: "experience_event_post",

        result: "denied",

        caseId,

        errorCode: "experience_transition_not_allowed",

        durationMs: Date.now() - started,

      });

      return noStoreJson(
        {
          ok: false,
          status: "degraded",
          code: "experience_transition_not_allowed",
          requestId,
          message:
            "La instrumentación de pantalla no está disponible para esta transición.",
          retryable: false,
        },
        200,
      );

    }



    logOfficialPanelEvent({

      level: "info",

      requestId,

      operation: "experience_event_post",

      result: "ok",

      caseId,

      durationMs: Date.now() - started,

    });



    return noStoreJson({ ok: true, event: data }, 200);

  } catch {

    logOfficialPanelEvent({

      level: "error",

      requestId,

      operation: "experience_event_post",

      result: "error",

      caseId,

      errorCode: "experience_event_unavailable",

      durationMs: Date.now() - started,

    });

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "experience_event_unavailable",

        requestId,

        message: "No fue posible registrar el evento de pantalla.",

        retryable: true,

        dataStatus: "error",

      }),

      500,

    );

  }

}



function denied(requestId: string, started: number, caseId: string) {

  logOfficialPanelEvent({

    level: "warn",

    requestId,

    operation: "experience_event_post",

    result: "denied",

    caseId,

    errorCode: "experience_access_denied",

    durationMs: Date.now() - started,

  });

  return noStoreJson(

    buildSafeOfficialPanelErrorBody({

      code: "experience_access_denied",

      requestId,

      message: "No fue posible registrar el evento de experiencia.",

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


