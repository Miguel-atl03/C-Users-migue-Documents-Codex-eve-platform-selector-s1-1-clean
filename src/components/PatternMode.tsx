"use client";

import type { Activity, PatternAnswer } from "@/lib/types";

type Props = {
  activities: Activity[];
  onComplete: (answers: PatternAnswer[]) => void;
};

const patternQuestions = [
  {
    questionId: "4.7",
    label: "Que sacrificas bajo presion?",
    defaultAnswer: "tiempo_de_revision",
  },
  {
    questionId: "5.8",
    label: "Que principio dices que es innegociable?",
    defaultAnswer: "calidad",
  },
];

export function PatternMode({ activities, onComplete }: Props) {
  const answers = patternQuestions.map((question) => ({
    ...question,
    exceptions: {},
  }));

  return (
    <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Capa 3A - Compresion
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Modo Patron
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          Las preguntas conductuales estables se responden una vez. Las
          variables se barren por tema con respuesta masiva y excepciones.
        </p>
      </div>
      <div className="space-y-5">
        {patternQuestions.map((question) => (
          <div
            className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
            key={question.questionId}
          >
            <p className="text-sm font-semibold text-neutral-950">
              {question.label}
            </p>
            <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-950">
              Respuesta masiva sugerida: {question.defaultAnswer}
            </div>
            <div className="mt-4 space-y-2">
              {activities.map((activity) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm"
                  key={`${question.questionId}-${activity.id}`}
                >
                  <span>{activity.title}</span>
                  <select className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs">
                    <option>{question.defaultAnswer}</option>
                    <option>No aplica</option>
                    <option>Ajustar por excepcion</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          onClick={() => onComplete(answers)}
          type="button"
        >
          Registrar patron
        </button>
      </div>
    </section>
  );
}
