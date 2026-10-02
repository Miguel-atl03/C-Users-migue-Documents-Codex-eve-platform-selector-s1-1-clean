import { randomUUID } from "node:crypto";
import { getTimerPolicy } from "./domain-state-registry.mjs";
import { MBA_NONCONFORMANCE_RULES } from "./nonconformance-rules.mjs";

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

export class InMemoryMbaTimerLedger {
  constructor({ defaultDurationMinutes = 60 } = {}) {
    this.defaultDurationMinutes = defaultDurationMinutes;
    this.timers = [];
    this.findings = [];
  }

  startTimer(input) {
    const processId = input.responsible_process ?? input.responsibleProcess ?? input.process_id ?? input.processId;
    const processState = input.process_state ?? input.processState;
    const startedAt = input.started_at ? new Date(input.started_at) : new Date();
    const policy = getTimerPolicy(processId, processState);
    const timerName = input.timer_name ?? input.timerName ?? policy?.timer_name ?? null;
    const exitApplied = input.exit_applied ?? input.exitApplied ?? policy?.exit_applied ?? null;

    if (!timerName || !exitApplied) {
      const finding = {
        rule_id: "NC-05",
        severity: "critical",
        description: MBA_NONCONFORMANCE_RULES["NC-05"].description,
        action: MBA_NONCONFORMANCE_RULES["NC-05"].action,
        detail: `${processId}:${processState} has no timer or temporal exit.`,
        case_id: input.case_id ?? input.caseId ?? null,
        object_type: input.object_type ?? input.objectType,
        object_id: input.object_id ?? input.objectId,
        status: "open",
      };
      this.findings.push(finding);
      return { timer: null, finding };
    }

    const timer = {
      timer_id: input.timer_id ?? input.timerId ?? randomUUID(),
      timer_name: timerName,
      process_state: processState,
      started_at: startedAt.toISOString(),
      expires_at:
        input.expires_at ??
        input.expiresAt ??
        addMinutes(startedAt, input.duration_minutes ?? input.durationMinutes ?? this.defaultDurationMinutes).toISOString(),
      status: input.status ?? "active",
      exit_applied: exitApplied,
      case_id: input.case_id ?? input.caseId ?? null,
      session_id: input.session_id ?? input.sessionId ?? null,
      object_type: input.object_type ?? input.objectType,
      object_id: String(input.object_id ?? input.objectId ?? ""),
    };

    this.timers.push(timer);
    return { timer, finding: null };
  }

  listTimers() {
    return [...this.timers];
  }

  listFindings() {
    return [...this.findings];
  }
}

export function createMbaTimerLedger(options = {}) {
  return new InMemoryMbaTimerLedger(options);
}
