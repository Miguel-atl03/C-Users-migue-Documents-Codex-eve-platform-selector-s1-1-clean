/**
 * 044-A.5 / 044-A.5B-R — Regulatory layer orchestration over existing organs.
 * B7 confidence is epistemic-only (EVE_Runtime_B7_Confidence_Governance_Rule_v1_0).
 * Business structural inconsistency is preserved, never used as confidence penalty.
 */
import {
  evaluateB0SemanticEntryGateLocally,
  evaluateB2TransformationExceptionGateLocally,
  evaluateB3ReceiverFeedbackGateLocally,
  evaluateB7C20NonDiagnosticBoundaryGateLocally,
  evaluateSEM001StateAsClassLocally,
  evaluateSEM002AttributeAsClassLocally,
  evaluateSEM003ProcessAsObjectLocally,
  evaluateSEM004FalseISAByTypeOfLocally,
  evaluateSEM005AliasOrDuplicateLocally,
  evaluateSEM006RolePhaseEndConfusionLocally,
  evaluateSEM007FusedMarsupialObjectLocally,
  evaluatePST001WaitWithoutAwaitedEventLocally,
  evaluatePST002MissingReleaseConditionLocally,
  evaluatePST003MissingTimerOrTimeoutRuleLocally,
  evaluatePST004MissingTimeoutStateLocally,
  evaluatePST005MissingResolverOwnerLocally,
  evaluatePST006MissingExitPathLocally,
} from "../critical-gates/runtime-40-20-critical-gates-service";
import { evaluateMMABPGateEngine } from "../mmabp-gate/runtime-40-20-mmabp-gate-engine-service";
import { getPendingSignalCausalRecord } from "../branching/runtime-40-20-branching-authority-crosswalk";
import {
  buildB7ConfidenceInputFromEvidence,
  evaluateB7Confidence,
} from "../b7-confidence/runtime-40-20-b7-confidence-service";
import type {
  B7ConfidenceInput,
  B7ConfidenceResult,
} from "../b7-confidence/runtime-40-20-b7-confidence-types";

export type GateOutcome =
  | "passed"
  | "failed"
  | "pending_governed_signal"
  | "pending_resolution"
  | "not_applicable"
  | "blocked";

export interface RegulatoryEvidenceBag {
  /** Canonical variable name → value (from persisted records / ingest). */
  canonical_variables: Record<string, unknown>;
  answered_interaction_ids: string[];
  opened_causal_ids: string[];
  answered_interaction_defs: Array<{
    runtime_interaction_id: string;
    raw_row_json?: Record<string, unknown> | null;
    pm_output?: string | null;
    moc_output?: string | null;
    pf_output?: string | null;
    olc_output?: string | null;
    mmabp_ir_target?: string | null;
    readiness_effect?: string | null;
    registry_target?: string | null;
  }>;
  /** Explicit SEM detection flags — never inferred from free text. */
  sem_signals?: Partial<{
    state_as_class_detected: boolean;
    attribute_as_class_detected: boolean;
    process_as_object_detected: boolean;
    false_isa_by_type_of_detected: boolean;
    alias_or_duplicate_detected: boolean;
    role_phase_end_confusion_detected: boolean;
    fused_marsupial_object_detected: boolean;
    observed_term: string;
  }>;
  /** Strong wait evidence for PST — structured only. */
  process_state_wait?: Partial<{
    strong_wait: boolean;
    awaited_event: string | null;
    release_condition: string | null;
    timer_or_timeout_rule: string | null;
    timeout_state: string | null;
    resolver_owner: string | null;
    exit_path: string | null;
  }>;
  /** B7 contamination attempts (diagnosis/IR/export elevation). */
  b7_contamination?: Partial<{
    diagnosis_attempted: boolean;
    ir_direct_attempted: boolean;
    registry_direct_attempted: boolean;
    export_direct_attempted: boolean;
    moc_direct_attempted: boolean;
    vsm_ahe_final_attempted: boolean;
  }>;
  /**
   * 044-A.5B-R — epistemic confidence input (optional overrides).
   * Pathology / business inconsistency must not score.
   */
  b7_confidence_input?: Partial<B7ConfidenceInput>;
  case_id: string;
  caller_forced_ready?: boolean;
}

