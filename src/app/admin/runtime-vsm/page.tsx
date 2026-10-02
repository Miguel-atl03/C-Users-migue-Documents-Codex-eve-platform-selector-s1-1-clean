import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import {
  buildRuntimeVsmSnapshot,
  formatPct,
  vsmStatusLabel,
  type AlgedonicEvent,
  type RecentRuntimeCase,
  type RuntimeVsmSnapshot,
  type VsmMetric,
  type VsmPanel,
  type VsmSeverity,
} from "@/runtime-vsm/runtime-vsm";

export const dynamic = "force-dynamic";

const statusClass: Record<VsmSeverity, string> = {
  green: "border-emerald-300 bg-emerald-50 text-emerald-950",
  amber: "border-amber-300 bg-amber-50 text-amber-950",
  red: "border-red-300 bg-red-50 text-red-950",
};

export default async function RuntimeVsmPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            EVE runtime governance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Cuadro de mando VSM
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            No se puede cargar el cuadro VSM porque faltan variables de entorno de Supabase
            (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
          </p>
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Configure el entorno local o use el Panel anterior — Borrador en modo lectura sin
            depender de Supabase.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
              href="/admin/consultant-control-panel?consultant_role=consultant"
            >
              Panel anterior — Borrador
            </Link>
            <Link
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800"
              href="/admin/significado-trace"
            >
              Trazabilidad Significado
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const snapshot = await buildRuntimeVsmSnapshot();
  const panels = [snapshot.s1, snapshot.s2, snapshot.s3, snapshot.s3star, snapshot.s4, snapshot.s5];

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="border-b border-neutral-200 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                EVE runtime governance
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-normal">
                Cuadro de mando VSM
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                Gobierno operacional post-baseline para comprobar que la plataforma consume el canon activo sin reinterpretarlo.
              </p>
            </div>
            <div className={["rounded-md border px-4 py-3 text-sm", statusClass[snapshot.status]].join(" ")}>
              <p className="font-semibold">Estado general: {vsmStatusLabel(snapshot.status)}</p>
              <p className="mt-1">Generado: {snapshot.generatedAt}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-3 py-5 md:grid-cols-4">
          <Summary label="Manifest" value={snapshot.manifest.version} detail={snapshot.manifest.contentHash.slice(0, 16)} />
          <Summary label="Baseline" value={snapshot.baselineSince.slice(0, 10)} detail={snapshot.baselineSince.slice(11, 19)} />
          <Summary label="Sesiones" value={snapshot.scope.sessionCount} detail="post-baseline" />
          <Summary label="Alertas" value={snapshot.algedonic.events.length} detail={vsmStatusLabel(snapshot.algedonic.status)} />
        </section>

        <AlgedonicPanel events={snapshot.algedonic.events} status={snapshot.algedonic.status} />

        <section className="mt-5 grid gap-4 xl:grid-cols-2">
          {panels.map((panel) => (
            <VsmPanelView key={panel.id} panel={panel} />
          ))}
        </section>

        <RecentCases cases={snapshot.recentCases} />
        <TrendPanel snapshot={snapshot} />
        <FailureMap snapshot={snapshot} />
        <Transducers snapshot={snapshot} />
      </div>
    </main>
  );
}

