import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EVE_ORGANISM_CAPABILITY_POLICIES,
  EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_MODE,
  EVE_ORGANISM_NO_CABLEADO_ATTESTATION,
  runEveOrganismCompositionRootShadow,
} from "../../src/services/eve-organism-composition-root-shadow.ts";
import type { EveOrganismShadowCommand } from "../../src/types/eve-organism-composition-root.ts";

const implementationFiles = [
  "src/types/eve-organism-composition-root.ts",
  "src/services/eve-organism-composition-root-shadow.ts",
];

test("assembles the EVE organism composition root shadow circuit without productive authority", () => {
  const result = runEveOrganismCompositionRootShadow(baseCommand(), {
    clock: { nowIso: () => "2026-06-24T12:00:00.000Z" },
  });

  assert.equal(EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_MODE, "offline_no_productive_authority");
  assert.equal(result.accepted, true);
  assert.equal(result.status, "SHADOW_ACCEPTED");
  assert.deepEqual(result.blockers, []);
  assert.equal(result.producedCandidates.length, 8);
  assert.deepEqual(
    result.producedCandidates.map((candidate) => candidate.kind),
    [
      "RuntimeCommand",
      "ActivityRuntimeRun",
      "EvidenceItem",
      "CanonicalVariableRecord",
      "GateDecision",
      "StructuralCandidateRecord",
      "ReadinessDecision",
      "ParallelCandidate",
    ],
  );
  assert.equal(result.trace.length, 10);
  assert.deepEqual(result.noCableadoAttestation, EVE_ORGANISM_NO_CABLEADO_ATTESTATION);
  assert.equal(result.auditRecord.noCableadoAttestation.productionAuthorityGranted, false);
  assert.equal(result.capabilityStateDecision.effectiveState, "SHADOW");
  assert.equal(result.capabilityStateDecision.productiveActivationGranted, false);
  assert.equal(result.nextRecommendedGate, "confirm_supervision_preconditions");
});

test("blocks every explicit no-go side effect with stable blocker ids", () => {
  const cases = [
    ["registryWrite", "OCR-BLK-003"],
    ["finalExport", "OCR-BLK-004"],
    ["diagnosis", "OCR-BLK-005"],
    ["productiveRuntimeAuthority", "OCR-BLK-006"],
    ["databaseWrite", "OCR-BLK-007"],
    ["uiExposure", "OCR-BLK-008"],
  ] as const;

  for (const [capability, blockerId] of cases) {
    const result = runEveOrganismCompositionRootShadow(
      baseCommand({ requestedCapability: capability }),
    );

    assert.equal(result.accepted, false, capability);
    assert.equal(result.status, "SHADOW_QUARANTINED", capability);
    assert.equal(result.blockers.some((blocker) => blocker.id === blockerId), true, capability);
    assert.equal(result.producedCandidates.length, 0, capability);
    assert.equal(result.noCableadoAttestation.registryWritten, false, capability);
    assert.equal(result.noCableadoAttestation.exportProduced, false, capability);
    assert.equal(result.noCableadoAttestation.dbWritten, false, capability);
  }
});

test("emits required blockers for context, dryRun, override, active state, ids and provenance", () => {
  const result = runEveOrganismCompositionRootShadow({
    ...baseCommand({
      tenantId: "",
      sessionId: "",
      activityId: "",
      requestedCapability: "unknownCapability",
      requestedState: "ACTIVE",
      overrideRequested: true,
      overrideAudited: false,
      idempotencyKey: "",
      correlationId: "",
      evidenceInputs: [{ evidenceId: "ev-missing", kind: "note", summary: "missing provenance" }],
      candidateInputs: [{ candidateId: "cand-missing", kind: "candidate", summary: "missing source" }],
    }),
    dryRun: false,
  } as unknown as EveOrganismShadowCommand);

  const ids = result.blockers.map((blocker) => blocker.id);
  assert.equal(ids.includes("OCR-BLK-001"), true);
  assert.equal(ids.includes("OCR-BLK-002"), true);
  assert.equal(ids.includes("OCR-BLK-009"), true);
  assert.equal(ids.includes("OCR-BLK-010"), true);
  assert.equal(ids.includes("OCR-BLK-011"), true);
  assert.equal(ids.includes("OCR-BLK-012"), true);
  assert.equal(ids.includes("OCR-BLK-013"), true);
  assert.equal(ids.includes("OCR-BLK-014"), true);
  assert.equal(result.status, "SHADOW_QUARANTINED");
  assert.equal(result.capabilityStateDecision.effectiveState, "QUARANTINED");
});

test("downgrades gateEnforcement to advisory and never grants enforcement authority", () => {
  const result = runEveOrganismCompositionRootShadow(
    baseCommand({ requestedCapability: "gateEnforcement" }),
  );

  assert.equal(result.accepted, true);
  assert.equal(result.capabilityStateDecision.capabilityMode, "shadow_advisory");
  assert.equal(result.capabilityStateDecision.productiveActivationGranted, false);
  assert.equal(result.warnings.some((warning) => warning.id === "OCR-WRN-001"), true);
  assert.equal(EVE_ORGANISM_CAPABILITY_POLICIES.gateEnforcement.productiveAuthority, false);
});

test("implementation remains isolated from UI, DB, registry/export wiring and real clocks", () => {
  const source = implementationFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    /createClient/i,
    /@supabase/i,
    /\bsupabase\./i,
    /\bfrom\(/i,
    /\binsert\(/i,
    /\bupdate\(/i,
    /\bdelete\(/i,
    /\bfetch\(/i,
    /localStorage/i,
    /sessionStorage/i,
    /process\.env/i,
    /Date\.now/i,
    /Math\.random/i,
    /src\/app/i,
    /src\/components/i,
    /app\//i,
    /components\//i,
    /route\.ts/i,
    /page\.tsx/i,
    /runtimeConnected:\s*true/i,
    /shadowActivated:\s*true/i,
    /registryWritten:\s*true/i,
    /exportProduced:\s*true/i,
    /diagnosisEnabled:\s*true/i,
    /dbWritten:\s*true/i,
    /uiTouched:\s*true/i,
    /productionAuthorityGranted:\s*true/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

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
