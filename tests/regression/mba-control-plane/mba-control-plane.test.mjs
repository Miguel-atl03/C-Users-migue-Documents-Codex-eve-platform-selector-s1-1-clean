import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMbaComplianceReport,
  createMbaEventLedger,
  createMbaTimerLedger,
  evaluateTransition,
  observeCapa1Outputs,
  observeParallelProductionOutputs,
  persistMbaControlPlaneState,
  normalizeGovernanceFindingsV03,
  resolveMbaOperationMode,
} from "../../../src/services/mba/index.mjs";

const caseId = "MBA_CASE_TEST_001";

const canonicalScene = {
  id: "SCR_TEST_001",
  scene_id: "SCENE_TEST_001",
  evidence_answer_ids: ["ANS_001"],
  traceability: {
    evidenceAnswerIds: ["ANS_001"],
    derivationIds: ["DER_001"],
  },
  gaps: [],
  flags: [],
};

const evidenceBundle = {
  id: "EB_TEST_001",
  bundle_type: "evidence_bundle_for_transduction",
};

test("Capa 1.0 produces SceneCanonicalRecord [Consolidated]", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: canonicalScene,
    },
    { ledger, timerLedger },
  );

  const snapshot = ledger
    .listSnapshots()
    .find((item) => item.object_type === "SceneCanonicalRecord");

  assert.equal(snapshot.current_state, "Consolidated");
  assert.equal(ledger.listEvents()[0].event_type, "SceneCanonicalRecordConsolidatedReceived");
  assert.equal(ledger.listEvents()[0].validation_result.status, "valid");
});

test("SceneCanonicalRecord [Consolidated] enables EvidenceBundle [ReadyForTransduction]", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: canonicalScene,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );

  const snapshot = ledger
    .listSnapshots()
    .find((item) => item.object_type === "EvidenceBundle");

  assert.equal(snapshot.current_state, "ReadyForTransduction");
  assert.equal(
    ledger.listEvents().find((item) => item.object_type === "EvidenceBundle").target_state,
    "ReadyForTransduction",
  );
  assert.equal(ledger.listFindings().length, 0);
});

test("Produccion Paralela can remain WithFindings without blocking EvidenceBundle [ReadyForTransduction]", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: canonicalScene,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  observeParallelProductionOutputs(
    {
      case_id: caseId,
      architectureConsistencyAssessment: {
        assessment_id: "ACA_WITH_FINDINGS",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "FINDING_001" }],
      },
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({ case_id: caseId, ledger, timerLedger });
  const evidenceSnapshot = report.object_states_reached.find(
    (item) => item.object_type === "EvidenceBundle",
  );
  const assessmentSnapshot = report.object_states_reached.find(
    (item) => item.object_type === "ArchitectureConsistencyAssessment",
  );

  assert.equal(evidenceSnapshot.current_state, "ReadyForTransduction");
  assert.equal(assessmentSnapshot.current_state, "WithFindings");
  assert.equal(report.operation_mode, "shadow_mode");
});

test("ArchitectureConsistencyAssessment [WithFindings] blocks technical export, not diagnostic readiness", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  const observed = observeParallelProductionOutputs(
    {
      case_id: caseId,
      architectureConsistencyAssessment: {
        assessment_id: "ACA_WITH_FINDINGS",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "FINDING_001" }],
      },
      candidate_export_package: {
        candidate_export_package_id: "CAND_EXPORT_001",
      },
      syntax_validation_passed: true,
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    hard_gate_candidates: observed.hard_gate_candidates,
  });

  assert.equal(report.hard_gate_candidates.length, 1);
  assert.equal(
    report.hard_gate_candidates[0].gate_id,
    "MBA-GATE-EXPORT-SATISFIED-SYNTAX",
  );
  assert.equal(
    report.object_states_reached.some((item) => item.object_type === "DiagnosticoExpertoFinal"),
    false,
  );
});

test("ExportCodePackage cannot be Generated without ArchitectureConsistencyAssessment [Satisfied]", () => {
  const ledger = createMbaEventLedger();

  ledger.recordEvent({
    event_type: "ExportCodePackageGenerated",
    emitted_by: "P-SUP-09",
    received_by: "RepositorioTecnico",
    object_type: "ExportCodePackage",
    object_id: "EXPORT_BAD_001",
    previous_state: "SyntaxValidating",
    target_state: "Generated",
    operation: "empaquetar",
    responsible_process: "P-SUP-09",
    technical_actor: "test",
    case_id: caseId,
    payload: {
      syntax_validation_status: "passed",
    },
  });

  assert.ok(ledger.listFindings().some((finding) => finding.rule_id === "NC-02"));
});

test("Inventory, registry or IR QA finding returns to P-SUP-06, not P-CORE-01", () => {
  const validRoute = evaluateTransition({
    event_type: "FindingsClasificados",
    emitted_by: "P-SUP-07/08",
    received_by: "P-SUP-06",
    object_type: "ArchitectureConsistencyAssessment",
    object_id: "ACA_001",
    previous_state: "CompositeEvaluating",
    target_state: "WithFindings",
    operation: "clasificarFindings",
    responsible_process: "P-SUP-07/08",
    payload: {
      finding_scope: "parallel_production_design",
    },
  });

  const invalidRoute = evaluateTransition({
    event_type: "GapInconsistenciaDetectada",
    emitted_by: "P-SUP-07/08",
    received_by: "P-CORE-01",
    object_type: "ArchitectureConsistencyAssessment",
    object_id: "ACA_002",
    previous_state: "CompositeEvaluating",
    target_state: "WithFindings",
    operation: "clasificarFindings",
    responsible_process: "P-CORE-01",
    payload: {
      finding_scope: "parallel_production_design",
    },
  });

  assert.equal(validRoute.nonconformance.some((finding) => finding.rule_id === "NC-03"), false);
  assert.equal(invalidRoute.nonconformance.some((finding) => finding.rule_id === "NC-03"), true);
});

test("session_ready_for_transduction is not accepted as canonical target state", () => {
  const result = evaluateTransition({
    event_type: "EvidenceBundleReadyReceived",
    emitted_by: "Capa 1.0",
    received_by: "P-SUP-02",
    object_type: "EvidenceBundle",
    object_id: "EB_BAD_TARGET",
    previous_state: "ReadinessAssessmentPending",
    target_state: "session_ready_for_transduction",
    operation: "marcarReady",
    responsible_process: "P-SUP-02",
  });

  assert.ok(result.nonconformance.some((finding) => finding.rule_id === "NC-04"));
});

