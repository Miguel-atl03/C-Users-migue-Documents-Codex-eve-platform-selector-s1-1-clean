import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import {
  buildManualWorkCapabilityMatrix,
  resolveCapabilityAllowed,
} from "@/services/eve/official-control-panel/official-control-panel-capability-catalog";
import { createOfficialControlPanelManualWorkRepository } from "@/services/eve/official-control-panel/official-control-panel-manual-work-repository";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  createOfficialPanelRequestId,
  logOfficialPanelEvent,
} from "@/services/eve/official-control-panel/official-control-panel-observability";

export const dynamic = "force-dynamic";

type DownloadBody = {
  workItemId?: string;
  expectedStatus?: string;
  expectedVersion?: number;
  idempotencyKey?: string;
  reason?: string;
};

/**
 * POST .../cases/:caseId/manual-artifacts/:artifactVersionId/download
 * Atomic: deliver factual input blob + ready_to_start → downloaded.
 * Idempotency hash is computed server-side inside the RPC (not from client).
 */
export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ caseId: string; artifactVersionId: string }>;
  },
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

  const { caseId, artifactVersionId } = await params;
  if (!isOpaqueUuid(caseId) || !isOpaqueUuid(artifactVersionId)) {
    return denied(requestId, caseId, started);
  }

  let body: DownloadBody;
  try {
    body = (await request.json()) as DownloadBody;
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_download_invalid_body",
        requestId,
        message: "No fue posible interpretar la solicitud de descarga.",
        retryable: false,
      }),
      422,
    );
  }

  const workItemId = (body.workItemId ?? "").trim();
  const expectedStatus = (body.expectedStatus ?? "").trim();
  const expectedVersion = Number(body.expectedVersion);
  const idempotencyKey = (body.idempotencyKey ?? "").trim();

  if (
    !isOpaqueUuid(workItemId) ||
    expectedStatus !== "ready_to_start" ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1 ||
    !idempotencyKey
  ) {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_download_invalid_payload",
        requestId,
        message: "Faltan datos necesarios para descargar el paquete.",
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
      grants.filter((g) => g.status === "enabled").map((g) => g.capability),
    );
    const capabilities = buildManualWorkCapabilityMatrix({
      manageManualWork: grantSet.has("manage_manual_work"),
      acceptManualOutput: grantSet.has("accept_manual_output"),
    });
    if (!resolveCapabilityAllowed(capabilities, "manage_manual_work")) {
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "manual_work_capability_denied",
          requestId,
          message: "No tiene autorización para esta acción.",
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
          artifactVersionId,
          action: "download_package",
          expectedStatus,
          expectedVersion,
          reason: body.reason ?? null,
        }),
      )
      .digest("hex");
    void clientRequestHashForLogs;

    const { data, error } = await auth.client.rpc(
      "eve_download_manual_work_input_package_as_consultant",
      {
        p_case_id: caseId,
        p_work_item_id: workItemId,
        p_artifact_version_id: artifactVersionId,
        p_expected_status: expectedStatus,
        p_expected_version: expectedVersion,
        p_idempotency_key: idempotencyKey,
        p_request_id: requestId,
        p_reason: body.reason ?? null,
      },
    );

    if (error) {
      const mapped = mapRpcError(error.message ?? "");
      logOfficialPanelEvent({
        level: "warn",
        requestId,
        operation: "manual_artifact_download",
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

    const payload = (data ?? {}) as {
      contentBase64?: string;
      sanitizedFilename?: string;
      contentType?: string;
      sha256?: string;
      version?: number;
      status?: string;
      artifactVersionId?: string;
    };

    if (!payload.contentBase64) {
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "manual_download_blob_missing",
          requestId,
          message: "No fue posible entregar el paquete fuente.",
          retryable: true,
        }),
        500,
      );
    }

    const bytes = Buffer.from(payload.contentBase64, "base64");
    const filename = sanitizeFilename(
      payload.sanitizedFilename ?? "paquete-fuente.bin",
    );
    const contentType =
      payload.contentType && payload.contentType.trim()
        ? payload.contentType
        : "application/octet-stream";

    logOfficialPanelEvent({
      level: "info",
      requestId,
      operation: "manual_artifact_download",
      result: "ok",
      caseId,
      durationMs: Date.now() - started,
    });

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Request-Id": requestId,
        "X-Manual-Work-Status": String(payload.status ?? "downloaded"),
        "X-Manual-Work-Version": String(payload.version ?? ""),
        "X-Artifact-Version-Id": String(payload.artifactVersionId ?? ""),
        "X-Artifact-Sha256": String(payload.sha256 ?? ""),
      },
    });
  } catch {
    logOfficialPanelEvent({
      level: "error",
      requestId,
      operation: "manual_artifact_download",
      result: "error",
      caseId,
      errorCode: "manual_download_unavailable",
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "manual_download_unavailable",
        requestId,
        message: "No fue posible descargar el paquete.",
        retryable: true,
      }),
      500,
    );
  }
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]/g, "_").trim();
  return cleaned || "paquete-fuente.bin";
}

function mapRpcError(message: string): {
  status: number;
  code: string;
  message: string;
} {
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
    raw.includes("input_package") ||
    raw.includes("input_blob") ||
    raw.includes("checksum") ||
    raw.includes("precondition") ||
    raw.includes("mismatch") ||
    raw.includes("missing")
  ) {
    return {
      status: 422,
      code: "manual_download_precondition_failed",
      message: "No hay un paquete fuente válido para descargar.",
    };
  }
  return {
    status: 500,
    code: "manual_download_unavailable",
    message: "No fue posible descargar el paquete.",
  };
}

function denied(requestId: string, caseId: string, started: number) {
  logOfficialPanelEvent({
    level: "warn",
    requestId,
    operation: "manual_artifact_download",
    result: "denied",
    caseId,
    errorCode: "manual_work_access_denied",
    durationMs: Date.now() - started,
  });
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "manual_work_access_denied",
      requestId,
      message: "No fue posible descargar el paquete.",
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
