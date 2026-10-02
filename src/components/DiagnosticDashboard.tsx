"use client";

import type {
  ActivityDiagnostic,
  DiagnosticFinding,
  DiagnosticSeverity,
  FinalActivitySummary,
  SessionDiagnostic,
  SessionFinalOutput,
  SupportActivitySelection,
} from "@/domain/diagnostics";
import type { ActivityStructuralScore } from "@/domain/activity";

type Props = {
  diagnostic: SessionDiagnostic;
  sessionId?: string | null;
  primaryActivities: ActivityStructuralScore[];
  supportActivities: ActivityStructuralScore[];
  supportTrace?: SupportActivitySelection[];
  onRefresh: () => void;
  refreshing?: boolean;
};

const closureLabels: Record<ActivityDiagnostic["closure"]["status"], string> = {
  closed: "Suficientemente explicada",
  partial: "Parcialmente explicada",
  gap_requires_support: "Requiere informacion adicional",
};

const qualityLabels: Record<
  ActivityDiagnostic["closure"]["activity_closure_state"],
  string
> = {
  closed_solid: "Cierre solido",
  closed_with_consistency_alerts: "Cierre con alertas",
  partial_requires_clarification: "Requiere aclaracion",
  blocked_by_critical_contradiction: "Bloqueada por aclaracion",
};

const severityClasses: Record<DiagnosticSeverity, string> = {
  info: "border-neutral-200 bg-neutral-50 text-neutral-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-red-200 bg-red-50 text-red-900",
};

const sessionQualityLabels = {
  solid: "Cierre solido",
  with_alerts: "Cierre suficiente con alertas",
  partial: "Cierre parcial",
  blocked: "Cierre bloqueado",
} as const;

const sessionQualityDescriptions = {
  solid:
    "La informacion reunida permite entender el rol funcional sin gaps relevantes.",
  with_alerts:
    "La informacion permite avanzar, pero conserva alertas que conviene revisar.",
  partial:
    "El levantamiento tiene valor diagnostico, aunque quedaron gaps o cierres parciales.",
  blocked:
    "La sesion no debe cerrarse todavia porque hay una aclaracion o contradiccion critica pendiente.",
} as const;

const activityStateLabels: Record<
  FinalActivitySummary["closureState"],
  string
> = {
  closed_solid: "Solida",
  closed_with_consistency_alerts: "Con alertas",
  partial_requires_clarification: "Parcial",
  blocked_by_critical_contradiction: "Bloqueada",
};

