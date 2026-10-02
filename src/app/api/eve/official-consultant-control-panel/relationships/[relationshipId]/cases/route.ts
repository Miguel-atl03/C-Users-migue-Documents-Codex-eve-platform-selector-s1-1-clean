import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { assertConsultantClientContextAccess } from "@/services/eve/official-control-panel/official-control-panel-context-service";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



export async function GET(

  request: Request,

  { params }: { params: Promise<{ relationshipId: string }> },

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



  const { relationshipId } = await params;

  if (!isOpaqueUuid(relationshipId)) return accessDenied(requestId);



  const repository = createOfficialControlPanelContextRepository(auth.client);



  try {

    const relationship = await repository.findRelationship(relationshipId);

    if (!relationship) return accessDenied(requestId);



    const access = await assertConsultantClientContextAccess(repository, {

      consultantUserId: auth.consultantUserId,

      companyId: relationship.companyId,

      relationshipId,

    });



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



    const cases = await repository.listCases(

      auth.consultantUserId,

      relationshipId,

    );

    return noStoreJson(cases, 200);

  } catch {

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "context_data_unavailable",

        requestId,

        message: "No fue posible cargar el contexto.",

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

      code: "context_access_denied",

      requestId,

      message: "No fue posible abrir el contexto solicitado.",

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


