"use client";

import { useMemo, useState } from "react";
import {
  evaluateExecutionEngineShadow,
  EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION,
  EXECUTION_ENGINE_PROTECTED_METADATA,
  EXECUTION_ENGINE_SAFETY_FLAGS,
  EXECUTION_ENGINE_SHADOW_CHIP_ID,
  EXECUTION_ENGINE_SHADOW_FIXTURES,
  EXECUTION_ENGINE_SHADOW_MODE,
  EXECUTION_ENGINE_SHADOW_VERSION,
} from "@/domain/eve-execution-engine-shadow";
import type { ExecutionEngineEvaluationInput } from "@/domain/eve-execution-engine-shadow";

const noCableadoStatus = {
  runtimeAuthority: false,
  registryWrite: false,
  productWiring: false,
  eveBrainConnection: false,
  diagnosisEnabled: false,
  exportEnabled: false,
  sqlEnabled: false,
  supabaseWrite: false,
};

const displayMode = "execution_engine_shadow";

const fixtureIds = [
  "resolve_activity_runtime_run",
  "resolve_interaction_instance",
  "resolve_response_ingest",
  "resolve_evidence_item",
  "resolve_canonical_variable_record",
  "resolve_structural_candidate_record",
  "validate_record_schema_valid",
  "validate_required_fields_valid",
  "validate_lifecycle_valid",
  "validate_source_role_valid",
  "validate_evidence_trace_valid",
  "validate_structural_candidate_dependency_d8_gate",
  "validate_no_runtime_authority",
  "validate_no_registry_write_no_diagnosis_no_export",
  "detect_missing_record",
  "detect_missing_source_trace",
] as const;

const safetyRailKeys = [
  "canBlockUserFlow",
  "canModifyPayload",
  "canWriteRegistry",
  "canModifyCatalog",
  "canTriggerRuntime",
  "canTriggerDiagnosis",
  "canTriggerExport",
  "canExecuteSql",
  "canWriteSupabase",
  "canConnectEveBrain",
  "runtimeAuthority",
] as const;

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="eve06-ee-json-block">
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
    <div className={`eve06-ee-state-tile ${tone}`}>
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function MatchBadge({ match }: { match: boolean }) {
  return (
    <span className={`eve06-ee-match-badge ${match ? "match" : "mismatch"}`}>
      match: {String(match)}
    </span>
  );
}

