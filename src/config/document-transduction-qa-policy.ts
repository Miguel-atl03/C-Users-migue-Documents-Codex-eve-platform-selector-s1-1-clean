export const DOCUMENT_SOURCE_KINDS = ["docx", "xlsx"] as const;
export type DocumentSourceKind = (typeof DOCUMENT_SOURCE_KINDS)[number];

export const TRANSDUCTION_TARGET_KINDS = ["md", "json", "ts"] as const;
export type TransductionTargetKind =
  (typeof TRANSDUCTION_TARGET_KINDS)[number];

export const SOURCE_UNIT_KINDS = [
  "docx_heading",
  "docx_paragraph",
  "docx_table",
  "docx_list",
  "docx_note",
  "xlsx_workbook",
  "xlsx_sheet",
  "xlsx_row",
  "xlsx_column",
  "xlsx_cell",
  "xlsx_formula",
  "xlsx_comment",
  "xlsx_validation",
] as const;
export type SourceUnitKind = (typeof SOURCE_UNIT_KINDS)[number];

export const TRANSDUCTION_COVERAGE_STATUSES = [
  "transduced_exact",
  "transduced_structured",
  "transduced_with_normalized_names",
  "editorial_context_only",
  "superseded_with_reference",
  "intentionally_excluded_with_approval",
  "pending_transduction",
] as const;
export type TransductionCoverageStatus =
  (typeof TRANSDUCTION_COVERAGE_STATUSES)[number];

export const TRANSDUCTION_ACCEPTANCE_STATUSES = [
  "TRANSDUCTION_COMPLETE",
  "TRANSDUCTION_COMPLETE_WITH_APPROVED_EXCLUSIONS",
  "TRANSDUCTION_PARTIAL",
  "TRANSDUCTION_BLOCKED",
  "NO_GO",
] as const;
export type TransductionAcceptanceStatus =
  (typeof TRANSDUCTION_ACCEPTANCE_STATUSES)[number];

export type DocumentTransductionSourceUnit = {
  sourceUnitId: string;
  sourceKind: DocumentSourceKind;
  unitKind: SourceUnitKind;
  sourcePath: string;
  sourceLocator: string;
  coverageStatus?: TransductionCoverageStatus;
  normative: boolean;
  approvalReference?: string;
};

export type DocumentTransductionMappingRecord = {
  sourceUnitId: string;
  targetKind: TransductionTargetKind;
  targetPath: string;
  targetLocator: string;
  coverageStatus: TransductionCoverageStatus;
  transformation:
    | "literal"
    | "structured"
    | "normalized"
    | "editorial_only"
    | "superseded"
    | "excluded";
  normalizedNames?: Record<string, string>;
  approvalReference?: string;
  protectedByTests: string[];
};

export type DocumentTransductionTargetArtifact = {
  targetKind: TransductionTargetKind;
  targetPath: string;
};

export type DocumentTransductionCoverageReport = {
  reportId: string;
  sourcePath: string;
  sourceKind: DocumentSourceKind;
  runtimeAuthority: boolean;
  targetArtifacts: DocumentTransductionTargetArtifact[];
  sourceUnits: DocumentTransductionSourceUnit[];
  mappings: DocumentTransductionMappingRecord[];
  coveragePercent?: number;
  manifestPath?: string;
  closeoutPath?: string;
  tests: string[];
};

export type DocumentTransductionQaResult = {
  acceptanceStatus: TransductionAcceptanceStatus;
  coveragePercent: number;
  errors: string[];
  warnings: string[];
  unmappedSourceUnitIds: string[];
  pendingSourceUnitIds: string[];
};

function hasRuntimeMachineReadableTarget(
  report: DocumentTransductionCoverageReport,
): boolean {
  return report.targetArtifacts.some(
    (target) => target.targetKind === "ts" || target.targetKind === "json",
  );
}

function buildMappingIndex(
  mappings: DocumentTransductionMappingRecord[],
): Map<string, DocumentTransductionMappingRecord[]> {
  const index = new Map<string, DocumentTransductionMappingRecord[]>();

  for (const mapping of mappings) {
    const current = index.get(mapping.sourceUnitId) ?? [];
    current.push(mapping);
    index.set(mapping.sourceUnitId, current);
  }

  return index;
}

