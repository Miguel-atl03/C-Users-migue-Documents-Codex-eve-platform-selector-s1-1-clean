import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const baseDir =
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activities/[activityId]/runs/[runId]/runtime";

const sharedHelpers = `
function accessDenied() {
  return noStoreJson(
    {
      error: "runtime_matrix_access_denied",
      message: "No fue posible cargar la matriz Runtime.",
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

async function authorizeRuntimeMatrixScope(
  request: Request,
  params: {
    caseId: string;
    participantId: string;
    profileId: string;
    sessionId: string;
    activityId: string;
    runId: string;
  },
) {
  const auth = await authenticateOfficialControlPanelConsultant(request);
  if (!auth.ok) {
    return { ok: false as const, response: noStoreJson({ error: auth.code, message: auth.message }, auth.status) };
  }

  const { caseId, participantId, profileId, sessionId, activityId, runId } = params;
  if (
    !isOpaqueUuid(caseId) ||
    !isOpaqueUuid(participantId) ||
    !isOpaqueUuid(profileId) ||
    !isOpaqueUuid(sessionId) ||
    !isOpaqueUuid(activityId) ||
    !isOpaqueUuid(runId)
  ) {
    return { ok: false as const, response: accessDenied() };
  }

  const contextRepository = createOfficialControlPanelContextRepository(auth.client);
  const participantsRepository = createOfficialControlPanelParticipantsRepository(auth.client);
  const monitoringRuntime = createOfficialControlPanelMonitoringRuntimeRepository(auth.client);
  const selectionRepository = createOfficialControlPanelActivitySelectionRepository(auth.client);
  const matrixRepository = createOfficialControlPanelRuntimeMatrixRepository(auth.client);

  const linkedCase = await contextRepository.findCase(caseId);
  if (!linkedCase?.companyId || !linkedCase.relationshipId) {
    return { ok: false as const, response: accessDenied() };
  }

  const participant = await participantsRepository.findParticipantById(participantId);
  if (!participant?.enabled || participant.caseId !== caseId) {
    return { ok: false as const, response: accessDenied() };
  }

  const profile = await participantsRepository.findProfileById(profileId);
  if (!profile?.enabled || profile.caseParticipantId !== participantId) {
    return { ok: false as const, response: accessDenied() };
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
    return {
      ok: false as const,
      response: noStoreJson({ error: access.code, message: access.message }, access.status),
    };
  }

  const linked = await monitoringRuntime.findLinkedRoleSessionsByProfile(profileId);
  const match = linked.find(
    (item) =>
      item.roleRuntimeSessionId === sessionId &&
      item.linkStatus === "confirmed" &&
      item.caseId === caseId,
  );
  if (!match) return { ok: false as const, response: accessDenied() };

  const coverage = await buildActivitySelectionCoverageView(selectionRepository, {
    caseId,
    participantId,
    profileId,
    roleRuntimeSessionId: sessionId,
  });
  const isPrimary = (coverage.primaryActivities ?? []).some(
    (item) => item.activityId === activityId,
  );
  if (!isPrimary) return { ok: false as const, response: accessDenied() };

  const run = await matrixRepository.findRunById(runId);
  if (
    !run ||
    run.caseId !== caseId ||
    run.roleRuntimeSessionId !== sessionId ||
    run.activityId !== activityId
  ) {
    return { ok: false as const, response: accessDenied() };
  }

  return {
    ok: true as const,
    matrixRepository,
    participantLabel: participant.displayLabel ?? null,
    functionalProfileLabel: profile.displayLabel ?? null,
    activityLabel:
      (coverage.primaryActivities ?? []).find((item) => item.activityId === activityId)
        ?.label ?? null,
  };
}
`;

const imports = `import { NextResponse } from "next/server";

import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";
import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";
import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";
import { createOfficialControlPanelMonitoringRuntimeRepository } from "@/services/eve/official-control-panel/official-control-panel-monitoring-runtime-repository";
import { createOfficialControlPanelActivitySelectionRepository } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-repository";
import { createOfficialControlPanelRuntimeMatrixRepository } from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix-repository";
import { buildActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-service";
import {
  buildRuntimeBaseMatrixView,
  buildRuntimeCausalMatrixView,
  getBaseMatrixRowDetail,
  getCausalMatrixRowDetail,
} from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix-service";
import { assertMonitoringParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-monitoring-service";
import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

export const dynamic = "force-dynamic";
`;

