"use client";

import { useState } from "react";

import styles from "../styles/official-control-panel.module.css";
import type { ParallelProductionLoadState } from "../hooks/use-case-parallel-production";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type {
  ParallelProductionFindingView,
  ParallelProductionLayerView,
  ParallelProductionPackageView,
} from "@/services/eve/official-control-panel/official-control-panel-parallel-production.types";
import {
  PP_INTRO_COPY,
  presentAcaStatus,
  presentEvalStatus,
  presentFindingStatus,
  presentFindingType,
  presentLayerDisplayStatus,
  presentPackageEventType,
  presentPackageStatus,
  presentReadinessStatus,
} from "../presentation/parallel-production-presentation";
import { PanelScreenStateChrome } from "./PanelScreenStateChrome";
import {
  applyParallelProductionAssessmentAction,
  attemptParallelProductionExport,
} from "../data/client-context-api";

type ParallelProductionPanelProps = {
  state: ParallelProductionLoadState;
  screenState: OfficialPanelScreenState;
  requestId?: string | null;
  caseId?: string | null;
  accessToken?: string | null;
  onRetry: () => void;
};

export function ParallelProductionPanel({
  state,
  screenState,
  requestId = null,
  caseId = null,
  accessToken = null,
  onRetry,
}: ParallelProductionPanelProps) {
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [checkingExport, setCheckingExport] = useState(false);
  const showContent =
    state.status === "ready" &&
    screenState !== "loading" &&
    screenState !== "fatal" &&
    screenState !== "forbidden" &&
    screenState !== "not_found";

  async function attemptExport(packageId: string) {
    if (!caseId || !accessToken || checkingExport) return;
    setCheckingExport(true);
    setExportResult(null);
    try {
      const result = await attemptParallelProductionExport({
        caseId,
        accessToken,
        packageId,
      });
      setExportResult(
        result.allowed
          ? "La exportación está habilitada."
          : "La exportación fue denegada por el estado factual del paquete.",
      );
    } catch {
      setExportResult("No fue posible comprobar la exportación.");
    } finally {
      setCheckingExport(false);
    }
  }

  return (
    <section
      className={styles.manualWorkPanel}
      data-testid="parallel-production-panel"
      data-screen-state={screenState}
      aria-labelledby="parallel-production-heading"
    >
      <h3 className={styles.manualWorkTitle} id="parallel-production-heading">
        Producción Paralela y QA
      </h3>
      <p className={styles.manualWorkIntro}>{PP_INTRO_COPY}</p>

      <PanelScreenStateChrome
        screenState={screenState}
        requestId={requestId}
        onRetry={onRetry}
        domainNotFoundMessage="Todavía no está disponible."
      />

      {showContent && state.data.dataStatus === "empty" ? (
        <p
          className={styles.manualWorkEmpty}
          role="status"
          data-testid="parallel-production-empty"
        >
          <strong>Aún no iniciada.</strong>{" "}
          {state.data.emptyMessage ??
            "No hay una ejecución de Producción Paralela registrada para este caso."}
        </p>
      ) : null}

      {showContent && state.data.package ? (
        <PackageBody
          pkg={state.data.package}
          onAttemptExport={attemptExport}
          checkingExport={checkingExport}
          exportResult={exportResult}
          exportActionAvailable={Boolean(caseId && accessToken)}
          caseId={caseId}
          accessToken={accessToken}
          onRefresh={onRetry}
        />
      ) : null}
    </section>
  );
}

