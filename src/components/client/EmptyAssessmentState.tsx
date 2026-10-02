"use client";

import type { ReactNode } from "react";
import {
  DECISION_PROXIMITY_OPTIONS,
  isStartPositionContextComplete,
  PARTICIPATION_PLACE_OPTIONS,
  type StartPositionContext,
} from "@/domain/start-position-context";
import { ClientFlowHeader } from "./ClientFlowHeader";
import { ClientUserMenu } from "./ClientUserMenu";

type EmptyAssessmentStateProps = {
  creating: boolean;
  onStartCommercial: () => void;
  onSignOut?: () => void;
  startErrorMessage?: string | null;
  greetingName?: string;
  userEmail?: string | null;
  startPositionContext: StartPositionContext;
  onStartPositionContextChange: (context: StartPositionContext) => void;
  participantContext?: {
    userName: string;
    companyName: string;
    caseName: string;
    positionTitle: string;
  } | null;
};

function resolveGreeting(greetingName?: string): string {
  const trimmed = greetingName?.trim();
  if (!trimmed || trimmed.includes("@")) {
    return "Hola.";
  }
  return `Hola, ${trimmed}.`;
}

function resolveUserMenuLabel(
  greetingName?: string,
  userEmail?: string | null,
): string {
  const trimmed = greetingName?.trim();
  const safeUserName =
    trimmed && !trimmed.includes("@") ? trimmed : undefined;
  return safeUserName || userEmail?.trim() || "Usuario";
}