export interface RegulatoryGateResult {
  gate: string;
  outcome: GateOutcome;
  reason: string | null;
  evidence_basis: Record<string, unknown>;
  organ: string;
}

export interface RegulatoryLayerResult {
  instruction: string;
  classification_hint: string;
  critical_routes: RegulatoryGateResult[];
  mmabp: RegulatoryGateResult[];
  sem: RegulatoryGateResult[];
  pst: RegulatoryGateResult[];
  c20_confidence: {
    status: "available" | "pending_governed_signal";
    confidence_level: unknown;
    confidence_score: unknown;
    producer: "absent_in_runtime_40_20" | "connected";
    note: string;
    rector?: string;
  };
  b7_confidence_result: B7ConfidenceResult | null;
  diagnostic_non_contamination_boundary: "enforced";
  EVE_pathology_inputs_to_confidence: 0;
  business_inconsistency_preservation: true;
  epistemic_vs_structural_contradiction_separated: true;
  budget: {
    base_cap: 40;
    causal_cap: 20;
    note: string;
  };
  readiness_inputs: {
    critical_route_results: Array<{ gate_code: string; passed: boolean }>;
    missing_critical_evidence: boolean;
    b3_incomplete: boolean;
    b7_boundary_blocked: boolean;
    manual_review_required: boolean;
    reentry_required: boolean;
    pending_governed_signal: boolean;
    open_unanswered_causals: string[];
    caller_forced_ready_rejected: boolean;
    business_structural_inconsistency_observed: boolean;
    epistemic_fact_undetermined: boolean;
  };
  blocking_reasons: string[];
  materiality: Record<string, string>;
}

function cv(bag: RegulatoryEvidenceBag, name: string): unknown {
  return bag.canonical_variables[name];
}

function hasText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isAffirmativeExceptionType(v: unknown): boolean {
  if (typeof v !== "string") return false;
  return (
    v === "Sí, a veces falla pero es raro" ||
    v === "Sí, falla regularmente" ||
    v === "Sí, falla frecuentemente"
  );
}

