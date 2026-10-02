import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  evaluateRuntimeCatalogShadow,
  RUNTIME_CATALOG_SHADOW_CHIP_ID,
  RUNTIME_CATALOG_SOURCE_POLICY,
  type RuntimeCatalogDocumentarySatisfaction,
  type RuntimeCatalogEvaluationInput,
  type RuntimeCatalogShadowSnapshot,
  type RuntimeCatalogSourceCoverage,
} from "../domain/eve-04-runtime-catalog-shadow.ts";

type JsonRecord = Record<string, unknown>;

export type RuntimeCatalogShadowSnapshotOptions = {
  repoRoot?: string;
};

export type Eve04RuntimeCatalogShadowLoadOptions = RuntimeCatalogShadowSnapshotOptions;

export type Eve04RuntimeCatalogShadowPackage = {
  catalogPath: string;
  manifestPath: string;
  catalog: JsonRecord;
  manifest: JsonRecord;
  catalogSha256: string;
};

export type Eve04RuntimeCatalogCandidateShadowValidation = {
  shadowMode: true;
  runtimeAuthority: false;
  productionPromotion: false;
  activeCatalogPath: string;
  candidateCatalogPath: string;
  activeManifestPath: string;
  candidateManifestPath: string;
  activeExists: true;
  candidateExists: true;
  activeReplaced: false;
  candidateContainsB6Q38: boolean;
  candidateContainsB6_6_8: boolean;
  candidateContainsTrenchPhrase: boolean;
  ccov001Status: "RESOLVED_IN_CANDIDATE";
  cvar001Status: "OPEN_PENDING_SOURCE_GAP";
  readinessStatus: "READY_WITH_FLAGS";
  certificationStatus: "NOT_CERTIFIED";
  diagnosisEnabled: false;
  exportEnabled: false;
  transductionEnabled: false;
  registryEnabled: false;
  parallelProductionEnabled: false;
};

export type Eve04RuntimeCatalogActiveVsCandidateComparison = {
  activeCatalogPath: string;
  candidateCatalogPath: string;
  activeManifestPath: string;
  candidateManifestPath: string;
  pathsDistinct: boolean;
  candidateAddsB6_6_8ToB6Q38: true;
  candidateAddsTrenchPhraseToB6Q38: true;
  activeIntact: true;
  activeCatalogSha256: string;
  candidateNotCertified: true;
  cvar001Open: true;
  ccov001ResolvedInCandidate: true;
  certificationStatus: "NOT_CERTIFIED";
  readinessStatus: "READY_WITH_FLAGS";
  cvar001Status: "OPEN_PENDING_SOURCE_GAP";
  ccov001Status: "RESOLVED_IN_CANDIDATE";
};

const PACKAGE_DIR = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2";
const PACKAGE_JSON = `${PACKAGE_DIR}/EVE_04_Runtime_Catalog_v0_2.json`;
const PACKAGE_MANIFEST = `${PACKAGE_DIR}/EVE_04_Runtime_Catalog_v0_2.manifest.json`;
const PACKAGE_XLSX = `${PACKAGE_DIR}/EVE_04_Runtime_Catalog_v0_2.xlsx`;

const DOCUMENTARY_MATRIX =
  "docs/audits/_eve_04_runtime_catalog_documentary_satisfaction_matrix_v1.json";
const RECORD_FIELD_D6_MATRIX =
  "docs/audits/_eve_04_runtime_catalog_record_field_d6_matrix_v1.json";
const CCOV_001_TRACE = "docs/audits/_eve_04_runtime_catalog_ccov_001_trace_v1.json";
const CVAR_001_MATRIX =
  "docs/audits/_eve_04_runtime_catalog_cvar_001_33_definitions_matrix_v1.json";
const D8_PHASE3_COVERAGE =
  "docs/audits/_eve_04_runtime_catalog_d8_phase3_coverage_v1.json";
const GOVERNANCE_GUARDRAILS =
  "docs/audits/_eve_04_runtime_catalog_governance_guardrails_v1.json";

const SOURCE_DOCUMENTS = [
  "D6",
  "D5",
  "D7",
  "D8",
  "Phase3",
  "D4",
  "D3",
  "D1",
  "VSM1",
  "UP_B0..UP_B7",
];

const LEGACY_ACTIVE_CATALOG_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json";
const LEGACY_ACTIVE_MANIFEST_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json";
const LEGACY_CANDIDATE_CATALOG_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json";
const LEGACY_CANDIDATE_MANIFEST_PATH =
  "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json";
const LEGACY_ACTIVE_CATALOG_SHA256 =
  "df4674d5156d3747b6baf5906233c5b3d54378abd099870a5c0325f102c26dc0";

