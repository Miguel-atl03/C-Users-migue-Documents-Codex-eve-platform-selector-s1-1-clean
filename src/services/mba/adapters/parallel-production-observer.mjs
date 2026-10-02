const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const reportStatus = (assessment) =>
  assessment?.assessment_status ??
  assessment?.consistency_status ??
  assessment?.conformance_status ??
  assessment?.status ??
  null;

const isSatisfiedAssessment = (assessment) => {
  const status = reportStatus(assessment);
  return ["Satisfied", "satisfied", "passed"].includes(status);
};

const isWithFindingsAssessment = (assessment) => {
  const status = reportStatus(assessment);
  return ["WithFindings", "with_findings", "passed_with_warnings", "partial"].includes(status);
};

export function observeParallelProductionOutputs(input, { ledger, timerLedger } = {}) {
  const caseId = input.case_id ?? input.caseId ?? input.sessionId ?? input.client_id;
  const sourceBundle = input.mmabp_design_source_bundle ?? input.mmabpDesignSourceBundle;
  const inventory = input.InventarioMMABP ?? input.inventarioMMABP ?? input.inventory;
  const mmabpIr = input.MMABPIR ?? input.mmabpIr ?? input.mmabp_ir_package;
  const assessment =
    input.ArchitectureConsistencyAssessment ?? input.architectureConsistencyAssessment;
  const candidateExportPackage =
    input.ExportCodePackage ?? input.exportCodePackage ?? input.candidate_export_package;
  const syntaxValidationPassed =
    input.syntax_validation_passed ?? input.syntaxValidationPassed ?? false;
  const allowExportPromotion =
    input.allow_export_promotion ?? input.allowExportPromotion ?? false;
  const events = [];
  const timers = [];
  const findings = [];
  const hardGateCandidates = [];

  if (sourceBundle) {
    const objectId = String(sourceBundle.bundle_id ?? `${caseId}:parallel_package`);
    const timerResult = timerLedger?.startTimer({
      timer_name: "max_tiempo_inventario_mmabp_resolved",
      process_state: "SourceReceived",
      responsible_process: "P-SUP-06",
      exit_applied: "PaqueteProduccionParalelaMMABP [ExportBlocked]",
      case_id: caseId,
      session_id: input.session_id ?? input.sessionId ?? null,
      object_type: "PaqueteProduccionParalelaMMABP",
      object_id: objectId,
    });
    if (timerResult?.timer) timers.push(timerResult.timer);
    if (timerResult?.finding) findings.push(timerResult.finding);

    events.push(
      ledger.recordEvent({
        event_type: "SourceBundleDisponible",
        emitted_by: "Produccion Paralela",
        received_by: "P-SUP-06",
        object_type: "PaqueteProduccionParalelaMMABP",
        object_id: objectId,
        previous_state: "SourceReceived",
        target_state: "SourceValidated",
        operation: "validarFuente",
        responsible_process: "P-SUP-06",
        technical_actor: input.technical_actor ?? "parallel_production_observer",
        correlation_id: caseId,
        case_id: caseId,
        payload: {
          source_artifact: "mmabp_design_source_bundle",
          boundary: sourceBundle.boundaries ?? {},
          process_state: "SourceReceived",
        },
        source_adapter: "parallel_production_observer",
        session_id: input.session_id ?? input.sessionId ?? null,
      }),
    );
  }

  if (inventory) {
    events.push(
      ledger.recordEvent({
        event_type: "CandidatosExtraidos",
        emitted_by: "Produccion Paralela",
        received_by: "P-SUP-06",
        object_type: "PaqueteProduccionParalelaMMABP",
        object_id: String(inventory.inventory_id ?? `${caseId}:inventory`),
        previous_state: "CandidatesExtracted",
        target_state: "FactsConsolidated",
        operation: "consolidarHechos",
        responsible_process: "P-SUP-06",
        technical_actor: input.technical_actor ?? "parallel_production_observer",
        correlation_id: caseId,
        case_id: caseId,
        payload: {
          source_artifact: "InventarioMMABP",
          fact_count: asArray(inventory.structural_facts).length,
        },
        source_adapter: "parallel_production_observer",
        session_id: input.session_id ?? input.sessionId ?? null,
      }),
    );
  }

  if (mmabpIr) {
    events.push(
      ledger.recordEvent({
        event_type: "SemanticaResuelta",
        emitted_by: "Produccion Paralela",
        received_by: "P-SUP-06",
        object_type: "PaqueteProduccionParalelaMMABP",
        object_id: String(mmabpIr.ir_package_id ?? `${caseId}:mmabp_ir`),
        previous_state: "RegistriesBuilt",
        target_state: "IRProjected",
        operation: "proyectarIR",
        responsible_process: "P-SUP-06",
        technical_actor: input.technical_actor ?? "parallel_production_observer",
        correlation_id: caseId,
        case_id: caseId,
        payload: {
          source_artifact: "MMABPIR",
          model_names: Object.keys(mmabpIr.models ?? {}),
        },
        source_adapter: "parallel_production_observer",
        session_id: input.session_id ?? input.sessionId ?? null,
      }),
    );
  }

  if (assessment) {
    const assessmentId = String(assessment.assessment_id ?? assessment.report_id ?? `${caseId}:architecture_assessment`);
    const timerResult = timerLedger?.startTimer({
      timer_name: "max_tiempo_architecture_consistency_assessment",
      process_state: "ConformanceEvaluating",
      responsible_process: "P-SUP-07/08",
      exit_applied: "ArchitectureConsistencyAssessment [Blocked]",
      case_id: caseId,
      session_id: input.session_id ?? input.sessionId ?? null,
      object_type: "ArchitectureConsistencyAssessment",
      object_id: assessmentId,
    });
    if (timerResult?.timer) timers.push(timerResult.timer);
    if (timerResult?.finding) findings.push(timerResult.finding);

    if (isSatisfiedAssessment(assessment)) {
      events.push(
        ledger.recordEvent({
          event_type: "AssessmentConsistencySatisfied",
          emitted_by: "P-SUP-07/08",
          received_by: "P-SUP-09",
          object_type: "ArchitectureConsistencyAssessment",
          object_id: assessmentId,
          previous_state: "CompositeEvaluating",
          target_state: "Satisfied",
          operation: "satisfacer",
          responsible_process: "P-SUP-07/08",
          technical_actor: input.technical_actor ?? "parallel_production_observer",
          correlation_id: caseId,
          case_id: caseId,
          payload: {
            source_artifact: "ArchitectureConsistencyAssessment",
            status: reportStatus(assessment),
            finding_count: asArray(assessment.findings).length,
          },
          source_adapter: "parallel_production_observer",
          session_id: input.session_id ?? input.sessionId ?? null,
        }),
      );
    } else if (isWithFindingsAssessment(assessment) || asArray(assessment.findings).length > 0) {
      events.push(
        ledger.recordEvent({
          event_type: "FindingsClasificados",
          emitted_by: "P-SUP-07/08",
          received_by: "P-SUP-06",
          object_type: "ArchitectureConsistencyAssessment",
          object_id: assessmentId,
          previous_state: "CompositeEvaluating",
          target_state: "WithFindings",
          operation: "clasificarFindings",
          responsible_process: "P-SUP-07/08",
          technical_actor: input.technical_actor ?? "parallel_production_observer",
          correlation_id: caseId,
          case_id: caseId,
          payload: {
            source_artifact: "ArchitectureConsistencyAssessment",
            finding_scope: "parallel_production_design",
            finding_count: asArray(assessment.findings).length,
            rework_destination: "P-SUP-06",
          },
          source_adapter: "parallel_production_observer",
          session_id: input.session_id ?? input.sessionId ?? null,
        }),
      );
    }
  }

  if (candidateExportPackage) {
    const hasSatisfied = isSatisfiedAssessment(assessment);
    if (hasSatisfied && syntaxValidationPassed && allowExportPromotion === true) {
      events.push(
        ledger.recordEvent({
          event_type: "ExportCodePackageGenerated",
          emitted_by: "P-SUP-09",
          received_by: "RepositorioTecnico",
          object_type: "ExportCodePackage",
          object_id: String(candidateExportPackage.candidate_export_package_id ?? candidateExportPackage.package_id ?? `${caseId}:export`),
          previous_state: "SyntaxValidating",
          target_state: "Generated",
          operation: "empaquetar",
          responsible_process: "P-SUP-09",
          technical_actor: input.technical_actor ?? "parallel_production_observer",
          correlation_id: caseId,
          case_id: caseId,
          payload: {
            source_artifact: "candidate_export_package",
            promoted_from_candidate: true,
            syntax_validation_status: "passed",
          },
          source_adapter: "parallel_production_observer",
          session_id: input.session_id ?? input.sessionId ?? null,
        }),
      );
    } else {
      const gate = {
        gate_id: "MBA-GATE-EXPORT-SATISFIED-SYNTAX",
        object_type: "ExportCodePackage",
        object_id: String(candidateExportPackage.candidate_export_package_id ?? candidateExportPackage.package_id ?? `${caseId}:export`),
        reason:
          "candidate_export_package observed but not promoted to ExportCodePackage [Generated] without ArchitectureConsistencyAssessment [Satisfied] and passed syntax validation.",
      };
      hardGateCandidates.push(gate);
      findings.push({
        rule_id: "MBA-WARN-CANDIDATE-EXPORT-NOT-PROMOTED",
        severity: "warning",
        description:
          "candidate_export_package was observed as a technical candidate and was not promoted to ExportCodePackage [Generated].",
        action:
          "Require ArchitectureConsistencyAssessment [Satisfied] and passed syntax validation before export generation.",
        detail: `${gate.reason} allow_export_promotion=${String(allowExportPromotion)} syntax_validation_passed=${String(
          syntaxValidationPassed,
        )}`,
        case_id: caseId,
        object_type: "ExportCodePackage",
        object_id: gate.object_id,
        status: "open",
      });
    }
  }

  return {
    events,
    timers,
    findings,
    hard_gate_candidates: hardGateCandidates,
    observed: {
      mmabp_design_source_bundle: Boolean(sourceBundle),
      InventarioMMABP: Boolean(inventory),
      MMABPIR: Boolean(mmabpIr),
      ArchitectureConsistencyAssessment: Boolean(assessment),
      ExportCodePackage: Boolean(candidateExportPackage),
    },
  };
}
