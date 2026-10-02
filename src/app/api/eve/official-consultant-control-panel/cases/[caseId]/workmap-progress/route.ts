import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { assertConsultantCaseParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-participants-service";
import { createOfficialControlPanelServiceRoleClient } from "@/services/eve/official-control-panel/official-control-panel-service-role-client";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { createOfficialPanelRequestId } from "@/services/eve/official-control-panel/official-control-panel-observability";
import { buildWorkMapProgressView } from "@/services/eve/official-control-panel/official-control-panel-workmap-progress-service";

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
  const url = new URL(request.url);
  const participantId = url.searchParams.get("participant_id");
  const userId = url.searchParams.get("user_id");
  const profileId = url.searchParams.get("profile_id");
  const activityPage = parsePositiveInt(url.searchParams.get("page"), 1);
  const activityPageSize = parsePositiveInt(
    url.searchParams.get("page_size"),
    20,
  );
  const activitySearch = url.searchParams.get("search");
  const activityStatus = url.searchParams.get("status");
  const activitySelectionStatus = url.searchParams.get("selection_status");
  if (
    (participantId && !isOpaqueUuid(participantId)) ||
    (userId && !isOpaqueUuid(userId)) ||
    (profileId && !isOpaqueUuid(profileId)) ||
    (profileId && !participantId)
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
    if (!linkedCase || !linkedCase.companyId || !linkedCase.relationshipId) {
      return accessDenied(requestId);
    }

    const access = await assertConsultantCaseParticipantAccess(
      contextRepository,
      participantsRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
        participantId: participantId ?? undefined,
        profileId: profileId ?? undefined,
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

    let readClient: SupabaseClient;
    try {
      readClient = createOfficialControlPanelServiceRoleClient();
    } catch {
      return noStoreJson(
        buildSafeOfficialPanelErrorBody({
          code: "workmap_progress_server_read_required",
          requestId,
          message:
            "El avance WorkMap requiere una credencial de lectura server-only configurada en el BFF.",
          retryable: true,
          dataStatus: "error",
        }),
        503,
      );
    }

    const progress = await buildWorkMapProgressView({
      client: readClient,
      caseId,
      participantId,
      userId,
      profileId,
      activityPage,
      activityPageSize,
      activitySearch,
      activityStatus,
      activitySelectionStatus,
    });

    return noStoreJson({ requestId, progress }, 200);
  } catch {
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "workmap_progress_unavailable",
        requestId,
        message: "No fue posible cargar el avance WorkMap del caso.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function accessDenied(requestId: string) {
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "workmap_progress_access_denied",
      requestId,
      message: "No fue posible abrir el avance WorkMap solicitado.",
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
