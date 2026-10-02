import type { CoreMilestoneAxisItem } from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis.types";
import type { CoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";
import type { CoreMilestoneProgressStatus } from "@/services/eve/official-control-panel/official-control-panel-core-milestones";
import type { CoreMilestoneFinalAlternative } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";

export type CoreMilestoneAxisStatus =
  | "idle"
  | "loading"
  | "error"
  | "partial"
  | "ready";

export type CoreMilestoneAxisViewModel = {
  status: CoreMilestoneAxisStatus;
  items: CoreMilestoneAxisItem[];
  /** Validated selection only: equals selectedItem?.code, never raw URL alone. */
  selectedCode: CoreMilestoneCode | null;
  selectedItem: CoreMilestoneAxisItem | null;
  progress: {
    achieved: number;
    total: number;
    status: CoreMilestoneProgressStatus;
  };
  finalAlternative: CoreMilestoneFinalAlternative | null;
  /** Factual insufficiency/cancel reason when available from audit. */
  finalAlternativeReason: string | null;
  operationalDataBlocked: boolean;
  /** Soft refresh with items already on screen — never wipe UI for this. */
  refreshing: boolean;
  errorMessage: string | null;
};

export const CORE_MILESTONE_AXIS_ERROR_MESSAGE =
  "No fue posible abrir los hitos core del caso.";

export const CORE_MILESTONE_RAIL_TITLE = "Hitos core del caso";
export const CORE_MILESTONE_RAIL_NOTE = "";
