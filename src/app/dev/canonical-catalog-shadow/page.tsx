import Link from "next/link";

import {
  buildCanonicalCatalogShadowHarness,
  CANONICAL_CATALOG_SHADOW_FIXTURE_IDS,
  type CanonicalCatalogShadowFixtureId,
} from "@/features/dev/canonical-catalog-shadow-fixtures";

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

function StateCard({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string | boolean | number;
  mono?: boolean;
}) {
  const display = String(value);
  const isFalse = display === "false";

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd
        className={`mt-1 break-words text-sm font-semibold ${
          mono ? "font-mono" : ""
        } ${isFalse ? "text-emerald-700" : "text-neutral-900"}`}
      >
        {display}
      </dd>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{ fixture?: string }>;
};

export default async function CanonicalCatalogShadowDevPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const harness = buildCanonicalCatalogShadowHarness();
  const selectedFixtureId = (CANONICAL_CATALOG_SHADOW_FIXTURE_IDS as readonly string[]).includes(
    params.fixture ?? "",
  )
    ? (params.fixture as CanonicalCatalogShadowFixtureId)
    : harness.fixtures[0]!.fixtureId;
  const selectedFixture =
    harness.fixtures.find((fixture) => fixture.fixtureId === selectedFixtureId) ??
    harness.fixtures[0]!;

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-neutral-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            DEV HARNESS ONLY
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            EVE-03 Canonical Catalog Shadow
          </h1>
          <p className="mt-2 text-sm font-semibold text-amber-800">NOT PRODUCTIVE UI</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StateCard label="runtimeAuthority" value={harness.runtimeAuthority} />
            <StateCard label="registryWrite" value={harness.registryWrite} />
            <StateCard label="productWiring" value={harness.productWiring} />
          </dl>
        </header>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">A. Chip metadata</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="chipId" value={harness.chipId} />
            <StateCard label="mode" value={harness.mode} />
            <StateCard label="version" value={harness.version} />
            <StateCard label="status" value={harness.status} />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">B. Source policy</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {harness.sourcePolicy.map((entry) => (
              <li className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2" key={entry.sourceId}>
                <span className="font-mono font-semibold">{entry.sourceId}</span>
                <span className="text-neutral-600"> · {entry.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">C. Catalog counters</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StateCard label="total nodes" value={harness.counters.totalNodes} />
            <StateCard label="total source codes" value={harness.counters.totalSourceCodes} />
            <StateCard
              label="total canonical variables"
              value={harness.counters.totalCanonicalVariables}
            />
            <StateCard
              label="total node-variable mappings"
              value={harness.counters.totalNodeVariableMappings}
            />
            <StateCard label="total critical routes" value={harness.counters.totalCriticalRoutes} />
            <StateCard
              label="CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED"
              value={harness.counters.referencedNotDefined}
            />
          </dl>
        </section>

        <section className="rounded border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">D. Living gap</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="gapId" value={harness.livingGap.gapId} />
            <StateCard label="status" value={harness.livingGap.status} />
            <StateCard label="count" value={harness.livingGap.count} />
            <StateCard label="meaning" value={harness.livingGap.meaning} mono={false} />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">E. No-cableado</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {harness.noWiringLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">F. safetyFlags</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="canBlockUserFlow" value={harness.safetyFlags.canBlockUserFlow} />
            <StateCard label="canModifyPayload" value={harness.safetyFlags.canModifyPayload} />
            <StateCard label="canWriteRegistry" value={harness.safetyFlags.canWriteRegistry} />
            <StateCard label="canModifyCatalog" value={harness.safetyFlags.canModifyCatalog} />
            <StateCard label="canTriggerRuntime" value={harness.safetyFlags.canTriggerRuntime} />
            <StateCard label="canTriggerDiagnosis" value={harness.safetyFlags.canTriggerDiagnosis} />
            <StateCard label="canTriggerExport" value={harness.safetyFlags.canTriggerExport} />
            <StateCard label="runtimeAuthority" value={harness.safetyFlags.runtimeAuthority} />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">G. Fixture seleccionado</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {harness.fixtures.map((fixture) => (
              <Link
                className={`rounded border px-3 py-2 text-sm font-medium ${
                  fixture.fixtureId === selectedFixture.fixtureId
                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
                href={`/dev/canonical-catalog-shadow?fixture=${fixture.fixtureId}`}
                key={fixture.fixtureId}
              >
                {fixture.fixtureId}
              </Link>
            ))}
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="fixtureId" value={selectedFixture.fixtureId} />
            <StateCard label="queryType" value={selectedFixture.input.queryType} />
            <StateCard
              label="expectedReadinessState"
              value={selectedFixture.expectedReadinessState}
            />
            <StateCard
              label="actualReadinessState"
              value={selectedFixture.actualReadinessState}
            />
            <StateCard label="expectedResolved" value={selectedFixture.expectedResolved} />
            <StateCard label="actualResolved" value={selectedFixture.actualResolved} />
            <div
              className={`rounded border p-3 ${
                selectedFixture.match
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <dt className="text-xs font-medium text-neutral-500">MATCH</dt>
              <dd
                className={`mt-1 font-mono text-sm font-semibold ${
                  selectedFixture.match ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {String(selectedFixture.match)}
              </dd>
            </div>
          </dl>
        </section>

        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Esta pantalla permite revisar cómo el catálogo canónico responde en shadow mode.
          No afecta al usuario final ni al flujo productivo.
        </div>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="Input identifiers" value={selectedFixture.input} />
          <JsonTrace title="resolvedEntity" value={selectedFixture.result.resolvedEntity} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="missingReferences" value={selectedFixture.result.missingReferences} />
          <JsonTrace title="gapFlags" value={selectedFixture.result.gapFlags} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="sourceTrace" value={selectedFixture.result.sourceTrace} />
          <JsonTrace title="evidenceRefs" value={selectedFixture.result.evidenceRefs} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="allowedActions" value={selectedFixture.result.allowedActions} />
          <JsonTrace title="blockedActions" value={selectedFixture.result.blockedActions} />
        </section>

        <JsonTrace title="requiredInputs" value={selectedFixture.result.requiredInputs} />

        <section className="grid gap-5 lg:grid-cols-2">
          <JsonTrace title="findings" value={selectedFixture.result.findings} />
          <JsonTrace
            title="auditEvents"
            value={{
              count: selectedFixture.result.auditEvents.length,
              events: selectedFixture.result.auditEvents,
            }}
          />
        </section>

        <JsonTrace title="safetyFlags" value={selectedFixture.result.safetyFlags} />
      </div>
    </main>
  );
}