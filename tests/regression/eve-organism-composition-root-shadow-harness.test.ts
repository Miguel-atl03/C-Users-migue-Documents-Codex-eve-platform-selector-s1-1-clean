import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EVE_ORGANISM_CAPABILITY_POLICIES,
  runEveOrganismCompositionRootShadow,
} from "../../src/services/eve-organism-composition-root-shadow.ts";
import type {
  EveOrganismCapability,
  EveOrganismCapabilityState,
  EveOrganismNoCableadoAttestation,
  EveOrganismShadowBlockerId,
  EveOrganismShadowCommand,
  EveOrganismShadowResult,
} from "../../src/types/eve-organism-composition-root.ts";

type HarnessScenario = {
  id: string;
  category: "happy_path" | "productive_blocker" | "context" | "state" | "no_cableado";
  description: string;
  command: EveOrganismShadowCommand;
  expect: (result: EveOrganismShadowResult) => void;
};

const allFalseNoCableado: EveOrganismNoCableadoAttestation = {
  runtimeConnected: false,
  shadowActivated: false,
  registryWritten: false,
  exportProduced: false,
  diagnosisEnabled: false,
  dbWritten: false,
  uiTouched: false,
  productionAuthorityGranted: false,
};

const shadowAdvisoryCapabilities: EveOrganismCapability[] = [
  "runtimeCapture",
  "gateAdvisory",
  "gateEnforcement",
  "objectBinding",
  "outboxPublish",
  "governanceObserve",
  "candidateGeneration",
];

const blockedCapabilities: EveOrganismCapability[] = [
  "humanRelease",
  "registryWrite",
  "finalExport",
  "parallelExecution",
  "diagnosis",
  "productiveRuntimeAuthority",
  "uiExposure",
  "databaseWrite",
];

const expectedPhases = [
  "ClientIntent",
  "RuntimeCommand",
  "ActivityRuntimeRun",
  "EvidenceItem",
  "CanonicalVariableRecord",
  "GateDecision",
  "StructuralCandidateRecord",
  "ReadinessDecision",
  "ParallelCandidate",
  "AuditShadowRecord",
];

