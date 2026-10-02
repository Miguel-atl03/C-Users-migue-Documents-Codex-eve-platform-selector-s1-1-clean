"use client";

import { useMemo, useState } from "react";

import {
  DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES,
  type DiagnosticOntologyShadowFixture,
  type DiagnosticOntologyShadowFixtureId,
} from "@/features/dev/diagnostic-ontology-shadow-fixtures";
import { evaluateDiagnosticOntologyShadow } from "@/services/diagnostic-ontology-shadow-evaluator";

function JsonTrace({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded bg-neutral-950 p-3 text-xs leading-5 text-neutral-50">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function StateCard({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string | boolean | number | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""}`}>
        {value === undefined || value === null ? "null" : String(value)}
      </dd>
    </div>
  );
}

function SafetyTraceItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-semibold text-emerald-700">
        {String(value)}
      </dd>
    </div>
  );
}

function expectedBlockedActionsMatch(
  fixture: DiagnosticOntologyShadowFixture,
  actualBlockedActions: string[],
) {
  return (fixture.expectedBlockedActions ?? []).every((action) =>
    actualBlockedActions.includes(action),
  );
}

export default function DiagnosticOntologyShadowDevPage() {
  const [selectedFixtureId, setSelectedFixtureId] =
    useState<DiagnosticOntologyShadowFixtureId>("valid_pm_moc_to_esquizofrenia_ontologica");
  const selectedFixture =
    DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES.find(
      (fixture) => fixture.fixtureId === selectedFixtureId,
    ) ?? DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES[0];
  const result = useMemo(
    () => evaluateDiagnosticOntologyShadow(selectedFixture.input),
    [selectedFixture],
  );
  const readinessMatch =
    selectedFixture.expectedReadinessState === result.readinessState;
  const pathologyMatch =
    selectedFixture.expectedPathologyCandidate === undefined ||
    selectedFixture.expectedPathologyCandidate === result.pathologyCandidate;
  const compartmentMatch =
    selectedFixture.expectedCompartmentId === undefined ||
    selectedFixture.expectedCompartmentId === result.compartmentId;
  const blockedActionsMatch = expectedBlockedActionsMatch(
    selectedFixture,
    result.blockedActions,
  );
  const match = readinessMatch && pathologyMatch && compartmentMatch && blockedActionsMatch;

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-neutral-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            DEV-ONLY HARNESS
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            EVE 02 Diagnostic Ontology Shadow · Demo de trazabilidad
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-neutral-600">
            {"DEV-ONLY HARNESS â€” Esta pantalla no es UI de usuario final y no afecta el flujo productivo."}
          </p>
        </header>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">A. Estado del chip</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="chipId" value={result.chipId} />
            <StateCard label="mode" value={result.mode} />
            <StateCard label="mode literal" value="diagnostic_ontology_shadow" />
            <StateCard
              label="package status"
              value="DIAGNOSTIC_ONTOLOGY_STATIC_TESTS_READY_WITH_GAPS"
            />
            <StateCard
              label="input contract status"
              value="DIAGNOSTIC_ONTOLOGY_INPUT_CONTRACT_CORRECTED_READY"
            />
            <StateCard
              label="shadow status"
              value="DIAGNOSTIC_ONTOLOGY_SHADOW_MODE_READY"
            />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">B. Fixture seleccionado</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES.map((fixture) => (
              <button
                className={`rounded border px-3 py-2 text-left text-sm font-medium ${
                  fixture.fixtureId === selectedFixtureId
                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
                key={fixture.fixtureId}
                onClick={() => setSelectedFixtureId(fixture.fixtureId)}
                type="button"
              >
                {fixture.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-neutral-600">{selectedFixture.description}</p>
          <p className="mt-1 text-xs text-neutral-500">{selectedFixture.notes}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="fixtureId" value={selectedFixture.fixtureId} />
            <StateCard
              label="expectedReadinessState"
              value={selectedFixture.expectedReadinessState}
            />
            <StateCard label="actualReadinessState" value={result.readinessState} />
            <StateCard
              label="expectedPathologyCandidate"
              value={selectedFixture.expectedPathologyCandidate ?? "not_applicable"}
            />
            <StateCard
              label="actualPathologyCandidate"
              value={result.pathologyCandidate ?? "not_applicable"}
            />
            <StateCard
              label="expectedCompartmentId"
              value={selectedFixture.expectedCompartmentId ?? "not_applicable"}
            />
            <StateCard label="actualCompartmentId" value={result.compartmentId} />
            <div
              className={`rounded border p-3 ${
                match ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"
              }`}
            >
              <dt className="text-xs font-medium text-neutral-500">MATCH</dt>
              <dd
                className={`mt-1 font-mono text-sm font-semibold ${
                  match ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {String(match)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {
            "La UI dev puede mostrar pathologyCandidate. La UI productiva no debe exponer pathology labels salvo futura superficie diagnóstica explícitamente autorizada."
          }
        </div>

        <JsonTrace
          title="C. Input trace"
          value={{
            inconsistency_compartment: selectedFixture.input.inconsistency_compartment,
            involved_models: selectedFixture.input.involved_models,
            conformance_status: selectedFixture.input.conformance_status,
            consistency_status: selectedFixture.input.consistency_status,
            evidence_refs: selectedFixture.input.evidence_refs,
            source_trace: selectedFixture.input.source_trace,
            methodKernelResult: selectedFixture.input.methodKernelResult,
            agentConstitutionDecision: selectedFixture.input.agentConstitutionDecision,
            semanticGateStatus: selectedFixture.input.semanticGateStatus,
            processStateTimerGateStatus: selectedFixture.input.processStateTimerGateStatus,
            requestedOutputType: selectedFixture.input.requestedOutputType,
            confidenceContext: selectedFixture.input.confidenceContext,
          }}
        />

        <JsonTrace
          title="D. Decision output"
          value={{
            readinessState: result.readinessState,
            candidateId: result.candidateId,
            compartmentId: result.compartmentId,
            pathologyCandidate: result.pathologyCandidate,
            canonicalPathology: result.canonicalPathology,
            aliases: result.aliases,
            diagnosticQuestion: result.diagnosticQuestion,
            allowedActions: result.allowedActions,
            blockedActions: result.blockedActions,
            requiredInputs: result.requiredInputs,
          }}
        />

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="E. Method trace" value={result.methodTrace} />
          <JsonTrace title="F. Pathology trace" value={result.pathologyTrace} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="G. Findings" value={result.findings} />
          <JsonTrace title="G. Audit events" value={result.auditEvents} />
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">H. Safety trace</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Flags derivados de safetyFlags del resultado evaluado.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SafetyTraceItem
              label="User blocking disabled"
              value={!result.safetyFlags.canBlockUserFlow}
            />
            <SafetyTraceItem
              label="Payload mutation disabled"
              value={!result.safetyFlags.canModifyPayload}
            />
            <SafetyTraceItem
              label="Registry write disabled"
              value={!result.safetyFlags.canWriteRegistry}
            />
            <SafetyTraceItem
              label="Final diagnosis disabled"
              value={!result.safetyFlags.canTriggerFinalDiagnosis}
            />
            <SafetyTraceItem
              label="IR trigger disabled"
              value={!result.safetyFlags.canTriggerIR}
            />
            <SafetyTraceItem
              label="Export trigger disabled"
              value={!result.safetyFlags.canTriggerExport}
            />
            <SafetyTraceItem
              label="Production trigger disabled"
              value={!result.safetyFlags.canTriggerProduction}
            />
            <SafetyTraceItem
              label="Runtime authority disabled"
              value={!result.safetyFlags.runtimeAuthority}
            />
          </dl>
          <JsonTrace title="H. safetyFlags" value={result.safetyFlags} />
        </section>
      </div>
    </main>
  );
}
