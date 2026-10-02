/**
 * Footer runtime for Process Map cards: status clock + responsible worker.
 * Times come from SUP status_since/completed_at or operational-trace fallback —
 * never decorative placeholders.
 */

import type {
  ProcessExecutionMode,
  PMProcessCode,
  PMVisualStatus,
} from "./pm-process-catalog";

export type PMCardWorkerRole = "Sistema" | "Consultor";

export type PMCardStatusClock = {
  kind: "completed" | "elapsed" | "idle";
  text: string;
  title: string;
};

export type PMCardWorker = {
  role: PMCardWorkerRole;
  reason: string;
};

const TRACE_STEP_BY_PROCESS: Partial<Record<PMProcessCode, string>> = {
  "P-SUP-01": "actor_scene",
  "P-SUP-02": "evidence",
  "P-SUP-06": "variable_or_gap",
  "P-SUP-07/08": "gate_or_readiness",
  "P-SUP-09": "authorized_output",
};

export function traceCausalStepForProcess(
  processCode: PMProcessCode,
): string | undefined {
  return TRACE_STEP_BY_PROCESS[processCode];
}

/**
 * Who should be advancing the subprocess given mode + visual status + SUP signals.
 */
export function resolveCardWorker(input: {
  processCode: PMProcessCode;
  executionMode: ProcessExecutionMode;
  visualStatus: PMVisualStatus;
  operationalStatus?: string | null;
}): PMCardWorker {
  const status = (input.operationalStatus ?? "").toLowerCase();

  if (input.executionMode === "manual") {
    return {
      role: "Consultor",
      reason: "Ejecución manual fuera de plataforma · responsabilidad del consultor experto",
    };
  }

  if (input.processCode === "P-CLIENT-01") {
    return {
      role: "Consultor",
      reason: "Engagement y cierre de caso · relación con cliente",
    };
  }

  if (input.visualStatus === "bloqueado") {
    return {
      role: "Consultor",
      reason: "Estado bloqueado · requiere intervención consultor",
    };
  }

  if (
    status.includes("flag") ||
    status.includes("review") ||
    status.includes("partial") ||
    status.includes("satisfied_with")
  ) {
    return {
      role: "Consultor",
      reason: "Hay flags / revisión parcial · el consultor debe atender el estado",
    };
  }

  if (input.executionMode === "governance") {
    if (input.visualStatus === "completado") {
      return {
        role: "Consultor",
        reason: "Gobernanza de caso · confirmación / cierre consultor",
      };
    }
    return {
      role: "Sistema",
      reason: "Core en producción diagnóstica · el sistema avanza milestones de soporte",
    };
  }

  // platform
  if (input.visualStatus === "completado") {
    return {
      role: "Sistema",
      reason: "Milestone de plataforma alcanzado por el runtime / automatismos SUP",
    };
  }

  if (input.visualStatus === "en_progreso" || input.visualStatus === "pendiente") {
    return {
      role: "Sistema",
      reason: "Subproceso operativo en plataforma · el sistema ejecuta o espera el runtime",
    };
  }

  return {
    role: "Sistema",
    reason: "Pendiente de inicio en plataforma · responsable previsto: sistema",
  };
}

export function formatClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  // Fixed zone so SSR and client produce the same HH:mm.
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatElapsedDuration(sinceIso: string, nowMs: number): string {
  const since = new Date(sinceIso).getTime();
  if (Number.isNaN(since) || nowMs < since) return "—";
  const totalMinutes = Math.floor((nowMs - since) / 60000);
  if (totalMinutes < 1) {
    const seconds = Math.max(1, Math.floor((nowMs - since) / 1000));
    return `${seconds}s`;
  }
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function resolveCardStatusClock(input: {
  visualStatus: PMVisualStatus;
  completedAt: string | null;
  statusSinceAt: string | null;
  nowMs: number;
}): PMCardStatusClock {
  if (input.visualStatus === "completado" && input.completedAt) {
    const text = formatClockTime(input.completedAt);
    return {
      kind: "completed",
      text,
      title: `Completado a las ${text}`,
    };
  }

  if (
    (input.visualStatus === "en_progreso" ||
      input.visualStatus === "pendiente" ||
      input.visualStatus === "bloqueado") &&
    input.statusSinceAt
  ) {
    const text = formatElapsedDuration(input.statusSinceAt, input.nowMs);
    return {
      kind: "elapsed",
      text,
      title: `Tiempo en el estado actual desde ${formatClockTime(input.statusSinceAt)}`,
    };
  }

  // Completed without completed_at but with status_since → treat as completion clock.
  if (input.visualStatus === "completado" && input.statusSinceAt) {
    const text = formatClockTime(input.statusSinceAt);
    return {
      kind: "completed",
      text,
      title: `Completado a las ${text}`,
    };
  }

  return {
    kind: "idle",
    text: "—",
    title:
      input.visualStatus === "no_iniciado"
        ? "Subproceso no iniciado · sin tiempo de estado"
        : "Sin marca temporal operativa para este estado",
  };
}

export function latestTraceOccurredAt(
  events: Array<{ causal_step?: string | null; occurred_at?: string | null }> | undefined,
  causalStep: string | undefined,
): string | null {
  if (!events?.length || !causalStep) return null;
  let latest: string | null = null;
  let latestMs = -1;
  for (const event of events) {
    if (event.causal_step !== causalStep || !event.occurred_at) continue;
    const ms = new Date(event.occurred_at).getTime();
    if (!Number.isNaN(ms) && ms >= latestMs) {
      latestMs = ms;
      latest = event.occurred_at;
    }
  }
  return latest;
}
