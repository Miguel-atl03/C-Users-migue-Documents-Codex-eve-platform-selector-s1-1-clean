"use client";

import { useMemo, useState } from "react";

import {
  AGENT_CONSTITUTION_SHADOW_FIXTURES,
  type AgentConstitutionShadowFixtureId,
} from "@/features/dev/agent-constitution-shadow-fixtures";
import { evaluateAgentConstitutionShadow } from "@/services/agent-constitution-shadow-evaluator";

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
  value: string | boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""}`}>
        {String(value)}
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

export default function AgentConstitutionShadowDevPage() {
  const [selectedFixtureId, setSelectedFixtureId] =
    useState<AgentConstitutionShadowFixtureId>("capture_allowed_traced_evidence");
  const selectedFixture =
    AGENT_CONSTITUTION_SHADOW_FIXTURES.find(
      (fixture) => fixture.fixtureId === selectedFixtureId,
    ) ?? AGENT_CONSTITUTION_SHADOW_FIXTURES[0];
  const result = useMemo(
    () => evaluateAgentConstitutionShadow(selectedFixture.input),
    [selectedFixture],
  );
  const readinessMatch =
    selectedFixture.expectedReadinessState === result.readinessState;
  const methodKernelPresent = selectedFixture.input.methodKernelResult !== undefined;

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-neutral-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            DEV-ONLY HARNESS
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            EVE 01 Agent Constitution Shadow · Demo de trazabilidad
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-neutral-600">
            {"DEV-ONLY HARNESS — Esta pantalla no es UI de usuario final y no afecta el flujo productivo."}
          </p>
        </header>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">A. Estado del chip</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="chipId" value={result.chipId} />
            <StateCard label="mode" value={result.mode} />
            <StateCard
              label="package status"
              value="AGENT_CONSTITUTION_STATIC_TESTS_READY"
            />
            <StateCard
              label="shadow status"
              value="AGENT_CONSTITUTION_SHADOW_MODE_READY"
            />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">B. Fixture seleccionado</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {AGENT_CONSTITUTION_SHADOW_FIXTURES.map((fixture) => (
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
            <div
              className={`rounded border p-3 ${
                readinessMatch
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <dt className="text-xs font-medium text-neutral-500">MATCH</dt>
              <dd
                className={`mt-1 font-mono text-sm font-semibold ${
                  readinessMatch ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {String(readinessMatch)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {"Esta pantalla permite revisar decisiones constitucionales en constitutional_shadow mode. No afecta al usuario final."}
        </div>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">C. Requested action trace</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="requestedAction" value={selectedFixture.input.requestedAction} />
            <StateCard
              label="requestedOutputType"
              value={selectedFixture.input.requestedOutputType ?? "—"}
            />
            <StateCard
              label="inputClassification"
              value={selectedFixture.input.inputClassification}
            />
            <StateCard
              label="targetBoundary"
              value={selectedFixture.input.targetBoundary ?? "—"}
            />
          </dl>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace
            title="D. Evidence trace · evidenceItems"
            value={selectedFixture.input.evidenceItems}
          />
          <JsonTrace
            title="D. Evidence trace · provenance / epistemic / revision"
            value={selectedFixture.input.evidenceItems.map((item) => ({
              evidenceItemId: item.evidenceItemId,
              provenanceType: item.provenanceType,
              epistemicStatus: item.epistemicStatus,
              revision: item.revision,
              sourceRefs: item.sourceRefs,
            }))}
          />
        </section>

        <JsonTrace title="E. Source trace" value={selectedFixture.input.sourceTrace} />

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">F. Method Kernel trace</h2>
          {methodKernelPresent ? (
            <pre className="mt-3 max-h-[240px] overflow-auto whitespace-pre-wrap rounded bg-neutral-950 p-3 text-xs leading-5 text-neutral-50">
              {JSON.stringify(selectedFixture.input.methodKernelResult, null, 2)}
            </pre>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">
              methodKernelResult: no existe en este fixture
            </p>
          )}
        </section>

        <JsonTrace
          title="G. Decision output"
          value={{
            readinessState: result.readinessState,
            decisionId: result.decisionId,
            ruleIds: result.ruleIds,
            allowedActions: result.allowedActions,
            blockedActions: result.blockedActions,
            requiredInputs: result.requiredInputs,
            auditRequired: result.auditRequired,
            nextChipOrService: result.nextChipOrService,
          }}
        />

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="H. Findings" value={result.findings} />
          <JsonTrace title="H. Audit events" value={result.auditEvents} />
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">I. Safety trace</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Flags derivados de safetyFlags del resultado evaluado.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              label="Production trigger disabled"
              value={!result.safetyFlags.canTriggerProduction}
            />
            <SafetyTraceItem
              label="Runtime authority disabled"
              value={!result.safetyFlags.runtimeAuthority}
            />
          </dl>
        </section>
      </div>
    </main>
  );
}
