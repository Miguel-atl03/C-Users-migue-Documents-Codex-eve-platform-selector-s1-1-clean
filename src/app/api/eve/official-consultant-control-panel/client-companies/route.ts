import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



export async function GET(request: Request) {

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



  try {

    const repository = createOfficialControlPanelContextRepository(auth.client);

    const companies = await repository.listCompanies(auth.consultantUserId);

    return noStoreJson(companies, 200);

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



function noStoreJson(body: unknown, status: number) {

  return NextResponse.json(body, {

    status,

    headers: { "Cache-Control": "private, no-store" },

  });

}


