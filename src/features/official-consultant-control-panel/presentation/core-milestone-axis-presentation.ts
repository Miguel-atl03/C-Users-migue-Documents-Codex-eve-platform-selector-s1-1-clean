import type { CoreMilestoneAxisItem } from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis.types";
import type { CoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";
import type { CoreMilestoneProgressStatus } from "@/services/eve/official-control-panel/official-control-panel-core-milestones";
import type { CoreMilestoneFinalAlternative } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";
import type {
  CoreMilestoneAxisStatus,
  CoreMilestoneAxisViewModel,
} from "../types/core-milestone-axis.types";
import { CORE_MILESTONE_AXIS_ERROR_MESSAGE } from "../types/core-milestone-axis.types";

export const UNAVAILABLE_FIELD_LABEL = "No disponible";
export const SELECT_CORE_MILESTONE_MESSAGE =
  "Seleccione un hito core para consultar su estado.";

export function presentCoreMilestoneAxisViewModel(input: {
  status: CoreMilestoneAxisStatus;
  items: CoreMilestoneAxisItem[];
  selectedCode: CoreMilestoneCode | null;
  progress: {
    achieved: number;
    total: number;
    status: CoreMilestoneProgressStatus;
  };
  finalAlternative: CoreMilestoneFinalAlternative | null;
  finalAlternativeReason?: string | null;
  operationalDataBlocked: boolean;
  refreshing?: boolean;
  errorMessage?: string | null;
}): CoreMilestoneAxisViewModel {
  const selectedItem =
    input.selectedCode == null
      ? null
      : (input.items.find((item) => item.code === input.selectedCode) ?? null);

  // URL becomes effective selection only when the code exists in axis.items.
  const validatedSelectedMilestone = selectedItem?.code ?? null;

  return {
    status: input.status,
    items: input.items,
    selectedCode: validatedSelectedMilestone,
    selectedItem,
    progress: input.progress,
    finalAlternative: input.finalAlternative,
    finalAlternativeReason: input.finalAlternativeReason ?? null,
    operationalDataBlocked: input.operationalDataBlocked,
    refreshing: Boolean(input.refreshing),
    errorMessage:
      input.status === "error"
        ? (input.errorMessage ?? CORE_MILESTONE_AXIS_ERROR_MESSAGE)
        : null,
  };
}

/**
 * Milestone code for matrix / intersection — only when axis is ready enough
 * and selection is validated against items.
 */
export function resolveEffectiveMilestoneCode(
  axis: Pick<
    CoreMilestoneAxisViewModel,
    "status" | "selectedItem"
  >,
): CoreMilestoneCode | null {
  if (axis.status !== "ready" && axis.status !== "partial") return null;
  return axis.selectedItem?.code ?? null;
}

export function classifyCoreMilestoneAxisStatus(input: {
  hasAuthorizedContext: boolean;
  loading: boolean;
  error: boolean;
  itemsLoaded: boolean;
  /** Field-level only; does not drive axis status after catalog load. */
  operationalDataBlocked: boolean;
}): CoreMilestoneAxisStatus {
  if (!input.hasAuthorizedContext) return "idle";
  if (input.loading && !input.itemsLoaded) return "loading";
  if (input.error && !input.itemsLoaded) return "error";
  // Catalog loaded → ready. Progress gaps stay in operationalDataBlocked / item data.
  if (input.itemsLoaded) return "ready";
  if (input.loading) return "loading";
  return "idle";
}

/**
 * KPI x/7 solo con evaluación completa (available + total 7).
 * partial / unavailable / total distinto → —.
 */
export function formatCoreMilestoneKpiValue(progress: {
  achieved: number;
  total: number;
  status: CoreMilestoneProgressStatus;
}): { value: string; empty: boolean } {
  if (progress.status !== "available" || progress.total !== 7) {
    return { value: "—", empty: true };
  }
  return {
    value: `${progress.achieved}/7`,
    empty: false,
  };
}

export function formatCoreMilestoneAriaAnnouncement(
  item: CoreMilestoneAxisItem,
  selected: boolean,
): string {
  const parts = [item.code, item.label, item.uiStateLabel];
  if (item.modalityLabel) parts.push(item.modalityLabel);
  if (selected) parts.push("seleccionado");
  return parts.join(", ");
}

export function formatResponsibleProcessLabel(
  item: CoreMilestoneAxisItem,
): string {
  if (!item.responsibleProcessCode) return UNAVAILABLE_FIELD_LABEL;
  if (item.responsibleProcessManual) {
    return `${item.responsibleProcessCode} — MANUAL`;
  }
  return item.responsibleProcessCode;
}
