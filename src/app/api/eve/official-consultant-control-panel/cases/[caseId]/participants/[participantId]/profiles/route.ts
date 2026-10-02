import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";

import {

  assertConsultantCaseParticipantAccess,

  buildParticipantProfilesResponse,

} from "@/services/eve/official-control-panel/official-control-panel-participants-service";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET .../cases/:caseId/participants/:participantId/profiles

 *

 * Minimal functional profile summaries. No PII, Runtime, or diagnosis.

 */

export async function GET(

  request: Request,

  {

    params,

  }: {

    params: Promise<{ caseId: string; participantId: string }>;

  },

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



  const { caseId, participantId } = await params;

  if (!isOpaqueUuid(caseId) || !isOpaqueUuid(participantId)) {

    return accessDenied(requestId);

  }



  const contextRepository = createOfficialControlPanelContextRepository(

    auth.client,

  );

  const participantsRepository =

    createOfficialControlPanelParticipantsRepository(auth.client);



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (!linkedCase || !linkedCase.companyId || !linkedCase.relationshipId) {

      return accessDenied(requestId);

    }



    const access = await assertConsultantCaseParticipantAccess(

      contextRepository,

      participantsRepository,

      {

        consultantUserId: auth.consultantUserId,

        companyId: linkedCase.companyId,

        relationshipId: linkedCase.relationshipId,

        caseId,

        participantId,

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



    const profiles = await buildParticipantProfilesResponse(

      participantsRepository,

      participantId,

    );

    return noStoreJson({ profiles }, 200);

  } catch {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "participation_data_unavailable",

        requestId,

        message: "No fue posible abrir la participación solicitada.",

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

      code: "participation_access_denied",

      requestId,

      message: "No fue posible abrir la participación solicitada.",

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