test("Timer Ledger records timer policy and raises NC-05 when a process state has no timer", () => {
  const timerLedger = createMbaTimerLedger();

  const valid = timerLedger.startTimer({
    process_state: "ReadinessAssessmentPending",
    responsible_process: "P-SUP-02",
    case_id: caseId,
    object_type: "EvidenceBundle",
    object_id: "EB_TIMER_OK",
  });
  const invalid = timerLedger.startTimer({
    process_state: "UnexpectedState",
    responsible_process: "P-SUP-02",
    case_id: caseId,
    object_type: "EvidenceBundle",
    object_id: "EB_TIMER_BAD",
  });

  assert.equal(valid.timer.timer_name, "max_tiempo_readiness_transduccion");
  assert.equal(invalid.finding.rule_id, "NC-05");
});

test("enforcement_mode stays inactive unless triple confirmation is present", () => {
  const downgraded = resolveMbaOperationMode({
    MBA_CONTROL_PLANE_MODE: "enforcement",
    MBA_ALLOW_ENFORCEMENT: "true",
  });
  const armed = resolveMbaOperationMode({
    MBA_CONTROL_PLANE_MODE: "enforcement",
    MBA_ALLOW_ENFORCEMENT: "true",
    MBA_ENFORCEMENT_CONFIRMATION: "ENABLE_MBA_OLC_BLOCKING",
  });

  assert.equal(downgraded.mode, "soft_governance_mode");
  assert.equal(downgraded.downgrade_reason, "enforcement_not_armed");
  assert.equal(armed.mode, "enforcement_mode");
  assert.equal(armed.enforcement_armed, true);
});

test("Increment 1.1 persists critical shadow boundary: WithFindings returns to P-SUP-06 and does not block EvidenceBundle", async () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: canonicalScene,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  const parallel = observeParallelProductionOutputs(
    {
      case_id: caseId,
      architectureConsistencyAssessment: {
        assessment_id: "ACA_WITH_FINDINGS_11",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "QA_IR_001", affected_artifact_type: "mmabp_ir_package" }],
      },
      candidate_export_package: {
        candidate_export_package_id: "CAND_EXPORT_11",
      },
      syntax_validation_passed: true,
    },
    { ledger, timerLedger },
  );
  ledger.recordEvent({
    event_type: "ExportCodePackageGenerated",
    emitted_by: "P-SUP-09",
    received_by: "RepositorioTecnico",
    object_type: "ExportCodePackage",
    object_id: "EXPORT_SHOULD_NOT_PASS",
    previous_state: "SyntaxValidating",
    target_state: "Generated",
    operation: "empaquetar",
    responsible_process: "P-SUP-09",
    technical_actor: "test",
    case_id: caseId,
    payload: { syntax_validation_status: "passed" },
    source_adapter: "parallel_production_observer",
  });

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    hard_gate_candidates: parallel.hard_gate_candidates,
    extra_findings: parallel.findings,
  });

  assert.equal(
    report.object_states_reached.find((item) => item.object_type === "EvidenceBundle").current_state,
    "ReadyForTransduction",
  );
  assert.ok(
    report.findings_should_return_to_p_sup_06.some((finding) =>
      /P-SUP-06|candidate_export_package|ArchitectureConsistencyAssessment/i.test(
        `${finding.action} ${finding.detail} ${finding.description}`,
      ),
    ),
  );
  assert.ok(report.findings.some((finding) => finding.rule_id === "NC-02"));
  assert.ok(report.hard_gate_candidates.length >= 1);
});

test("candidate_export_package is persisted as not promoted without satisfied assessment and syntax validation", async () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const parallel = observeParallelProductionOutputs(
    {
      case_id: caseId,
      candidate_export_package: {
        candidate_export_package_id: "CAND_NOT_PROMOTED_001",
      },
      syntax_validation_passed: false,
    },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    hard_gate_candidates: parallel.hard_gate_candidates,
    extra_findings: parallel.findings,
  });

  assert.equal(
    report.object_states_reached.some((item) => item.object_type === "ExportCodePackage"),
    false,
  );
  assert.equal(report.hard_gate_candidates[0].object_id, "CAND_NOT_PROMOTED_001");
  assert.ok(
    report.findings.some((finding) => finding.rule_id === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED"),
  );
});

test("session_ready_for_transduction true is persisted as signal, not target state, when EvidenceBundle is missing", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: canonicalScene,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });

  assert.equal(
    report.object_states_reached.some((item) => item.object_type === "EvidenceBundle"),
    false,
  );
  assert.equal(
    report.events_observed.some((event) => event.target_state === "session_ready_for_transduction"),
    false,
  );
  assert.ok(
    report.findings.some(
      (finding) => finding.rule_id === "MBA-WARN-SESSION-READY-WITHOUT-EVIDENCE-BUNDLE",
    ),
  );
});

test("Capa 1.0 diagnostic leakage registers NC-10 and preserves methodological boundary", () => {
  const result = evaluateTransition({
    event_type: "SceneCanonicalRecordConsolidatedReceived",
    emitted_by: "Capa 1.0",
    received_by: "P-SUP-01",
    object_type: "SceneCanonicalRecord",
    object_id: "SCR_LEAK",
    previous_state: "ConformanceChecked",
    target_state: "Consolidated",
    operation: "consolidar",
    responsible_process: "P-SUP-01",
    payload: {
      node_eve: "N04",
      root_cause: "causa final indebida",
      monetization: { amount: 100 },
      causal_movie: {},
      final_diagnostic: {},
    },
  });

  assert.ok(result.nonconformance.some((finding) => finding.rule_id === "NC-10"));
});

