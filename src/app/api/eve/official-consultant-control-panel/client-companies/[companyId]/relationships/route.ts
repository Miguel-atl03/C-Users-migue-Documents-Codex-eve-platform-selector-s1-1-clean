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

  { params }: { params: Promise<{ companyId: string }> },

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



  const { companyId } = await params;

  if (!isOpaqueUuid(companyId)) return accessDenied(requestId);



  const repository = createOfficialControlPanelContextRepository(auth.client);

  const access = await assertConsultantClientContextAccess(repository, {

    consultantUserId: auth.consultantUserId,

    companyId,

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



  try {

    const relationships = await repository.listRelationships(

      auth.consultantUserId,

      companyId,

    );

    return noStoreJson(relationships, 200);

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


