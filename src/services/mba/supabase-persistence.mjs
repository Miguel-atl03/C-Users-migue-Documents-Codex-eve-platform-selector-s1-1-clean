import { EVENT_ALIASES, STATE_ALIASES } from "./domain-state-registry.mjs";

const failureResult = ({
  error_code,
  error_message,
  table_name = null,
  event_count = 0,
  snapshot_count = 0,
  finding_count = 0,
  timer_count = 0,
  report_id = null,
}) => ({
  persisted: false,
  error_code: error_code ?? "MBA_PERSISTENCE_ERROR",
  error_message: error_message ?? "Unknown MBA persistence error.",
  table_name,
  event_count,
  snapshot_count,
  finding_count,
  timer_count,
  report_id,
});

const compactEvent = (event) => ({
  event_id: event.event_id,
  event_type: event.event_type,
  emitted_by: event.emitted_by,
  received_by: event.received_by,
  object_type: event.object_type,
  object_id: event.object_id,
  previous_state: event.previous_state,
  target_state: event.target_state,
  timestamp: event.timestamp,
  technical_actor: event.technical_actor,
  correlation_id: event.correlation_id,
  case_id: event.case_id,
  operation: event.operation,
  responsible_process: event.responsible_process,
  legacy_event_type: event.legacy_event_type,
  legacy_previous_state: event.legacy_previous_state,
  legacy_target_state: event.legacy_target_state,
  governance_mode: event.governance_mode ?? event.validation_result?.operation_mode ?? "shadow_mode",
  warnings: event.warnings ?? event.validation_result?.warnings ?? [],
  nonconformances: event.nonconformances ?? event.validation_result?.nonconformance ?? [],
  source_adapter: event.source_adapter,
  session_id: event.session_id,
  payload: event.payload ?? {},
  validation_result: event.validation_result ?? {},
});

const snapshotRow = (snapshot) => ({
  object_type: snapshot.object_type,
  object_id: snapshot.object_id,
  case_id: snapshot.case_id,
  current_state: snapshot.current_state,
  updated_at: snapshot.updated_at,
  last_event_id: snapshot.last_event_id,
  last_validation_status: snapshot.last_validation_status,
});

const observationRow = (snapshot, event) => ({
  case_id: snapshot.case_id,
  session_id: event?.session_id ?? null,
  object_type: snapshot.object_type,
  object_id: snapshot.object_id,
  observed_state: snapshot.current_state,
  source_adapter: event?.source_adapter ?? null,
  source_artifact: event?.payload?.source_artifact ?? null,
  observed_at: snapshot.updated_at,
  payload: {
    last_event_id: snapshot.last_event_id,
    last_validation_status: snapshot.last_validation_status,
  },
});

const findingRow = (finding) => ({
  event_id: finding.event_id ?? null,
  case_id: finding.case_id ?? null,
  session_id: finding.session_id ?? null,
  object_type: finding.object_type,
  object_id: finding.object_id,
  rule_id: finding.rule_id,
  severity: finding.severity,
  description: finding.description,
  action: finding.action,
  detail: finding.detail ?? null,
  status: finding.status ?? "open",
});

const timerRow = (timer) => ({
  timer_id: timer.timer_id,
  timer_name: timer.timer_name,
  process_state: timer.process_state,
  started_at: timer.started_at,
  expires_at: timer.expires_at,
  status: timer.status,
  exit_applied: timer.exit_applied,
  case_id: timer.case_id,
  session_id: timer.session_id ?? null,
  object_type: timer.object_type,
  object_id: timer.object_id,
});

export function legacyMappingRows(sourceAdapter = "mba_control_plane") {
  const eventRows = Object.entries(EVENT_ALIASES).map(([legacy, canonical]) => ({
    mapping_type: "event",
    object_type: null,
    legacy_name: legacy,
    mba_canonical_name: canonical,
    source_adapter: sourceAdapter,
    active: true,
  }));
  const stateRows = Object.entries(STATE_ALIASES).flatMap(([objectType, aliases]) =>
    Object.entries(aliases).map(([legacy, canonical]) => ({
      mapping_type: "state",
      object_type: objectType,
      legacy_name: legacy,
      mba_canonical_name: canonical,
      source_adapter: sourceAdapter,
      active: true,
    })),
  );
  return [...eventRows, ...stateRows];
}

