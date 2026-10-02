import type {
  MaterialityFamily,
  MaterialityFamilyEvaluation,
  MaterialityMarkerContractInput,
  MaterialityMarkerEvaluatorInput,
  MaterialityMarkerEvaluatorResult,
  MaterialityTraceabilityInput,
} from "./materiality-marker-evaluator-types";

const REQUIRED_FAMILIES: MaterialityFamily[] = [
  "PF_SUP_03",
  "PF_SUP_04",
  "PF_SUP_05",
  "B3",
  "B7",
];

const FORBIDDEN_BOUNDARY_KEYS = [
  "diagnosis_created",
  "diagnostico_experto_final_delivered_created",
  "registry_created",
  "ir_created",
  "export_created",
  "export_code_package_created",
  "runtime_40_20_full_opened",
  "supabase_touched",
  "sql_created",
  "env_read",
];

const NO_GO: MaterialityMarkerEvaluatorResult["no_go"] = {
  runtime_40_20_full_opened: false,
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  sql_created: false,
  supabase_touched: false,
  env_read: false,
  l7_claimed: false,
  l8_claimed: false,
};

export function evaluateMaterialityMarkers(
  input: MaterialityMarkerEvaluatorInput,
): MaterialityMarkerEvaluatorResult {
  const traceabilityByFamily = indexByFamily(input.traceability_records);
  const markerByFamily = indexMarkersByFamily(input.marker_contracts);
  const evaluations = REQUIRED_FAMILIES.map((family) =>
    evaluateFamily({
      family,
      traceability: traceabilityByFamily.get(family),
      marker: markerByFamily.get(family),
    }),
  );
  const acceptedL6Count = evaluations.filter(
    (evaluation) => evaluation.findings.length === 0,
  ).length;
  const failedTestCount = evaluations.filter(
    (evaluation) => !evaluation.executable_test_passed,
  ).length;
  const noGoCount = REQUIRED_FAMILIES.filter(
    (family) => traceabilityByFamily.get(family)?.no_go_triggered === true,
  ).length;
  const blockedCount = evaluations.length - acceptedL6Count;

  return {
    ok: blockedCount === 0,
    accepted_level: "L6 service_present",
    families_evaluated: evaluations,
    closure_summary: {
      total_families: REQUIRED_FAMILIES.length,
      accepted_l6_count: acceptedL6Count,
      blocked_count: blockedCount,
      failed_test_count: failedTestCount,
      no_go_count: noGoCount,
    },
    no_go: NO_GO,
    materiality: {
      level: "L6 service_present",
      implementation_scope: "local_materiality_evaluator_only",
      next_authorization_required: true,
    },
  };
}

