import type {
  RectorDocumentKind,
  RectorDocumentRef,
  RuntimeRectorSourceBaselineInput,
  RuntimeRectorSourceBaselineResult,
  RuntimeSourceBaselineGateResult,
} from "./runtime-rector-source-baseline-types";

const REQUIRED_DOCUMENT_KINDS: RectorDocumentKind[] = [
  "runtime_technical_spec",
  "runtime_catalog",
  "mother_catalog",
];

const REQUIRED_RUNTIME_CATALOG_SHEETS = [
  "Version_Control",
  "Runtime_Interactions_Base_40",
  "Runtime_Interactions_Causal_20",
  "Required_Field_Model",
  "UX_Subfield_Structure",
  "Epistemic_Policy",
  "MMABP_Output_Map",
  "Canonical_Variables",
  "Branching_Budget_Rules",
  "Critical_Routes",
  "Semantic_Resolution_Gates",
  "Process_State_Timer_Gates",
  "Readiness_Gaps_Reentry",
  "Parallel_Production_Contract",
  "QA_Checklist",
  "Implementation_Dictionaries",
];

const EXPECTED_VERSIONS = {
  runtime_spec_version: "v1.0.1",
  runtime_catalog_version: "v1.1.1",
  mother_catalog_version: "1.0",
} as const;

const MATERIALITY: RuntimeRectorSourceBaselineResult["materiality"] = {
  level: "runtime_40_20_rector_source_baseline_and_qa_gate",
  local_only: true,
  runtime_40_20_started: false,
  next_authorization_required: true,
};

export function runRuntimeRectorSourceBaselineGate(
  input: RuntimeRectorSourceBaselineInput,
): RuntimeRectorSourceBaselineResult {
  const documentBlockers = validateRectorDocuments(input.rector_documents);
  const runtimeRequiredSheetsPresent = allRequiredRuntimeSheetsPresent(input);
  const motherCatalogInspectable =
    input.mother_catalog_sheet_manifest.inspected === true &&
    input.mother_catalog_sheet_manifest.sheets_detected.length > 0;

  const gateResults: RuntimeSourceBaselineGateResult[] = [
    gate(
      "T-001",
      "runtime_base_count_is_40",
      input.runtime_catalog_sheet_manifest.base_interaction_count === 40,
      `Runtime_Interactions_Base_40 data rows: ${
        input.runtime_catalog_sheet_manifest.base_interaction_count ?? "not_found"
      }`,
    ),
    gate(
      "T-002",
      "runtime_causal_count_is_20",
      input.runtime_catalog_sheet_manifest.causal_interaction_count === 20,
      `Runtime_Interactions_Causal_20 data rows: ${
        input.runtime_catalog_sheet_manifest.causal_interaction_count ?? "not_found"
      }`,
    ),
    gate(
      "T-014",
      "required_sheets_present",
      runtimeRequiredSheetsPresent,
      runtimeRequiredSheetsPresent
        ? "All required Runtime Catalog sheets are present."
        : `Missing required Runtime Catalog sheets: ${missingRuntimeSheets(input).join(
            ", ",
          )}`,
    ),
    gate(
      "T-016",
      "checksum_registered",
      checksumsRegistered(input),
      checksumsRegistered(input)
        ? "Checksums for all three rector documents are present."
        : "Checksums for all three rector documents are required.",
    ),
    gate(
      "T-017",
      "no_deprecated_version_labels",
      versionAlignmentOk(input),
      versionAlignmentOk(input)
        ? "Version metadata matches the expected rector versions."
        : "Version metadata contradicts expected rector versions.",
    ),
    gate(
      "T-019",
      "source_node_integrity_precheck",
      runtimeRequiredSheetsPresent && motherCatalogInspectable,
      runtimeRequiredSheetsPresent && motherCatalogInspectable
        ? "Runtime source reference precheck can trace against inspected Runtime and Mother Catalog manifests; full row-level validation is deferred."
        : "Runtime source reference precheck requires Runtime required sheets and inspected Mother Catalog sheets.",
    ),
    gate(
      "T-020",
      "b7_no_direct_projection_precheck",
      true,
      "B7 direct projection to IR, registry, export or diagnosis is blocked in this baseline gate.",
    ),
  ];

  const gateBlockers = gateResults
    .filter((result) => !result.passed && result.severity === "blocking")
    .map((result) => `${result.gate_id}:${result.gate_name}`);
  const blockers = unique([...documentBlockers, ...gateBlockers]);
  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    rector_documents: input.rector_documents,
    runtime_catalog_sheet_manifest: input.runtime_catalog_sheet_manifest,
    mother_catalog_sheet_manifest: input.mother_catalog_sheet_manifest,
    version_matrix: input.version_matrix,
    checksum_manifest: input.checksum_manifest,
    gate_results: gateResults,
    no_go_check: buildNoGoCheck(blockers),
    blocked_reason: ok ? undefined : blockers.join("; "),
    materiality: MATERIALITY,
  };
}

