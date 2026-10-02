import { assertConsultantClientContextAccess } from "./official-control-panel-context-service";
import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";
import {
  toCoreMilestoneProgressResponse,
  unavailableCoreMilestoneProgress,
} from "./official-control-panel-core-milestones";
import type {
  CaseMainProcessRecord,
  CaseMilestoneRecord,
  CaseProcessStatus,
  CaseProcessStructureResponse,
  OfficialControlPanelProcessStructureAccessInput,
  OfficialControlPanelProcessStructureAccessResult,
  OfficialControlPanelProcessStructureRepository,
} from "./official-control-panel-process-structure.types";

const ACCESS_DENIED_MESSAGE = "No fue posible abrir la estructura del caso.";
const DATA_UNAVAILABLE_MESSAGE = "No fue posible abrir la estructura del caso.";

const STATUS_LABELS: Record<CaseProcessStatus, string> = {
  not_started: "No iniciado",
  available: "Disponible",
  current: "Actual",
  waiting: "En espera",
  completed: "Completado",
  blocked: "Bloqueado",
  unknown: "No disponible",
};

/**
 * Cumulative access gate:
 * consultant → company → relationship → case → optional process → optional milestone.
 * Failures never reveal out-of-scope existence.
 */
export async function assertConsultantCaseProcessAccess(
  contextRepository: OfficialControlPanelContextRepository,
  processRepository: OfficialControlPanelProcessStructureRepository,
  input: OfficialControlPanelProcessStructureAccessInput,
): Promise<OfficialControlPanelProcessStructureAccessResult> {
  try {
    const contextAccess = await assertConsultantClientContextAccess(
      contextRepository,
      {
        consultantUserId: input.consultantUserId,
        companyId: input.companyId,
        relationshipId: input.relationshipId,
        caseId: input.caseId,
        at: input.at,
      },
    );

    if (!contextAccess.ok) {
      return accessDenied();
    }

    if (input.mainProcessId) {
      const process = await processRepository.findMainProcessById(
        input.mainProcessId,
      );
      if (
        !process ||
        !process.enabled ||
        process.caseId !== input.caseId
      ) {
        return accessDenied();
      }

      if (input.milestoneId) {
        const milestone = await processRepository.findMilestoneById(
          input.milestoneId,
        );
        if (
          !milestone ||
          !milestone.enabled ||
          milestone.mainProcessId !== process.id
        ) {
          return accessDenied();
        }
      }
    } else if (input.milestoneId) {
      return accessDenied();
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      code: "process_structure_data_unavailable",
      status: 500,
      message: DATA_UNAVAILABLE_MESSAGE,
    };
  }
}

/**
 * Structure (mainProcess + milestones) is mandatory.
 * Core milestone KPI is a degradable extension: RPC failure must not
 * collapse Unit 3B empty/partial/active structure states.
 */
export async function buildCaseProcessStructureResponse(
  processRepository: OfficialControlPanelProcessStructureRepository,
  caseId: string,
): Promise<CaseProcessStructureResponse> {
  const mainProcess =
    await processRepository.findEnabledMainProcessByCase(caseId);

  const structure = !mainProcess
    ? { mainProcess: null as CaseProcessStructureResponse["mainProcess"], milestones: [] as CaseProcessStructureResponse["milestones"] }
    : await loadPresentedStructure(processRepository, mainProcess);

  const coreMilestoneProgress = await resolveCoreMilestoneProgress(
    processRepository,
    caseId,
  );

  return {
    mainProcess: structure.mainProcess,
    milestones: structure.milestones,
    coreMilestoneProgress,
  };
}

async function loadPresentedStructure(
  processRepository: OfficialControlPanelProcessStructureRepository,
  mainProcess: CaseMainProcessRecord,
): Promise<Pick<CaseProcessStructureResponse, "mainProcess" | "milestones">> {
  const milestones = await processRepository.listEnabledMilestonesByProcess(
    mainProcess.id,
  );
  const current = mainProcess.currentMilestoneId
    ? milestones.find((item) => item.id === mainProcess.currentMilestoneId) ??
      null
    : null;

  return {
    mainProcess: {
      id: mainProcess.id,
      label: mainProcess.label,
      status: mainProcess.status,
      statusLabel: presentProcessStatus(mainProcess.status),
      currentMilestoneId: mainProcess.currentMilestoneId,
      nextEventLabel: current?.expectedEventLabel ?? null,
      timerLabel: presentTimerLabel(current?.timerDueAt ?? null),
    },
    milestones: milestones.map((item) => presentMilestone(item)),
  };
}

async function resolveCoreMilestoneProgress(
  processRepository: OfficialControlPanelProcessStructureRepository,
  caseId: string,
): Promise<CaseProcessStructureResponse["coreMilestoneProgress"]> {
  let coreMilestoneProgress = toCoreMilestoneProgressResponse(
    unavailableCoreMilestoneProgress(),
  );

  try {
    coreMilestoneProgress =
      await processRepository.calculateCoreMilestoneProgress(caseId);
  } catch (error) {
    logSanitizedCoreProgressFailure({
      caseId,
      operation: "eve_calculate_core_milestone_progress",
      error,
    });
  }

  return coreMilestoneProgress;
}

/** Sanitized log only: no SQL text, evidence, or secrets. */
export function logSanitizedCoreProgressFailure(input: {
  caseId: string;
  operation: string;
  error: unknown;
}): void {
  console.error(
    JSON.stringify({
      scope: "official_control_panel",
      operation: input.operation,
      caseId: input.caseId,
      code: sanitizeCoreProgressErrorCode(input.error),
    }),
  );
}

export function sanitizeCoreProgressErrorCode(error: unknown): string {
  if (!(error instanceof Error) || !error.message) {
    return "core_milestone_progress_unavailable";
  }
  const message = error.message;
  if (message === "official_control_panel_process_structure_data_source_error") {
    return message;
  }
  if (/^[a-z0-9_]{3,80}$/i.test(message)) {
    return message.toLowerCase();
  }
  return "core_milestone_progress_unavailable";
}

export function presentProcessStatus(
  status: CaseProcessStatus | string | null,
): string | null {
  if (!status) return null;
  return STATUS_LABELS[status as CaseProcessStatus] ?? STATUS_LABELS.unknown;
}

export function presentTimerLabel(timerDueAt: string | null): string | null {
  if (!timerDueAt) return null;
  const instant = Date.parse(timerDueAt);
  if (!Number.isFinite(instant)) return null;
  return new Date(instant).toISOString();
}

function presentMilestone(item: CaseMilestoneRecord) {
  return {
    id: item.id,
    label: item.label,
    sequence: Number.isFinite(item.sequence) ? item.sequence : null,
    status: item.status,
    statusLabel: presentProcessStatus(item.status),
    expectedEventLabel: item.expectedEventLabel,
    timerLabel: presentTimerLabel(item.timerDueAt),
    supportProcessLabel: item.supportProcessLabel,
  };
}

function accessDenied(): OfficialControlPanelProcessStructureAccessResult {
  return {
    ok: false,
    code: "process_structure_access_denied",
    status: 403,
    message: ACCESS_DENIED_MESSAGE,
  };
}