test("Supabase persistence stores events, timers, snapshots, findings, reports and legacy mappings", async () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: canonicalScene,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({ case_id: caseId, ledger, timerLedger });
  const writes = {};
  const fakeSupabase = {
    from(table) {
      writes[table] = writes[table] ?? [];
      return {
        insert(rows) {
          writes[table].push(...(Array.isArray(rows) ? rows : [rows]));
          return Promise.resolve({ error: null });
        },
        upsert(rows) {
          writes[table].push(...(Array.isArray(rows) ? rows : [rows]));
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const persistence = await persistMbaControlPlaneState({
    supabase: fakeSupabase,
    ledger,
    timerLedger,
    report,
  });

  assert.equal(persistence.persisted, true);
  assert.ok(writes.mba_event_ledger.length >= 2);
  assert.ok(writes.mba_timer_ledger.length >= 2);
  assert.ok(writes.mba_object_state_snapshots.length >= 2);
  assert.ok(writes.mba_domain_state_observations.length >= 2);
  assert.equal(writes.mba_compliance_reports[0].report_id, report.report_id);
  assert.ok(writes.mba_legacy_mappings.length > 0);
});

test("Flag V8 maps to MBA warning finding and remains non-blocking in shadow mode", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: {
        ...canonicalScene,
        flags: [
          {
            flagType: "V8_algedonic_risk_human_compensation",
            severity: "high",
            requiresClarification: true,
          },
        ],
      },
      flags: [
        {
          flagType: "V8_algedonic_risk_human_compensation",
          severity: "high",
          requiresClarification: true,
        },
      ],
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });

  const v8Finding = report.findings.find(
    (finding) => finding.rule_id === "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
  );
  assert.ok(v8Finding);
  assert.equal(v8Finding.severity, "warning_high");
  assert.equal(v8Finding.action, "observe_and_review");
  assert.ok(v8Finding.detail.includes("route_to=S3* / Canal Algedonico"));
  assert.equal(report.non_conformant_transitions.length, 0);
});

test("Flag R8 maps to MBA warning finding and remains non-blocking in shadow mode", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: {
        ...canonicalScene,
        flags: [
          {
            flagType: "R8_residual_coordination_variety",
            severity: "medium",
          },
        ],
      },
      flags: [
        {
          flagType: "R8_residual_coordination_variety",
          severity: "medium",
        },
      ],
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });

  const r8Finding = report.findings.find(
    (finding) => finding.rule_id === "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
  );
  assert.ok(r8Finding);
  assert.equal(r8Finding.severity, "warning_medium");
  assert.equal(r8Finding.action, "observe_and_review");
  assert.ok(r8Finding.detail.includes("route_to=S2/S3*"));
  assert.equal(report.non_conformant_transitions.length, 0);
});

test("V8 and R8 warnings do not block EvidenceBundle readiness and appear in compliance warnings", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: {
        ...canonicalScene,
        flags: [
          { flagType: "V8_algedonic_risk_human_compensation", severity: "high" },
          { flagType: "R8_residual_coordination_variety", severity: "medium" },
        ],
      },
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
      flags: [
        { flagType: "V8_algedonic_risk_human_compensation", severity: "high" },
        { flagType: "R8_residual_coordination_variety", severity: "medium" },
      ],
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });

  const evidenceSnapshot = report.object_states_reached.find(
    (item) => item.object_type === "EvidenceBundle",
  );
  assert.equal(evidenceSnapshot.current_state, "ReadyForTransduction");
  assert.ok(
    report.warnings.includes("MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION"),
  );
  assert.ok(
    report.warnings.includes("MBA-WARN-RESIDUAL-COORDINATION-VARIETY"),
  );
});

test("Parallel production remains lateral when V8/R8 warnings exist and does not modify readiness", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      scene_canonical_record: {
        ...canonicalScene,
        flags: [{ flagType: "V8_algedonic_risk_human_compensation", severity: "high" }],
      },
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
      flags: [{ flagType: "V8_algedonic_risk_human_compensation", severity: "high" }],
    },
    { ledger, timerLedger },
  );

  observeParallelProductionOutputs(
    {
      case_id: caseId,
      mmabp_design_source_bundle: {
        id: "MMABP_LATERAL_001",
      },
    },
    { ledger, timerLedger },
  );

  const parallelReadinessEvents = ledger
    .listEvents()
    .filter(
      (event) =>
        event.source_adapter === "parallel_production_observer" &&
        event.object_type === "EvidenceBundle",
    );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });

  assert.equal(parallelReadinessEvents.length, 0);
  assert.ok(
    report.findings.some(
      (finding) => finding.rule_id === "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
    ),
  );
});

test("1.7C dry-run normalizes V8/R8 findings to V03 without activating governance modes", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      session_id: "SESSION_V03_FLAGS",
      scene_canonical_record: {
        ...canonicalScene,
        flags: [
          { flagType: "V8_algedonic_risk_human_compensation", severity: "high" },
          { flagType: "R8_residual_coordination_variety", severity: "medium" },
        ],
      },
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
      flags: [
        { flagType: "V8_algedonic_risk_human_compensation", severity: "high" },
        { flagType: "R8_residual_coordination_variety", severity: "medium" },
      ],
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });
  const dryRun = report.soft_governance_v03_dry_run;
  const v8 = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
  );
  const r8 = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
  );

  assert.equal(report.operation_mode, "shadow_mode");
  assert.equal(dryRun.activation.soft_governance_mode_activated, false);
  assert.equal(dryRun.activation.enforcement_mode_activated, false);
  assert.equal(dryRun.invariants.operation_blocking_allowed, false);
  assert.equal(dryRun.invariants.readiness_mutation_allowed, false);
  assert.equal(dryRun.invariants.core_state_mutation_allowed, false);
  assert.equal(v8.finding_category, "AlgedonicSignal");
  assert.equal(v8.severity, "High");
  assert.equal(v8.routing_primary, "Canal Algedonico");
  assert.equal(v8.review_owner, "S3*");
  assert.equal(v8.review_task_candidate.conceptual_only, true);
  assert.equal(v8.review_task_candidate.creates_operational_task, false);
  assert.equal(r8.finding_category, "GovernanceRecommendation");
  assert.equal(r8.severity, "Medium");
  assert.equal(r8.routing_primary, "S2");
  assert.ok(v8.dedupe_key);
  assert.ok(v8.recurrence_key);
});

test("1.7C dry-run treats ArchitectureConsistencyAssessment WithFindings as not Satisfied and routes P-SUP-06", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  observeParallelProductionOutputs(
    {
      case_id: caseId,
      session_id: "SESSION_V03_ACA",
      architectureConsistencyAssessment: {
        assessment_id: "ACA_V03_WITH_FINDINGS",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "FINDING_V03_001" }],
      },
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({ case_id: caseId, ledger, timerLedger });
  const aca = report.soft_governance_v03_dry_run.normalized_findings.find(
    (finding) => finding.finding_code === "ArchitectureConsistencyAssessment [WithFindings]",
  );

  assert.ok(aca);
  assert.equal(aca.finding_category, "ArchitectureConsistencyFinding");
  assert.equal(aca.severity, "Medium");
  assert.equal(aca.routing_primary, "P-SUP-06");
  assert.equal(aca.export_promotion_allowed, false);
  assert.equal(
    report.object_states_reached.find((item) => item.object_type === "ArchitectureConsistencyAssessment").current_state,
    "WithFindings",
  );
  assert.equal(
    report.object_states_reached.some((item) => item.object_type === "ExportCodePackage"),
    false,
  );
});

