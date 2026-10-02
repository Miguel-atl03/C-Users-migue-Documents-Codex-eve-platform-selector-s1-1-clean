import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  DocumentSourceKind,
  DocumentTransductionCoverageReport,
  DocumentTransductionMappingRecord,
  DocumentTransductionSourceUnit,
  SourceUnitKind,
  TransductionCoverageStatus,
  TransductionTargetKind,
} from "../../src/config/document-transduction-qa-policy.ts";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-document-transduction-qa-policy-hook.mjs");

writeFileSync(
  hookPath,
  `import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = ${JSON.stringify(projectRoot)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(mappedPath).href,
    };
  }
  return nextResolve(specifier, context);
}
`,
);

register(pathToFileURL(hookPath).href, import.meta.url);

const policyModule = await import("@/config/document-transduction-qa-policy");

const {
  DOCUMENT_SOURCE_KINDS,
  SOURCE_UNIT_KINDS,
  TRANSDUCTION_ACCEPTANCE_STATUSES,
  TRANSDUCTION_COVERAGE_STATUSES,
  evaluateDocumentTransductionCoverage,
} = policyModule;

function buildUnit(
  sourceUnitId: string,
  coverageStatus: TransductionCoverageStatus | undefined = "transduced_structured",
  unitKind: SourceUnitKind = "docx_paragraph",
): DocumentTransductionSourceUnit {
  const sourceKind: DocumentSourceKind = unitKind.startsWith("xlsx_") ? "xlsx" : "docx";
  return {
    sourceUnitId,
    sourceKind,
    unitKind,
    sourcePath: "docs/source.docx",
    sourceLocator: `locator:${sourceUnitId}`,
    coverageStatus,
    normative: true,
  };
}

function buildMapping(
  sourceUnitId: string,
  coverageStatus: TransductionCoverageStatus = "transduced_structured",
  overrides: Partial<{
    targetKind: TransductionTargetKind;
    targetPath: string;
    transformation:
      | "literal"
      | "structured"
      | "normalized"
      | "editorial_only"
      | "superseded"
      | "excluded";
    approvalReference: string;
    normalizedNames: Record<string, string>;
  }> = {},
): DocumentTransductionMappingRecord {
  return {
    sourceUnitId,
    targetKind: overrides.targetKind ?? "json",
    targetPath: overrides.targetPath ?? "src/rules/example.json",
    targetLocator: `target:${sourceUnitId}`,
    coverageStatus,
    transformation: overrides.transformation ?? "structured",
    approvalReference: overrides.approvalReference,
    normalizedNames: overrides.normalizedNames,
    protectedByTests: ["tests/regression/document-transduction-qa-policy.test.ts"],
  };
}

function buildReport(
  overrides: Partial<DocumentTransductionCoverageReport> = {},
): DocumentTransductionCoverageReport {
  return {
    reportId: "report-1",
    sourcePath: "docs/source.docx",
    sourceKind: "docx",
    runtimeAuthority: true,
    targetArtifacts: [{ targetKind: "json", targetPath: "src/rules/example.json" }],
    sourceUnits: [buildUnit("u1"), buildUnit("u2")],
    mappings: [buildMapping("u1"), buildMapping("u2")],
    tests: ["tests/regression/document-transduction-qa-policy.test.ts"],
    ...overrides,
  };
}

test("policy exports required states", () => {
  assert.deepEqual(DOCUMENT_SOURCE_KINDS, ["docx", "xlsx"]);
  assert.ok(TRANSDUCTION_ACCEPTANCE_STATUSES.includes("TRANSDUCTION_COMPLETE"));
  assert.ok(TRANSDUCTION_ACCEPTANCE_STATUSES.includes("NO_GO"));
  assert.ok(TRANSDUCTION_COVERAGE_STATUSES.includes("pending_transduction"));
});

test("complete transduction without exclusions returns TRANSDUCTION_COMPLETE", () => {
  const result = evaluateDocumentTransductionCoverage(buildReport());

  assert.equal(result.acceptanceStatus, "TRANSDUCTION_COMPLETE");
  assert.equal(result.coveragePercent, 100);
});

