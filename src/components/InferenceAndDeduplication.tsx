"use client";

import type { Activity } from "@/lib/types";

type Props = {
  activities: Activity[];
  onComplete: (inferredActivities: string[]) => void;
};

const demoInferences = [
  "Documentar causas recurrentes de incidencias",
  "Dar seguimiento a acuerdos posteriores a una escalacion",
];

export function InferenceAndDeduplication({ activities, onComplete }: Props) {
  const existingTitles = new Set(
    activities.map((activity) => activity.title.toLowerCase()),
  );
  const inferred = demoInferences.filter(
    (activity) => !existingTitles.has(activity.toLowerCase()),
  );

  return (
    <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Capa 4
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Inferencia y deduplicacion
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
          En esta version inicial dejamos preparada la experiencia. Despues
          conectaremos esta capa a una API de IA para inferir actividades desde
          los relatos.
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral-900">
          Actividades sugeridas
        </p>
        <div className="mt-4 space-y-3">
          {inferred.map((activity) => (
            <div
              className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800"
              key={activity}
            >
              {activity}
            </div>
          ))}
        </div>
        <button
          className="mt-5 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          onClick={() => onComplete(inferred)}
          type="button"
        >
          Agregar sugerencias
        </button>
      </div>
    </section>
  );
}

