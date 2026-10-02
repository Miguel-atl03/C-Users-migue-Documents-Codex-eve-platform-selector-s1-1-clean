"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "../styles/official-control-panel.module.css";
import type { RuntimeAvailability } from "../presentation/runtime-availability";
import type {
  BaseMatrixRowVM,
  CausalMatrixRowVM,
  RuntimeBaseMatrixView,
  RuntimeCausalMatrixView,
} from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types";
import {
  RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_TITLE,
  RUNTIME_MATRIX_NO_RUN_BANNER_TITLE,
} from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix.types";
import type { RuntimeControlStateView } from "@/services/eve/official-control-panel/official-control-panel-runtime-control.types";
import {
  presentRuntimeAdvanceLabel,
  RUNTIME_CONTROL_NO_RUN_MESSAGE,
} from "@/services/eve/official-control-panel/official-control-panel-runtime-control.types";
import { buildUnavailableRuntimeControlState } from "@/services/eve/official-control-panel/official-control-panel-runtime-control-service";
import {
  buildCatalogOnlyUnavailableBaseMatrixView,
  buildCatalogOnlyUnavailableCausalMatrixView,
  presentCausalClosureLabel,
  presentFactualActivationLabel,
  presentFactualBlockingLabel,
  presentFactualResolutionLabel,
  presentReadinessImpactLabel,
} from "@/services/eve/official-control-panel/official-control-panel-runtime-matrix-service";
import {
  getRuntimeBaseMatrix,
  getRuntimeCausalMatrix,
  getRuntimeControlState,
} from "../data/client-context-api";
import { useRuntimeControlState } from "../state/runtime-control-state-context";

type RuntimeMatrixScope = {
  accessToken: string;
  caseId: string;
  participantId: string;
  profileId: string;
  sessionId: string;
  activityId: string;
  runId: string;
};

type MatrixTab = "base" | "causal";

type RuntimeActivityMatrixPanelProps = {
  scope: RuntimeMatrixScope | null;
  runtimeContextAvailable?: boolean;
  /** Fixtures locales (no cuentan como evidencia del panel oficial). */
  fixtureBase?: RuntimeBaseMatrixView | null;
  fixtureCausal?: RuntimeCausalMatrixView | null;
  fixtureControl?: RuntimeControlStateView | null;
  availability?: RuntimeAvailability | null;
};

const ABSENT = "No disponible";
const UNEVALUATED = "No evaluada";
const RUNTIME_CONTEXT_PENDING_MESSAGE =
  "Runtime B0 localizado. La evaluación Base/Causal posterior permanece pendiente.";

const BASE_COLUMNS = [
  "ID",
  "Nodo fuente",
  "Pregunta base seleccionada",
  "Razón de selección",
  "Cierre satisfactorio",
  "Bloqueo",
  "Revisión",
  "Función",
] as const;

const CAUSAL_COLUMNS = [
  "ID",
  "Prioridad/clase",
  "Activación documental",
  "Razón de selección",
  "Cierre satisfactorio",
  "Bloqueo si falla",
  "Bloquea ready pleno",
] as const;

const PRE_RUN: ReadonlySet<RuntimeAvailability> = new Set([
  "no-participant",
  "no-profile",
  "no-session",
  "no-effective-selection",
  "no-primary-activity",
  "no-run",
]);

function readMatrixTabFromUrl(): MatrixTab {
  if (typeof window === "undefined") return "base";
  const param = new URLSearchParams(window.location.search).get(
    "runtime_matrix",
  );
  return param === "causal" ? "causal" : "base";
}

function writeMatrixTabToUrl(tab: MatrixTab): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("runtime_matrix", tab);
  window.history.replaceState(null, "", url.toString());
}

function blockKeyFromId(id: string): string {
  if (id.startsWith("B05-") || id.startsWith("B0.5-")) return "B0.5";
  const m = /^(B\d+)/i.exec(id);
  return m?.[1]?.toUpperCase() ?? "other";
}

/**
 * Entrega B — Matrices Base 40 y Causal 20 en Ejecución Runtime.
 * Sin run: catálogo canónico + factuales No disponible.
 * Con run: GET base-matrix / causal-matrix + overlay factual.
 */
