import { evaluateInitialGateNonconformance } from "./nonconformance-rules.mjs";
import { normalizeGovernanceFindingsV03 } from "./governance-finding-normalizer.mjs";

const unique = (values) => [...new Set(values.filter(Boolean))];

const collectCircularDependencies = (events) =>
  events.flatMap((event) => event.payload?.circular_dependencies ?? event.payload?.circularDependencies ?? []);

export function buildMbaComplianceReport({
  case_id,
  ledger,
  timerLedger,
  hard_gate_candidates = [],
  extra_findings = [],
} = {}) {
  const generatedAt = new Date().toISOString();
  const reportIdSuffix = generatedAt.replace(/[-:.TZ]/g, "");
  const events = ledger?.listEvents() ?? [];
  const snapshots = ledger?.listSnapshots() ?? [];
  const timerFindings = timerLedger?.listFindings() ?? [];
  const timerEntries = timerLedger?.listTimers() ?? [];
  const objectStates = snapshots.reduce((accumulator, snapshot) => {
    accumulator[snapshot.object_type] = accumulator[snapshot.object_type] ?? [];
    accumulator[snapshot.object_type].push({
      object_id: snapshot.object_id,
      state: snapshot.current_state,
    });
    return accumulator;
  }, {});
  const gateFindings = evaluateInitialGateNonconformance({
    objectStates,
    relationships: {
      traceability_complete: events.some(
        (event) =>
          event.object_type === "EvidenceBundle" &&
          event.target_state === "ReadyForTransduction" &&
          event.payload?.traceability_complete === true,
      ),
    },
  });
  const findings = [
    ...(ledger?.listFindings() ?? []),
    ...timerFindings,
    ...gateFindings,
    ...extra_findings,
  ];
  const transitionsValid = events.filter((event) => event.validation_result.status === "valid");
  const transitionsNonConformant = events.filter(
    (event) => event.validation_result.status !== "valid",
  );
  const warningsFromEvents = events.flatMap((event) => event.validation_result.warnings ?? []);
  const warningsFromFindings = findings
    .filter((finding) => String(finding.severity ?? "").startsWith("warning"))
    .map((finding) => finding.rule_id ?? finding.description)
    .filter(Boolean);
  const warnings = [...warningsFromEvents, ...warningsFromFindings];
  const findingsToPSup06 = findings.filter((finding) =>
    /P-SUP-06|inventario|IR|diagram|export|Produccion/i.test(
      `${finding.action ?? ""} ${finding.detail ?? ""} ${finding.description ?? ""}`,
    ),
  );
  const findingsAffectingCapa1OrReadiness = findings.filter((finding) =>
    /EvidenceBundle|SceneCanonicalRecord|Capa 1|readiness|transduccion/i.test(
      `${finding.detail ?? ""} ${finding.description ?? ""}`,
    ),
  );

  const reportId = `MBA-COMPLIANCE-${case_id ?? "unknown"}-${events.length}-${reportIdSuffix}`;
  const reportCaseId = case_id ?? events[0]?.case_id ?? null;
  const reportSessionId = events[0]?.session_id ?? null;
  const softGovernanceV03DryRun = normalizeGovernanceFindingsV03({
    report_id: reportId,
    case_id: reportCaseId,
    session_id: reportSessionId,
    findings,
    events,
    hard_gate_candidates,
    readiness_controls: {
      generated_at: generatedAt,
    },
  });

  return {
    report_id: reportId,
    case_id: reportCaseId,
    session_id: reportSessionId,
    generated_at: generatedAt,
    operation_mode: events[0]?.validation_result?.operation_mode ?? "shadow_mode",
    events_observed: events,
    object_states_reached: snapshots,
    valid_transitions: transitionsValid,
    non_conformant_transitions: transitionsNonConformant,
    warnings: unique(warnings),
    hard_gate_candidates,
    circular_dependencies_detected: collectCircularDependencies(events),
    findings_should_return_to_p_sup_06: findingsToPSup06,
    findings_affecting_capa1_or_capa2_readiness: findingsAffectingCapa1OrReadiness,
    timer_ledger: timerEntries,
    findings,
    soft_governance_v03_dry_run: softGovernanceV03DryRun,
    shadow_mode_next_action:
      findings.length || transitionsNonConformant.length || hard_gate_candidates.length
        ? "Mantener shadow_mode, resolver findings y observar mas casos antes de activar soft_governance_mode."
        : "Mantener shadow_mode hasta contar con evidencia operativa suficiente de casos reales.",
    summary: {
      event_count: events.length,
      valid_transition_count: transitionsValid.length,
      non_conformant_transition_count: transitionsNonConformant.length,
      warning_count: unique(warnings).length,
      finding_count: findings.length,
      governance_finding_v03_count: softGovernanceV03DryRun.normalized_findings.length,
      governance_finding_v03_unsupported_count: softGovernanceV03DryRun.unsupported_findings.length,
      timer_count: timerEntries.length,
      hard_gate_candidate_count: hard_gate_candidates.length,
    },
  };
}
