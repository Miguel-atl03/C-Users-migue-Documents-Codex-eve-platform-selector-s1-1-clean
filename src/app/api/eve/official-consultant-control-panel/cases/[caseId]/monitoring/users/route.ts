import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";

import { createOfficialControlPanelMonitoringRuntimeRepository } from "@/services/eve/official-control-panel/official-control-panel-monitoring-runtime-repository";

import {

  assertMonitoringParticipantAccess,

  buildMonitoringUsersResponse,

} from "@/services/eve/official-control-panel/official-control-panel-monitoring-service";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET .../cases/:caseId/monitoring/users

 * §10.1 — tabla usuarios. Engagement/readiness/actividades = No disponible sin fuente.

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

  const participantsRepository =

    createOfficialControlPanelParticipantsRepository(auth.client);

  const runtimeRepository =

    createOfficialControlPanelMonitoringRuntimeRepository(auth.client);



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (!linkedCase || !linkedCase.companyId || !linkedCase.relationshipId) {

      return accessDenied(requestId);

    }



    const access = await assertMonitoringParticipantAccess(

      contextRepository,

      participantsRepository,

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



    const body = await buildMonitoringUsersResponse(

      participantsRepository,

      runtimeRepository,

      caseId,

    );

    return noStoreJson(body, 200);

  } catch {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "monitoring_data_unavailable",

        requestId,

        message: "No fue posible abrir el monitoreo recursivo del caso.",

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

      code: "monitoring_access_denied",

      requestId,

      message: "No fue posible abrir el monitoreo recursivo del caso.",

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


