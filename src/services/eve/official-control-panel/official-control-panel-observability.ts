/**
 * Structured observability for the official consultant control panel BFF.
 * Never logs bearer tokens, cookies, service role, or full response bodies.
 */

export type OfficialPanelLogLevel = "info" | "warn" | "error";

export type OfficialPanelLogEvent = {
  level: OfficialPanelLogLevel;
  requestId: string;
  operation: string;
  result: "ok" | "denied" | "error" | "conflict" | "timeout" | "unavailable";
  caseId?: string | null;
  runId?: string | null;
  processCode?: string | null;
  workItemId?: string | null;
  eventType?: string | null;
  beforeStatus?: string | null;
  afterStatus?: string | null;
  errorCode?: string | null;
  durationMs?: number | null;
};

function emit(event: OfficialPanelLogEvent): void {
  const payload = {
    ts: new Date().toISOString(),
    channel: "official-control-panel",
    ...event,
  };
  if (event.level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (event.level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  // info — keep structured; avoid noisy free-form console.log
  if (process.env.NODE_ENV !== "production") {
    console.info(JSON.stringify(payload));
  }
}

export function createOfficialPanelRequestId(): string {
  return `ocp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function logOfficialPanelEvent(event: OfficialPanelLogEvent): void {
  emit(event);
}