test("approved exclusions return TRANSDUCTION_COMPLETE_WITH_APPROVED_EXCLUSIONS", () => {
  const unit = {
    ...buildUnit("u2", "intentionally_excluded_with_approval"),
    approvalReference: "closeout-1",
  };
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      sourceUnits: [buildUnit("u1"), unit],
      mappings: [
        buildMapping("u1"),
        buildMapping("u2", "intentionally_excluded_with_approval", {
          transformation: "excluded",
          approvalReference: "closeout-1",
        }),
      ],
    }),
  );

  assert.equal(
    result.acceptanceStatus,
    "TRANSDUCTION_COMPLETE_WITH_APPROVED_EXCLUSIONS",
  );
});

test("pending unit returns TRANSDUCTION_PARTIAL", () => {
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      sourceUnits: [buildUnit("u1"), buildUnit("u2", "pending_transduction")],
      mappings: [buildMapping("u1"), buildMapping("u2", "pending_transduction")],
    }),
  );

  assert.equal(result.acceptanceStatus, "TRANSDUCTION_PARTIAL");
  assert.deepEqual(result.pendingSourceUnitIds, ["u2"]);
});

test("exclusion without approval returns NO_GO", () => {
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      sourceUnits: [
        buildUnit("u1"),
        buildUnit("u2", "intentionally_excluded_with_approval"),
      ],
      mappings: [
        buildMapping("u1"),
        buildMapping("u2", "intentionally_excluded_with_approval", {
          transformation: "excluded",
        }),
      ],
    }),
  );

  assert.equal(result.acceptanceStatus, "NO_GO");
});

test("runtimeAuthority without ts or json returns NO_GO", () => {
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      targetArtifacts: [{ targetKind: "md", targetPath: "docs/example.md" }],
    }),
  );

  assert.equal(result.acceptanceStatus, "NO_GO");
});

test("source unit without mapping returns NO_GO", () => {
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      mappings: [buildMapping("u1")],
    }),
  );

  assert.equal(result.acceptanceStatus, "NO_GO");
  assert.deepEqual(result.unmappedSourceUnitIds, ["u2"]);
});

test("coverage below 100 returns TRANSDUCTION_PARTIAL", () => {
  const result = evaluateDocumentTransductionCoverage(
    buildReport({ coveragePercent: 99 }),
  );

  assert.equal(result.acceptanceStatus, "TRANSDUCTION_PARTIAL");
});

test("DOCX units are supported", () => {
  const docxKinds: SourceUnitKind[] = [
    "docx_heading",
    "docx_paragraph",
    "docx_table",
    "docx_list",
    "docx_note",
  ];

  for (const kind of docxKinds) {
    assert.ok(SOURCE_UNIT_KINDS.includes(kind));
  }
});

test("XLSX units are supported", () => {
  const xlsxKinds: SourceUnitKind[] = [
    "xlsx_workbook",
    "xlsx_sheet",
    "xlsx_row",
    "xlsx_column",
    "xlsx_cell",
    "xlsx_formula",
    "xlsx_comment",
    "xlsx_validation",
  ];

  for (const kind of xlsxKinds) {
    assert.ok(SOURCE_UNIT_KINDS.includes(kind));
  }
});

test("normalization requires mapping dictionary", () => {
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      sourceUnits: [
        buildUnit("u1"),
        buildUnit("u2", "transduced_with_normalized_names"),
      ],
      mappings: [
        buildMapping("u1"),
        buildMapping("u2", "transduced_with_normalized_names", {
          transformation: "normalized",
        }),
      ],
    }),
  );

  assert.equal(result.acceptanceStatus, "NO_GO");
});

test("complete is not allowed with unclassified units", () => {
  const unclassifiedUnit = { ...buildUnit("u2"), coverageStatus: undefined };
  const result = evaluateDocumentTransductionCoverage(
    buildReport({
      sourceUnits: [buildUnit("u1"), unclassifiedUnit],
      mappings: [buildMapping("u1"), buildMapping("u2")],
    }),
  );

  assert.equal(result.acceptanceStatus, "NO_GO");
});

test("coverage statuses match the MD standard", () => {
  const standard = readFileSync(
    "docs/architecture/DOCUMENT_TRANSDUCTION_QA_STANDARD_V1.md",
    "utf8",
  );

  for (const status of TRANSDUCTION_COVERAGE_STATUSES) {
    assert.match(standard, new RegExp(`\\\`${status}\\\``));
  }
});
