"use client";

import styles from "../styles/official-control-panel.module.css";
import type { RuntimeAvailability } from "../presentation/runtime-availability";
import {
  RUNTIME_STRUCTURAL_BLOCKS,
  runtimeMessageForAvailability,
} from "../presentation/runtime-availability";
import { RuntimeActivityMatrixPanel } from "./RuntimeActivityMatrixPanel";
import type {
  RuntimeBaseMatrixView,
  RuntimeCausalMatrixView,
} from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types";
import type { RuntimeControlStateView } from "@/services/eve/official-control-panel/official-control-panel-runtime-control.types";

type RuntimeMatrixScope = {
  accessToken: string;
  caseId: string;
  participantId: string;
  profileId: string;
  sessionId: string;
  activityId: string;
  runId: string;
};

type ActivityRuntimePanelProps = {
  availability: RuntimeAvailability;
  workMapPendingRuntime?: boolean;
  runtimePrepared?: {
    sessionCount: number;
    runCount: number;
    startedRunCount: number;
  } | null;
  matrixRuntimeSummary?: {
    runState: string | null;
    blockLabel: string | null;
    activityOrdinal: number | null;
    activityTotal: number | null;
    b0InteractionCount: number | null;
    b0ConfirmedInteractionCount: number | null;
    b0SubfieldCount: number | null;
    b0EvidenceCount: number | null;
    b0CanonicalVariableCount: number | null;
  } | null;
  /** Solo informativo: selección de bloque deshabilitada sin run autorizado. */
  interactiveBlocks?: boolean;
  /** Scope factual: solo cuando hay run validado. No condiciona la visibilidad de la matriz. */
  matrixScope?: RuntimeMatrixScope | null;
  fixtureBase?: RuntimeBaseMatrixView | null;
  fixtureCausal?: RuntimeCausalMatrixView | null;
  fixtureControl?: RuntimeControlStateView | null;
};

const ABSENT_COUNT = "—";
const ABSENT_TEXT = "No disponible";
const NOT_EVALUABLE_YET = "No evaluable todavía";

/**
 * §12 — Ejecución Runtime: resumen + bloques B0–B7 + Matrices Base 40 / Causal 20.
 * Bloques y matrices coexisten siempre. El run solo aporta overlay factual.
 * Sin KPI x/40 ni x/20.
 */
