import Link from "next/link";
import type { ReactNode } from "react";
import type { OperationalDescriptionCoachEvent } from "@/services/operational-description-coach/coach-event";
import type { SignificadoConsultantTrace } from "@/services/significado-consultant-trace";
import type { SignificadoBlock0AnswerRecord } from "@/services/significado-block0-repository";

const coachSourceLabels: Record<OperationalDescriptionCoachEvent["coachSource"], string> = {
  deterministic: "Determinístico",
  llm: "LLM",
};

const sufficiencyLabels: Record<
  OperationalDescriptionCoachEvent["scan"]["sufficiency"],
  string
> = {
  empty: "Vacío",
  insufficient: "Insuficiente",
  operational: "Operativo",
  mastery: "Dominio",
};

const gapLabels: Record<
  NonNullable<OperationalDescriptionCoachEvent["scan"]["priorityGap"]>,
  string
> = {
  trigger_input: "Disparador / entrada",
  transformation_core: "Transformación central",
  standard_or_rule: "Estándar o regla",
  attenuation: "Atenuación / priorización",
  escalation: "Escalamiento",
  handoff_output: "Entrega / salida",
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SignificadoConsultantTraceView({
  trace,
}: {
  trace: SignificadoConsultantTrace;
}) {
  const isMissingSupabaseEnv = trace.status === "supabase_missing_env";
  const exportHref = `/api/export/activity-collection-xlsx?sessionId=${encodeURIComponent(trace.sessionId)}`;
  const sessionIdLabel = isMissingSupabaseEnv
    ? trace.sessionId
    : `${trace.sessionId.slice(0, 8)}…`;

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8">
        <header className="border-b border-neutral-200 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Trazabilidad interna
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                Significado · descripción operativa
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                Vista de consultor para auditar la respuesta final de B0-Q02 y las
                asistencias inline registradas durante la redacción. No se muestra al
                usuario final.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-neutral-800"
                href="/admin/significado-trace"
              >
                Otra sesión
              </Link>
              {!isMissingSupabaseEnv ? (
                <a
                  className="rounded-md bg-neutral-950 px-4 py-2 text-center text-sm font-medium text-white"
                  href={exportHref}
                >
                  Descargar Excel
                </a>
              ) : null}
            </div>
          </div>
        </header>

        {isMissingSupabaseEnv ? (
          <section className="mt-5 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
            <p className="font-semibold">
              Supabase no configurado para esta prueba local
            </p>
            <p className="mt-2 leading-6">
              No se consultaron datos reales. Esta vista conserva el layout de
              trazabilidad para revisión visual sin depender de variables de entorno
              de Supabase.
            </p>
            <p className="mt-3 font-mono text-xs text-sky-900">
              sessionId: {trace.sessionId}
            </p>
          </section>
        ) : null}

        <section className="grid gap-3 py-5 md:grid-cols-4">
          <SummaryMetric label="Session ID" value={sessionIdLabel} />
          <SummaryMetric
            label="Eventos coach"
            value={trace.coachEvents.length}
          />
          <SummaryMetric
            label="Respuestas Block 0"
            value={trace.block0Answers.length}
          />
          <SummaryMetric
            label="Estado sesión"
            value={trace.session?.estadoActual ?? "No encontrada"}
          />
        </section>

        {!isMissingSupabaseEnv && !trace.session ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            No encontramos la sesión en Supabase. Aun así mostramos filas si
            existieran eventos huérfanos con ese identificador.
          </section>
        ) : null}

        <section className="space-y-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Respuesta final capturada
            </p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">
              B0-Q02 · Descripción operativa
            </h2>
          </div>
          {trace.operationalDescriptionFinal ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-800">
              {trace.operationalDescriptionFinal}
            </p>
          ) : (
            <p className="text-sm leading-6 text-neutral-600">
              Aún no hay respuesta persistida para B0-Q02 en esta sesión.
            </p>
          )}
          {trace.session ? (
            <p className="text-xs text-neutral-500">
              Sesión creada {formatTimestamp(trace.session.createdAt)} · actualizada{" "}
              {formatTimestamp(trace.session.updatedAt)}
            </p>
          ) : null}
        </section>

        <section className="mt-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Asistencia inline
            </p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">
              Trazas del coach ({trace.coachEvents.length})
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
              Cada evento refleja un mensaje útil mostrado al usuario mientras redactaba.
              El más reciente aparece primero.
            </p>
          </div>

          {trace.coachEvents.length ? (
            <div className="space-y-3">
              {trace.coachEvents.map((event, index) => (
                <CoachEventCard event={event} index={index} key={event.eventId} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              No hay eventos de coach persistidos para esta sesión.
            </div>
          )}
        </section>

        <section className="mt-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Runtime Block 0
            </p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">
              Respuestas Significado ({trace.block0Answers.length})
            </h2>
          </div>
          <Block0AnswersTable answers={trace.block0Answers} />
        </section>

        <footer className="mt-6 text-xs text-neutral-500">
          Generado {formatTimestamp(trace.generatedAt)}
          {isMissingSupabaseEnv
            ? " · sin consulta a Supabase (prueba local)"
            : " · fuente Supabase (`respuestas_estructuradas`)"}
        </footer>
      </div>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
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

function CoachEventCard({
  event,
  index,
}: {
  event: OperationalDescriptionCoachEvent;
  index: number;
}) {
  const gapLabel = event.scan.priorityGap
    ? gapLabels[event.scan.priorityGap]
    : "Sin brecha prioritaria";

  return (
    <article className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Evento {traceIndexLabel(index)} · {formatTimestamp(event.occurredAt)}
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-950">
            Borrador: «{event.draftTextSnippet}»
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{coachSourceLabels[event.coachSource]}</Badge>
          <Badge>{sufficiencyLabels[event.scan.sufficiency]}</Badge>
          <Badge>{event.scan.coachTier}</Badge>
          {event.contextSummary.narrativeMode ? (
            <Badge tone="emerald">Modo narrativo</Badge>
          ) : null}
        </div>
      </div>

      {event.coachMessage ? (
        <p className="mt-4 text-sm leading-7 text-neutral-800">{event.coachMessage}</p>
      ) : null}

      {event.exampleFragment ? (
        <p className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-700">
          <span className="font-semibold text-neutral-950">Ejemplo incremental: </span>
          {event.exampleFragment}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <MetaItem label="Brecha prioritaria" value={gapLabel} />
        <MetaItem
          label="Actividad WorkMap"
          value={event.workMapActivityId ?? "—"}
        />
        <MetaItem
          label="Actividad legacy"
          value={event.legacyActivityId ?? "—"}
        />
        <MetaItem label="Hash borrador" value={event.draftTextHash} />
        <MetaItem
          label="Verbo / título"
          value={
            [event.contextSummary.actionVerb, event.contextSummary.activityTitle]
              .filter(Boolean)
              .join(" · ") || "—"
          }
        />
        <MetaItem label="Event ID" value={event.eventId} />
      </dl>
    </article>
  );
}

function Block0AnswersTable({
  answers,
}: {
  answers: SignificadoBlock0AnswerRecord[];
}) {
  if (!answers.length) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        No hay respuestas Block 0 persistidas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Pregunta</th>
            <th className="px-4 py-3 font-semibold">Subcampo</th>
            <th className="px-4 py-3 font-semibold">Respuesta</th>
            <th className="px-4 py-3 font-semibold">Capturada</th>
          </tr>
        </thead>
        <tbody>
          {answers.map((answer) => (
            <tr className="border-b border-neutral-100 align-top" key={answer.id}>
              <td className="px-4 py-3 font-medium text-neutral-950">
                {answer.questionCode}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {answer.subfieldId ?? "—"}
              </td>
              <td className="max-w-xl px-4 py-3 whitespace-pre-wrap leading-6 text-neutral-800">
                {answer.answerText}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {formatTimestamp(answer.capturedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 break-all leading-6 text-neutral-800">{value}</dd>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "emerald";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-neutral-200 bg-neutral-50 text-neutral-700";

  return (
    <span
      className={[
        "rounded-md border px-2 py-1 text-xs font-medium",
        toneClass,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function traceIndexLabel(index: number) {
  return `#${index + 1}`;
}
