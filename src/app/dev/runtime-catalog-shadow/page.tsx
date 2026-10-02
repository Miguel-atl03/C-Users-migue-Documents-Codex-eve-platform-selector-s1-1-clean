import { buildRuntimeCatalogShadowHarness } from "@/features/dev/runtime-catalog-shadow-fixtures";

function StateCard({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean;
}) {
  const display = String(value);
  const isFalse = display === "false";
  const isTrue = display === "true";

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd
        className={`mt-1 break-words font-mono text-sm font-semibold ${
          isFalse ? "text-emerald-700" : isTrue ? "text-blue-700" : "text-neutral-900"
        }`}
      >
        {display}
      </dd>
    </div>
  );
}

function JsonTrace({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <pre className="mt-3 max-h-[340px] overflow-auto rounded bg-neutral-950 p-3 text-xs leading-5 text-neutral-50">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

export default function RuntimeCatalogShadowDevPage() {
  const harness = buildRuntimeCatalogShadowHarness();

  return (
    <main className="min-h-screen bg-[#f6f6f4] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-neutral-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            DEV HARNESS ONLY
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            EVE-04 Runtime Catalog Shadow
          </h1>
          <p className="mt-2 text-sm font-semibold text-amber-800">NOT PRODUCTIVE UI</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="runtimeAuthority" value={false} />
            <StateCard label="registryWrite" value={false} />
            <StateCard label="productWiring" value={false} />
            <StateCard label="eveBrainConnection" value={false} />
          </dl>
        </header>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Shadow metadata</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StateCard label="chipId" value={harness.chipId} />
            <StateCard label="mode" value={harness.mode} />
            <StateCard label="version" value={harness.version} />
            <StateCard label="status" value={harness.status} />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">documentarySatisfaction</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StateCard label="status" value={harness.documentarySatisfaction.status} />
            <StateCard label="mismatches" value={harness.documentarySatisfaction.mismatches} />
            <StateCard label="missingInChip" value={harness.documentarySatisfaction.missingInChip} />
            <StateCard label="missingInSource" value={harness.documentarySatisfaction.missingInSource} />
            <StateCard
              label="pendingSourceProof"
              value={harness.documentarySatisfaction.pendingSourceProof}
            />
            <StateCard
              label="protectedByStaticTests"
              value={harness.documentarySatisfaction.protectedByStaticTests}
            />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Runtime counters</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StateCard label="total base interactions" value={harness.counters.baseInteractions} />
            <StateCard label="total causal interactions" value={harness.counters.causalInteractions} />
            <StateCard label="total UX subfields" value={harness.counters.uxSubfields} />
            <StateCard label="total branching rules" value={harness.counters.branchingRules} />
            <StateCard label="total branching scores" value={harness.counters.branchingScores} />
            <StateCard label="total readiness states" value={harness.counters.readinessStates} />
            <StateCard label="source_nodes coverage" value={harness.counters.sourceNodesCoverage} />
            <StateCard label="source_codes coverage" value={harness.counters.sourceCodesCoverage} />
            <StateCard label="CCOV-001" value={harness.counters.ccov001} />
            <StateCard label="CVAR-001" value={harness.counters.cvar001} />
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">safetyFlags</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(harness.safetyFlags).map(([key, value]) => (
              <StateCard label={key} value={value} key={key} />
            ))}
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">No-cableado</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {harness.noWiringLines.map((line) => (
              <li className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2" key={line}>
                {line}
              </li>
            ))}
            <li className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
              No <span>Supa</span>
              <span>base.</span>
            </li>
            <li className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
              No SQL.
            </li>
          </ul>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Fixtures</h2>
          <div className="mt-4 space-y-4">
            {harness.fixtures.map((fixture) => (
              <article
                className="rounded border border-neutral-200 bg-neutral-50 p-4"
                key={fixture.fixtureId}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-mono text-sm font-semibold">{fixture.fixtureId}</h3>
                  <span
                    className={`rounded border px-2 py-1 font-mono text-xs font-semibold ${
                      fixture.match
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    }`}
                  >
                    MATCH {String(fixture.match)}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StateCard label="fixtureId" value={fixture.fixtureId} />
                  <StateCard label="queryType" value={fixture.queryType} />
                  <StateCard
                    label="expectedReadinessState"
                    value={fixture.expectedReadinessState}
                  />
                  <StateCard
                    label="actualReadinessState"
                    value={fixture.actualReadinessState}
                  />
                  <StateCard label="expectedResolved" value={fixture.expectedResolved} />
                  <StateCard label="actualResolved" value={fixture.actualResolved} />
                  <StateCard label="auditEvents count" value={fixture.auditEvents.count} />
                  <StateCard label="findings count" value={fixture.findings.count} />
                </dl>
                <section className="mt-4 grid gap-4 lg:grid-cols-2">
                  <JsonTrace title="input identifiers" value={fixture.inputSummary} />
                  <JsonTrace title="resolvedEntity" value={fixture.resolvedEntity} />
                  <JsonTrace title="missingReferences" value={fixture.missingReferences} />
                  <JsonTrace title="gapFlags" value={fixture.gapFlags} />
                  <JsonTrace title="sourceTrace" value={fixture.sourceTrace} />
                  <JsonTrace title="evidenceRefs" value={fixture.evidenceRefs} />
                  <JsonTrace title="allowedActions" value={fixture.allowedActions} />
                  <JsonTrace title="blockedActions" value={fixture.blockedActions} />
                  <JsonTrace title="requiredInputs" value={fixture.requiredInputs} />
                  <JsonTrace title="findings" value={fixture.findings} />
                  <JsonTrace title="auditEvents count" value={fixture.auditEvents} />
                  <JsonTrace title="safetyFlags" value={fixture.safetyFlags} />
                  <JsonTrace
                    title="documentarySatisfaction"
                    value={fixture.documentarySatisfaction}
                  />
                </section>
              </article>
            ))}
          </div>
        </section>

        <JsonTrace title="sourceTrace" value={harness.sourceTrace} />
      </div>
    </main>
  );
}
