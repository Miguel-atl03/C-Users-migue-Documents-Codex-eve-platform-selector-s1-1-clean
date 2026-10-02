import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { createOfficialControlPanelManualWorkRepository } from "@/services/eve/official-control-panel/official-control-panel-manual-work-repository";

import { loadManualWorkTrackingForCase } from "@/services/eve/official-control-panel/official-control-panel-manual-work-service";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import {

  createOfficialPanelRequestId,

  logOfficialPanelEvent,

} from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET /api/eve/official-consultant-control-panel/cases/:caseId/manual-work

 * §13 Seguimiento — read-only tracking view model for P-SUP-03/04/05.

 */

export async function GET(

  request: Request,

  { params }: { params: Promise<{ caseId: string }> },

) {

  const requestId = createOfficialPanelRequestId();

  const started = Date.now();

  const auth = await authenticateOfficialControlPanelConsultant(request);

  if (!auth.ok) {

    logOfficialPanelEvent({

      level: "warn",

      requestId,

      operation: "manual_work_get",

      result: "denied",

      errorCode: auth.code,

      durationMs: Date.now() - started,

    });

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

    logOfficialPanelEvent({

      level: "warn",

      requestId,

      operation: "manual_work_get",

      result: "denied",

      caseId,

      errorCode: "manual_work_access_denied",

      durationMs: Date.now() - started,

    });

    return accessDenied(requestId);

  }



  const contextRepository = createOfficialControlPanelContextRepository(

    auth.client,

  );

  const manualWorkRepository = createOfficialControlPanelManualWorkRepository(

    auth.client,

  );



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (!linkedCase?.companyId || !linkedCase.relationshipId) {

      logOfficialPanelEvent({

        level: "warn",

        requestId,

        operation: "manual_work_get",

        result: "denied",

        caseId,

        errorCode: "manual_work_access_denied",

        durationMs: Date.now() - started,

      });

      return accessDenied(requestId);

    }



    const loaded = await loadManualWorkTrackingForCase({

      contextRepository,

      manualWorkRepository,

      consultantUserId: auth.consultantUserId,

      caseId,

      companyId: linkedCase.companyId,

      relationshipId: linkedCase.relationshipId,

    });



    if (!loaded.ok) {

      logOfficialPanelEvent({

        level: loaded.status >= 500 ? "error" : "warn",

        requestId,

        operation: "manual_work_get",

        result: loaded.status >= 500 ? "unavailable" : "denied",

        caseId,

        errorCode: loaded.code,

        durationMs: Date.now() - started,

      });

      return noStoreJson(

        buildSafeOfficialPanelErrorBody({

          code: loaded.code,

          requestId,

          message: loaded.message,

          retryable: loaded.status >= 500,

          ...(loaded.status >= 500 ? { dataStatus: "error" as const } : {}),

        }),

        loaded.status,

      );

    }



    const overdueCount = loaded.body.overdueAlerts.length;

    logOfficialPanelEvent({

      level: overdueCount > 0 ? "warn" : "info",

      requestId,

      operation: "manual_work_get",

      result: "ok",

      caseId,

      durationMs: Date.now() - started,

      errorCode:

        overdueCount > 0

          ? `manual_handoff_overdue_count_${overdueCount}`

          : loaded.body.dataStatus === "partial"

            ? "manual_work_partial"

            : null,

    });



    return noStoreJson(loaded.body, 200);

  } catch {

    logOfficialPanelEvent({

      level: "error",

      requestId,

      operation: "manual_work_get",

      result: "error",

      caseId,

      errorCode: "manual_work_data_unavailable",

      durationMs: Date.now() - started,

    });

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "manual_work_data_unavailable",

        requestId,

        message: "No fue posible cargar el seguimiento de procesos manuales.",

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

      code: "manual_work_access_denied",

      requestId,

      message: "No fue posible abrir el seguimiento de procesos manuales.",

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


