"use client";

import type { ActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection.types";
import styles from "../styles/official-control-panel.module.css";
import type { ActivityCoverageAvailability } from "../presentation/activity-coverage-availability";
import { coverageMessageForAvailability } from "../presentation/activity-coverage-availability";
import type { WorkMapProgressView } from "@/services/eve/official-control-panel/official-control-panel-workmap-progress.types";

type ActivitySelectionCoveragePanelProps = {
  availability: ActivityCoverageAvailability;
  coverage: ActivitySelectionCoverageView | null;
  selectedActivityId: string | null;
  workMapProgress?: WorkMapProgressView | null;
  onSelectActivity: (activityId: string | null) => void;
};

const ABSENT_COUNT = "—";
const ABSENT_TEXT = "No disponible";

export function ActivitySelectionCoveragePanel({
  availability,
  coverage,
  selectedActivityId,
  workMapProgress = null,
  onSelectActivity,
}: ActivitySelectionCoveragePanelProps) {
  const hasWorkMapSelectionPending =
    Boolean(workMapProgress?.workmap.saved) && !coverage;
  const workMapSelectionNotEffective =
    Boolean(workMapProgress?.workmap.saved) &&
    workMapProgress?.selection?.stage !== "effective";
  const showFactual =
    availability === "available" ||
    availability === "partial" ||
    hasWorkMapSelectionPending ||
    workMapSelectionNotEffective;
  const message = workMapSelectionNotEffective
    ? "Elegibilidad y selección primaria pendientes."
    : coverageMessageForAvailability(availability, coverage);

  const modeLabel = showFactual
    ? (workMapSelectionNotEffective
        ? "Pendiente"
        : (coverage?.selectionModeLabel ?? "Pendiente"))
    : ABSENT_TEXT;
  const capturedLabel =
    workMapProgress?.workmap.activitiesCount != null
      ? String(workMapProgress.workmap.activitiesCount)
      : ABSENT_COUNT;
  const assignedLabel =
    workMapProgress?.profileTrace?.activitiesCount != null
      ? String(workMapProgress.profileTrace.activitiesCount)
      : capturedLabel;
  const eligibleLabel = showFactual
    ? (workMapSelectionNotEffective || coverage?.eligibleCount == null
        ? "Aún no calculada"
        : formatCount(coverage?.eligibleCount))
    : ABSENT_COUNT;
  const primaryLabel = showFactual
    ? (workMapSelectionNotEffective || coverage?.selectedCount == null
        ? "Aún no seleccionadas"
        : String(coverage.selectedCount))
    : ABSENT_COUNT;
  const nonPrimaryLabel = showFactual
    ? (workMapSelectionNotEffective || coverage?.nonPrimaryContextCount == null
        ? "Aún no clasificado"
        : formatCount(coverage?.nonPrimaryContextCount))
    : ABSENT_COUNT;
  const gapLabel = showFactual
    ? (workMapSelectionNotEffective
        ? "Elegibilidad pendiente"
        : (coverage?.workmapCoverageGapLabel ?? "Elegibilidad pendiente"))
    : ABSENT_TEXT;
  const promotionLabel = showFactual
    ? (workMapSelectionNotEffective
        ? "Bloqueada por elegibilidad pendiente"
        : (coverage?.promotionConditionLabel ??
          "Bloqueada por elegibilidad pendiente"))
    : ABSENT_TEXT;
  const policyLabel = showFactual
    ? (workMapSelectionNotEffective
        ? "Aún no aplicada"
        : (coverage?.policyVersion ?? "Aún no aplicada"))
    : ABSENT_TEXT;
  const nextProducerRequiredLabel =
    workMapProgress?.selection?.nextProducerRequired ?? null;

  return (
    <section
      className={styles.activitySelectionPanel}
      aria-labelledby="activity-coverage-heading"
      data-testid="activity-selection-coverage-panel"
      data-availability={availability}
    >
      <h4 className={styles.activitySelectionTitle} id="activity-coverage-heading">
        Cobertura de actividades
      </h4>

      {message ? (
        <p
          className={styles.workspaceEmptyMessage}
          role={availability === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      <dl className={styles.runtimeRunSummary}>
        <div>
          <dt>Modo de selección</dt>
          <dd>{modeLabel}</dd>
        </div>
        <div>
          <dt>Actividades capturadas</dt>
          <dd>{capturedLabel}</dd>
        </div>
        <div>
          <dt>Asignadas al perfil</dt>
          <dd>{assignedLabel}</dd>
        </div>
        <div>
          <dt>Elegibles</dt>
          <dd>{eligibleLabel}</dd>
        </div>
        <div>
          <dt>Actividades primarias</dt>
          <dd>{primaryLabel}</dd>
        </div>
        <div>
          <dt>Contexto no primario</dt>
          <dd>{nonPrimaryLabel}</dd>
        </div>
        <div>
          <dt>Brecha de cobertura</dt>
          <dd>{gapLabel}</dd>
        </div>
        <div>
          <dt>Condición de promoción</dt>
          <dd>{promotionLabel}</dd>
        </div>
        <div>
          <dt>Versión de política</dt>
          <dd>{policyLabel}</dd>
        </div>
        {nextProducerRequiredLabel ? (
          <div>
            <dt>Siguiente productor requerido</dt>
            <dd>{nextProducerRequiredLabel}</dd>
          </div>
        ) : null}
      </dl>

      {showFactual && coverage ? (
        <>
          {coverage.message && availability === "available" ? (
            <p className={styles.participantsPartialNote} role="status">
              {coverage.message}
            </p>
          ) : null}

          <CoverageGroup
            title="Actividades primarias"
            items={coverage.primaryActivities}
            selectedActivityId={selectedActivityId}
            onSelectActivity={onSelectActivity}
            emptyLabel="Sin actividades primarias registradas."
          />
          <CoverageGroup
            title="Contexto no primario"
            items={coverage.nonPrimaryActivities}
            selectedActivityId={selectedActivityId}
            onSelectActivity={null}
            emptyLabel="Sin contexto no primario registrado."
          />
          {coverage.pendingActivities.length > 0 ? (
            <CoverageGroup
              title="Pendientes de revisión"
              items={coverage.pendingActivities}
              selectedActivityId={selectedActivityId}
              onSelectActivity={null}
              emptyLabel=""
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return ABSENT_COUNT;
  return String(value);
}

function CoverageGroup(props: {
  title: string;
  items: ActivitySelectionCoverageView["primaryActivities"];
  selectedActivityId: string | null;
  onSelectActivity: ((activityId: string | null) => void) | null;
  emptyLabel: string;
}) {
  if (props.items.length === 0 && !props.emptyLabel) return null;
  return (
    <div className={styles.activitySelectionGroup}>
      <h5 className={styles.activitySelectionGroupTitle}>{props.title}</h5>
      {props.items.length === 0 ? (
        <p className={styles.workspaceEmptyMessage}>{props.emptyLabel}</p>
      ) : (
        <ul className={styles.activitySelectionList}>
          {props.items.map((item) => {
            const selected = props.selectedActivityId === item.activityId;
            const selectable = Boolean(props.onSelectActivity);
            return (
              <li key={item.activityId}>
                {selectable ? (
                  <button
                    type="button"
                    className={
                      selected
                        ? `${styles.activitySelectionItem} ${styles.activitySelectionItemSelected}`
                        : styles.activitySelectionItem
                    }
                    aria-pressed={selected}
                    onClick={() =>
                      props.onSelectActivity?.(
                        selected ? null : item.activityId,
                      )
                    }
                  >
                    <ItemBody item={item} />
                  </button>
                ) : (
                  <div className={styles.activitySelectionItemStatic}>
                    <ItemBody item={item} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ItemBody({
  item,
}: {
  item: ActivitySelectionCoverageView["primaryActivities"][number];
}) {
  return (
    <>
      <span className={styles.activitySelectionLabel}>{item.label}</span>
      <span className={styles.activitySelectionMeta}>
        {item.classification === "primary"
          ? "Primaria"
          : item.classification === "non-primary"
            ? "Contexto no primario"
            : item.classification === "pending"
              ? "Pendiente"
              : "No disponible"}
      </span>
      {item.selectedSlot != null ? (
        <span className={styles.activitySelectionMeta}>
          Posición de cobertura {item.selectedSlot}
        </span>
      ) : null}
      {item.selectionReasonLabel ? (
        <span className={styles.activitySelectionMeta}>
          Razón de selección: {item.selectionReasonLabel}
        </span>
      ) : null}
      {item.promotionConditionLabel ? (
        <span className={styles.activitySelectionMeta}>
          Condición de promoción: {item.promotionConditionLabel}
        </span>
      ) : null}
    </>
  );
}
