import {
  CORE_MILESTONE_CODES,
  CORE_MILESTONE_DEFINITIONS,
  CORE_MILESTONE_TOTAL,
  formatCoreMilestoneObjectState,
  formatCoreMilestoneUiStateLabel,
  resolveCoreMilestoneUiState,
  type CoreMilestoneCode,
} from "./catalogs/core-milestone-axis.catalog";
import { assertConsultantClientContextAccess } from "./official-control-panel-context-service";
import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";
import type {
  CoreMilestoneAxisItem,
  CoreMilestoneAxisResponse,
  CoreMilestoneAxisRpcMilestone,
  CoreMilestoneAxisRpcPayload,
  OfficialControlPanelCoreMilestoneAccessResult,
} from "./official-control-panel-core-milestone-axis.types";
import type { CoreMilestoneProgressStatus } from "./official-control-panel-core-milestones";

const ACCESS_DENIED_MESSAGE =
  "No fue posible abrir los hitos core del caso.";
const DATA_UNAVAILABLE_MESSAGE =
  "No fue posible abrir los hitos core del caso.";

export type OfficialControlPanelCoreMilestoneAccessInput = {
  consultantUserId: string;
  companyId: string;
  relationshipId: string;
  caseId: string;
  at?: Date;
};

export type OfficialControlPanelCoreMilestoneAxisRepository = {
  listCoreMilestoneAxis(caseId: string): Promise<CoreMilestoneAxisRpcPayload>;
};

/**
 * Cumulative access: consultant → company → relationship → case.
 */
export async function assertConsultantCaseCoreMilestoneAccess(
  contextRepository: OfficialControlPanelContextRepository,
  input: OfficialControlPanelCoreMilestoneAccessInput,
): Promise<OfficialControlPanelCoreMilestoneAccessResult> {
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
      return {
        ok: false,
        status: 403,
        code: "core_milestone_access_denied",
        message: ACCESS_DENIED_MESSAGE,
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      status: 500,
      code: "core_milestone_data_unavailable",
      message: DATA_UNAVAILABLE_MESSAGE,
    };
  }
}

/**
 * Normaliza progreso BFF: `available` solo con 7 hitos evaluables
 * (vínculo presente + aplicable). En otro caso degrada a partial/unavailable.
 */
export function normalizeCoreMilestoneProgressForPresentation(
  rpc: CoreMilestoneAxisRpcPayload,
): {
  status: CoreMilestoneProgressStatus;
  achieved: number;
  total: number;
  evaluableCount: number;
} {
  const byCode = new Map<CoreMilestoneCode, CoreMilestoneAxisRpcMilestone>();
  for (const item of rpc.milestones) {
    byCode.set(item.code, item);
  }

  let evaluableCount = 0;
  let achieved = 0;
  for (const code of CORE_MILESTONE_CODES) {
    const row = byCode.get(code);
    if (row?.linkPresent && row.linkApplicable) {
      evaluableCount += 1;
      if (row.reached) achieved += 1;
    }
  }

  if (rpc.status === "unavailable" || rpc.total === 0) {
    return { status: "unavailable", achieved: 0, total: 0, evaluableCount };
  }

  const fullyEvaluable =
    evaluableCount === CORE_MILESTONE_TOTAL &&
    rpc.milestones.length >= CORE_MILESTONE_TOTAL &&
    CORE_MILESTONE_CODES.every((code) => byCode.has(code));

  if (rpc.status === "available" && fullyEvaluable && rpc.total === 7) {
    return {
      status: "available",
      achieved,
      total: CORE_MILESTONE_TOTAL,
      evaluableCount,
    };
  }

  return {
    status: "partial",
    achieved,
    total: rpc.total > 0 ? rpc.total : CORE_MILESTONE_TOTAL,
    evaluableCount,
  };
}

/**
 * Catalog always returned. UI states are factual per link + reached + status.
 */
export function buildCoreMilestoneAxisResponse(
  rpc: CoreMilestoneAxisRpcPayload | null,
): CoreMilestoneAxisResponse {
  const raw = rpc ?? unavailableAxisRpc();
  const progress = normalizeCoreMilestoneProgressForPresentation(raw);

  const byCode = new Map<CoreMilestoneCode, CoreMilestoneAxisRpcMilestone>();
  for (const item of raw.milestones) {
    byCode.set(item.code, item);
  }

  const operationalDataBlocked = progress.status !== "available";

  const items: CoreMilestoneAxisItem[] = CORE_MILESTONE_DEFINITIONS.map(
    (definition) => {
      const row = byCode.get(definition.code);
      const linkPresent = row?.linkPresent === true;
      const linkApplicable = row?.linkApplicable === true;
      const reachedRaw = row?.reached === true;

      const uiState = resolveCoreMilestoneUiState({
        progressStatus: progress.status,
        linkPresent,
        linkApplicable,
        reached: reachedRaw,
      });
      const preRuntimeNotStarted =
        definition.code !== "H0" &&
        progress.status === "partial" &&
        !linkPresent;

      let reached: boolean | null = null;
      if (linkPresent && linkApplicable) {
        if (reachedRaw) {
          reached = true;
        } else if (progress.status === "available") {
          reached = false;
        }
      }

      return {
        code: definition.code,
        label: definition.label,
        sequence: definition.sequence,
        objectStateLabel: formatCoreMilestoneObjectState(definition),
        expectedNextEventLabel: definition.expectedNextEventLabel,
        timerPolicyName: definition.timerPolicyName,
        responsibleProcessCode: definition.responsibleProcessCode,
        responsibleProcessManual: definition.responsibleProcessManual,
        modalityLabel: definition.responsibleProcessManual
          ? "MANUAL"
          : definition.responsibleProcessCode
            ? "PLATAFORMA"
            : null,
        reached,
        uiState,
        uiStateLabel: preRuntimeNotStarted
          ? "Aún no iniciado"
          : formatCoreMilestoneUiStateLabel(uiState),
        dataStatus:
          linkPresent &&
          linkApplicable &&
          (progress.status === "available" || reachedRaw)
            ? "available"
            : "unavailable",
      };
    },
  );

  return {
    items,
    progress: {
      achieved: progress.achieved,
      total: progress.total,
      status: progress.status,
    },
    finalAlternative: raw.finalAlternative,
    finalAlternativeReason: raw.finalAlternativeReason,
    operationalDataBlocked,
  };
}

/** Catalog-only fallback when RPC fails — never invents reached. */
export function buildCoreMilestoneAxisCatalogFallback(): CoreMilestoneAxisResponse {
  return buildCoreMilestoneAxisResponse(null);
}

export async function resolveCoreMilestoneAxisResponse(
  repository: OfficialControlPanelCoreMilestoneAxisRepository,
  caseId: string,
): Promise<CoreMilestoneAxisResponse> {
  try {
    const rpc = await repository.listCoreMilestoneAxis(caseId);
    return buildCoreMilestoneAxisResponse(rpc);
  } catch {
    return buildCoreMilestoneAxisCatalogFallback();
  }
}

function unavailableAxisRpc(): CoreMilestoneAxisRpcPayload {
  return {
    status: "unavailable",
    achieved: 0,
    total: 0,
    milestones: CORE_MILESTONE_DEFINITIONS.map((item) => ({
      code: item.code,
      reached: false,
      linkPresent: false,
      linkApplicable: false,
    })),
    finalAlternative: null,
    finalAlternativeReason: null,
  };
}

export { CORE_MILESTONE_TOTAL };
