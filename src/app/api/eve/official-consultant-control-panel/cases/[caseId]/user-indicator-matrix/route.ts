import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { assertConsultantClientContextAccess } from "@/services/eve/official-control-panel/official-control-panel-context-service";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";
import { createOfficialControlPanelServiceRoleClient } from "@/services/eve/official-control-panel/official-control-panel-service-role-client";
import { buildCaseUserIndicatorMatrix } from "@/services/eve/official-control-panel/official-control-panel-user-indicator-matrix-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
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

  const { caseId } = await params;
  if (!isOpaqueUuid(caseId)) return accessDenied(requestId);

  const contextRepository = createOfficialControlPanelContextRepository(
    auth.client,
  );

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return accessDenied(requestId);
    }

    const access = await assertConsultantClientContextAccess(
      contextRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
      },
    );
    if (!access.ok) return accessDenied(requestId);

    let readClient: SupabaseClient;
    try {
      readClient = createOfficialControlPanelServiceRoleClient();
    } catch {
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "user_indicator_matrix_server_read_required",
          requestId,
          message:
            "La matriz de usuarios requiere lectura server-only configurada en el BFF.",
          retryable: true,
          dataStatus: "error",
        }),
        503,
      );
    }

    const matrix = await buildCaseUserIndicatorMatrix({
      client: readClient,
      caseId,
    });
    return noStoreJson({ requestId, matrix }, 200);
  } catch (error) {
    console.error("official_panel_user_indicator_matrix_failed", {
      requestId,
      code:
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown",
      message:
        error instanceof Error
          ? error.message
          : "user_indicator_matrix_unknown_error",
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "user_indicator_matrix_unavailable",
        requestId,
        message: "No fue posible cargar la matriz horizontal de usuarios.",
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
      code: "user_indicator_matrix_access_denied",
      requestId,
      message: "No fue posible abrir la matriz solicitada.",
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
