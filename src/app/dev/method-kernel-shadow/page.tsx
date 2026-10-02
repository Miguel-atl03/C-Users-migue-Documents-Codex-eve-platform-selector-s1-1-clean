"use client";

import { useMemo, useState } from "react";

import { METHOD_KERNEL_SHADOW_FIXTURES, type MethodKernelShadowFixtureId } from "@/features/dev/method-kernel-shadow-fixtures";
import { evaluateMethodKernelShadow } from "@/services/method-kernel-shadow-evaluator";

function JsonTrace({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <pre className="mt-3 max-h-[360px] overflow-auto rounded bg-neutral-950 p-3 text-xs leading-5 text-neutral-50">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function ChipStateCard({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string | boolean;
  mono?: boolean;
}) {
  const display = String(value);
  const isFalse = display === "false";
  const isTrue = display === "true";

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd
        className={`mt-1 break-words text-sm font-semibold ${
          mono ? "font-mono" : ""
        } ${
          isFalse
            ? "text-emerald-700"
            : isTrue
              ? "text-neutral-900"
              : "text-neutral-900"
        }`}
      >
        {display}
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

export default function MethodKernelShadowDevPage() {
  const [selectedFixtureId, setSelectedFixtureId] =
    useState<MethodKernelShadowFixtureId>("complete");
  const selectedFixture = METHOD_KERNEL_SHADOW_FIXTURES.find(
    (fixture) => fixture.id === selectedFixtureId,
  ) ?? METHOD_KERNEL_SHADOW_FIXTURES[0];
  const result = useMemo(
    () => evaluateMethodKernelShadow(selectedFixture.input),
    [selectedFixture],
  );
  const readinessMatch =
    selectedFixture.expectedReadinessState === result.readinessState;

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-neutral-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            DEV-ONLY HARNESS
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Method Kernel Shadow · Demo de trazabilidad
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            Esta pantalla es un harness de desarrollo. No representa UI de usuario final.
          </p>
        </header>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">A. Estado del chip</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ChipStateCard
              label="Package status"
              mono
              value="METHOD_KERNEL_PACKAGE_CONSISTENT_NOT_WIRED"
            />
            <ChipStateCard label="Mode" mono value={result.mode} />
            <ChipStateCard
              label="Runtime authority"
              value={result.runtimeAuthority}
            />
            <ChipStateCard
              label="Can block user flow"
              value={result.canBlockUserFlow}
            />
            <ChipStateCard
              label="Can modify payload"
              value={result.canModifyPayload}
            />
            <ChipStateCard
              label="Can write registry"
              value={result.canWriteRegistry}
            />
            <ChipStateCard
              label="Can trigger diagnosis"
              value={result.canTriggerDiagnosis}
            />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">B. Fixture seleccionado</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {METHOD_KERNEL_SHADOW_FIXTURES.map((fixture) => (
              <button
                className={`rounded border px-3 py-2 text-sm font-medium ${
                  fixture.id === selectedFixtureId
                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
                key={fixture.id}
                onClick={() => setSelectedFixtureId(fixture.id)}
                type="button"
              >
                {fixture.label}
              </button>
            ))}
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
              <dt className="text-xs font-medium text-neutral-500">fixtureId</dt>
              <dd className="mt-1 font-mono text-sm font-semibold">
                {selectedFixture.id}
              </dd>
            </div>
            <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
              <dt className="text-xs font-medium text-neutral-500">
                expectedReadinessState
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold">
                {selectedFixture.expectedReadinessState}
              </dd>
            </div>
            <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
              <dt className="text-xs font-medium text-neutral-500">
                actualReadinessState
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold">
                {result.readinessState}
              </dd>
            </div>
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
          {"Esta pantalla permite revisar cómo el Method Kernel evalúa candidatos estructurales en shadow mode. No afecta al usuario final."}
        </div>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace
            title="Input trace · candidates"
            value={selectedFixture.input.candidates}
          />
          <JsonTrace
            title="Input trace · evidenceItems"
            value={selectedFixture.input.evidenceItems}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="Output trace · findings" value={result.findings} />
          <JsonTrace title="Output trace · auditEvents" value={result.auditEvents} />
        </section>

        <JsonTrace
          title="Output trace · readinessState and safety"
          value={{
            readinessState: result.readinessState,
            ruleIds: result.findings.map((finding) => finding.ruleId),
            candidateIds: result.findings.flatMap((finding) => finding.candidateIds),
            evidenceItemIds: result.findings.flatMap((finding) => finding.evidenceItemIds),
            sourceRefs: [
              ...result.findings.flatMap((finding) => finding.sourceRefs),
              ...result.auditEvents.flatMap((event) => event.sourceRefs),
            ],
            canBlockUserFlow: result.canBlockUserFlow,
            canModifyPayload: result.canModifyPayload,
            canWriteRegistry: result.canWriteRegistry,
            canTriggerDiagnosis: result.canTriggerDiagnosis,
            runtimeAuthority: result.runtimeAuthority,
          }}
        />

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Safety trace</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Flags que confirman que shadow mode no tiene efecto en producto.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SafetyTraceItem
              label="User blocking disabled"
              value={!result.canBlockUserFlow}
            />
            <SafetyTraceItem
              label="Payload mutation disabled"
              value={!result.canModifyPayload}
            />
            <SafetyTraceItem
              label="Registry write disabled"
              value={!result.canWriteRegistry}
            />
            <SafetyTraceItem
              label="Diagnosis disabled"
              value={!result.canTriggerDiagnosis}
            />
            <SafetyTraceItem label="Runtime gate disabled" value />
            <SafetyTraceItem
              label="Production UI integration disabled"
              value
            />
          </dl>
        </section>
      </div>
    </main>
  );
}
