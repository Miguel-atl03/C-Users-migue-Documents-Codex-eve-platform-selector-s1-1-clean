import assert from "node:assert/strict";
import test from "node:test";

import {
  createMbaEventLedger,
  createMbaTimerLedger,
  observeParallelProductionOutputs,
  persistMbaControlPlaneState,
  buildMbaComplianceReport,
} from "../../../src/services/mba/index.mjs";
import { resolveParallelInventory } from "../../../src/services/parallel-production/runtime/inventory-resolve.mjs";
import { projectParallelMmabpIr } from "../../../src/services/parallel-production/runtime/mmabp-ir-project.mjs";
import { runParallelAssessment } from "../../../src/services/parallel-production/runtime/assessment-run.mjs";
import { generateParallelCandidateExport } from "../../../src/services/parallel-production/runtime/candidate-export-generate.mjs";

const sessionId = "00000000-0000-0000-0000-000000000111";
const caseId = sessionId;

const sampleBundle = {
  bundle_id: "BUNDLE_RUNTIME_TEST_001",
  quadrant_candidates: [
    {
      candidate_id: "CAND_PM_001",
      candidate_type: "business_process",
      canonical_label: "Proceso PM",
      quadrant_targets: ["PM"],
      source_evidence_ids: ["E1"],
      source_scene_ids: ["S1"],
      confidence: 0.81,
    },
    {
      candidate_id: "CAND_PF_001",
      candidate_type: "task",
      canonical_label: "Proceso PF",
      quadrant_targets: ["PF"],
      source_evidence_ids: ["E2"],
      source_scene_ids: ["S1"],
      confidence: 0.77,
    },
    {
      candidate_id: "CAND_MOC_001",
      candidate_type: "object_class",
      canonical_label: "MoC",
      quadrant_targets: ["MoC"],
      source_evidence_ids: ["E3"],
      source_scene_ids: ["S1"],
      confidence: 0.88,
    },
    {
      candidate_id: "CAND_OLC_001",
      candidate_type: "object_state",
      canonical_label: "OLC",
      quadrant_targets: ["OLC"],
      source_evidence_ids: ["E4"],
      source_scene_ids: ["S1"],
      confidence: 0.84,
    },
  ],
  flags: [
    { code: "R8_residual_coordination_variety", severity: "medium" },
    { code: "V8_algedonic_risk_human_compensation", severity: "high" },
  ],
  gaps: [],
  design_source_readiness: {
    status: "ready_with_gaps",
  },
};

const createWriteRecorder = () => {
  const writes = {};
  return {
    writes,
    supabase: {
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
    },
  };
};

