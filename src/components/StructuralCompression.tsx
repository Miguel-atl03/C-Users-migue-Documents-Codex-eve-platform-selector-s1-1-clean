"use client";

import type { Activity, StructuralAnswer } from "@/lib/types";

type Props = {
  activities: Activity[];
  disabled?: boolean;
  onComplete: (answers: StructuralAnswer[]) => void;
};

export function StructuralCompression({
  activities,
  disabled = false,
  onComplete,
}: Props) {
  const answers = activities.map((activity, index) => ({
    activityId: activity.id,
    contextConfirmed: true,
    autonomyLevel: index % 2 === 0 ? "autonomia_media" : "requiere_autorizacion",
    dependencyLevel: index < 3 ? "dependencia_alta" : "dependencia_baja",
    qualityImpact: activity.critical ? "impacto_alto" : "impacto_medio",
  }));

  return (
    <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Capa 2 - Compresion
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Tarjetas con ancla narrativa
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          Cada actividad se trabaja como tarjeta individual. Las preguntas V1
          aparecen prellenadas, las V2 se confirman o ajustan, y el contexto se
          hereda para evitar redundancia.
        </p>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <article
            className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
            key={activity.id}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ancla narrativa inmutable
            </p>
            <blockquote className="mt-2 border-l-2 border-emerald-500 pl-4 text-sm text-neutral-700">
              {activity.narrativeAnchor}
            </blockquote>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="Contexto" value="Heredado y confirmado" />
              <Field label="Autonomia" value={answers[index].autonomyLevel} />
              <Field label="Dependencia" value={answers[index].dependencyLevel} />
            </div>
          </article>
        ))}
        <button
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={disabled}
          onClick={() => onComplete(answers)}
          type="button"
        >
          {disabled ? "Guardando..." : "Confirmar compresion estructural"}
        </button>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-neutral-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}
