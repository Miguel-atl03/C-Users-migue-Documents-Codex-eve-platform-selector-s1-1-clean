import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { createOfficialControlPanelManualWorkRepository } from "@/services/eve/official-control-panel/official-control-panel-manual-work-repository";
import { loadManualWorkTrackingForCase } from "@/services/eve/official-control-panel/official-control-panel-manual-work-service";
import {
  buildManualWorkCapabilityMatrix,
  resolveCapabilityAllowed,
} from "@/services/eve/official-control-panel/official-control-panel-capability-catalog";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  createOfficialPanelRequestId,
  logOfficialPanelEvent,
} from "@/services/eve/official-control-panel/official-control-panel-observability";

export const dynamic = "force-dynamic";

type ManualActionBody = {
  workItemId?: string;
  action?: string;
  expectedStatus?: string;
  expectedVersion?: number;
  idempotencyKey?: string;
  reason?: string;
  artifactVersionId?: string | null;
  attachFilename?: string;
  attachContentType?: string;
  attachSha256?: string;
  attachContentBase64?: string;
};

const PRODUCT_ACTIONS = new Set([
  "register_start",
  "attach_output",
  "submit_review",
  "accept_output",
]);

/**
 * POST /api/eve/official-consultant-control-panel/cases/:caseId/manual-actions
 * R2 — governed product actions via authenticated RPC wrapper.
 * Idempotency hash is computed server-side inside the RPC (not from client).
 */
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
  if (!isOpaqueUuid(caseId)) {
    return denied(requestId, caseId, started);
  }

  let body: ManualActionBody;
  try {
    body = (await request.json()) as ManualActionBody;
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_action_invalid_body",
        requestId,
        message: "No fue posible interpretar la solicitud de acción manual.",
        retryable: false,
      }),
      422,
    );
  }

  const workItemId = (body.workItemId ?? "").trim();
  const action = (body.action ?? "").trim();
  const expectedStatus = (body.expectedStatus ?? "").trim();
  const expectedVersion = Number(body.expectedVersion);
  const idempotencyKey = (body.idempotencyKey ?? "").trim();

  if (action === "download_package") {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_download_requires_binary_endpoint",
        requestId,
        message:
          "La descarga del paquete debe realizarse por el endpoint de descarga binaria.",
        retryable: false,
      }),
      422,
    );
  }

  if (
    !isOpaqueUuid(workItemId) ||
    !PRODUCT_ACTIONS.has(action) ||
    !expectedStatus ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1 ||
    !idempotencyKey
  ) {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_action_invalid_payload",
        requestId,
        message: "Faltan datos necesarios para ejecutar la acción manual.",
        retryable: false,
      }),
      422,
    );
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
      return denied(requestId, caseId, started);
    }

    const assignment = await contextRepository.findAssignment(
      auth.consultantUserId,
      linkedCase.companyId,
    );
    if (!assignment) {
      return denied(requestId, caseId, started);
    }

    const grants = await manualWorkRepository.listEnabledCapabilityGrants({
      consultantUserId: auth.consultantUserId,
      companyId: linkedCase.companyId,
    });
    const grantSet = new Set(
      grants
        .filter((g) => g.status === "enabled")
        .map((g) => g.capability),
    );
    const capabilities = buildManualWorkCapabilityMatrix({
      manageManualWork: grantSet.has("manage_manual_work"),
      acceptManualOutput: grantSet.has("accept_manual_output"),
    });
    const requiredCapability =
      action === "accept_output"
        ? "accept_manual_output"
        : "manage_manual_work";
    if (!resolveCapabilityAllowed(capabilities, requiredCapability)) {
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "manual_action_post",
        result: "denied",
        caseId,
        errorCode: "manual_work_capability_denied",
        durationMs: Date.now() - started,
      });
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "manual_work_capability_denied",
          requestId,
          message:
            action === "accept_output"
              ? "No tiene autorización para aceptar esta salida."
              : "No tiene autorización para esta acción.",
          retryable: false,
        }),
        403,
      );
    }

    // Client hash is for logs only — never forwarded as RPC authority.
    const clientRequestHashForLogs = createHash("sha256")
      .update(
        JSON.stringify({
          caseId,
          workItemId,
          action,
          expectedStatus,
          expectedVersion,
          reason: body.reason ?? null,
          artifactVersionId: body.artifactVersionId ?? null,
        }),
      )
      .digest("hex");
    void clientRequestHashForLogs;

    let attachContent: Buffer | null = null;
    if (action === "attach_output") {
      if (!body.attachContentBase64) {
        return noStoreJson(
          buildSafeOfficialPanelErrorBody({
            code: "manual_work_attach_content_required",
            requestId,
            message: "Debe adjuntar una salida.",
            retryable: false,
          }),
          422,
        );
      }
      attachContent = Buffer.from(body.attachContentBase64, "base64");
      if (attachContent.length === 0) {
        return noStoreJson(
          buildSafeOfficialPanelErrorBody({
            code: "manual_work_attach_content_required",
            requestId,
            message: "Debe adjuntar una salida no vacía.",
            retryable: false,
          }),
          422,
        );
      }
      const computedSha = createHash("sha256")
        .update(attachContent)
        .digest("hex");
      const claimed = (body.attachSha256 ?? "").trim().toLowerCase();
      if (claimed && claimed !== computedSha) {
        return noStoreJson(
          buildSafeOfficialPanelErrorBody({
            code: "manual_work_attach_checksum_mismatch",
            requestId,
            message: "El checksum del adjunto no coincide con el contenido.",
            retryable: false,
          }),
          422,
        );
      }
    }

    const { data, error } = await auth.client.rpc(
      "eve_apply_manual_work_product_action_as_consultant",
      {
        p_case_id: caseId,
        p_work_item_id: workItemId,
        p_action: action,
        p_expected_status: expectedStatus,
        p_expected_version: expectedVersion,
        p_idempotency_key: idempotencyKey,
        p_reason: body.reason ?? null,
        p_artifact_version_id: body.artifactVersionId ?? null,
        p_request_id: requestId,
        p_attach_filename: body.attachFilename ?? null,
        p_attach_content_type: body.attachContentType ?? null,
        p_attach_content: attachContent
          ? `\\x${attachContent.toString("hex")}`
          : null,
      },
    );

    if (error) {
      const mapped = mapRpcError(error.message ?? "");
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "manual_action_post",
        result: "denied",
        caseId,
        errorCode: mapped.code,
        durationMs: Date.now() - started,
      });
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: mapped.code,
          requestId,
          message: mapped.message,
          retryable: false,
        }),
        mapped.status,
      );
    }

    const loaded = await loadManualWorkTrackingForCase({
      contextRepository,
      manualWorkRepository,
      consultantUserId: auth.consultantUserId,
      caseId,
      companyId: linkedCase.companyId,
      relationshipId: linkedCase.relationshipId,
    });

    logOfficialPanelEvent({
      level: "info",
      requestId,
      operation: "manual_action_post",
      result: "ok",
      caseId,
      durationMs: Date.now() - started,
    });

    return noStoreJson(
      {
        requestId,
        dataStatus: loaded.ok ? loaded.body.dataStatus : "available",
        actionResult: data,
        tracking: loaded.ok ? loaded.body : null,
        errors: [],
      },
      200,
    );
  } catch {
    logOfficialPanelEvent({
      level: "error",
      requestId,
      operation: "manual_action_post",
      result: "error",
      caseId,
      errorCode: "manual_action_unavailable",
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_action_unavailable",
        requestId,
        message: "No fue posible ejecutar la acción manual.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}

function mapRpcError(
  message: string,
): { status: number; code: string; message: string } {
  const raw = message.toLowerCase();
  if (raw.includes("stale_manual_work_item")) {
    return {
      status: 409,
      code: "STALE_MANUAL_WORK_ITEM",
      message: "La información cambió; actualice antes de continuar.",
    };
  }
  if (raw.includes("idempotency_conflict")) {
    return {
      status: 409,
      code: "IDEMPOTENCY_CONFLICT",
      message: "La solicitud entra en conflicto con una acción previa.",
    };
  }
  if (
    raw.includes("access_denied") ||
    raw.includes("capability_denied") ||
    raw.includes("auth_required")
  ) {
    return {
      status: 403,
      code: "manual_work_access_denied",
      message: "No tiene autorización para esta acción.",
    };
  }
  if (raw.includes("not_found")) {
    return {
      status: 404,
      code: "manual_work_not_found",
      message: "No se encontró el trabajo manual solicitado.",
    };
  }
  if (
    raw.includes("attach_content_type") ||
    raw.includes("attach_extension") ||
    raw.includes("attach_too_large") ||
    raw.includes("attach_content_required") ||
    raw.includes("attach_checksum") ||
    raw.includes("precondition") ||
    raw.includes("checksum") ||
    raw.includes("requires") ||
    raw.includes("mismatch") ||
    raw.includes("too_large") ||
    raw.includes("invalid") ||
    raw.includes("denied")
  ) {
    return {
      status: 422,
      code: "manual_action_precondition_failed",
      message: "No se cumplen las condiciones para esta acción.",
    };
  }
  return {
    status: 500,
    code: "manual_action_unavailable",
    message: "No fue posible ejecutar la acción manual.",
  };
}

function denied(requestId: string, caseId: string, started: number) {
  logOfficialPanelEvent({
    level: "warn",
    requestId,
    operation: "manual_action_post",
    result: "denied",
    caseId,
    errorCode: "manual_work_access_denied",
    durationMs: Date.now() - started,
  });
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "manual_work_access_denied",
      requestId,
      message: "No fue posible ejecutar la acción manual.",
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