function evaluateFamily(params: {
  family: MaterialityFamily;
  traceability?: MaterialityTraceabilityInput;
  marker?: MaterialityMarkerContractInput;
}): MaterialityFamilyEvaluation {
  const findings: string[] = [];
  const traceability = params.traceability;
  const marker = params.marker;

  if (!traceability) {
    findings.push("missing_traceability_record");
  }
  if (!marker) {
    findings.push("missing_marker_contract");
  }

  const servicePresent = Boolean(
    traceability &&
      marker &&
      traceability.implementation_allowed === true &&
      traceability.materiality.after === "L6 service_present" &&
      traceability.materiality.marker === marker.marker_id &&
      hasDeclaredService(traceability, marker) &&
      hasDeclaredTraceabilityCloseout(traceability),
  );
  const executableTestPresent = Boolean(
    traceability &&
      (traceability.files_created.some((file) => file.endsWith(".test.mjs")) ||
        traceability.test_execution.command.includes("node --test")),
  );
  const executableTestPassed =
    traceability?.test_execution.status === "passed";
  const forbiddenOutputsClear = traceability
    ? FORBIDDEN_BOUNDARY_KEYS.every(
        (key) => traceability.boundary[key] !== true,
      )
    : false;

  if (traceability) {
    appendMaterialityFindings(findings, traceability);
    if (traceability.test_execution.status === "failed") {
      findings.push("test_execution_failed");
    }
    if (traceability.test_execution.status === "not_run") {
      findings.push("test_execution_not_run");
    }
    if (traceability.no_go_triggered) {
      findings.push("no_go_triggered");
    }
    if (traceability.runtime_40_20_full_allowed) {
      findings.push("runtime_40_20_full_allowed");
    }
    if (traceability.next_authorization_required !== true) {
      findings.push("next_authorization_required_not_true");
    }
    appendForbiddenBoundaryFindings(findings, traceability);
  }

  if (!servicePresent) {
    findings.push("service_present_not_confirmed");
  }
  if (!executableTestPresent) {
    findings.push("executable_test_not_declared");
  }
  if (!executableTestPassed) {
    findings.push("executable_test_not_passed");
  }
  if (!forbiddenOutputsClear) {
    findings.push("forbidden_outputs_not_clear");
  }

  return {
    family: params.family,
    marker_id: marker?.marker_id ?? "MISSING_MARKER_CONTRACT",
    accepted_level: "L6 service_present",
    service_present: servicePresent,
    executable_test_present: executableTestPresent,
    executable_test_passed: executableTestPassed,
    no_go_triggered: false,
    runtime_40_20_full_opened: false,
    forbidden_outputs_clear: forbiddenOutputsClear,
    next_authorization_required: true,
    accepted_as_l6_only: true,
    not_l7: true,
    not_l8: true,
    findings: unique(findings),
  };
}

function appendMaterialityFindings(
  findings: string[],
  traceability: MaterialityTraceabilityInput,
): void {
  const level = traceability.materiality.after;
  if (level === "L4 contract_defined" || level === "L5 schema_present") {
    findings.push("materiality_incomplete_below_l6");
  } else if (
    level === "L7 tested_materiality" ||
    level === "L8 executable_materiality"
  ) {
    findings.push("materiality_overclaim_above_l6");
  } else if (level !== "L6 service_present") {
    findings.push("materiality_not_l6_service_present");
  }
}

function appendForbiddenBoundaryFindings(
  findings: string[],
  traceability: MaterialityTraceabilityInput,
): void {
  for (const key of FORBIDDEN_BOUNDARY_KEYS) {
    if (traceability.boundary[key] === true) {
      findings.push(`${key}_forbidden_true`);
    }
  }
}

function hasDeclaredService(
  traceability: MaterialityTraceabilityInput,
  marker: MaterialityMarkerContractInput,
): boolean {
  const normalizedRequired = marker.required_service_contract.replace(
    /^services\//,
    "src/services/",
  );

  return traceability.files_created.some((file) =>
    normalizePath(file).includes(normalizePath(normalizedRequired)),
  );
}

function hasDeclaredTraceabilityCloseout(
  traceability: MaterialityTraceabilityInput,
): boolean {
  return (
    traceability.files_created.some((file) =>
      normalizePath(file).includes("closeout"),
    ) &&
    traceability.files_created.some((file) =>
      normalizePath(file).includes("traceability"),
    )
  );
}

function indexByFamily(
  records: MaterialityTraceabilityInput[],
): Map<MaterialityFamily, MaterialityTraceabilityInput> {
  const byFamily = new Map<MaterialityFamily, MaterialityTraceabilityInput>();
  for (const record of records) {
    byFamily.set(record.family, record);
  }
  return byFamily;
}

function indexMarkersByFamily(
  markers: MaterialityMarkerContractInput[],
): Map<MaterialityFamily, MaterialityMarkerContractInput> {
  const byFamily = new Map<MaterialityFamily, MaterialityMarkerContractInput>();
  for (const marker of markers) {
    byFamily.set(marker.scope, marker);
  }
  return byFamily;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\.ts$/, "");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