function writeRoute(relDir, body) {
  const destDir = path.join(root, relDir);
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, "route.ts"), body, "utf8");
  console.log("wrote", path.join(destDir, "route.ts"));
}

const paramsType = `params: Promise<{
      caseId: string;
      participantId: string;
      profileId: string;
      sessionId: string;
      activityId: string;
      runId: string;
    }>`;

writeRoute(
  `${baseDir}/base-matrix`,
  `${imports}
/**
 * GET .../runs/:runId/runtime/base-matrix
 * §12-B Matriz Base 40 — catálogo + overlay factual.
 */
export async function GET(request: Request, { params }: { ${paramsType} }) {
  try {
    const resolved = await params;
    const scope = await authorizeRuntimeMatrixScope(request, resolved);
    if (!scope.ok) return scope.response;

    const body = await buildRuntimeBaseMatrixView(scope.matrixRepository, {
      caseId: resolved.caseId,
      runId: resolved.runId,
      activityId: resolved.activityId,
      participantLabel: scope.participantLabel,
      functionalProfileLabel: scope.functionalProfileLabel,
      activityLabel: scope.activityLabel,
    });
    return noStoreJson(body, 200);
  } catch {
    return noStoreJson(
      { error: "runtime_matrix_unavailable", message: "No fue posible cargar la matriz Runtime." },
      500,
    );
  }
}
${sharedHelpers}
`,
);

writeRoute(
  `${baseDir}/causal-matrix`,
  `${imports}
/**
 * GET .../runs/:runId/runtime/causal-matrix
 * §12-B Matriz Causal 20 — catálogo + overlay factual.
 */
export async function GET(request: Request, { params }: { ${paramsType} }) {
  try {
    const resolved = await params;
    const scope = await authorizeRuntimeMatrixScope(request, resolved);
    if (!scope.ok) return scope.response;

    const body = await buildRuntimeCausalMatrixView(scope.matrixRepository, {
      caseId: resolved.caseId,
      runId: resolved.runId,
      activityId: resolved.activityId,
      participantLabel: scope.participantLabel,
      functionalProfileLabel: scope.functionalProfileLabel,
      activityLabel: scope.activityLabel,
    });
    return noStoreJson(body, 200);
  } catch {
    return noStoreJson(
      { error: "runtime_matrix_unavailable", message: "No fue posible cargar la matriz Runtime." },
      500,
    );
  }
}
${sharedHelpers}
`,
);

writeRoute(
  `${baseDir}/base/[baseId]`,
  `${imports}
/**
 * GET .../runs/:runId/runtime/base/:baseId
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
      baseId: string;
    }>;
  },
) {
  try {
    const resolved = await params;
    const scope = await authorizeRuntimeMatrixScope(request, resolved);
    if (!scope.ok) return scope.response;

    const view = await buildRuntimeBaseMatrixView(scope.matrixRepository, {
      caseId: resolved.caseId,
      runId: resolved.runId,
      activityId: resolved.activityId,
      participantLabel: scope.participantLabel,
      functionalProfileLabel: scope.functionalProfileLabel,
      activityLabel: scope.activityLabel,
    });
    const row = getBaseMatrixRowDetail(view, resolved.baseId);
    if (!row) return accessDenied();
    return noStoreJson({ context: view.context, row }, 200);
  } catch {
    return noStoreJson(
      { error: "runtime_matrix_unavailable", message: "No fue posible cargar la matriz Runtime." },
      500,
    );
  }
}
${sharedHelpers}
`,
);

writeRoute(
  `${baseDir}/causal/[causalId]`,
  `${imports}
/**
 * GET .../runs/:runId/runtime/causal/:causalId
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
      causalId: string;
    }>;
  },
) {
  try {
    const resolved = await params;
    const scope = await authorizeRuntimeMatrixScope(request, resolved);
    if (!scope.ok) return scope.response;

    const view = await buildRuntimeCausalMatrixView(scope.matrixRepository, {
      caseId: resolved.caseId,
      runId: resolved.runId,
      activityId: resolved.activityId,
      participantLabel: scope.participantLabel,
      functionalProfileLabel: scope.functionalProfileLabel,
      activityLabel: scope.activityLabel,
    });
    const row = getCausalMatrixRowDetail(view, resolved.causalId);
    if (!row) return accessDenied();
    return noStoreJson({ context: view.context, row }, 200);
  } catch {
    return noStoreJson(
      { error: "runtime_matrix_unavailable", message: "No fue posible cargar la matriz Runtime." },
      500,
    );
  }
}
${sharedHelpers}
`,
);
