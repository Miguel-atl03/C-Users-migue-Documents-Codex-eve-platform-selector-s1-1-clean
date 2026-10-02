"use client";

import { useMemo, useState } from "react";
import {
  evaluateGateEngineShadow,
  GATE_ENGINE_DOCUMENTARY_SATISFACTION,
  GATE_ENGINE_PROTECTED_METADATA,
  GATE_ENGINE_SAFETY_FLAGS,
  GATE_ENGINE_SHADOW_CHIP_ID,
  GATE_ENGINE_SHADOW_FIXTURES,
  GATE_ENGINE_SHADOW_MODE,
  GATE_ENGINE_SHADOW_VERSION,
} from "@/domain/eve-gate-engine-shadow";
import type { GateEngineEvaluationInput } from "@/domain/eve-gate-engine-shadow";

const noCableadoStatus = {
  runtimeAuthority: false,
  registryWrite: false,
  productWiring: false,
  eveBrainConnection: false,
};

const displayMode = "gate_engine_shadow";

const safetyRailKeys = [
  "canBlockUserFlow",
  "canModifyPayload",
  "canWriteRegistry",
  "canModifyCatalog",
  "canTriggerRuntime",
  "canTriggerDiagnosis",
  "canTriggerExport",
  "canConnectEveBrain",
  "runtimeAuthority",
] as const;

const fixtureIds = [
  "resolve_existing_gate",
  "resolve_missing_gate",
  "resolve_existing_rule",
  "validate_critical_route_gate_valid",
  "validate_semantic_resolution_gate_valid",
  "validate_process_state_timer_gate_valid",
  "validate_mmabp_conformance_gate_valid",
  "validate_mmabp_consistency_gate_valid",
  "validate_failure_guard_valid",
  "validate_atomic_rule_source_proof",
  "validate_no_overreach_d1_vsm1_ahe1",
  "validate_no_runtime_authority",
] as const;

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="eve05-ge-json-block">
      <h2>{label}</h2>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}

