"use client";

import type { Activity } from "@/lib/types";

type Props = {
  activities: Activity[];
  onComplete: () => void;
};

export function CoordinationMapS2({ activities, onComplete }: Props) {
  const topActivities = [...activities]
    .sort((a, b) => b.interconnectionScore - a.interconnectionScore)
    .slice(0, 3);

  return (
    <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Capa 2.5 - Compresion
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Mapa de coordinacion S2
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          El sistema toma las tres actividades mas interconectadas y pregunta
          por el patron de coordinacion, sin pedirle al usuario mapear toda la
          operacion.
        </p>
      </div>
      <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          {topActivities.map((activity) => (
            <div
              className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
              key={activity.id}
            >
              <p className="text-sm font-medium text-neutral-950">
                {activity.title}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Interconexion {activity.interconnectionScore}/5
              </p>
            </div>
          ))}
        </div>
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-neutral-950">
            Cuando estas actividades se cruzan, que patron domina?
          </legend>
          <div className="mt-3 grid gap-2">
            {[
              "Se coordinan por reglas claras",
              "Se coordinan por personas clave",
              "Se coordinan apagando incendios",
            ].map((option) => (
              <label className="flex gap-3 text-sm text-neutral-700" key={option}>
                <input name="s2" type="radio" />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          className="mt-5 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          onClick={onComplete}
          type="button"
        >
          Continuar a modo patron
        </button>
      </div>
    </section>
  );
}