function RadioOption({
  checked,
  className = "",
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean;
  className?: string;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-1.5 rounded-md border px-2 py-1 transition",
        checked
          ? "border-2 border-[#3d3d47] bg-[rgba(61,61,71,0.03)]"
          : "border-[rgba(61,61,71,0.12)] bg-white hover:border-[rgba(61,61,71,0.22)]",
        className,
      ].join(" ")}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span
        aria-hidden="true"
        className={[
          "inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-[#3d3d47]" : "border-[rgba(61,61,71,0.24)]",
        ].join(" ")}
      >
        {checked ? (
          <span className="h-1.5 w-1.5 rounded-full bg-[#3d3d47]" />
        ) : null}
      </span>
      <span className="text-[10px] leading-snug text-[#272a32]">{label}</span>
    </label>
  );
}

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-[#6f7280]"
      fill="none"
      height="12"
      viewBox="0 0 24 24"
      width="12"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 11v5M12 8h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function WorksheetRow({
  sectionSubtitle,
  sectionTitle,
  children,
}: {
  sectionSubtitle: string;
  sectionTitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 border-t border-[rgba(61,61,71,0.1)] md:grid-cols-[minmax(180px,220px)_minmax(0,1fr)] md:items-start md:gap-x-5">
      <div className="min-w-0 border-b border-[rgba(61,61,71,0.1)] px-4 py-2 sm:px-5 md:border-b-0">
        <p className="text-[14px] font-semibold text-[#272a32]">{sectionTitle}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-[#6f7280]">
          {sectionSubtitle}
        </p>
      </div>
      <div className="min-w-0 px-4 py-2 sm:px-5">{children}</div>
    </div>
  );
}

export function EmptyAssessmentState({
  creating,
  onStartCommercial,
  onSignOut,
  startErrorMessage,
  greetingName,
  userEmail,
  startPositionContext,
  onStartPositionContextChange,
  participantContext,
}: EmptyAssessmentStateProps) {
  const canStart = isStartPositionContextComplete(startPositionContext);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="mx-auto flex w-full min-h-0 max-w-[1100px] flex-col">
        <ClientFlowHeader
          className="mb-[18px]"
          eyebrow={resolveGreeting(greetingName)}
          subtitle="Para crear tu mapa de trabajo, primero necesitamos entender desde qué lugar participas en tu empresa. Esto nos ayuda a interpretar mejor tu trabajo y tus decisiones."
          title="Comienza tu levantamiento"
          userMenu={
            onSignOut ? (
              <ClientUserMenu
                displayName={resolveUserMenuLabel(greetingName, userEmail)}
                onSignOut={onSignOut}
              />
            ) : undefined
          }
        />

        {participantContext ? (
          <section className="mb-3 rounded-lg border border-[rgba(61,61,71,0.12)] bg-white px-4 py-3 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f7280]">
              Contexto de levantamiento
            </p>
            <div className="mt-2 grid gap-2 text-[12px] text-[#272a32] sm:grid-cols-2">
              <div>
                <span className="block text-[10px] text-[#6f7280]">Usuario</span>
                <strong className="font-semibold">{participantContext.userName}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-[#6f7280]">Puesto</span>
                <strong className="font-semibold">{participantContext.positionTitle}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-[#6f7280]">Empresa</span>
                <strong className="font-semibold">{participantContext.companyName}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-[#6f7280]">Caso</span>
                <strong className="font-semibold">{participantContext.caseName}</strong>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-[rgba(61,61,71,0.12)] bg-white">
          <div className="border-b border-[rgba(61,61,71,0.1)] px-4 py-2.5 sm:px-5">
            <p className="text-[12px] leading-[1.5] text-[#6f7280]">
              Completa las 2 preguntas para continuar.
            </p>
          </div>

          <WorksheetRow
            sectionSubtitle="Desde dónde participas normalmente."
            sectionTitle="Lugar de participación"
          >
            <fieldset>
              <legend className="text-[14px] font-semibold text-[#272a32]">
                ¿Desde qué lugar participas normalmente en la empresa?
              </legend>
              <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {PARTICIPATION_PLACE_OPTIONS.map((option) => (
                  <RadioOption
                    checked={
                      startPositionContext.participationPlace === option.id
                    }
                    key={option.id}
                    label={option.label}
                    name="participationPlace"
                    onChange={() =>
                      onStartPositionContextChange({
                        ...startPositionContext,
                        participationPlace: option.id,
                        participationPlaceOther:
                          option.id === "other"
                            ? startPositionContext.participationPlaceOther
                            : "",
                      })
                    }
                    value={option.id}
                  />
                ))}
              </div>
              {startPositionContext.participationPlace === "other" ? (
                <label className="mt-2 block">
                  <span className="sr-only">
                    Especifica desde qué lugar participas
                  </span>
                  <input
                    className="w-full rounded-sm border border-[rgba(61,61,71,0.18)] bg-white px-2.5 py-1.5 text-[10px] text-[#272a32] outline-none transition placeholder:text-[#a8abb4] focus:border-[#3d3d47]"
                    onChange={(event) =>
                      onStartPositionContextChange({
                        ...startPositionContext,
                        participationPlaceOther: event.target.value,
                      })
                    }
                    placeholder="Especifica tu lugar de participación"
                    type="text"
                    value={startPositionContext.participationPlaceOther}
                  />
                </label>
              ) : null}
            </fieldset>
          </WorksheetRow>

          <WorksheetRow
            sectionSubtitle="Cómo participas en las decisiones."
            sectionTitle="Cercanía a decisiones"
          >
            <fieldset>
              <legend className="text-[14px] font-semibold text-[#272a32]">
                ¿Qué tan cerca estás de las decisiones?
              </legend>
              <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3">
                {DECISION_PROXIMITY_OPTIONS.map((option) => (
                  <RadioOption
                    checked={
                      startPositionContext.decisionProximity === option.id
                    }
                    key={option.id}
                    label={option.label}
                    name="decisionProximity"
                    onChange={() =>
                      onStartPositionContextChange({
                        ...startPositionContext,
                        decisionProximity: option.id,
                      })
                    }
                    value={option.id}
                  />
                ))}
              </div>
            </fieldset>
          </WorksheetRow>

          <footer className="shrink-0 border-t border-[rgba(61,61,71,0.1)]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-5">
              <p className="inline-flex min-h-7 max-w-[400px] min-w-0 flex-1 items-center gap-1.5 rounded-sm border border-[rgba(59,130,246,0.06)] bg-[rgba(59,130,246,0.04)] px-2.5 py-1 text-[10px] leading-snug text-[#6f7280]">
                <InfoIcon />
                <span>
                  Estas respuestas no te encasillan. Solo nos ayudan a entender tu
                  perspectiva.
                </span>
              </p>
              <button
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-sm border border-transparent bg-[#1f2430] px-3.5 text-[12px] font-medium text-[#f5f5f5] transition hover:bg-[#2f333a] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={creating || !canStart}
                onClick={onStartCommercial}
                type="button"
              >
                <span>
                  {creating ? "Preparando..." : "Empezar levantamiento"}
                </span>
                {!creating ? (
                  <span aria-hidden="true" className="text-[#f5f5f5]">
                    →
                  </span>
                ) : null}
              </button>
            </div>
          </footer>
        </section>

        {startErrorMessage ? (
          <p
            className="mt-1 whitespace-pre-line text-[12px] leading-snug text-[#b42318]"
            role="alert"
          >
            {startErrorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