test("1.7C dry-run keeps candidate_export_package as candidate-only with V03 keys", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const parallel = observeParallelProductionOutputs(
    {
      case_id: caseId,
      session_id: "SESSION_V03_CANDIDATE",
      architectureConsistencyAssessment: {
        assessment_id: "ACA_V03_WITH_FINDINGS_CANDIDATE",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "FINDING_V03_CANDIDATE" }],
      },
      candidate_export_package: {
        candidate_export_package_id: "CAND_V03_NOT_PROMOTED",
      },
      allow_export_promotion: false,
      syntax_validation_passed: false,
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    hard_gate_candidates: parallel.hard_gate_candidates,
    extra_findings: parallel.findings,
  });
  const candidate = report.soft_governance_v03_dry_run.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
  );

  assert.ok(candidate);
  assert.equal(candidate.finding_category, "Warning");
  assert.equal(candidate.severity, "Low");
  assert.equal(candidate.routing_primary, "P-SUP-06");
  assert.equal(candidate.hard_gate_candidate, false);
  assert.equal(candidate.export_promotion_allowed, false);
  assert.equal(candidate.operation_blocking_allowed, false);
  assert.ok(candidate.dedupe_key);
  assert.ok(candidate.recurrence_key);
  assert.equal(
    report.object_states_reached.some((item) => item.object_type === "ExportCodePackage"),
    false,
  );
});

test("1.7C dry-run maps NC-05 to Nonconformance High HardGateCandidate without repair or blocking", () => {
  const timerLedger = createMbaTimerLedger();
  const ledger = createMbaEventLedger();

  timerLedger.startTimer({
    process_state: "UnexpectedStateWithoutTimer",
    responsible_process: "P-SUP-02",
    case_id: caseId,
    session_id: "SESSION_V03_NC05",
    object_type: "EvidenceBundle",
    object_id: "EB_V03_NC05",
  });

  const report = buildMbaComplianceReport({ case_id: caseId, ledger, timerLedger });
  const nc05 = report.soft_governance_v03_dry_run.normalized_findings.find(
    (finding) => finding.finding_code === "NC-05",
  );

  assert.ok(nc05);
  assert.equal(nc05.finding_category, "Nonconformance");
  assert.equal(nc05.severity, "High");
  assert.equal(nc05.routing_primary, "S3*");
  assert.equal(nc05.hard_gate_candidate, true);
  assert.equal(nc05.operation_blocking_allowed, false);
  assert.equal(nc05.readiness_mutation_allowed, false);
  assert.equal(nc05.review_task_candidate.creates_operational_task, false);
  assert.equal(report.timer_ledger.length, 0);
  assert.ok(nc05.prohibited_actions.includes("auto_repair_timer"));
});

test("1.7C dry-run dedupes repeated open logical findings but keeps recurrence count", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const flags = [{ flagType: "R8_residual_coordination_variety", severity: "medium" }];
  const first = observeCapa1Outputs(
    {
      case_id: caseId,
      session_id: "SESSION_V03_DEDUPE",
      scene_canonical_record: { ...canonicalScene, flags },
      flags,
    },
    { ledger, timerLedger },
  );
  const second = observeCapa1Outputs(
    {
      case_id: caseId,
      session_id: "SESSION_V03_DEDUPE",
      scene_canonical_record: { ...canonicalScene, flags },
      flags,
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: [...first.findings, ...second.findings],
  });
  const r8Findings = report.soft_governance_v03_dry_run.normalized_findings.filter(
    (finding) => finding.finding_code === "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
  );

  assert.equal(r8Findings.length, 1);
  assert.equal(r8Findings[0].duplicate_count, 1);
  assert.equal(r8Findings[0].recurrence_count, 2);
  assert.equal(report.soft_governance_v03_dry_run.dedupe_summary.duplicate_open_findings_collapsed, 1);
  assert.equal(report.soft_governance_v03_dry_run.recurrence_summary.recurrence_can_block_operation, false);
});

test("1.7C dry-run is stored in report_json and transition findings remain summary-only", async () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      session_id: "SESSION_V03_STORAGE",
      scene_canonical_record: {
        ...canonicalScene,
        flags: [{ flagType: "V8_algedonic_risk_human_compensation", severity: "high" }],
      },
      flags: [{ flagType: "V8_algedonic_risk_human_compensation", severity: "high" }],
    },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });
  const writes = {};
  const fakeSupabase = {
    from(table) {
      writes[table] = writes[table] ?? [];
      return {
        insert(rows) {
          writes[table].push(...(Array.isArray(rows) ? rows : [rows]));
          return Promise.resolve({ error: null });
        },
        upsert(rows) {
          writes[table].push(...(Array.isArray(rows) ? rows : [rows]));
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  await persistMbaControlPlaneState({
    supabase: fakeSupabase,
    ledger,
    timerLedger,
    report,
    extraFindings: observed.findings,
  });

  assert.ok(writes.mba_compliance_reports[0].report_json.soft_governance_v03_dry_run);
  assert.ok(writes.mba_transition_findings.length >= 1);
  assert.equal(Object.hasOwn(writes.mba_transition_findings[0], "payload"), false);
  assert.equal(Object.hasOwn(writes.mba_transition_findings[0], "dedupe_key"), false);
  assert.equal(Object.hasOwn(writes.mba_transition_findings[0], "recurrence_key"), false);
});

test("1.7D dry-run dedupe keeps one logical finding for the same artifact and preserves recurrence", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_DEDUPE",
    case_id: caseId,
    session_id: "SESSION_17D_DEDUPE",
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_DEDUPE",
        detail: "first observation",
      },
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_DEDUPE",
        detail: "re-read of same artifact",
      },
    ],
  });
  const r8 = dryRun.normalized_findings.filter(
    (finding) => finding.finding_code === "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
  );

  assert.equal(r8.length, 1);
  assert.equal(r8[0].duplicate_count, 1);
  assert.equal(r8[0].logical_occurrence_count, 2);
  assert.equal(r8[0].recurrence_count, 2);
  assert.equal(dryRun.dedupe_summary.duplicate_open_findings_collapsed, 1);
  assert.equal(dryRun.invariants.operation_blocking_allowed, false);
});

