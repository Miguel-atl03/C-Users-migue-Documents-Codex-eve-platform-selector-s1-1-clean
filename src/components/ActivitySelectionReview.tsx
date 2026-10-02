"use client";

import type { ActivityStructuralScore } from "@/domain/activity";

type Props = {
  primary: ActivityStructuralScore[];
  supportPool: ActivityStructuralScore[];
  onContinue: () => void;
};

const dimensionLabels: Record<string, string> = {
  object: "Objeto",
  dependency: "Dependencia",
  coordination: "Coordinacion",
  causality: "Causalidad",
  vsm_regulation: "Regulacion",
  ahe_tension: "Tension",
  recursion: "Recursion",
};

export function ActivitySelectionReview({
  primary,
  supportPool,
  onContinue,
}: Props) {
  return (
    <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Seleccion estructural
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Actividades con mayor capacidad de explicar tu trabajo
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          La plataforma no elige por importancia declarada. Primero busca las
          actividades que ayudan a entender objetos, dependencias, coordinacion,
          causabilidad, regulacion y tensiones del trabajo real.
        </p>
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-950">
            Actividades candidatas principales
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Estas pasan primero al cuestionario estructural.
          </p>
          <div className="mt-4 space-y-3">
            {primary.length ? (
              primary.map((score) => (
                <ScoreCard key={score.activityId} score={score} />
              ))
            ) : (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                Todavia no hay actividades con suficiente cobertura. La
                plataforma pedira actividades soporte mas especificas.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-950">
            Actividades soporte potenciales
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            No se descartan. Quedan disponibles si el motor detecta brechas de
            cobertura.
          </p>
          <div className="mt-4 space-y-3">
            {supportPool.length ? (
              supportPool.map((score) => (
                <ScoreCard key={score.activityId} score={score} compact />
              ))
            ) : (
              <p className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">
                No hay actividades en soporte por ahora.
              </p>
            )}
          </div>
        </div>

        <button
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          onClick={onContinue}
          type="button"
        >
          Continuar con actividades seleccionadas
        </button>
      </div>
    </section>
  );
}

function ScoreCard({
  score,
  compact = false,
}: {
  score: ActivityStructuralScore;
  compact?: boolean;
}) {
  const activeDimensions = Object.entries(score.dimensionScores).filter(
    ([, value]) => value > 0,
  );

  return (
    <article className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-medium leading-6 text-neutral-950">
          {score.rawText}
        </p>
        <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
          {Math.round(score.coverageRatio * 100)}%
        </span>
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeDimensions.map(([dimension]) => (
            <span
              className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
              key={dimension}
            >
              {dimensionLabels[dimension] ?? dimension}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
