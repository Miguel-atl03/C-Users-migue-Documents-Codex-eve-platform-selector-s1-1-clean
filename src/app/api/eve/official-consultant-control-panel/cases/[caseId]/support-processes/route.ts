import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import {

  assertConsultantCaseSupportProcessAccess,

  buildSupportProcessAxisResponse,

} from "@/services/eve/official-control-panel/official-control-panel-support-process-service";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET /api/eve/official-consultant-control-panel/cases/:caseId/support-processes

 *

 * Returns rector §7 catalog. Operational status is degradable (unavailable)

 * when no factual per-case source exists. Never invents Amber state.

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



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (

      !linkedCase ||

      !linkedCase.companyId ||

      !linkedCase.relationshipId

    ) {

      return accessDenied(requestId);

    }



    const access = await assertConsultantCaseSupportProcessAccess(

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



    const body = buildSupportProcessAxisResponse();

    return noStoreJson(body, 200);

  } catch {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "support_process_data_unavailable",

        requestId,

        message: "No fue posible abrir los procesos de soporte del caso.",

        retryable: true,

        dataStatus: "error",

      }),

      500,

    );

  }

}



function accessDenied(requestId: string) {

  return noStoreJson(

    buildSafeOfficialPanelErrorBody({

      code: "support_process_access_denied",

      requestId,

      message: "No fue posible abrir los procesos de soporte del caso.",

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


