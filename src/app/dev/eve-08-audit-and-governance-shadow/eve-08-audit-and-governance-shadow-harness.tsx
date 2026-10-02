"use client";

import { useMemo, useState } from "react";
import {
  AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION,
  AUDIT_GOVERNANCE_PROTECTED_METADATA,
  AUDIT_GOVERNANCE_SAFETY_FLAGS,
  AUDIT_GOVERNANCE_SHADOW_CHIP_ID,
  AUDIT_GOVERNANCE_SHADOW_FIXTURES,
  AUDIT_GOVERNANCE_SHADOW_MODE,
  evaluateAuditAndGovernanceShadow,
  type AuditAndGovernanceEvaluationInput,
} from "@/domain/eve-audit-and-governance-shadow";

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

const fixtureIds = [
  "resolve_audit_trail_state",
  "resolve_governance_rule_state",
  "resolve_system_state_evidence",
  "resolve_source_alias",
  "resolve_source_role",
  "validate_record_rule_source_qa",
  "validate_source_proof_satisfaction",
  "validate_system_state_evidence",
  "validate_internal_claim_boundary",
  "validate_no_circular_certification",
  "validate_d8_contextual_resolution",
  "validate_no_cableado",
  "validate_brain_connection_preconditions_blocked",
  "detect_governance_gap",
  "detect_alias_gap",
  "detect_unresolved_system_state",
  "detect_brain_connection_blocker",
  "summarize_governance_readiness",
] as const;

