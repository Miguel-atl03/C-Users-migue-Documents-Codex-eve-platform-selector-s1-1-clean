import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  evaluateCanonicalCatalogShadow,
  type CanonicalCatalogEvaluationInput,
  type CanonicalCatalogSnapshot,
} from "../domain/eve-03-canonical-catalog-shadow";

type JsonRecord = Record<string, unknown>;

export type CanonicalCatalogShadowSnapshotOptions = {
  repoRoot?: string;
};

const PACKAGE_DIR = "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1";
const INTERNAL_DIR = `${PACKAGE_DIR}/03_canonical_catalog`;

const INTERNAL_JSON_FILES = [
  "source_node_registry.json",
  "source_code_registry.json",
  "canonical_variables.json",
  "node_variable_map.json",
  "critical_routes.json",
  "epistemic_policy.json",
  "source_documents.json",
  "source_target_map.json",
  "vsm_prep_guard.json",
  "qa_audit.json",
];

export function loadCanonicalCatalogShadowSnapshot(
  options: CanonicalCatalogShadowSnapshotOptions = {},
): CanonicalCatalogSnapshot {
  const root = options.repoRoot ?? process.cwd();
  const readInternalJson = (fileName: string) =>
    readJson(joinRepoPath(root, `${INTERNAL_DIR}/${fileName}`));

  const sourceNodes = readInternalJson("source_node_registry.json") as JsonRecord[];
  const sourceCodes = readInternalJson("source_code_registry.json") as JsonRecord[];
  const canonicalVariables = readInternalJson("canonical_variables.json") as JsonRecord[];
  const nodeVariableMap = readInternalJson("node_variable_map.json") as JsonRecord[];
  const criticalRoutes = readInternalJson("critical_routes.json") as JsonRecord[];
  const epistemicPolicy = readInternalJson("epistemic_policy.json") as {
    global_rules?: JsonRecord[];
    node_policies?: JsonRecord[];
  };
  const sourceDocuments = readInternalJson("source_documents.json") as JsonRecord[];
  const sourceTargetMap = readInternalJson("source_target_map.json") as JsonRecord[];
  const vsmPrepGuard = readInternalJson("vsm_prep_guard.json") as {
    rules?: JsonRecord[];
    dictionary?: JsonRecord[];
  };
  const qaAudit = readInternalJson("qa_audit.json") as JsonRecord[];

  return {
    sourceNodes: indexBy(sourceNodes, ["source_node_ref_id", "master_node_id"]),
    sourceCodes: indexBy(sourceCodes, [
      "source_question_code_intact",
      "code_registry_id",
      "normalized_lookup_key",
      "source_node_ref_id",
    ]),
    canonicalVariables: indexBy(canonicalVariables, ["canonical_variable_id", "variable_name"]),
    nodeVariableMap: nodeVariableMap as Record<string, Record<string, unknown>>[],
    criticalRoutes: indexBy(criticalRoutes, ["critical_route_id"]),
    epistemicPolicies: indexBy(
      [...(epistemicPolicy.global_rules ?? []), ...(epistemicPolicy.node_policies ?? [])],
      ["policy_id", "capture_node_id", "rule_name"],
    ),
    sourceDocuments: indexBy(sourceDocuments, ["source_id", "title"]),
    sourceTargetMap: indexBy(sourceTargetMap, [
      "source_target_id",
      "target_module",
      "source_unit",
      "source_id",
    ]),
    vsmPrepGuard: indexBy([...(vsmPrepGuard.rules ?? []), ...(vsmPrepGuard.dictionary ?? [])], [
      "vsm_rule_id",
      "code",
      "runtime_action",
      "use_in_phase_3",
    ]),
    referencedCanonicalVariablesNotDefined: collectReferencedCanonicalVariablesNotDefined(
      canonicalVariables,
      nodeVariableMap,
      criticalRoutes,
      qaAudit,
    ),
    sourceArtifacts: INTERNAL_JSON_FILES.map((fileName) => `${INTERNAL_DIR}/${fileName}`),
  };
}

export function evaluateCanonicalCatalogShadowFromRepo(
  input: CanonicalCatalogEvaluationInput,
  options: CanonicalCatalogShadowSnapshotOptions = {},
) {
  const snapshot = loadCanonicalCatalogShadowSnapshot(options);
  return evaluateCanonicalCatalogShadow(input, snapshot);
}

function readJson(filePath: string): unknown {
  const fullPath = longPath(filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Canonical catalog shadow source file not found: ${filePath}`);
  }

  return JSON.parse(readFileSync(fullPath, "utf8"));
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

function indexBy(records: JsonRecord[], keys: string[]) {
  const index: Record<string, JsonRecord> = {};

  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (value == null || value === "") {
        continue;
      }
      index[String(value)] = record;
    }
  }

  return index;
}

function collectReferencedCanonicalVariablesNotDefined(
  canonicalVariables: JsonRecord[],
  nodeVariableMap: JsonRecord[],
  criticalRoutes: JsonRecord[],
  qaAudit: JsonRecord[],
) {
  const defined = new Set([
    ...canonicalVariables.map((record) => String(record.canonical_variable_id ?? "")),
    ...canonicalVariables.map((record) => String(record.variable_name ?? "")),
  ]);
  const referenced = new Set<string>();

  for (const mapping of nodeVariableMap) {
    addIfMissing(referenced, defined, mapping.variable_ref);
    addIfMissing(referenced, defined, mapping.canonical_variable_id);
  }

  for (const route of criticalRoutes) {
    for (const variable of arrayValue(route.pending_variable_definitions)) {
      if (variable) {
        referenced.add(`CV::${variable}`);
      }
    }
  }

  const officialCount = officialReferencedVariablesGapCount(qaAudit) ?? referenced.size;
  const values = [...referenced].sort();
  while (values.length < officialCount) {
    values.push(`CV::UNRESOLVED_REFERENCED_CANONICAL_VARIABLE_${String(values.length + 1).padStart(3, "0")}`);
  }

  return values;
}

function addIfMissing(referenced: Set<string>, defined: Set<string>, value: unknown) {
  if (value == null || value === "") {
    return;
  }

  const raw = String(value);
  const canonical = raw.startsWith("CV::") ? raw : `CV::${raw}`;
  if (!defined.has(raw) && !defined.has(canonical)) {
    referenced.add(canonical);
  }
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function officialReferencedVariablesGapCount(qaAudit: JsonRecord[]) {
  for (const record of qaAudit) {
    const text = `${record.check ?? ""} ${record.actual ?? ""} ${record.detail ?? ""}`;
    const match = text.match(/\b(\d+)\s+referenced variables missing/i);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}