function PackageBody({
  pkg,
  onAttemptExport,
  checkingExport,
  exportResult,
  exportActionAvailable,
  caseId,
  accessToken,
  onRefresh,
}: {
  pkg: ParallelProductionPackageView;
  onAttemptExport: (packageId: string) => Promise<void>;
  checkingExport: boolean;
  exportResult: string | null;
  exportActionAvailable: boolean;
  caseId: string | null;
  accessToken: string | null;
  onRefresh: () => void;
}) {
  const [assessmentBusy, setAssessmentBusy] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null);

  async function runAssessmentAction(
    assessmentAction:
      | "start_conformance"
      | "complete_conformance"
      | "start_consistency"
      | "complete_consistency",
  ) {
    if (!caseId || !accessToken || assessmentBusy) return;
    setAssessmentBusy(assessmentAction);
    setAssessmentResult(null);
    try {
      const result = await applyParallelProductionAssessmentAction({
        caseId,
        accessToken,
        packageId: pkg.id,
        assessmentAction,
        expectedPackageVersion: pkg.version,
        idempotencyKey: `pp-assessment-${assessmentAction}-${pkg.id}-${crypto.randomUUID()}`,
      });
      setAssessmentResult(
        result.allowed
          ? "Evaluación aplicada y leída desde el servidor."
          : "La evaluación no está habilitada todavía.",
      );
      onRefresh();
    } catch {
      setAssessmentResult("No fue posible aplicar la evaluación.");
    } finally {
      setAssessmentBusy(null);
    }
  }

  return (
    <article
      className={styles.manualProcessGroup}
      data-testid={`parallel-package-${pkg.id}`}
      data-package-status={pkg.packageStatus}
      data-aca-status={pkg.acaStatus ?? ""}
      data-export-eligibility={pkg.exportEligibility}
    >
      <header className={styles.manualProcessHeader}>
        <h4 className={styles.manualProcessCode}>P-SUP-06 · P-SUP-07/08 · P-SUP-09</h4>
        <p className={styles.manualProcessLabel}>
          Paquete {pkg.packageRef} · {presentPackageStatus(pkg.packageStatus)}
        </p>
        <p className={styles.manualWorkIntro}>
          Readiness: {presentReadinessStatus(pkg.readinessStatus)} · Evaluación
          compuesta: {presentAcaStatus(pkg.acaStatus)}
        </p>
      </header>

      <ul className={styles.manualWorkMeta} data-testid="parallel-production-layers">
        {pkg.layers.map((layer) => (
          <LayerRow key={layer.key} layer={layer} />
        ))}
      </ul>

      <section data-testid="parallel-production-qa" className={styles.manualWorkMeta}>
        <h5 className={styles.manualProcessCode}>QA</h5>
        <p>Conformidad: {presentEvalStatus(pkg.conformanceStatus)}</p>
        {pkg.assessmentBlockReason ? (
          <p role="status" data-testid="parallel-assessment-blocked">
            {pkg.assessmentBlockReason}
          </p>
        ) : null}
        {pkg.conformanceStatus !== "passed" &&
        pkg.consistencyCompositeStatus === "not_evaluated" ? (
          <p data-testid="parallel-consistency-pending-conformance">
            Consistencia pendiente de evaluación de conformidad.
          </p>
        ) : null}
        <p>
          Consistencia factual:{" "}
          {presentEvalStatus(pkg.consistencyFactualStatus)}
        </p>
        <p>
          Consistencia temporal:{" "}
          {presentEvalStatus(pkg.consistencyTemporalStatus)}
        </p>
        <p>
          Consistencia estructural:{" "}
          {presentEvalStatus(pkg.consistencyStructuralStatus)}
        </p>
        <p>
          Consistencia compuesta:{" "}
          {presentEvalStatus(pkg.consistencyCompositeStatus)}
        </p>
        {pkg.assessmentActions.startConformance ||
        pkg.assessmentActions.completeConformance ||
        pkg.assessmentActions.startConsistency ||
        pkg.assessmentActions.completeConsistency ? (
          <div
            className={styles.manualActionButtons}
            data-testid="parallel-assessment-actions"
          >
            {pkg.assessmentActions.startConformance ? (
              <button
                type="button"
                className={styles.contextRetryButton}
                data-testid="parallel-start-conformance"
                disabled={Boolean(assessmentBusy)}
                onClick={() => void runAssessmentAction("start_conformance")}
              >
                {assessmentBusy === "start_conformance"
                  ? "Iniciando..."
                  : "Iniciar evaluación de conformidad"}
              </button>
            ) : null}
            {pkg.assessmentActions.completeConformance ? (
              <button
                type="button"
                className={styles.contextRetryButton}
                data-testid="parallel-complete-conformance"
                disabled={Boolean(assessmentBusy)}
                onClick={() => void runAssessmentAction("complete_conformance")}
              >
                {assessmentBusy === "complete_conformance"
                  ? "Completando..."
                  : "Completar evaluación de conformidad"}
              </button>
            ) : null}
            {pkg.assessmentActions.startConsistency ? (
              <button
                type="button"
                className={styles.contextRetryButton}
                data-testid="parallel-start-consistency"
                disabled={Boolean(assessmentBusy)}
                onClick={() => void runAssessmentAction("start_consistency")}
              >
                {assessmentBusy === "start_consistency"
                  ? "Iniciando..."
                  : "Iniciar evaluación de consistencia"}
              </button>
            ) : null}
            {pkg.assessmentActions.completeConsistency ? (
              <button
                type="button"
                className={styles.contextRetryButton}
                data-testid="parallel-complete-consistency"
                disabled={Boolean(assessmentBusy)}
                onClick={() => void runAssessmentAction("complete_consistency")}
              >
                {assessmentBusy === "complete_consistency"
                  ? "Completando..."
                  : "Completar evaluación de consistencia"}
              </button>
            ) : null}
          </div>
        ) : null}
        {assessmentResult ? (
          <p role="status" data-testid="parallel-assessment-action-result">
            {assessmentResult}
          </p>
        ) : null}
        <p data-testid="parallel-b3-check">
          Ruta B3:{" "}
          {pkg.b3RouteException ? "Excepción abierta" : "Sin excepción"}
        </p>
        <p data-testid="parallel-b7-check">
          Frontera B7:{" "}
          {pkg.b7BoundaryViolation ? "Violación abierta" : "Sin violación"}
        </p>
        {pkg.reworkProcessCode ? (
          <p data-testid="parallel-rework-target">
            Rework autorizado: {pkg.reworkProcessCode}
          </p>
        ) : null}
      </section>

      <FindingsList
        title="Findings abiertos"
        testId="parallel-findings-open"
        findings={pkg.findingsOpen}
      />
      <FindingsList
        title="Findings resueltos"
        testId="parallel-findings-resolved"
        findings={pkg.findingsResolved}
      />

      <section
        data-testid="parallel-production-export"
        className={styles.manualWorkMeta}
      >
        <h5 className={styles.manualProcessCode}>Exportación</h5>
        <p data-testid="parallel-export-eligibility">
          Elegibilidad:{" "}
          {pkg.exportEligibility === "eligible"
            ? "Elegible"
            : pkg.exportEligibility === "blocked"
              ? "Bloqueada"
              : "No evaluada"}
        </p>
        {pkg.exportEligibility === "eligible" && !pkg.generatorAvailable ? (
          <p data-testid="parallel-export-generator-unavailable">
            Elegible para exportación. Generador no disponible.
          </p>
        ) : null}
        {pkg.exportEligibility === "blocked" ? (
          <>
            <p data-testid="parallel-export-blocked">
              Exportación bloqueada. El paquete todavía no cumple las condiciones.
            </p>
            <button
              type="button"
              className={styles.contextRetryButton}
              data-testid="parallel-attempt-export"
              disabled={!exportActionAvailable || checkingExport}
              onClick={() => void onAttemptExport(pkg.id)}
            >
              {checkingExport ? "Comprobando..." : "Comprobar exportación"}
            </button>
          </>
        ) : null}
        {exportResult ? (
          <p role="status" data-testid="parallel-export-attempt-result">
            {exportResult}
          </p>
        ) : null}
      </section>

      <ol
        className={styles.manualTimeline}
        data-testid={`parallel-timeline-${pkg.id}`}
      >
        {pkg.timeline.map((ev) => (
          <li key={ev.id}>
            {presentPackageEventType(ev.eventType)} · {ev.beforeStatus} →{" "}
            {ev.afterStatus}
            {ev.reason ? ` · ${ev.reason}` : ""}
          </li>
        ))}
      </ol>
    </article>
  );
}

