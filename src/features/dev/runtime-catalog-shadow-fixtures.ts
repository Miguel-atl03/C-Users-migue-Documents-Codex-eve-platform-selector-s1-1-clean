import pureDomainTrace from "../../../docs/audits/_eve_04_runtime_catalog_shadow_mode_pure_domain_trace_v1.json";
import uiRequirements from "../../../docs/audits/_eve_04_runtime_catalog_future_ui_trace_requirements_v1.json";

export const RUNTIME_CATALOG_SHADOW_DEV_ROUTE = "/dev/runtime-catalog-shadow";
export const RUNTIME_CATALOG_SHADOW_DEV_STATUS = "SHADOW_READY_NOT_WIRED_WITH_NOTES";

type RuntimeCatalogTraceFixture = {
  fixtureId: string;
  inputSummary: Record<string, unknown>;
  expectedReadinessState: string;
  actualReadinessState: string;
  expectedResolved: boolean;
  actualResolved: boolean;
  match: boolean;
  safetyFlags: Record<string, boolean>;
  documentarySatisfaction: {
    status: string;
    mismatches: number;
    missingInChip: number;
    missingInSource: number;
    pendingSourceProof: number;
    protectedByStaticTests: boolean;
  };
  sourceTrace: unknown;
  gapFlags: string[];
  findingsCount: number;
  auditEventsCount: number;
};

export type RuntimeCatalogShadowVisualFixture = RuntimeCatalogTraceFixture & {
  queryType: string;
  resolvedEntity: string;
  missingReferences: string[];
  evidenceRefs: string[];
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  findings: { count: number };
  auditEvents: { count: number };
};

const blockedActions = [
  "block_user_flow",
  "modify_payload",
  "write_registry",
  "modify_catalog",
  "trigger_runtime",
  "trigger_diagnosis",
  "trigger_export",
  "connect_eve_brain",
  "mutate_workmap",
  "mutate_significado",
] as const;

const allowedActions = [
  "read_catalog",
  "return_shadow_trace",
  "report_gap",
  "request_missing_reference",
  "request_manual_review",
] as const;

function fixtureView(
  fixture: RuntimeCatalogTraceFixture,
): RuntimeCatalogShadowVisualFixture {
  return {
    ...fixture,
    queryType: String(fixture.inputSummary.queryType ?? ""),
    resolvedEntity: fixture.match ? "shadow trace resolved for fixture" : "not resolved",
    missingReferences: [],
    evidenceRefs: [],
    allowedActions: [...allowedActions],
    blockedActions: [...blockedActions],
    requiredInputs: [],
    findings: { count: fixture.findingsCount },
    auditEvents: { count: fixture.auditEventsCount },
  };
}

export function buildRuntimeCatalogShadowHarness() {
  const fixtures = (pureDomainTrace.fixtures as RuntimeCatalogTraceFixture[]).map(fixtureView);
  const counters = uiRequirements.mustDisplayCounters;

  return {
    route: RUNTIME_CATALOG_SHADOW_DEV_ROUTE,
    chipId: pureDomainTrace.chipId,
    mode: pureDomainTrace.mode,
    version: "0.2.0-shadow",
    status: RUNTIME_CATALOG_SHADOW_DEV_STATUS,
    summary: pureDomainTrace.summary,
    fixtures,
    fixturesRendered: fixtures.length,
    allFixturesMatch: fixtures.every((fixture) => fixture.match),
    counters: {
      baseInteractions: counters.totalBaseInteractions,
      causalInteractions: counters.totalCausalInteractions,
      uxSubfields: counters.totalUxSubfields,
      branchingRules: counters.totalBranchingRules,
      branchingScores: counters.totalBranchingScores,
      readinessStates: counters.totalReadinessStates,
      sourceNodesCoverage: counters.sourceNodesCoverage,
      sourceCodesCoverage: counters.sourceCodesCoverage,
      ccov001: counters.ccov001,
      cvar001: counters.cvar001,
    },
    documentarySatisfaction: fixtures[0]?.documentarySatisfaction ?? {
      status: "satisfactory",
      mismatches: 0,
      missingInChip: 0,
      missingInSource: 0,
      pendingSourceProof: 0,
      protectedByStaticTests: true,
    },
    safetyFlags: fixtures[0]?.safetyFlags ?? {
      canBlockUserFlow: false,
      canModifyPayload: false,
      canWriteRegistry: false,
      canModifyCatalog: false,
      canTriggerRuntime: false,
      canTriggerDiagnosis: false,
      canTriggerExport: false,
      canConnectEveBrain: false,
      runtimeAuthority: false,
    },
    sourceTrace: pureDomainTrace.commonSourceTrace,
    noWiringLines: [
      "No Runtime productivo.",
      "No WorkMap mutation.",
      "No Significado mutation.",
      "No registry write.",
      "No product API.",
      "No user-flow blocking.",
      "No EVE brain connection.",
    ],
  };
}