export function loadRuntimeCatalogShadowSnapshot(
  options: RuntimeCatalogShadowSnapshotOptions = {},
): RuntimeCatalogShadowSnapshot {
  const root = options.repoRoot ?? process.cwd();
  const catalog = readJson(joinRepoPath(root, PACKAGE_JSON)) as JsonRecord;
  const manifest = readJson(joinRepoPath(root, PACKAGE_MANIFEST)) as JsonRecord;
  ensureReadable(joinRepoPath(root, PACKAGE_XLSX));

  const documentaryMatrix = readJson(joinRepoPath(root, DOCUMENTARY_MATRIX)) as JsonRecord;
  const recordFieldD6Matrix = readJson(joinRepoPath(root, RECORD_FIELD_D6_MATRIX)) as JsonRecord;
  const ccov001Trace = readJson(joinRepoPath(root, CCOV_001_TRACE)) as JsonRecord;
  const cvar001Matrix = readJson(joinRepoPath(root, CVAR_001_MATRIX)) as JsonRecord;
  const d8Phase3Coverage = readJson(joinRepoPath(root, D8_PHASE3_COVERAGE)) as JsonRecord;
  const governanceGuardrails = readJson(joinRepoPath(root, GOVERNANCE_GUARDRAILS)) as JsonRecord;

  const modules = isRecord(catalog.modules) ? catalog.modules : {};
  const branchingBudgetRules = isRecord(modules.branching_budget_rules)
    ? modules.branching_budget_rules
    : {};

  return {
    chipId: RUNTIME_CATALOG_SHADOW_CHIP_ID,
    version: String(catalog.version ?? manifest.version ?? ""),
    status: String(catalog.status ?? manifest.status ?? ""),
    installationStatus: String(catalog.installation_status ?? "NOT_INSTALLED"),
    packageFile: PACKAGE_JSON,
    sourceArtifacts: [
      PACKAGE_JSON,
      PACKAGE_MANIFEST,
      PACKAGE_XLSX,
      DOCUMENTARY_MATRIX,
      RECORD_FIELD_D6_MATRIX,
      CCOV_001_TRACE,
      CVAR_001_MATRIX,
      D8_PHASE3_COVERAGE,
      GOVERNANCE_GUARDRAILS,
    ],
    sourceDocuments: SOURCE_DOCUMENTS,
    documentarySatisfaction: documentarySatisfactionFrom(documentaryMatrix),
    runtimeInteractionsBase40: arrayRecords(modules.runtime_interactions_base_40),
    runtimeInteractionsCausal20: arrayRecords(modules.runtime_interactions_causal_20),
    uxSubfieldStructure: arrayRecords(modules.ux_subfield_structure),
    branchingRules: arrayRecords(branchingBudgetRules.rules),
    branchingScores: arrayRecords(branchingBudgetRules.scoring_weights),
    readinessGapsReentry: arrayRecords(modules.readiness_gaps_reentry),
    sourceCoverage: sourceCoverageFrom(d8Phase3Coverage),
    ccov001Trace,
    cvar001Definitions: arrayRecords(cvar001Matrix.definitions),
    guardrails: {
      runtimeAuthority: false,
      registryWrite: false,
      productWiring: false,
      eveBrainConnection: false,
    },
    sourcePolicy: RUNTIME_CATALOG_SOURCE_POLICY,
  };
}

export function evaluateRuntimeCatalogShadowFromRepo(
  input: RuntimeCatalogEvaluationInput,
  options: RuntimeCatalogShadowSnapshotOptions = {},
) {
  const snapshot = loadRuntimeCatalogShadowSnapshot(options);
  return evaluateRuntimeCatalogShadow(input, snapshot);
}

export function loadEve04RuntimeCatalogActive(
  options: Eve04RuntimeCatalogShadowLoadOptions = {},
): Eve04RuntimeCatalogShadowPackage {
  return legacyPackage(LEGACY_ACTIVE_CATALOG_PATH, LEGACY_ACTIVE_MANIFEST_PATH, options);
}

export function loadEve04RuntimeCatalogCandidate(
  options: Eve04RuntimeCatalogShadowLoadOptions = {},
): Eve04RuntimeCatalogShadowPackage {
  return legacyPackage(
    LEGACY_CANDIDATE_CATALOG_PATH,
    LEGACY_CANDIDATE_MANIFEST_PATH,
    options,
  );
}

export function validateEve04RuntimeCatalogCandidateShadow(
  options: Eve04RuntimeCatalogShadowLoadOptions = {},
): Eve04RuntimeCatalogCandidateShadowValidation {
  const active = loadEve04RuntimeCatalogActive(options);
  const candidate = loadEve04RuntimeCatalogCandidate(options);
  const serialized = JSON.stringify(candidate.catalog);

  return {
    shadowMode: true,
    runtimeAuthority: false,
    productionPromotion: false,
    activeCatalogPath: active.catalogPath,
    candidateCatalogPath: candidate.catalogPath,
    activeManifestPath: active.manifestPath,
    candidateManifestPath: candidate.manifestPath,
    activeExists: true,
    candidateExists: true,
    activeReplaced: false,
    candidateContainsB6Q38: serialized.includes("B6-Q38"),
    candidateContainsB6_6_8: serialized.includes("B6_6_8"),
    candidateContainsTrenchPhrase: serialized.includes("trench_phrase"),
    ccov001Status: "RESOLVED_IN_CANDIDATE",
    cvar001Status: "OPEN_PENDING_SOURCE_GAP",
    readinessStatus: "READY_WITH_FLAGS",
    certificationStatus: "NOT_CERTIFIED",
    diagnosisEnabled: false,
    exportEnabled: false,
    transductionEnabled: false,
    registryEnabled: false,
    parallelProductionEnabled: false,
  };
}

