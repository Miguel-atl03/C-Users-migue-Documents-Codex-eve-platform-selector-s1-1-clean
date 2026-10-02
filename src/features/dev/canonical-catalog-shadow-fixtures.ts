import type {
  CanonicalCatalogEvaluationInput,
  CanonicalCatalogEvaluationResult,
  CanonicalCatalogReadinessState,
} from "@/domain/eve-03-canonical-catalog-shadow";
import {
  CANONICAL_CATALOG_SHADOW_CHIP_ID,
  CANONICAL_CATALOG_SHADOW_MODE,
  CANONICAL_CATALOG_SHADOW_SAFETY_FLAGS,
  CANONICAL_CATALOG_SHADOW_VERSION,
} from "@/domain/eve-03-canonical-catalog-shadow";
import {
  evaluateCanonicalCatalogShadowFromRepo,
  loadCanonicalCatalogShadowSnapshot,
} from "@/services/eve-03-canonical-catalog-shadow-service";

export const CANONICAL_CATALOG_SHADOW_STATUS = "SHADOW_READY_NOT_WIRED";

export const CANONICAL_CATALOG_HARNESS_COUNTERS = {
  totalNodes: 164,
  totalSourceCodes: 164,
  totalCanonicalVariables: 257,
  totalNodeVariableMappings: 213,
  totalCriticalRoutes: 4,
  referencedNotDefined: 33,
} as const;

export const CANONICAL_CATALOG_SOURCE_POLICY = [
  { sourceId: "D8", role: "primary" },
  { sourceId: "D6", role: "compatibility boundary" },
  { sourceId: "D5", role: "governance boundary" },
  { sourceId: "D7", role: "architecture boundary" },
  { sourceId: "VSM1", role: "methodological guard only" },
] as const;

export const CANONICAL_CATALOG_LIVING_GAP = {
  gapId: "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED",
  status: "still_open_non_blocking",
  count: 33,
  meaning: "reported, not hidden, not auto-resolved",
} as const;

export const CANONICAL_CATALOG_NO_WIRING_LINES = [
  "No Runtime productivo.",
  "No WorkMap mutation.",
  "No Significado mutation.",
  "No registry write.",
  "No Supabase.",
  "No SQL.",
  "No product API.",
  "No user-flow blocking.",
] as const;

export const CANONICAL_CATALOG_SHADOW_FIXTURE_IDS = [
  "resolve_existing_node",
  "resolve_missing_node",
  "resolve_existing_canonical_variable",
  "referenced_canonical_variable_not_defined",
  "validate_node_variable_map_valid",
  "validate_node_variable_map_missing_variable",
  "validate_existing_critical_route",
  "validate_missing_critical_route",
  "epistemic_policy_allows_confirmed_evidence",
  "epistemic_policy_blocks_unconfirmed_ai_as_hard_evidence",
  "vsm_guard_lookup",
] as const;

export type CanonicalCatalogShadowFixtureId =
  (typeof CANONICAL_CATALOG_SHADOW_FIXTURE_IDS)[number];

type FixtureDefinition = {
  fixtureId: CanonicalCatalogShadowFixtureId;
  label: string;
  input: CanonicalCatalogEvaluationInput;
  expectedReadinessState: CanonicalCatalogReadinessState;
  expectedResolved: boolean;
};

function baseInput(
  overrides: Partial<CanonicalCatalogEvaluationInput>,
): CanonicalCatalogEvaluationInput {
  return {
    mode: CANONICAL_CATALOG_SHADOW_MODE,
    queryType: "resolve_node",
    ...overrides,
  };
}

export const CANONICAL_CATALOG_SHADOW_FIXTURE_DEFINITIONS: FixtureDefinition[] = [];

