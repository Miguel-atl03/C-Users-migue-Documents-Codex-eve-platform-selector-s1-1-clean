"use client";

import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  ControlPanelSelectedContext,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { RuntimeHierarchyFilterPanel } from "./RuntimeHierarchyFilterPanel";
import { RuntimeSelectedRunPanel } from "./RuntimeSelectedRunPanel";
import styles from "./ccp.module.css";

export function RuntimeOperationalView({
  state,
  selectedRunContext,
  onSelect,
  onOpenEvidence,
}: {
  state: ConsultantControlPanelState;
  selectedRunContext: ControlPanelSelectedContext;
  onSelect: (next: Partial<ControlPanelFilterScope>) => void;
  onOpenEvidence: (payload: { title: string; body: string }) => void;
}) {
  const hasSelectedRun = Boolean(
    selectedRunContext.runId ?? state.meta.effective_scope.run_id,
  );

  return (
    <div
      className={styles.runtimeOperationalView}
      data-testid="ccp-runtime-operational-view"
      data-scope="selected_activity"
      data-aggregate="false"
    >
      <div className={styles.workspaceIntro}>
        <h2 className={styles.workspaceHeading}>Runtime 40+20</h2>
        <p className={styles.muted}>
          Seguimiento por empresa, usuario epistémico, función epistémica de trabajo,
          actividad primaria y run.
        </p>
      </div>

      <RuntimeHierarchyFilterPanel state={state} onSelect={onSelect} />

      {hasSelectedRun ? (
        <RuntimeSelectedRunPanel
          state={state}
          selectedRunContext={selectedRunContext}
          onOpenEvidence={onOpenEvidence}
        />
      ) : (
        <aside
          className={styles.runtimeSelectedPanel}
          data-testid="ccp-runtime-selected-run-panel"
          data-empty="true"
        >
          <div className={styles.panelHead}>
            <div>
              <h3 className={styles.panelTitle}>Detalle del run</h3>
              <p className={styles.muted}>
                Selecciona una actividad primaria en el alcance operativo para cargar el
                contexto del run y las preguntas base / causales.
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