function StateTile({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean;
}) {
  const text = String(value);
  const tone = text === "false" ? "safe" : text === "true" ? "notice" : "plain";

  return (
    <div className={`eve05-ge-state-tile ${tone}`}>
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function MatchBadge({ match }: { match: boolean }) {
  return (
    <span className={`eve05-ge-match-badge ${match ? "match" : "mismatch"}`}>
      match: {String(match)}
    </span>
  );
}

function CompactList({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="eve05-ge-list-panel">
      <h2>{label}</h2>
      <ul>
        {items.length === 0 ? (
          <li>none</li>
        ) : (
          items.map((item) => <li key={item}>{item}</li>)
        )}
      </ul>
    </section>
  );
}

export function Eve05GateEngineShadowHarness() {
  const [selectedFixture, setSelectedFixture] = useState<(typeof fixtureIds)[number]>(
    "resolve_existing_gate",
  );

  const traceCases = useMemo(
    () =>
      GATE_ENGINE_SHADOW_FIXTURES.map((fixture) => {
        const actual = evaluateGateEngineShadow(fixture.input);
        return {
          fixture,
          actual,
          match:
            fixture.expectedReadinessState === actual.readinessState &&
            fixture.expectedResolved === actual.resolved,
        };
      }),
    [],
  );

  const selectedTrace =
    traceCases.find((item) => item.fixture.fixtureId === selectedFixture) ?? traceCases[0];

  const input: GateEngineEvaluationInput = selectedTrace.fixture.input;
  const output = selectedTrace.actual;
  const moduleCounts = GATE_ENGINE_PROTECTED_METADATA.moduleCounts;

  return (
    <main className="eve05-ge-page">
      <div className="eve05-ge-shell">
        <header className="eve05-ge-header">
          <div>
            <p className="eve05-ge-kicker">DEV HARNESS ONLY</p>
            <h1>EVE-05 Gate Engine Shadow Harness</h1>
            <p className="eve05-ge-warning">candidate not wired</p>
            <p className="eve05-ge-subtitle">
              documentary satisfaction: {GATE_ENGINE_DOCUMENTARY_SATISFACTION.status}
            </p>
          </div>
          <dl className="eve05-ge-state-grid">
            <StateTile label="chipId" value={GATE_ENGINE_SHADOW_CHIP_ID} />
            <StateTile label="mode" value={displayMode} />
            <StateTile label="version" value={GATE_ENGINE_SHADOW_VERSION} />
            <StateTile label="status" value="candidate not wired" />
            <StateTile label="runtimeAuthority" value={noCableadoStatus.runtimeAuthority} />
            <StateTile label="registryWrite" value={noCableadoStatus.registryWrite} />
            <StateTile label="productWiring" value={noCableadoStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={noCableadoStatus.eveBrainConnection} />
          </dl>
        </header>

        <section className="eve05-ge-section">
          <div className="eve05-ge-section-heading">
            <h2>Fixtures</h2>
            <span>12 trace cases</span>
          </div>
          <div className="eve05-ge-fixture-selector" aria-label="Fixture selector">
            {fixtureIds.map((fixtureId) => (
              <button
                className={fixtureId === selectedFixture ? "selected" : ""}
                key={fixtureId}
                onClick={() => setSelectedFixture(fixtureId)}
                type="button"
              >
                {fixtureId}
              </button>
            ))}
          </div>
        </section>

        <section className="eve05-ge-two-column">
          <div className="eve05-ge-card">
            <div className="eve05-ge-section-heading">
              <h2>Input</h2>
              <span>{selectedFixture}</span>
            </div>
            <dl className="eve05-ge-state-grid compact">
              <StateTile label="selectedFixture" value={selectedFixture} />
              <StateTile label="queryType" value={input.queryType} />
              <StateTile label="gateId" value={input.gateId ?? "none"} />
              <StateTile label="ruleId" value={input.ruleId ?? "none"} />
              <StateTile label="module" value={input.module ?? "none"} />
              <StateTile label="sourceDocumentId" value={input.sourceDocumentId ?? "none"} />
            </dl>
            <JsonBlock label="evidenceRefs" value={input.evidenceRefs ?? []} />
            <JsonBlock label="sourceTrace" value={input.sourceTrace ?? selectedTrace.fixture.sourceTrace ?? []} />
          </div>

          <div className="eve05-ge-card">
            <div className="eve05-ge-section-heading">
              <h2>Output</h2>
              <MatchBadge match={selectedTrace.match} />
            </div>
            <dl className="eve05-ge-state-grid compact">
              <StateTile label="readinessState" value={output.readinessState} />
              <StateTile label="resolved" value={output.resolved} />
              <StateTile
                label="expectedReadinessState"
                value={selectedTrace.fixture.expectedReadinessState}
              />
              <StateTile label="actualReadinessState" value={output.readinessState} />
              <StateTile
                label="expectedResolved"
                value={selectedTrace.fixture.expectedResolved}
              />
              <StateTile label="actualResolved" value={output.resolved} />
            </dl>
            <JsonBlock label="resolvedEntity" value={output.resolvedEntity} />
            <JsonBlock label="documentarySatisfaction" value={output.documentarySatisfaction} />
          </div>
        </section>

        <section className="eve05-ge-two-column">
          <JsonBlock label="missingReferences" value={output.missingReferences} />
          <JsonBlock label="gapFlags" value={output.gapFlags} />
          <JsonBlock label="allowedActions" value={output.allowedActions} />
          <JsonBlock label="blockedActions" value={output.blockedActions} />
          <JsonBlock label="requiredInputs" value={output.requiredInputs} />
          <JsonBlock label="findings" value={output.findings} />
          <JsonBlock label="auditEvents" value={output.auditEvents} />
          <JsonBlock label="safetyFlags" value={output.safetyFlags} />
        </section>

        <section className="eve05-ge-section">
          <div className="eve05-ge-section-heading">
            <h2>MATCH expected/actual</h2>
            <span>all fixtures</span>
          </div>
          <div className="eve05-ge-match-table">
            {traceCases.map((item) => (
              <article key={item.fixture.fixtureId}>
                <div>
                  <h3>{item.fixture.fixtureId}</h3>
                  <p>{item.fixture.input.queryType}</p>
                </div>
                <StateTile
                  label="expectedReadinessState"
                  value={item.fixture.expectedReadinessState}
                />
                <StateTile label="actualReadinessState" value={item.actual.readinessState} />
                <StateTile label="expectedResolved" value={item.fixture.expectedResolved} />
                <StateTile label="actualResolved" value={item.actual.resolved} />
                <MatchBadge match={item.match} />
              </article>
            ))}
          </div>
        </section>

        <section className="eve05-ge-section">
          <div className="eve05-ge-section-heading">
            <h2>Protected counters</h2>
            <span>satisfactory</span>
          </div>
          <dl className="eve05-ge-state-grid counters">
            <StateTile
              label="critical_route_gate"
              value={`${moduleCounts.critical_route_gate.routes} rutas / ${moduleCounts.critical_route_gate.rules} reglas`}
            />
            <StateTile
              label="semantic_resolution_gate"
              value={`${moduleCounts.semantic_resolution_gate.gates} gates / ${moduleCounts.semantic_resolution_gate.rules} reglas`}
            />
            <StateTile
              label="process_state_timer_gate"
              value={`${moduleCounts.process_state_timer_gate.gates} gates / ${moduleCounts.process_state_timer_gate.rules} reglas`}
            />
            <StateTile
              label="mmabp_conformance_gate"
              value={`${moduleCounts.mmabp_conformance_gate.engineRules} engine rules / ${moduleCounts.mmabp_conformance_gate.modelRules} model rules`}
            />
            <StateTile
              label="mmabp_consistency_gate"
              value={`${moduleCounts.mmabp_consistency_gate.engineRules} engine rules / ${moduleCounts.mmabp_consistency_gate.methodRules} method rules / ${moduleCounts.mmabp_consistency_gate.compartments} compartments`}
            />
            <StateTile label="failure_guards" value={moduleCounts.failure_guards} />
            <StateTile
              label="atomic_rules_and_gate_definitions"
              value={moduleCounts.atomic_rules_and_gate_definitions}
            />
            <StateTile
              label="companion proofs"
              value={`${GATE_ENGINE_DOCUMENTARY_SATISFACTION.companionProofsAccepted}/${GATE_ENGINE_DOCUMENTARY_SATISFACTION.companionProofsExpected}`}
            />
            <StateTile
              label="atomic rules proof"
              value={`${GATE_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesAccepted}/${GATE_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesExpected}`}
            />
            <StateTile
              label="previous rejected rules repaired"
              value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.previousRejectedUniqueRulesRepaired}
            />
            <StateTile
              label="previous rejected records repaired"
              value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.previousRejectedRecordsRepaired}
            />
            <StateTile label="mismatches" value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.mismatches} />
            <StateTile label="missingInChip" value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.missingInChip} />
            <StateTile
              label="missingInSource"
              value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.missingInSource}
            />
            <StateTile
              label="pendingSourceProof"
              value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.pendingSourceProof}
            />
            <StateTile
              label="overreachDetected"
              value={GATE_ENGINE_DOCUMENTARY_SATISFACTION.overreachDetected}
            />
          </dl>
        </section>

        <section className="eve05-ge-section">
          <div className="eve05-ge-section-heading">
            <h2>Safety rail visual</h2>
            <span>read-only</span>
          </div>
          <dl className="eve05-ge-state-grid counters">
            {safetyRailKeys.map((key) => (
              <StateTile key={key} label={key} value={GATE_ENGINE_SAFETY_FLAGS[key]} />
            ))}
            <StateTile label="registryWrite" value={noCableadoStatus.registryWrite} />
            <StateTile label="productWiring" value={noCableadoStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={noCableadoStatus.eveBrainConnection} />
          </dl>
        </section>

        <section className="eve05-ge-two-column">
          <CompactList label="sourceTrace" items={output.sourceTrace} />
          <CompactList label="evidenceRefs" items={output.evidenceRefs} />
        </section>
      </div>
    </main>
  );
}
