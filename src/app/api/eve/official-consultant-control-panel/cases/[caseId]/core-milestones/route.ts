import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { createOfficialControlPanelCoreMilestoneAxisRepository } from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis-repository";

import {

  assertConsultantCaseCoreMilestoneAccess,

  resolveCoreMilestoneAxisResponse,

} from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis-service";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET /api/eve/official-consultant-control-panel/cases/:caseId/core-milestones

 *

 * Rector §8 Eje Y. Catalog always present. Per-H reached is degradable.

 * Never invents Amber achievements.

 */

export async function GET(

  request: Request,

  { params }: { params: Promise<{ caseId: string }> },

) {

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



  const { caseId } = await params;

  if (!isOpaqueUuid(caseId)) return accessDenied(requestId);



  const contextRepository = createOfficialControlPanelContextRepository(

    auth.client,

  );

  const axisRepository = createOfficialControlPanelCoreMilestoneAxisRepository(

    auth.client,

  );



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (

      !linkedCase ||

      !linkedCase.companyId ||

      !linkedCase.relationshipId

    ) {

      return accessDenied(requestId);

    }



    const access = await assertConsultantCaseCoreMilestoneAccess(

      contextRepository,

      {

        consultantUserId: auth.consultantUserId,

        companyId: linkedCase.companyId,

        relationshipId: linkedCase.relationshipId,

        caseId,

      },

    );



    if (!access.ok) {

      return noStoreJson(

        buildSafeOfficialPanelErrorBody({

          code: access.code,

          requestId,

          message: access.message,

          retryable: false,

        }),

        access.status,

      );

    }



    const body = await resolveCoreMilestoneAxisResponse(axisRepository, caseId);

    return noStoreJson(body, 200);

  } catch {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "core_milestone_data_unavailable",

        requestId,

        message: "No fue posible abrir los hitos core del caso.",

        retryable: true,

        dataStatus: "error",

      }),

      500,

    );

  }

}

/** Canonical FX-12 event. The final projection is written inside the governed RPC. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
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

  const { caseId } = await params;
  if (!isOpaqueUuid(caseId)) return accessDenied(requestId);

  let body: { eventType?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return coreEventError(requestId, "core_final_event_invalid_payload", 422);
  }
  if (
    body.eventType !== "core_closed_without_sufficiency" ||
    typeof body.reason !== "string" ||
    !body.reason.trim()
  ) {
    return coreEventError(requestId, "core_final_event_invalid_payload", 422);
  }

  const { data, error } = await auth.client.rpc(
    "eve_close_core_without_sufficiency_as_consultant",
    {
      p_case_id: caseId,
      p_reason: body.reason.trim(),
      p_request_id: requestId,
    },
  );
  if (error) {
    if (error.message.includes("access_denied")) return accessDenied(requestId);
    return coreEventError(
      requestId,
      error.message.includes("already_closed")
        ? "core_final_event_already_closed"
        : "core_final_event_rejected",
      409,
    );
  }

  return noStoreJson({ requestId, event: data, errors: [] }, 200);
}

function coreEventError(requestId: string, code: string, status: number) {
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code,
      requestId,
      message: "No fue posible registrar el cierre alternativo.",
      retryable: false,
    }),
    status,
  );
}



function accessDenied(requestId: string) {

  return noStoreJson(

    buildSafeOfficialPanelErrorBody({

      code: "core_milestone_access_denied",

      requestId,

      message: "No fue posible abrir los hitos core del caso.",

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