function LayerRow({ layer }: { layer: ParallelProductionLayerView }) {
  return (
    <li data-testid={`parallel-layer-${layer.key}`} data-status={layer.displayStatus}>
      <strong>{layer.label}</strong>:{" "}
      {presentLayerDisplayStatus(layer.displayStatus)}
      {layer.message ? ` — ${layer.message}` : ""}
      {layer.ref && layer.displayStatus === "available"
        ? ` (${layer.ref})`
        : ""}
    </li>
  );
}

function FindingsList({
  title,
  testId,
  findings,
}: {
  title: string;
  testId: string;
  findings: ParallelProductionFindingView[];
}) {
  return (
    <section data-testid={testId} className={styles.manualWorkMeta}>
      <h5 className={styles.manualProcessCode}>{title}</h5>
      {findings.length === 0 ? (
        <p>Sin registros.</p>
      ) : (
        <ul>
          {findings.map((f) => (
            <li
              key={f.id}
              data-testid={`parallel-finding-${f.id}`}
              data-finding-type={f.findingType}
              data-finding-status={f.findingStatus}
            >
              {presentFindingType(f.findingType)} ·{" "}
              {presentFindingStatus(f.findingStatus)}
              {f.affectedModel ? ` · ${f.affectedModel}` : ""}
              {f.blocking ? " · bloqueante" : ""}
              {" · rework "}
              {f.reworkProcessCode}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

