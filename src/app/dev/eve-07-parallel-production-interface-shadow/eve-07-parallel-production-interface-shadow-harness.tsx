"use client";

import { useMemo, useState } from "react";
import {
  evaluateParallelProductionInterfaceShadow,
  PPI_DOCUMENTARY_SATISFACTION,
  PPI_PROTECTED_METADATA,
  PPI_SAFETY_FLAGS,
  PPI_SHADOW_CHIP_ID,
  PPI_SHADOW_FIXTURES,
  PPI_SHADOW_MODE,
  PPI_SHADOW_VERSION,
} from "@/domain/eve-parallel-production-interface-shadow";
import type { ParallelProductionInterfaceEvaluationInput } from "@/domain/eve-parallel-production-interface-shadow";

const noCableadoStatus = {
  runtimeAuthority: false,
  registryWrite: false,
  productWiring: false,
  eveBrainConnection: false,
  final_export_enabled: false,
  parallel_production_enabled: false,
  diagnosis_enabled: false,
  sqlEnabled: false,
  supabaseWrite: false,
};

const displayMode = "parallel_production_interface_shadow";

const fixtureIds = [
  "resolve_scr_payload",
  "resolve_evidence_bundle_payload",
  "resolve_mdsb_payload",
  "resolve_mmabp_ir_candidate",
  "resolve_registry_candidate",
  "resolve_export_blockers",
  "validate_payload_schema_valid",
  "validate_source_proof_valid",
  "validate_export_blocker_valid",
  "validate_exb_031_override_requested_not_audited",
  "validate_exb_031_override_audited",
  "validate_no_export_no_registry_no_parallel_production",
  "validate_documentary_satisfaction",
  "detect_missing_source_proof",
  "detect_missing_payload",
  "validate_registry_candidate_boundary",
] as const;

const safetyRailKeys = [
  "canBlockProductiveUserFlow",
  "canModifyPayload",
  "canWriteRegistry",
  "canTriggerExport",
  "canTriggerParallelProduction",
  "canTriggerRuntime",
  "canTriggerDiagnosis",
  "canExecuteSql",
  "canWriteSupabase",
  "canConnectEveBrain",
  "runtimeAuthority",
] as const;

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="eve07-ppi-json-block">
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
    <div className={`eve07-ppi-state-tile ${tone}`}>
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function MatchBadge({ match }: { match: boolean }) {
  return (
    <span className={`eve07-ppi-match-badge ${match ? "match" : "mismatch"}`}>
      match: {String(match)}
    </span>
  );
}