test("1.7D dry-run does not hide distinct NC-05 Process States by dedupe", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_NC05_DEDUPE",
    case_id: caseId,
    session_id: "SESSION_17D_NC05_DEDUPE",
    findings: [
      {
        rule_id: "NC-05",
        object_type: "ProcessState",
        object_id: "P-SUP-02:UnexpectedStateWithoutTimer",
        detail: "UnexpectedStateWithoutTimer has no timer policy.",
      },
      {
        rule_id: "NC-05",
        object_type: "ProcessState",
        object_id: "P-SUP-06:ManualQaWaitingWithoutTimer",
        detail: "ManualQaWaitingWithoutTimer has no timer policy.",
      },
    ],
  });
  const nc05Findings = dryRun.normalized_findings.filter((finding) => finding.finding_code === "NC-05");

  assert.equal(nc05Findings.length, 2);
  assert.notEqual(nc05Findings[0].dedupe_key, nc05Findings[1].dedupe_key);
  assert.notEqual(nc05Findings[0].recurrence_key, nc05Findings[1].recurrence_key);
  assert.equal(dryRun.dedupe_summary.nc05_hidden_by_dedupe, false);
  assert.equal(nc05Findings.every((finding) => finding.hard_gate_candidate === true), true);
  assert.equal(nc05Findings.every((finding) => finding.operation_blocking_allowed === false), true);
});

test("1.7D dry-run keeps prohibited promotion attempts traceable and non-blocking", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_PROHIBITED_ATTEMPT",
    case_id: caseId,
    session_id: "SESSION_17D_PROHIBITED_ATTEMPT",
    hard_gate_candidates: [
      {
        object_type: "ExportCodePackage",
        object_id: "CAND_17D_ATTEMPT_A",
        reason: "attempted promotion while ArchitectureConsistencyAssessment was WithFindings",
        prohibited_action_attempt: true,
      },
      {
        object_type: "ExportCodePackage",
        object_id: "CAND_17D_ATTEMPT_B",
        reason: "attempted promotion while syntax_validation_passed was false",
        prohibited_action_attempt: true,
      },
    ],
  });
  const candidateFindings = dryRun.normalized_findings.filter(
    (finding) => finding.finding_code === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
  );

  assert.equal(candidateFindings.length, 2);
  assert.notEqual(candidateFindings[0].dedupe_key, candidateFindings[1].dedupe_key);
  assert.equal(dryRun.dedupe_summary.prohibited_action_attempt_hidden_by_dedupe, false);
  assert.equal(candidateFindings.every((finding) => finding.hard_gate_candidate === true), true);
  assert.equal(candidateFindings.every((finding) => finding.export_promotion_allowed === false), true);
  assert.equal(candidateFindings.every((finding) => finding.operation_blocking_allowed === false), true);
});

test("1.7E-fix keeps export gate evidence separate from V03 HardGateCandidate when no prohibited promotion attempt exists", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17E_FIX_EXPORT_GATE_EVIDENCE",
    case_id: "19fc9eff-4219-43f0-854c-e2b3350f23f2",
    session_id: "19fc9eff-4219-43f0-854c-e2b3350f23f2",
    hard_gate_candidates: [
      {
        gate_id: "MBA-GATE-EXPORT-SATISFIED-SYNTAX",
        object_type: "ExportCodePackage",
        object_id: "CEXP_AMBAR_NOT_PROMOTED",
        reason:
          "candidate_export_package observed but not promoted to ExportCodePackage [Generated] without ArchitectureConsistencyAssessment [Satisfied] and passed syntax validation.",
      },
    ],
  });
  const candidate = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
  );

  assert.ok(candidate);
  assert.equal(candidate.hard_gate_candidate, false);
  assert.equal(candidate.export_gate_candidate_evidence.gate_id, "MBA-GATE-EXPORT-SATISFIED-SYNTAX");
  assert.equal(candidate.export_gate_candidate_evidence.operation_blocking_allowed, false);
  assert.equal(candidate.export_gate_candidate_evidence.readiness_mutation_allowed, false);
  assert.equal(candidate.export_gate_candidate_evidence.core_state_mutation_allowed, false);
  assert.equal(candidate.export_gate_candidate_evidence.export_promotion_allowed, false);
  assert.equal(candidate.export_gate_candidate_evidence.enforcement_activation_allowed, false);
  assert.equal(dryRun.hard_gate_candidates.length, 0);
  assert.equal(dryRun.export_gate_candidate_evidence.length, 1);
  assert.equal(dryRun.export_gate_candidate_evidence[0].hard_gate_candidate, false);
});

test("1.7D dry-run recurrence keys separate scopes and report windows without blocking", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_RECURRENCE_SCOPE",
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        case_id: "CASE_17D_A",
        session_id: "SESSION_17D_A",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_A",
      },
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        case_id: "CASE_17D_B",
        session_id: "SESSION_17D_B",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_B",
      },
    ],
  });
  const r8Findings = dryRun.normalized_findings.filter(
    (finding) => finding.finding_code === "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
  );

  assert.equal(r8Findings.length, 2);
  assert.notEqual(r8Findings[0].recurrence_key, r8Findings[1].recurrence_key);
  assert.deepEqual(dryRun.recurrence_summary.recurrence_windows_reported_only, ["7d", "14d", "30d"]);
  assert.equal(dryRun.recurrence_summary.recurrence_can_block_operation, false);
});

test("1.7D dry-run false positive remains in history but does not compute for recurrence", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_FALSE_POSITIVE",
    case_id: caseId,
    session_id: "SESSION_17D_FALSE_POSITIVE",
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_FALSE_POSITIVE",
        false_positive: true,
        false_positive_non_computable: true,
      },
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_FALSE_POSITIVE",
      },
    ],
  });
  const r8 = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
  );
  const recurrenceEntry = dryRun.recurrence_summary.recurrence_keys.find(
    (item) => item.recurrence_key === r8.recurrence_key,
  );

  assert.ok(r8);
  assert.equal(r8.logical_occurrence_count, 2);
  assert.equal(r8.recurrence_count, 1);
  assert.equal(recurrenceEntry.count, 1);
  assert.equal(dryRun.recurrence_summary.false_positive_non_computable_count, 1);
  assert.equal(dryRun.dedupe_summary.false_positive_history_preserved, true);
});

