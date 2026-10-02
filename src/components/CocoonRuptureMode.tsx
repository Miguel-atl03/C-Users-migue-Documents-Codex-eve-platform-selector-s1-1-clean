"use client";

import type { Activity } from "@/lib/types";

type Props = {
  activities: Activity[];
  onComplete: () => void;
};

export function CocoonRuptureMode({ activities, onComplete }: Props) {
  const criticalActivities = activities
    .filter((activity) => activity.critical)
    .slice(0, 5);

  return (
    <section className="rounded-md border border-stone-300 bg-[#fbfaf5] p-6 shadow-sm">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-600">
          Capa 3B - Expansion
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Modo Ruptura
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          Solo las actividades criticas entran aqui. No hay defaults, no hay
          sugerencias y no existe No aplica; si el usuario evita responder,
          queda como evento algedonico leve.
        </p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {criticalActivities.map((activity) => (
          <article
            className="rounded-md border border-stone-200 bg-white p-5"
            key={activity.id}
          >
            <p className="text-sm font-semibold text-neutral-950">
              {activity.title}
            </p>
            <label className="mt-4 block text-sm font-medium text-neutral-700">
              Que se rompe estructuralmente cuando esta actividad falla?
              <textarea className="mt-2 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="mt-4 block text-sm font-medium text-neutral-700">
              Como actuas cuando no hay margen?
              <select className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
                <option>Responder explicitamente</option>
                <option>Prefiero no contestar</option>
              </select>
            </label>
          </article>
        ))}
      </div>
      <button
        className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
        onClick={onComplete}
        type="button"
      >
        Cerrar micro-sesion
      </button>
    </section>
  );
}