export function RuntimeActivityMatrixPanel({
  scope,
  runtimeContextAvailable = false,
  fixtureBase = null,
  fixtureCausal = null,
  fixtureControl = null,
  availability = null,
}: RuntimeActivityMatrixPanelProps) {
  const preRunChain = availability ? PRE_RUN.has(availability) : true;
  const { setControlState, resetControlState } = useRuntimeControlState();

  const catalogBaseFallback = useMemo(
    () =>
      buildCatalogOnlyUnavailableBaseMatrixView({
        caseId: scope?.caseId ?? null,
        activityId: scope?.activityId ?? null,
        preRunChain,
      }),
    [scope?.caseId, scope?.activityId, preRunChain],
  );

  const catalogCausalFallback = useMemo(
    () =>
      buildCatalogOnlyUnavailableCausalMatrixView({
        caseId: scope?.caseId ?? null,
        activityId: scope?.activityId ?? null,
        preRunChain,
      }),
    [scope?.caseId, scope?.activityId, preRunChain],
  );

  const [activeTab, setActiveTab] = useState<MatrixTab>(() =>
    readMatrixTabFromUrl(),
  );
  const [baseView, setBaseView] = useState<RuntimeBaseMatrixView | null>(
    fixtureBase ?? catalogBaseFallback,
  );
  const [causalView, setCausalView] = useState<RuntimeCausalMatrixView | null>(
    fixtureCausal ?? catalogCausalFallback,
  );
  const [controlView, setControlView] = useState<RuntimeControlStateView>(
    () =>
      fixtureControl ??
      buildUnavailableRuntimeControlState(
        runtimeContextAvailable
          ? RUNTIME_CONTEXT_PENDING_MESSAGE
          : RUNTIME_CONTROL_NO_RUN_MESSAGE,
      ),
  );
  const [baseLoading, setBaseLoading] = useState(false);
  const [causalLoading, setCausalLoading] = useState(false);
  const [baseError, setBaseError] = useState(false);
  const [causalError, setCausalError] = useState(false);
  const [baseFilter, setBaseFilter] = useState("all");
  const [causalFilter, setCausalFilter] = useState("all");
  const [baseQuery, setBaseQuery] = useState("");
  const [causalQuery, setCausalQuery] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [selectedCausalId, setSelectedCausalId] = useState<string | null>(
    null,
  );

  const hasBaseRun = Boolean(scope?.runId) || Boolean(fixtureBase);
  const hasCausalRun = Boolean(scope?.runId) || Boolean(fixtureCausal);
  const baseViewResolved = fixtureBase ?? baseView;
  const causalViewResolved = fixtureCausal ?? causalView;
  const controlViewResolved = fixtureControl ?? controlView;

  useEffect(() => {
    if (!fixtureControl) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setControlState(fixtureControl);
    });
    return () => {
      cancelled = true;
    };
  }, [fixtureControl, setControlState]);

  const handleTabChange = (tab: MatrixTab) => {
    setActiveTab(tab);
    writeMatrixTabToUrl(tab);
    setSelectedBaseId(null);
    setSelectedCausalId(null);
  };

  useEffect(() => {
    if (fixtureBase) {
      return;
    }
    if (!scope?.runId) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setBaseView(catalogBaseFallback);
        setBaseError(false);
        setBaseLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const controller = new AbortController();
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled || controller.signal.aborted) return;
      setBaseLoading(true);
      setBaseError(false);
      getRuntimeBaseMatrix(
        scope.accessToken,
        scope.caseId,
        scope.participantId,
        scope.profileId,
        scope.sessionId,
        scope.activityId,
        scope.runId,
        controller.signal,
      )
        .then((base) => {
          if (controller.signal.aborted) return;
          setBaseView(base);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setBaseError(true);
          setBaseView({
            ...catalogBaseFallback,
            dataStatus: "error",
            message: "No fue posible cargar la matriz Runtime.",
          });
        })
        .finally(() => {
          if (!controller.signal.aborted) setBaseLoading(false);
        });
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [scope, fixtureBase, catalogBaseFallback]);

  useEffect(() => {
    if (fixtureCausal) {
      return;
    }
    if (!scope?.runId) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setCausalView(catalogCausalFallback);
        setCausalError(false);
        setCausalLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const controller = new AbortController();
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled || controller.signal.aborted) return;
      setCausalLoading(true);
      setCausalError(false);
      getRuntimeCausalMatrix(
        scope.accessToken,
        scope.caseId,
        scope.participantId,
        scope.profileId,
        scope.sessionId,
        scope.activityId,
        scope.runId,
        controller.signal,
      )
        .then((causal) => {
          if (controller.signal.aborted) return;
          setCausalView(causal);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setCausalError(true);
          setCausalView({
            ...catalogCausalFallback,
            dataStatus: "error",
            message: "No fue posible cargar la matriz Runtime.",
          });
        })
        .finally(() => {
          if (!controller.signal.aborted) setCausalLoading(false);
        });
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [scope, fixtureCausal, catalogCausalFallback]);

  useEffect(() => {
    if (fixtureControl) {
      return;
    }
    if (!scope?.runId) {
      const unavailable = buildUnavailableRuntimeControlState(
        runtimeContextAvailable
          ? RUNTIME_CONTEXT_PENDING_MESSAGE
          : RUNTIME_CONTROL_NO_RUN_MESSAGE,
      );
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setControlView(unavailable);
        setControlState(unavailable);
      });
      return () => {
        cancelled = true;
      };
    }

    const controller = new AbortController();
    getRuntimeControlState(
      scope.accessToken,
      scope.caseId,
      scope.participantId,
      scope.profileId,
      scope.sessionId,
      scope.activityId,
      scope.runId,
      controller.signal,
    )
      .then((control) => {
        if (controller.signal.aborted) return;
        setControlView(control);
        setControlState(control);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        const errored = {
          ...buildUnavailableRuntimeControlState(
            "No fue posible cargar el estado de control Runtime.",
          ),
          dataStatus: "error" as const,
        };
        setControlView(errored);
        setControlState(errored);
      });

    return () => {
      controller.abort();
      resetControlState();
    };
  }, [
    scope,
    fixtureControl,
    runtimeContextAvailable,
    setControlState,
    resetControlState,
  ]);

  const selectedBase = useMemo(
    () => baseViewResolved?.rows.find((row) => row.id === selectedBaseId) ?? null,
    [baseViewResolved, selectedBaseId],
  );

  const selectedCausal = useMemo(
    () =>
      causalViewResolved?.rows.find((row) => row.id === selectedCausalId) ?? null,
    [causalViewResolved, selectedCausalId],
  );

  const filteredBase = useMemo(
    () => filterBaseRows(baseViewResolved?.rows ?? [], baseFilter, baseQuery),
    [baseViewResolved, baseFilter, baseQuery],
  );

  const filteredCausal = useMemo(
    () =>
      filterCausalRows(
        causalViewResolved?.rows ?? [],
        causalFilter,
        causalQuery,
      ),
    [causalViewResolved, causalFilter, causalQuery],
  );

  const activeView = activeTab === "base" ? baseViewResolved : causalViewResolved;
  const activeHasRun = activeTab === "base" ? hasBaseRun : hasCausalRun;

  return (
    <section
      className={styles.runtimeMatrixPanel}
      data-testid="runtime-activity-matrix-panel"
      data-entrega="B+C"
      data-active-tab={activeTab}
      data-has-run={activeHasRun ? "true" : "false"}
      data-status={activeView?.dataStatus ?? "unavailable"}
      data-advance={controlViewResolved.readiness.state}
      aria-label="Matrices Runtime Base 40 y Causal 20"
    >
      <div
        className={styles.runtimeMatrixTabs}
        role="tablist"
        aria-label="Seleccionar matriz Runtime"
      >
        <button
          type="button"
          role="tab"
          className={
            activeTab === "base"
              ? styles.runtimeMatrixTabSelected
              : styles.runtimeMatrixTab
          }
          aria-selected={activeTab === "base"}
          data-testid="runtime-matrix-tab-base"
          onClick={() => handleTabChange("base")}
        >
          Matriz Base 40
        </button>
        <button
          type="button"
          role="tab"
          className={
            activeTab === "causal"
              ? styles.runtimeMatrixTabSelected
              : styles.runtimeMatrixTab
          }
          aria-selected={activeTab === "causal"}
          data-testid="runtime-matrix-tab-causal"
          onClick={() => handleTabChange("causal")}
        >
          Matriz Causal 20
        </button>
      </div>

      {activeTab === "base" ? (
        <>
          {!hasBaseRun ? (
            <MatrixNoRunBanner
              testId="base-matrix-no-run-banner"
              title={RUNTIME_MATRIX_NO_RUN_BANNER_TITLE}
              body={
                runtimeContextAvailable
                  ? "Runtime B0 localizado. La Matriz Base 40 permanece pendiente hasta seleccionar una actividad primaria con alcance técnico completo."
                  : baseViewResolved?.message ?? catalogBaseFallback.message ?? ""
              }
            />
          ) : null}

          <div className={styles.runtimeMatrixFilters}>
            <label>
              Filtro
              <select
                value={baseFilter}
                onChange={(event) => setBaseFilter(event.target.value)}
                data-testid="base-matrix-filter"
              >
                <option value="all">Todos</option>
                <option value="block-B0">Bloque B0</option>
                <option value="block-B0.5">Bloque B0.5</option>
                <option value="block-B1">Bloque B1</option>
                <option value="block-B2">Bloque B2</option>
                <option value="block-B3">Bloque B3</option>
                <option value="block-B4">Bloque B4</option>
                <option value="block-B5">Bloque B5</option>
                <option value="block-B6">Bloque B6</option>
                <option value="block-B7">Bloque B7</option>
                <option value="unavailable">No disponible</option>
                <option value="unevaluated">No evaluada</option>
                {hasBaseRun ? (
                  <>
                    <option value="closed">Cierre autorizado</option>
                    <option value="flag">Con flag</option>
                    <option value="blocked">Bloqueados</option>
                    <option value="missing-evidence">Evidencia faltante</option>
                    <option value="reentry">Reentry</option>
                    <option value="review">Revisión manual</option>
                    <option value="missing-route">Ruta canónica faltante</option>
                    <option value="violation">Violación skipped_silently</option>
                  </>
                ) : null}
              </select>
            </label>
            <label>
              Buscar ID
              <input
                value={baseQuery}
                onChange={(event) => setBaseQuery(event.target.value)}
                placeholder="B0-Q01"
                data-testid="base-matrix-search"
              />
            </label>
          </div>

          {baseLoading ? (
            <p className={styles.workspaceEmptyMessage} role="status">
              Cargando matriz Base…
            </p>
          ) : null}
          {baseError ? (
            <p className={styles.workspaceEmptyMessage} role="alert">
              No fue posible cargar la matriz Runtime.
            </p>
          ) : null}

          {baseViewResolved ? (
            <>
              {baseViewResolved.message && hasBaseRun ? (
                <p className={styles.workspaceEmptyMessage} role="status">
                  {baseViewResolved.message}
                </p>
              ) : null}
              <BaseResolutionMatrix
                rows={filteredBase}
                selectedId={selectedBaseId}
                onSelect={setSelectedBaseId}
                noRun={!hasBaseRun}
                control={controlViewResolved}
              />
              <RuntimeEvidenceDrawer
                title={selectedBase ? `Base ${selectedBase.displayId}` : null}
                onClose={() => setSelectedBaseId(null)}
              >
                {selectedBase ? (
                  <BaseRowDetail row={selectedBase} noRun={!hasBaseRun} />
                ) : null}
              </RuntimeEvidenceDrawer>
            </>
          ) : null}
        </>
      ) : (
        <>
          {!hasCausalRun ? (
            <MatrixNoRunBanner
              testId="causal-matrix-no-run-banner"
              title={RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_TITLE}
              body={
                runtimeContextAvailable
                  ? "Runtime B0 localizado. La Matriz Causal 20 permanece pendiente hasta que la ejecución avance a evaluación causal."
                  : causalViewResolved?.message ?? catalogCausalFallback.message ?? ""
              }
            />
          ) : null}

          <div className={styles.runtimeMatrixFilters}>
            <label>
              Filtro
              <select
                value={causalFilter}
                onChange={(event) => setCausalFilter(event.target.value)}
                data-testid="causal-matrix-filter"
              >
                <option value="all">Todos</option>
                <option value="P0">Prioridad P0</option>
                <option value="P1">Prioridad P1</option>
                <option value="P2">Prioridad P2</option>
                <option value="P3">Prioridad P3</option>
                <option value="activated">Activada</option>
                <option value="not-triggered-with-evidence">
                  No activada con evidencia
                </option>
                <option value="unknown">Activación desconocida</option>
                <option value="blocks-readiness-rule">
                  Bloquea ready (regla)
                </option>
                <option value="reentry">Reentry</option>
                <option value="review">Revisión manual</option>
                <option value="route_missing">Ruta faltante</option>
                <option value="contradiction">Contradicción</option>
                <option value="unevaluated">No evaluada</option>
                <option value="unavailable">No disponible</option>
              </select>
            </label>
            <label>
              Buscar ID
              <input
                value={causalQuery}
                onChange={(event) => setCausalQuery(event.target.value)}
                placeholder="C05"
                data-testid="causal-matrix-search"
              />
            </label>
          </div>

          {causalLoading ? (
            <p className={styles.workspaceEmptyMessage} role="status">
              Cargando matriz Causal…
            </p>
          ) : null}
          {causalError ? (
            <p className={styles.workspaceEmptyMessage} role="alert">
              No fue posible cargar la matriz Runtime.
            </p>
          ) : null}

          {causalViewResolved ? (
            <>
              {causalViewResolved.message && hasCausalRun ? (
                <p className={styles.workspaceEmptyMessage} role="status">
                  {causalViewResolved.message}
                </p>
              ) : null}
              <CausalClosureMatrix
                rows={filteredCausal}
                selectedId={selectedCausalId}
                onSelect={setSelectedCausalId}
                noRun={!hasCausalRun}
                control={controlViewResolved}
              />
              <RuntimeEvidenceDrawer
                title={
                  selectedCausal ? `Causal ${selectedCausal.id}` : null
                }
                onClose={() => setSelectedCausalId(null)}
              >
                {selectedCausal ? (
                  <CausalRowDetail
                    row={selectedCausal}
                    context={causalViewResolved.context}
                    noRun={!hasCausalRun}
                  />
                ) : null}
              </RuntimeEvidenceDrawer>
            </>
          ) : null}
        </>
      )}

      <RuntimeAdvanceFooter control={controlViewResolved} />
    </section>
  );
}