export function ActivityRuntimePanel({
  availability,
  workMapPendingRuntime = false,
  runtimePrepared = null,
  matrixRuntimeSummary = null,
  interactiveBlocks = false,
  matrixScope = null,
  fixtureBase = null,
  fixtureCausal = null,
  fixtureControl = null,
}: ActivityRuntimePanelProps) {
  const hasPreparedRuntime = Boolean(runtimePrepared);
  const hasMatrixRuntime = Boolean(matrixRuntimeSummary?.runState);
  const message = hasPreparedRuntime
    ? "Runtime preparado para este perfil. La ejecución todavía no inicia."
    : hasMatrixRuntime
    ? null
    : workMapPendingRuntime
    ? "Elegibilidad y selección efectiva pendientes."
    : runtimeMessageForAvailability(availability);
  const hasValidatedRun =
    Boolean(matrixScope?.runId) ||
    Boolean(fixtureBase) ||
    Boolean(fixtureCausal);
  const blocksInteractive = interactiveBlocks && hasValidatedRun;
  const runtimeStateLabel = hasPreparedRuntime
    ? "Preparado"
    : hasMatrixRuntime
    ? presentRuntimeRunState(matrixRuntimeSummary!.runState)
    : workMapPendingRuntime
    ? "Aún no iniciado"
    : ABSENT_TEXT;
  const runtimeReasonLabel = workMapPendingRuntime
    ? "Elegibilidad y selección efectiva pendientes"
    : ABSENT_TEXT;
  const currentBlockLabel = hasPreparedRuntime
    ? "Pendiente de iniciar"
    : hasMatrixRuntime
    ? matrixRuntimeSummary!.blockLabel ?? "B0 pendiente"
    : workMapPendingRuntime
    ? "No aplica todavía"
    : ABSENT_TEXT;
  const baseLabel = workMapPendingRuntime
    ? NOT_EVALUABLE_YET
    : hasMatrixRuntime
    ? "B0 confirmado"
    : ABSENT_COUNT;
  const causalLabel = workMapPendingRuntime
    ? NOT_EVALUABLE_YET
    : hasMatrixRuntime
    ? "Pendiente"
    : ABSENT_COUNT;
  const blockStateLabel = hasPreparedRuntime
    ? "Preparado"
    : hasMatrixRuntime
      ? "Pendiente"
    : workMapPendingRuntime
      ? "No iniciado"
      : ABSENT_TEXT;
  const b0BlockStateLabel =
    hasMatrixRuntime && (matrixRuntimeSummary!.b0ConfirmedInteractionCount ?? 0) >= 4
      ? "Confirmado"
      : blockStateLabel;

  return (
    <section
      className={styles.activityRuntimePanel}
      aria-labelledby="activity-runtime-heading"
      data-testid="activity-runtime-panel"
      data-availability={availability}
      data-has-run={hasValidatedRun ? "true" : "false"}
    >
      <h4 className={styles.activityRuntimeTitle} id="activity-runtime-heading">
        Ejecución Runtime
      </h4>

      {message ? (
        <p
          className={styles.workspaceEmptyMessage}
          role={availability === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      <dl
        className={styles.runtimeRunSummary}
        data-testid="runtime-run-summary"
      >
        <div>
          <dt>Estado de ejecución</dt>
          <dd>{runtimeStateLabel}</dd>
        </div>
        <div>
          <dt>Bloque actual</dt>
          <dd>{currentBlockLabel}</dd>
        </div>
        <div>
          <dt>Base</dt>
          <dd>{baseLabel}</dd>
        </div>
        <div>
          <dt>Causales</dt>
          <dd>{causalLabel}</dd>
        </div>
        {workMapPendingRuntime && !hasPreparedRuntime ? (
          <div>
            <dt>Causa</dt>
            <dd>{runtimeReasonLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Actividad actual</dt>
          <dd>
            {hasMatrixRuntime &&
            matrixRuntimeSummary!.activityOrdinal &&
            matrixRuntimeSummary!.activityTotal
              ? `${matrixRuntimeSummary!.activityOrdinal} de ${matrixRuntimeSummary!.activityTotal}`
              : ABSENT_TEXT}
          </dd>
        </div>
        <div>
          <dt>Preparación</dt>
          <dd>
            {hasPreparedRuntime
              ? `${runtimePrepared!.sessionCount} sesión preparada · ${runtimePrepared!.runCount} runs preparados · ${runtimePrepared!.startedRunCount} en ejecución`
              : hasMatrixRuntime
                ? `1 sesión activa · ${matrixRuntimeSummary!.activityTotal ?? 0} runs preparados · 1 en ejecución`
              : workMapPendingRuntime
                ? "Aún no iniciada"
                : ABSENT_TEXT}
          </dd>
        </div>
        <div>
          <dt>Brechas</dt>
          <dd>{ABSENT_COUNT}</dd>
        </div>
        <div>
          <dt>Tiempo de espera</dt>
          <dd>
            {hasPreparedRuntime || workMapPendingRuntime ? "No iniciado" : ABSENT_TEXT}
          </dd>
        </div>
      </dl>

      <h5
        className={styles.activityRuntimeBlocksHeading}
        id="runtime-blocks-heading"
      >
        Bloques individuales
      </h5>
      <ul
        className={styles.activityRuntimeBlocksGrid}
        aria-labelledby="runtime-blocks-heading"
        data-testid="runtime-structural-blocks"
      >
        {RUNTIME_STRUCTURAL_BLOCKS.map((block) => (
          <li key={block.code}>
            <div
              className={styles.activityRuntimeBlockCard}
              data-block-code={block.code}
              data-critical-route={block.criticalRoute ? "true" : "false"}
              {...(blocksInteractive
                ? {}
                : { "aria-disabled": true as const })}
            >
              <div className={styles.activityRuntimeBlockHeader}>
                <span className={styles.activityRuntimeBlockCode}>
                  {block.code}
                </span>
                {block.criticalRoute ? (
                  <span className={styles.activityRuntimeCriticalBadge}>
                    Ruta crítica
                  </span>
                ) : null}
              </div>
              <p className={styles.activityRuntimeBlockLabel}>{block.label}</p>
              <dl className={styles.activityRuntimeBlockMeta}>
                <div>
                  <dt>Estado</dt>
                  <dd>{block.code === "B0" ? b0BlockStateLabel : blockStateLabel}</dd>
                </div>
                <div>
                  <dt>Base</dt>
                  <dd>
                    {block.code === "B0" && hasMatrixRuntime
                      ? `${matrixRuntimeSummary!.b0ConfirmedInteractionCount ?? 0}/${matrixRuntimeSummary!.b0InteractionCount ?? 0} interacciones · ${matrixRuntimeSummary!.b0SubfieldCount ?? 0} subcampos`
                      : hasPreparedRuntime
                      ? "Preparada"
                      : workMapPendingRuntime
                        ? NOT_EVALUABLE_YET
                        : ABSENT_COUNT}
                  </dd>
                </div>
                <div>
                  <dt>Causales</dt>
                  <dd>
                    {block.code === "B0" && hasMatrixRuntime
                      ? `${matrixRuntimeSummary!.b0EvidenceCount ?? 0} evidencias · ${matrixRuntimeSummary!.b0CanonicalVariableCount ?? 0} variables`
                      : hasPreparedRuntime
                      ? "Preparada"
                      : workMapPendingRuntime
                        ? NOT_EVALUABLE_YET
                        : ABSENT_COUNT}
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>

      <RuntimeActivityMatrixPanel
        scope={matrixScope}
        runtimeContextAvailable={hasMatrixRuntime}
        fixtureBase={fixtureBase}
        fixtureCausal={fixtureCausal}
        fixtureControl={fixtureControl}
        availability={availability}
      />
    </section>
  );
}

function presentRuntimeRunState(state: string | null) {
  if (state === "active_base_capture") return "Runtime en ejecución";
  if (state === "initialized") return "Runtime preparado";
  if (state === "blocked") return "Runtime bloqueado";
  if (state === "completed" || state === "archived") return "Runtime completado";
  return state ?? ABSENT_TEXT;
}
