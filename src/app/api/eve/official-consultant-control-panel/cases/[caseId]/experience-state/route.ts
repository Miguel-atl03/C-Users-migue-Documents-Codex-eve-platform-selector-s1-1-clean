import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";
import { aggregateCompanyState, deriveExperienceHasValidNextEvent } from "@/services/eve/official-control-panel/official-control-panel-company-state-aggregation";
import { createOfficialControlPanelExperienceRepository } from "@/services/eve/official-control-panel/official-control-panel-experience-repository";
import { loadExperienceStateForCase } from "@/services/eve/official-control-panel/official-control-panel-experience-service";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { createOfficialControlPanelActivitySelectionRepository } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-repository";
import {
  buildActivitySelectionAttentionView,
  projectWorkmapCoverageGapAlertsFromAttention,
} from "@/services/eve/official-control-panel/official-control-panel-activity-selection-attention";
import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  createOfficialPanelRequestId,
  logOfficialPanelEvent,
} from "@/services/eve/official-control-panel/official-control-panel-observability";
import { assertConsultantCaseSupportProcessAccess } from "@/services/eve/official-control-panel/official-control-panel-support-process-service";
import { buildExperienceCapabilityMatrix } from "@/services/eve/official-control-panel/official-control-panel-experience-capabilities";

export const dynamic = "force-dynamic";

/**
 * GET /api/eve/official-consultant-control-panel/cases/:caseId/experience-state
 * §15 read-only experience governance view model.
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
      operation: "experience_state_get",
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
    return accessDenied(requestId, started, caseId);
  }

  const url = new URL(request.url);
  const userId =
    url.searchParams.get("user") ?? url.searchParams.get("userId");
  const role =
    url.searchParams.get("role") ??
    url.searchParams.get("roleRuntimeSessionId");
  const activity =
    url.searchParams.get("activity") ?? url.searchParams.get("activityId");
  const screen =
    url.searchParams.get("screen") ?? url.searchParams.get("screenKey");

  const contextRepository = createOfficialControlPanelContextRepository(
    auth.client,
  );
  const experienceRepository = createOfficialControlPanelExperienceRepository(
    auth.client,
  );

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return accessDenied(requestId, started, caseId);
    }

    const access = await assertConsultantCaseSupportProcessAccess(
      contextRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
      },
    );
    if (!access.ok) {
      return accessDenied(requestId, started, caseId);
    }

    // Child resource absence is evaluated only after case authorization.
    if (userId) {
      if (!isOpaqueUuid(userId)) {
        return accessDenied(requestId, started, caseId);
      }
      const participantsRepository =
        createOfficialControlPanelParticipantsRepository(auth.client);
      const participants =
        await participantsRepository.listEnabledParticipantsByCase(caseId);
      const childKnown = participants.some(
        (participant) =>
          participant.id === userId || participant.userId === userId,
      );
      if (!childKnown) {
        return resourceNotFound(requestId, started, caseId);
      }
    }

    if (activity) {
      if (!isOpaqueUuid(activity)) {
        return accessDenied(requestId, started, caseId);
      }
      const events = await experienceRepository.listEventsForCase(caseId);
      const actions =
        await experienceRepository.listSupportActionsForCase(caseId);
      const activityKnown =
        events.some((event) => event.activity_id === activity) ||
        actions.some((action) => action.activity_id === activity);
      if (!activityKnown) {
        return resourceNotFound(requestId, started, caseId);
      }
    }

    const experience = await loadExperienceStateForCase({
      experienceRepository,
      caseId,
      companyId: linkedCase.companyId,
      filters: {
        userId,
        roleRuntimeSessionId: role,
        activityId: activity,
        screenKey: screen,
      },
    });

    const mutationKeys = [
      "send_support_message",
      "request_reentry",
      "mark_manual_review",
      "view_experience_state",
    ] as const;
    const granted = new Set<string>();
    for (const capability of mutationKeys) {
      const { data: allowed } = await auth.client.rpc(
        "eve_consultant_has_panel_capability",
        {
          p_company_id: linkedCase.companyId,
          p_capability: capability,
        },
      );
      if (allowed === true) granted.add(capability);
    }
    experience.capabilities = buildExperienceCapabilityMatrix({
      caseAccessAllowed: true,
      deniedKeys: mutationKeys.filter((k) => !granted.has(k)),
    });

    const hasCriticalMilestoneBlocker = experience.users.some(
      (journey) => journey.currentStatus === "blocked",
    );
    const hasSupportRequested =
      experience.supportQueue.length > 0 ||
      experience.users.some(
        (journey) =>
          journey.currentStatus === "support_requested" ||
          journey.cells.some((cell) => cell.status === "support_requested"),
      );

    const hasValidNextEvent = deriveExperienceHasValidNextEvent(experience);

    const selectionRepository =
      createOfficialControlPanelActivitySelectionRepository(auth.client);
    const selectionAttention = await buildActivitySelectionAttentionView(
      selectionRepository,
      { caseId },
    );
    const workmapCoverageAlerts =
      projectWorkmapCoverageGapAlertsFromAttention(selectionAttention);

    const companyState = aggregateCompanyState({
      caseNotStarted: false,
      caseIsClosed: false,
      // Factual: pantallas con status vigente blocked = blocker de hito actual.
      hasCriticalMilestoneBlocker,
      hasSupportRequested,
      hasFlags: workmapCoverageAlerts.length > 0,
      hasValidNextEvent,
      experienceAlertsComplete:
        experience.dataStatus === "available" ||
        experience.dataStatus === "empty",
      experienceState: experience,
      upstreamAlerts: workmapCoverageAlerts,
    });

    logOfficialPanelEvent({
      level: "info",
      requestId,
      operation: "experience_state_get",
      result: "ok",
      caseId,
      durationMs: Date.now() - started,
      errorCode:
        experience.dataStatus === "empty" ? "experience_empty" : null,
    });

    return noStoreJson(
      {
        ...experience,
        companyState,
      },
      200,
    );
  } catch {
    logOfficialPanelEvent({
      level: "error",
      requestId,
      operation: "experience_state_get",
      result: "error",
      caseId,
      errorCode: "experience_data_unavailable",
      durationMs: Date.now() - started,
    });
    return noStoreJson(
      buildSafeOfficialPanelErrorBody({
        code: "experience_data_unavailable",
        requestId,
        message: "No fue posible cargar la experiencia de uso.",
        retryable: true,
        dataStatus: "error",
      }),
      500,
    );
  }
}

function accessDenied(requestId: string, started: number, caseId: string) {
  logOfficialPanelEvent({
    level: "warn",
    requestId,
    operation: "experience_state_get",
    result: "denied",
    caseId,
    errorCode: "experience_access_denied",
    durationMs: Date.now() - started,
  });
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "experience_access_denied",
      requestId,
      message: "No fue posible abrir la experiencia de uso.",
      retryable: false,
    }),
    403,
  );
}

function resourceNotFound(requestId: string, started: number, caseId: string) {
  logOfficialPanelEvent({
    level: "warn",
    requestId,
    operation: "experience_state_get",
    result: "denied",
    caseId,
    errorCode: "experience_not_found",
    durationMs: Date.now() - started,
  });
  return noStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: "experience_not_found",
      requestId,
      message: "No se encontró información para la selección actual.",
      retryable: false,
    }),
    404,
  );
}

function noStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
