"use client";

type ActiveAssessmentStateProps = {
  userName: string;
  progressPercent: number;
  lastStepLabel: string;
  activityCountLabel: string;
  lastUpdatedLabel: string;
  restoring: boolean;
  onContinue: () => void;
  onSignOut: () => void;
  variant?: "fallback" | "transient-loading";
};

export function ActiveAssessmentState({
  userName,
  progressPercent,
  lastStepLabel,
  lastUpdatedLabel,
  restoring,
  onContinue,
  variant = "fallback",
}: ActiveAssessmentStateProps) {
  if (variant === "transient-loading") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
        <p className="text-[19px] leading-normal text-[#6f7280]">
          Hola, {userName}.
        </p>
        <h1 className="mt-3 text-center text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-[#272a32] sm:text-[2.5rem]">
          Recuperando tu levantamiento…
        </h1>
        <p className="mt-4 max-w-md text-center text-[17px] leading-[1.55] text-[#6f7280]">
          Estamos retomando tu último punto de trabajo guardado.
        </p>
      </div>
    );
  }

  const progressValue = Math.min(100, Math.max(0, progressPercent));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col items-stretch justify-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="relative z-10 min-w-0 max-w-[580px] shrink-0">
          <p className="text-[19px] leading-normal text-[#6f7280]">
            Hola, {userName}.
          </p>
          <h1 className="mt-3 text-[3.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-[#272a32]">
            Continúa tu levantamiento
          </h1>
          <div className="mt-5 space-y-1 text-[19px] leading-[1.55] text-[#6f7280]">
            <p>Tu avance está guardado.</p>
            <p>Puedes continuar desde el último punto registrado.</p>
          </div>
        </div>

        <div className="relative z-0 flex w-full min-w-0 shrink-0 flex-col lg:max-w-[440px] lg:flex-1 lg:items-end">
          <section className="pointer-events-none w-full max-h-[210px] overflow-hidden rounded-md border border-[rgba(61,61,71,0.14)] bg-white/80 px-5 py-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[#272a32]">
                  Progreso general
                </p>
                <p className="mt-2 text-[2rem] font-semibold leading-none tabular-nums text-[#272a32]">
                  {progressValue}%
                </p>
                <div
                  aria-hidden="true"
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(61,61,71,0.12)]"
                >
                  <div
                    className="h-full rounded-full bg-[#3d3d47] transition-[width]"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>

              <dl className="min-w-0 space-y-3 text-[14px]">
                <div>
                  <dt className="text-[#6f7280]">Último paso completado</dt>
                  <dd className="mt-0.5 font-medium text-[#272a32]">
                    {lastStepLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6f7280]">Última actualización</dt>
                  <dd className="mt-0.5 font-medium text-[#272a32]">
                    {lastUpdatedLabel}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <button
            className="relative z-10 mt-4 inline-flex h-[54px] w-full shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent bg-[#1f2430] px-6 text-[15px] font-medium text-[#f5f5f5] transition hover:bg-[#2f333a] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={restoring}
            onClick={() => onContinue()}
            type="button"
          >
            <span>
              {restoring ? "Recuperando tu levantamiento…" : "Continuar levantamiento"}
            </span>
            {!restoring ? (
              <span aria-hidden="true" className="text-[#f5f5f5]">
                →
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}
