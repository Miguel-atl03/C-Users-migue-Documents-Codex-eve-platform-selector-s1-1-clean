import type { ClientContextStatus } from "../types/client-context.types";
import type {
  OfficialPanelContextStatus,
  OfficialPanelDataStatus,
  OfficialPanelShellState,
} from "../types/official-control-panel.types";
import type { ExperienceDataStatus } from "@/services/eve/official-control-panel/official-control-panel-experience.types";

export type OfficialPanelShellSnapshot = {
  contextStatus: OfficialPanelContextStatus;
  dataStatus: OfficialPanelDataStatus;
};

function mapExperienceDataStatus(
  value: ExperienceDataStatus | null | undefined,
): OfficialPanelDataStatus {
  if (!value) return "empty";
  if (value === "available") return "available";
  if (value === "partial") return "partial";
  if (value === "error") return "error";
  return "empty";
}

/**
 * Separates shell readiness (context loaded) from factual data presence.
 * Internal only — never rendered in product UI.
 */
export function resolveOfficialPanelShellSnapshot(input: {
  shellState: OfficialPanelShellState;
  contextStatus: ClientContextStatus;
  experienceDataStatus?: ExperienceDataStatus | null;
}): OfficialPanelShellSnapshot {
  if (input.shellState === "loading") {
    return { contextStatus: "loading", dataStatus: "empty" };
  }
  if (input.shellState === "error") {
    return { contextStatus: "error", dataStatus: "error" };
  }
  if (
    input.contextStatus === "loading-companies" ||
    input.contextStatus === "loading-relationships" ||
    input.contextStatus === "loading-cases"
  ) {
    return { contextStatus: "loading", dataStatus: "empty" };
  }
  if (input.contextStatus === "error") {
    return { contextStatus: "error", dataStatus: "error" };
  }
  if (input.contextStatus !== "active") {
    return { contextStatus: "ready", dataStatus: "empty" };
  }
  return {
    contextStatus: "ready",
    dataStatus: mapExperienceDataStatus(input.experienceDataStatus),
  };
}