test("1.7D dry-run reports soft readiness and rollback posture without activating modes", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const observed = observeCapa1Outputs(
    {
      case_id: caseId,
      session_id: "SESSION_17D_SOFT_READY",
      scene_canonical_record: {
        ...canonicalScene,
        flags: [{ flagType: "R8_residual_coordination_variety", severity: "medium" }],
      },
      flags: [{ flagType: "R8_residual_coordination_variety", severity: "medium" }],
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });
  const dryRun = report.soft_governance_v03_dry_run;

  assert.equal(report.operation_mode, "shadow_mode");
  assert.equal(dryRun.mode, "shadow_mode");
  assert.equal(dryRun.dry_run, true);
  assert.equal(dryRun.soft_ready_evaluation.soft_ready, true);
  assert.equal(dryRun.soft_ready_evaluation.activates_soft_governance_mode, false);
  assert.equal(dryRun.activation.soft_governance_mode_activated, false);
  assert.equal(dryRun.activation.enforcement_mode_activated, false);
  assert.equal(dryRun.invariants.soft_governance_activation_allowed, false);
});

test("1.7D dry-run keeps review task candidates conceptual for Medium and High findings", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_REVIEW_TASK",
    case_id: caseId,
    session_id: "SESSION_17D_REVIEW_TASK",
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_REVIEW_MEDIUM",
      },
      {
        rule_id: "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_REVIEW_HIGH",
      },
    ],
  });

  assert.equal(dryRun.review_task_candidates.length, 2);
  assert.equal(
    dryRun.review_task_candidates.every(
      (candidate) => candidate.conceptual_only === true && candidate.creates_operational_task === false,
    ),
    true,
  );
});

test("1.7D dry-run keeps CriticalCandidate and HardGateCandidate non-blocking", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_CRITICAL",
    case_id: caseId,
    session_id: "SESSION_17D_CRITICAL",
    findings: [
      {
        rule_id: "NC-05",
        object_type: "ProcessState",
        object_id: "P-SUP-07:CriticalTimerGap",
        severity: "CriticalCandidate",
      },
    ],
  });
  const critical = dryRun.normalized_findings.find((finding) => finding.finding_code === "NC-05");

  assert.equal(critical.severity, "CriticalCandidate");
  assert.equal(critical.hard_gate_candidate, true);
  assert.equal(critical.operation_blocking_allowed, false);
  assert.equal(critical.readiness_mutation_allowed, false);
  assert.equal(critical.export_promotion_allowed, false);
  assert.equal(dryRun.hard_gate_candidates[0].operation_blocking_allowed, false);
  assert.equal(dryRun.activation.enforcement_mode_activated, false);
});

test("1.7D dry-run routes algedonic signals without using Canal Algedonico as stable owner", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_17D_ALGEDONIC_OWNER",
    case_id: caseId,
    session_id: "SESSION_17D_ALGEDONIC_OWNER",
    findings: [
      {
        rule_id: "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_17D_ALGEDONIC",
      },
    ],
  });
  const algedonic = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
  );

  assert.equal(algedonic.routing_primary, "Canal Algedonico");
  assert.equal(algedonic.algedonic_flag, true);
  assert.notEqual(algedonic.review_owner, "Canal Algedonico");
  assert.equal(["S3*", "S5", "S3", "S4"].includes(algedonic.review_owner), true);
});

test("1.8B dry-run reports scoped activation candidate domains and keeps excluded domains out", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18B_SCOPE",
    case_id: caseId,
    session_id: "SESSION_18B_SCOPE",
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_SCOPE",
      },
    ],
  });

  assert.equal(dryRun.plan_title, "Scoped Soft Governance Activation Readiness Plan");
  assert.equal(dryRun.mode_effective, "shadow_mode");
  assert.equal(dryRun.active_candidate_has_operational_effect, false);
  assert.ok(dryRun.active_candidate_definition.includes("futura activacion acotada"));
  assert.deepEqual(dryRun.activation_candidate_scope.active_candidate_domains, [
    "P-SUP-06",
    "P-SUP-07/08",
    "P-SUP-09 frontera",
  ]);
  assert.equal(dryRun.activation_candidate_scope.active_candidate_has_operational_effect, false);
  assert.deepEqual(dryRun.activation_candidate_scope.read_only_reporting_domains, ["P-SUP-01", "P-SUP-02"]);
  assert.ok(dryRun.excluded_domains.includes("P-CORE-01"));
  assert.ok(dryRun.excluded_domains.includes("P-CLIENT-01"));
  assert.ok(dryRun.excluded_domains.includes("P-SUP-03"));
  assert.ok(dryRun.excluded_domains.includes("P-SUP-04"));
  assert.ok(dryRun.excluded_domains.includes("P-SUP-05"));
  assert.equal(dryRun.activation_candidate_scope.expands_to_global_mba, false);
  assert.equal(dryRun.activation_candidate_ready, false);
  assert.equal(dryRun.activation.soft_governance_mode_activated, false);
  assert.equal(dryRun.activation.enforcement_mode_activated, false);
});

test("1.8B V01.1 reports approval gate and minimum evidence checklist", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18B_V011_GATE",
    case_id: caseId,
    session_id: "SESSION_18B_V011_GATE",
    findings: [
      {
        rule_id: "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
        object_type: "ExportCodePackage",
        object_id: "CAND_18B_V011_GATE",
      },
    ],
  });

  assert.equal(dryRun.approval_gate_1_8A_to_1_8B.approval_of_1_8a_authorizes_1_8b_implementation, false);
  assert.equal(dryRun.approval_gate_1_8A_to_1_8B.separate_technical_prompt_required, true);
  assert.equal(dryRun.approval_gate_1_8A_to_1_8B.human_review_required, true);
  assert.equal(dryRun.approval_gate_1_8A_to_1_8B.no_go_rules_confirmation_required, true);
  assert.equal(dryRun.minimum_evidence_for_1_8B.baseline_shadow_clean, true);
  assert.equal(dryRun.minimum_evidence_for_1_8B.candidate_export_package_ready_with_warnings_observed, true);
  assert.equal(dryRun.minimum_evidence_for_1_8B.incremento_1_6_last_run_validated, "unknown");
  assert.equal(dryRun.minimum_evidence_status.satisfied, false);
  assert.ok(dryRun.activation_candidate_blockers.includes("minimum_evidence_for_1_8b_missing"));
  assert.equal(dryRun.activation_candidate_ready, false);
});