function buildFixtureDefinitionsFromSnapshot(
  snapshot: ReturnType<typeof loadCanonicalCatalogShadowSnapshot>,
): FixtureDefinition[] {
  const node = Object.values(snapshot.sourceNodes)[0];
  const variable = Object.values(snapshot.canonicalVariables)[0];
  const validMap = snapshot.nodeVariableMap.find(
    (mapping) =>
      snapshot.sourceNodes[String(mapping.capture_node_id)] != null &&
      snapshot.canonicalVariables[String(mapping.canonical_variable_id)] != null,
  );
  const criticalRoute = Object.values(snapshot.criticalRoutes)[0];
  const vsmGuard = Object.values(snapshot.vsmPrepGuard)[0];
  const referencedGapVariable = snapshot.referencedCanonicalVariablesNotDefined[0];

  if (!node || !variable || !validMap || !criticalRoute || !vsmGuard || !referencedGapVariable) {
    throw new Error("Canonical catalog snapshot is missing required fixture anchors.");
  }

  return [
    {
      fixtureId: "resolve_existing_node",
      label: "Resolve existing node",
      input: baseInput({
        queryType: "resolve_node",
        nodeId: String(node.source_node_ref_id),
      }),
      expectedReadinessState: "catalog_lookup_ready",
      expectedResolved: true,
    },
    {
      fixtureId: "resolve_missing_node",
      label: "Resolve missing node",
      input: baseInput({ queryType: "resolve_node", nodeId: "B9_missing_node" }),
      expectedReadinessState: "catalog_lookup_not_found",
      expectedResolved: false,
    },
    {
      fixtureId: "resolve_existing_canonical_variable",
      label: "Resolve existing canonical variable",
      input: baseInput({
        queryType: "resolve_canonical_variable",
        variableId: String(variable.canonical_variable_id),
      }),
      expectedReadinessState: "catalog_lookup_ready",
      expectedResolved: true,
    },
    {
      fixtureId: "referenced_canonical_variable_not_defined",
      label: "Referenced canonical variable not defined",
      input: baseInput({
        queryType: "resolve_canonical_variable",
        variableId: referencedGapVariable,
      }),
      expectedReadinessState: "catalog_gap_detected",
      expectedResolved: false,
    },
    {
      fixtureId: "validate_node_variable_map_valid",
      label: "Validate node-variable map (valid)",
      input: baseInput({
        queryType: "validate_node_variable_map",
        nodeId: String(validMap.capture_node_id),
        variableId: String(validMap.canonical_variable_id),
      }),
      expectedReadinessState: "catalog_reference_valid",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_node_variable_map_missing_variable",
      label: "Validate node-variable map (missing variable)",
      input: baseInput({
        queryType: "validate_node_variable_map",
        nodeId: String(validMap.capture_node_id),
        variableId: "CV::missing_variable",
      }),
      expectedReadinessState: "catalog_reference_missing",
      expectedResolved: false,
    },
    {
      fixtureId: "validate_existing_critical_route",
      label: "Validate existing critical route",
      input: baseInput({
        queryType: "validate_critical_route",
        routeId: String(criticalRoute.critical_route_id),
      }),
      expectedReadinessState: "critical_route_found",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_missing_critical_route",
      label: "Validate missing critical route",
      input: baseInput({
        queryType: "validate_critical_route",
        routeId: "CR-MISSING",
      }),
      expectedReadinessState: "critical_route_missing",
      expectedResolved: false,
    },
    {
      fixtureId: "epistemic_policy_allows_confirmed_evidence",
      label: "Epistemic policy allows confirmed evidence",
      input: baseInput({
        queryType: "validate_epistemic_policy",
        policyId: "confirmed_evidence_allowed",
        evidenceRefs: ["D8"],
        context: { evidenceStatus: "confirmed" },
      }),
      expectedReadinessState: "epistemic_policy_allows",
      expectedResolved: true,
    },
    {
      fixtureId: "epistemic_policy_blocks_unconfirmed_ai_as_hard_evidence",
      label: "Epistemic policy blocks unconfirmed AI as hard evidence",
      input: baseInput({
        queryType: "validate_epistemic_policy",
        policyId: "unconfirmed_ai_hard_evidence",
        context: { evidenceStatus: "unconfirmed_ai", hardEvidenceRequested: true },
      }),
      expectedReadinessState: "epistemic_policy_blocks",
      expectedResolved: false,
    },
    {
      fixtureId: "vsm_guard_lookup",
      label: "VSM guard lookup",
      input: baseInput({
        queryType: "validate_vsm_guard",
        guardId: String(vsmGuard.vsm_rule_id ?? vsmGuard.code),
      }),
      expectedReadinessState: "catalog_lookup_ready",
      expectedResolved: true,
    },
  ];
}

export type CanonicalCatalogShadowHarnessFixture = FixtureDefinition & {
  actualReadinessState: CanonicalCatalogReadinessState;
  actualResolved: boolean;
  match: boolean;
  result: CanonicalCatalogEvaluationResult;
};

export type CanonicalCatalogShadowHarnessData = {
  chipId: typeof CANONICAL_CATALOG_SHADOW_CHIP_ID;
  mode: typeof CANONICAL_CATALOG_SHADOW_MODE;
  version: typeof CANONICAL_CATALOG_SHADOW_VERSION;
  status: typeof CANONICAL_CATALOG_SHADOW_STATUS;
  counters: typeof CANONICAL_CATALOG_HARNESS_COUNTERS;
  sourcePolicy: typeof CANONICAL_CATALOG_SOURCE_POLICY;
  livingGap: typeof CANONICAL_CATALOG_LIVING_GAP;
  noWiringLines: typeof CANONICAL_CATALOG_NO_WIRING_LINES;
  safetyFlags: typeof CANONICAL_CATALOG_SHADOW_SAFETY_FLAGS;
  runtimeAuthority: false;
  registryWrite: false;
  productWiring: false;
  fixtures: CanonicalCatalogShadowHarnessFixture[];
  allFixturesMatch: boolean;
};

export function buildCanonicalCatalogShadowHarness(): CanonicalCatalogShadowHarnessData {
  const snapshot = loadCanonicalCatalogShadowSnapshot();
  const fixtureDefinitions = buildFixtureDefinitionsFromSnapshot(snapshot);

  const fixtures = fixtureDefinitions.map((definition) => {
    const result = evaluateCanonicalCatalogShadowFromRepo(definition.input);
    const actualReadinessState = result.readinessState;
    const actualResolved = result.resolved;
    const match =
      definition.expectedReadinessState === actualReadinessState &&
      definition.expectedResolved === actualResolved;

    return {
      ...definition,
      actualReadinessState,
      actualResolved,
      match,
      result,
    };
  });

  return {
    chipId: CANONICAL_CATALOG_SHADOW_CHIP_ID,
    mode: CANONICAL_CATALOG_SHADOW_MODE,
    version: CANONICAL_CATALOG_SHADOW_VERSION,
    status: CANONICAL_CATALOG_SHADOW_STATUS,
    counters: CANONICAL_CATALOG_HARNESS_COUNTERS,
    sourcePolicy: CANONICAL_CATALOG_SOURCE_POLICY,
    livingGap: CANONICAL_CATALOG_LIVING_GAP,
    noWiringLines: CANONICAL_CATALOG_NO_WIRING_LINES,
    safetyFlags: CANONICAL_CATALOG_SHADOW_SAFETY_FLAGS,
    runtimeAuthority: false,
    registryWrite: false,
    productWiring: false,
    fixtures,
    allFixturesMatch: fixtures.every((fixture) => fixture.match),
  };
}