function CompactList({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="eve06-ee-list-panel">
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

export function Eve06ExecutionEngineShadowHarness() {
  const [selectedFixture, setSelectedFixture] = useState<(typeof fixtureIds)[number]>(
    "resolve_activity_runtime_run",
  );

  const traceCases = useMemo(
    () =>
      EXECUTION_ENGINE_SHADOW_FIXTURES.map((fixture) => {
        const actual = evaluateExecutionEngineShadow(fixture.input);
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

  const input: ExecutionEngineEvaluationInput = selectedTrace.fixture.input;
  const output = selectedTrace.actual;
  const counters = EXECUTION_ENGINE_PROTECTED_METADATA.counts;
  const sourceRole = EXECUTION_ENGINE_PROTECTED_METADATA.sourceRole;

  return (
    <main className="eve06-ee-page">
      <div className="eve06-ee-shell">
        <header className="eve06-ee-header">
          <div>
            <p className="eve06-ee-kicker">DEV HARNESS ONLY</p>
            <p className="eve06-ee-kicker secondary">NOT PRODUCTIVE UI</p>
            <h1>EVE-06 Execution Engine Shadow Harness</h1>
            <p className="eve06-ee-warning">candidate not wired</p>
            <p className="eve06-ee-subtitle">
              documentary satisfaction: {EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.status}
            </p>
          </div>
          <dl className="eve06-ee-state-grid">
            <StateTile label="chipId" value={EXECUTION_ENGINE_SHADOW_CHIP_ID} />
            <StateTile label="mode" value={displayMode} />
            <StateTile label="version" value={EXECUTION_ENGINE_SHADOW_VERSION} />
            <StateTile label="status" value="candidate not wired" />
            <StateTile label="runtimeAuthority" value={noCableadoStatus.runtimeAuthority} />
            <StateTile label="registryWrite" value={noCableadoStatus.registryWrite} />
            <StateTile label="productWiring" value={noCableadoStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={noCableadoStatus.eveBrainConnection} />
            <StateTile label="diagnosisEnabled" value={noCableadoStatus.diagnosisEnabled} />
            <StateTile label="exportEnabled" value={noCableadoStatus.exportEnabled} />
            <StateTile label="sqlEnabled" value={noCableadoStatus.sqlEnabled} />
            <StateTile label="supabaseWrite" value={noCableadoStatus.supabaseWrite} />
          </dl>
        </header>

        <section className="eve06-ee-section">
          <div className="eve06-ee-section-heading">
            <h2>Fixtures</h2>
            <span>16 trace cases</span>
          </div>
          <div className="eve06-ee-fixture-selector" aria-label="Fixture selector">
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

        <section className="eve06-ee-two-column">
          <div className="eve06-ee-card">
            <div className="eve06-ee-section-heading">
              <h2>Input</h2>
              <span>{selectedFixture}</span>
            </div>
            <dl className="eve06-ee-state-grid compact">
              <StateTile label="selectedFixture" value={selectedFixture} />
              <StateTile label="queryType" value={input.queryType} />
              <StateTile label="module" value={input.module ?? "none"} />
              <StateTile label="recordType" value={input.recordType ?? "none"} />
              <StateTile label="recordId" value={input.recordId ?? "none"} />
              <StateTile label="ruleId" value={input.ruleId ?? "none"} />
              <StateTile label="fieldName" value={input.fieldName ?? "none"} />
              <StateTile label="sourceDocumentId" value={input.sourceDocumentId ?? "none"} />
            </dl>
            <JsonBlock label="evidenceRefs" value={input.evidenceRefs ?? []} />
            <JsonBlock label="sourceTrace" value={input.sourceTrace ?? []} />
          </div>

          <div className="eve06-ee-card">
            <div className="eve06-ee-section-heading">
              <h2>Output</h2>
              <MatchBadge match={selectedTrace.match} />
            </div>
            <dl className="eve06-ee-state-grid compact">
              <StateTile label="readinessState" value={output.readinessState} />
              <StateTile label="resolved" value={output.resolved} />
              <StateTile
                label="expectedReadinessState"
                value={selectedTrace.fixture.expectedReadinessState}
              />
              <StateTile label="actualReadinessState" value={output.readinessState} />
              <StateTile label="expectedResolved" value={selectedTrace.fixture.expectedResolved} />
              <StateTile label="actualResolved" value={output.resolved} />
            </dl>
            <JsonBlock label="resolvedEntity" value={output.resolvedEntity} />
            <JsonBlock label="documentarySatisfaction" value={output.documentarySatisfaction} />
          </div>
        </section>

        <section className="eve06-ee-two-column">
          <JsonBlock label="missingReferences" value={output.missingReferences} />
          <JsonBlock label="gapFlags" value={output.gapFlags} />
          <JsonBlock label="allowedActions" value={output.allowedActions} />
          <JsonBlock label="blockedActions" value={output.blockedActions} />
          <JsonBlock label="requiredInputs" value={output.requiredInputs} />
          <JsonBlock label="findings" value={output.findings} />
          <JsonBlock label="auditEvents" value={output.auditEvents} />
          <JsonBlock label="safetyFlags" value={output.safetyFlags} />
        </section>

        <section className="eve06-ee-section">
          <div className="eve06-ee-section-heading">
            <h2>MATCH expected/actual</h2>
            <span>all fixtures</span>
          </div>
          <div className="eve06-ee-match-table">
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

        <section className="eve06-ee-section">
          <div className="eve06-ee-section-heading">
            <h2>Protected counters</h2>
            <span>satisfactory</span>
          </div>
          <dl className="eve06-ee-state-grid counters">
            <StateTile label="modules" value={counters.modules} />
            <StateTile label="atomic rules" value={counters.atomicRules} />
            <StateTile label="failure guards" value={counters.failureGuards} />
            <StateTile label="integration rules" value={counters.integrationRules} />
            <StateTile label="source_to_target mappings" value={counters.sourceToTargetMappings} />
            <StateTile label="QA controls" value={counters.qaControls} />
            <StateTile label="schema fields" value={counters.schemaFields} />
            <StateTile label="accepted" value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.accepted} />
            <StateTile label="rejected" value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.rejected} />
            <StateTile
              label="pending_source_proof"
              value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.pendingSourceProof}
            />
            <StateTile
              label="pending_locator_precision"
              value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.pendingLocatorPrecision}
            />
            <StateTile
              label="source_role_mismatch"
              value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceRoleMismatch}
            />
            <StateTile
              label="source_missing"
              value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceMissing}
            />
            <StateTile
              label="wiring_risk_detected"
              value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.wiringRiskDetected}
            />
            <StateTile
              label="materialDifference"
              value={EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.materialDifference}
            />
            <StateTile label="D1 direct proof SCR" value={sourceRole.d1DirectProofScr} />
            <StateTile label="D8 present for SCR" value={sourceRole.d8PresentForScr} />
            <StateTile
              label="STM6-016 covers"
              value={sourceRole.stm6016Covers.join(", ")}
            />
          </dl>
        </section>

        <section className="eve06-ee-section">
          <div className="eve06-ee-section-heading">
            <h2>Safety rail visual</h2>
            <span>read-only</span>
          </div>
          <dl className="eve06-ee-state-grid counters">
            {safetyRailKeys.map((key) => (
              <StateTile key={key} label={key} value={EXECUTION_ENGINE_SAFETY_FLAGS[key]} />
            ))}
            <StateTile label="registryWrite" value={noCableadoStatus.registryWrite} />
            <StateTile label="productWiring" value={noCableadoStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={noCableadoStatus.eveBrainConnection} />
            <StateTile label="diagnosisEnabled" value={noCableadoStatus.diagnosisEnabled} />
            <StateTile label="exportEnabled" value={noCableadoStatus.exportEnabled} />
            <StateTile label="sqlEnabled" value={noCableadoStatus.sqlEnabled} />
            <StateTile label="supabaseWrite" value={noCableadoStatus.supabaseWrite} />
          </dl>
        </section>

        <section className="eve06-ee-two-column">
          <CompactList label="sourceTrace" items={output.sourceTrace} />
          <CompactList label="evidenceRefs" items={output.evidenceRefs} />
        </section>
      </div>
    </main>
  );
}