export async function persistMbaControlPlaneState({
  supabase,
  ledger,
  timerLedger,
  report,
  extraFindings = [],
  persistLegacyMappings = true,
  missingClientContext = null,
} = {}) {
  const events = ledger?.listEvents() ?? [];
  const snapshots = ledger?.listSnapshots() ?? [];
  const timers = timerLedger?.listTimers() ?? [];
  const findings = [
    ...(ledger?.listFindings() ?? []),
    ...(timerLedger?.listFindings() ?? []),
    ...extraFindings,
  ];
  const eventsById = new Map(events.map((event) => [event.event_id, event]));
  const summary = {
    event_count: events.length,
    snapshot_count: snapshots.length,
    finding_count: findings.length,
    timer_count: timers.length,
    report_id: report?.report_id ?? null,
  };

  if (!supabase) {
    return failureResult({
      ...summary,
      error_code: missingClientContext?.error_code ?? "MBA_SUPABASE_CLIENT_UNAVAILABLE",
      error_message:
        missingClientContext?.error_message ??
        "Supabase client is unavailable for MBA persistence.",
      table_name: missingClientContext?.table_name ?? null,
    });
  }

  const persistStep = async (tableName, operation) => {
    const result = await operation();
    if (result?.error) {
      return failureResult({
        ...summary,
        error_code: result.error.code ?? "MBA_SUPABASE_WRITE_ERROR",
        error_message: result.error.message ?? `Failed to persist table ${tableName}.`,
        table_name: tableName,
      });
    }
    return null;
  };

  if (persistLegacyMappings) {
    const failed = await persistStep("mba_legacy_mappings", () =>
      supabase.from("mba_legacy_mappings").upsert(legacyMappingRows(), {
        onConflict: "mapping_type,object_type,legacy_name,mba_canonical_name",
      }),
    );
    if (failed) return failed;
  }

  if (events.length) {
    const failed = await persistStep("mba_event_ledger", () =>
      supabase.from("mba_event_ledger").upsert(events.map(compactEvent), {
        onConflict: "event_id",
      }),
    );
    if (failed) return failed;
  }

  if (snapshots.length) {
    const snapshotFailed = await persistStep("mba_object_state_snapshots", () =>
      supabase.from("mba_object_state_snapshots").upsert(snapshots.map(snapshotRow), {
        onConflict: "object_type,object_id",
      }),
    );
    if (snapshotFailed) return snapshotFailed;
    const observationFailed = await persistStep("mba_domain_state_observations", () =>
      supabase.from("mba_domain_state_observations").insert(
        snapshots.map((snapshot) => observationRow(snapshot, eventsById.get(snapshot.last_event_id))),
      ),
    );
    if (observationFailed) return observationFailed;
  }

  if (findings.length) {
    const failed = await persistStep("mba_transition_findings", () =>
      supabase.from("mba_transition_findings").insert(findings.map(findingRow)),
    );
    if (failed) return failed;
  }

  if (timers.length) {
    const failed = await persistStep("mba_timer_ledger", () =>
      supabase.from("mba_timer_ledger").upsert(timers.map(timerRow), {
        onConflict: "timer_id",
      }),
    );
    if (failed) return failed;
  }

  if (report) {
    const failed = await persistStep("mba_compliance_reports", () =>
      supabase.from("mba_compliance_reports").upsert(
        {
          report_id: report.report_id,
          case_id: report.case_id,
          session_id: report.session_id ?? null,
          generated_at: report.generated_at,
          operation_mode: report.operation_mode,
          report_json: report,
        },
        { onConflict: "report_id" },
      ),
    );
    if (failed) return failed;
  }

  return {
    persisted: true,
    error_code: null,
    error_message: null,
    table_name: null,
    ...summary,
  };
}
