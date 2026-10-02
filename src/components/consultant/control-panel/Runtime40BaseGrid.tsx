"use client";

// Stable export surface for Runtime 40/20 grids (CCP read-only).
import {
  BASE40_FULL_RESOLUTION_STATES,
} from "@/services/eve/runtime-40-20/operational-rules/base40-operational-rule";
import {
  CAUSAL20_CLOSED_STATES,
} from "@/services/eve/runtime-40-20/operational-rules/causal20-operational-rule";
import type {
  BaseResolutionStateById,
  CausalClosureStateById,
  ConsultantControlPanelState,
  ControlPanelSelectedContext,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

function blockFromBaseId(baseId: string): string {
  const match = baseId.match(/^(B\d+)/i);
  return match?.[1]?.toUpperCase() ?? "—";
}

function gateFromBlock(block: string): string {
  if (block === "B4") return "PST";
  if (["B0", "B2", "B3", "B7"].includes(block)) return block;
  return block || "—";
}

function baseEvidenceLabel(record: BaseResolutionStateById): string {
  const state = record.state.toLowerCase();
  if (state.includes("captured")) return "capturado";
  if (state.includes("confirmed") || state.includes("prefill")) return "confirmado";
  if (state.includes("derivation") || state.includes("calculated")) return "derivado";
  if (state.includes("not_applicable")) return "n/a con evidencia";
  if (record.provenance || record.mmabp_or_readiness_output) return "sí";
  if (state.includes("blocked")) return "parcial";
  return "—";
}

/** Display-only target for valid closure; does not mutate BFF payloads. */
function baseTargetState(record: BaseResolutionStateById): string {
  if (BASE40_FULL_RESOLUTION_STATES.has(record.state as never)) {
    return record.state;
  }
  if (record.mmabp_or_readiness_output) return "internal_calculated_closed";
  if (record.canonical_variable && record.provenance) {
    return "canonical_derivation_closed";
  }
  return "captured_user_evidence";
}

function causalGate(causalId: string): string {
  const id = causalId.toUpperCase();
  if (id.includes("C09") || id.includes("C11")) return id.includes("C11") ? "PST" : "B3";
  if (["C05", "C06", "C07", "C08"].some((code) => id.includes(code))) return "B2";
  if (["C17", "C18", "C19", "C20"].some((code) => id.includes(code))) return "B7";
  if (["C01", "C02", "C03", "C04"].some((code) => id.includes(code))) return "B0";
  return "—";
}

function causalClassification(causalId: string, activation: string): string {
  const id = causalId.toUpperCase();
  if (id.includes("C11")) return "Process State/Timer Gate";
  if (["C05", "C09", "C20"].some((code) => id.includes(code))) {
    return `Ruta crítica CR-${causalGate(causalId)}`;
  }
  return activation;
}

/** Display-only target for valid causal closure; does not mutate BFF payloads. */
function causalTargetState(record: CausalClosureStateById): string {
  if (CAUSAL20_CLOSED_STATES.has(record.activation_state as never)) {
    return record.activation_state;
  }
  const state = record.activation_state.toLowerCase();
  if (state.includes("not_triggered") || state.includes("activation_unknown")) {
    return "not_triggered_with_evidence";
  }
  return "answered_closed";
}

export function Runtime40BaseGrid({
  state,
  selectedRunContext,
  onOpenDetail,
  embedInSelectedPanel = false,
}: {
  state: ConsultantControlPanelState;
  selectedRunContext: ControlPanelSelectedContext;
  onOpenDetail?: (payload: { title: string; body: string }) => void;
  /** When true, omit outer panel chrome (parent RuntimeSelectedRunPanel owns context). */
  embedInSelectedPanel?: boolean;
}) {
  const baseItems = state.base_items;
  const runId = selectedRunContext.runId ?? state.meta.effective_scope.run_id;
  const hasExactForty = Array.isArray(baseItems) && baseItems.length === 40;
  const integrityError =
    Array.isArray(baseItems) && baseItems.length !== 40
      ? `Error de integridad: se esperaban 40 BaseResolutionStatus para el run ${runId ?? "seleccionado"}, hay ${baseItems.length}. No se renderiza parcial.`
      : !Array.isArray(baseItems)
        ? "Seleccione un activity_runtime_run para ver las 40 bases del run."
        : null;

  const body = (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>
            {embedInSelectedPanel ? "Preguntas base" : "Runtime 40 Base Grid"}
          </h2>
          <p className={styles.muted}>
            40 estados de resolución por activity_runtime_run seleccionado. No
            skipped_silently. No agregado por usuario ni caso.
          </p>
        </div>
      </div>
      {integrityError ? (
        <p className={styles.alertError} data-testid="ccp-base-integrity-error">
          {integrityError}
        </p>
      ) : null}
      {hasExactForty && baseItems ? (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Base ID</th>
                <th>Bloque</th>
                <th>Estado actual</th>
                <th>Estado objetivo</th>
                <th>Evidencia</th>
                <th>Variable</th>
                <th>Gate / Regla de avance</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {baseItems.map((record) => {
                const block = blockFromBaseId(record.base_id);
                const gate = gateFromBlock(block);
                const evidence = baseEvidenceLabel(record);
                const target = baseTargetState(record);
                return (
                  <tr key={record.base_id}>
                    <td>
                      <code>{record.base_id}</code>
                    </td>
                    <td>{block}</td>
                    <td>
                      <span className={styles.pillNeutral}>{record.state}</span>
                    </td>
                    <td>
                      <span className={styles.pillNeutral}>{target}</span>
                    </td>
                    <td>{evidence}</td>
                    <td>{record.canonical_variable ?? "—"}</td>
                    <td>{gate}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() =>
                          onOpenDetail?.({
                            title: record.base_id,
                            body: [
                              `Estado actual: ${record.state}`,
                              `Estado objetivo: ${target}`,
                              `Bloque: ${block}`,
                              `Gate / Regla de avance: ${gate}`,
                              `Variable: ${record.canonical_variable ?? "sin variable"}`,
                              `Evidencia: ${evidence}`,
                              `Provenance: ${record.provenance ?? "sin provenance"}`,
                              `run: ${runId}`,
                            ].join(" · "),
                          })
                        }
                      >
                        Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );

  if (embedInSelectedPanel) {
    return (
      <div data-testid="ccp-runtime-40-base-grid" data-selected-run-context={runId ?? ""}>
        {body}
      </div>
    );
  }

  return (
    <section className={styles.panel} data-testid="ccp-runtime-40-base-grid">
      {body}
    </section>
  );
}

export function Runtime20CausalGrid({
  state,
  selectedRunContext,
  onOpenDetail,
  allowDetail = true,
  embedInSelectedPanel = false,
}: {
  state: ConsultantControlPanelState;
  selectedRunContext: ControlPanelSelectedContext;
  onOpenDetail?: (payload: { title: string; body: string }) => void;
  /** Aggregate views must not open causal detail as a single-activity run. */
  allowDetail?: boolean;
  embedInSelectedPanel?: boolean;
}) {
  const causalItems = state.causal_items;
  const runId = selectedRunContext.runId ?? state.meta.effective_scope.run_id;
  const hasExactTwenty = Array.isArray(causalItems) && causalItems.length === 20;
  const integrityError =
    Array.isArray(causalItems) && causalItems.length !== 20
      ? `Error de integridad: se esperaban 20 CausalClosureStatus para el run ${runId ?? "seleccionado"}, hay ${causalItems.length}. No se renderiza parcial.`
      : !Array.isArray(causalItems)
        ? "Seleccione un activity_runtime_run para ver las 20 causales del run."
        : null;

  const body = (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>
            {embedInSelectedPanel ? "Preguntas causales" : "Runtime 20 Causal Grid"}
          </h2>
          <p className={styles.muted}>
            20 causales evaluadas por activity_runtime_run seleccionado. No asumir
            not_triggered sin evidencia.
          </p>
        </div>
      </div>
      {selectedRunContext.runId ? (
        <p className={styles.panelCopy}>
          Contexto BFF · Run <strong>{selectedRunContext.runId}</strong>
          {selectedRunContext.activityTitle
            ? ` · ${selectedRunContext.activityTitle}`
            : null}
          {selectedRunContext.pmProcessCode
            ? ` · PM ${selectedRunContext.pmProcessCode}`
            : null}
        </p>
      ) : null}
      {integrityError ? (
        <p className={styles.alertError} data-testid="ccp-causal-integrity-error">
          {integrityError}
        </p>
      ) : null}
      {hasExactTwenty && causalItems ? (
        <div className={styles.tableWrap}>
          <table className={styles.tableDense}>
            <thead>
              <tr>
                <th>Causal ID</th>
                <th>Clasificación</th>
                <th>Estado</th>
                <th>Estado objetivo</th>
                <th>Prioridad</th>
                <th>Gate</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {causalItems.map((record) => {
                const gate = causalGate(record.causal_id);
                const classification = causalClassification(
                  record.causal_id,
                  record.activation_state,
                );
                const target = causalTargetState(record);
                const actionLabel = record.activation_state.includes("unknown")
                  ? "Reentry"
                  : record.activation_state.includes("triggered")
                    ? "Resolver"
                    : "Ver";
                return (
                  <tr key={record.causal_id}>
                    <td>
                      <code>{record.causal_id}</code>
                    </td>
                    <td>{classification}</td>
                    <td>
                      <span className={styles.pillNeutral}>{record.activation_state}</span>
                    </td>
                    <td>
                      <span className={styles.pillNeutral}>{target}</span>
                    </td>
                    <td>{record.priority ?? "—"}</td>
                    <td>{gate}</td>
                    <td>
                      {allowDetail ? (
                        <button
                          type="button"
                          className={styles.btnGhost}
                          onClick={() =>
                            onOpenDetail?.({
                              title: record.causal_id,
                              body: `${classification} · ${record.activation_state} · objetivo ${target} · prioridad ${record.priority ?? "n/a"} · gate ${gate} · ${record.condition_evidence ?? "sin evidencia"} · run ${runId}`,
                            })
                          }
                        >
                          {actionLabel}
                        </button>
                      ) : (
                        <span className={styles.muted}>Requiere run único</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );

  if (embedInSelectedPanel) {
    return (
      <div data-testid="ccp-runtime-20-causal-grid" data-selected-run-context={runId ?? ""}>
        {body}
      </div>
    );
  }

  return (
    <section className={styles.panel} data-testid="ccp-runtime-20-causal-grid">
      {body}
    </section>
  );
}
