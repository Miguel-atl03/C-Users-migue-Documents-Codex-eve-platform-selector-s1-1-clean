"use client";

import { useMemo, useState } from "react";
import type { Activity, RelatoAnswer, RelatoType } from "@/lib/types";

type Props = {
  activities: Activity[];
  tipoRelato: RelatoType;
  onComplete: (answers: RelatoAnswer[]) => void;
};

const questionLabels = [
  "Que actividad estabas realizando?",
  "Que fue lo que salio mal?",
  "Que fue lo primero que hiciste?",
  "En que momento tuviste que escalar o pedir ayuda?",
  "Quien termino resolviendo el problema?",
  "Que paso despues?",
  "Esto cambio algo en como trabajan hoy?",
];

export function GuidedRelato({ activities, tipoRelato, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(Array(7).fill(""));

  const title = useMemo(() => {
    return tipoRelato === "ultimo_incendio"
      ? "Ultimo Incendio"
      : "Lo que no deberia pasar";
  }, [tipoRelato]);

  const updateAnswer = (index: number, value: string) => {
    setAnswers((current) =>
      current.map((answer, currentIndex) =>
        currentIndex === index ? value : answer,
      ),
    );
  };

  const submit = () => {
    const relatoAnswers = questionLabels.map((question, index) => ({
      question,
      answer: answers[index],
    }));

    onComplete(relatoAnswers);
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          {tipoRelato === "ultimo_incendio" ? "Capa 2" : "Capa 3"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Relato guiado: {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
          Responde en lenguaje natural. Esta capa busca capturar tension real,
          no respuestas perfectas.
        </p>
        <div className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Tiempo objetivo: 5 minutos.
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">
              {questionLabels[0]}
            </span>
            <select
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              value={answers[0]}
              onChange={(event) => updateAnswer(0, event.target.value)}
            >
              <option value="">Selecciona una actividad</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.title}>
                  {activity.title}
                </option>
              ))}
            </select>
          </label>

          {questionLabels.slice(1).map((question, offset) => {
            const index = offset + 1;
            return (
              <label className="block" key={question}>
                <span className="text-sm font-medium text-neutral-700">
                  {question}
                </span>
                <textarea
                  className="mt-2 min-h-20 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={answers[index]}
                  onChange={(event) => updateAnswer(index, event.target.value)}
                  placeholder="Escribe una respuesta breve"
                />
              </label>
            );
          })}
        </div>

        <button
          className="mt-5 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          onClick={submit}
          type="button"
        >
          Guardar relato
        </button>
      </div>
    </section>
  );
}

