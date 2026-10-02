"use client";

import { useState } from "react";

type Props = {
  onComplete: (activities: string[]) => void;
};

const examples = [
  "Coordinar entregas con proveedores clave",
  "Validar facturas antes del cierre mensual",
  "Resolver incidencias reportadas por clientes",
];

export function ActivityRedaction({ onComplete }: Props) {
  const [activities, setActivities] = useState(["", "", ""]);

  const updateActivity = (index: number, value: string) => {
    setActivities((current) =>
      current.map((activity, currentIndex) =>
        currentIndex === index ? value : activity,
      ),
    );
  };

  const addField = () => setActivities((current) => [...current, ""]);

  const submit = () => {
    const cleanActivities = activities
      .map((activity) => activity.trim())
      .filter(Boolean);

    if (cleanActivities.length > 0) {
      onComplete(cleanActivities);
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Capa 1
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Redaccion de actividades
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
          Escribe las actividades reales que forman parte de tu trabajo. La
          frase debe iniciar con un verbo y describir un objeto de negocio
          claro.
        </p>
        <div className="mt-8 border-l-2 border-emerald-500 pl-5">
          <p className="text-sm font-semibold text-neutral-900">
            Ejemplos utiles
          </p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            {examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <label className="block" key={index}>
              <span className="text-sm font-medium text-neutral-700">
                Actividad {index + 1}
              </span>
              <input
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={activity}
                onChange={(event) => updateActivity(index, event.target.value)}
                placeholder="Ej. Revisar solicitudes de clientes"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            onClick={addField}
            type="button"
          >
            Agregar actividad
          </button>
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            onClick={submit}
            type="button"
          >
            Guardar y continuar
          </button>
        </div>
      </div>
    </section>
  );
}

