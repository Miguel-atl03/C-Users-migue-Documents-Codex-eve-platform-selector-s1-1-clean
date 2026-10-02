import type { CaseProcessStructureResponse } from "@/services/eve/official-control-panel/official-control-panel-process-structure.types";

export type ProcessStructureStatus =
  | "idle"
  | "loading"
  | "empty"
  | "partial"
  | "active"
  | "error";

export type ProcessStructureMilestoneView = {
  id: string;
  label: string;
  sequence: number | null;
  status: string;
  statusLabel: string | null;
  expectedEventLabel: string | null;
  timerLabel: string | null;
  supportProcessLabel: string | null;
  isCurrent: boolean;
  waitCompleteness: "none" | "complete" | "incomplete";
};

export type ProcessStructureViewModel = {
  status: ProcessStructureStatus;
  caseId: string | null;
  caseLabel: string | null;
  mainProcess: CaseProcessStructureResponse["mainProcess"];
  milestones: ProcessStructureMilestoneView[];
  selectedMilestoneId: string | null;
  selectedMilestone: ProcessStructureMilestoneView | null;
  currentMilestone: ProcessStructureMilestoneView | null;
  inconsistencyFlags: string[];
  errorMessage: string | null;
};

export const PROCESS_STRUCTURE_ERROR_MESSAGE =
  "No fue posible abrir la estructura del caso.";

export const UNAVAILABLE_LABEL = "No disponible";

export function classifyProcessStructureStatus(input: {
  caseActive: boolean;
  loading: boolean;
  error: boolean;
  response: CaseProcessStructureResponse | null;
}): ProcessStructureStatus {
  if (!input.caseActive) return "idle";
  if (input.loading) return "loading";
  if (input.error) return "error";
  if (!input.response) return "error";

  if (!input.response.mainProcess) return "empty";

  const milestones = input.response.milestones;
  if (milestones.length === 0) return "partial";

  const flags = collectInconsistencyFlags(input.response);
  const hasIncompleteWait = milestones.some(
    (item) => waitCompleteness(item) === "incomplete",
  );
  const currentId = input.response.mainProcess.currentMilestoneId;
  const currentValid =
    currentId != null && milestones.some((item) => item.id === currentId);

  if (!currentValid || hasIncompleteWait || flags.length > 0) {
    return "partial";
  }

  return "active";
}

export function presentProcessStructureViewModel(input: {
  status: ProcessStructureStatus;
  caseId: string | null;
  caseLabel: string | null;
  response: CaseProcessStructureResponse | null;
  selectedMilestoneId: string | null;
  errorMessage?: string | null;
}): ProcessStructureViewModel {
  const response = input.response;
  const currentId = response?.mainProcess?.currentMilestoneId ?? null;
  const milestones = (response?.milestones ?? [])
    .slice()
    .sort((a, b) => {
      const left = a.sequence ?? Number.POSITIVE_INFINITY;
      const right = b.sequence ?? Number.POSITIVE_INFINITY;
      return left - right;
    })
    .map((item) => ({
      id: item.id,
      label: item.label,
      sequence: item.sequence,
      status: item.status,
      statusLabel: item.statusLabel,
      expectedEventLabel: item.expectedEventLabel,
      timerLabel: item.timerLabel,
      supportProcessLabel: item.supportProcessLabel,
      isCurrent: currentId != null && item.id === currentId,
      waitCompleteness: waitCompleteness(item),
    }));

  const selected =
    milestones.find((item) => item.id === input.selectedMilestoneId) ?? null;
  const current = milestones.find((item) => item.isCurrent) ?? null;

  return {
    status: input.status,
    caseId: input.caseId,
    caseLabel: input.caseLabel,
    mainProcess: response?.mainProcess ?? null,
    milestones,
    selectedMilestoneId: selected?.id ?? null,
    selectedMilestone: selected,
    currentMilestone: current,
    inconsistencyFlags: response ? collectInconsistencyFlags(response) : [],
    errorMessage:
      input.status === "error"
        ? (input.errorMessage ?? PROCESS_STRUCTURE_ERROR_MESSAGE)
        : null,
  };
}

export function waitCompleteness(milestone: {
  status: string;
  expectedEventLabel: string | null;
  timerLabel: string | null;
}): "none" | "complete" | "incomplete" {
  if (milestone.status !== "waiting") return "none";
  if (milestone.expectedEventLabel && milestone.timerLabel) return "complete";
  return "incomplete";
}

export function collectInconsistencyFlags(
  response: CaseProcessStructureResponse,
): string[] {
  const flags: string[] = [];
  const currentId = response.mainProcess?.currentMilestoneId ?? null;
  if (!currentId) return flags;

  const current = response.milestones.find((item) => item.id === currentId);
  if (!current) {
    flags.push("current_milestone_missing_from_list");
    return flags;
  }
  if (current.status !== "current") {
    flags.push("current_milestone_status_mismatch");
  }
  return flags;
}

export function labelOrUnavailable(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : UNAVAILABLE_LABEL;
}