function calculateCoveragePercent(
  report: DocumentTransductionCoverageReport,
  unmappedSourceUnitIds: string[],
): number {
  if (typeof report.coveragePercent === "number") {
    return report.coveragePercent;
  }

  if (report.sourceUnits.length === 0) {
    return 0;
  }

  const coveredCount = report.sourceUnits.filter(
    (unit) =>
      unit.coverageStatus !== undefined &&
      unit.coverageStatus !== "pending_transduction" &&
      !unmappedSourceUnitIds.includes(unit.sourceUnitId),
  ).length;

  return Number(((coveredCount / report.sourceUnits.length) * 100).toFixed(2));
}

function hasApprovedExclusion(
  unit: DocumentTransductionSourceUnit,
  mappings: DocumentTransductionMappingRecord[],
): boolean {
  if (unit.coverageStatus !== "intentionally_excluded_with_approval") {
    return true;
  }

  return Boolean(
    unit.approvalReference ||
      mappings.some((mapping) => Boolean(mapping.approvalReference)),
  );
}

export function evaluateDocumentTransductionCoverage(
  report: DocumentTransductionCoverageReport,
): DocumentTransductionQaResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mappingIndex = buildMappingIndex(report.mappings);
  const unmappedSourceUnitIds: string[] = [];
  const pendingSourceUnitIds: string[] = [];

  if (report.runtimeAuthority && !hasRuntimeMachineReadableTarget(report)) {
    errors.push("runtimeAuthority requires at least one .ts or .json target");
  }

  for (const unit of report.sourceUnits) {
    const mappings = mappingIndex.get(unit.sourceUnitId) ?? [];

    if (!unit.coverageStatus) {
      errors.push(`${unit.sourceUnitId} has no coverageStatus`);
    }

    if (mappings.length === 0) {
      unmappedSourceUnitIds.push(unit.sourceUnitId);
      errors.push(`${unit.sourceUnitId} has no source-to-target mapping`);
    }

    if (unit.coverageStatus === "pending_transduction") {
      pendingSourceUnitIds.push(unit.sourceUnitId);
    }

    if (!hasApprovedExclusion(unit, mappings)) {
      errors.push(`${unit.sourceUnitId} exclusion lacks approvalReference`);
    }

    if (unit.coverageStatus === "transduced_with_normalized_names") {
      const hasNormalizationMap = mappings.some(
        (mapping) =>
          mapping.normalizedNames &&
          Object.keys(mapping.normalizedNames).length > 0,
      );
      if (!hasNormalizationMap) {
        errors.push(`${unit.sourceUnitId} normalized names require mapping dictionary`);
      }
    }
  }

  for (const mapping of report.mappings) {
    if (
      mapping.coverageStatus === "intentionally_excluded_with_approval" &&
      !mapping.approvalReference
    ) {
      errors.push(`${mapping.sourceUnitId} exclusion mapping lacks approvalReference`);
    }
  }

  const coveragePercent = calculateCoveragePercent(report, unmappedSourceUnitIds);

  if (errors.length > 0) {
    return {
      acceptanceStatus: "NO_GO",
      coveragePercent,
      errors,
      warnings,
      unmappedSourceUnitIds,
      pendingSourceUnitIds,
    };
  }

  if (pendingSourceUnitIds.length > 0) {
    return {
      acceptanceStatus: "TRANSDUCTION_PARTIAL",
      coveragePercent,
      errors,
      warnings,
      unmappedSourceUnitIds,
      pendingSourceUnitIds,
    };
  }

  if (coveragePercent < 100) {
    warnings.push("coveragePercent below 100");
    return {
      acceptanceStatus: "TRANSDUCTION_PARTIAL",
      coveragePercent,
      errors,
      warnings,
      unmappedSourceUnitIds,
      pendingSourceUnitIds,
    };
  }

  const hasApprovedExclusions = report.sourceUnits.some(
    (unit) => unit.coverageStatus === "intentionally_excluded_with_approval",
  );

  return {
    acceptanceStatus: hasApprovedExclusions
      ? "TRANSDUCTION_COMPLETE_WITH_APPROVED_EXCLUSIONS"
      : "TRANSDUCTION_COMPLETE",
    coveragePercent,
    errors,
    warnings,
    unmappedSourceUnitIds,
    pendingSourceUnitIds,
  };
}