function validateRectorDocuments(documents: RectorDocumentRef[]): string[] {
  const blockers: string[] = [];

  if (documents.length !== 3) {
    blockers.push("exactly_three_rector_documents_required");
  }

  for (const kind of REQUIRED_DOCUMENT_KINDS) {
    const document = documents.find((item) => item.kind === kind);

    if (!document) {
      blockers.push(`${kind}_missing`);
      continue;
    }

    if (document.status === "missing") {
      blockers.push(`${kind}_missing`);
    }

    if (!document.readable || document.status === "unreadable") {
      blockers.push(`${kind}_unreadable`);
    }

    if (document.status === "version_mismatch") {
      blockers.push(`${kind}_version_mismatch`);
    }
  }

  return unique(blockers);
}

function allRequiredRuntimeSheetsPresent(
  input: RuntimeRectorSourceBaselineInput,
): boolean {
  const manifestRequired = new Map(
    input.runtime_catalog_sheet_manifest.required_sheets.map((sheet) => [
      sheet.sheet_name,
      sheet.present,
    ]),
  );
  const detected = new Set(input.runtime_catalog_sheet_manifest.sheets_detected);

  return REQUIRED_RUNTIME_CATALOG_SHEETS.every(
    (sheetName) => manifestRequired.get(sheetName) === true && detected.has(sheetName),
  );
}

function missingRuntimeSheets(input: RuntimeRectorSourceBaselineInput): string[] {
  const manifestRequired = new Map(
    input.runtime_catalog_sheet_manifest.required_sheets.map((sheet) => [
      sheet.sheet_name,
      sheet.present,
    ]),
  );
  const detected = new Set(input.runtime_catalog_sheet_manifest.sheets_detected);

  return REQUIRED_RUNTIME_CATALOG_SHEETS.filter(
    (sheetName) => manifestRequired.get(sheetName) !== true || !detected.has(sheetName),
  );
}

function checksumsRegistered(input: RuntimeRectorSourceBaselineInput): boolean {
  return (
    input.checksum_manifest.checksum_registered === true &&
    Boolean(input.checksum_manifest.runtime_spec_checksum) &&
    Boolean(input.checksum_manifest.runtime_catalog_checksum) &&
    Boolean(input.checksum_manifest.mother_catalog_checksum)
  );
}

function versionAlignmentOk(input: RuntimeRectorSourceBaselineInput): boolean {
  return (
    input.version_matrix.version_alignment_ok === true &&
    input.version_matrix.runtime_spec_version ===
      EXPECTED_VERSIONS.runtime_spec_version &&
    input.version_matrix.runtime_catalog_version ===
      EXPECTED_VERSIONS.runtime_catalog_version &&
    input.version_matrix.mother_catalog_version ===
      EXPECTED_VERSIONS.mother_catalog_version
  );
}

function gate(
  gateId: RuntimeSourceBaselineGateResult["gate_id"],
  gateName: string,
  passed: boolean,
  reason: string,
): RuntimeSourceBaselineGateResult {
  return {
    gate_id: gateId,
    gate_name: gateName,
    passed,
    severity: "blocking",
    reason,
  };
}

function buildNoGoCheck(
  blockers: string[],
): RuntimeRectorSourceBaselineResult["no_go_check"] {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    runtime_40_20_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
