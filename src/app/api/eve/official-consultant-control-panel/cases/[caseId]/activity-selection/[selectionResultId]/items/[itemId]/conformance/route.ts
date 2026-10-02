import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { assertConsultantCaseParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-participants-service";
import {
  loadActivitySelectionConformance,
  loadActivitySelectionConformanceScope,
} from "@/services/eve/official-control-panel/official-control-panel-activity-selection-conformance-service";
import { createOfficialControlPanelServiceRoleClient } from "@/services/eve/official-control-panel/official-control-panel-service-role-client";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    caseId: string;
    selectionResultId: string;
    itemId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
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

  const { caseId, selectionResultId, itemId } = await params;
  if (
    !isOpaqueUuid(caseId) ||
    !isOpaqueUuid(selectionResultId) ||
    !isOpaqueUuid(itemId)
  ) {
    return accessDenied(requestId);
  }

  const contextRepository = createOfficialControlPanelContextRepository(
    auth.client,
  );
  const participantsRepository =
    createOfficialControlPanelParticipantsRepository(auth.client);

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return accessDenied(requestId);
    }

    const readClient = createOfficialControlPanelServiceRoleClient();
    const scope = await loadActivitySelectionConformanceScope({
      client: readClient,
      caseId,
      selectionResultId,
      itemId,
    });
    if (!scope || scope.caseId !== caseId) return accessDenied(requestId);

    const access = await assertConsultantCaseParticipantAccess(
      contextRepository,
      participantsRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
        participantId: scope.participantId,
        profileId: scope.profileId,
      },
    );
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

    const conformance = await loadActivitySelectionConformance({
      client: readClient,
      caseId,
      selectionResultId,
      itemId,
    });
    if (!conformance) return accessDenied(requestId);

    return noStoreJson({ requestId, conformance }, 200);
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "activity_selection_conformance_unavailable",
        requestId,
        message:
          "No fue posible cargar el detalle de conformidad de la selección.",
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
      code: "activity_selection_conformance_access_denied",
      requestId,
      message: "No fue posible abrir el detalle solicitado.",
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
