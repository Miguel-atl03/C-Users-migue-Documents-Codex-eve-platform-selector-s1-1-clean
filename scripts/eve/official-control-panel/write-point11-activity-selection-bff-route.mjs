import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const destDir = path.join(
  root,
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection",
);

const route = `import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { createOfficialControlPanelMonitoringRuntimeRepository } from "@/services/eve/official-control-panel/official-control-panel-monitoring-runtime-repository";
import { createOfficialControlPanelActivitySelectionRepository } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-repository";
import { buildActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-service";
import { assertMonitoringParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-monitoring-service";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

export const dynamic = "force-dynamic";

/**
 * GET .../participants/:participantId/profiles/:profileId/sessions/:sessionId/activity-selection
 * §11 — lectura factual del resultado effective; no recalcula.
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
    }>;
  },
) {
  const auth = await authenticateOfficialControlPanelConsultant(request);
  if (!auth.ok) {
    return noStoreJson(
      { error: auth.code, message: auth.message },
      auth.status,
    );
  }

  const { caseId, participantId, profileId, sessionId } = await params;
  if (
    !isOpaqueUuid(caseId) ||
    !isOpaqueUuid(participantId) ||
    !isOpaqueUuid(profileId) ||
    !isOpaqueUuid(sessionId)
  ) {
    return accessDenied();
  }

  const contextRepository = createOfficialControlPanelContextRepository(
    auth.client,
  );
  const participantsRepository =
    createOfficialControlPanelParticipantsRepository(auth.client);
  const monitoringRuntime =
    createOfficialControlPanelMonitoringRuntimeRepository(auth.client);
  const selectionRepository =
    createOfficialControlPanelActivitySelectionRepository(auth.client);

  try {
    const linkedCase = await contextRepository.findCase(caseId);
    if (!linkedCase?.companyId || !linkedCase.relationshipId) {
      return accessDenied();
    }

    const participant = await participantsRepository.findParticipantById(
      participantId,
    );
    if (!participant?.enabled || participant.caseId !== caseId) {
      return accessDenied();
    }

    const profile = await participantsRepository.findProfileById(profileId);
    if (
      !profile?.enabled ||
      profile.caseParticipantId !== participantId
    ) {
      return accessDenied();
    }

    const access = await assertMonitoringParticipantAccess(
      contextRepository,
      participantsRepository,
      {
        consultantUserId: auth.consultantUserId,
        companyId: linkedCase.companyId,
        relationshipId: linkedCase.relationshipId,
        caseId,
        participantId,
        profileId,
      },
    );
    if (!access.ok) {
      return noStoreJson(
        { error: access.code, message: access.message },
        access.status,
      );
    }

    const linked =
      await monitoringRuntime.findLinkedRoleSessionsByProfile(profileId);
    const match = linked.find(
      (item) =>
        item.roleRuntimeSessionId === sessionId &&
        item.linkStatus === "confirmed" &&
        item.caseId === caseId,
    );
    if (!match) return accessDenied();

    const body = await buildActivitySelectionCoverageView(selectionRepository, {
      caseId,
      participantId,
      profileId,
      roleRuntimeSessionId: sessionId,
    });
    return noStoreJson(body, 200);
  } catch {
    return noStoreJson(
      {
        error: "activity_selection_unavailable",
        message: "No fue posible cargar la cobertura de actividades.",
      },
      500,
    );
  }
}

function accessDenied() {
  return noStoreJson(
    {
      error: "activity_selection_access_denied",
      message: "No fue posible cargar la cobertura de actividades.",
    },
    403,
  );
}

function noStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
`;

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(path.join(destDir, "route.ts"), route, "utf8");
console.log("wrote", path.join(destDir, "route.ts"));