export function evaluateRegulatoryLayer044A5(
  bag: RegulatoryEvidenceBag,
): RegulatoryLayerResult {
  const blocking: string[] = [];
  // source_trace set below with instruction tag

  // --- Critical routes first; B7 confidence after route materiality is known ---
  const override = bag.b7_confidence_input ?? {};
  const source_trace = {
    source_document:
      "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "regulatory_layer_044A5BR",
    source_row_number: 1,
    instruction: "044-A.5B-R",
    organ: "regulatory_layer",
  };

  // Source-capture B0 variables (044-A.3M) — map into CR-B0 semantic entry fields.
  const activityConfirmed = String(
    cv(bag, "activity_name_user_confirmed") ??
      cv(bag, "activity_summary_literal") ??
      cv(bag, "reconstructed_activity_minimum") ??
      "",
  );
  const activityEnd = String(
    cv(bag, "activity_end_result_hint") ??
      cv(bag, "scene_boundary_end_hint") ??
      "",
  );
  const activityStart = String(
    cv(bag, "activity_start_condition_hint") ??
      cv(bag, "scene_boundary_start_hint") ??
      "",
  );
  const b0 = evaluateB0SemanticEntryGateLocally(bag.case_id, {
    action_verb: String(cv(bag, "action_verb") ?? activityConfirmed),
    input_or_object: String(
      cv(bag, "input_or_object") ?? (activityConfirmed || activityStart),
    ),
    output_or_result: String(
      cv(bag, "output_or_result") ?? (activityEnd || activityConfirmed),
    ),
    procedure_or_standard: String(cv(bag, "procedure_or_standard") ?? ""),
    procedure_or_standard_required: false,
    preload_confirmed: bag.answered_interaction_ids.includes("B0-Q01")
      ? true
      : bag.answered_interaction_ids.length === 0
        ? undefined
        : true,
    semantic_confirmation_status: bag.answered_interaction_ids.includes("B0-Q01")
      ? "confirmed"
      : "weak_context",
    source_trace,
  });
  const b0Outcome: GateOutcome =
    b0.blocking_reasons.length === 0
      ? "passed"
      : bag.answered_interaction_ids.includes("B0-Q01")
        ? "failed"
        : "pending_governed_signal";
  if (b0Outcome === "failed") blocking.push("cr_b0_failed");

  const exceptionType = cv(bag, "transformation_exception_type");
  const exceptionExists =
    cv(bag, "transformation_exception_exists") === true ||
    isAffirmativeExceptionType(exceptionType);
  const b2 = evaluateB2TransformationExceptionGateLocally(bag.case_id, {
    transformation_exception_exists: exceptionExists,
    transformation_exception_type:
      typeof exceptionType === "string" ? exceptionType : undefined,
    transformation_exception_description: String(
      cv(bag, "transformation_exception_description") ?? "",
    ),
    transformation_exception_route_unresolved:
      exceptionExists &&
      !hasText(cv(bag, "transformation_exception_description")),
    canonical_route_closed:
      !exceptionExists ||
      (exceptionExists && hasText(cv(bag, "transformation_exception_description"))),
    source_trace,
  });
  const b2Outcome: GateOutcome =
    b2.blocking_reasons.length === 0
      ? "passed"
      : exceptionExists
        ? "failed"
        : "not_applicable";
  if (b2Outcome === "failed") blocking.push("cr_b2_failed");

  const deliveryFail = isAffirmativeExceptionType(cv(bag, "delivery_exception_exists"))
    ? true
    : typeof cv(bag, "delivery_exception_exists") === "string" &&
      String(cv(bag, "delivery_exception_exists")).startsWith("Sí");
  const satisfactionAsFeedback =
    bag.sem_signals?.observed_term === "receiver_satisfaction_as_feedback";
  const b3 = evaluateB3ReceiverFeedbackGateLocally(bag.case_id, {
    receiver_feedback_exists: cv(bag, "receiver_feedback_exists") === true,
    receiver_feedback:
      typeof cv(bag, "receiver_feedback") === "string"
        ? String(cv(bag, "receiver_feedback"))
        : undefined,
    receiver_feedback_gap_flag:
      deliveryFail && cv(bag, "receiver_feedback_exists") !== true,
    receiver_feedback_route_missing:
      deliveryFail && cv(bag, "receiver_feedback_exists") !== true,
    canonical_route_closed:
      !deliveryFail || cv(bag, "receiver_feedback_exists") === true,
    receiver_satisfaction_as_feedback_attempted: satisfactionAsFeedback === true,
    source_trace,
  });
  const b3Outcome: GateOutcome =
    b3.blocking_reasons.length === 0
      ? "passed"
      : deliveryFail || satisfactionAsFeedback
        ? "failed"
        : "not_applicable";
  if (b3Outcome === "failed") blocking.push("cr_b3_failed");

  // --- C20 / B7 epistemic confidence (044-A.5B-R) ---
  // Producer connected. confidence_level authoritative; score nullable.
  // Business structural inconsistency NEVER auto-lowers confidence.
  const derivedRouteStatus =
    override.canonical_route_status ??
    (b2Outcome === "failed" ||
    cv(bag, "canonical_route_status") === "missing_critical"
      ? "missing_critical"
      : "closed");
  const b7Input = buildB7ConfidenceInputFromEvidence({
    evidence_completeness_status:
      override.evidence_completeness_status ??
      (bag.answered_interaction_ids.length > 0 ? "complete" : "missing"),
    provenance_status: override.provenance_status ?? "closed",
    canonical_route_status: derivedRouteStatus,
    epistemic_ambiguity_status: override.epistemic_ambiguity_status ?? "none",
    epistemic_contradiction_status:
      override.epistemic_contradiction_status ?? "none",
    microconfirmation_state: override.microconfirmation_state ?? "not_required",
    required_signal_status: override.required_signal_status ?? "present",
    capture_gap_refs: override.capture_gap_refs,
    business_structural_inconsistency_observed:
      override.business_structural_inconsistency_observed === true,
    business_structural_inconsistency_refs:
      override.business_structural_inconsistency_refs,
    diagnostic_candidate_refs: override.diagnostic_candidate_refs,
    injected_pathology_names: override.injected_pathology_names,
    forbidden_feature_bag: override.forbidden_feature_bag,
  });
  const b7Confidence = evaluateB7Confidence(b7Input);
  bag.canonical_variables.confidence_level = b7Confidence.confidence_level;
  bag.canonical_variables.confidence_score = b7Confidence.confidence_score;
  bag.canonical_variables.confidence_reasoning =
    b7Confidence.confidence_reasoning;

  const confidenceLevel = b7Confidence.confidence_level;
  const confidenceScore = b7Confidence.confidence_score;
  const c20PendingRecord = getPendingSignalCausalRecord("C20");
  void c20PendingRecord;
  const c20Status = "available" as const;

  const cont = bag.b7_contamination ?? {};
  const b7 = evaluateB7C20NonDiagnosticBoundaryGateLocally(bag.case_id, {
    diagnosis_attempted: cont.diagnosis_attempted === true,
    ir_direct_attempted: cont.ir_direct_attempted === true,
    registry_direct_attempted: cont.registry_direct_attempted === true,
    export_direct_attempted: cont.export_direct_attempted === true,
    moc_direct_attempted: cont.moc_direct_attempted === true,
    vsm_ahe_final_attempted: cont.vsm_ahe_final_attempted === true,
    confidence_supported: c20Status === "available",
    source_trace,
  });
  const b7Contamination =
    cont.diagnosis_attempted === true ||
    cont.ir_direct_attempted === true ||
    cont.registry_direct_attempted === true ||
    cont.export_direct_attempted === true ||
    cont.moc_direct_attempted === true ||
    cont.vsm_ahe_final_attempted === true;
  const b7Outcome: GateOutcome = b7Contamination
    ? "blocked"
    : c20Status === "available"
      ? b7.blocking_reasons.length === 0
        ? "passed"
        : "failed"
      : "pending_governed_signal";
  if (b7Outcome === "blocked" || b7Outcome === "failed") {
    blocking.push("cr_b7_blocked");
  }

  const critical_routes: RegulatoryGateResult[] = [
    {
      gate: "CR-B0",
      outcome: b0Outcome,
      reason: b0.blocking_reasons[0] ?? null,
      evidence_basis: { organ: "evaluateB0SemanticEntryGateLocally", b0 },
      organ: "critical-gates",
    },
    {
      gate: "CR-B2",
      outcome: b2Outcome,
      reason: b2.blocking_reasons[0] ?? null,
      evidence_basis: { organ: "evaluateB2TransformationExceptionGateLocally", b2 },
      organ: "critical-gates",
    },
    {
      gate: "CR-B3",
      outcome: b3Outcome,
      reason: b3.blocking_reasons[0] ?? null,
      evidence_basis: {
        organ: "evaluateB3ReceiverFeedbackGateLocally",
        satisfaction_separated: true,
        feedback_separated: true,
        b3,
      },
      organ: "critical-gates",
    },
    {
      gate: "CR-B7",
      outcome: b7Outcome,
      reason: b7.blocking_reasons[0] ?? c20PendingRecord?.reason ?? null,
      evidence_basis: {
        organ: "evaluateB7C20NonDiagnosticBoundaryGateLocally",
        non_diagnostic: true,
        b7,
      },
      organ: "critical-gates",
    },
  ];

  // --- MMABP hard rules (canonical variables only; no free-text analysis) ---
  const mmabpEngine = evaluateMMABPGateEngine({
    case_id: bag.case_id,
    answered_interactions: bag.answered_interaction_defs,
  });

  function anyCv(...names: string[]): boolean {
    return names.some((n) => {
      const v = cv(bag, n);
      return v !== null && v !== undefined && String(v).trim().length > 0;
    });
  }

  function mmabpHard(
    gate: string,
    present: boolean,
    requiredNames: string[],
    quadrant: string,
  ): RegulatoryGateResult {
    if (bag.answered_interaction_ids.length === 0) {
      return {
        gate,
        outcome: "not_applicable",
        reason: null,
        evidence_basis: { quadrant, requiredNames },
        organ: "mmabp-gate",
      };
    }
    if (present) {
      return {
        gate,
        outcome: "passed",
        reason: null,
        evidence_basis: { quadrant, requiredNames, present: true },
        organ: "mmabp-gate",
      };
    }
    // Missing key canonicals → pending until captured (not invented pass).
    return {
      gate,
      outcome: "pending_governed_signal",
      reason: `missing_canonical_for_${gate}`,
      evidence_basis: {
        quadrant,
        requiredNames,
        present: false,
        reentry_target: requiredNames[0] ?? null,
      },
      organ: "mmabp-gate",
    };
  }

  const mmabp: RegulatoryGateResult[] = [
    mmabpHard(
      "MMABP-PM",
      anyCv(
        "scene_functional_client",
        "beneficiario_final_0_5_1",
      ) &&
        anyCv("afectado_final_0_5_1a") &&
        anyCv("scene_macro_process") &&
        anyCv("scene_enabled_milestone"),
      [
        "scene_functional_client|beneficiario_final_0_5_1",
        "afectado_final_0_5_1a",
        "scene_macro_process",
        "scene_enabled_milestone",
      ],
      "PM",
    ),
    mmabpHard(
      "MMABP-B1",
      anyCv("trigger_source", "trigger_type") && anyCv("trigger_preconditions"),
      ["trigger_source|trigger_type", "trigger_preconditions"],
      "B1",
    ),
    mmabpHard(
      "MMABP-B2",
      anyCv("objeto_tipo") &&
        anyCv("sujeto_tipo") &&
        anyCv("accion_tipo") &&
        anyCv("transformation_state_initial") &&
        anyCv("transformation_state_final"),
      [
        "objeto_tipo",
        "sujeto_tipo",
        "accion_tipo",
        "transformation_state_initial",
        "transformation_state_final",
      ],
      "B2",
    ),
    mmabpHard(
      "MMABP-B3",
      anyCv("output_object") &&
        anyCv("primary_receiver", "receiver_type") &&
        anyCv("delivery_mechanism", "quality_criteria"),
      [
        "output_object",
        "primary_receiver|receiver_type",
        "delivery_mechanism|quality_criteria",
      ],
      "B3",
    ),
    mmabpHard(
      "MMABP-B4",
      anyCv("time_event", "wait_time", "deadlock_risk") &&
        anyCv("deadlock_resolution", "dependency_next", "iteration_pattern"),
      [
        "time_event|wait_time|deadlock_risk",
        "deadlock_resolution|dependency_next|iteration_pattern",
      ],
      "B4",
    ),
    mmabpHard(
      "MMABP-B5",
      anyCv(
        "dimension_dominante_ABC",
        "dimension_dominante_AB",
        "dimension_dominante_AC",
        "dimension_dominante_BC",
        "dimension_dominante_clarificada",
      ) && anyCv("capacidad_nominal_5_1", "capacidad_real_5_2", "brecha_capacidad_5_3"),
      [
        "dimension_dominante_*",
        "capacidad_nominal_5_1|capacidad_real_5_2|brecha_capacidad_5_3",
      ],
      "B5",
    ),
    mmabpHard(
      "MMABP-B6",
      anyCv("workaround_used", "rework_present") &&
        anyCv(
          "workaround_types",
          "rework_object_or_content",
          "rework_expected_owner",
          "compensation_primary_mechanism",
        ),
      [
        "workaround_used|rework_present",
        "workaround_types|rework_object_or_content|rework_expected_owner|compensation_primary_mechanism",
      ],
      "B6",
    ),
    {
      gate: "MMABPGateEngine",
      outcome: mmabpEngine.ok
        ? "passed"
        : bag.answered_interaction_defs.length === 0
          ? "not_applicable"
          : "failed",
      reason: mmabpEngine.ok ? null : mmabpEngine.evidence_summary,
      evidence_basis: {
        organ: "evaluateMMABPGateEngine",
        missing: mmabpEngine.missing_signal_interaction_ids,
      },
      organ: "mmabp-gate",
    },
  ];
  for (const m of mmabp) {
    if (m.outcome === "failed") blocking.push(`${m.gate}_failed`);
  }

  // --- SEM-001..007: structured signals only; absent → pending_resolution ---
  const sem: RegulatoryGateResult[] = [];
  const semDefs: Array<{
    code: string;
    flag: keyof NonNullable<RegulatoryEvidenceBag["sem_signals"]>;
    run: (detected: boolean) => { blocks_projection: boolean; finding_code: string };
  }> = [
    {
      code: "SEM-001",
      flag: "state_as_class_detected",
      run: (detected) =>
        evaluateSEM001StateAsClassLocally(bag.case_id, {
          state_as_class_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "estado",
          source_trace,
        }),
    },
    {
      code: "SEM-002",
      flag: "attribute_as_class_detected",
      run: (detected) =>
        evaluateSEM002AttributeAsClassLocally(bag.case_id, {
          attribute_as_class_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "atributo",
          source_trace,
        }),
    },
    {
      code: "SEM-003",
      flag: "process_as_object_detected",
      run: (detected) =>
        evaluateSEM003ProcessAsObjectLocally(bag.case_id, {
          process_as_object_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "proceso",
          source_trace,
        }),
    },
    {
      code: "SEM-004",
      flag: "false_isa_by_type_of_detected",
      run: (detected) =>
        evaluateSEM004FalseISAByTypeOfLocally(bag.case_id, {
          false_isa_by_type_of_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "tipo_de",
          source_trace,
        }),
    },
    {
      code: "SEM-005",
      flag: "alias_or_duplicate_detected",
      run: (detected) =>
        evaluateSEM005AliasOrDuplicateLocally(bag.case_id, {
          alias_or_duplicate_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "alias",
          source_trace,
        }),
    },
    {
      code: "SEM-006",
      flag: "role_phase_end_confusion_detected",
      run: (detected) =>
        evaluateSEM006RolePhaseEndConfusionLocally(bag.case_id, {
          role_phase_end_confusion_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "role_phase",
          source_trace,
        }),
    },
    {
      code: "SEM-007",
      flag: "fused_marsupial_object_detected",
      run: (detected) =>
        evaluateSEM007FusedMarsupialObjectLocally(bag.case_id, {
          fused_object_detected: detected,
          marsupial_object_detected: detected,
          target_term: bag.sem_signals?.observed_term ?? "objeto_fusionado",
          source_trace,
        }),
    },
  ];

  for (const def of semDefs) {
    const flagVal = bag.sem_signals?.[def.flag];
    if (typeof flagVal !== "boolean") {
      sem.push({
        gate: def.code,
        outcome: "pending_resolution",
        reason: "no_structured_semantic_signal",
        evidence_basis: { note: "No NLP/keyword; await structured signal" },
        organ: "critical-gates",
      });
      continue;
    }
    const result = def.run(flagVal);
    sem.push({
      gate: def.code,
      outcome: result.blocks_projection ? "blocked" : "passed",
      reason: result.blocks_projection ? result.finding_code : null,
      evidence_basis: { result, flag: def.flag, value: flagVal },
      organ: "critical-gates",
    });
    if (result.blocks_projection) blocking.push(`${def.code}_blocked`);
  }

  // --- PST-001..006 ---
  const pst: RegulatoryGateResult[] = [];
  const wait = bag.process_state_wait;
  const strongWait =
    wait?.strong_wait === true ||
    cv(bag, "deadlock_risk") ===
      "Sí, a veces queda bloqueada y tengo que ir a preguntar" ||
    cv(bag, "deadlock_risk") ===
      "Sí, frecuentemente queda bloqueada y nadie se da cuenta" ||
    cv(bag, "deadlock_risk") ===
      "Sí, hay momentos donde el sistema se queda en un ciclo infinito";

  if (!strongWait) {
    for (const code of [
      "PST-001",
      "PST-002",
      "PST-003",
      "PST-004",
      "PST-005",
      "PST-006",
    ]) {
      pst.push({
        gate: code,
        outcome: "not_applicable",
        reason: null,
        evidence_basis: { strong_wait: false },
        organ: "critical-gates",
      });
    }
  } else {
    const pstSource = {
      awaited_event: wait?.awaited_event ?? undefined,
      release_condition: wait?.release_condition ?? undefined,
      timer_or_timeout_rule: wait?.timer_or_timeout_rule ?? undefined,
      timeout_state: wait?.timeout_state ?? undefined,
      resolver_owner: wait?.resolver_owner ?? undefined,
      exit_path: wait?.exit_path ?? undefined,
      process_state_candidate_ref: "strong_wait",
      source_trace,
    };
    const pstEvals = [
      { code: "PST-001", r: evaluatePST001WaitWithoutAwaitedEventLocally(bag.case_id, pstSource) },
      { code: "PST-002", r: evaluatePST002MissingReleaseConditionLocally(bag.case_id, pstSource) },
      { code: "PST-003", r: evaluatePST003MissingTimerOrTimeoutRuleLocally(bag.case_id, pstSource) },
      { code: "PST-004", r: evaluatePST004MissingTimeoutStateLocally(bag.case_id, pstSource) },
      { code: "PST-005", r: evaluatePST005MissingResolverOwnerLocally(bag.case_id, pstSource) },
      { code: "PST-006", r: evaluatePST006MissingExitPathLocally(bag.case_id, pstSource) },
    ];
    for (const item of pstEvals) {
      const failed =
        ("wait_without_awaited_event_detected" in item.r &&
          item.r.wait_without_awaited_event_detected) ||
        ("missing_release_condition_detected" in item.r &&
          item.r.missing_release_condition_detected) ||
        ("missing_timer_or_timeout_rule_detected" in item.r &&
          item.r.missing_timer_or_timeout_rule_detected) ||
        ("missing_timeout_state_detected" in item.r &&
          item.r.missing_timeout_state_detected) ||
        ("missing_resolver_owner_detected" in item.r &&
          item.r.missing_resolver_owner_detected) ||
        ("missing_exit_path_detected" in item.r && item.r.missing_exit_path_detected);
      const finding =
        "finding_code" in item.r && typeof item.r.finding_code === "string"
          ? item.r.finding_code
          : item.code;
      pst.push({
        gate: item.code,
        outcome: failed ? "failed" : "passed",
        reason: failed ? finding : null,
        evidence_basis: { result: item.r, strong_wait: true },
        organ: "critical-gates",
      });
      if (failed) blocking.push(`${item.code}_failed`);
    }
  }

  const openUnanswered = [...bag.opened_causal_ids].filter(
    (id) => !bag.answered_interaction_ids.includes(id),
  );
  if (openUnanswered.length > 0) {
    blocking.push("open_causals_unanswered");
  }

  const callerForced = bag.caller_forced_ready === true;
  if (callerForced) blocking.push("caller_forced_ready_rejected");

  const pendingSem = sem.some((s) => s.outcome === "pending_resolution");
  const pendingPst = pst.some((s) => s.outcome === "pending_governed_signal");
  const failedPst = pst.some((s) => s.outcome === "failed");
  const failedSem = sem.some((s) => s.outcome === "blocked");
  const businessInconsistencyObserved =
    b7Confidence.epistemic_flags.business_structural_inconsistency_observed;
  const epistemicFactUndetermined =
    b7Confidence.confidence_level === "low" ||
    b7Confidence.epistemic_flags.epistemic_contradiction_detected;

  const organsOk =
    !failedPst &&
    !failedSem &&
    b7Outcome !== "blocked" &&
    !mmabp.some((m) => m.outcome === "failed") &&
    !critical_routes.some((c) => c.outcome === "failed");

  const classification_hint =
    organsOk && c20Status === "available"
      ? "runtime_40_20_regulatory_layer_conformant_local_only"
      : "blocked_readiness_engine";

  return {
    instruction: "044-A.5B-R",
    classification_hint,
    critical_routes,
    mmabp,
    sem,
    pst,
    c20_confidence: {
      status: c20Status,
      confidence_level: confidenceLevel,
      confidence_score: confidenceScore,
      producer: "connected",
      rector: "EVE_Runtime_B7_Confidence_Governance_Rule_v1_0",
      note:
        "Epistemic confidence only. confidence_score nullable/non-authoritative. Business structural inconsistency preserved, not penalized. EVE pathology table diagnostic_only / forbidden in B7.",
    },
    b7_confidence_result: b7Confidence,
    diagnostic_non_contamination_boundary: "enforced",
    EVE_pathology_inputs_to_confidence: 0,
    business_inconsistency_preservation: true,
    epistemic_vs_structural_contradiction_separated: true,
    budget: {
      base_cap: 40,
      causal_cap: 20,
      note: "BudgetLedger connected on ingest; compound=1; no spend on not_opened/pending/failed",
    },
    readiness_inputs: {
      critical_route_results: critical_routes.map((c) => ({
        gate_code: c.gate,
        passed: c.outcome === "passed" || c.outcome === "not_applicable",
      })),
      missing_critical_evidence:
        b0Outcome === "failed" || b2Outcome === "failed" || pendingSem,
      b3_incomplete: b3Outcome === "failed",
      b7_boundary_blocked: b7Outcome === "blocked",
      manual_review_required: b7Outcome === "blocked" || callerForced,
      reentry_required:
        openUnanswered.length > 0 ||
        failedPst ||
        (epistemicFactUndetermined &&
          b7Confidence.confidence_level === "low"),
      pending_governed_signal:
        b7Outcome === "pending_governed_signal" || pendingSem || pendingPst,
      open_unanswered_causals: openUnanswered,
      caller_forced_ready_rejected: callerForced,
      business_structural_inconsistency_observed: businessInconsistencyObserved,
      epistemic_fact_undetermined: epistemicFactUndetermined,
    },
    blocking_reasons: blocking,
    materiality: {
      CriticalRouteGate: "implemented_and_connected",
      MMABPGateEngine: "implemented_and_connected",
      BudgetLedger: "implemented_and_connected",
      SEM: "implemented_and_connected_structured_signals_only",
      PST: "implemented_and_connected_on_strong_wait",
      ReadinessEngine: "implemented_and_connected_gate_driven",
      B7_confidence_signal: "implemented_and_connected_epistemic_only",
    },
  };
}

