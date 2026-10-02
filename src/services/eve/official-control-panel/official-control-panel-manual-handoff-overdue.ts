import type {
  HandoffStatus,
  ManualTrackingStatus,
} from "./official-control-panel-manual-work.types";

export type ManualHandoffOverdueInput = {
  handoffStatus: HandoffStatus | string;
  manualTrackingStatus: ManualTrackingStatus | string;
  expectedHandoffAt: string | null | undefined;
  expectedEvent: string | null | undefined;
};

export type ManualHandoffOverdueResult = {
  evaluable: boolean;
  overdue: boolean;
  dueAt: string | null;
  overdueMs: number | null;
};

/**
 * §17.3 Manual handoff overdue — exact factual condition for Ola 1.
 * No alert without expected handoff, due date, expected event, and pending handoff.
 */
export function evaluateManualHandoffOverdue(
  input: ManualHandoffOverdueInput,
  now: Date = new Date(),
): ManualHandoffOverdueResult {
  const handoff = input.handoffStatus;
  const tracking = input.manualTrackingStatus;
  const event = (input.expectedEvent ?? "").trim();
  const dueRaw = (input.expectedHandoffAt ?? "").trim();

  if (handoff === "accepted" || handoff === "closed") {
    return { evaluable: false, overdue: false, dueAt: null, overdueMs: null };
  }
  if (tracking === "accepted") {
    return { evaluable: false, overdue: false, dueAt: null, overdueMs: null };
  }
  if (handoff !== "pending") {
    return { evaluable: false, overdue: false, dueAt: null, overdueMs: null };
  }
  if (!dueRaw || !event) {
    return { evaluable: false, overdue: false, dueAt: null, overdueMs: null };
  }

  const dueAt = new Date(dueRaw);
  if (Number.isNaN(dueAt.getTime())) {
    return { evaluable: false, overdue: false, dueAt: null, overdueMs: null };
  }

  const overdueMs = now.getTime() - dueAt.getTime();
  return {
    evaluable: true,
    overdue: overdueMs > 0,
    dueAt: dueAt.toISOString(),
    overdueMs: overdueMs > 0 ? overdueMs : 0,
  };
}

export function formatOverdueDuration(overdueMs: number): string {
  const hours = Math.floor(overdueMs / 3_600_000);
  if (hours < 24) return `${hours} h vencidas`;
  const days = Math.floor(hours / 24);
  return `${days} d vencidos`;
}
