import type { SupportProcessAxisItem } from "@/services/eve/official-control-panel/official-control-panel-support-process.types";
import type { SupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";

export type SupportProcessAxisStatus =
  | "idle"
  | "loading"
  | "ready"
  | "partial"
  | "error";

export type SupportProcessAxisViewModel = {
  status: SupportProcessAxisStatus;
  items: SupportProcessAxisItem[];
  selectedCode: SupportProcessAxisCode | null;
  selectedItem: SupportProcessAxisItem | null;
  operationalDataBlocked: boolean;
  errorMessage: string | null;
};

export const SUPPORT_PROCESS_AXIS_ERROR_MESSAGE =
  "No fue posible cargar los procesos de soporte.";
