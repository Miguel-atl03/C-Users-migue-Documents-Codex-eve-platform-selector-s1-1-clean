const hasAny = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
};

const FLAG_WARNING_RULES = Object.freeze({
  V8_algedonic_risk_human_compensation: {
    rule_id: "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
    severity: "warning_high",
    action: "observe_and_review",
    route_to: "S3* / Canal Algedonico",
    description:
      "Algedonic risk and human compensation signals were detected in SceneCanonicalRecord.",
  },
  R8_residual_coordination_variety: {
    rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
    severity: "warning_medium",
    action: "observe_and_review",
    route_to: "S2/S3*",
    description: "Residual coordination variety signals were detected in SceneCanonicalRecord.",
  },
});

const extractFlagType = (flag) => {
  if (!flag || typeof flag !== "object") return null;
  return flag.flagType ?? flag.flag_type ?? flag.type ?? null;
};

const mapFlagFindings = ({ flags = [], caseId, sessionId, eventId, objectId }) => {
  const mapped = [];
  for (const flag of flags) {
    const flagType = extractFlagType(flag);
    if (!flagType || !FLAG_WARNING_RULES[flagType]) continue;
    const rule = FLAG_WARNING_RULES[flagType];
    mapped.push({
      rule_id: rule.rule_id,
      severity: rule.severity,
      description: rule.description,
      action: rule.action,
      detail: `route_to=${rule.route_to}; flag_type=${flagType}; no_block_shadow_mode=true; no_capa2_readiness_modification=true`,
      case_id: caseId,
      session_id: sessionId,
      object_type: "SceneCanonicalRecord",
      object_id: objectId,
      event_id: eventId,
      status: "open",
    });
  }
  return mapped;
};

const traceabilityComplete = (record, evidenceBundle) => {
  const traceability = record?.traceability ?? record?.canonical_json?.traceability ?? {};
  const evidenceIds = traceability.evidenceAnswerIds ?? record?.evidence_answer_ids ?? [];
  const derivationIds = traceability.derivationIds ?? [];
  return hasAny(evidenceBundle) && hasAny(evidenceIds) && hasAny(derivationIds);
};

export function observeCapa1Outputs(input, { ledger, timerLedger } = {}) {
  const caseId = input.case_id ?? input.caseId ?? input.sessionId;
  const sceneCanonicalRecord = input.scene_canonical_record ?? input.sceneCanonicalRecord;
  const evidenceBundle =
    input.evidence_bundle_for_transduction ?? input.evidenceBundleForTransduction;
  const sessionReadyForTransduction =
    input.session_ready_for_transduction ?? input.sessionReadyForTransduction ?? false;
  const gaps = input.gaps ?? sceneCanonicalRecord?.gaps ?? [];
  const flags = input.flags ?? sceneCanonicalRecord?.flags ?? [];
  const events = [];
  const timers = [];
  const findings = [];

  if (sceneCanonicalRecord) {
    const objectId = String(sceneCanonicalRecord.id ?? sceneCanonicalRecord.scene_id ?? `${caseId}:scene`);
    const timerResult = timerLedger?.startTimer({
      timer_name: "max_tiempo_evidencia_inicial",
      process_state: "UnderConsolidation",
      responsible_process: "P-SUP-01",
      exit_applied: "SceneCanonicalRecord [BlockedByInsufficientEvidence]",
      case_id: caseId,
      session_id: input.session_id ?? input.sessionId ?? caseId,
      object_type: "SceneCanonicalRecord",
      object_id: objectId,
    });
    if (timerResult?.timer) timers.push(timerResult.timer);
    if (timerResult?.finding) findings.push(timerResult.finding);

    const sceneEvent = ledger.recordEvent({
        event_type: "SceneCanonicalRecordConsolidatedReceived",
        emitted_by: "Capa 1.0",
        received_by: "P-SUP-01",
        object_type: "SceneCanonicalRecord",
        object_id: objectId,
        previous_state: "ConformanceChecked",
        target_state: "Consolidated",
        operation: "consolidar",
        responsible_process: "P-SUP-01",
        technical_actor: input.technical_actor ?? "capa1_observer",
        correlation_id: caseId,
        case_id: caseId,
        payload: {
          source_artifact: "scene_canonical_record",
          gaps,
          flags,
          traceability_complete: traceabilityComplete(sceneCanonicalRecord, evidenceBundle),
        },
        source_adapter: "capa1_observer",
        session_id: input.session_id ?? input.sessionId ?? caseId,
      });
    events.push(sceneEvent);
    findings.push(
      ...mapFlagFindings({
        flags,
        caseId,
        sessionId: input.session_id ?? input.sessionId ?? caseId,
        eventId: sceneEvent.event_id,
        objectId,
      }),
    );
  }

  if (evidenceBundle) {
    const objectId = String(evidenceBundle.id ?? evidenceBundle.bundle_id ?? `${caseId}:evidence_bundle`);
    const complete = traceabilityComplete(sceneCanonicalRecord, evidenceBundle);
    const timerResult = timerLedger?.startTimer({
      timer_name: "max_tiempo_readiness_transduccion",
      process_state: "ReadinessAssessmentPending",
      responsible_process: "P-SUP-02",
      exit_applied: "EvidenceBundle [Blocked]",
      case_id: caseId,
      session_id: input.session_id ?? input.sessionId ?? caseId,
      object_type: "EvidenceBundle",
      object_id: objectId,
    });
    if (timerResult?.timer) timers.push(timerResult.timer);
    if (timerResult?.finding) findings.push(timerResult.finding);

    events.push(
      ledger.recordEvent({
        event_type: "EvidenceBundleReadyReceived",
        emitted_by: "Capa 1.0",
        received_by: "P-SUP-02",
        object_type: "EvidenceBundle",
        object_id: objectId,
        previous_state: "ReadinessAssessmentPending",
        target_state: "ReadyForTransduction",
        operation: "marcarReady",
        responsible_process: "P-SUP-02",
        technical_actor: input.technical_actor ?? "capa1_observer",
        correlation_id: caseId,
        case_id: caseId,
        payload: {
          source_artifact: "evidence_bundle_for_transduction",
          session_ready_for_transduction: Boolean(sessionReadyForTransduction),
          traceability_complete: complete,
          process_state: "ReadinessAssessmentPending",
        },
        source_adapter: "capa1_observer",
        session_id: input.session_id ?? input.sessionId ?? caseId,
        context: {
          relationships: {
            traceability_complete: complete,
          },
        },
      }),
    );
  }

  if (sessionReadyForTransduction && !evidenceBundle) {
    findings.push({
      rule_id: "MBA-WARN-SESSION-READY-WITHOUT-EVIDENCE-BUNDLE",
      severity: "warning",
      description:
        "session_ready_for_transduction appeared as true without an observed EvidenceBundle [ReadyForTransduction].",
      action:
        "Keep session_ready_for_transduction as an observed signal and require EvidenceBundle [ReadyForTransduction] as canonical target state.",
      detail: "session_ready_for_transduction=true; evidence_bundle_for_transduction missing from observed payload.",
      case_id: caseId,
      object_type: "EvidenceBundle",
      object_id: `${caseId}:evidence_bundle_missing`,
      status: "open",
    });
  }

  return {
    events,
    timers,
    findings,
    observed: {
      scene_canonical_record: Boolean(sceneCanonicalRecord),
      evidence_bundle_for_transduction: Boolean(evidenceBundle),
      session_ready_for_transduction: Boolean(sessionReadyForTransduction),
      gaps_count: gaps.length,
      flags_count: flags.length,
    },
  };
}