const safetyRailKeys = [
  "canBlockProductiveUserFlow",
  "canModifyGovernanceState",
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

const brainConnectionPreconditionsMetState = "brain_connection_preconditions_met";
const brainConnectionPreconditionLabels = [
  "explicit_brain_wiring_authorization",
  "registry_write_contract",
  "rollback_plan",
  "no_cableado_release_gate",
  "human_approval",
] as const;

type FixtureId = (typeof fixtureIds)[number];

const brainReadyInput: AuditAndGovernanceEvaluationInput = {
  mode: AUDIT_GOVERNANCE_SHADOW_MODE,
  queryType: "validate_brain_connection_preconditions",
  context: {
    explicitBrainWiringAuthorization: true,
    registryWriteContractReady: true,
    rollbackPlanReady: true,
    noCableadoReleaseGateReady: true,
    humanApprovalReady: true,
  },
};

const circularCertificationInput: AuditAndGovernanceEvaluationInput = {
  mode: AUDIT_GOVERNANCE_SHADOW_MODE,
  queryType: "validate_no_circular_certification",
  context: { acceptCertificationReportAsFinalProof: true },
};

const d8DirectProofInput: AuditAndGovernanceEvaluationInput = {
  mode: AUDIT_GOVERNANCE_SHADOW_MODE,
  queryType: "validate_d8_contextual_resolution",
  sourceId: "D8",
  context: { d8UsedAsDirectProof: true },
};

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="eve08-ag-json-block">
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
    <div className={`eve08-ag-state-tile ${tone}`}>
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function MatchBadge({ match }: { match: boolean }) {
  return (
    <span className={`eve08-ag-match-badge ${match ? "match" : "mismatch"}`}>
      match: {String(match)}
    </span>
  );
}

function CompactList({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="eve08-ag-list-panel">
      <h2>{label}</h2>
      <ul>
        {items.length === 0 ? <li>none</li> : items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export function Eve08AuditAndGovernanceShadowHarness() {
  const [selectedFixtureId, setSelectedFixtureId] = useState<FixtureId>("resolve_audit_trail_state");

  const traceCases = useMemo(
    () =>
      AUDIT_GOVERNANCE_SHADOW_FIXTURES.map((fixture) => {
        const actual = evaluateAuditAndGovernanceShadow(fixture.input);
        return {
          fixture,
          actual,
          match: fixture.expectedReadinessState === actual.readinessState && fixture.expectedResolved === actual.resolved,
        };
      }),
    [],
  );

  const selectedFixture =
    AUDIT_GOVERNANCE_SHADOW_FIXTURES.find((fixture) => fixture.fixtureId === selectedFixtureId) ??
    AUDIT_GOVERNANCE_SHADOW_FIXTURES[0];

  const selectedEvaluationResult = useMemo(
    () => evaluateAuditAndGovernanceShadow(selectedFixture.input),
    [selectedFixture],
  );

  const selectedTrace = {
    fixture: selectedFixture,
    actual: selectedEvaluationResult,
    match:
      selectedFixture.expectedReadinessState === selectedEvaluationResult.readinessState &&
      selectedFixture.expectedResolved === selectedEvaluationResult.resolved,
  };

  const input = selectedTrace.fixture.input;
  const output = selectedTrace.actual;
  const documentary = AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION;
  const protectedStatus = AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado;
  const brainBlocked = evaluateAuditAndGovernanceShadow({
    mode: AUDIT_GOVERNANCE_SHADOW_MODE,
    queryType: "validate_brain_connection_preconditions",
  });
  const brainMet = evaluateAuditAndGovernanceShadow(brainReadyInput);
  const circularNormal = evaluateAuditAndGovernanceShadow({
    mode: AUDIT_GOVERNANCE_SHADOW_MODE,
    queryType: "validate_no_circular_certification",
  });
  const circularForced = evaluateAuditAndGovernanceShadow(circularCertificationInput);
  const d8Normal = evaluateAuditAndGovernanceShadow({
    mode: AUDIT_GOVERNANCE_SHADOW_MODE,
    queryType: "validate_d8_contextual_resolution",
    sourceId: "D8",
  });
  const d8Forced = evaluateAuditAndGovernanceShadow(d8DirectProofInput);

  return (
    <main className="eve08-ag-page">
      <div className="eve08-ag-shell">
        <header className="eve08-ag-header">
          <div>
            <p className="eve08-ag-kicker">DEV HARNESS ONLY</p>
            <p className="eve08-ag-kicker secondary">READ-ONLY TRACE</p>
            <h1>EVE-08 Audit And Governance Shadow Harness</h1>
            <p className="eve08-ag-warning">candidate not wired</p>
            <p className="eve08-ag-warning danger">brain connection blocked</p>
            <p className="eve08-ag-subtitle">documentary satisfaction: {documentary.status}</p>
            <p className="eve08-ag-subtitle">static tests: ready with gaps</p>
            <p className="eve08-ag-subtitle">no export / no registry / no runtimeAuthority</p>
          </div>
          <dl className="eve08-ag-state-grid">
            <StateTile label="chipId" value={AUDIT_GOVERNANCE_SHADOW_CHIP_ID} />
            <StateTile label="mode" value={AUDIT_GOVERNANCE_SHADOW_MODE} />
            <StateTile label="status" value="candidate not wired" />
            <StateTile label="documentary satisfaction" value={documentary.status} />
            <StateTile label="brain connection" value="blocked" />
            <StateTile label="brainConnectionPreconditionsMet" value={brainBlocked.brainConnectionPreconditions.brainConnectionPreconditionsMet} />
            <StateTile label="canConnectEveBrain" value={AUDIT_GOVERNANCE_SAFETY_FLAGS.canConnectEveBrain} />
            <StateTile label="runtimeAuthority" value={noCableadoStatus.runtimeAuthority} />
            <StateTile label="registryWrite" value={noCableadoStatus.registryWrite} />
            <StateTile label="productWiring" value={noCableadoStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={noCableadoStatus.eveBrainConnection} />
            <StateTile label="final_export_enabled" value={noCableadoStatus.final_export_enabled} />
            <StateTile label="parallel_production_enabled" value={noCableadoStatus.parallel_production_enabled} />
            <StateTile label="diagnosis_enabled" value={noCableadoStatus.diagnosis_enabled} />
            <StateTile label="sqlEnabled" value={noCableadoStatus.sqlEnabled} />
            <StateTile label="supabaseWrite" value={noCableadoStatus.supabaseWrite} />
          </dl>
        </header>

        <section className="eve08-ag-section">
          <div className="eve08-ag-section-heading">
            <h2>Fixtures</h2>
            <span>18 trace cases</span>
          </div>
          <div className="eve08-ag-fixture-selector" aria-label="Fixture selector">
            {fixtureIds.map((fixtureId) => (
              <button
                aria-pressed={fixtureId === selectedFixtureId}
                className={fixtureId === selectedFixtureId ? "selected" : ""}
                data-fixture-id={fixtureId}
                data-selected={fixtureId === selectedFixtureId}
                key={fixtureId}
                onClick={() => setSelectedFixtureId(fixtureId)}
                type="button"
              >
                {fixtureId}
              </button>
            ))}
          </div>
        </section>

        <section className="eve08-ag-two-column" data-selected-fixture-id={selectedFixtureId}>
          <div className="eve08-ag-card">
            <div className="eve08-ag-section-heading">
              <h2>Input</h2>
              <span>{selectedFixtureId}</span>
            </div>
            <dl className="eve08-ag-state-grid compact">
              <StateTile label="selectedFixtureId" value={selectedFixtureId} />
              <StateTile label="queryType" value={input.queryType} />
              <StateTile label="targetUnitId" value={input.targetUnitId ?? "none"} />
              <StateTile label="moduleId" value={input.moduleId ?? "none"} />
              <StateTile label="ruleId" value={input.ruleId ?? "none"} />
              <StateTile label="sourceId" value={input.sourceId ?? "none"} />
              <StateTile label="aliasId" value={input.aliasId ?? "none"} />
              <StateTile label="systemStateEvidenceId" value={input.systemStateEvidenceId ?? "none"} />
              <StateTile label="claimId" value={input.claimId ?? "none"} />
              <StateTile label="controlId" value={input.controlId ?? "none"} />
            </dl>
            <JsonBlock label="context" value={input.context ?? {}} />
          </div>

          <div className="eve08-ag-card">
            <div className="eve08-ag-section-heading">
              <h2>Output</h2>
              <MatchBadge match={selectedTrace.match} />
            </div>
            <dl className="eve08-ag-state-grid compact">
              <StateTile label="expectedReadinessState" value={selectedTrace.fixture.expectedReadinessState} />
              <StateTile label="actualReadinessState" value={output.readinessState} />
              <StateTile label="expectedResolved" value={selectedTrace.fixture.expectedResolved} />
              <StateTile label="actualResolved" value={output.resolved} />
              <StateTile label="resolvedEntity" value={output.resolvedEntity?.entityKind ?? "none"} />
            </dl>
            <JsonBlock label="resolvedEntity" value={output.resolvedEntity} />
          </div>
        </section>

        <section className="eve08-ag-two-column">
          <JsonBlock label="missingReferences" value={output.missingReferences} />
          <JsonBlock label="gapFlags" value={output.gapFlags} />
          <JsonBlock label="sourceTrace" value={output.sourceTrace} />
          <JsonBlock label="evidenceRefs" value={output.evidenceRefs} />
          <JsonBlock label="allowedActions" value={output.allowedActions} />
          <JsonBlock label="blockedActions" value={output.blockedActions} />
          <JsonBlock label="requiredInputs" value={output.requiredInputs} />
          <JsonBlock label="findings" value={output.findings} />
          <JsonBlock label="auditEvents" value={output.auditEvents} />
          <JsonBlock label="safetyFlags" value={output.safetyFlags} />
          <JsonBlock label="documentarySatisfaction" value={output.documentarySatisfaction} />
          <JsonBlock label="governanceEvaluation" value={output.governanceEvaluation} />
          <JsonBlock label="brainConnectionPreconditions" value={output.brainConnectionPreconditions} />
        </section>

        <section className="eve08-ag-card">
          <div className="eve08-ag-section-heading">
            <h2>Protected Counters</h2>
            <span>QA V1_1</span>
          </div>
          <dl className="eve08-ag-state-grid counters">
            <StateTile label="targetUnitsChecked" value={`${documentary.targetUnitsChecked}/${documentary.targetUnitsExpected}`} />
            <StateTile label="modulesChecked" value={`${documentary.modulesChecked}/${documentary.modulesExpected}`} />
            <StateTile label="atomicRulesChecked" value={`${documentary.atomicRulesChecked}/${documentary.atomicRulesExpected}`} />
            <StateTile
              label="sourceToTargetRowsChecked"
              value={`${documentary.sourceToTargetRowsChecked}/${documentary.sourceToTargetRowsExpected}`}
            />
            <StateTile label="sourceProofRowsChecked" value={`${documentary.sourceProofRowsChecked}/${documentary.sourceProofRowsExpected}`} />
            <StateTile
              label="systemStateEvidenceRowsChecked"
              value={`${documentary.systemStateEvidenceRowsChecked}/${documentary.systemStateEvidenceRowsExpected}`}
            />
            <StateTile
              label="packageDeclaredMappingsChecked"
              value={`${documentary.packageDeclaredMappingsChecked}/${documentary.packageDeclaredMappingsExpected}`}
            />
            <StateTile
              label="materialComparisonRowsChecked"
              value={`${documentary.materialComparisonRowsChecked}/${documentary.materialComparisonRowsExpected}`}
            />
            <StateTile label="accepted" value={documentary.accepted} />
            <StateTile label="rejected" value={documentary.rejected} />
            <StateTile label="pendingSourceProof" value={documentary.pendingSourceProof} />
            <StateTile label="pendingLocatorPrecision" value={documentary.pendingLocatorPrecision} />
            <StateTile label="internalClaimUnverified" value={documentary.internalClaimUnverified} />
            <StateTile label="certificationClaimUnverified" value={documentary.certificationClaimUnverified} />
            <StateTile label="d8ContextualGap" value={documentary.d8ContextualGap} />
            <StateTile label="aliasesResolved" value={`${documentary.aliasesResolved}/${documentary.aliasesExpected}`} />
            <StateTile label="noCableadoViolation" value={documentary.noCableadoViolation} />
            <StateTile label="materialDifference" value={documentary.materialDifference} />
          </dl>
        </section>

        <section className="eve08-ag-card">
          <div className="eve08-ag-section-heading">
            <h2>Safety Rails</h2>
            <span>all false</span>
          </div>
          <dl className="eve08-ag-state-grid counters">
            {safetyRailKeys.map((key) => (
              <StateTile key={key} label={key} value={AUDIT_GOVERNANCE_SAFETY_FLAGS[key]} />
            ))}
            <StateTile label="registryWrite" value={protectedStatus.registryWrite} />
            <StateTile label="productWiring" value={protectedStatus.productWiring} />
            <StateTile label="eveBrainConnection" value={protectedStatus.eveBrainConnection} />
            <StateTile label="final_export_enabled" value={protectedStatus.finalExportEnabled} />
            <StateTile label="parallel_production_enabled" value={protectedStatus.parallelProductionEnabled} />
            <StateTile label="diagnosis_enabled" value={protectedStatus.diagnosisEnabled} />
            <StateTile label="sqlEnabled" value={protectedStatus.sqlEnabled} />
            <StateTile label="supabaseWrite" value={protectedStatus.supabaseWrite} />
          </dl>
        </section>

        <section className="eve08-ag-two-column">
          <div className="eve08-ag-card">
            <div className="eve08-ag-section-heading">
              <h2>Brain Connection Preconditions</h2>
              <span>blocked by default</span>
            </div>
            <dl className="eve08-ag-state-grid compact">
              <StateTile label="brainConnectionPreconditionsMet" value={brainBlocked.brainConnectionPreconditions.brainConnectionPreconditionsMet} />
              <StateTile label="default readinessState" value={brainBlocked.readinessState} />
              <StateTile label="all preconditions true" value={brainMet.readinessState} />
              <StateTile label="all preconditions true state id" value={brainConnectionPreconditionsMetState} />
              <StateTile label="canConnectEveBrain" value={brainMet.safetyFlags.canConnectEveBrain} />
              <StateTile label="connect_eve_brain blocked" value={brainMet.blockedActions.includes("connect_eve_brain")} />
              {brainConnectionPreconditionLabels.map((label) => (
                <StateTile key={label} label={label} value="visible" />
              ))}
            </dl>
            <CompactList label="missingPreconditions" items={brainBlocked.brainConnectionPreconditions.missingPreconditions} />
            <JsonBlock label="all-preconditions-true result" value={brainMet} />
          </div>

          <div className="eve08-ag-card">
            <div className="eve08-ag-section-heading">
              <h2>Circular Certification</h2>
              <span>no final proof</span>
            </div>
            <p className="eve08-ag-note">certification_report no proof final</p>
            <p className="eve08-ag-note">source_proof_matrix no sentencia final automatica</p>
            <p className="eve08-ag-note">system_state_evidence_matrix no aceptacion circular</p>
            <dl className="eve08-ag-state-grid compact">
              <StateTile label="normal" value={circularNormal.readinessState} />
              <StateTile label="circular_certification_prevented" value={circularNormal.readinessState} />
              <StateTile label="forced circular case" value={circularForced.readinessState} />
              <StateTile label="circular_certification_detected" value={circularForced.readinessState} />
            </dl>
            <JsonBlock label="circular_certification_detected case" value={circularForced} />
          </div>
        </section>

        <section className="eve08-ag-card">
          <div className="eve08-ag-section-heading">
            <h2>D8 Contextual Boundary</h2>
            <span>D8 contextual/genealogia</span>
          </div>
          <p className="eve08-ag-note">D8 no direct proof operativo</p>
          <dl className="eve08-ag-state-grid compact">
            <StateTile label="d8ContextualGap" value={documentary.d8ContextualGap} />
            <StateTile label="validate_d8_contextual_resolution" value={d8Normal.readinessState} />
            <StateTile label="d8_contextual_resolved" value={d8Normal.readinessState} />
            <StateTile label="forced direct proof case" value={d8Forced.readinessState} />
            <StateTile label="d8_contextual_unresolved" value={d8Forced.readinessState} />
          </dl>
          <JsonBlock label="d8_contextual_unresolved case" value={d8Forced} />
        </section>

        <section className="eve08-ag-card">
          <div className="eve08-ag-section-heading">
            <h2>MATCH Matrix</h2>
            <span>expected / actual</span>
          </div>
          <div className="eve08-ag-match-table">
            {traceCases.map(({ fixture, actual, match }) => (
              <article key={fixture.fixtureId}>
                <div>
                  <strong>{fixture.fixtureId}</strong>
                  <span>
                    expectedReadinessState: {fixture.expectedReadinessState} | actualReadinessState: {actual.readinessState}
                  </span>
                  <span>
                    expectedResolved: {String(fixture.expectedResolved)} | actualResolved: {String(actual.resolved)}
                  </span>
                </div>
                <MatchBadge match={match} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
