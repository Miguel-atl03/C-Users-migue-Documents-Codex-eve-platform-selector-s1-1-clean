import {
  authorizeRuntimeMatrixScope,
  noStoreJson,
} from "@/services/eve/official-control-panel/authorize-runtime-matrix-scope";
import { buildRuntimeCausalMatrixView } from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix-service";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  createOfficialPanelRequestId,
  logOfficialPanelEvent,
} from "@/services/eve/official-control-panel/official-control-panel-observability";

export const dynamic = "force-dynamic";

/**
 * GET .../runs/:runId/runtime/causal-matrix
 * §12-B Matriz Causal 20 — catálogo + overlay factual.
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
        operation: "runtime.causal-matrix",
        result: "denied",
        caseId: resolved.caseId,
        runId: resolved.runId,
        errorCode: "runtime_matrix_access_denied",
        durationMs: Date.now() - started,
      });
      return scope.response;
    }

    const body = await buildRuntimeCausalMatrixView(scope.matrixRepository, {
      caseId: resolved.caseId,
      runId: resolved.runId,
      activityId: resolved.activityId,
      participantLabel: scope.participantLabel,
      functionalProfileLabel: scope.functionalProfileLabel,
      activityLabel: scope.activityLabel,
    });
    logOfficialPanelEvent({
      level: "info",
      requestId,
      operation: "runtime.causal-matrix",
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
      operation: "runtime.causal-matrix",
      result: "error",
      errorCode: "runtime_matrix_unavailable",
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "runtime_matrix_unavailable",
        requestId,
        message: "No fue posible cargar la matriz Runtime.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}
