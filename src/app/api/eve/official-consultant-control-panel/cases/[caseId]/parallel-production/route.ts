import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { createOfficialControlPanelParallelProductionRepository } from "@/services/eve/official-control-panel/official-control-panel-parallel-production-repository";

import { loadParallelProductionForCase } from "@/services/eve/official-control-panel/official-control-panel-parallel-production-service";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";

import {

  createOfficialPanelRequestId,

  logOfficialPanelEvent,

} from "@/services/eve/official-control-panel/official-control-panel-observability";



export const dynamic = "force-dynamic";



/**

 * GET /api/eve/official-consultant-control-panel/cases/:caseId/parallel-production

 * §14 Producción Paralela y QA — read-only observation.

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

      operation: "parallel_production_get",

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

      operation: "parallel_production_get",

      result: "denied",

      caseId,

      errorCode: "parallel_production_access_denied",

      durationMs: Date.now() - started,

    });

    return accessDenied(requestId);

  }



  const contextRepository = createOfficialControlPanelContextRepository(

    auth.client,

  );

  const parallelProductionRepository =

    createOfficialControlPanelParallelProductionRepository(auth.client);



  try {

    const linkedCase = await contextRepository.findCase(caseId);

    if (!linkedCase?.companyId || !linkedCase.relationshipId) {

      logOfficialPanelEvent({

        level: "warn",

        requestId,

        operation: "parallel_production_get",

        result: "denied",

        caseId,

        errorCode: "parallel_production_access_denied",

        durationMs: Date.now() - started,

      });

      return accessDenied(requestId);

    }



    const loaded = await loadParallelProductionForCase({

      contextRepository,

      parallelProductionRepository,

      consultantUserId: auth.consultantUserId,

      caseId,

      companyId: linkedCase.companyId,

      relationshipId: linkedCase.relationshipId,

    });



    if (!loaded.ok) {

      logOfficialPanelEvent({

        level: loaded.status >= 500 ? "error" : "warn",

        requestId,

        operation: "parallel_production_get",

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



    const alertCount = loaded.body.alerts.length;

    logOfficialPanelEvent({

      level: alertCount > 0 ? "warn" : "info",

      requestId,

      operation: "parallel_production_get",

      result: "ok",

      caseId,

      workItemId: loaded.body.package?.id ?? null,

      durationMs: Date.now() - started,

      errorCode:

        alertCount > 0 ? `pp_alert_count_${alertCount}` : null,

    });



    return noStoreJson(loaded.body, 200);

  } catch {

    logOfficialPanelEvent({

      level: "error",

      requestId,

      operation: "parallel_production_get",

      result: "error",

      caseId,

      errorCode: "parallel_production_data_unavailable",

      durationMs: Date.now() - started,

    });

    return noStoreJson(

      buildSafeOfficialPanelErrorBody({

        code: "parallel_production_data_unavailable",

        requestId,

        message: "No fue posible cargar Producción Paralela y QA.",

        retryable: true,

        dataStatus: "error",

      }),

      200,

    );

  }

}

type ParallelProductionActionBody =
  | {
      action: "finding_transition";
      findingId: string;
      afterStatus: string;
      eventType: string;
      reason?: string | null;
      evidenceRef?: string | null;
      resolutionRef?: string | null;
      reevaluationResult?: string | null;
      reevaluationResultRef?: string | null;
      reevaluationEvaluationRef?: string | null;
    }
  | {
      action: "assessment_transition";
      packageId: string;
      assessmentAction:
        | "start_conformance"
        | "complete_conformance"
        | "start_consistency"
        | "complete_consistency";
      expectedPackageVersion: number;
      expectedAssessmentVersion?: number | null;
      idempotencyKey: string;
    }
  | { action: "attempt_export"; packageId: string };

/** Authenticated Point-14 product actions. Scope and capability are rechecked by RPC. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const requestId = createOfficialPanelRequestId();
  const started = Date.now();
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

  let body: ParallelProductionActionBody;
  try {
    body = (await request.json()) as ParallelProductionActionBody;
  } catch {
    return parallelActionError(requestId, "parallel_production_invalid_body", 422);
  }

  try {
    if (body.action === "finding_transition") {
      if (
        !isOpaqueUuid(body.findingId) ||
        !nonEmpty(body.afterStatus) ||
        !nonEmpty(body.eventType)
      ) {
        return parallelActionError(
          requestId,
          "parallel_production_invalid_payload",
          422,
        );
      }
      const { data, error } = await auth.client.rpc(
        "eve_apply_parallel_finding_transition_as_consultant",
        {
          p_case_id: caseId,
          p_finding_id: body.findingId,
          p_after_status: body.afterStatus.trim(),
          p_event_type: body.eventType.trim(),
          p_request_id: requestId,
          p_reason: cleanOptional(body.reason),
          p_evidence_ref: cleanOptional(body.evidenceRef),
          p_resolution_ref: cleanOptional(body.resolutionRef),
          p_reevaluation_result: cleanOptional(body.reevaluationResult),
          p_reevaluation_result_ref: cleanOptional(body.reevaluationResultRef),
          p_reevaluation_evaluation_ref: cleanOptional(
            body.reevaluationEvaluationRef,
          ),
        },
      );
      if (error) return mapParallelRpcError(requestId, error.message);
      const result = data as { allowed?: boolean; code?: string } | null;
      return noStoreJson(
        { requestId, actionResult: result, errors: [] },
        result?.allowed === false ? 422 : 200,
      );
    }

    if (body.action === "assessment_transition") {
      if (
        !isOpaqueUuid(body.packageId) ||
        !isAssessmentAction(body.assessmentAction) ||
        !isPositiveInteger(body.expectedPackageVersion) ||
        !isOptionalNonNegativeInteger(body.expectedAssessmentVersion) ||
        !nonEmpty(body.idempotencyKey)
      ) {
        return parallelActionError(
          requestId,
          "parallel_production_invalid_payload",
          422,
        );
      }
      const { data, error } = await auth.client.rpc(
        "eve_apply_parallel_assessment_action_as_consultant",
        {
          p_case_id: caseId,
          p_package_id: body.packageId,
          p_action: body.assessmentAction,
          p_expected_package_version: body.expectedPackageVersion,
          p_expected_assessment_version: body.expectedAssessmentVersion ?? null,
          p_idempotency_key: body.idempotencyKey.trim(),
          p_request_id: requestId,
        },
      );
      if (error) return mapParallelRpcError(requestId, error.message);
      const result = data as { allowed?: boolean; code?: string } | null;
      return noStoreJson(
        { requestId, actionResult: result, errors: [] },
        result?.allowed === false ? 422 : 200,
      );
    }

    if (body.action === "attempt_export") {
      if (!isOpaqueUuid(body.packageId)) {
        return parallelActionError(
          requestId,
          "parallel_production_invalid_payload",
          422,
        );
      }
      const { data, error } = await auth.client.rpc(
        "eve_attempt_parallel_export_as_consultant",
        {
          p_case_id: caseId,
          p_package_id: body.packageId,
          p_request_id: requestId,
        },
      );
      if (error) return mapParallelRpcError(requestId, error.message);
      const result = data as { allowed?: boolean; code?: string } | null;
      return noStoreJson(
        { requestId, actionResult: result, errors: [] },
        result?.allowed === false ? 409 : 200,
      );
    }

    return parallelActionError(
      requestId,
      "parallel_production_invalid_action",
      422,
    );
  } catch {
    logOfficialPanelEvent({
      level: "error",
      requestId,
      operation: "parallel_production_post",
      result: "error",
      caseId,
      errorCode: "parallel_production_action_unavailable",
      durationMs: Date.now() - started,
    });
    return parallelActionError(
      requestId,
      "parallel_production_action_unavailable",
      500,
      true,
    );
  }
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanOptional(value: unknown): string | null {
  return nonEmpty(value) ? value.trim() : null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isOptionalNonNegativeInteger(value: unknown): value is number | null | undefined {
  return (
    value == null ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0)
  );
}

function isAssessmentAction(
  value: unknown,
): value is
  | "start_conformance"
  | "complete_conformance"
  | "start_consistency"
  | "complete_consistency" {
  return (
    value === "start_conformance" ||
    value === "complete_conformance" ||
    value === "start_consistency" ||
    value === "complete_consistency"
  );
}

function mapParallelRpcError(requestId: string, message: string) {
  if (message.includes("parallel_production_access_denied")) {
    return accessDenied(requestId);
  }
  if (message.includes("parallel_assessment_producer_unavailable")) {
    return parallelActionError(
      requestId,
      "parallel_assessment_producer_unavailable",
      503,
      true,
    );
  }
  if (
    message.includes("parallel_assessment_stale_package_version") ||
    message.includes("parallel_assessment_stale_state") ||
    message.includes("STALE_PARALLEL_PRODUCTION_PACKAGE") ||
    message.includes("IDEMPOTENCY_CONFLICT")
  ) {
    return parallelActionError(
      requestId,
      message.includes("IDEMPOTENCY_CONFLICT")
        ? "parallel_production_idempotency_conflict"
        : "parallel_production_stale_state",
      409,
    );
  }
  if (
    message.includes(
      "parallel_consistency_blocked_until_conformance_completed",
    ) ||
    message.includes("parallel_assessment_start_required") ||
    message.includes("parallel_assessment_report_ref_required") ||
    message.includes("parallel_assessment_invalid_transition") ||
    message.includes("parallel_assessment_invalid_action")
  ) {
    return parallelActionError(requestId, message, 422);
  }
  return parallelActionError(
    requestId,
    message.includes("transition_not_allowed")
      ? "parallel_production_transition_not_allowed"
      : "parallel_production_action_rejected",
    422,
  );
}

function parallelActionError(
  requestId: string,
  code: string,
  status: number,
  retryable = false,
) {
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code,
      requestId,
      message: "No fue posible aplicar la acción de Producción Paralela.",
      retryable,
      ...(status >= 500 ? { dataStatus: "error" as const } : {}),
    }),
    status,
  );
}



function accessDenied(requestId: string) {

  return noStoreJson(

    buildSafeOfficialPanelErrorBody({

      code: "parallel_production_access_denied",

      requestId,

      message: "No fue posible abrir Producción Paralela y QA.",

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


