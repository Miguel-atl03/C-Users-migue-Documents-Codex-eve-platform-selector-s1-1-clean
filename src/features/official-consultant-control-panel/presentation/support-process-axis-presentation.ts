import type { SupportProcessAxisItem } from "@/services/eve/official-control-panel/official-control-panel-support-process.types";
import type { SupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";
import type {
  SupportProcessAxisStatus,
  SupportProcessAxisViewModel,
} from "../types/support-process-axis.types";
import { SUPPORT_PROCESS_AXIS_ERROR_MESSAGE } from "../types/support-process-axis.types";
import { presentOperationalTargetObjectState } from "./operational-object-label-presentation";

export const UNAVAILABLE_FIELD_LABEL = "No disponible";
export const OPERATIONAL_STATUS_UNAVAILABLE = "Estado no disponible";
export const SELECT_SUPPORT_PROCESS_MESSAGE =
  "Seleccione un proceso de soporte para consultar su contexto.";

/** Etiqueta operativa de resultado esperado (nunca expone el nombre técnico crudo). */
export function formatTargetObjectState(
  objectLabel: string | null,
  stateLabel: string | null,
): string {
  return presentOperationalTargetObjectState(objectLabel, stateLabel);
}

export function formatModalityBadge(
  item: SupportProcessAxisItem,
): string | null {
  if (item.executionMode === "manual") return "MANUAL";
  if (item.executionMode === "platform") return "PLATAFORMA";
  return null;
}

export function formatModalityTooltip(item: SupportProcessAxisItem): string {
  if (item.executionMode === "manual") return "MANUAL";
  if (item.executionMode === "platform") return "PLATAFORMA";
  return UNAVAILABLE_FIELD_LABEL;
}

/** Accessible announcement for the selected chip (not color-dependent). */
export function formatSupportProcessAriaAnnouncement(
  item: SupportProcessAxisItem,
  selected: boolean,
): string {
  const modality =
    item.executionMode === "manual"
      ? "modalidad manual"
      : item.executionMode === "platform"
        ? "modalidad plataforma"
        : "modalidad no disponible";
  const status = item.operationalStatusLabel
    ? `estado ${item.operationalStatusLabel}`
    : OPERATIONAL_STATUS_UNAVAILABLE.toLowerCase();
  const parts = [item.code, modality, status];
  if (selected) parts.push("seleccionado");
  return parts.join(", ");
}

export function presentSupportProcessAxisViewModel(input: {
  status: SupportProcessAxisStatus;
  items: SupportProcessAxisItem[];
  selectedCode: SupportProcessAxisCode | null;
  operationalDataBlocked: boolean;
  errorMessage?: string | null;
}): SupportProcessAxisViewModel {
  const selectedItem =
    input.selectedCode == null
      ? null
      : (input.items.find((item) => item.code === input.selectedCode) ?? null);

  return {
    status: input.status,
    items: input.items,
    selectedCode: input.selectedCode,
    selectedItem,
    operationalDataBlocked: input.operationalDataBlocked,
    errorMessage:
      input.status === "error"
        ? (input.errorMessage ?? SUPPORT_PROCESS_AXIS_ERROR_MESSAGE)
        : null,
  };
}

export function classifySupportProcessAxisStatus(input: {
  hasAuthorizedContext: boolean;
  loading: boolean;
  error: boolean;
  itemsLoaded: boolean;
  /** Field-level only; does not drive axis status after catalog load. */
  operationalDataBlocked: boolean;
}): SupportProcessAxisStatus {
  if (!input.hasAuthorizedContext) return "idle";
  if (input.loading && !input.itemsLoaded) return "loading";
  if (input.error && !input.itemsLoaded) return "error";
  // Catalog loaded → ready. operationalDataBlocked stays field-level only.
  if (input.itemsLoaded) return "ready";
  if (input.loading) return "loading";
  return "idle";
}

export function axisStatusMessage(status: SupportProcessAxisStatus): string {
  switch (status) {
    case "idle":
      return "Seleccione un caso en curso para consultar los procesos de soporte.";
    case "loading":
      return "Cargando procesos de soporte…";
    case "partial":
      return "Algunos estados operativos no están disponibles.";
    case "error":
      return SUPPORT_PROCESS_AXIS_ERROR_MESSAGE;
    case "ready":
      return "";
  }
}
