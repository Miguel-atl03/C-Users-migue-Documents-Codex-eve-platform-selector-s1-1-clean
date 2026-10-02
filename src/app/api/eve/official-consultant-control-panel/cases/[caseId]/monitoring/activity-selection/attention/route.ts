import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { createOfficialControlPanelActivitySelectionRepository } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-repository";
import {
  buildActivitySelectionAttentionView,
  projectWorkmapCoverageGapAlertsFromAttention,
} from "@/services/eve/official-control-panel/official-control-panel-activity-selection-attention";
import { assertMonitoringParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-monitoring-service";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";

export const dynamic = "force-dynamic";

/**
 * GET .../cases/:caseId/monitoring/activity-selection/attention
 * FX-05 — factual workmapCoverageGap → Monitoring/Attention projection.
 */
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
  const participantsRepository =
    createOfficialControlPanelParticipantsRepository(auth.client);
  const selectionRepository =
    createOfficialControlPanelActivitySelectionRepository(auth.client);

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return accessDenied(requestId);
    }

    const access = await assertMonitoringParticipantAccess(
      contextRepository,
      participantsRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
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

    const attention = await buildActivitySelectionAttentionView(
      selectionRepository,
      { caseId },
    );
    const alerts = projectWorkmapCoverageGapAlertsFromAttention(attention);

    return noStoreJson(
      {
        ...attention,
        alerts,
      },
      200,
    );
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "activity_selection_attention_unavailable",
        requestId,
        message:
          "No fue posible cargar la atención de cobertura de actividades.",
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
      code: "activity_selection_attention_access_denied",
      requestId,
      message: "No fue posible abrir la atención de cobertura de actividades.",
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