test("1.8B dry-run keeps P-SUP-01 and P-SUP-02 read-only reporting", () => {
  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger: createMbaEventLedger(),
    timerLedger: createMbaTimerLedger(),
    extra_findings: [
      {
        rule_id: "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_READ_ONLY",
      },
    ],
  });
  const readOnlyDomains = report.soft_governance_v03_dry_run.scoped_domains.filter(
    (domain) => domain.participation === "read_only_reporting",
  );

  assert.deepEqual(
    readOnlyDomains.map((domain) => domain.domain),
    ["P-SUP-01", "P-SUP-02"],
  );
  assert.equal(readOnlyDomains.every((domain) => domain.can_mutate_readiness === false), true);
  assert.equal(readOnlyDomains.every((domain) => domain.can_mutate_core_state === false), true);
  assert.equal(report.soft_governance_v03_dry_run.invariants.readiness_mutation_allowed, false);
  assert.equal(report.soft_governance_v03_dry_run.invariants.core_state_mutation_allowed, false);
});

test("1.8B dry-run reports aging routing and recurrence without creating workflow", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18B_REPORTING",
    case_id: caseId,
    session_id: "SESSION_18B_REPORTING",
    readiness_controls: {
      generated_at: "2026-05-27T12:00:00.000Z",
    },
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_REPORTING",
        detected_at: "2026-05-20T12:00:00.000Z",
      },
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_REPORTING",
        detected_at: "2026-05-21T12:00:00.000Z",
      },
    ],
  });

  assert.equal(dryRun.aging_summary.report_only, true);
  assert.equal(dryRun.aging_summary.entries[0].age_days, 7);
  assert.equal(dryRun.routing_summary.report_only, true);
  assert.equal(dryRun.routing_summary.by_routing_primary.S2, 1);
  assert.equal(dryRun.recurrence_summary.max_recurrence_count, 2);
  assert.equal(dryRun.review_task_candidates[0].conceptual_only, true);
  assert.equal(dryRun.review_task_candidates[0].creates_operational_task, false);
});

test("1.8B activation candidate remains false when rollback or false-positive window is missing", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18B_MISSING_READINESS",
    case_id: caseId,
    session_id: "SESSION_18B_MISSING_READINESS",
    readiness_controls: {
      rls_security_current: true,
    },
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_MISSING_READINESS",
      },
    ],
  });

  assert.equal(dryRun.rollback_status.report_only, true);
  assert.equal(dryRun.rollback_status.ready, false);
  assert.equal(dryRun.false_positive_summary.status, "insufficient_data");
  assert.equal(dryRun.activation_candidate_ready, false);
  assert.ok(dryRun.activation_candidate_blockers.includes("rollback_not_ready"));
  assert.ok(dryRun.activation_candidate_blockers.includes("false_positive_threshold_missing_or_failed"));
  assert.equal(dryRun.no_go_dashboard.report_only, true);
  assert.equal(dryRun.no_go_dashboard.blocks_operation, false);
});

test("1.8B activation candidate remains false when Medium+ false-positive rate is above 15 percent", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18B_FP_FAIL",
    case_id: caseId,
    session_id: "SESSION_18B_FP_FAIL",
    readiness_controls: {
      rls_security_current: true,
      rollback_status: {
        ready: true,
        tested_end_to_end: true,
      },
      false_positive_summary: {
        status: "measured",
        window_days: 30,
        medium_plus_total: 20,
        medium_plus_false_positive_count: 4,
      },
    },
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_FP_FAIL",
      },
    ],
  });

  assert.equal(dryRun.false_positive_medium_plus_rate_30d, 0.2);
  assert.equal(dryRun.false_positive_threshold.threshold_passed, false);
  assert.equal(dryRun.activation_candidate_ready, false);
  assert.ok(dryRun.activation_candidate_blockers.includes("false_positive_threshold_missing_or_failed"));
});

const compliantReadinessControls18C = ({ rollbackSimulationOverrides = {} } = {}) => ({
  rls_security_current: true,
  rollback_simulation: {
    simulated_activation_started: true,
    simulated_activation_scope: ["P-SUP-06", "P-SUP-07/08", "P-SUP-09 frontera"],
    simulated_rollback_requested: true,
    simulated_rollback_completed: true,
    effective_mode_before: "shadow_mode",
    effective_mode_after: "shadow_mode",
    activation_flags_before: {
      soft_governance_mode_activated: false,
      enforcement_mode_activated: false,
    },
    activation_flags_after: {
      soft_governance_mode_activated: false,
      enforcement_mode_activated: false,
    },
    readiness_mutation_detected: false,
    core_state_mutation_detected: false,
    export_promotion_detected: false,
    findings_history_preserved: true,
    reports_history_preserved: true,
    review_task_candidates_status_after_rollback: "deferred_conceptual_only",
    ...rollbackSimulationOverrides,
  },
  false_positive_summary: {
    status: "measured",
    window_days: 30,
    medium_plus_total: 20,
    medium_plus_false_positive_count: 2,
  },
  minimum_evidence_for_1_8B: {
    baseline_shadow_clean: true,
    incremento_1_6_last_run_validated: true,
    candidate_export_package_ready_with_warnings_observed: true,
    architecture_consistency_assessment_with_findings_to_p_sup_06: true,
    export_code_package_generated_not_emitted: true,
    rls_anon_write_probe_42501: true,
    repo_clean_before_changes: true,
  },
});

test("1.8B activation candidate can be true only in compliant simulated report without activating modes", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18B_READY_SIMULATION",
    case_id: caseId,
    session_id: "SESSION_18B_READY_SIMULATION",
    readiness_controls: compliantReadinessControls18C(),
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18B_READY_SIMULATION",
        detected_at: "2026-05-20T12:00:00.000Z",
      },
    ],
  });

  assert.equal(dryRun.activation_candidate_ready, true);
  assert.deepEqual(dryRun.activation_candidate_blockers, []);
  assert.equal(dryRun.false_positive_medium_plus_rate_30d, 0.1);
  assert.equal(dryRun.rollback_simulation.result, "pass");
  assert.equal(dryRun.rollback_status.executes_real_rollback, false);
  assert.equal(dryRun.activation.soft_governance_mode_activated, false);
  assert.equal(dryRun.activation.enforcement_mode_activated, false);
  assert.equal(dryRun.invariants.operation_blocking_allowed, false);
  assert.equal(dryRun.invariants.export_promotion_allowed, false);
});

