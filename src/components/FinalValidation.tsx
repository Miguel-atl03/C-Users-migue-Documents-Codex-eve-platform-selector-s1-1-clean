"use client";

import type { Activity } from "@/lib/types";

type Props = {
  activities: Activity[];
  onComplete: () => void;
};

export function FinalValidation({ activities, onComplete }: Props) {
  return (
    <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Capa 5
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Validacion final
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
          El usuario conserva la ultima palabra. Aqui revisa el mapa final de
          actividades antes de cerrar la sesion.
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 p-3"
              key={activity.id}
            >
              <div>
                <p className="text-sm font-medium text-neutral-950">
                  {activity.title}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                  {activity.origin === "ia_inferida"
                    ? "Inferida por IA"
                    : "Redactada por usuario"}
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                Aceptada
              </span>
            </div>
          ))}
        </div>

        <button
          className="mt-5 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          onClick={onComplete}
          type="button"
        >
          Completar sesion
        </button>
      </div>
    </section>
  );
}