const scenarios: HarnessScenario[] = [
  ...shadowAdvisoryCapabilities.map((capability, index) =>
    scenario(`A-${String(index + 1).padStart(2, "0")}`, `${capability} accepted as shadow/advisory`, {
      requestedCapability: capability,
    }, (result) => {
      assert.equal(result.accepted, true);
      assert.equal(result.status, "SHADOW_ACCEPTED");
      assert.equal(result.capabilityStateDecision.capabilityMode, "shadow_advisory");
      assert.equal(result.capabilityStateDecision.productiveActivationGranted, false);
      if (capability === "gateEnforcement") {
        assert.equal(result.warnings.some((warning) => warning.id === "OCR-WRN-001"), true);
      }
    }),
  ),
  scenario("A-08", "full circuit produces all 10 trace phases", {}, (result) => {
    assert.deepEqual(result.trace.map((event) => event.phase), expectedPhases);
  }),
  scenario("A-09", "produced candidates preserve source references", {}, (result) => {
    assert.equal(result.producedCandidates.length, 8);
    for (const candidate of result.producedCandidates) {
      assert.equal(candidate.shadowOnly, true);
      assert.equal(candidate.sourceRefs.includes("candidate-001"), true);
      assert.equal(candidate.sourceRefs.includes("evidence-001"), true);
    }
  }),
  scenario("A-10", "trace sequence is monotonic and preserves correlationId", {}, (result) => {
    assert.deepEqual(result.trace.map((event) => event.sequence), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(result.trace.every((event) => event.correlationId === "corr-001"), true);
  }),
  scenario("B-11", "registryWrite triggers OCR-BLK-003", { requestedCapability: "registryWrite" }, expectBlocker("OCR-BLK-003")),
  scenario("B-12", "finalExport triggers OCR-BLK-004", { requestedCapability: "finalExport" }, expectBlocker("OCR-BLK-004")),
  scenario("B-13", "diagnosis triggers OCR-BLK-005", { requestedCapability: "diagnosis" }, expectBlocker("OCR-BLK-005")),
  scenario(
    "B-14",
    "productiveRuntimeAuthority triggers OCR-BLK-006",
    { requestedCapability: "productiveRuntimeAuthority" },
    expectBlocker("OCR-BLK-006"),
  ),
  scenario("B-15", "databaseWrite triggers OCR-BLK-007", { requestedCapability: "databaseWrite" }, expectBlocker("OCR-BLK-007")),
  scenario("B-16", "uiExposure triggers OCR-BLK-008", { requestedCapability: "uiExposure" }, expectBlocker("OCR-BLK-008")),
  scenario("B-17", "humanRelease is blocked", { requestedCapability: "humanRelease" }, expectBlocker("OCR-BLK-015")),
  scenario("B-18", "parallelExecution is blocked", { requestedCapability: "parallelExecution" }, expectBlocker("OCR-BLK-015")),
  scenario(
    "B-19",
    "forbidden side effect triggers OCR-BLK-015",
    { forbiddenSideEffects: { parallelExecution: true } },
    expectBlocker("OCR-BLK-015"),
  ),
  scenario("C-20", "missing tenant/session/activity triggers OCR-BLK-001", { tenantId: "", sessionId: "", activityId: "" }, expectBlocker("OCR-BLK-001")),
  scenario("C-21", "dryRun=false triggers OCR-BLK-002", { dryRun: false as true }, expectBlocker("OCR-BLK-002")),
  scenario("C-22", "missing idempotencyKey triggers OCR-BLK-012", { idempotencyKey: "" }, expectBlocker("OCR-BLK-012")),
  scenario("C-23", "missing correlationId triggers OCR-BLK-012", { correlationId: "" }, expectBlocker("OCR-BLK-012")),
  scenario(
    "C-24",
    "evidence without provenance triggers OCR-BLK-013",
    { evidenceInputs: [{ evidenceId: "evidence-no-provenance", kind: "rector", summary: "missing provenance" }] },
    expectBlocker("OCR-BLK-013", "SHADOW_DEGRADED"),
  ),
  scenario(
    "C-25",
    "candidate without sourceTrace triggers OCR-BLK-014",
    { candidateInputs: [{ candidateId: "candidate-no-source", kind: "wiring-map", summary: "missing source trace" }] },
    expectBlocker("OCR-BLK-014", "SHADOW_DEGRADED"),
  ),
  scenario(
    "C-26",
    "override requested but not audited triggers OCR-BLK-009",
    { overrideRequested: true, overrideAudited: false },
    expectBlocker("OCR-BLK-009"),
  ),
  scenario("C-27", "override audited does not trigger OCR-BLK-009", { overrideRequested: true, overrideAudited: true }, (result) => {
    assert.equal(result.accepted, true);
    assert.equal(result.blockers.some((blocker) => blocker.id === "OCR-BLK-009"), false);
  }),
  scenario("D-28", "requestedState ACTIVE triggers OCR-BLK-010", { requestedState: "ACTIVE" }, expectBlocker("OCR-BLK-010")),
  scenario("D-29", "CONTROLLED_ACTIVE does not activate productively", { requestedState: "CONTROLLED_ACTIVE" }, (result) => {
    assert.equal(result.accepted, true);
    assert.equal(result.capabilityStateDecision.effectiveState, "SHADOW");
    assert.equal(result.capabilityStateDecision.productiveActivationGranted, false);
  }),
  scenario("D-30", "SUPERVISED returns recommendation only", { requestedState: "SUPERVISED" }, (result) => {
    assert.equal(result.accepted, true);
    assert.equal(result.capabilityStateDecision.effectiveState, "SHADOW");
    assert.equal(result.capabilityStateDecision.recommendation, "SUPERVISED");
    assert.equal(result.capabilityStateDecision.productiveActivationGranted, false);
  }),
  scenario("D-31", "critical blocker moves result to quarantine", { requestedCapability: "databaseWrite" }, (result) => {
    assert.equal(result.status, "SHADOW_QUARANTINED");
    assert.equal(result.capabilityStateDecision.effectiveState, "QUARANTINED");
  }),
  scenario(
    "D-32",
    "non-critical provenance issue degrades result",
    { evidenceInputs: [{ evidenceId: "evidence-warning", kind: "rector", summary: "missing provenance" }] },
    (result) => {
      assert.equal(result.status, "SHADOW_DEGRADED");
      assert.equal(result.capabilityStateDecision.effectiveState, "DEGRADED");
    },
  ),
  scenario("D-33", "unknown capability triggers OCR-BLK-011", { requestedCapability: "unknownCapability" }, expectBlocker("OCR-BLK-011")),
  scenario("D-34", "OFF to VALIDATED is allowed", { currentState: "OFF", requestedState: "VALIDATED" }, (result) => {
    assert.equal(result.capabilityStateDecision.effectiveState, "VALIDATED");
  }),
  scenario("D-35", "VALIDATED to SHADOW is allowed", { currentState: "VALIDATED", requestedState: "SHADOW" }, (result) => {
    assert.equal(result.capabilityStateDecision.effectiveState, "SHADOW");
  }),
  scenario("D-36", "ROLLBACK_IN_PROGRESS does not produce side effects", { requestedState: "ROLLBACK_IN_PROGRESS" }, (result) => {
    assert.equal(result.accepted, true);
    assert.equal(result.capabilityStateDecision.effectiveState, "SHADOW");
    assert.deepEqual(result.noCableadoAttestation, allFalseNoCableado);
  }),
  scenario("D-37", "REVOKED does not produce side effects", { requestedState: "REVOKED" }, (result) => {
    assert.equal(result.accepted, true);
    assert.equal(result.capabilityStateDecision.effectiveState, "SHADOW");
    assert.deepEqual(result.noCableadoAttestation, allFalseNoCableado);
  }),
  scenario("E-38", "audit record preserves identity and idempotency fields", {}, (result) => {
    assert.equal(result.auditRecord.commandId, "cmd-composition-root-shadow-001");
    assert.equal(result.auditRecord.tenantId, "tenant-001");
    assert.equal(result.auditRecord.sessionId, "session-001");
    assert.equal(result.auditRecord.activityId, "activity-001");
    assert.equal(result.auditRecord.correlationId, "corr-001");
    assert.equal(result.auditRecord.idempotencyKey, "idem-001");
  }),
  scenario("E-39", "every trace contains blocker ids when blocked", { requestedCapability: "registryWrite" }, (result) => {
    assert.equal(result.trace.every((event) => event.blockerIds.includes("OCR-BLK-003")), true);
  }),
  scenario("E-40", "output never exposes final export, registry write or diagnosis objects", {}, (result) => {
    const serialized = JSON.stringify(result);
    assert.doesNotMatch(serialized, /finalExportObject|registryWriteObject|diagnosisResult/i);
  }),
];

test("harness executes at least 30 controlled scenarios", () => {
  assert.equal(scenarios.length >= 30, true);
});

for (const item of scenarios) {
  test(`${item.id}: ${item.description}`, () => {
    const result = runEveOrganismCompositionRootShadow(item.command, {
      clock: { nowIso: () => "2026-06-24T12:00:00.000Z" },
    });

    assert.deepEqual(result.noCableadoAttestation, allFalseNoCableado);
    assert.deepEqual(result.auditRecord.noCableadoAttestation, allFalseNoCableado);
    assert.equal(result.noCableadoAttestation.runtimeConnected, false);
    assert.equal(result.noCableadoAttestation.shadowActivated, false);
    assert.equal(result.noCableadoAttestation.registryWritten, false);
    assert.equal(result.noCableadoAttestation.exportProduced, false);
    assert.equal(result.noCableadoAttestation.diagnosisEnabled, false);
    assert.equal(result.noCableadoAttestation.dbWritten, false);
    assert.equal(result.noCableadoAttestation.uiTouched, false);
    assert.equal(result.noCableadoAttestation.productionAuthorityGranted, false);
    item.expect(result);
  });
}

test("all required blockers and capabilities are represented by harness scenarios", () => {
  const source = scenarios.map((item) => `${item.id} ${item.description} ${JSON.stringify(item.command)}`).join("\n");

  for (const blocker of [
    "OCR-BLK-001",
    "OCR-BLK-002",
    "OCR-BLK-003",
    "OCR-BLK-004",
    "OCR-BLK-005",
    "OCR-BLK-006",
    "OCR-BLK-007",
    "OCR-BLK-008",
    "OCR-BLK-009",
    "OCR-BLK-010",
    "OCR-BLK-011",
    "OCR-BLK-012",
    "OCR-BLK-013",
    "OCR-BLK-014",
    "OCR-BLK-015",
  ]) {
    assert.match(source, new RegExp(blocker));
  }

  for (const capability of [...shadowAdvisoryCapabilities, ...blockedCapabilities]) {
    assert.equal(EVE_ORGANISM_CAPABILITY_POLICIES[capability].productiveAuthority, false);
  }
});

test("harness and implementation have no forbidden imports or productive side effects", () => {
  const sourceByFile = [
    "tests/regression/eve-organism-composition-root-shadow-harness.test.ts",
    "src/types/eve-organism-composition-root.ts",
    "src/services/eve-organism-composition-root-shadow.ts",
  ]
    .map((file) => ({ file, source: readFileSync(file, "utf8") }));
  const importLines = sourceByFile
    .flatMap(({ source }) => source.split(/\r?\n/))
    .filter((line) => line.trim().startsWith("import "))
    .join("\n");
  const implementationSource = sourceByFile
    .filter(({ file }) => file !== "tests/regression/eve-organism-composition-root-shadow-harness.test.ts")
    .map(({ source }) => source)
    .join("\n");

  for (const forbidden of [
    /from\s+["'].*src\/app/i,
    /from\s+["'].*app\//i,
    /from\s+["'].*components\//i,
    /from\s+["'].*docs\/chips/i,
    /from\s+["'].*docs\/runtime/i,
    /@supabase/i,
    /createClient/i,
  ]) {
    assert.doesNotMatch(importLines, forbidden);
  }

  for (const forbidden of [
    /\bsupabase\./i,
    /\bfetch\(/i,
    /\bSQL\b/i,
    /process\.env/i,
    /registryWritten:\s*true/i,
    /exportProduced:\s*true/i,
    /diagnosisEnabled:\s*true/i,
    /dbWritten:\s*true/i,
    /uiTouched:\s*true/i,
    /productionAuthorityGranted:\s*true/i,
  ]) {
    assert.doesNotMatch(implementationSource, forbidden);
  }
});

function scenario(
  id: string,
  description: string,
  overrides: Partial<EveOrganismShadowCommand>,
  expect: HarnessScenario["expect"],
): HarnessScenario {
  return {
    id,
    category: id.startsWith("A")
      ? "happy_path"
      : id.startsWith("B")
        ? "productive_blocker"
        : id.startsWith("C")
          ? "context"
          : id.startsWith("D")
            ? "state"
            : "no_cableado",
    description,
    command: baseCommand(overrides),
    expect,
  };
}

function expectBlocker(
  blockerId: EveOrganismShadowBlockerId,
  status: EveOrganismShadowResult["status"] = "SHADOW_QUARANTINED",
) {
  return (result: EveOrganismShadowResult) => {
    assert.equal(result.accepted, false);
    assert.equal(result.status, status);
    assert.equal(result.blockers.some((blocker) => blocker.id === blockerId), true);
    assert.equal(result.trace.every((event) => event.blockerIds.includes(blockerId)), true);
    if (status === "SHADOW_QUARANTINED") {
      assert.equal(result.producedCandidates.length, 0);
    }
  };
}

function baseCommand(overrides: Partial<EveOrganismShadowCommand> = {}): EveOrganismShadowCommand {
  return {
    commandId: "cmd-composition-root-shadow-001",
    tenantId: "tenant-001",
    organizationId: "org-001",
    sessionId: "session-001",
    activityId: "activity-001",
    actorId: "actor-001",
    requestedCapability: "runtimeCapture",
    requestedState: "SHADOW",
    currentState: "VALIDATED",
    clientIntent: {
      intentId: "intent-001",
      label: "Validate EVE organism shadow circuit",
      requestedAction: "assemble-shadow-circuit",
    },
    evidenceInputs: [
      {
        evidenceId: "evidence-001",
        kind: "rector",
        summary: "Controlled activation contract installed.",
        provenance: {
          sourceId: "EVE_ORGANISM_CONTROLLED_ACTIVATION_CONTRACT_V1",
          sourcePath:
            "docs/organism/activation-and-wiring/EVE_ORGANISM_ACTIVATION_AND_WIRING_V1/EVE_ORGANISM_CONTROLLED_ACTIVATION_CONTRACT_V1.json",
        },
      },
    ],
    candidateInputs: [
      {
        candidateId: "candidate-001",
        kind: "wiring-map",
        summary: "Authority map supports shadow-only assembly.",
        sourceTrace: ["EVE_ORGANISM_WIRING_AND_AUTHORITY_MAP_V1"],
      },
    ],
    overrideRequested: false,
    overrideAudited: false,
    idempotencyKey: "idem-001",
    correlationId: "corr-001",
    dryRun: true,
    ...overrides,
  };
}