test("1.8C rollback simulation reports simulated activation and completed rollback without activating modes", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18C_ROLLBACK_PASS",
    case_id: caseId,
    session_id: "SESSION_18C_ROLLBACK_PASS",
    readiness_controls: compliantReadinessControls18C(),
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18C_ROLLBACK_PASS",
      },
    ],
  });

  assert.equal(dryRun.rollback_simulation.report_only, true);
  assert.equal(dryRun.rollback_simulation.simulated_only, true);
  assert.equal(dryRun.rollback_simulation.simulated_activation_started, true);
  assert.deepEqual(dryRun.rollback_simulation.simulated_activation_scope, [
    "P-SUP-06",
    "P-SUP-07/08",
    "P-SUP-09 frontera",
  ]);
  assert.equal(dryRun.rollback_simulation.simulated_rollback_requested, true);
  assert.equal(dryRun.rollback_simulation.simulated_rollback_completed, true);
  assert.equal(dryRun.rollback_simulation.effective_mode_before, "shadow_mode");
  assert.equal(dryRun.rollback_simulation.effective_mode_after, "shadow_mode");
  assert.equal(dryRun.rollback_status.ready, true);
  assert.equal(dryRun.rollback_status.rollback_test_type, "report_only_simulation");
  assert.equal(dryRun.rollback_status.mode_effective, "shadow_mode");
  assert.equal(dryRun.activation.soft_governance_mode_activated, false);
  assert.equal(dryRun.activation.enforcement_mode_activated, false);
});

test("1.8C rollback simulation preserves history and defers review task candidates conceptually", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18C_HISTORY",
    case_id: caseId,
    session_id: "SESSION_18C_HISTORY",
    readiness_controls: compliantReadinessControls18C(),
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18C_HISTORY",
      },
      {
        rule_id: "MBA-WARN-ALGEDONIC-RISK-HUMAN-COMPENSATION",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18C_HISTORY_ALGEDONIC",
      },
    ],
  });

  assert.equal(dryRun.rollback_simulation.findings_history_preserved, true);
  assert.equal(dryRun.rollback_simulation.reports_history_preserved, true);
  assert.equal(
    dryRun.rollback_simulation.review_task_candidates_status_after_rollback,
    "deferred_conceptual_only",
  );
  assert.equal(dryRun.rollback_simulation.audit_trail_summary.findings_count_before, 2);
  assert.equal(dryRun.rollback_simulation.audit_trail_summary.findings_count_after, 2);
  assert.equal(dryRun.rollback_simulation.audit_trail_summary.operational_rollback_executed, false);
  assert.equal(
    dryRun.review_task_candidates.every((candidate) => candidate.creates_operational_task === false),
    true,
  );
});

test("1.8C rollback simulation reports S5 S3 S3* authority model without workflow", () => {
  const dryRun = normalizeGovernanceFindingsV03({
    report_id: "REPORT_18C_AUTHORITY",
    case_id: caseId,
    session_id: "SESSION_18C_AUTHORITY",
    readiness_controls: compliantReadinessControls18C(),
    findings: [
      {
        rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
        object_type: "SceneCanonicalRecord",
        object_id: "SCR_18C_AUTHORITY",
      },
    ],
  });

  assert.equal(dryRun.rollback_simulation.rollback_authority.framework_authority, "S5");
  assert.equal(dryRun.rollback_simulation.rollback_authority.execution_authority, "S3");
  assert.equal(dryRun.rollback_simulation.rollback_authority.audit_authority, "S3*");
  assert.equal(
    dryRun.rollback_simulation.rollback_authority.human_operator_approval,
    "placeholder/report-only",
  );
  assert.equal(dryRun.rollback_simulation.rollback_authority.creates_workflow, false);
});

test("1.8C rollback simulation fails readiness if readiness core or export mutation is detected", () => {
  const mutationScenarios = [
    ["readiness_mutation_detected", "readiness_mutation_detected"],
    ["core_state_mutation_detected", "core_state_mutation_detected"],
    ["export_promotion_detected", "export_promotion_detected"],
  ];

  for (const [field, blocker] of mutationScenarios) {
    const dryRun = normalizeGovernanceFindingsV03({
      report_id: `REPORT_18C_${field}`,
      case_id: caseId,
      session_id: `SESSION_18C_${field}`,
      readiness_controls: compliantReadinessControls18C({
        rollbackSimulationOverrides: {
          [field]: true,
        },
      }),
      findings: [
        {
          rule_id: "MBA-WARN-RESIDUAL-COORDINATION-VARIETY",
          object_type: "SceneCanonicalRecord",
          object_id: `SCR_18C_${field}`,
        },
      ],
    });

    assert.equal(dryRun.rollback_simulation.result, "fail");
    assert.ok(dryRun.rollback_simulation.blockers.includes(blocker));
    assert.equal(dryRun.rollback_status.ready, false);
    assert.equal(dryRun.activation_candidate_ready, false);
    assert.equal(dryRun.activation.soft_governance_mode_activated, false);
    assert.equal(dryRun.activation.enforcement_mode_activated, false);
  }
});

test("1.8B report-only controls preserve ACA WithFindings and candidate export boundaries", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const parallel = observeParallelProductionOutputs(
    {
      case_id: caseId,
      session_id: "SESSION_18B_EXPORT_BOUNDARY",
      architectureConsistencyAssessment: {
        assessment_id: "ACA_18B_WITH_FINDINGS",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "FINDING_18B_EXPORT_BOUNDARY" }],
      },
      candidate_export_package: {
        candidate_export_package_id: "CAND_18B_NOT_PROMOTED",
      },
      allow_export_promotion: false,
      syntax_validation_passed: false,
    },
    { ledger, timerLedger },
  );

  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    hard_gate_candidates: parallel.hard_gate_candidates,
    extra_findings: parallel.findings,
  });
  const dryRun = report.soft_governance_v03_dry_run;
  const aca = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "ArchitectureConsistencyAssessment [WithFindings]",
  );
  const candidate = dryRun.normalized_findings.find(
    (finding) => finding.finding_code === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
  );

  assert.ok(aca);
  assert.ok(candidate);
  assert.equal(aca.routing_primary, "P-SUP-06");
  assert.equal(candidate.routing_primary, "P-SUP-06");
  assert.equal(candidate.hard_gate_candidate, false);
  assert.equal(dryRun.export_gate_candidate_evidence.length, 1);
  assert.equal(
    report.object_states_reached.find((item) => item.object_type === "ArchitectureConsistencyAssessment").current_state,
    "WithFindings",
  );
  assert.equal(
    report.object_states_reached.some((item) => item.object_type === "ExportCodePackage"),
    false,
  );
  assert.equal(dryRun.activation_candidate_ready, false);
  assert.equal(dryRun.invariants.export_promotion_allowed, false);
});
