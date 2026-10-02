"use client";

import { EveLogo } from "@/components/EveLogo";
import { SheetMotion } from "@/components/eve-worksheet/SheetMotion";
import {
  DECISION_PROXIMITY_OPTIONS,
  isStartPositionContextComplete,
  PARTICIPATION_PLACE_OPTIONS,
  type StartPositionContext,
} from "@/domain/start-position-context";
import styles from "./local-canvas.module.css";

type ParticipantContextView = {
  userName: string;
  companyName: string;
  caseName: string;
  positionTitle: string;
};

type Props = {
  creating: boolean;
  onStartCommercial: () => void;
  onSignOut?: () => void;
  startErrorMessage?: string | null;
  greetingName?: string;
  userEmail?: string | null;
  startPositionContext: StartPositionContext;
  onStartPositionContextChange: (context: StartPositionContext) => void;
  participantContext?: ParticipantContextView | null;
};

function resolveGreeting(greetingName?: string): string {
  const trimmed = greetingName?.trim();
  if (!trimmed || trimmed.includes("@")) return "Hola.";
  return `Hola, ${trimmed}.`;
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Official ESTADO_A — monumental vestibule.
 * Atmosphere first; questions as inscriptions. No methodology teaching.
 * Completeness = isStartPositionContextComplete only.
 */
export function LocalEstadoASection({
  creating,
  onStartCommercial,
  onSignOut,
  startErrorMessage,
  greetingName,
  startPositionContext,
  onStartPositionContextChange,
}: Props) {
  const canStart = isStartPositionContextComplete(startPositionContext);

  return (
    <section className={styles.estadoAScreen} aria-labelledby="estado-a-title" id="estado-a">
      <header className={styles.estadoATopbar}>
        <EveLogo className={styles.estadoALogo} size="sm" />
        <div className={styles.estadoASlogan}>
          Strategic & Operational Architecture{"\u00a0"}/ Enterprise Viability Engine
        </div>
      </header>

      <div className={styles.estadoAVestibule} aria-hidden="false">
        <div className={styles.estadoAChamber}>
          <img
            alt=""
            className={styles.estadoAChamberImage}
            src="/eve-hero-architecture-color.jpg"
          />
        </div>
        <div className={styles.estadoAThresholdCopy}>
          <h1 className={styles.estadoAMonumentLine} id="estado-a-title">
            <span className={styles.estadoAMonumentLead}>Lo que sostiene</span>
            <span className={styles.estadoAMonumentEmphasis}>no siempre se ve.</span>
          </h1>
          <p className={styles.estadoAMonumentSub}>Una forma distinta de mirar.</p>
        </div>
      </div>

      <SheetMotion stagger>
        <div className={styles.estadoAWorkspace}>
          <div className={styles.estadoAGreetingRow}>
            <p className={styles.estadoAGreeting}>{resolveGreeting(greetingName)}</p>
            {onSignOut ? (
              <button className={styles.linkButton} onClick={onSignOut} type="button">
                Cerrar sesión
              </button>
            ) : null}
          </div>

          <p className={styles.estadoARoomMark}>[ Comienza tu levantamiento ]</p>

          <div className={styles.estadoAInscriptions}>
            <section className={styles.estadoAInscription}>
              <h2 className={styles.estadoAInscriptionQuestion}>
                ¿Desde qué lugar participas normalmente en la empresa?
              </h2>
              <div
                aria-label="Lugar de participación"
                className={styles.estadoAInscriptionOptions}
                role="radiogroup"
              >
                {PARTICIPATION_PLACE_OPTIONS.map((option) => {
                  const selected = startPositionContext.participationPlace === option.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={cx(
                        styles.estadoAInscriptionOption,
                        selected && styles.estadoAInscriptionOptionSelected,
                      )}
                      key={option.id}
                      onClick={() =>
                        onStartPositionContextChange({
                          ...startPositionContext,
                          participationPlace: option.id,
                          participationPlaceOther:
                            option.id === "other"
                              ? startPositionContext.participationPlaceOther
                              : "",
                        })
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {startPositionContext.participationPlace === "other" ? (
                <label className={styles.estadoAOtherLabel}>
                  <span className="sr-only">Especifica desde qué lugar participas</span>
                  <input
                    className={styles.otherInput}
                    onChange={(event) =>
                      onStartPositionContextChange({
                        ...startPositionContext,
                        participationPlaceOther: event.target.value,
                      })
                    }
                    placeholder="Especifica"
                    type="text"
                    value={startPositionContext.participationPlaceOther}
                  />
                </label>
              ) : null}
            </section>

            <section className={styles.estadoAInscription}>
              <h2 className={styles.estadoAInscriptionQuestion}>
                ¿Qué tan cerca estás de las decisiones?
              </h2>
              <div
                aria-label="Cercanía a decisiones"
                className={styles.estadoAInscriptionOptions}
                role="radiogroup"
              >
                {DECISION_PROXIMITY_OPTIONS.map((option) => {
                  const selected = startPositionContext.decisionProximity === option.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={cx(
                        styles.estadoAInscriptionOption,
                        selected && styles.estadoAInscriptionOptionSelected,
                      )}
                      key={option.id}
                      onClick={() =>
                        onStartPositionContextChange({
                          ...startPositionContext,
                          decisionProximity: option.id,
                        })
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <footer className={styles.estadoAMonumentFooter}>
            <button
              className={styles.estadoATrace}
              disabled={creating || !canStart}
              onClick={onStartCommercial}
              type="button"
            >
              {creating ? "Preparando…" : "Guardar"}
            </button>
          </footer>
        </div>
      </SheetMotion>

      {startErrorMessage ? (
        <p className={styles.errorText} role="alert">
          {startErrorMessage}
        </p>
      ) : null}
    </section>
  );
}