function Summary({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

function VsmPanelView({ panel }: { panel: VsmPanel }) {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{panel.id}</p>
          <h2 className="mt-1 text-xl font-semibold">{panel.title}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{panel.purpose}</p>
        </div>
        <span className={["rounded-md border px-2 py-1 text-xs font-semibold", statusClass[panel.status]].join(" ")}>
          {vsmStatusLabel(panel.status)}
        </span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {panel.metrics.map((metric) => (
          <MetricView key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextList title="Senales" items={panel.signals} />
        <TextList title="Acciones" items={panel.actions} />
      </div>
    </section>
  );
}

function MetricView({ metric }: { metric: VsmMetric }) {
  const cls = metric.status ? statusClass[metric.status] : "border-neutral-200 bg-neutral-50 text-neutral-900";
  return (
    <div className={["rounded-md border px-3 py-3", cls].join(" ")}>
      <p className="text-xs font-medium text-neutral-500">{metric.label}</p>
      <p className="mt-1 text-lg font-semibold">{metric.value}</p>
      {metric.detail && <p className="mt-1 break-all text-xs text-neutral-500">{metric.detail}</p>}
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function AlgedonicPanel({ events, status }: { events: AlgedonicEvent[]; status: VsmSeverity }) {
  return (
    <section className={["rounded-md border p-5 shadow-sm", statusClass[status]].join(" ")}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">Canal algedonico</p>
          <h2 className="mt-1 text-2xl font-semibold">Senales prioritarias</h2>
        </div>
        <p className="text-sm font-semibold">{events.length} evento(s)</p>
      </div>
      {events.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {events.map((event) => (
            <article className="rounded-md border border-current bg-white/60 p-4" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{event.signal}</h3>
                <span className="text-xs font-semibold uppercase">{event.severity}</span>
              </div>
              <p className="mt-2 text-sm leading-6">{event.condition}</p>
              <p className="mt-2 text-sm font-semibold">Responsable: {event.responsibleSystem}</p>
              <p className="mt-1 text-sm leading-6">{event.actionRequired}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6">Sin escalaciones algedonicas en la ventana activa.</p>
      )}
    </section>
  );
}
function RecentCases({ cases }: { cases: RecentRuntimeCase[] }) {
  return (
    <section className="mt-5 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">S1 drill-down</p>
          <h2 className="mt-1 text-2xl font-semibold">Casos operativos recientes</h2>
          <p className="mt-2 text-sm text-neutral-600">Identificadores tecnicos sin contenido sensible de respuestas.</p>
        </div>
        <Link className="text-sm font-semibold text-emerald-700" href="/api/runtime/vsm">
          Ver snapshot JSON
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="py-2 pr-4">scene_id</th>
              <th className="py-2 pr-4">timestamp</th>
              <th className="py-2 pr-4">manifest</th>
              <th className="py-2 pr-4">readiness</th>
              <th className="py-2 pr-4">confidence</th>
              <th className="py-2 pr-4">bundles</th>
              <th className="py-2 pr-4">B7</th>
              <th className="py-2 pr-4">anomalias</th>
            </tr>
          </thead>
          <tbody>
            {cases.slice(0, 20).map((item) => (
              <tr className="border-b border-neutral-100" key={item.sceneId}>
                <td className="max-w-48 truncate py-2 pr-4 font-mono text-xs">{item.sceneId}</td>
                <td className="py-2 pr-4 text-xs">{item.timestamp}</td>
                <td className="py-2 pr-4">{item.manifestVersion}</td>
                <td className="py-2 pr-4">{item.readiness}</td>
                <td className="py-2 pr-4">{item.confidenceScore ?? "n/a"}</td>
                <td className="py-2 pr-4">{item.bundlesComplete ? "si" : "no"}</td>
                <td className="py-2 pr-4">{item.block7Complete ? "si" : "no"}</td>
                <td className="py-2 pr-4">{item.anomalyCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrendPanel({ snapshot }: { snapshot: RuntimeVsmSnapshot }) {
  return (
    <section className="mt-5 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">S4 tendencias</p>
      <h2 className="mt-1 text-2xl font-semibold">Deriva semanal y mensual</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SeriesTable title="Weekly series" rows={snapshot.trends.weekly} />
        <SeriesTable title="Monthly series" rows={snapshot.trends.monthly} />
      </div>
      <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold">Riesgos emergentes</h3>
        {snapshot.trends.driftSignals.length ? (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {snapshot.trends.driftSignals.map((signal) => (
              <article className="rounded-md border border-neutral-200 bg-white p-3 text-sm" key={signal.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{signal.metric}</p>
                  <span className="text-xs uppercase text-neutral-500">{signal.cadence}</span>
                </div>
                <p className="mt-2 text-neutral-600">{signal.detail}</p>
                <p className="mt-1 text-xs text-neutral-500">{signal.direction} / {signal.severity}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">Sin senales de deriva temporal sostenida.</p>
        )}
      </div>
    </section>
  );
}

function SeriesTable({
  title,
  rows,
}: {
  title: string;
  rows: RuntimeVsmSnapshot["trends"]["weekly"];
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-neutral-200 uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="py-2 pr-3">Periodo</th>
              <th className="py-2 pr-3">Escenas</th>
              <th className="py-2 pr-3">Bundles</th>
              <th className="py-2 pr-3">B7</th>
              <th className="py-2 pr-3">Salida</th>
              <th className="py-2 pr-3">Conf avg/med</th>
              <th className="py-2 pr-3">Micro avg/max</th>
              <th className="py-2 pr-3">Anom.</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(-8).map((row) => (
              <tr className="border-b border-neutral-100" key={`${title}:${row.periodStart}`}>
                <td className="py-2 pr-3">{row.periodLabel}</td>
                <td className="py-2 pr-3">{row.scenesCount}</td>
                <td className="py-2 pr-3">{formatPct(row.bundleCompletenessRatio)}</td>
                <td className="py-2 pr-3">{formatPct(row.block7CompletenessRatio)}</td>
                <td className="py-2 pr-3">{formatPct(row.intermediateOutputRatio)}</td>
                <td className="py-2 pr-3">{row.confidenceScoreAverage ?? "n/a"}/{row.confidenceScoreMedian ?? "n/a"}</td>
                <td className="py-2 pr-3">{row.microconfirmationsAverage ?? "n/a"}/{row.microconfirmationsMax}</td>
                <td className="py-2 pr-3">{row.criticalAnomalies}/{row.majorAnomalies}/{row.minorAnomalies}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="mt-2 text-sm text-neutral-600">Sin datos post-baseline en esta serie.</p>}
      </div>
    </div>
  );
}

function FailureMap({ snapshot }: { snapshot: RuntimeVsmSnapshot }) {
  return (
    <section className="mt-5 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Fallas estructurales prevenidas</p>
      <h2 className="mt-1 text-2xl font-semibold">Indicadores, alertas y acciones</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {snapshot.structuralFailureMap.map((item) => (
          <article className="rounded-md border border-neutral-200 bg-neutral-50 p-4" key={item.failure}>
            <p className="text-sm font-semibold">{item.failure}</p>
            <p className="mt-2 text-sm text-neutral-600">Vista principal: {item.primaryView}</p>
            <p className="mt-1 text-sm text-neutral-600">Indicador: {item.indicator}</p>
            <p className="mt-1 text-sm text-neutral-600">Alerta: {item.alert}</p>
            <p className="mt-1 text-sm text-neutral-600">Accion: {item.suggestedAction}</p>
            <p className="mt-1 text-xs text-neutral-500">{item.severityRule}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Transducers({ snapshot }: { snapshot: RuntimeVsmSnapshot }) {
  return (
    <section className="mt-5 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Canales y transductores</p>
      <h2 className="mt-1 text-2xl font-semibold">Comunicacion operacional real</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {snapshot.transducers.map((item) => (
          <article className="rounded-md border border-neutral-200 bg-neutral-50 p-4" key={item.name}>
            <p className="font-semibold">{item.name}</p>
            <p className="mt-2 text-sm text-neutral-600">Usado por: {item.usedBy.join(", ")}</p>
            <p className="mt-1 text-sm text-neutral-600">Variedad: {item.varietyRole}</p>
            <p className="mt-1 text-sm text-neutral-600">Previene/detecta: {item.detectsOrPrevents}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