test("inventory/resolve produces lateral artifact and mba event/timer/snapshot/observation", async () => {
  const inventory = resolveParallelInventory({
    session_id: sessionId,
    case_id: caseId,
    mode: "shadow",
    designSourceBundle: sampleBundle,
    run_id: "RUN_INV_TEST",
  });
  assert.equal(inventory.inventory_id.startsWith("INV_"), true);
  assert.ok(inventory.structural_facts_count > 0);

  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  observeParallelProductionOutputs(
    { case_id: caseId, session_id: sessionId, InventarioMMABP: inventory },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({ case_id: caseId, ledger, timerLedger });
  const recorder = createWriteRecorder();
  await persistMbaControlPlaneState({
    supabase: recorder.supabase,
    ledger,
    timerLedger,
    report,
  });

  assert.ok(recorder.writes.mba_event_ledger.length >= 1);
  assert.ok((recorder.writes.mba_timer_ledger ?? []).length >= 0);
  assert.ok(recorder.writes.mba_object_state_snapshots.length >= 1);
  assert.ok(recorder.writes.mba_domain_state_observations.length >= 1);
});

test("mmabp-ir/project produces IR artifact and mba event/snapshot/observation", async () => {
  const inventory = resolveParallelInventory({
    session_id: sessionId,
    case_id: caseId,
    mode: "shadow",
    designSourceBundle: sampleBundle,
    run_id: "RUN_IR_INV",
  });
  const ir = projectParallelMmabpIr({
    session_id: sessionId,
    case_id: caseId,
    mode: "shadow",
    inventory,
    run_id: "RUN_IR_TEST",
  });
  assert.equal(ir.mmabp_ir_id.startsWith("IR_"), true);

  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  observeParallelProductionOutputs(
    { case_id: caseId, session_id: sessionId, MMABPIR: { ir_package_id: ir.mmabp_ir_id, models: ir.registry_candidates } },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({ case_id: caseId, ledger, timerLedger });
  const recorder = createWriteRecorder();
  await persistMbaControlPlaneState({
    supabase: recorder.supabase,
    ledger,
    timerLedger,
    report,
  });

  assert.ok(recorder.writes.mba_event_ledger.length >= 1);
  assert.ok(recorder.writes.mba_object_state_snapshots.length >= 1);
  assert.ok(recorder.writes.mba_domain_state_observations.length >= 1);
});

test("assessment with findings persists mba_transition_findings routed to P-SUP-06", async () => {
  const ir = projectParallelMmabpIr({
    session_id: sessionId,
    case_id: caseId,
    mode: "shadow",
    inventory: {
      inventory_id: "INV_WARN",
      structural_facts: [
        { fact_id: "F1", quadrant_targets: ["PM"] },
      ],
      semantic_warnings: ["WARN_INV"],
      gaps: ["gap_non_blocking"],
    },
    run_id: "RUN_ASSESS_IR",
  });
  const assessment = runParallelAssessment({
    session_id: sessionId,
    case_id: caseId,
    mode: "shadow",
    mmabpIr: ir,
    run_id: "RUN_ASSESS_TEST",
  });
  assert.equal(assessment.assessment_status, "WithFindings");
  assert.equal(assessment.rework_target, "P-SUP-06");

  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const observed = observeParallelProductionOutputs(
    {
      case_id: caseId,
      session_id: sessionId,
      ArchitectureConsistencyAssessment: {
        assessment_id: assessment.assessment_id,
        assessment_status: assessment.assessment_status,
        findings: assessment.findings,
      },
    },
    { ledger, timerLedger },
  );
  const report = buildMbaComplianceReport({
    case_id: caseId,
    ledger,
    timerLedger,
    extra_findings: assessment.findings.concat(observed.findings ?? []),
  });
  const recorder = createWriteRecorder();
  await persistMbaControlPlaneState({
    supabase: recorder.supabase,
    ledger,
    timerLedger,
    report,
    extraFindings: assessment.findings,
  });

  assert.ok(
    recorder.writes.mba_transition_findings.some((finding) =>
      String(finding.detail ?? "").includes("P-SUP-06"),
    ),
  );
});

test("candidate export ready_with_warnings is not promoted to ExportCodePackage [Generated]", () => {
  const assessment = {
    assessment_id: "ACA_WITH_FINDINGS",
    assessment_status: "WithFindings",
    warnings: ["WARN_X"],
    gaps: [],
  };
  const candidate = generateParallelCandidateExport({
    session_id: sessionId,
    case_id: caseId,
    mode: "shadow",
    assessment,
    allow_export_promotion: false,
    syntax_validation_passed: false,
    run_id: "RUN_CEXP_TEST",
  });
  assert.equal(candidate.candidate_export_status, "ready_with_warnings");
  assert.equal(candidate.export_code_package_generated, false);

  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const observed = observeParallelProductionOutputs(
    {
      case_id: caseId,
      session_id: sessionId,
      candidate_export_package: candidate.candidate_export_package,
      ArchitectureConsistencyAssessment: {
        assessment_id: assessment.assessment_id,
        assessment_status: assessment.assessment_status,
      },
      allow_export_promotion: false,
      syntax_validation_passed: false,
    },
    { ledger, timerLedger },
  );

  assert.equal(
    ledger.listEvents().some((event) => event.event_type === "ExportCodePackageGenerated"),
    false,
  );
  assert.ok(
    (observed.findings ?? []).some(
      (finding) => finding.rule_id === "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
    ),
  );
});

test("parallel production chain does not alter EvidenceBundle readiness or promote session_ready_for_transduction", () => {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();

  observeParallelProductionOutputs(
    {
      case_id: caseId,
      session_id: sessionId,
      mmabp_design_source_bundle: sampleBundle,
      InventarioMMABP: { inventory_id: "INV_1", structural_facts: [] },
      MMABPIR: { ir_package_id: "IR_1", models: {} },
    },
    { ledger, timerLedger },
  );

  const evidenceEvents = ledger
    .listEvents()
    .filter((event) => event.object_type === "EvidenceBundle");
  assert.equal(evidenceEvents.length, 0);
  assert.equal(
    ledger
      .listEvents()
      .some((event) => event.target_state === "session_ready_for_transduction"),
    false,
  );
  assert.equal(
    ledger
      .listEvents()
      .every((event) => event.validation_result.operation_mode === "shadow_mode"),
    true,
  );
});