export function DiagnosticDashboard({
  diagnostic,
  sessionId,
  primaryActivities,
  supportActivities,
  supportTrace = [],
  onRefresh,
  refreshing = false,
}: Props) {
  const primaryIds = new Set(
    primaryActivities.map((activity) => activity.activityId),
  );
  const primaryDiagnostics = diagnostic.activities.filter((activity) =>
    primaryIds.has(activity.activityId),
  );
  const closedPrimary = primaryDiagnostics.filter(
    (activity) => activity.closure.status === "closed",
  ).length;
  const answeredSupportCount = supportTrace.filter(
    (selection) => selection.support_activity_selected,
  ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Diagnostico preliminar
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
            Lectura relacional de actividades
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            Esta salida resume lo que EVE puede inferir con la evidencia actual:
            mision funcional, objeto de trabajo, dependencias, tensiones y grado
            de cierre por actividad principal.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {sessionId && diagnostic.finalOutput && (
            <a
              className="rounded-md bg-neutral-950 px-4 py-2 text-center text-sm font-medium text-white"
              href={`/api/export/activity-collection-xlsx?sessionId=${encodeURIComponent(sessionId)}`}
            >
              Descargar Excel
            </a>
          )}
          <button
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-400"
            disabled={refreshing}
            onClick={onRefresh}
            type="button"
          >
            {refreshing ? "Actualizando..." : "Actualizar diagnostico"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryMetric
          label="Actividades principales"
          value={primaryActivities.length}
        />
        <SummaryMetric
          label="Actividades soporte guardadas"
          value={supportActivities.length}
        />
        <SummaryMetric
          label="Adicionales respondidas"
          value={answeredSupportCount}
        />
        <SummaryMetric
          label="Cerradas principales"
          value={`${closedPrimary} de ${primaryActivities.length}`}
        />
      </div>

      {diagnostic.finalOutput && (
        <FinalOutputView finalOutput={diagnostic.finalOutput} />
      )}

      <div className="space-y-4">
        {primaryDiagnostics.map((activity, index) => (
          <ActivityDiagnosticCard
            activity={activity}
            index={index}
            key={activity.activityId}
          />
        ))}
      </div>
    </section>
  );
}

function FinalOutputView({
  finalOutput,
}: {
  finalOutput: SessionFinalOutput;
}) {
  return (
    <section className="space-y-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Salida final del levantamiento
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
            {sessionQualityLabels[finalOutput.session_closure_quality]}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
            {sessionQualityDescriptions[finalOutput.session_closure_quality]}
          </p>
        </div>
        <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          {finalOutput.session_status}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryMetric
          label="Principales usadas"
          value={finalOutput.main_activities_used.length}
        />
        <SummaryMetric
          label="Soporte usadas"
          value={finalOutput.support_activities_used.length}
        />
        <SummaryMetric
          label="Alertas"
          value={finalOutput.consistency_alerts_global.length}
        />
        <SummaryMetric
          label="Gaps residuales"
          value={finalOutput.unresolved_gaps_global.length}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivitySummaryList
          activities={finalOutput.main_activities_used}
          emptyText="No hay actividades principales disponibles en la salida."
          title="Actividades principales usadas"
        />
        <ActivitySummaryList
          activities={finalOutput.support_activities_used}
          emptyText="No fue necesario incorporar actividades soporte."
          title="Actividades soporte usadas"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextListPanel
          emptyText="No se detectaron dependencias relevantes."
          items={finalOutput.key_dependencies}
          tone="neutral"
          title="Dependencias relevantes"
        />
        <TextListPanel
          emptyText="No se detectaron tensiones relevantes."
          items={finalOutput.key_tensions}
          tone="amber"
          title="Tensiones detectadas"
        />
        <TextListPanel
          emptyText="No quedaron gaps residuales."
          items={finalOutput.unresolved_gaps_global}
          tone="neutral"
          title="Gaps residuales"
        />
        <TextListPanel
          emptyText="No hay alertas de consistencia globales."
          items={finalOutput.consistency_alerts_global.map(
            (alert) => `${alert.title}: ${alert.message}`,
          )}
          tone="amber"
          title="Alertas de consistencia"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SignalSummaryPanel
          items={finalOutput.vsm_signals_summary}
          title="Senales VSM"
        />
        <SignalSummaryPanel
          items={finalOutput.mmabp_closure_summary}
          title="Cierre MMABP"
        />
        <SignalSummaryPanel
          items={finalOutput.ahe_summary}
          title="Resumen AHE"
        />
      </div>

      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Trazabilidad del cierre
        </p>
        <div className="mt-3 space-y-2">
          {finalOutput.closure_trace.map((trace) => (
            <div
              className="rounded-md border border-neutral-200 bg-white p-3 text-sm"
              key={trace.step}
            >
              <p className="font-semibold text-neutral-950">{trace.status}</p>
              <p className="mt-1 leading-6 text-neutral-600">{trace.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivitySummaryList({
  activities,
  emptyText,
  title,
}: {
  activities: FinalActivitySummary[];
  emptyText: string;
  title: string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      {activities.length ? (
        <div className="mt-3 space-y-2">
          {activities.map((activity, index) => (
            <div
              className="rounded-md border border-neutral-200 bg-white p-3"
              key={activity.activityId}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm font-medium leading-6 text-neutral-950">
                  {index + 1}. {activity.activityText}
                </p>
                <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                  {activityStateLabels[activity.closureState]} -{" "}
                  {Math.round(activity.closureConfidence * 100)}%
                </span>
              </div>
              {activity.consistencyAlertCount > 0 && (
                <p className="mt-2 text-xs text-amber-800">
                  {activity.consistencyAlertCount} alerta(s) de consistencia
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-neutral-600">{emptyText}</p>
      )}
    </div>
  );
}

function TextListPanel({
  emptyText,
  items,
  title,
  tone,
}: {
  emptyText: string;
  items: string[];
  title: string;
  tone: "neutral" | "amber";
}) {
  const panelTone =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-neutral-200 bg-neutral-50 text-neutral-800";

  return (
    <div className={["rounded-md border p-4", panelTone].join(" ")}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6">{emptyText}</p>
      )}
    </div>
  );
}

function SignalSummaryPanel({
  items,
  title,
}: {
  items: Record<string, number>;
  title: string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {Object.entries(items).map(([label, value]) => (
          <div className="flex items-center justify-between gap-3" key={label}>
            <span className="text-sm leading-5 text-neutral-700">
              {label.replaceAll("_", " ")}
            </span>
            <span className="rounded-md bg-white px-2 py-1 text-sm font-semibold text-neutral-950">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function ActivityDiagnosticCard({
  activity,
  index,
}: {
  activity: ActivityDiagnostic;
  index: number;
}) {
  const requiresSupport = activity.closure.status === "gap_requires_support";

  return (
    <article className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Actividad {index + 1}
          </p>
          <h2 className="mt-2 max-w-4xl text-lg font-semibold leading-7 text-neutral-950">
            {activity.activityText}
          </h2>
        </div>
        {!requiresSupport && (
          <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {closureLabels[activity.closure.status]} -{" "}
            {Math.round(activity.closure.confidence * 100)}%
          </div>
        )}
      </div>

      {requiresSupport && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Esta actividad principal requiere informacion adicional para quedar
          suficientemente explicada.
        </div>
      )}

      <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800">
        <p className="font-semibold text-neutral-950">
          Calidad del cierre:{" "}
          {qualityLabels[activity.closure.activity_closure_state]}
        </p>
        {activity.consistency.clarification_response && (
          <p className="mt-1 leading-6">
            Esta actividad ya incluye una aclaracion adicional del usuario.
          </p>
        )}
      </div>

      {activity.consistency.consistency_alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {activity.consistency.consistency_alerts.map((alert) => (
            <div
              className={[
                "rounded-md border p-3 text-sm",
                alert.level === "critical" || alert.level === "high"
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-neutral-200 bg-neutral-50 text-neutral-800",
              ].join(" ")}
              key={alert.code}
            >
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 leading-6">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {activity.signals.map((signal) => (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
            key={signal.code}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {signal.label}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-neutral-950">
              {signal.value}
            </p>
          </div>
        ))}
      </div>

      {!requiresSupport && <Findings findings={activity.findings} />}

      {activity.closure.missingCapabilities.length > 0 && (
        <div className="mt-4 rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-950">
            Capacidades por completar
          </p>
          <p className="mt-1">
            {activity.closure.missingCapabilities.join(", ")}
          </p>
        </div>
      )}
    </article>
  );
}

function Findings({ findings }: { findings: DiagnosticFinding[] }) {
  if (!findings.length) {
    return (
      <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        No se detectaron contradicciones relevantes con la evidencia disponible.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {findings.map((finding, index) => (
        <div
          className={[
            "rounded-md border p-3 text-sm",
            severityClasses[finding.severity],
          ].join(" ")}
          key={`${finding.code}-${index}`}
        >
          <p className="font-semibold">{finding.title}</p>
          <p className="mt-1 leading-6">{finding.explanation}</p>
        </div>
      ))}
    </div>
  );
}
