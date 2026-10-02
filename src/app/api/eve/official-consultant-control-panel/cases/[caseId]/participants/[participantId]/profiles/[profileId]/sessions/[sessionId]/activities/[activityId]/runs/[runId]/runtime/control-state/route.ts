import {

  authorizeRuntimeMatrixScope,

  noStoreJson,

} from "@/services/eve/official-control-panel/authorize-runtime-matrix-scope";

import { buildRuntimeControlStateView } from "@/services/eve/official-control-panel/official-control-panel-runtime-control-service";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import {

  createOfficialPanelRequestId,

  logOfficialPanelEvent,

} from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET .../runs/:runId/runtime/control-state

 * §12 Entrega C — gaps, timers, reentry, revisión, readiness (snapshot effective).

 */

export async function GET(

  request: Request,

  {

    params,

  }: {

    params: Promise<{

      caseId: string;

      participantId: string;

      profileId: string;

      sessionId: string;

      activityId: string;

      runId: string;

    }>;

  },

) {

  const requestId = createOfficialPanelRequestId();

  const started = Date.now();

  try {

    const resolved = await params;

    const scope = await authorizeRuntimeMatrixScope(request, resolved, requestId);

    if (!scope.ok) {

      logOfficialPanelEvent({

        level: "warn",

        requestId,

        operation: "runtime.control-state",

        result: "denied",

        caseId: resolved.caseId,

        runId: resolved.runId,

        errorCode: "runtime_matrix_access_denied",

        durationMs: Date.now() - started,

      });

      return scope.response;

    }



    const body = await buildRuntimeControlStateView(scope.matrixRepository, {

      runId: resolved.runId,

      activityId: resolved.activityId,

    });

    logOfficialPanelEvent({

      level: "info",

      requestId,

      operation: "runtime.control-state",

      result: "ok",

      caseId: resolved.caseId,

      runId: resolved.runId,

      durationMs: Date.now() - started,

    });

    return noStoreJson(body, 200);

  } catch {

    logOfficialPanelEvent({

      level: "error",

      requestId,

      operation: "runtime.control-state",

      result: "error",

      errorCode: "runtime_control_state_unavailable",

      durationMs: Date.now() - started,

    });

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "runtime_control_state_unavailable",

        requestId,

        message: "No fue posible cargar el estado de control Runtime.",

        retryable: true,

        dataStatus: "error",

      }),

      500,

    );

  }

}


