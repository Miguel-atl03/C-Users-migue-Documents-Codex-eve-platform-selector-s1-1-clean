import { NextResponse } from "next/server";



import { authenticateOfficialControlPanelConsultant } from "@/services/eve/official-control-panel/official-control-panel-context-auth";

import { createOfficialControlPanelContextRepository } from "@/services/eve/official-control-panel/official-control-panel-context-repository";

import { createOfficialControlPanelParticipantsRepository } from "@/services/eve/official-control-panel/official-control-panel-participants-repository";

import { createOfficialControlPanelMonitoringRuntimeRepository } from "@/services/eve/official-control-panel/official-control-panel-monitoring-runtime-repository";

import { createOfficialControlPanelActivitySelectionRepository } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-repository";

import { createOfficialControlPanelRuntimeMatrixRepository } from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix-repository";

import { buildActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection-service";

import { assertMonitoringParticipantAccess } from "@/services/eve/official-control-panel/official-control-panel-monitoring-service";

import { isOpaqueUuid } from "@/services/eve/official-control-panel/official-control-panel-context-validation";

import { buildSafeOfficialPanelErrorBody } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";



export function noStoreJson(body: unknown, status: number) {

  return NextResponse.json(body, {

    status,

    headers: { "Cache-Control": "private, no-store" },

  });

}



export function runtimeMatrixAccessDenied(requestId: string) {

  return noStoreJson(

    buildSafeOfficialPanelErrorBody({

      code: "runtime_matrix_access_denied",

      requestId,

      message: "No fue posible cargar la matriz Runtime.",

      retryable: false,

    }),

    403,

  );

}



export async function authorizeRuntimeMatrixScope(

  request: Request,

  params: {

    caseId: string;

    participantId: string;

    profileId: string;

    sessionId: string;

    activityId: string;

    runId: string;

  },

  requestId: string,

) {

  const auth = await authenticateOfficialControlPanelConsultant(request);

  if (!auth.ok) {

    return {

      ok: false as const,

      response: noStoreJson(

        buildSafeOfficialPanelErrorBody({

          code: auth.code,

          requestId,

          message: auth.message,

          retryable: false,

        }),

        auth.status,

      ),

    };

  }



  const { caseId, participantId, profileId, sessionId, activityId, runId } =

    params;

  if (

    !isOpaqueUuid(caseId) ||

    !isOpaqueUuid(participantId) ||

    !isOpaqueUuid(profileId) ||

    !isOpaqueUuid(sessionId) ||

    !isOpaqueUuid(activityId) ||

    !isOpaqueUuid(runId)

  ) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

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

  const matrixRepository = createOfficialControlPanelRuntimeMatrixRepository(

    auth.client,

  );



  const linkedCase = await contextRepository.findCase(caseId);

  if (!linkedCase?.companyId || !linkedCase.relationshipId) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

  }



  const participant =

    await participantsRepository.findParticipantById(participantId);

  if (!participant?.enabled || participant.caseId !== caseId) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

  }



  const profile = await participantsRepository.findProfileById(profileId);

  if (!profile?.enabled || profile.caseParticipantId !== participantId) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

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

      response: noStoreJson(

        buildSafeOfficialPanelErrorBody({

          code: access.code,

          requestId,

          message: access.message,

          retryable: false,

        }),

        access.status,

      ),

    };

  }



  const linked =

    await monitoringRuntime.findLinkedRoleSessionsByProfile(profileId);

  const match = linked.find(

    (item) =>

      item.roleRuntimeSessionId === sessionId &&

      item.linkStatus === "confirmed" &&

      item.caseId === caseId,

  );

  if (!match) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

  }



  const coverage = await buildActivitySelectionCoverageView(

    selectionRepository,

    {

      caseId,

      participantId,

      profileId,

      roleRuntimeSessionId: sessionId,

    },

  );

  const isPrimary = (coverage.primaryActivities ?? []).some(

    (item) => item.activityId === activityId,

  );

  if (!isPrimary) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

  }



  const run = await matrixRepository.findRunById(runId);

  if (

    !run ||

    run.caseId !== caseId ||

    run.roleRuntimeSessionId !== sessionId ||

    run.activityId !== activityId

  ) {

    return { ok: false as const, response: runtimeMatrixAccessDenied(requestId) };

  }



  return {

    ok: true as const,

    matrixRepository,

    participantLabel: participant.displayLabel ?? null,

    functionalProfileLabel: profile.displayLabel ?? null,

    activityLabel:

      (coverage.primaryActivities ?? []).find(

        (item) => item.activityId === activityId,

      )?.label ?? null,

  };

}