function RuntimeAdvanceFooter(props: { control: RuntimeControlStateView }) {
  const label = presentRuntimeAdvanceLabel(props.control.readiness.state);
  return (
    <footer
      className={styles.runtimeAdvanceFooter}
      data-testid="runtime-advance-footer"
      data-advance={props.control.readiness.state}
      data-status={props.control.dataStatus}
      role="status"
    >
      <p className={styles.runtimeAdvanceFooterTitle}>Estado de avance</p>
      <p className={styles.runtimeAdvanceFooterValue}>{label}</p>
      {props.control.readiness.message ? (
        <p className={styles.runtimeAdvanceFooterMessage}>
          {props.control.readiness.message}
        </p>
      ) : null}
    </footer>
  );
}

function ControlRowBadges(props: {
  interactionId: string;
  control: RuntimeControlStateView;
  kind: "base" | "causal";
}) {
  const badges: string[] = [];
  const id = props.interactionId;

  if (
    props.control.gaps.some(
      (g) =>
        g.operationalStatus === "active" &&
        (g.sourceInteractionId === id || g.gapCode === id),
    )
  ) {
    badges.push("Brecha");
  }
  if (
    props.control.timers.some(
      (t) =>
        (t.operationalStatus === "overdue" ||
          t.operationalStatus === "upcoming" ||
          t.operationalStatus === "active") &&
        t.sourceInteractionId === id,
    )
  ) {
    badges.push("Timer");
  }
  if (
    props.control.reentries.some(
      (r) => !r.resolvedAt && (r.sourceInteractionId === id || r.targetBlock === id),
    )
  ) {
    badges.push("Reentry");
  }
  if (
    props.control.manualReviews.some(
      (r) => !r.resolvedAt && r.sourceInteractionId === id,
    )
  ) {
    badges.push("Revisión");
  }
  if (props.kind === "base" && props.control.blockingBaseIds.includes(id)) {
    badges.push("Bloqueo Base");
  }
  if (props.kind === "causal" && props.control.blockingCausalIds.includes(id)) {
    badges.push("Bloqueo Causal");
  }
  if (props.kind === "causal" && props.control.readiness.state === "blocked") {
    if (["C05", "C09", "C11", "C20"].includes(id)) {
      badges.push("Readiness");
    }
  }

  if (badges.length === 0) return null;
  return (
    <ul className={styles.runtimeControlBadges} aria-label="Señales de control">
      {badges.map((badge) => (
        <li key={badge} data-badge={badge}>
          {badge}
        </li>
      ))}
    </ul>
  );
}