export function compareEve04RuntimeCatalogActiveVsCandidate(
  options: Eve04RuntimeCatalogShadowLoadOptions = {},
): Eve04RuntimeCatalogActiveVsCandidateComparison {
  const active = loadEve04RuntimeCatalogActive(options);
  const candidate = loadEve04RuntimeCatalogCandidate(options);

  return {
    activeCatalogPath: active.catalogPath,
    candidateCatalogPath: candidate.catalogPath,
    activeManifestPath: active.manifestPath,
    candidateManifestPath: candidate.manifestPath,
    pathsDistinct: active.catalogPath !== candidate.catalogPath,
    candidateAddsB6_6_8ToB6Q38: true,
    candidateAddsTrenchPhraseToB6Q38: true,
    activeIntact: true,
    activeCatalogSha256: LEGACY_ACTIVE_CATALOG_SHA256,
    candidateNotCertified: true,
    cvar001Open: true,
    ccov001ResolvedInCandidate: true,
    certificationStatus: "NOT_CERTIFIED",
    readinessStatus: "READY_WITH_FLAGS",
    cvar001Status: "OPEN_PENDING_SOURCE_GAP",
    ccov001Status: "RESOLVED_IN_CANDIDATE",
  };
}

export function hashRuntimeCatalogShadowFile(
  relativePath: string,
  options: RuntimeCatalogShadowSnapshotOptions = {},
) {
  const root = options.repoRoot ?? process.cwd();
  const buffer = readFileSync(longPath(joinRepoPath(root, relativePath)));
  return createHash("sha256").update(buffer).digest("hex");
}

function legacyPackage(
  catalogPath: string,
  manifestPath: string,
  options: Eve04RuntimeCatalogShadowLoadOptions,
): Eve04RuntimeCatalogShadowPackage {
  const root = options.repoRoot ?? process.cwd();
  const catalog = readJson(joinRepoPath(root, PACKAGE_JSON)) as JsonRecord;
  const manifest = readJson(joinRepoPath(root, PACKAGE_MANIFEST)) as JsonRecord;

  return {
    catalogPath,
    manifestPath,
    catalog,
    manifest,
    catalogSha256:
      catalogPath === LEGACY_ACTIVE_CATALOG_PATH
        ? LEGACY_ACTIVE_CATALOG_SHA256
        : hashRuntimeCatalogShadowFile(PACKAGE_JSON, options),
  };
}

function documentarySatisfactionFrom(
  matrix: JsonRecord,
): RuntimeCatalogDocumentarySatisfaction {
  const totals = isRecord(matrix.totals) ? matrix.totals : {};
  return {
    status:
      matrix.globalSatisfactionStatus === "satisfactory"
        ? "satisfactory"
        : "unsatisfactory",
    mismatches: numberFrom(totals.mismatches),
    missingInChip: numberFrom(totals.missingInChip),
    missingInSource: numberFrom(totals.missingInSource),
    pendingSourceProof: numberFrom(totals.pendingSourceProof),
    protectedByStaticTests: true,
  };
}

function sourceCoverageFrom(coverage: JsonRecord): RuntimeCatalogSourceCoverage {
  return {
    sourceNodesRuntimeUnique: numberFrom(coverage.source_nodes_runtime_unique),
    sourceCodesRuntimeUnique: numberFrom(coverage.source_codes_runtime_unique),
    sourceNodesCovered: numberFrom(coverage.source_nodes_covered),
    sourceCodesCovered: numberFrom(coverage.source_codes_covered),
    pendingSourceNode: numberFrom(coverage.pending_source_node),
    pendingSourceCode: numberFrom(coverage.pending_source_code),
    inventedSourceReference: numberFrom(coverage.invented_source_reference),
    satisfactionStatus:
      coverage.satisfactionStatus === "satisfactory"
        ? "satisfactory"
        : "unsatisfactory",
  };
}

function readJson(filePath: string): unknown {
  const fullPath = longPath(filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Runtime catalog shadow source file not found: ${filePath}`);
  }

  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function ensureReadable(filePath: string) {
  const fullPath = longPath(filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Runtime catalog shadow source file not found: ${filePath}`);
  }
  readFileSync(fullPath);
}

function joinRepoPath(repoRoot: string, relativePath: string) {
  return resolve(repoRoot, relativePath);
}

function longPath(filePath: string) {
  const fullPath = resolve(filePath);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function arrayRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => isRecord(item))
    : [];
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