function CompactList({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="eve07-ppi-list-panel">
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

export function Eve07ParallelProductionInterfaceShadowHarness() {
  const [selectedFixture, setSelectedFixture] = useState<(typeof fixtureIds)[number]>(
    "resolve_scr_payload",
  );

  const traceCases = useMemo(
    () =>
      PPI_SHADOW_FIXTURES.map((fixture) => {
        const actual = evaluateParallelProductionInterfaceShadow(fixture.input);
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

  const input: ParallelProductionInterfaceEvaluationInput = selectedTrace.fixture.input;
  const output = selectedTrace.actual;
  const documentary = PPI_DOCUMENTARY_SATISFACTION;
  const protectedStatus = PPI_PROTECTED_METADATA.noCableado;

  return (
    <main className="eve07-ppi-page">
      <div className="eve07-ppi-shell">
        <header className="eve07-ppi-header">
          <div>
            <p className="eve07-ppi-kicker">DEV HARNESS ONLY</p>
            <p className="eve07-ppi-kicker secondary">READ-ONLY TRACE</p>
            <h1>EVE-07 Parallel Production Interface Shadow Harness</h1>
            <p className="eve07-ppi-warning">candidate not wired</p>
            <p className="eve07-ppi-subtitle">
              documentary satisfaction: {documentary.status}
            </p>
            <p className="eve07-ppi-subtitle">
              no export / no registry / no real parallel production
            </p>
          </div>
          <dl className="eve07-ppi-state-grid">
            <StateTile label="chipId" value={PPI_SHADOW_CHIP_ID} />
            <StateTile label="mode" value={displayMode} />
            <StateTile label="version" value={PPI_SHADOW_VERSION} />
            <StateTile label="status" value="candidate not wired" />
            <StateTile label="runtimeAuthority" value={noCableadoStatus.runtimeAuthority} />
            <StateTile label="registryWrite" value={noCableadoStatus.registryWrite} />
            <StateTile label="productWiring" value={noCableadoStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={noCableadoStatus.eveBrainConnection} />
            <StateTile label="final_export_enabled" value={noCableadoStatus.final_export_enabled} />
            <StateTile
              label="parallel_production_enabled"
              value={noCableadoStatus.parallel_production_enabled}
            />
            <StateTile label="diagnosis_enabled" value={noCableadoStatus.diagnosis_enabled} />
            <StateTile label="sqlEnabled" value={noCableadoStatus.sqlEnabled} />
            <StateTile label="supabaseWrite" value={noCableadoStatus.supabaseWrite} />
          </dl>
        </header>

        <section className="eve07-ppi-section">
          <div className="eve07-ppi-section-heading">
            <h2>Fixtures</h2>
            <span>16 trace cases</span>
          </div>
          <div className="eve07-ppi-fixture-selector" aria-label="Fixture selector">
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

        <section className="eve07-ppi-two-column">
          <div className="eve07-ppi-card">
            <div className="eve07-ppi-section-heading">
              <h2>Input</h2>
              <span>{selectedFixture}</span>
            </div>
            <dl className="eve07-ppi-state-grid compact">
              <StateTile label="selectedFixture" value={selectedFixture} />
              <StateTile label="queryType" value={input.queryType} />
              <StateTile label="module" value={input.module ?? "none"} />
              <StateTile label="payloadType" value={input.payloadType ?? "none"} />
              <StateTile label="payloadId" value={input.payloadId ?? "none"} />
              <StateTile label="ruleId" value={input.ruleId ?? "none"} />
              <StateTile label="blockerCode" value={input.blockerCode ?? "none"} />
              <StateTile label="fieldName" value={input.fieldName ?? "none"} />
              <StateTile label="sourceDocumentId" value={input.sourceDocumentId ?? "none"} />
            </dl>
            <JsonBlock label="evidenceRefs" value={input.evidenceRefs ?? []} />
            <JsonBlock label="sourceTrace" value={input.sourceTrace ?? []} />
            <JsonBlock label="context" value={input.context ?? {}} />
          </div>

          <div className="eve07-ppi-card">
            <div className="eve07-ppi-section-heading">
              <h2>Output</h2>
              <MatchBadge match={selectedTrace.match} />
            </div>
            <dl className="eve07-ppi-state-grid compact">
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
            <JsonBlock label="blockerEvaluation" value={output.blockerEvaluation} />
          </div>
        </section>

        <section className="eve07-ppi-two-column">
          <JsonBlock label="missingReferences" value={output.missingReferences} />
          <JsonBlock label="gapFlags" value={output.gapFlags} />
          <JsonBlock label="allowedActions" value={output.allowedActions} />
          <JsonBlock label="blockedActions" value={output.blockedActions} />
          <JsonBlock label="requiredInputs" value={output.requiredInputs} />
          <JsonBlock label="findings" value={output.findings} />
          <JsonBlock label="auditEvents" value={output.auditEvents} />
          <JsonBlock label="safetyFlags" value={output.safetyFlags} />
        </section>

        <section className="eve07-ppi-section">
          <div className="eve07-ppi-section-heading">
            <h2>MATCH expected/actual</h2>
            <span>all fixtures</span>
          </div>
          <div className="eve07-ppi-match-table">
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

        <section className="eve07-ppi-section">
          <div className="eve07-ppi-section-heading">
            <h2>Protected counters</h2>
            <span>satisfactory</span>
          </div>
          <dl className="eve07-ppi-state-grid counters">
            <StateTile
              label="source_proof_matrix rows"
              value={`${documentary.sourceProofMatrixRowsChecked}/${documentary.sourceProofMatrixRowsExpected}`}
            />
            <StateTile
              label="source_to_target mappings"
              value={`${documentary.sourceToTargetMappingsChecked}/${documentary.sourceToTargetMappingsExpected}`}
            />
            <StateTile
              label="EXB blockers"
              value={`${documentary.exbBlockersChecked}/${documentary.exbBlockersExpected}`}
            />
            <StateTile label="EXB-031" value={documentary.exb031Checked ? "checked" : "missing"} />
            <StateTile
              label="export blocker vectors"
              value={`${documentary.exportBlockerVectorsChecked}/${documentary.exportBlockerVectorsExpected}`}
            />
            <StateTile
              label="certification claims"
              value={`${documentary.certificationClaimsChecked}/${documentary.certificationClaimsExpected}`}
            />
            <StateTile label="QA rows" value={documentary.qaRows} />
            <StateTile label="accepted" value={documentary.accepted} />
            <StateTile label="rejected" value={documentary.rejected} />
            <StateTile label="pending_source_proof" value={documentary.pendingSourceProof} />
            <StateTile
              label="pending_locator_precision"
              value={documentary.pendingLocatorPrecision}
            />
            <StateTile
              label="certification_claim_unverified"
              value={documentary.certificationClaimUnverified}
            />
            <StateTile label="materialDifference" value={documentary.materialDifference} />
          </dl>
        </section>

        <section className="eve07-ppi-section">
          <div className="eve07-ppi-section-heading">
            <h2>Safety rail visual</h2>
            <span>read-only</span>
          </div>
          <dl className="eve07-ppi-state-grid counters">
            {safetyRailKeys.map((key) => (
              <StateTile key={key} label={key} value={PPI_SAFETY_FLAGS[key]} />
            ))}
            <StateTile label="registryWrite" value={protectedStatus.registryWrite} />
            <StateTile label="productWiring" value={protectedStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={protectedStatus.eveBrainConnection} />
            <StateTile
              label="final_export_enabled"
              value={protectedStatus.finalExportEnabled}
            />
            <StateTile
              label="parallel_production_enabled"
              value={protectedStatus.parallelProductionEnabled}
            />
            <StateTile label="diagnosis_enabled" value={protectedStatus.diagnosisEnabled} />
            <StateTile label="sqlEnabled" value={protectedStatus.sqlEnabled} />
            <StateTile label="supabaseWrite" value={protectedStatus.supabaseWrite} />
          </dl>
        </section>

        <section className="eve07-ppi-section">
          <div className="eve07-ppi-section-heading">
            <h2>EXB-031 visual</h2>
            <span>override boundary</span>
          </div>
          <div className="eve07-ppi-exb-grid">
            <StateTile label="overrideRequested false -> blocked" value={false} />
            <StateTile label="overrideRequested true + overrideAudited false -> blocked" value={true} />
            <StateTile label="overrideRequested true + overrideAudited true -> blocked" value={false} />
            <StateTile label="EXB-031 evaluated as shadow-only" value={true} />
          </div>
        </section>

        <section className="eve07-ppi-two-column">
          <CompactList label="sourceTrace" items={output.sourceTrace} />
          <CompactList label="evidenceRefs" items={output.evidenceRefs} />
        </section>
      </div>
    </main>
  );
}