export function resolveRegulatoryReadinessState(
  layer: RegulatoryLayerResult,
): {
  readiness_state:
    | "ready"
    | "ready_with_flags"
    | "blocked"
    | "reentry_required"
    | "manual_review_required";
  dominant_gate: string;
  reason: string | null;
} {
  const ri = layer.readiness_inputs;
  if (ri.caller_forced_ready_rejected) {
    return {
      readiness_state: "blocked",
      dominant_gate: "Readiness",
      reason: "caller_forced_ready_rejected",
    };
  }
  if (ri.open_unanswered_causals.length > 0) {
    return {
      readiness_state: "reentry_required",
      dominant_gate: "StateMachine",
      reason: "causal_evaluation_pending",
    };
  }
  if (ri.b7_boundary_blocked || ri.manual_review_required) {
    return {
      readiness_state: "manual_review_required",
      dominant_gate: "CR-B7",
      reason: "b7_non_diagnostic_boundary",
    };
  }
  if (layer.critical_routes.some((c) => c.outcome === "failed")) {
    const failed = layer.critical_routes.find((c) => c.outcome === "failed")!;
    return {
      readiness_state: "blocked",
      dominant_gate: failed.gate,
      reason: failed.reason,
    };
  }
  if (ri.pending_governed_signal) {
    return {
      readiness_state: "blocked",
      dominant_gate: "pending_governed_signal",
      reason: "pending_governed_signal",
    };
  }
  if (ri.epistemic_fact_undetermined && layer.c20_confidence.confidence_level === "low") {
    return {
      readiness_state: "reentry_required",
      dominant_gate: "B7_epistemic",
      reason: "epistemic_fact_undetermined",
    };
  }
  if (layer.pst.some((p) => p.outcome === "failed")) {
    return {
      readiness_state: "blocked",
      dominant_gate: "PST",
      reason: "process_state_timer_failed",
    };
  }
  if (layer.sem.some((s) => s.outcome === "blocked")) {
    return {
      readiness_state: "blocked",
      dominant_gate: "SEM",
      reason: "semantic_resolution_blocked",
    };
  }
  // Fact determined that reveals business inconsistency → preserve as flags, not epistemic block.
  if (
    ri.business_structural_inconsistency_observed &&
    !ri.epistemic_fact_undetermined
  ) {
    return {
      readiness_state: "ready_with_flags",
      dominant_gate: "consistency_observation",
      reason: "business_structural_inconsistency_observed",
    };
  }
  if (ri.missing_critical_evidence || ri.b3_incomplete) {
    return {
      readiness_state: "ready_with_flags",
      dominant_gate: "completeness",
      reason: "non_blocking_gaps",
    };
  }
  return { readiness_state: "ready", dominant_gate: "all", reason: null };
}