function MatrixNoRunBanner(props: {
  testId: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className={styles.workspaceEmptyMessage}
      role="status"
      data-testid={props.testId}
    >
      <strong>{props.title}</strong>
      <p>{props.body}</p>
    </div>
  );
}

function BaseResolutionMatrix(props: {
  rows: BaseMatrixRowVM[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  noRun: boolean;
  control: RuntimeControlStateView;
}) {
  return (
    <div
      className={styles.runtimeMatrixScroll}
      data-testid="base-resolution-matrix"
    >
      <table className={styles.runtimeMatrixTable}>
        <thead>
          <tr>
            {BASE_COLUMNS.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr
              key={row.id}
              data-row-id={row.id}
              data-block={blockKeyFromId(row.id)}
              data-resolution={row.factualResolutionState ?? "none"}
              data-blocking={row.factualBlockingState}
              className={
                props.selectedId === row.id
                  ? styles.runtimeMatrixRowSelected
                  : undefined
              }
            >
              <td>
                <button
                  type="button"
                  className={styles.runtimeMatrixRowSelect}
                  onClick={() => props.onSelect(row.id)}
                >
                  {row.displayId}
                </button>
                <ControlRowBadges
                  interactionId={row.id}
                  control={props.control}
                  kind="base"
                />
              </td>
              <td>{row.sourceNodes.join(", ") || ABSENT}</td>
              <td>{row.selectedQuestionNode ?? ABSENT}</td>
              <td>{row.selectionReasonLabel ?? ABSENT}</td>
              <td>
                <DualCell
                  rule={row.mandatoryClosureRule}
                  factLabel="Resultado"
                  fact={presentFactualResolutionLabel(
                    row.factualResolutionState,
                    row.dataStatus,
                  )}
                  emptyFallback={props.noRun ? ABSENT : UNEVALUATED}
                />
              </td>
              <td>
                <DualCell
                  rule={row.blockingRule}
                  rulePrefix="Regla si falla"
                  factLabel="Situación"
                  fact={presentFactualBlockingLabel(row.factualBlockingState)}
                  emptyFallback={props.noRun ? ABSENT : UNEVALUATED}
                />
              </td>
              <td>{row.reviewActionLabel ?? ABSENT}</td>
              <td>{row.functionLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.runtimeMatrixCount} role="status">
        Filas visibles: {props.rows.length} (catálogo Base 40)
      </p>
    </div>
  );
}

function CausalClosureMatrix(props: {
  rows: CausalMatrixRowVM[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  noRun: boolean;
  control: RuntimeControlStateView;
}) {
  return (
    <div
      className={styles.runtimeMatrixScroll}
      data-testid="causal-closure-matrix"
    >
      <table className={styles.runtimeMatrixTable}>
        <thead>
          <tr>
            {CAUSAL_COLUMNS.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr
              key={row.id}
              data-row-id={row.id}
              data-priority={row.priority}
              data-activation={row.factualActivationState}
              data-closure={row.factualClosureState ?? "none"}
              data-blocking={row.factualBlockingState}
              className={
                props.selectedId === row.id
                  ? styles.runtimeMatrixRowSelected
                  : undefined
              }
            >
              <td>
                <button
                  type="button"
                  className={styles.runtimeMatrixRowSelect}
                  onClick={() => props.onSelect(row.id)}
                >
                  {row.id}
                </button>
                <ControlRowBadges
                  interactionId={row.id}
                  control={props.control}
                  kind="causal"
                />
              </td>
              <td>{row.priorityClassKey}</td>
              <td>
                <DualCell
                  rule={row.documentaryActivationRule}
                  rulePrefix="Regla"
                  factLabel="Evaluación"
                  fact={presentFactualActivationLabel(row.factualActivationState)}
                  emptyFallback={props.noRun ? ABSENT : UNEVALUATED}
                />
              </td>
              <td>
                {row.selectionReasonStatus === "conflict" ? (
                  <div className={styles.runtimeMatrixDualCell}>
                    <span className={styles.runtimeMatrixDualFact}>
                      {ABSENT}
                    </span>
                    <span className={styles.runtimeMatrixDualRule}>
                      Existen decisiones de apertura contradictorias
                    </span>
                  </div>
                ) : (
                  (row.selectionReasonLabel ?? ABSENT)
                )}
              </td>
              <td>
                <DualCell
                  rule={row.mandatoryClosureRule}
                  factLabel="Resultado"
                  fact={presentCausalClosureLabel(
                    row.factualClosureState,
                    row.dataStatus,
                  )}
                  emptyFallback={props.noRun ? ABSENT : UNEVALUATED}
                  extra={
                    row.closureValidation.complete != null &&
                    row.closureValidation.requiredCount != null &&
                    row.closureValidation.requiredCount > 0
                      ? `Variables obligatorias: ${row.closureValidation.resolvedCount ?? 0} de ${row.closureValidation.requiredCount}`
                      : null
                  }
                />
              </td>
              <td>
                <DualCell
                  rule={row.blockingRule}
                  rulePrefix="Regla si falla"
                  factLabel="Situación"
                  fact={presentFactualBlockingLabel(row.factualBlockingState)}
                  emptyFallback={props.noRun ? ABSENT : UNEVALUATED}
                  title={row.blockingTechnicalCode ?? undefined}
                />
              </td>
              <td>
                <DualCell
                  rule={row.blocksFullReadinessRule ? "Sí" : "No"}
                  rulePrefix="Regla"
                  factLabel="Impacto actual"
                  fact={presentReadinessImpactLabel({
                    rule: row.blocksFullReadinessRule,
                    factually: row.blocksFullReadinessFactually,
                    noRun: props.noRun,
                  })}
                  emptyFallback={props.noRun ? "No evaluable" : UNEVALUATED}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.runtimeMatrixCount} role="status">
        Filas visibles: {props.rows.length} (catálogo Causal 20)
      </p>
    </div>
  );
}

function DualCell(props: {
  rule: string | null;
  fact: string;
  factLabel: string;
  rulePrefix?: string;
  emptyFallback?: string;
  extra?: string | null;
  title?: string;
}) {
  const fallback = props.emptyFallback ?? UNEVALUATED;
  return (
    <div className={styles.runtimeMatrixDualCell} title={props.title}>
      <span className={styles.runtimeMatrixDualRule}>
        {props.rulePrefix ?? "Regla"}: {props.rule?.trim() || ABSENT}
      </span>
      <span className={styles.runtimeMatrixDualFact}>
        {props.factLabel}: {props.fact.trim() || fallback}
      </span>
      {props.extra ? (
        <span className={styles.runtimeMatrixDualRule}>{props.extra}</span>
      ) : null}
    </div>
  );
}

function RuntimeEvidenceDrawer(props: {
  title: string | null;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!props.title) return null;
  return (
    <aside
      className={styles.runtimeEvidenceDrawer}
      data-testid="runtime-evidence-drawer"
      aria-label={props.title}
    >
      <div className={styles.runtimeEvidenceDrawerHeader}>
        <h5>{props.title}</h5>
        <button type="button" onClick={props.onClose}>
          Cerrar
        </button>
      </div>
      {props.children}
    </aside>
  );
}

function BaseRowDetail({
  row,
  noRun,
}: {
  row: BaseMatrixRowVM;
  noRun: boolean;
}) {
  if (noRun) {
    return (
      <dl className={styles.runtimeMatrixDetailList}>
        <div>
          <dt>ID</dt>
          <dd>{row.displayId}</dd>
        </div>
        <div>
          <dt>Nodo fuente</dt>
          <dd>{row.sourceNodes.join(", ") || ABSENT}</dd>
        </div>
        <div>
          <dt>Regla de cierre</dt>
          <dd>{row.mandatoryClosureRule || ABSENT}</dd>
        </div>
        <div>
          <dt>Regla de bloqueo</dt>
          <dd>{row.blockingRule || ABSENT}</dd>
        </div>
        <div>
          <dt>Función</dt>
          <dd>{row.functionLabel}</dd>
        </div>
        <div>
          <dt>Estado factual</dt>
          <dd>{ABSENT}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className={styles.runtimeMatrixDetailList}>
      <div>
        <dt>ID</dt>
        <dd>{row.displayId}</dd>
      </div>
      <div>
        <dt>Nodos fuente (catálogo)</dt>
        <dd>{row.sourceNodes.join(", ") || ABSENT}</dd>
      </div>
      <div>
        <dt>Pregunta base seleccionada</dt>
        <dd>{row.selectedQuestionNode ?? ABSENT}</dd>
      </div>
      <div>
        <dt>Razón de selección</dt>
        <dd>{row.selectionReasonLabel ?? ABSENT}</dd>
      </div>
      <div>
        <dt>Fuente de razón</dt>
        <dd>{presentReasonSource(row.selectionReasonSource)}</dd>
      </div>
      <div>
        <dt>Cierre — regla esperada</dt>
        <dd>{row.mandatoryClosureRule || ABSENT}</dd>
      </div>
      <div>
        <dt>Cierre — resultado factual</dt>
        <dd>
          {presentFactualResolutionLabel(
            row.factualResolutionState,
            row.dataStatus,
          )}
        </dd>
      </div>
      <div>
        <dt>Bloqueo — regla si falla</dt>
        <dd>{row.blockingRule || ABSENT}</dd>
      </div>
      <div>
        <dt>Bloqueo — situación factual</dt>
        <dd>{presentFactualBlockingLabel(row.factualBlockingState)}</dd>
      </div>
      <div>
        <dt>Revisión</dt>
        <dd>{row.reviewActionLabel ?? ABSENT}</dd>
      </div>
      <div>
        <dt>Función</dt>
        <dd>{row.functionLabel}</dd>
      </div>
      <div>
        <dt>Evidencia presente</dt>
        <dd>
          {row.evidencePresent == null
            ? ABSENT
            : row.evidencePresent
              ? "Sí"
              : "No"}
        </dd>
      </div>
    </dl>
  );
}

function CausalRowDetail({
  row,
  context,
  noRun,
}: {
  row: CausalMatrixRowVM;
  context: RuntimeCausalMatrixView["context"];
  noRun: boolean;
}) {
  if (noRun) {
    return (
      <dl className={styles.runtimeMatrixDetailList}>
        <div>
          <dt>ID</dt>
          <dd>{row.id}</dd>
        </div>
        <div>
          <dt>Prioridad/clase</dt>
          <dd>{row.priorityClassKey}</dd>
        </div>
        <div>
          <dt>Regla de activación</dt>
          <dd>{row.documentaryActivationRule || ABSENT}</dd>
        </div>
        <div>
          <dt>Regla de cierre</dt>
          <dd>{row.mandatoryClosureRule || ABSENT}</dd>
        </div>
        <div>
          <dt>Regla de bloqueo</dt>
          <dd>{row.blockingRule || ABSENT}</dd>
        </div>
        <div>
          <dt>Estado factual</dt>
          <dd>{ABSENT}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className={styles.runtimeMatrixDetailList}>
      <div>
        <dt>ID</dt>
        <dd>{row.id}</dd>
      </div>
      <div>
        <dt>Actividad primaria</dt>
        <dd>{context.activityLabel ?? context.activityId ?? ABSENT}</dd>
      </div>
      <div>
        <dt>Run</dt>
        <dd>{context.runId || ABSENT}</dd>
      </div>
      <div>
        <dt>Interacción causal</dt>
        <dd>{row.id}</dd>
      </div>
      <div>
        <dt>Prioridad/clase</dt>
        <dd>{row.priorityClassKey}</dd>
      </div>
      <div>
        <dt>Activación — regla canónica</dt>
        <dd>{row.documentaryActivationRule || ABSENT}</dd>
      </div>
      <div>
        <dt>Activación — evaluación factual</dt>
        <dd>{presentFactualActivationLabel(row.factualActivationState)}</dd>
      </div>
      <div>
        <dt>Cierre — regla canónica</dt>
        <dd>{row.mandatoryClosureRule || ABSENT}</dd>
      </div>
      <div>
        <dt>Razón de selección</dt>
        <dd>
          {row.selectionReasonStatus === "conflict"
            ? `${ABSENT} — Existen decisiones de apertura contradictorias`
            : (row.selectionReasonLabel ?? ABSENT)}
        </dd>
      </div>
      <div>
        <dt>Fuente de razón</dt>
        <dd>{presentReasonSource(row.selectionReasonSource)}</dd>
      </div>
      <div>
        <dt>Cierre — estado factual</dt>
        <dd>
          {presentCausalClosureLabel(row.factualClosureState, row.dataStatus)}
        </dd>
      </div>
      <div>
        <dt>Fuente del cierre</dt>
        <dd>
          {row.closureSource === "explicit-state"
            ? "Estado explícito"
            : row.closureSource === "required-variable-validation"
              ? "Validación completa de variables"
              : ABSENT}
        </dd>
      </div>
      <div>
        <dt>Variables obligatorias</dt>
        <dd>
          {row.closureValidation.complete != null &&
          row.closureValidation.requiredCount != null &&
          row.closureValidation.requiredCount > 0
            ? `${row.closureValidation.resolvedCount ?? 0} de ${row.closureValidation.requiredCount}`
            : ABSENT}
        </dd>
      </div>
      <div>
        <dt>Señal de activación (soporte)</dt>
        <dd>{row.triggerSignalLabel ?? ABSENT}</dd>
      </div>
      <div>
        <dt>Evidencia disponible</dt>
        <dd>
          {row.evidencePresent == null
            ? ABSENT
            : row.evidencePresent
              ? "Sí"
              : "No"}
        </dd>
      </div>
      <div>
        <dt>Flag o bloqueo factual</dt>
        <dd>{presentFactualBlockingLabel(row.factualBlockingState)}</dd>
      </div>
      <div>
        <dt>Bloqueo — etiqueta operativa</dt>
        <dd>{row.blockingRule || ABSENT}</dd>
      </div>
      <div>
        <dt>Bloqueo — código técnico</dt>
        <dd>{row.blockingTechnicalCode || ABSENT}</dd>
      </div>
      <div>
        <dt>Bloquea ready — regla</dt>
        <dd>{row.blocksFullReadinessRule ? "Sí" : "No"}</dd>
      </div>
      <div>
        <dt>Bloquea ready — impacto factual</dt>
        <dd>
          {presentReadinessImpactLabel({
            rule: row.blocksFullReadinessRule,
            factually: row.blocksFullReadinessFactually,
            noRun: false,
          })}
        </dd>
      </div>
    </dl>
  );
}

function presentReasonSource(
  source: BaseMatrixRowVM["selectionReasonSource"],
) {
  switch (source) {
    case "branching-decision":
      return "Decisión del run (branching_decision.reason)";
    default:
      return ABSENT;
  }
}

function filterBaseRows(
  rows: BaseMatrixRowVM[],
  filter: string,
  query: string,
): BaseMatrixRowVM[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (q && !`${row.id} ${row.displayId}`.toLowerCase().includes(q)) {
      return false;
    }
    if (filter.startsWith("block-")) {
      const block = filter.slice("block-".length);
      return blockKeyFromId(row.id) === block;
    }
    switch (filter) {
      case "unavailable":
        return row.dataStatus === "unavailable";
      case "unevaluated":
        return (
          row.dataStatus === "not_evaluated" ||
          (row.factualResolutionState == null &&
            row.dataStatus !== "unavailable")
        );
      case "closed":
        return (
          row.factualResolutionState === "captured_user_evidence" ||
          row.factualResolutionState === "user_confirmed_prefill" ||
          row.factualResolutionState === "canonical_derivation_closed" ||
          row.factualResolutionState === "internal_calculated_closed" ||
          row.factualResolutionState === "not_applicable_with_evidence"
        );
      case "flag":
        return row.factualBlockingState === "flag";
      case "blocked":
        return row.factualBlockingState === "blocked";
      case "missing-evidence":
        return row.factualResolutionState === "blocked_by_missing_evidence";
      case "missing-route":
        return (
          row.factualResolutionState === "blocked_by_missing_canonical_route"
        );
      case "reentry":
        return row.factualResolutionState === "reentry_required";
      case "review":
        return row.factualResolutionState === "manual_review_required";
      case "violation":
        return row.resolutionViolation;
      default:
        return true;
    }
  });
}

function filterCausalRows(
  rows: CausalMatrixRowVM[],
  filter: string,
  query: string,
): CausalMatrixRowVM[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (
      q &&
      !`${row.id} ${row.priorityClassKey}`.toLowerCase().includes(q)
    ) {
      return false;
    }
    switch (filter) {
      case "P0":
      case "P1":
      case "P2":
      case "P3":
        return row.priority === filter;
      case "activated":
        return row.factualActivationState === "triggered";
      case "not-triggered-with-evidence":
        return row.factualActivationState === "not-triggered-with-evidence";
      case "unknown":
        return row.factualActivationState === "unknown";
      case "blocks-readiness-rule":
        return row.blocksFullReadinessRule;
      case "reentry":
        return row.factualClosureState === "reentry_required";
      case "review":
        return row.factualClosureState === "manual_review_required";
      case "route_missing":
        return row.factualClosureState === "route_missing";
      case "contradiction":
        return row.factualClosureState === "contradiction_flag";
      case "unavailable":
        return row.dataStatus === "unavailable";
      case "unevaluated":
        return (
          row.dataStatus === "not_evaluated" ||
          row.factualActivationState === "not_evaluated" ||
          (row.factualClosureState == null && row.dataStatus !== "unavailable")
        );
      default:
        return true;
    }
  });
}
