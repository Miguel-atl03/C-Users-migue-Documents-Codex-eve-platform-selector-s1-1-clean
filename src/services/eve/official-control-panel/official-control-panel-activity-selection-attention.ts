/**
 * §11 / §17 — factual WorkMap coverage gap → Monitoring/Attention projection.
 * Source of truth: activity_selection_results.workmap_coverage_gap (effective).
 * Does not compute coverage from free text.
 */

import type { OfficialControlPanelActivitySelectionRepository } from "./official-control-panel-activity-selection-repository";
import type { ActivitySelectionResultRecord } from "./official-control-panel-activity-selection.types";
import type {
  CompanyAttentionAlertView,
  ExperienceCapability,
} from "./official-control-panel-experience.types";

export const WORKMAP_COVERAGE_GAP_FACTUAL_REASON =
  "workmap_coverage_gap" as const;

/** §17.3 authorized response for workmap_coverage_gap. */
export const WORKMAP_COVERAGE_GAP_RESPONSE_HINT =
  "Microconfirmar cobertura" as const;

export const WORKMAP_COVERAGE_GAP_CAPABILITIES: ExperienceCapability[] = [
  "request_reentry",
  "mark_manual_review",
  "open_detail",
  "view_trajectory",
];

/**
 * Readiness effect when coverage gap is unresolved:
 * readiness must not claim complete coverage (CP-011: readiness > %).
 */
export type WorkmapCoverageReadinessEffect =
  | "conditioned"
  | "none"
  | "unavailable";

export type ActivitySelectionAttentionItemView = {
  alertType: "workmap_coverage_gap";
  resultId: string;
  caseId: string;
  participantId: string;
  profileId: string;
  roleRuntimeSessionId: string;
  workmapCoverageGap: true;
  unresolved: true;
  factualReason: typeof WORKMAP_COVERAGE_GAP_FACTUAL_REASON;
  readinessEffect: WorkmapCoverageReadinessEffect;
  authorizedResponseHint: typeof WORKMAP_COVERAGE_GAP_RESPONSE_HINT;
  reentryCapability: "request_reentry";
  reviewCapability: "mark_manual_review";
  effectiveFrom: string | null;
};

export type ActivitySelectionAttentionView = {
  caseId: string;
  items: ActivitySelectionAttentionItemView[];
  /** Factual absence when no effective row has workmap_coverage_gap=true. */
  dataStatus: "available" | "empty" | "error";
  message: string | null;
};

export type ActivitySelectionAttentionRepository =
  OfficialControlPanelActivitySelectionRepository & {
    listEffectiveByCase: (
      caseId: string,
    ) => Promise<ActivitySelectionResultRecord[]>;
  };

export function projectWorkmapCoverageGapAttentionItem(
  row: ActivitySelectionResultRecord,
): ActivitySelectionAttentionItemView | null {
  if (row.workmapCoverageGap !== true) return null;
  return {
    alertType: "workmap_coverage_gap",
    resultId: row.id,
    caseId: row.caseId,
    participantId: row.participantId,
    profileId: row.profileId,
    roleRuntimeSessionId: row.roleRuntimeSessionId,
    workmapCoverageGap: true,
    unresolved: true,
    factualReason: WORKMAP_COVERAGE_GAP_FACTUAL_REASON,
    readinessEffect: "conditioned",
    authorizedResponseHint: WORKMAP_COVERAGE_GAP_RESPONSE_HINT,
    reentryCapability: "request_reentry",
    reviewCapability: "mark_manual_review",
    effectiveFrom: row.effectiveFrom,
  };
}

export function toWorkmapCoverageGapCompanyAlert(
  item: ActivitySelectionAttentionItemView,
): CompanyAttentionAlertView {
  return {
    alertId: `workmap-coverage-gap:${item.resultId}`,
    alertType: "workmap_coverage_gap",
    severity: "warning",
    title: "Brecha de cobertura WorkMap",
    detail: `Cobertura incompleta (workmap_coverage_gap). Sesión ${item.roleRuntimeSessionId.slice(0, 8)}.`,
    scopeLabel: `Usuario/rol ${item.participantId.slice(0, 8)} / ${item.profileId.slice(0, 8)}`,
    responseHint: item.authorizedResponseHint,
    userId: item.participantId,
    capabilities: WORKMAP_COVERAGE_GAP_CAPABILITIES,
  };
}

export async function buildActivitySelectionAttentionView(
  repository: ActivitySelectionAttentionRepository,
  input: { caseId: string },
): Promise<ActivitySelectionAttentionView> {
  try {
    const rows = await repository.listEffectiveByCase(input.caseId);
    const items = rows
      .map(projectWorkmapCoverageGapAttentionItem)
      .filter((item): item is ActivitySelectionAttentionItemView => item != null);

    if (items.length === 0) {
      return {
        caseId: input.caseId,
        items: [],
        dataStatus: "empty",
        message: "Sin brecha de cobertura WorkMap en resultados vigentes.",
      };
    }

    return {
      caseId: input.caseId,
      items,
      dataStatus: "available",
      message: null,
    };
  } catch {
    return {
      caseId: input.caseId,
      items: [],
      dataStatus: "error",
      message: "No fue posible cargar la atención de selección de actividades.",
    };
  }
}

export function projectWorkmapCoverageGapAlertsFromAttention(
  view: ActivitySelectionAttentionView,
): CompanyAttentionAlertView[] {
  return view.items.map(toWorkmapCoverageGapCompanyAlert);
}
