"use client";

import styles from "../styles/official-control-panel.module.css";
import type { WorkMapProgressView } from "@/services/eve/official-control-panel/official-control-panel-workmap-progress.types";

type WorkMapProgressPanelProps = {
  progress: WorkMapProgressView | null;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  onRetry: () => void;
  onViewActivities?: () => void;
};

export function WorkMapProgressPanel({
  progress,
  loading,
  refreshing,
  error,
  onRetry,
  onViewActivities,
}: WorkMapProgressPanelProps) {
  if (loading && !progress) {
    return (
      <section className={styles.workmapProgressPanel} aria-label="Avance WorkMap">
        <p className={styles.workspaceEmptyMessage} role="status">
          Cargando avance WorkMap...
        </p>
      </section>
    );
  }

  if (error && !progress) {
    return (
      <section className={styles.workmapProgressPanel} aria-label="Avance WorkMap">
        <div className={styles.manualWorkError} role="alert">
          <p className={styles.workspaceEmptyTitle}>WorkMap no disponible</p>
          <p className={styles.workspaceEmptyMessage}>
            No fue posible leer el avance persistido del caso.
          </p>
          <button
            type="button"
            className={styles.contextRetryButton}
            onClick={onRetry}
          >
            Refrescar
          </button>
        </div>
      </section>
    );
  }

  if (!progress) return null;

  return (
    <section
      className={styles.workmapProgressPanel}
      aria-labelledby="workmap-progress-heading"
      data-workmap-status={progress.workmap.status}
    >
      <div className={styles.workmapProgressHeader}>
        <div>
          <p className={styles.workmapProgressEyebrow}>WorkMap del caso</p>
          <h3
            className={styles.participantsPanelTitle}
            id="workmap-progress-heading"
          >
            {progress.participant?.label ??
              progress.user.label ??
              "Participante sin nombre"}
          </h3>
          <p className={styles.workspaceEmptyMessage}>
            Puesto declarado:{" "}
            {progress.participant?.declaredPosition ?? "Pendiente de registro"}
            {" | "}
            Perfil funcional:{" "}
            {progress.functionalProfile?.label ??
              "Pendiente de materializacion"}
          </p>
        </div>
        <div className={styles.workmapProgressActions}>
          <span className={styles.workmapStatusPill}>
            {progress.workmap.stateLabel}
          </span>
          <button
            type="button"
            className={styles.contextRetryButton}
            onClick={onRetry}
            disabled={refreshing}
          >
            {refreshing ? "Actualizando" : "Refrescar"}
          </button>
        </div>
      </div>

      <dl className={styles.workmapProgressGrid}>
        <div>
          <dt>Empresa</dt>
          <dd>{progress.company.label ?? "Empresa sin resolver"}</dd>
        </div>
        <div>
          <dt>Engagement</dt>
          <dd>{progress.engagement?.label ?? "Engagement sin resolver"}</dd>
        </div>
        <div>
          <dt>Caso</dt>
          <dd>{progress.diagnosticCase.label ?? progress.diagnosticCase.id}</dd>
        </div>
        <div>
          <dt>Estado del caso</dt>
          <dd>{progress.diagnosticCase.statusLabel ?? "Estado sin resolver"}</dd>
        </div>
        <div>
          <dt>Responsabilidades</dt>
          <dd>{formatNullableCount(progress.workmap.responsibilitiesCount)}</dd>
        </div>
        <div>
          <dt>Actividades capturadas</dt>
          <dd>{formatNullableCount(progress.workmap.activitiesCount)}</dd>
        </div>
        <div>
          <dt>Cobertura</dt>
          <dd>{progress.coverage.coverageLabel}</dd>
        </div>
        <div>
          <dt>Ultima pantalla</dt>
          <dd>
            {progress.lastScreen.screenKey ??
              "Instrumentacion de ultima pantalla ausente"}
          </dd>
        </div>
        <div>
          <dt>Ultima actualizacion</dt>
          <dd>{formatDate(progress.lastUpdatedAt)}</dd>
        </div>
        <div>
          <dt>Perfil trazado</dt>
          <dd>
            {progress.profileTrace?.profileStatus === "confirmed"
              ? "Confirmado desde WorkMap"
              : "Pendiente de confirmacion"}
          </dd>
        </div>
        <div>
          <dt>Seleccion primaria</dt>
          <dd>{progress.selection?.stageLabel ?? "No iniciada"}</dd>
        </div>
        <div>
          <dt>Sesion funcional</dt>
          <dd>
            {progress.functionalSession?.status === "active"
              ? "Iniciada"
              : "Aún no iniciada"}
          </dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>
            {progress.runtime?.status === "active"
              ? "Iniciado"
              : (progress.runtime?.reason ?? "Runtime aun no iniciado")}
          </dd>
        </div>
        <div>
          <dt>Proximo paso</dt>
          <dd>{progress.nextStep ?? "Sin siguiente transicion autorizada"}</dd>
        </div>
      </dl>

      {onViewActivities ? (
        <div className={styles.workmapProgressActions}>
          <button
            type="button"
            className={styles.contextRetryButton}
            onClick={onViewActivities}
          >
            Ver actividades de {progress.participant?.label ?? "la participante"}
          </button>
        </div>
      ) : null}

      <div className={styles.workmapProgressColumns}>
        <div>
          <p className={styles.workmapProgressSubhead}>Resumen</p>
          <p className={styles.workspaceEmptyMessage}>
            El texto completo de las actividades se muestra solo en el
            drilldown usuario, perfil y actividad.
          </p>
        </div>
        <div>
          <p className={styles.workmapProgressSubhead}>Brechas</p>
          {(progress.findings ?? []).length > 0 ? (
            <ul className={styles.workmapGapList}>
              {(progress.findings ?? []).map((item) => (
                <li key={item.findingId}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <small>
                    {item.severity} | {item.scope} | {item.source}
                  </small>
                  <small>{item.recommendedNextAction}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.workspaceEmptyMessage}>
              Sin brechas abiertas en esta proyeccion.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Sin actualizacion registrada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatNullableCount(value: number | null): string {
  return value == null ? "Pendiente" : String(value);
}
